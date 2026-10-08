import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// ---------------------------------------------------------------------------
// Groq-only AI layer (Gemini removed).
//
// NOTE: Groq retired `llama-3.3-70b-versatile` on 16 Aug 2026, which is why
// you were getting 404 "model_not_found". The defaults below use Groq's
// recommended replacements. Set GROQ_MODEL in .env to force a specific model
// (and delete any old GROQ_MODEL=llama-3.3-70b-versatile line from your .env).
// ---------------------------------------------------------------------------
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Tried in order. If a model returns 404 / decommissioned, the next is used.
const DEFAULT_GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-20b",
];

// Vision-capable Groq models used to read prescription photos (tried in order).
// Override with GROQ_VISION_MODEL in .env.
// (Llama 4 Scout was retired by Groq on 17 Jul 2026; Qwen is the documented vision model now.)
const DEFAULT_GROQ_VISION_MODELS = [
  "qwen/qwen3.8-27b",
  "qwen/qwen3.6-27b",
];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  const groqApiKey = process.env.GROQ_API_KEY;
  const aiConfigured = !!groqApiKey;

  // GROQ_MODEL (optional) goes first, then the defaults (deduplicated).
  const groqModels = Array.from(
    new Set([process.env.GROQ_MODEL?.trim(), ...DEFAULT_GROQ_MODELS].filter(Boolean) as string[])
  );

  // Remember which model worked last so we don't re-probe dead ones each call.
  let activeModelIndex = 0;

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // One request to Groq for one specific model.
  async function groqRequest(model: string, prompt: string, json: boolean): Promise<string> {
    const body: Record<string, any> = {
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_completion_tokens: 4096,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    };
    // gpt-oss models are reasoning models; keep reasoning short for speed.
    if (model.includes("gpt-oss")) body.reasoning_effort = "low";

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      const err: any = new Error(`Groq API error (${res.status}) [${model}]: ${errBody}`);
      err.status = res.status;
      err.body = errBody;
      throw err;
    }

    const data: any = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error(`Groq returned an empty response [${model}]`);
    return text;
  }

  const isModelGone = (err: any) =>
    err?.status === 404 ||
    /model_not_found|model_decommissioned|does not exist|decommissioned/i.test(err?.body || err?.message || "");

  /**
   * Single AI entry point used by every route.
   * - Retries transient 429/503 with a short backoff on the same model.
   * - If a model is retired/unavailable (404), moves on to the next model.
   * - If the model rejects JSON mode (400), retries once without it.
   */
  async function callAI(prompt: string, json: boolean): Promise<{ text: string; provider: "groq" }> {
    if (!groqApiKey) throw new Error("GROQ_API_KEY is not set");

    let lastErr: any = null;

    for (let i = activeModelIndex; i < groqModels.length; i++) {
      const model = groqModels[i];
      let useJson = json;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const text = await groqRequest(model, prompt, useJson);
          activeModelIndex = i;
          return { text, provider: "groq" };
        } catch (err: any) {
          lastErr = err;

          if (isModelGone(err)) {
            console.warn(`Groq model "${model}" unavailable (${err.status}), trying next model...`);
            break; // go to next model
          }

          // Model doesn't support JSON mode -> retry same model without it
          if (err.status === 400 && useJson && /response_format|json/i.test(err.body || "")) {
            console.warn(`Groq model "${model}" rejected JSON mode, retrying without it...`);
            useJson = false;
            continue;
          }

          if (err.status === 429 || err.status === 503 || err.status === 500) {
            const delayMs = 800 * Math.pow(2, attempt); // 0.8s, 1.6s, 3.2s
            console.warn(`Groq ${err.status} on "${model}", retrying in ${delayMs}ms (attempt ${attempt + 1}/3)...`);
            await sleep(delayMs);
            continue;
          }

          throw err; // auth errors, bad request, etc. — don't keep retrying
        }
      }
    }

    throw lastErr || new Error("All Groq models failed");
  }

  // Pulls a JSON object out of a model reply even if it's wrapped in
  // ```json fences or has stray text before/after it.
  function parseJsonLoose(text: string): any {
    const cleaned = text
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/```json|```/gi, "")
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start !== -1 && end > start) {
        return JSON.parse(cleaned.slice(start, end + 1));
      }
      throw new Error("AI response was not valid JSON");
    }
  }

  const asArray = (v: any) => (Array.isArray(v) ? v : []);
  const pick = <T extends string>(v: any, allowed: readonly T[], fallback: T): T =>
    allowed.includes(v) ? v : fallback;

  // Makes sure the AI result always matches the shape the UI expects, so a
  // missing/misspelled field from the model can never crash the page.
  function normalizeValidation(parsed: any) {
    const overallStatus = pick(parsed?.overallStatus, ["valid", "needs_review", "critical_warning"] as const, "needs_review");

    return {
      overallStatus,
      drugInteractions: asArray(parsed?.drugInteractions).map((d: any) => ({
        severity: pick(d?.severity, ["critical", "high", "moderate", "low"] as const, "moderate"),
        drugs: asArray(d?.drugs).map(String),
        issue: String(d?.issue ?? ""),
        mechanism: String(d?.mechanism ?? ""),
        recommendation: String(d?.recommendation ?? ""),
      })),
      duplicateTherapies: asArray(parsed?.duplicateTherapies).map((d: any) => ({
        severity: pick(d?.severity, ["high", "moderate"] as const, "moderate"),
        drugs: asArray(d?.drugs).map(String),
        therapeuticClass: String(d?.therapeuticClass ?? ""),
        recommendation: String(d?.recommendation ?? ""),
      })),
      dosageChecks: asArray(parsed?.dosageChecks).map((d: any) => ({
        medicine: String(d?.medicine ?? ""),
        prescribedDose: String(d?.prescribedDose ?? ""),
        standardDose: String(d?.standardDose ?? ""),
        status: pick(d?.status, ["normal", "high", "low", "frequency_warning"] as const, "normal"),
        recommendation: String(d?.recommendation ?? ""),
      })),
      allergyWarnings: asArray(parsed?.allergyWarnings).map((d: any) => ({
        medicine: String(d?.medicine ?? ""),
        allergy: String(d?.allergy ?? ""),
        severity: pick(d?.severity, ["critical", "warning"] as const, "warning"),
        recommendation: String(d?.recommendation ?? ""),
      })),
      genericAlternatives: asArray(parsed?.genericAlternatives).map((d: any) => ({
        prescribed: String(d?.prescribed ?? ""),
        genericAlternative: String(d?.genericAlternative ?? ""),
        activeMolecule: String(d?.activeMolecule ?? ""),
        savingsPercent: Number(d?.savingsPercent) || 0,
        availability: pick(d?.availability, ["In Stock", "Low Stock", "Order Needed"] as const, "Order Needed"),
        inventoryStock: Number(d?.inventoryStock) || 0,
      })),
      pharmacistAdvice: String(parsed?.pharmacistAdvice ?? "Pharmacist review recommended before dispensing."),
    };
  }

  // -------------------------------------------------------------------------
  // Vision (prescription image -> structured fields). The image is only ever
  // held in memory for the duration of the request; nothing is written to disk.
  // -------------------------------------------------------------------------
  const visionModels = Array.from(
    new Set(
      [process.env.GROQ_VISION_MODEL?.trim(), ...DEFAULT_GROQ_VISION_MODELS].filter(Boolean) as string[]
    )
  );
  let activeVisionIndex = 0;

  async function groqVisionRequest(
    model: string,
    imageDataUrl: string,
    prompt: string,
    json: boolean,
    hideReasoning: boolean
  ): Promise<string> {
    const body: Record<string, any> = {
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      temperature: 0.1,
      max_completion_tokens: 4096,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      // Qwen models can "think" first; keep that out of the reply we parse.
      ...(hideReasoning && model.startsWith("qwen/") ? { reasoning_format: "hidden" } : {}),
    };

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqApiKey}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      const err: any = new Error(`Groq vision error (${res.status}) [${model}]: ${errBody}`);
      err.status = res.status;
      err.body = errBody;
      throw err;
    }
    const data: any = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error(`Groq returned an empty vision response [${model}]`);
    return text;
  }

  async function callVision(imageDataUrl: string, prompt: string): Promise<string> {
    if (!groqApiKey) throw new Error("GROQ_API_KEY is not set");
    let lastErr: any = null;

    for (let i = activeVisionIndex; i < visionModels.length; i++) {
      const model = visionModels[i];
      let useJson = true;
      let hideReasoning = true;

      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const text = await groqVisionRequest(model, imageDataUrl, prompt, useJson, hideReasoning);
          activeVisionIndex = i;
          return text;
        } catch (err: any) {
          lastErr = err;
          if (isModelGone(err)) {
            console.warn(`Groq vision model "${model}" unavailable (${err.status}), trying next...`);
            break;
          }
          if (err.status === 400 && hideReasoning && /reasoning/i.test(err.body || "")) {
            hideReasoning = false;
            continue;
          }
          if (err.status === 400 && useJson && /response_format|json/i.test(err.body || "")) {
            useJson = false;
            continue;
          }
          if (err.status === 429 || err.status === 503 || err.status === 500) {
            await sleep(800 * Math.pow(2, attempt));
            continue;
          }
          throw err;
        }
      }
    }
    throw lastErr || new Error("All Groq vision models failed");
  }

  const str = (v: any) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());

  // Guarantees the extracted data always matches the shape the form expects.
  function normalizeExtraction(parsed: any) {
    const gender = str(parsed?.patientGender).toLowerCase();
    const age = Math.round(Number(parsed?.patientAge));
    return {
      isPrescription: parsed?.isPrescription !== false,
      patientName: str(parsed?.patientName),
      patientAge: Number.isFinite(age) && age > 0 && age < 130 ? age : null,
      patientGender: gender.startsWith("m") ? "Male" : gender.startsWith("f") ? "Female" : gender ? "Other" : null,
      allergies: Array.from(new Set(asArray(parsed?.allergies).map(str).filter(Boolean))),
      doctorName: str(parsed?.doctorName),
      doctorRegNo: str(parsed?.doctorRegNo),
      medicines: asArray(parsed?.medicines)
        .map((m: any) => {
          const days = Math.round(Number(m?.durationDays));
          return {
            medicineName: str(m?.medicineName),
            dosage: str(m?.dosage),
            frequency: str(m?.frequency),
            durationDays: Number.isFinite(days) && days > 0 ? days : 0,
            instructions: str(m?.instructions),
          };
        })
        .filter((m: any) => m.medicineName),
      notes: str(parsed?.notes),
    };
  }

  // --- API ROUTES ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", aiConfigured, groqConfigured: !!groqApiKey, models: groqModels, visionModels });
  });

  // AI Assistant endpoint
  app.post("/api/ai/assistant", async (req, res) => {
    try {
      const { question, contextSummary } = req.body;
      if (!question) {
        return res.status(400).json({ error: "Question parameter is required" });
      }

      if (aiConfigured) {
        const prompt = `You are "MediCore AI", an expert clinical pharmacist and smart inventory optimization assistant in a modern pharmacy dashboard.
Current Pharmacy Context:
- Total Medicines in Catalog: ${contextSummary?.totalMedicines ?? 12}
- Low Stock Items: ${contextSummary?.lowStockCount ?? 2}
- Out of Stock Items: ${contextSummary?.outOfStockCount ?? 1}

User Question: "${question}"

Respond clearly, concisely, and professionally from a clinical and supply-chain perspective.
Include:
1. Direct answer / summary
2. Data justification (referencing typical medicine dosages, thresholds, or clinical facts)
3. Actionable recommendation (e.g. reorder, review batch, counsel patient)

Do not give final medical diagnoses without noting that qualified pharmacist review is required. Keep the answer under 150 words.`;

        const { text, provider } = await callAI(prompt, false);
        return res.json({
          text: text || "I have analyzed your inventory and operations query.",
          provider,
          actionButtons: [
            { label: "View Inventory", action: "navigate_inventory" },
            { label: "Check Demand Forecast", action: "navigate_forecast" },
          ],
        });
      }

      // Fallback if no API key is configured
      res.json({
        text: `MediCore AI analysis for: "${question}". System recommends checking live stock thresholds and earliest-expiry batches for optimized dispensing.`,
        actionButtons: [{ label: "View Inventory", action: "navigate_inventory" }],
      });
    } catch (err: any) {
      console.error("AI Assistant API error:", err?.message || err);
      const status = err?.status;
      if (status === 503 || status === 429) {
        return res.status(503).json({ error: "AI provider is temporarily overloaded. Please try again in a moment." });
      }
      res.status(500).json({ error: "AI Assistant service encountered an issue" });
    }
  });

  // AI Prescription Validation endpoint
  app.post("/api/ai/validate-prescription", async (req, res) => {
    try {
      const prescription = req.body;
      if (!prescription || !prescription.medicines || !prescription.medicines.length) {
        return res.status(400).json({ error: "Prescription medicines required" });
      }

      if (!aiConfigured) {
        return res.status(503).json({ error: "Server AI service not configured (set GROQ_API_KEY)" });
      }

      const prompt = `You are a Senior Clinical Pharmacist AI decision-support engine. Analyze this prescription:
Patient: ${prescription.patientName}, Age: ${prescription.patientAge}, Gender: ${prescription.patientGender}
Allergies: ${JSON.stringify(prescription.allergies || [])}
Doctor: ${prescription.doctorName} (${prescription.doctorRegNo})
Prescribed Medicines:
${JSON.stringify(prescription.medicines, null, 2)}

Check for: drug-drug interactions, allergy conflicts (including cross-reactivity), duplicate therapeutic classes, dose/frequency problems (consider patient age), and cheaper generic alternatives.

Provide a structured clinical safety review as a single JSON object matching this schema exactly:
{
  "overallStatus": "valid" | "needs_review" | "critical_warning",
  "drugInteractions": [
    { "severity": "critical"|"high"|"moderate"|"low", "drugs": ["DrugA", "DrugB"], "issue": "...", "mechanism": "...", "recommendation": "..." }
  ],
  "duplicateTherapies": [
    { "severity": "high"|"moderate", "drugs": ["DrugA", "DrugB"], "therapeuticClass": "...", "recommendation": "..." }
  ],
  "dosageChecks": [
    { "medicine": "...", "prescribedDose": "...", "standardDose": "...", "status": "normal"|"high"|"low"|"frequency_warning", "recommendation": "..." }
  ],
  "allergyWarnings": [
    { "medicine": "...", "allergy": "...", "severity": "critical"|"warning", "recommendation": "..." }
  ],
  "genericAlternatives": [
    { "prescribed": "...", "genericAlternative": "...", "activeMolecule": "...", "savingsPercent": 45, "availability": "In Stock"|"Low Stock"|"Order Needed", "inventoryStock": 40 }
  ],
  "pharmacistAdvice": "Clinical summary and dispensing recommendation"
}
Rules: NEVER suggest a generic alternative that contains, or is in the same drug class as, anything the patient is allergic to or that you flagged in allergyWarnings; leave genericAlternatives empty for those drugs. Do not invent stock numbers (use 0). Use "critical_warning" if there is any allergy conflict or critical interaction, "needs_review" for moderate issues, otherwise "valid". Use empty arrays when nothing is found.
Return ONLY that JSON object, no prose, no markdown fences.`;

      const { text, provider } = await callAI(prompt, true);
      const parsed = normalizeValidation(parseJsonLoose(text));

      return res.json({
        ...parsed,
        provider,
        prescriptionId: prescription.prescriptionId,
        patientName: prescription.patientName,
        patientAge: prescription.patientAge,
        patientGender: prescription.patientGender,
        doctorName: prescription.doctorName,
        doctorRegNo: prescription.doctorRegNo,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Prescription validation error:", err?.message || err);
      // The client (src/services/aiService.ts -> validatePrescription) falls
      // back to its local rule-based engine on any non-OK response.
      const status = err?.status;
      if (status === 503 || status === 429) {
        return res.status(503).json({ error: "AI provider is temporarily overloaded. Falling back to local safety engine." });
      }
      res.status(500).json({ error: "Failed to validate prescription" });
    }
  });

  // Prescription image -> structured fields (stateless, nothing stored)
  app.post("/api/ai/extract-prescription", async (req, res) => {
    try {
      const { image } = req.body || {};
      if (typeof image !== "string" || !/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(image)) {
        return res.status(400).json({ error: "A prescription image (PNG, JPG or WEBP) is required" });
      }
      if (!aiConfigured) {
        return res.status(503).json({ error: "Server AI service not configured (set GROQ_API_KEY)" });
      }

      const prompt = `You are reading a photo of a medical prescription for a pharmacy system. Extract ONLY what is actually written on the prescription. Never guess, infer or invent values; use "" (or null for numbers) when something is not visible or not legible.

Return ONLY a single JSON object (no prose, no markdown fences) with exactly this shape:
{
  "isPrescription": true | false,
  "patientName": "",
  "patientAge": null,
  "patientGender": "Male" | "Female" | "Other" | "",
  "allergies": [],
  "doctorName": "",
  "doctorRegNo": "",
  "medicines": [
    { "medicineName": "brand/generic name with strength, e.g. Amoxicillin 500mg", "dosage": "strength per dose, e.g. 500mg", "frequency": "e.g. TDS (Three times a day) / OD / BD / 1-0-1", "durationDays": 0, "instructions": "e.g. After meals" }
  ],
  "notes": "anything illegible or uncertain that a pharmacist should double-check"
}
Rules:
- If the image is not a prescription, set isPrescription to false and leave everything else empty.
- Convert durations to a number of days (e.g. "2 weeks" -> 14, "1 month" -> 30). Use 0 if not stated.
- Expand shorthand frequency where obvious (OD = once daily, BD/BID = twice daily, TDS/TID = three times daily, QID = four times daily, HS = at bedtime, SOS = as needed).
- "allergies" only if the prescription explicitly lists drug allergies.
- Put one entry per medicine, in the order written. Mention uncertain/illegible readings in "notes".`;

      const text = await callVision(image, prompt);
      const extracted = normalizeExtraction(parseJsonLoose(text));
      return res.json(extracted);
    } catch (err: any) {
      console.error("Prescription extraction error:", err?.message || err);
      const status = err?.status;
      if (status === 503 || status === 429) {
        return res.status(503).json({ error: "AI provider is busy. Please try again in a moment." });
      }
      if (status === 413) {
        return res.status(413).json({ error: "Image is too large. Try a smaller photo." });
      }
      if (status === 401) {
        return res.status(500).json({ error: "Groq rejected the API key. Check GROQ_API_KEY in .env." });
      }
      res.status(500).json({ error: "Could not read the prescription image. Try a clearer photo." });
    }
  });

  // AI Generic Substitution endpoint
  app.post("/api/ai/generic-suggestions", async (req, res) => {
    try {
      const { medicines } = req.body;
      if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
        return res.status(400).json({ error: "medicines array is required" });
      }

      if (!aiConfigured) {
        return res.status(503).json({ error: "Server AI service not configured (set GROQ_API_KEY)" });
      }

      const catalogSummary = medicines
        .slice(0, 60)
        .map(
          (m: any) =>
            `${m.name} | generic: ${m.genericName} | category: ${m.category} | price: Rs.${m.sellingPrice} | stock: ${m.stock} | form: ${m.dosageForm} ${m.strength} | manufacturer: ${m.manufacturer}`
        )
        .join("\n");

      const prompt = `You are "MediCore AI", a pharmacy margin-optimization and bioequivalence assistant.
Here is this pharmacy's current medicine catalog (name | generic name | category | selling price | stock | form+strength | manufacturer):
${catalogSummary}

Identify up to 8 realistic opportunities to substitute a commonly-prescribed BRANDED medicine with a cheaper bioequivalent GENERIC alternative that exists in the catalog above. Only use "possibleGeneric" values that exactly match a medicine "name" from the catalog. Estimate realistic Indian retail brand pricing for comparison against the catalog's generic price.

Return ONLY a single JSON object (no prose, no markdown fences) matching this schema:
{
  "suggestions": [
    {
      "brandMedicine": "Common brand name + strength",
      "activeIngredient": "Active molecule + strength",
      "strength": "e.g. 500mg",
      "dosageForm": "Tablet",
      "possibleGeneric": "Exact matching medicine name from the catalog above",
      "brandPrice": 0.0,
      "genericPrice": 0.0,
      "savingsPercent": 0,
      "availability": "In Stock",
      "inventoryStock": 0,
      "reason": "One sentence clinical/commercial justification",
      "manufacturer": "Manufacturer of the generic, from the catalog"
    }
  ]
}`;

      const { text, provider } = await callAI(prompt, true);
      const parsed = parseJsonLoose(text);
      const rawList = Array.isArray(parsed) ? parsed : parsed.suggestions || [];
      const suggestions = rawList
        .filter((s: any) => s && typeof s.possibleGeneric === "string")
        .map((s: any, i: number) => ({
          id: `gen-ai-${Date.now()}-${i}`,
          ...s,
        }));
      return res.json({ suggestions, provider });
    } catch (err: any) {
      console.error("Generic suggestions error:", err?.message || err);
      // The client falls back to a local heuristic if this endpoint fails.
      const status = err?.status;
      if (status === 503 || status === 429) {
        return res.status(503).json({ error: "AI provider is temporarily overloaded. Falling back to local suggestions." });
      }
      res.status(500).json({ error: "Failed to generate generic suggestions" });
    }
  });

  // --- VITE MIDDLEWARE / STATIC ASSETS ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MediCore Server running on http://0.0.0.0:${PORT}`);
    console.log(`AI provider — Groq: ${groqApiKey ? "configured" : "NOT SET (add GROQ_API_KEY to .env)"}`);
    console.log(`Groq models (in order): ${groqModels.join(", ")}`);
    console.log(`Groq vision models (in order): ${visionModels.join(", ")}`);
  });
}

startServer();

import React, { useState, useRef, useEffect } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Plus,
  Trash2,
  Receipt,
  RefreshCw,
  Loader2,
  UploadCloud,
  ScanLine,
  X
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  validatePrescriptionClinicalRules,
  samplePrescriptionScenarios,
  extractPrescriptionFromImage,
  prepareImageForUpload
} from '../services/aiService';
import { PrescriptionValidationResult } from '../types';

export const PrescriptionValidationPage: React.FC = () => {
  const { setIsNewSaleOpen, addToast, medicines } = usePharmacy();
  const { user } = useAuth();
  const canDispense = user?.role === 'pharmacist';

  // Patient & Doctor state
  const [patientName, setPatientName] = useState<string>('Vikram Singh');
  const [patientAge, setPatientAge] = useState<number>(58);
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [allergies, setAllergies] = useState<string[]>(['Penicillin', 'Sulfa']);
  const [allergyInput, setAllergyInput] = useState<string>('');

  const [doctorName, setDoctorName] = useState<string>('Dr. Rajesh Khanna, MD');
  const [doctorRegNo, setDoctorRegNo] = useState<string>('MCI-78249');

  // Medicines list
  const [prescribedItems, setPrescribedItems] = useState<
    Array<{
      medicineName: string;
      dosage: string;
      frequency: string;
      durationDays: number;
      instructions: string;
    }>
  >([
    {
      medicineName: 'Amoxicillin 500mg',
      dosage: '500mg',
      frequency: 'TDS (Three times a day)',
      durationDays: 7,
      instructions: 'After meals'
    },
    {
      medicineName: 'Aspirin 75mg',
      dosage: '75mg',
      frequency: 'OD (Once daily)',
      durationDays: 30,
      instructions: 'Morning'
    },
    {
      medicineName: 'Warfarin 2mg',
      dosage: '2mg',
      frequency: 'OD (Once daily)',
      durationDays: 30,
      instructions: 'Evening'
    }
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<PrescriptionValidationResult | null>(null);

  // Uploaded prescription photo (kept in browser memory only, never stored)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanNotes, setScanNotes] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Release the preview image from memory when leaving the page
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Load a preset clinical scenario
  const loadScenario = (index: number) => {
    const sc = samplePrescriptionScenarios[index];
    if (!sc) return;
    setPatientName(sc.patientName);
    setPatientAge(sc.patientAge);
    setPatientGender(sc.patientGender);
    setAllergies(sc.allergies);
    setDoctorName(sc.doctorName);
    setDoctorRegNo(sc.doctorRegNo);
    setPrescribedItems(sc.medicines);
    setValidationResult(null);
    addToast('info', 'Scenario Loaded', `Loaded preset clinical scenario: "${sc.scenarioTitle}"`);
  };

  const handleAddMedicineRow = () => {
    setPrescribedItems(prev => [
      ...prev,
      {
        medicineName: 'Paracetamol 500mg',
        dosage: '500mg',
        frequency: 'TDS',
        durationDays: 5,
        instructions: 'As needed for fever'
      }
    ]);
  };

  const handleUpdateMedicineRow = (index: number, field: string, val: any) => {
    setPrescribedItems(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveMedicineRow = (index: number) => {
    setPrescribedItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAddAllergy = () => {
    if (!allergyInput.trim() || allergies.includes(allergyInput.trim())) return;
    setAllergies(prev => [...prev, allergyInput.trim()]);
    setAllergyInput('');
  };

  const handleRemoveAllergy = (allergy: string) => {
    setAllergies(prev => prev.filter(a => a !== allergy));
  };

  const runValidation = async (data: {
    patientName: string;
    patientAge: number;
    patientGender: 'Male' | 'Female' | 'Other';
    allergies: string[];
    doctorName: string;
    doctorRegNo: string;
    items: typeof prescribedItems;
  }) => {
    if (!data.items.length) return;
    setIsLoading(true);

    try {
      const payload = {
        prescriptionId: `RX-${Date.now().toString().slice(-6)}`,
        patientName: data.patientName,
        patientAge: data.patientAge,
        patientGender: data.patientGender,
        allergies: data.allergies,
        doctorName: data.doctorName,
        doctorRegNo: data.doctorRegNo,
        medicines: data.items.map(item => ({
          ...item,
          duration: `${item.durationDays} days`
        }))
      };

      // Call rule-based + AI engine
      const result = await validatePrescriptionClinicalRules(payload, medicines);
      setValidationResult(result);

      if (result.overallStatus === 'critical_warning') {
        addToast('error', 'Critical Safety Warning', 'Severe drug interaction or allergy conflict detected!');
      } else if (result.overallStatus === 'needs_review') {
        addToast('warning', 'Review Recommended', 'Prescription has moderate interactions or high dosages.');
      } else {
        addToast('success', 'Prescription Verified', 'All pharmacological safety checks passed.');
      }
    } catch (e) {
      console.error(e);
      addToast('error', 'Validation Error', 'Failed to complete safety checks.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = () =>
    runValidation({
      patientName,
      patientAge,
      patientGender,
      allergies,
      doctorName,
      doctorRegNo,
      items: prescribedItems
    });

  // Upload a prescription photo -> Groq reads it -> form auto-fills -> verdict runs
  const handlePrescriptionImage = async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('error', 'Unsupported File', 'Please upload an image (JPG, PNG or WEBP) of the prescription.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      addToast('error', 'Image Too Large', 'Please choose an image under 20 MB.');
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setIsScanning(true);
    setScanNotes('');
    setValidationResult(null);

    try {
      const dataUrl = await prepareImageForUpload(file);
      const ex = await extractPrescriptionFromImage(dataUrl);

      if (!ex.isPrescription || !ex.medicines.length) {
        addToast(
          'warning',
          'No Medicines Found',
          ex.isPrescription
            ? 'The prescription could not be read clearly. Try a sharper, well-lit photo.'
            : 'This image does not look like a prescription.'
        );
        return;
      }

      const next = {
        patientName: ex.patientName || patientName,
        patientAge: ex.patientAge ?? patientAge,
        patientGender: (ex.patientGender ?? patientGender) as 'Male' | 'Female' | 'Other',
        allergies: ex.allergies,
        doctorName: ex.doctorName || doctorName,
        doctorRegNo: ex.doctorRegNo || doctorRegNo,
        items: ex.medicines.map(m => ({
          medicineName: m.medicineName,
          dosage: m.dosage,
          frequency: m.frequency || 'OD (Once daily)',
          durationDays: m.durationDays || 1,
          instructions: m.instructions
        }))
      };

      // Autofill every field from the image
      setPatientName(next.patientName);
      setPatientAge(next.patientAge);
      setPatientGender(next.patientGender);
      setAllergies(next.allergies);
      setDoctorName(next.doctorName);
      setDoctorRegNo(next.doctorRegNo);
      setPrescribedItems(next.items);
      setScanNotes(ex.notes || '');
      addToast('success', 'Prescription Read', `Auto-filled ${next.items.length} medicine(s). Running safety check...`);

      // Give the verdict straight away using the freshly extracted data
      await runValidation(next);
    } catch (e: any) {
      console.error(e);
      addToast('error', 'Could Not Read Prescription', e?.message || 'Please try again with a clearer photo.');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearPreviewImage = () => {
    setPreviewUrl(null);
    setScanNotes('');
  };

  // Always-safe arrays so a partial result can never crash the page
  const allergyWarnings = validationResult?.allergyWarnings ?? [];
  const drugInteractions = validationResult?.drugInteractions ?? [];
  const duplicateTherapies = validationResult?.duplicateTherapies ?? [];
  const dosageChecks = validationResult?.dosageChecks ?? [];
  const genericAlternatives = validationResult?.genericAlternatives ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Prescription Safety & Interaction Engine
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full">
              Clinical Decision Support
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated screening for Drug-Drug interactions, allergy contraindications, duplicate therapies, and dosage safety
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          isLoading={isLoading}
          onClick={handleValidate}
          icon={<ShieldAlert className="w-4 h-4 text-indigo-200" />}
        >
          Run Safety Validation
        </Button>
      </div>

      {/* Prescription Photo Upload (autofill) */}
      <div
        onDragOver={e => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setIsDragging(false);
          handlePrescriptionImage(e.dataTransfer.files?.[0]);
        }}
        className={`p-4 rounded-2xl border-2 border-dashed transition-all ${
          isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => handlePrescriptionImage(e.target.files?.[0])}
        />
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {previewUrl ? (
            <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <img src={previewUrl} alt="Uploaded prescription" className="w-full h-full object-cover" />
              {isScanning && (
                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              {!isScanning && (
                <button
                  type="button"
                  onClick={clearPreviewImage}
                  className="absolute top-1 right-1 p-0.5 rounded-full bg-white/90 text-slate-600 hover:text-rose-600"
                  aria-label="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="w-12 h-12 shrink-0 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <ScanLine className="w-6 h-6" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800">Scan a prescription photo</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {isScanning
                ? 'Reading the prescription with AI and filling the form...'
                : 'Upload or drop a photo. Patient, doctor, allergies and medicines are filled in automatically and the safety verdict runs right away. The image is not saved.'}
            </p>
            {scanNotes && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-2">
                <strong>Please double-check:</strong> {scanNotes}
              </p>
            )}
          </div>

          <Button
            variant="primary"
            size="sm"
            type="button"
            isLoading={isScanning}
            disabled={isScanning || isLoading}
            onClick={() => fileInputRef.current?.click()}
            icon={<UploadCloud className="w-4 h-4" />}
          >
            {previewUrl ? 'Upload Another' : 'Upload Prescription'}
          </Button>
        </div>
      </div>

      {/* Preset Clinical Scenarios Strip */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Quick Clinical Test Scenarios (1-Click Preset)
          </span>
          <span className="text-[10px] text-slate-400">Click to auto-populate form</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {samplePrescriptionScenarios.map((sc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadScenario(idx)}
              className="p-2.5 bg-white hover:bg-blue-50/60 border border-slate-200 rounded-xl text-left transition-all group"
            >
              <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate">
                {sc.scenarioTitle}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {sc.medicines.map(m => m.medicineName.split(' ')[0]).join(' + ')}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form Left, Results Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 cols: Prescription Entry Form */}
        <div className="lg:col-span-6 space-y-4">
          {/* Patient Details */}
          <Card>
            <CardHeader
              title="Patient & Prescribing Doctor Details"
              subtitle="Demographics and known adverse hypersensitivities"
            />
            <CardContent className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Age / Gender
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={patientAge}
                      onChange={e => setPatientAge(parseInt(e.target.value) || 0)}
                      className="w-14 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <select
                      value={patientGender}
                      onChange={e => setPatientGender(e.target.value as any)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Known Allergies */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Known Drug Allergies & Hypersensitivities
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {allergies.map(allergy => (
                    <span
                      key={allergy}
                      className="px-2 py-0.5 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-md flex items-center gap-1 font-medium"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(allergy)}
                        className="hover:text-rose-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type allergy (e.g. Penicillin, NSAIDs, Sulfa)..."
                    value={allergyInput}
                    onChange={e => setAllergyInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
                    className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <Button size="sm" variant="secondary" type="button" onClick={handleAddAllergy}>
                    Add
                  </Button>
                </div>
              </div>

              {/* Doctor Details */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Doctor Name</label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={e => setDoctorName(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Doctor Reg. No.</label>
                  <input
                    type="text"
                    value={doctorRegNo}
                    onChange={e => setDoctorRegNo(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prescribed Medicines List */}
          <Card>
            <CardHeader
              title={`Prescribed Medicines (${prescribedItems.length})`}
              subtitle="Formulation, dosage, frequency, and regimen duration"
              action={
                <Button size="sm" variant="secondary" onClick={handleAddMedicineRow} icon={<Plus className="w-3.5 h-3.5" />}>
                  Add Drug
                </Button>
              }
            />
            <CardContent className="space-y-3">
              {prescribedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Drug #{idx + 1}</span>
                    <button
                      type="button"
                      disabled={prescribedItems.length <= 1}
                      onClick={() => handleRemoveMedicineRow(idx)}
                      className="text-slate-300 hover:text-rose-600 disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500">Medicine Name</label>
                      <input
                        type="text"
                        value={item.medicineName}
                        onChange={e => handleUpdateMedicineRow(idx, 'medicineName', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-md font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Dosage Strength</label>
                      <input
                        type="text"
                        value={item.dosage}
                        onChange={e => handleUpdateMedicineRow(idx, 'dosage', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500">Frequency</label>
                      <input
                        type="text"
                        value={item.frequency}
                        onChange={e => handleUpdateMedicineRow(idx, 'frequency', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Duration (Days)</label>
                      <input
                        type="number"
                        min={1}
                        value={item.durationDays}
                        onChange={e => handleUpdateMedicineRow(idx, 'durationDays', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isLoading}
                onClick={handleValidate}
                icon={<ShieldCheck className="w-4 h-4" />}
              >
                Analyze Prescription Safety
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right 6 cols: Safety Analysis Output */}
        <div className="lg:col-span-6 space-y-4">
          {!validationResult ? (
            <Card className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 border-dashed">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Prescription Safety Engine Ready
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1.5 mb-5 leading-relaxed">
                Click "Analyze Prescription Safety" to screen the prescribed drugs against MediCore's clinical pharmacology rules, allergy lists, and high-dosage thresholds.
              </p>
              <Button variant="outline" size="sm" onClick={handleValidate}>
                Run Check Now
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Overall Safety Banner */}
              <div
                className={`p-4.5 rounded-2xl border flex items-start justify-between gap-4 shadow-xs ${
                  validationResult.overallStatus === 'critical_warning'
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : validationResult.overallStatus === 'needs_review'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {validationResult.overallStatus === 'critical_warning' ? (
                      <ShieldAlert className="w-6 h-6 text-rose-600" />
                    ) : validationResult.overallStatus === 'needs_review' ? (
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    ) : (
                      <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold capitalize">
                      {validationResult.overallStatus === 'critical_warning'
                        ? 'Critical Pharmacological Warning'
                        : validationResult.overallStatus === 'needs_review'
                        ? 'Prescription Requires Pharmacist Review'
                        : 'Prescription Verified Safe for Dispensing'}
                    </h3>
                    <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
                      {validationResult.pharmacistAdvice}
                    </p>
                  </div>
                </div>

                {/* Dispensing happens at the pharmacy counter, so customers don't see this */}
                {canDispense && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setIsNewSaleOpen(true)}
                    icon={<Receipt className="w-3.5 h-3.5" />}
                  >
                    Dispense
                  </Button>
                )}
              </div>

              {/* Allergy Warnings */}
              {allergyWarnings.length > 0 && (
                <Card className="border-rose-200 bg-rose-50/40">
                  <CardHeader
                    title={
                      <div className="flex items-center gap-2 text-rose-900">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Allergy Contraindications ({allergyWarnings.length})</span>
                      </div>
                    }
                  />
                  <CardContent className="space-y-2">
                    {allergyWarnings.map((aw, i) => (
                      <div key={i} className="p-3 bg-white border border-rose-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-900">{aw.medicine}</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-md">
                            Allergy: {aw.allergy}
                          </span>
                        </div>
                        <p className="text-xs text-rose-800 leading-relaxed">{aw.recommendation}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Drug-Drug Interactions */}
              {drugInteractions.length > 0 && (
                <Card className="border-amber-200">
                  <CardHeader
                    title={
                      <div className="flex items-center gap-2 text-amber-900">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        <span>Drug Interactions ({drugInteractions.length})</span>
                      </div>
                    }
                  />
                  <CardContent className="space-y-2.5">
                    {drugInteractions.map((di, i) => (
                      <div key={i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            {di.drugs.join(' ↔ ')}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                              di.severity === 'critical' || di.severity === 'high'
                                ? 'bg-rose-100 text-rose-700'
                                : di.severity === 'moderate'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {di.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 font-medium">{di.issue}</p>
                        {di.mechanism && (
                          <p className="text-[11px] text-slate-500 leading-relaxed">{di.mechanism}</p>
                        )}
                        <p className="text-[11px] text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">
                          <strong>Clinical Recommendation:</strong> {di.recommendation}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Duplicate Therapy Warnings */}
              {duplicateTherapies.length > 0 && (
                <Card>
                  <CardHeader title="Duplicate Therapeutic Class Warnings" />
                  <CardContent className="space-y-2">
                    {duplicateTherapies.map((dt, i) => (
                      <div key={i} className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-xs space-y-1">
                        <p className="font-bold text-amber-900">
                          {dt.drugs.join(' and ')} (Class: {dt.therapeuticClass})
                        </p>
                        <p className="text-amber-800">{dt.recommendation}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Dosage Checks */}
              {dosageChecks.length > 0 && (
                <Card>
                  <CardHeader title="Dosage Range & Frequency Verification" />
                  <CardContent className="space-y-2">
                    {dosageChecks.map((dc, i) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{dc.medicine}</span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                              dc.status === 'normal'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {dc.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Prescribed: {dc.prescribedDose} (Standard: {dc.standardDose})
                        </p>
                        <p className="text-slate-600">{dc.recommendation}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Smart Generic Substitutions */}
              {genericAlternatives.length > 0 && (
                <Card className="border-indigo-200 bg-indigo-50/30">
                  <CardHeader
                    title={
                      <div className="flex items-center gap-2 text-indigo-950">
                        <RefreshCw className="w-4 h-4 text-indigo-600" />
                        <span>Recommended Generic Substitutions</span>
                      </div>
                    }
                    subtitle="Bioequivalent formulations with patient cost savings"
                  />
                  <CardContent className="space-y-2.5">
                    {genericAlternatives.map((ga, i) => (
                      <div key={i} className="p-3 bg-white border border-indigo-100 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{ga.genericAlternative}</span>
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-sm font-semibold">
                              Save {ga.savingsPercent}%
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Replaces {ga.prescribed} • Molecule: {ga.activeMolecule}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                          {ga.availability === 'Order Needed' ? 'Order Needed' : `${ga.availability} (${ga.inventoryStock})`}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import {
  FileCheck2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
  Receipt,
  RotateCcw,
  ArrowRight,
  Info,
  Loader2,
  RefreshCw,
  User,
  Stethoscope
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { validatePrescriptionClinicalRules, samplePrescriptionScenarios } from '../services/aiService';
import { PrescriptionValidationResult } from '../types';

export const PrescriptionValidationPage: React.FC = () => {
  const { setIsNewSaleOpen, addToast, medicines } = usePharmacy();

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

  const handleValidate = async () => {
    if (!prescribedItems.length) return;
    setIsLoading(true);

    try {
      const payload = {
        prescriptionId: `RX-${Date.now().toString().slice(-6)}`,
        patientName,
        patientAge,
        patientGender,
        allergies,
        doctorName,
        doctorRegNo,
        medicines: prescribedItems.map(item => ({
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

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsNewSaleOpen(true)}
                  icon={<Receipt className="w-3.5 h-3.5" />}
                >
                  Dispense
                </Button>
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
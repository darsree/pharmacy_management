import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import {
  RefreshCw,
  Search,
  Percent,
  CheckCircle2,
  Receipt,
  Plus,
  ArrowRight,
  Pill,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { formatCurrency } from '../utils';
import { generateGenericSuggestions } from '../services/aiService';
import { GenericSuggestion } from '../types';

export const GenericSuggestionsPage: React.FC = () => {
  const { generics, medicines, setIsNewSaleOpen, addToast } = usePharmacy();
  const [search, setSearch] = useState<string>('');
  const [aiGenerics, setAiGenerics] = useState<GenericSuggestion[] | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Once the AI has generated a fresh batch, show those; otherwise fall back
  // to whatever is seeded in the database.
  const displayedGenerics = aiGenerics ?? generics;

  const handleGenerateWithAI = async () => {
    if (!medicines.length) {
      addToast('warning', 'No Inventory', 'Add medicines to your catalog before generating suggestions.');
      return;
    }
    setIsGenerating(true);
    try {
      const results = await generateGenericSuggestions(medicines);
      setAiGenerics(results);
      addToast('success', 'Suggestions Refreshed', `Generated ${results.length} substitution opportunities from your live catalog.`);
    } catch (e) {
      console.error(e);
      addToast('error', 'Generation Failed', 'Could not generate generic suggestions.');
    } finally {
      setIsGenerating(false);
    }
  };

  const filtered = displayedGenerics.filter(
    g =>
      g.brandMedicine.toLowerCase().includes(search.toLowerCase()) ||
      g.possibleGeneric.toLowerCase().includes(search.toLowerCase()) ||
      g.activeIngredient.toLowerCase().includes(search.toLowerCase()) ||
      g.reason.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Generic Medicine Substitutions & Bioequivalence
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">
              Margin Optimization
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Suggest bioequivalent generic alternatives with patient cost savings and pharmacy profit margin lift
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateWithAI}
            disabled={isGenerating}
            icon={<RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />}
          >
            {isGenerating ? 'Generating...' : 'Generate with AI'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewSaleOpen(true)}
            icon={<Receipt className="w-4 h-4" />}
          >
            Dispense in POS
          </Button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-950">Average Patient Savings: 48%</p>
            <p className="text-[11px] text-emerald-700">Compared to originator brand names</p>
          </div>
        </div>

        <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-950">Average Margin Gain: +22%</p>
            <p className="text-[11px] text-blue-700">Higher margin yield on generic lines</p>
          </div>
        </div>

        <div className="p-4 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-950">{displayedGenerics.length} Verified Equivalents</p>
            <p className="text-[11px] text-indigo-700">Matched with active pharmacy inventory</p>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search brand name, generic molecule, therapeutic class..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent border-none outline-hidden text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Alternatives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(item => (
          <div
            key={item.id}
            className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-slate-300 hover:shadow-sm transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {item.dosageForm} • {item.strength}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Save {item.savingsPercent}%
                </span>
              </div>

              {/* Comparison Box */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200/70 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Brand Prescribed</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{item.brandMedicine}</p>
                  <p className="text-xs font-semibold text-slate-600 line-through mt-0.5">
                    {formatCurrency(item.brandPrice)}
                  </p>
                </div>

                <div className="border-l border-slate-200 pl-3">
                  <span className="text-[10px] text-emerald-700 font-semibold block">Generic Alternative</span>
                  <p className="text-xs font-bold text-emerald-800 mt-0.5">{item.possibleGeneric}</p>
                  <p className="text-xs font-bold text-emerald-600 mt-0.5">
                    {formatCurrency(item.genericPrice)}
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  <strong className="text-slate-700">Active Molecule:</strong> {item.activeIngredient} ({item.strength})
                </p>
                <p>
                  <strong className="text-slate-700">Clinical Bioequivalence:</strong> {item.reason}
                </p>
                <p className="text-[11px] text-slate-400">
                  Manufacturer: {item.manufacturer}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-slate-400">Inventory Status: </span>
                <span
                  className={`font-bold ${
                    item.availability === 'In Stock'
                      ? 'text-emerald-600'
                      : item.availability === 'Low Stock'
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}
                >
                  {item.availability} ({item.inventoryStock} units)
                </span>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsNewSaleOpen(true)}
                icon={<Receipt className="w-3.5 h-3.5" />}
              >
                Dispense Generic
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

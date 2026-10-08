import React, { useMemo, useState } from 'react';
import {
  Award,
  Clock3,
  PackageCheck,
  Sparkles,
  Truck,
  ShoppingCart
} from 'lucide-react';

import { usePharmacy } from '../../context/PharmacyContext';
import { recommendSuppliers } from '../../services/recommendationService';
import { formatCurrency } from '../../utils';
import { Button } from '../common/Button';
import {
  Card,
  CardContent,
  CardHeader
} from '../common/Card';

export const SupplierRecommendationPanel: React.FC =
  () => {
    const {
      medicines,
      suppliers,
      supplierOfferings,
      setIsCreatePOOpen,
      setPendingReorder
    } = usePharmacy();

    const [medicineId, setMedicineId] =
      useState(medicines[0]?.id ?? '');

    const [quantity, setQuantity] =
      useState(100);

    const medicine = medicines.find(
      (m) => m.id === medicineId
    );

    const recommendations = useMemo(
      () =>
        medicine
          ? recommendSuppliers(
              medicine,
              suppliers,
              supplierOfferings,
              quantity
            )
          : [],
      [
        medicine,
        suppliers,
        supplierOfferings,
        quantity
      ]
    );

    const openPO = (
      supplierId: string,
      recommendedQuantity: number
    ) => {
      if (!medicine) return;

      setPendingReorder({
        medicineId: medicine.id,
        quantity: recommendedQuantity,
        supplierId
      });

      setIsCreatePOOpen(true);
    };

    return (
      <Card>
        <CardHeader
          title="Best Supplier Recommendation"
          subtitle="Ranks suppliers for the selected medicine using supplier pricing, reliability, availability and lead time"
          action={
            <Sparkles className="w-4 h-4 text-violet-500" />
          }
        />

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_140px] gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Medicine to procure
              </label>

              <select
                value={medicineId}
                onChange={(e) =>
                  setMedicineId(e.target.value)
                }
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                {medicines.map((m) => (
                  <option
                    key={m.id}
                    value={m.id}
                  >
                    {m.name} · {m.stock} in stock
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Order quantity
              </label>

              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.max(
                      1,
                      Number(e.target.value)
                    )
                  )
                }
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              />
            </div>
          </div>

          {recommendations.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              No supplier offering is available
              for this medicine. Add
              supplier-specific offerings to
              enable ranking.
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations
                .slice(0, 3)
                .map((rec, index) => (
                  <div
                    key={rec.offering.id}
                    className={`rounded-xl border p-4 ${
                      index === 0
                        ? 'border-violet-200 bg-violet-50/40'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                            #{index + 1}
                          </span>

                          <h4 className="text-sm font-bold text-slate-900">
                            {rec.supplier.name}
                          </h4>

                          {index === 0 && (
                            <span className="text-[10px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                              BEST MATCH
                            </span>
                          )}
                        </div>

                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                            ₹
                            {rec.offering.unitPurchasePrice.toFixed(
                              2
                            )}
                            /unit
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-blue-600" />
                            {
                              rec.supplier
                                .onTimeDeliveryRate
                            }
                            % on-time
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            {rec.supplier.rating.toFixed(
                              1
                            )}
                            /5
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Clock3 className="w-3.5 h-3.5 text-slate-500" />
                            {
                              rec.offering
                                .leadTimeDays
                            }{' '}
                            days
                          </div>
                        </div>

                        <p className="mt-2 text-[11px] text-slate-600">
                          {rec.reasons
                            .slice(0, 4)
                            .join(' • ')}
                        </p>
                      </div>

                      <div className="shrink-0 md:text-right">
                        <div className="text-[10px] text-slate-400">
                          Estimated purchase
                        </div>

                        <div className="text-xl font-black text-slate-900">
                          {formatCurrency(
                            rec.estimatedCost
                          )}
                        </div>

                        <div className="text-[10px] text-slate-500 mt-1">
                          Score {rec.score}/100
                        </div>

                        <Button
                          size="sm"
                          className="mt-2"
                          icon={
                            <ShoppingCart className="w-3.5 h-3.5" />
                          }
                          onClick={() =>
                            openPO(
                              rec.supplier.id,
                              Math.max(
                                quantity,
                                rec.offering
                                  .minOrderQuantity
                              )
                            )
                          }
                        >
                          Create PO
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
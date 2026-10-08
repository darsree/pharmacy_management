import React, { useState, useEffect } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { PurchaseOrder } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CheckCircle2, Boxes } from 'lucide-react';

interface ReceiveStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
}

export const ReceiveStockModal: React.FC<ReceiveStockModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder
}) => {
  const { receivePurchaseOrder } = usePharmacy();

  const [receivedItems, setReceivedItems] = useState<
    Array<{ medicineId: string; medicineName: string; quantity: number; batchNumber: string; expiryDate: string }>
  >([]);

  useEffect(() => {
    if (purchaseOrder) {
      const defaultExp = new Date();
      defaultExp.setFullYear(defaultExp.getFullYear() + 2);
      const expStr = defaultExp.toISOString().slice(0, 10);

      setReceivedItems(
        purchaseOrder.items.map(i => ({
          medicineId: i.medicineId,
          medicineName: i.medicineName,
          quantity: i.quantity,
          batchNumber: `B-${Math.floor(1000 + Math.random() * 9000)}`,
          expiryDate: expStr
        }))
      );
    }
  }, [purchaseOrder, isOpen]);

  if (!purchaseOrder) return null;

  const handleUpdate = (
    index: number,
    field: 'quantity' | 'batchNumber' | 'expiryDate',
    val: string | number
  ) => {
    setReceivedItems(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: val } : item))
    );
  };

  const handleConfirm = () => {
    receivePurchaseOrder(purchaseOrder.id, receivedItems);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receive Stock for ${purchaseOrder.poNumber}`}
      subtitle={`Supplier: ${purchaseOrder.supplierName}`}
      maxWidth="2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="success"
            icon={<CheckCircle2 className="w-4 h-4" />}
            onClick={handleConfirm}
          >
            Confirm Stock Receipt & Update Batches
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-600">
          Verify physical delivery, inspect batch numbers, and verify expiry dates before updating pharmacy inventory.
        </p>

        <div className="space-y-3">
          {receivedItems.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-800">{item.medicineName}</p>
                <span className="text-[11px] text-slate-500 font-medium">
                  Ordered: {item.quantity} units
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Received Units</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={e => handleUpdate(idx, 'quantity', parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={item.batchNumber}
                    onChange={e => handleUpdate(idx, 'batchNumber', e.target.value)}
                    placeholder="Batch No."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={item.expiryDate}
                    onChange={e => handleUpdate(idx, 'expiryDate', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

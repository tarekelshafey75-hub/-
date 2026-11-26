import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Check, 
  FileText, 
  Settings, 
  RefreshCw, 
  Trash,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Ingredient, WasteLog, Supplier } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createWasteLogTransaction } from '../lib/db-service';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface InventoryViewProps {
  ingredients: Ingredient[];
  wasteLogs: WasteLog[];
  suppliers: Supplier[];
  onRefresh: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  ingredients,
  wasteLogs,
  suppliers,
  onRefresh
}) => {
  // Waste modal
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [selectedIngId, setSelectedIngId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<'Spoiled' | 'Spilled' | 'Expired' | 'Other'>('Spoiled');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New ingredient form modal
  const [showAddIngModal, setShowAddIngModal] = useState(false);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [minStock, setMinStock] = useState(5);
  const [initStock, setInitStock] = useState(10);
  const [initCost, setInitCost] = useState(12);
  const [supplierId, setSupplierId] = useState('');

  const currentWastedVal = () => {
    const ing = ingredients.find(i => i.id === selectedIngId);
    if (!ing) return 0;
    return quantity * ing.costPerUnit;
  };

  const handleLogWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngId || quantity <= 0) return;
    
    const ing = ingredients.find(i => i.id === selectedIngId);
    if (!ing) return;

    if (quantity > ing.currentStock) {
      alert('الكمية المهدورة أكبر من المخزون المتوفر!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<WasteLog, 'id' | 'loggedAt'> = {
        ingredientId: selectedIngId,
        name: ing.name,
        quantity,
        unit: ing.unit,
        reason,
        cost: Number((quantity * ing.costPerUnit).toFixed(2))
      };

      await createWasteLogTransaction(payload);
      
      // Reset
      setSelectedIngId('');
      setQuantity(1);
      setShowWasteModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const ingId = 'ing-' + Math.random().toString(36).substr(2, 9);
      const newIng: Ingredient = {
        id: ingId,
        name,
        unit,
        currentStock: Number(initStock),
        minStock: Number(minStock),
        costPerUnit: Number(initCost),
        supplierId: supplierId || undefined
      };

      await setDoc(doc(db, 'ingredients', ingId), newIng);
      
      setName('');
      setShowAddIngModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 font-sans" dir="rtl">
      
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <RefreshCw className="text-blue-600 animate-spin-slow" />
            <span>لوحة المكونات وحركات المخازن المستودعية (Inventory Audit)</span>
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">تتبع الميزان المخزني المتوفر، تسوية الفاقد والهدر، وجرد المكونات بالتوافق مع BOM الكاشير.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowWasteModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow"
          >
            <Trash size={16} />
            <span>تسجيل هدر وتلف مواد</span>
          </button>
          
          <button
            onClick={() => setShowAddIngModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow"
          >
            <Plus size={16} />
            <span>تعريف بطاقة مكون جديد</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left main stock card view (Col Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-right border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold">
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4.5">اسم المادة الخام</th>
                  <th className="px-6 py-4.5">وحدة قياس</th>
                  <th className="px-6 py-4.5">المخزون الفعلي</th>
                  <th className="px-6 py-4.5">الحد الأدنى للإنذار</th>
                  <th className="px-6 py-4.5">متوسط كلفة الشراء</th>
                  <th className="px-6 py-4.5 text-center">الإنذار بالتعبئة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs font-semibold">
                {ingredients.map((ing) => {
                  const isLow = ing.currentStock <= ing.minStock;
                  return (
                    <tr key={ing.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {ing.name}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {ing.unit}
                      </td>
                      <td className={`px-6 py-4 font-bold font-mono ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                        {ing.currentStock.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono">
                        {ing.minStock.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">
                        {ing.costPerUnit.toFixed(2)} ر.س
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                          isLow 
                            ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {isLow ? 'تحت مستوى إنذار الطلب!' : 'آمن ومستقر'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side waste logs register tracker (Col Span 1) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">التلفيات والهدر ومطالبات الزبد المسجلة</h3>
            <p className="text-slate-400 text-[10px] mt-0.5">سجل الهدم الطارئ للمواد والمكونات.</p>
          </div>

          <div className="space-y-4 max-h-[360px] overflow-y-auto">
            {wasteLogs.map((log) => {
              const reasonLabels = {
                Spoiled: 'ملوث / تالف',
                Spilled: 'مسكوب مخرب',
                Expired: 'منتهي الفعالية',
                Other: 'أسباب أخرى'
              };

              return (
                <div key={log.id} className="p-3 bg-red-50/50 border border-red-100/30 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-slate-800">{log.name}</span>
                    <span className="text-rose-700 font-mono">{log.cost.toFixed(2)} ر.س</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>الكمية: {log.quantity} {log.unit}</span>
                    <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[9px]">
                      {reasonLabels[log.reason] || log.reason}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-1.5">
                    {log.loggedAt ? new Date(log.loggedAt).toLocaleDateString('ar-SA') : ''}
                  </div>
                </div>
              );
            })}

            {wasteLogs.length === 0 && (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <AlertCircle size={36} className="mx-auto opacity-20" />
                <p className="text-xs font-semibold">لا يوجد أي عمليات هدر اليوم</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Spoilage / Waste Dialog Modal */}
      <AnimatePresence>
        {showWasteModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowWasteModal(false)}
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full relative z-10 shadow-2xl font-sans"
            >
              <h3 className="text-lg font-black text-slate-800 mb-2">تسجيل هدر مستودعي كلفوي وتلفيات</h3>
              <p className="text-xs text-slate-400 mb-6">يتم سحب الكمية من بطاقة المادة لتأثيث قيد تلف آلي بالـ الجورنال.</p>

              <form onSubmit={handleLogWaste} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-500">حدد المكون التالف:</label>
                  <select
                    required
                    value={selectedIngId}
                    onChange={(e) => setSelectedIngId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-extrabold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">-- اختر مكون تالف --</option>
                    {ingredients.map(ing => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} (المتوفر: {ing.currentStock.toFixed(1)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">الكمية المسحوبة تالفة:</label>
                    <input 
                      type="number"
                      step="any"
                      min={0.001}
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-extrabold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">طبيعة وسبب الهدر والخسارة:</label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-extrabold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="Spoiled">Spoiled - تلف أو تعفن</option>
                      <option value="Expired">Expired - منتهي الصلاحية</option>
                      <option value="Spilled">Spilled - انسكاب أو كسر</option>
                      <option value="Other">Other - أسباب تشغيلية</option>
                    </select>
                  </div>
                </div>

                {/* Simulated live valuation */}
                <div className="bg-slate-50 p-3 rounded-lg flex justify-between text-xs font-bold text-slate-600 border border-slate-100">
                  <span>إجمالي كلفة الفاقد المالي:</span>
                  <span className="text-rose-600 font-mono font-black">{currentWastedVal().toFixed(2)} ر.س</span>
                </div>

                <div className="text-[10px] text-amber-600 font-bold leading-relaxed bg-amber-50 p-3 rounded-lg border border-amber-140/30">
                  ⚠️ الأتمتة المبرمجة:
                  <br />
                  <span className="text-slate-500 font-medium block">تخفيض المخزن + توليد وتغذية قيد يومية تلقائياً:</span>
                  <span className="text-indigo-600 font-extrabold block">مدين (مصاريف تلفيات) &larr; دائن (المخزون)</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWasteModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    إلغاء والعودة
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {isSubmitting ? 'تحميل...' : 'تسوية قيد الهدر'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add New Ingredient dialog modal */}
      <AnimatePresence>
        {showAddIngModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowAddIngModal(false)}
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full relative z-10 shadow-2xl font-sans"
            >
              <h3 className="text-lg font-black text-slate-800 mb-2">تأسيس بطاقة مادة تداول خام</h3>
              <p className="text-xs text-slate-400 mb-6">تسجيل مادة جديدة لجدول استهلاك الـ Recipes وترصيد المستودعات.</p>

              <form onSubmit={handleAddIngredient} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-500">اسم المادة بمواصفاتها:</label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: دجاج صدر وطني مبرد"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-extrabold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">وحدة قياس الجرد:</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-extrabold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="kg">كجم (kg)</option>
                      <option value="g">جرام (g)</option>
                      <option value="liter">لتر (liter)</option>
                      <option value="piece">قطعة (piece)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">حد الطلب (إنذار النقص):</label>
                    <input 
                      type="number" 
                      required
                      min={1}
                      value={minStock}
                      onChange={(e) => setMinStock(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-400">الرصيد الأولي:</label>
                    <input 
                      type="number" 
                      required
                      min={0}
                      value={initStock}
                      onChange={(e) => setInitStock(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-400">الكلفة المعيارية:</label>
                    <input 
                      type="number" 
                      required
                      min={0}
                      value={initCost}
                      onChange={(e) => setInitCost(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-400">المورد المفترض:</label>
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="w-full px-2 py-1.5 text-[10.5px] font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="">-- مورد --</option>
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name.split(' ')[0]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddIngModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    تراجع
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-850 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    <span>تأسيس المادة</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  ShoppingBag, 
  Users, 
  Clock, 
  FileText, 
  Calendar,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Tag,
  Printer
} from 'lucide-react';
import { Ingredient, Supplier, PurchaseInvoice, PurchaseInvoiceItem } from '../types';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { addPurchaseInvoiceTransaction } from '../lib/db-service';
import { motion, AnimatePresence } from 'motion/react';

interface ProcurementViewProps {
  ingredients: Ingredient[];
  suppliers: Supplier[];
  purchases: PurchaseInvoice[];
  onRefresh: () => void;
}

export const ProcurementView: React.FC<ProcurementViewProps> = ({
  ingredients,
  suppliers,
  purchases,
  onRefresh
}) => {
  // Modal for adding invoices
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>('Paid');
  const [invoiceItems, setInvoiceItems] = useState<PurchaseInvoiceItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePrintInvoice, setActivePrintInvoice] = useState<PurchaseInvoice | null>(null);

  // Selector controls inside dialog
  const [selectedIngId, setSelectedIngId] = useState('');
  const [qty, setQty] = useState(10);
  const [pricePerUnit, setPricePerUnit] = useState(15);

  // Supplier Creation Modal
  const [showNewSup, setShowNewSup] = useState(false);
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');

  const handleAddInvoiceItem = () => {
    if (!selectedIngId) return;
    const ing = ingredients.find(i => i.id === selectedIngId);
    if (!ing) return;

    if (invoiceItems.some(item => item.ingredientId === selectedIngId)) {
      alert('تم إرفاق هذه المادة الخام بالفعل!');
      return;
    }

    setInvoiceItems(prev => [
      ...prev,
      {
        ingredientId: selectedIngId,
        name: ing.name,
        quantity: qty,
        unit: ing.unit,
        pricePerUnit,
        total: Number((qty * pricePerUnit).toFixed(2))
      }
    ]);

    setSelectedIngId('');
  };

  const handleRemoveInvoiceItem = (idx: number) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleRegisterInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber || !selectedSupplierId || invoiceItems.length === 0) {
      alert('يرجى تهيئة رقم الفاتورة والتمجيد بمكون غذائي واحد على الأقل للمخازن!');
      return;
    }

    const sup = suppliers.find(s => s.id === selectedSupplierId);
    if (!sup) return;

    setIsSubmitting(true);
    try {
      const payload: Omit<PurchaseInvoice, 'id'> = {
        invoiceNumber,
        supplierId: selectedSupplierId,
        supplierName: sup.name,
        date: new Date().toISOString(),
        items: invoiceItems,
        totalAmount: invoiceItems.reduce((sum, item) => sum + item.total, 0),
        paymentStatus
      };

      await addPurchaseInvoiceTransaction(payload);
      
      // Reset
      setInvoiceNumber('');
      setInvoiceItems([]);
      setShowAddInvoice(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء رصد الفاتورة وتثبيتها بالدفاتر آلياً');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName) return;

    try {
      const supId = 'sup-' + Math.random().toString(36).substr(2, 9);
      const newSupplier: Supplier = {
        id: supId,
        name: supName,
        contactPerson: supContact,
        phone: supPhone,
        email: supEmail,
        address: supAddress
      };

      await setDoc(doc(db, 'suppliers', supId), newSupplier);
      
      // Reset
      setSupName('');
      setSupContact('');
      setSupPhone('');
      setSupEmail('');
      setSupAddress('');
      setShowNewSup(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const totalInvoiceSum = invoiceItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-8 font-sans" dir="rtl">
      
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="text-blue-600" />
            <span>نظام المشتريات وفواتير الموردين (Vendor Procurements)</span>
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">تسجيل فواتير مدخلات المستودع وتحديث أوتوماتيكي لأسعار التكلفة المتوسطة والالتزامات المالية للموردين.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowNewSup(true)}
            className="bg-slate-900 border border-slate-950 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow"
          >
            <Users size={16} />
            <span>تعريف مورد جديد</span>
          </button>
          
          <button
            onClick={() => setShowAddInvoice(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-105 cursor-pointer"
          >
            <Plus size={16} />
            <span>تسجيل فاتورة شراء واردة</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left main invoices history (Col Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-xs">أرشيف فواتير التوريد المقيدة</h3>
            </div>
            
            <table className="w-full text-right border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold">
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4">رقم الفاتورة</th>
                  <th className="px-6 py-4">المورد الشريك</th>
                  <th className="px-6 py-4">تاريخ التوريد</th>
                  <th className="px-6 py-4">المبلغ المستحق</th>
                  <th className="px-6 py-4">تسوية الدفع</th>
                  <th className="px-6 py-4 text-center">أثر المخزون</th>
                  <th className="px-6 py-4 text-center">طابعة السند</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs font-semibold">
                {purchases.map((pi) => (
                  <tr key={pi.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-blue-600 font-mono">
                      {pi.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-bold">
                      {pi.supplierName}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      {new Date(pi.date).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 text-slate-950 font-mono font-bold">
                      {pi.totalAmount.toFixed(2)} ر.س
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        pi.paymentStatus === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-rose-50 text-rose-750 border-rose-200'
                      }`}>
                        {pi.paymentStatus === 'Paid' ? 'مسددة بالكامل' : 'ذمم دائنة (أجل)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-[10px] text-slate-400">
                      تم تجديد مستويات الأغذية
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setActivePrintInvoice(pi)}
                        className="p-1 px-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer border border-blue-100/30"
                        title="طباعة وتحميل تفاصيل الفاتورة"
                      >
                        <Printer size={12} />
                        <span>طباعة</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {purchases.length === 0 && (
                  <tr className="p-12 text-center text-slate-450 font-medium">
                    <td colSpan={7} className="py-12">لا توجد أي فواتير مقيدة حتى اليوم.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side supplier directories card (Col Span 1) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 text-sm font-sans flex items-center gap-1">
              <Users size={16} className="text-slate-500" />
              <span>دليل الموردين المعتمدين</span>
            </h3>
            <p className="text-slate-400 text-[10px] mt-0.5">بيانات وسجلات اتصال وكلاء توريد الأغذية.</p>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto">
            {suppliers.map((sup) => (
              <div key={sup.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs font-black text-slate-800 border-b border-slate-200/50 pb-1.5">
                  <span>{sup.name}</span>
                  <span className="text-[9px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-sans font-bold">وكيل معزز</span>
                </div>
                
                <div className="text-[10px] text-slate-500 space-y-1">
                  <p>الشخص المسؤول: <strong>{sup.contactPerson}</strong></p>
                  <p>رقم الجوال: <strong className="font-sans text-slate-600">{sup.phone}</strong></p>
                  <p>البريد الإلكتروني: <strong className="font-sans text-slate-600">{sup.email}</strong></p>
                  {sup.address && <p>العنوان: {sup.address}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Purchase Invoice Registration popup modal */}
      <AnimatePresence>
        {showAddInvoice && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowAddInvoice(false)}
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-xl w-full relative z-10 shadow-2xl h-[90vh] flex flex-col font-sans"
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-lg font-black text-slate-800">قيد فاتورة شراء وتحديث المخزون</h3>
                <span className="p-1 px-3 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">برنامج التوريدات</span>
              </div>

              <form onSubmit={handleRegisterInvoice} className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">رقم الفاتورة المرجعي للمورد:</label>
                    <input 
                      type="text" 
                      required
                      placeholder="مثال: PINV-2026-88"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-extrabold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">اختر المورد الشريك:</label>
                    <select
                      required
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-extrabold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    >
                      <option value="">-- حدد المورد --</option>
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-500">حالة سداد قيمة الفاتورة:</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1 text-xs font-extrabold text-slate-800">
                      <input 
                        type="radio" 
                        name="paystatus" 
                        checked={paymentStatus === 'Paid'} 
                        onChange={() => setPaymentStatus('Paid')} 
                      />
                      <span>مسددة نقداً ومستحقة الدفع (Cash)</span>
                    </label>
                    <label className="flex items-center gap-1 text-xs font-extrabold text-slate-800">
                      <input 
                        type="radio" 
                        name="paystatus" 
                        checked={paymentStatus === 'Unpaid'} 
                        onChange={() => setPaymentStatus('Unpaid')} 
                      />
                      <span>آجل بالذمم الدائنة الموردين (Debit Vendor)</span>
                    </label>
                  </div>
                </div>

                {/* Grid add row BOM purchase items */}
                <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 space-y-4">
                  <h4 className="text-xs font-black text-slate-800">تفاصيل توريد المواد الخام للمستودع:</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <label className="text-[10px] text-slate-500">اختر مادة خام مخزنية:</label>
                      <select
                        value={selectedIngId}
                        onChange={(e) => setSelectedIngId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-extrabold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      >
                        <option value="">-- حدد المكون عذائيات --</option>
                        {ingredients.map(ing => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500">الكمية الواردة:</label>
                      <input 
                        type="number"
                        min={0.001}
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-extrabold text-slate-800 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500">سعر الوحدة الشراء:</label>
                      <div className="flex gap-1.5">
                        <input 
                          type="number"
                          min={0.01}
                          value={pricePerUnit}
                          onChange={(e) => setPricePerUnit(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs font-extrabold text-slate-800 bg-white border border-slate-200 rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={handleAddInvoiceItem}
                          className="p-2.5 bg-blue-600 text-white rounded-xl text-xs font-extrabold cursor-pointer shrink-0"
                        >
                          إضافة
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* List of items decision */}
                  <div className="space-y-1.5">
                    {invoiceItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-100 text-xs">
                        <span className="font-extrabold text-slate-700">{item.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-slate-400">
                            {item.quantity} {item.unit} @ {item.pricePerUnit} ر.س
                          </span>
                          <span className="font-mono font-black text-slate-800">{item.total} ر.س</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveInvoiceItem(idx)}
                            className="text-rose-600 hover:bg-rose-50 p-1 rounded"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {invoiceItems.length === 0 && (
                      <div className="text-center py-6 text-[10px] text-slate-400 font-medium">
                        حدد مواد التوريد وكمياتها لبناء الفاتورة!
                      </div>
                    )}
                  </div>
                </div>

                {/* Live total breakdown */}
                <div className="bg-slate-50 p-3 rounded-lg flex justify-between text-xs font-bold text-slate-600 border border-slate-100">
                  <span>إجمالي قيمة الفاتورة:</span>
                  <span className="text-blue-600 font-mono font-black">{totalInvoiceSum.toFixed(2)} ر.س</span>
                </div>

                <div className="text-[10px] text-emerald-800 font-bold bg-emerald-55 border border-emerald-110/30 p-2.5 rounded-lg leading-relaxed">
                  🔐 الأتمتة المبرمجة بالكامل:
                  <br />
                  <span className="text-slate-500 font-medium block">تثبيت وزيادة مخزن المستودعات + تسعير الكلفة في متوسط ترجيحي + توليد القيد:</span>
                  <span className="text-indigo-600 font-extrabold block">مدين (مخزون الأغذية) &larr; دائن (الصندوق كاش أو الموردين أجل)</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddInvoice(false)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    تراجع
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? 'جاري الرصد...' : 'رصد وضخ للمخازن'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Supplier Register Modal popup */}
      <AnimatePresence>
        {showNewSup && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowNewSup(false)}
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full relative z-10 shadow-2xl font-sans"
            >
              <h3 className="text-lg font-black text-slate-800 mb-2">تعريف بطاقة مورد تجاري شريك</h3>
              <p className="text-xs text-slate-400 mb-6">تبويب موردين السلع الغذائية والمكونات لعمل موازنات الأسعار.</p>

              <form onSubmit={handleRegisterSupplier} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-500">اسم المؤسسة أو المورد المعتمد:</label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: شركة اللحوم الفاخرة المحدودة"
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-extrabold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">اسم مدير المبيعات المسؤول:</label>
                    <input 
                      type="text" 
                      required
                      placeholder="مثال: ريان الشمراني"
                      value={supContact}
                      onChange={(e) => setSupContact(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">رقم جوال للتواصل:</label>
                    <input 
                      type="text" 
                      required
                      placeholder="9665..."
                      value={supPhone}
                      onChange={(e) => setSupPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-sans text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-500">البريد الإلكتروني المالي:</label>
                  <input 
                    type="email" 
                    required
                    placeholder="finance@vendor.com"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-sans text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-500">العنوان اللوجستي الرئيسي (اختياري):</label>
                  <input 
                    type="text" 
                    placeholder="الرياض، السلي، مستودعات اللحوم"
                    value={supAddress}
                    onChange={(e) => setSupAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewSup(false)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    تراجع
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-850 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check size={14} />
                    <span>حفظ المورد</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Preview and Action Modal */}
      <AnimatePresence>
        {activePrintInvoice && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 no-print">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setActivePrintInvoice(null)}
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-950 rounded-3xl p-6 max-w-2xl w-full relative z-10 shadow-2xl h-[85vh] flex flex-col font-sans border border-slate-800 text-white"
            >
              <div className="flex justify-between items-center mb-4 shrink-0 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <Printer size={16} className="text-blue-500" />
                    <span>تنظيم المستند - معاينة الطباعة للفاتورة</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">سند الفاتورة {activePrintInvoice.invoiceNumber}</p>
                </div>
                <button 
                  onClick={() => setActivePrintInvoice(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-xl text-xs font-bold font-sans cursor-pointer"
                >
                  إغلاق المعاينة
                </button>
              </div>

              {/* Screen Preview Paper Sheet */}
              <div className="flex-1 overflow-y-auto bg-white text-slate-900 p-8 rounded-2xl border border-slate-200 shadow-inner scale-100 max-w-full">
                {/* Print Sheet Template */}
                <div className="space-y-6 text-[11px]" dir="rtl">
                  {/* Header */}
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900 font-sans">مطعم برج المنوفية</h4>
                      <p className="text-[9px] text-slate-500 font-bold">شركة Estadat المحدودة لخدمات الأغذية والمشروبات</p>
                      <p className="text-[9px] text-slate-400">فرع الرياض الرئيسي | الرقم الضريبي: 300482910300003</p>
                    </div>
                    <div className="text-left space-y-0.5">
                      <div className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black text-slate-800 inline-block font-sans">
                        سند توريد مستودعي
                      </div>
                      <p className="font-mono text-[9px] text-slate-550 mt-1">تاريخ الطباعة: {new Date().toLocaleString('ar-SA')}</p>
                    </div>
                  </div>

                  {/* Meta Grid */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="space-y-1">
                      <p className="text-slate-500 font-medium">رقم الفاتورة المرجعي: <strong className="font-mono text-slate-900">{activePrintInvoice.invoiceNumber}</strong></p>
                      <p className="text-slate-500 font-medium">تاريخ الفاتورة: <strong className="font-mono text-slate-800">{new Date(activePrintInvoice.date).toLocaleDateString('ar-SA')} ({new Date(activePrintInvoice.date).toLocaleTimeString('ar-SA')})</strong></p>
                      <p className="text-slate-500 font-medium">المورد السلعي: <strong className="text-slate-900 font-bold">{activePrintInvoice.supplierName}</strong></p>
                    </div>
                    <div className="space-y-1 text-left">
                      <p className="text-slate-500 font-medium">المستودع الوجهة: <strong className="text-slate-800 font-bold">مستودع السلع والمكونات (Al-Suwaidi)</strong></p>
                      <p className="text-slate-500 font-medium">حالة السداد الدفتري:&nbsp;
                        <span className={`inline-block mr-1 px-2 py-0.5 rounded text-[9px] font-black ${
                          activePrintInvoice.paymentStatus === 'Paid' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {activePrintInvoice.paymentStatus === 'Paid' ? 'نقدي مسدد من الصندوق' : 'آجل بالذمم الموردين'}
                        </span>
                      </p>
                      <p className="text-slate-500 font-medium">الأثر المحاسبي: <strong className="text-indigo-600 font-bold">قيد يومي ذكي تلقائي</strong></p>
                    </div>
                  </div>

                  {/* Materials list */}
                  <div className="space-y-1.5">
                    <h5 className="font-bold text-slate-800">بيانات المواد الخام الموردة:</h5>
                    <table className="w-full text-right border-collapse border border-slate-100">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 text-[10px] border-b border-slate-200">
                          <th className="p-2 border border-slate-200 text-center">م</th>
                          <th className="p-2 border border-slate-200">اسم المادة والمكون الغذائي</th>
                          <th className="p-2 border border-slate-200 text-center">الكمية</th>
                          <th className="p-2 border border-slate-200 text-center">الوحدة</th>
                          <th className="p-2 border border-slate-200 text-left">سعر الوحدة</th>
                          <th className="p-2 border border-slate-200 text-left">الإجمالي الصافي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activePrintInvoice.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/40 text-[9px]">
                            <td className="p-2 border border-slate-150 font-mono text-center text-slate-400">{idx + 1}</td>
                            <td className="p-2 border border-slate-150 font-bold text-slate-800">{item.name}</td>
                            <td className="p-2 border border-slate-150 font-mono text-center text-slate-800">{item.quantity}</td>
                            <td className="p-2 border border-slate-150 text-center text-slate-500">{item.unit || 'كجم'}</td>
                            <td className="p-2 border border-slate-150 font-mono text-left text-slate-600">{item.pricePerUnit.toFixed(2)} ر.س</td>
                            <td className="p-2 border border-slate-150 font-mono text-left font-bold text-slate-950">{item.total.toFixed(2)} ر.س</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary / Total block */}
                  <div className="flex justify-between items-start pt-2">
                    <div className="text-[8px] text-slate-400 leading-relaxed max-w-[280px]">
                      * تم تسجيل المكونات وزيادة مخزونات BOM آلياً.
                      <br />
                      * تم إلحاق قيد التوريد بدفتر الأستاذ العام وتحديث متوسط سعر التكلفة المرجح.
                    </div>
                    <div className="w-[200px] space-y-1 text-left">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>قيمة التوريد قبل الضريبة:</span>
                        <span className="font-mono">{(activePrintInvoice.totalAmount / 1.15).toFixed(2)} ر.س</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>ضريبة القيمة المضافة (15%):</span>
                        <span className="font-mono">{(activePrintInvoice.totalAmount - (activePrintInvoice.totalAmount / 1.15)).toFixed(2)} ر.س</span>
                      </div>
                      <div className="border-t border-slate-300 pt-1 flex justify-between text-xs font-black text-slate-950 bg-slate-100 p-1 rounded">
                        <span>الصافي الإجمالي:</span>
                        <span className="font-mono">{activePrintInvoice.totalAmount.toFixed(2)} ر.س</span>
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-3 gap-4 pt-8 text-center text-[9px] text-slate-500">
                    <div className="space-y-6">
                      <p className="font-bold">أمين المستودع المستلم</p>
                      <p className="border-b border-dashed border-slate-300 w-32 mx-auto"></p>
                    </div>
                    <div className="space-y-6">
                      <p className="font-bold">المحاسب المالي المدقق</p>
                      <p className="border-b border-dashed border-slate-300 w-32 mx-auto"></p>
                    </div>
                    <div className="space-y-6">
                      <p className="font-bold">الرئيس التنفيذي / المدير المعتمد</p>
                      <p className="border-b border-dashed border-slate-300 w-32 mx-auto"></p>
                    </div>
                  </div>

                  {/* Footer declaration */}
                  <div className="text-center pt-6 text-[8px] text-slate-400 border-t border-slate-100">
                    نظام برج المنوفية المالي والمحاسبي المتكامل - شركة Estadat للاستثمارت الرياضية والغذائية والترفيهية
                  </div>
                </div>
              </div>

              {/* Modal footer print buttons */}
              <div className="flex gap-4 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setActivePrintInvoice(null)}
                  className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs cursor-pointer hover:bg-slate-700"
                >
                  إلغاء وتراجع
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-900/30"
                >
                  <Printer size={15} />
                  <span>بدء الطباعة الفعلية</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Embedded print structure completely rendered separate for @media print query */}
      {activePrintInvoice && (
        <div id="invoice-print-area" className="hidden print:block font-sans rtl leading-relaxed text-slate-900 bg-white" dir="rtl">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div className="space-y-1">
              <h4 className="text-lg font-black text-slate-900">مطعم برج المنوفية</h4>
              <p className="text-[11px] text-slate-600 font-bold">شركة Estadat المحدودة لخدمات الأغذية والمشروبات</p>
              <p className="text-[10px] text-slate-500">الرقم الضريبي لشركة الاستثمار: 300482910300003</p>
              <p className="text-[10px] text-slate-500">العنوان: فرع الرياض الرئيسي، المملكة العربية السعودية</p>
            </div>
            <div className="text-left space-y-1">
              <div className="bg-slate-100 px-3 py-1 rounded text-xs font-black text-slate-950 inline-block border border-slate-200">
                سند توريد مستودعي
              </div>
              <p className="font-mono text-[9px] text-slate-500 mt-1">تاريخ الطباعة: {new Date().toLocaleString('ar-SA')}</p>
            </div>
          </div>

          <div className="h-4"></div>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1.5 text-xs text-slate-800">
              <p>رقم الفاتورة المرجعي: <strong className="font-mono text-slate-950 text-sm">{activePrintInvoice.invoiceNumber}</strong></p>
              <p>تاريخ الفاتورة: <strong className="font-mono">{new Date(activePrintInvoice.date).toLocaleDateString('ar-SA')} ({new Date(activePrintInvoice.date).toLocaleTimeString('ar-SA')})</strong></p>
              <p>المورد السلعي: <strong className="text-slate-950">{activePrintInvoice.supplierName}</strong></p>
            </div>
            <div className="space-y-1.5 text-left text-xs text-slate-800">
              <p>المستودع الوجهة: <strong>مستودع السلع والمكونات (Al-Suwaidi)</strong></p>
              <p>حالة السداد الدفتري: 
                <span className="inline-block mr-1 font-bold">
                  {activePrintInvoice.paymentStatus === 'Paid' ? 'نقدي مسدد من الصندوق' : 'آجل بالذمم الموردين'}
                </span>
              </p>
              <p>الأثر المحاسبي: <strong>قيد يومي ذكي تلقائي بالدفاتر</strong></p>
            </div>
          </div>

          <div className="h-6"></div>

          {/* Materials list */}
          <div className="space-y-2">
            <h5 className="font-bold text-slate-900 text-sm">بيانات المواد الخام الموردة:</h5>
            <table className="w-full text-right border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-[11px] font-bold border-b border-slate-300">
                  <th className="p-2.5 border border-slate-300 text-center w-8">م</th>
                  <th className="p-2.5 border border-slate-300">اسم المادة والمكون الغذائي</th>
                  <th className="p-2.5 border border-slate-300 text-center">الكمية</th>
                  <th className="p-2.5 border border-slate-300 text-center">الوحدة</th>
                  <th className="p-2.5 border border-slate-300 text-left">سعر الوحدة</th>
                  <th className="p-2.5 border border-slate-300 text-left">الإجمالي الصافي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {activePrintInvoice.items.map((item, idx) => (
                  <tr key={idx} className="text-xs">
                    <td className="p-2.5 border border-slate-300 font-mono text-center text-slate-600">{idx + 1}</td>
                    <td className="p-2.5 border border-slate-300 font-bold text-slate-900">{item.name}</td>
                    <td className="p-2.5 border border-slate-300 font-mono text-center text-slate-900">{item.quantity}</td>
                    <td className="p-2.5 border border-slate-300 text-center text-slate-600">{item.unit || 'كجم'}</td>
                    <td className="p-2.5 border border-slate-300 font-mono text-left text-slate-700">{item.pricePerUnit.toFixed(2)} ر.س</td>
                    <td className="p-2.5 border border-slate-300 font-mono text-left font-bold text-slate-950">{item.total.toFixed(2)} ر.s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="h-6"></div>

          {/* Summary / Total block */}
          <div className="flex justify-between items-start pt-4 border-t border-slate-200">
            <div className="text-[10px] text-slate-500 leading-relaxed max-w-[320px] space-y-1 font-semibold">
              <p>* تم تشغيل الأتمتة المبرمجة وزيادة مستويات مخزونات BOM آلياً.</p>
              <p>* تم إلحاق قيد التوريد بدفتر الأستاذ العام وتحديث متوسط سعر التكلفة المرجح.</p>
            </div>
            <div className="w-[240px] space-y-1.5 text-left text-xs">
              <div className="flex justify-between font-bold text-slate-750">
                <span>قيمة التوريد قبل الضريبة:</span>
                <span className="font-mono">{(activePrintInvoice.totalAmount / 1.15).toFixed(2)} ر.س</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ضريبة القيمة المضافة (15%):</span>
                <span className="font-mono">{(activePrintInvoice.totalAmount - (activePrintInvoice.totalAmount / 1.15)).toFixed(2)} ر.س</span>
              </div>
              <div className="border-t border-slate-400 pt-2 flex justify-between text-sm font-black text-slate-950 bg-slate-100 p-2 rounded">
                <span>الصافي الإجمالي:</span>
                <span className="font-mono">{activePrintInvoice.totalAmount.toFixed(2)} ر.س</span>
              </div>
            </div>
          </div>

          <div className="h-10"></div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-12 text-center text-xs text-slate-800">
            <div className="space-y-8">
              <p className="font-bold">أمين المستودع المستلم</p>
              <p className="border-b border-dashed border-slate-400 w-44 mx-auto"></p>
            </div>
            <div className="space-y-8">
              <p className="font-bold">المحاسب المالي المدقق</p>
              <p className="border-b border-dashed border-slate-400 w-44 mx-auto"></p>
            </div>
            <div className="space-y-8">
              <p className="font-bold">الرئيس التنفيذي / المدير المعتمد</p>
              <p className="border-b border-dashed border-slate-400 w-44 mx-auto"></p>
            </div>
          </div>

          <div className="h-12"></div>

          {/* Footer declaration */}
          <div className="text-center pt-6 text-[10px] text-slate-500 border-t border-slate-200">
            نظام برج المنوفية المالي والمحاسبي المتكامل - شركة Estadat للاستثمارت الرياضية والغذائية والترفيهية
          </div>
        </div>
      )}

      {activePrintInvoice && (
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            /* General page setup */
            @page {
              size: A4;
              margin: 1.5cm;
            }
            body * {
              visibility: hidden !important;
            }
            #invoice-print-area, #invoice-print-area * {
              visibility: visible !important;
            }
            #invoice-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              display: block !important;
              background: white !important;
              color: black !important;
              direction: rtl !important;
              font-family: 'Inter', system-ui, sans-serif !important;
              font-size: 11px !important;
              line-height: 1.5 !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}} />
      )}

    </div>
  );
};

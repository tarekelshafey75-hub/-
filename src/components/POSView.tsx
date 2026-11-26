import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  CreditCard, 
  DollarSign, 
  ChefHat, 
  AlertCircle, 
  Users, 
  HelpCircle,
  Clock,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem, TableItem, POSItem, RestaurantOrder } from '../types';
import { recordSalesReceiptTransaction } from '../lib/db-service';

interface POSViewProps {
  menuItems: MenuItem[];
  tables: TableItem[];
  ingredientsCount: number; // to warn if out of ingredients
  onSuccess: () => void;
}

export const POSView: React.FC<POSViewProps> = ({
  menuItems,
  tables,
  ingredientsCount,
  onSuccess
}) => {
  // POS States
  const [cart, setCart] = useState<POSItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [orderType, setOrderType] = useState<'Dine-in' | 'Takeaway' | 'Delivery'>('Dine-in');
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [customerName, setCustomerName] = useState('');
  
  // Checkout Modal
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Foodics'>('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  
  // Bill splitting
  const [showSplitter, setShowSplitter] = useState(false);
  const [splitCount, setSplitCount] = useState(2);

  // Filters
  const categories = ['الكل', ...Array.from(new Set(menuItems.map(m => m.category)))];
  
  const filteredItems = menuItems.filter(item => {
    return (selectedCategory === 'الكل' || item.category === selectedCategory) && item.active;
  });

  // Cart operations
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(p => p.menuItemId === item.id);
      if (existing) {
        return prev.map(p => p.menuItemId === item.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
    
    // Play subtle audio sound or visual effect if wanted (simulated)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 600;
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      // Audio might fail due to user gesture requirements, ignore
    }
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => {
      const existing = prev.find(p => p.menuItemId === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map(p => p.menuItemId === menuItemId ? { ...p, quantity: p.quantity - 1 } : p);
      }
      return prev.filter(p => p.menuItemId !== menuItemId);
    });
  };

  const plusQuantity = (menuItemId: string) => {
    setCart(prev => prev.map(p => p.menuItemId === menuItemId ? { ...p, quantity: p.quantity + 1 } : p));
  };

  const clearCart = () => setCart([]);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.15; // 15% VAT
  const total = subtotal + tax;

  // Split bill formula
  const splitAmount = total / splitCount;

  // Hotkeys simulation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Trigger checkout with F8
      if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) setShowCheckout(true);
      }
      // Clear cart with escape when not checkout
      if (e.key === 'Escape' && !showCheckout && !showSplitter) {
        e.preventDefault();
        clearCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, showCheckout, showSplitter]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    
    try {
      // Build order payload conforming to RestaurantOrder schema
      const orderPayload: Omit<RestaurantOrder, 'id' | 'orderNumber'> = {
        type: orderType,
        tableId: orderType === 'Dine-in' ? selectedTable?.id : undefined,
        tableNumber: orderType === 'Dine-in' ? selectedTable?.number : undefined,
        customerName: orderType !== 'Dine-in' ? customerName : undefined,
        items: cart,
        subtotal: Number(subtotal.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        total: Number(total.toFixed(2)),
        paymentMethod,
        paymentStatus: 'Paid', // instantly paid at POS checkout
        status: 'Pending', // Sent to KDS
        createdAt: new Date().toISOString()
      };
      
      const res = await recordSalesReceiptTransaction(orderPayload);
      
      setCheckoutSuccess(res.orderNumber);
      setCart([]);
      setSelectedTable(null);
      setCustomerName('');
      
      onSuccess(); // call active tabs refresher
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ الفاتورة وطرح المكونات من المخزن. يرجى مراجعة قيم المكونات المتوفرة!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-130px)] font-sans" dir="rtl">
      
      {/* Left Menu Items Grid (Col Span 8) */}
      <div className="lg:col-span-8 flex flex-col space-y-6 overflow-y-auto pr-1">
        
        {/* UPPER POS CONFIG: order types & table indicators */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-5 items-center justify-between">
          <div className="flex gap-2">
            {[
              { id: 'Dine-in', label: 'أكل محلي', desc: 'Dine-in' },
              { id: 'Takeaway', label: 'سفري خارج المطعم', desc: 'Takeaway' },
              { id: 'Delivery', label: 'توصيل دليفري', desc: 'Delivery' }
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setOrderType(type.id as any);
                  if (type.id !== 'Dine-in') setSelectedTable(null);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border ${
                  orderType === type.id 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100' 
                    : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                }`}
              >
                <div>{type.label}</div>
                <div className="text-[10px] opacity-60 font-mono font-medium">{type.desc}</div>
              </button>
            ))}
          </div>

          {/* Conditional Input */}
          {orderType === 'Dine-in' ? (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
              <span className="text-xs text-slate-400 font-bold ml-1.5 shrink-0">اختر الطاولة:</span>
              {tables.map((table) => {
                const isSelected = selectedTable?.id === table.id;
                const isOccupied = table.status === 'Occupied';
                return (
                  <button
                    key={table.id}
                    onClick={() => {
                      if (!isOccupied) setSelectedTable(table);
                    }}
                    disabled={isOccupied && !isSelected}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 ${
                      isSelected 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100' 
                        : isOccupied 
                          ? 'bg-rose-50 text-rose-500 border-rose-100 cursor-not-allowed opacity-60' 
                          : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {table.number.split(' (')[0]}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="w-full md:w-60">
              <input
                type="text"
                placeholder="اسم العميل أو عنوان التوصيل..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          )}
        </div>

        {/* Category Filters row */}
        <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold border transition-all whitespace-nowrap ${
                selectedCategory === cat 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                  : 'bg-white border-slate-200/80 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 flex-1">
          {filteredItems.map((item) => (
            <motion.div
              layout
              key={item.id}
              onClick={() => addToCart(item)}
              whileTap={{ scale: 0.96 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer group hover:shadow-md transition-all flex flex-col justify-between"
            >
              {item.image && (
                <div className="h-28 overflow-hidden bg-slate-100 relative">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded-md font-bold backdrop-blur-sm">
                    {item.category}
                  </span>
                </div>
              )}
              
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs lines-2 leading-tight">
                    {item.name.split(' (')[0]}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {item.name.split(' (')[1]?.replace(')', '') || item.category}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <span className="text-sm font-black text-blue-600 font-mono">{item.price} ر.س</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Plus size={16} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {filteredItems.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400">
              <AlertCircle size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">لم يتم العثور على أي أصناف في هذا التصنيف</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Cashier Bill Cart (Col Span 4) */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-xl flex flex-col h-full overflow-hidden">
        
        {/* Bill Cart header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100/50 rounded-lg text-blue-600">
              <ChefHat size={18} />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm">سلة الطلبات المفتوحة</h3>
          </div>
          
          {cart.length > 0 && (
            <button 
              onClick={clearCart}
              className="text-[10px] text-rose-500 font-bold hover:underline flex items-center gap-1"
            >
              <Trash2 size={12} />
              <span>إفراغ</span>
            </button>
          )}
        </div>

        {/* Selected Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map((item) => (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              key={item.menuItemId}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100/60"
            >
              <div className="space-y-0.5 max-w-[60%]">
                <h4 className="text-xs font-extrabold text-slate-800 leading-tight">
                  {item.name.split(' (')[0]}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">{(item.price * item.quantity).toFixed(2)} ر.س</p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => removeFromCart(item.menuItemId)}
                  className="w-6 h-6 rounded bg-white shadow-sm border border-slate-100 hover:bg-slate-100 flex items-center justify-center text-slate-500"
                >
                  <Minus size={12} />
                </button>
                <span className="text-xs font-black text-slate-800 font-mono w-4 text-center">{item.quantity}</span>
                <button 
                  onClick={() => plusQuantity(item.menuItemId)}
                  className="w-6 h-6 rounded bg-white shadow-sm border border-slate-100 hover:bg-slate-100 flex items-center justify-center text-slate-500"
                >
                  <Plus size={12} />
                </button>
              </div>
            </motion.div>
          ))}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
              <ChefHat size={48} className="opacity-15 mb-4 animate-bounce" />
              <p className="text-xs font-black">شاشة الكشير فارغة!</p>
              <p className="text-[10px] opacity-70 mt-1">انقر على المنيو لإضافة طلبات جديدة.</p>
            </div>
          )}
        </div>

        {/* Totals & Actions area */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/70 space-y-4">
          <div className="space-y-2 text-xs font-bold text-slate-500">
            <div className="flex justify-between">
              <span>المجموع الفرعي:</span>
              <span className="font-mono text-slate-700">{subtotal.toFixed(2)} ر.س</span>
            </div>
            <div className="flex justify-between">
              <span>ضريبة القيمة المضافة (15%):</span>
              <span className="font-mono text-slate-700">{tax.toFixed(2)} ر.س</span>
            </div>
            
            {showSplitter && (
              <div className="bg-blue-50 flex flex-col gap-2 p-3 rounded-lg border border-blue-100/55 mt-1 text-blue-900">
                <div className="flex justify-between items-center text-[11px] font-extrabold text-blue-800">
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    <span>تقسيم الفاتورة على:</span>
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setSplitCount(v => Math.max(2, v - 1))} className="w-5 h-5 bg-white border border-blue-200 rounded text-blue-700 font-bold">-</button>
                    <span className="font-mono font-black">{splitCount}</span>
                    <button onClick={() => setSplitCount(v => v + 1)} className="w-5 h-5 bg-white border border-blue-200 rounded text-blue-700 font-bold">+</button>
                  </div>
                </div>
                
                <div className="flex justify-between font-mono font-black border-t border-blue-100/50 pt-1.5 text-xs text-blue-900">
                  <span>طرح للشخص الواحد:</span>
                  <span>{splitAmount.toFixed(2)} ر.س</span>
                </div>
              </div>
            )}

            <div className="h-px bg-slate-200 my-2" />
            <div className="flex justify-between text-sm font-black text-slate-800">
              <span>الإجمالي النهائي المستحق:</span>
              <span className="font-mono text-blue-600 text-base">{total.toFixed(2)} ر.س</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <button
              onClick={() => setShowSplitter(p => !p)}
              disabled={cart.length === 0}
              className="px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-black flex items-center justify-center gap-1.5 shadow-sm font-sans transition-colors cursor-pointer disabled:opacity-50"
            >
              <Users size={15} />
              <span>تقسيم البيل</span>
            </button>
            <button
              onClick={() => {
                if (orderType === 'Dine-in' && !selectedTable) {
                  alert('يرجى تحديد الطاولة أولاً للأكل المحلي!');
                  return;
                }
                setShowCheckout(true);
              }}
              disabled={cart.length === 0}
              className="px-3.5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-11 shadow-md shadow-blue-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>تأكيد &amp; دفع [F8]</span>
            </button>
          </div>
        </div>

      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
              onClick={() => setShowCheckout(false)}
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full relative z-10 shadow-2xl font-sans"
            >
              <h3 className="text-xl font-black text-slate-800 mb-2">الدفع وإرسال الأوردر للمطبخ</h3>
              <p className="text-xs text-slate-400 mb-6">حدد طريقة تسوية الدفع الفوري لتحديث الحسابات آلياً.</p>

              {/* Payment Methods */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { id: 'Cash', label: 'دفع نقدي كاش', icon: DollarSign, color: 'text-amber-500 bg-amber-50 border-amber-100' },
                  { id: 'Card', label: 'فيزا ب شبكة مدى', icon: CreditCard, color: 'text-blue-500 bg-blue-50 border-blue-100' },
                  { id: 'Foodics', label: 'مزامنة فودكس', icon: Check, color: 'text-purple-500 bg-purple-50 border-purple-100' }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      paymentMethod === method.id 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 shadow-md scale-[1.02]' 
                        : 'border-slate-100 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div className="flex justify-center mb-2"><method.icon size={20} className="text-slate-600" /></div>
                    <span className="text-[10px] font-extrabold text-slate-800">{method.label}</span>
                  </button>
                ))}
              </div>

              {/* Recapitulation */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 space-y-2 text-xs font-bold text-slate-700">
                <div className="flex justify-between">
                  <span>طريقة الطلب:</span>
                  <span className="text-blue-600">{orderType === 'Dine-in' ? `محلي (${selectedTable?.number})` : orderType === 'Takeaway' ? 'سفري خارجي' : 'توصيل عنوان'}</span>
                </div>
                <div className="flex justify-between font-mono text-sm font-black border-t border-slate-100 pt-2 text-slate-900">
                  <span>الإجمالي شامل ضريبة 15%:</span>
                  <span>{total.toFixed(2)} ر.س</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  إلغاء والتراجع
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCheckout}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-100 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Check size={15} />
                      <span>سحب مخزن وطباعة</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success checkout popup */}
      <AnimatePresence>
        {checkoutSuccess && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative z-10 shadow-2xl font-sans"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                <Check size={32} />
              </div>
              
              <h3 className="text-xl font-black text-slate-800 mb-2">تم طباعة وحفظ الفاتورة آلياً</h3>
              <p className="text-xs text-slate-400 mb-1">الطلب تم إرساله لحظياً إلى شاشة المطبخ KDS.</p>
              <p className="inline-block px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono font-extrabold text-blue-600 mb-6">{checkoutSuccess}</p>
              
              <div className="bg-emerald-50 rounded-2xl p-4 text-xs font-bold text-emerald-800 leading-relaxed mb-6">
                💰 تم توليد قيود اليومية تلقائياً:
                <br />
                <span className="text-[10px] text-slate-500 block mt-1">مدين (البنك/الصندوق) &larr; دائن (الإيراد)</span>
                <span className="text-[10px] text-slate-500 block">مدين (تكلفة COGS) &larr; دائن (مخزون المكونات BOM)</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Printer size={14} />
                  <span>طباعة ريسيت</span>
                </button>
                <button
                  onClick={() => setCheckoutSuccess(null)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-lg transition-colors cursor-pointer"
                >
                  إغلاق ومتابعة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

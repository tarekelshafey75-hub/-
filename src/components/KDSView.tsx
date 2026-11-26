import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Coffee, 
  Cake, 
  Monitor, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  Volume2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RestaurantOrder } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface KDSViewProps {
  orders: RestaurantOrder[];
  onRefresh: () => void;
}

export const KDSView: React.FC<KDSViewProps> = ({
  orders,
  onRefresh
}) => {
  // Prep sections filter
  const [selectedSection, setSelectedSection] = useState<'All' | 'Grill' | 'Drinks' | 'Dessert'>('All');
  
  // Kitchen sounds (Ring bell on new orders)
  const [lastOrderCount, setLastOrderCount] = useState(orders.length);

  // Active cooking orders (Pending, Preparing, Ready) - ordered oldest first (FIFO)
  const activeOrders = orders
    .filter(o => ['Pending', 'Preparing', 'Ready'].includes(o.status))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Trigger bell if order count increases
  useEffect(() => {
    if (orders.length > lastOrderCount) {
      // play double beep
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        [600, 800].forEach((freq, idx) => {
          setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
          }, idx * 180);
        });
      } catch (e) {
        // failed
      }
    }
    setLastOrderCount(orders.length);
  }, [orders.length, lastOrderCount]);

  const updateOrderStatus = async (orderId: string, nextStatus: 'Preparing' | 'Ready' | 'Delivered') => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updates: any = { status: nextStatus };
      if (nextStatus === 'Delivered') {
        updates.paymentStatus = 'Paid';
        updates.completedAt = new Date().toISOString();
      }
      await updateDoc(orderRef, updates);
      
      // simulated beep
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = nextStatus === 'Delivered' ? 1000 : 850;
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } catch (e) {}

      onRefresh();
    } catch (err) {
      console.error('Error updating order status in KDS: ', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'border-amber-400 bg-amber-50/50';
      case 'Preparing': return 'border-blue-400 bg-blue-50/50';
      case 'Ready': return 'border-emerald-500 bg-emerald-50/50';
      default: return 'border-slate-200';
    }
  };

  const getStatusHeaderBg = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-400 text-amber-950';
      case 'Preparing': return 'bg-blue-500 text-white';
      case 'Ready': return 'bg-emerald-500 text-white';
      default: return 'bg-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Pending': return 'بانتظار الطهي';
      case 'Preparing': return 'جاري التحضير';
      case 'Ready': return 'جاهز للتسليم';
      default: return status;
    }
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'Grill': return <Flame size={16} className="text-red-500" />;
      case 'Drinks': return <Coffee size={16} className="text-blue-500" />;
      case 'Dessert': return <Cake size={16} className="text-pink-500" />;
      default: return <Monitor size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      
      {/* Upper header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Monitor className="text-blue-600" />
            <span>شاشة الكاش شيف وتحضير المطبخ (KDS)</span>
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">خط إنتاج تحضير الوجبات، تحديث الحالة فور الإنجاز للتنسيق مع الصالة والكاشير.</p>
        </div>
        
        {/* Prep segment filters */}
        <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100 shrink-0">
          {[
            { id: 'All', label: 'كل المطبخ', icon: <Monitor size={14} /> },
            { id: 'Grill', label: 'قسم الشواية/البرجر', icon: <Flame size={14} /> },
            { id: 'Drinks', label: 'ركن المشروبات/البار', icon: <Coffee size={14} /> },
            { id: 'Dessert', label: 'ركن الحلويات', icon: <Cake size={14} /> }
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => setSelectedSection(sec.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                selectedSection === sec.id 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {sec.icon}
              <span>{sec.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Kitchen Tickets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {activeOrders.map((order) => {
            // Check if this ticket contains items belonging to selected prep section
            // In a real multi-screen context, each screen filters out inapplicable items!
            const matchingItems = order.items.filter(item => {
              if (selectedSection === 'All') return true;
              const menu = orders.length > 0; // simulated category/prep mapping for items
              // simple category checking
              if (selectedSection === 'Grill' && (item.name.includes('برجر') || item.name.includes('بطاطس') || item.name.includes('سالمون'))) return true;
              if (selectedSection === 'Drinks' && (item.name.includes('لاتيه') || item.name.includes('موهيتو') || item.name.includes('قهوة'))) return true;
              if (selectedSection === 'Dessert' && item.name.includes('آيس')) return true;
              return false;
            });

            if (matchingItems.length === 0) return null;

            // calculate ticket cooking timer
            const elapsedMsecs = Date.now() - new Date(order.createdAt).getTime();
            const elapsedMins = Math.floor(elapsedMsecs / 60000);
            const isLate = elapsedMins > 10; // Red alert if cooking is taking more than 10 mins

            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className={`rounded-2xl border-2 ${getStatusColor(order.status)} shadow-lg bg-white overflow-hidden flex flex-col justify-between h-[420px]`}
              >
                <div>
                  {/* Status indicator header */}
                  <div className={`px-4 py-3 font-extrabold text-sm flex justify-between items-center ${getStatusHeaderBg(order.status)}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono">{order.orderNumber.replace('ORD-', '#')}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-black/15 text-white capitalize rounded">
                        {order.type === 'Dine-in' ? `${order.tableNumber?.split(' (')[0] || 'طاولة'}` : order.type === 'Delivery' ? 'توصيل' : 'سفري'}
                      </span>
                    </div>
                    
                    <span className="text-xs font-black bg-white/20 px-2.5 py-0.5 rounded-full">
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  {/* Customer / Meta info */}
                  <div className="p-4 border-b border-dashed border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Clock size={12} />
                      <span className={isLate ? 'text-red-600 font-extrabold animate-pulse' : 'font-mono'}>
                        {elapsedMins} دقيقة منذ الطلب
                      </span>
                    </span>
                    
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Calendar size={11} />
                      <span>{new Date(order.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>

                  {/* Order items inside */}
                  <div className="p-4 space-y-3.5 max-h-[220px] overflow-y-auto">
                    {matchingItems.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between">
                        <div className="flex gap-2">
                          <span className="font-black text-blue-600 text-sm bg-blue-50 w-6 h-6 rounded flex items-center justify-center shrink-0">
                            {item.quantity}x
                          </span>
                          <span className="text-xs font-black text-slate-800 leading-snug">
                            {item.name.split(' (')[0]}
                          </span>
                        </div>
                        
                        {/* Section icon */}
                        <div className="shrink-0 p-1 bg-slate-50 rounded">
                          {item.name.includes('برجر') || item.name.includes('بطاطس') ? getSectionIcon('Grill') : 
                           item.name.includes('لاتيه') || item.name.includes('موهيتو') ? getSectionIcon('Drinks') :
                           item.name.includes('آيس') ? getSectionIcon('Dessert') : getSectionIcon('General')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preparation status operations footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/40">
                  {order.status === 'Pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'Preparing')}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>بدء تحضير الطهي</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                  {order.status === 'Preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'Ready')}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-amber-100 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>تجهيز الوجبة والتغليف</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                  {order.status === 'Ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'Delivered')}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={14} />
                      <span>تسليم نهائي للزبون</span>
                    </button>
                  )}
                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {activeOrders.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <Sparkles size={64} className="mx-auto text-emerald-500 opacity-25 animate-spin" />
            <h3 className="font-bold text-slate-700">شاشات المطبخ نظيفة بالكامل!</h3>
            <p className="text-slate-400 text-xs">لا يوجد أي فواتير طهي معلقة بالانتظار حالياً.</p>
          </div>
        )}
      </div>

    </div>
  );
};

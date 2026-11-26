import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Check, 
  TrendingUp, 
  Settings, 
  BookOpen, 
  DollarSign,
  Coffee,
  CheckCircle2,
  ListFilter
} from 'lucide-react';
import { MenuItem, Ingredient, RecipeItem } from '../types';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface MenuEngineeringViewProps {
  menuItems: MenuItem[];
  ingredients: Ingredient[];
  onRefresh: () => void;
}

export const MenuEngineeringView: React.FC<MenuEngineeringViewProps> = ({
  menuItems,
  ingredients,
  onRefresh
}) => {
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('وجبات رئيسية (Grill)');
  const [price, setPrice] = useState(30);
  const [prepSection, setPrepSection] = useState<'Grill' | 'Drinks' | 'Dessert' | 'General'>('Grill');
  const [image, setImage] = useState('');
  const [recipe, setRecipe] = useState<RecipeItem[]>([]);
  
  // Selection helpers for adding recipe rows
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Filter Categories
  const [selectedFilter, setSelectedFilter] = useState('الكل');
  
  const categoriesList = ['الكل', 'وجبات رئيسية (Grill)', 'المقبلات (Appetizer)', 'إطباق بحرية (Grill)', 'مشروبات (Drinks)', 'الحلويات (Dessert)'];

  // Calculate the item cost based on ingredients average cost
  const calculateItemCost = (item: MenuItem) => {
    return item.recipe.reduce((sum, rec) => {
      const ing = ingredients.find(i => i.id === rec.ingredientId);
      if (ing) {
        return sum + (rec.quantity * (ing.costPerUnit || 0));
      }
      return sum;
    }, 0);
  };

  const handleAddRecipeRow = () => {
    if (!selectedIngredientId) return;
    const ing = ingredients.find(i => i.id === selectedIngredientId);
    if (!ing) return;

    if (recipe.some(r => r.ingredientId === selectedIngredientId)) {
      alert('تمت إضافة هذا المكون بالفعل!');
      return;
    }

    setRecipe(prev => [
      ...prev,
      {
        ingredientId: selectedIngredientId,
        name: ing.name,
        quantity,
        unit: ing.unit
      }
    ]);
    setSelectedIngredientId('');
    setQuantity(1);
  };

  const handleRemoveRecipeRow = (idx: number) => {
    setRecipe(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || recipe.length === 0) {
      alert('يرجى تحديد اسم الوجبة وتثبيت مكون واحد على الأقل لكلفة BOM الـ Recipe!');
      return;
    }

    try {
      const itemId = 'menu-' + Math.random().toString(36).substr(2, 9);
      const newMenuItem: MenuItem = {
        id: itemId,
        name,
        category,
        price: Number(price),
        prepSection,
        active: true,
        image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60',
        recipe
      };

      await setDoc(doc(db, 'menuItems', itemId), newMenuItem);
      
      // Reset
      setName('');
      setRecipe([]);
      setImage('');
      setShowAddModal(false);
      onRefresh();
    } catch (err) {
      console.error('Error adding menu item: ', err);
    }
  };

  const toggleMenuItemActive = async (itemId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'menuItems', itemId), { active: !currentStatus });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Pie chart calculation for categories count
  const catDistribution: Record<string, number> = {};
  menuItems.forEach(item => {
    catDistribution[item.category] = (catDistribution[item.category] || 0) + 1;
  });
  
  const pieData = Object.entries(catDistribution).map(([name, val]) => ({ name, value: val }));
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];

  const filteredItems = menuItems.filter(item => {
    return selectedFilter === 'الكل' || item.category === selectedFilter;
  });

  return (
    <div className="space-y-8 font-sans" dir="rtl">
      
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-blue-600" />
            <span>هندسة الوجبات وبطاقات تكلفة الأطعمة (BOM Recipes)</span>
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">برمجة مكونات الوجبة وحساب التكلفة المعيارية لاقتراح سياسات التسعير وتحليل هوامش الجروس بروفيت.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-md shadow-blue-100 cursor-pointer"
        >
          <Plus size={16} />
          <span>برمجة صنف منيو جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left main table grid (Col Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Filters Row */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0">
            {categoriesList.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  selectedFilter === cat 
                    ? 'bg-slate-900 border-slate-900 text-white' 
                    : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-right border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold">
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4.5">الوجبة والتصنيف</th>
                  <th className="px-6 py-4.5">تكلفة المكونات BOM</th>
                  <th className="px-6 py-4.5">سعر بيع الكاشير</th>
                  <th className="px-6 py-4.5">نسبة تكلفة الغذاء</th>
                  <th className="px-6 py-4.5 text-center">أقتراح السعر المثالي</th>
                  <th className="px-6 py-4.5 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs font-semibold">
                {filteredItems.map((item) => {
                  const cost = calculateItemCost(item);
                  const foodCostPercent = item.price > 0 ? (cost / item.price) * 100 : 0;
                  const suggestedPrice = cost / 0.30; // 30% standard target food cost
                  const isHighCost = foodCostPercent > 35; // Warning threshold is >35%

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center"><BookOpen size={18} /></div>
                        )}
                        <div>
                          <div className="font-bold text-slate-800">{item.name.split(' (')[0]}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.category}</div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-slate-600 font-mono">
                        {cost.toFixed(2)} ر.س
                      </td>
                      
                      <td className="px-6 py-4 font-bold text-slate-800 font-mono">
                        {item.price.toFixed(2)} ر.س
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 font-bold ${isHighCost ? 'text-amber-600 font-black' : 'text-emerald-700'}`}>
                          {foodCostPercent.toFixed(1)}%
                          {isHighCost && <span title="تكلفة الأغذية مرتفعة جداً مقارنة بسعر الكاشير! ينصح بهامش ربح أعلى"><AlertTriangle size={12} className="text-amber-500 animate-bounce" /></span>}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-center font-mono font-bold text-blue-600">
                        {suggestedPrice.toFixed(1)} ر.س
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleMenuItemActive(item.id, item.active)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black cursor-pointer border ${
                            item.active 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}
                        >
                          {item.active ? 'نشط بالمنيو' : 'حظر مؤقت'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right dashboard pie chart statistics (Col Span 1) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">توزيع الوجبات ومجموع قائمة الطعام</h3>
              <p className="text-slate-400 text-[10px] mt-0.5">إحصاء التنوع في أقسام المطبخ النشطة.</p>
            </div>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip wrapperStyle={{ fontSize: 10, fontFamily: 'sans-serif' }} />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs font-bold text-slate-600">
              {pieData.map((data, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span>{data.name}</span>
                  </span>
                  <span>{data.value} صنف</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Target rules info card */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-6 rounded-2xl text-white space-y-3 shadow-md">
            <h4 className="text-xs font-black flex items-center gap-1.5">
              <TrendingUp size={16} />
              <span>المعيار الذهبي لربحية المطاعم:</span>
            </h4>
            
            <p className="text-[11px] leading-relaxed opacity-85">
              تهدف المطاعم الاحترافية لتثبيت نسبة تكلفة الغذاء (Food Cost %) في نطاق <strong>28% - 32%</strong>. إذا ارتفعت النسبة عن هذا النطاق، فقد يؤشر ذلك على تضخم أسعار الشراء من الموردين أو هدر غير مدروس للمكونات، أو تسعير غير مدروس لطلبات الكاشير.
            </p>
          </div>
        </div>

      </div>

      {/* Add MenuItem Popup Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-xl w-full relative z-10 shadow-2xl h-[90vh] flex flex-col font-sans"
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-lg font-black text-slate-800">برمجة بطاقة وجبة ووصفة BOM بالكامل</h3>
                <span className="p-1 px-3 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">تأسيس قائمة الكاشير</span>
              </div>

              {/* Form container scrollable */}
              <form onSubmit={handleSubmitMenuItem} className="flex-1 overflow-y-auto space-y-5 pr-1 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">اسم الوجبة (عربي):</label>
                    <input 
                      type="text" 
                      required
                      placeholder="مثال: برجر دجاج كرسبي"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-extrabold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">سعر البيع بالكاشير (ر.س):</label>
                    <input 
                      type="number" 
                      required
                      min={1}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-extrabold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">القسم المعياري بالمنيو:</label>
                    <select 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-extrabold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    >
                      <option value="وجبات رئيسية (Grill)">وجبات رئيسية (Grill)</option>
                      <option value="المقبلات (Appetizer)">المقبلات (Appetizer)</option>
                      <option value="إطباق بحرية (Grill)">إطباق بحرية (Grill)</option>
                      <option value="مشروبات (Drinks)">مشروبات (Drinks)</option>
                      <option value="الحلويات (Dessert)">الحلويات (Dessert)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">ركن التحضير بالمطعم (KDS Section):</label>
                    <select 
                      value={prepSection} 
                      onChange={(e) => setPrepSection(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-extrabold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    >
                      <option value="Grill">Grill - شواية</option>
                      <option value="Drinks">Drinks - بار مشروبات</option>
                      <option value="Dessert">Dessert - حلويات باردة</option>
                      <option value="General">General - مطبخ عام</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-500">رابط صورة الوجبة التوضيحية (اختياري URL):</label>
                  <input 
                    type="text" 
                    placeholder="https://images.unsplash.com/..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-sans text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Recipe Builder Area BOM */}
                <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 space-y-4">
                  <h4 className="text-xs font-black text-slate-800 flex items-center justify-between">
                    <span>مكونات الوصفة BOM (استهلاك مخزني):</span>
                    <span className="text-[10px] text-slate-400">تُطرح المكونات المقررة تلقائياً عند الدفع</span>
                  </h4>

                  {/* Add Recipe row controls */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <label className="text-[10px] text-slate-500">اختر المكون المخزني:</label>
                      <select
                        value={selectedIngredientId}
                        onChange={(e) => setSelectedIngredientId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-extrabold text-slate-800 bg-white border border-slate-200 rounded-xl"
                      >
                        <option value="">-- حدد مكون عذائيات --</option>
                        {ingredients.map(ing => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-500">الكمية المقررة:</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          step="any"
                          min={0.001}
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs font-extrabold text-slate-800 bg-white border border-slate-200 rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={handleAddRecipeRow}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
                        >
                          أضف
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* List of Recipe specifications */}
                  <div className="space-y-2">
                    {recipe.map((rec, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-xs font-black text-slate-700">{rec.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-slate-500">
                            {rec.quantity} {rec.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRecipeRow(idx)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {recipe.length === 0 && (
                      <div className="text-center py-6 text-[10.5px] text-slate-400 font-medium">
                        يرجى إقران مكون واحد على الأقل لحساب تكاليف الأوردر!
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit row */}
                <div className="flex gap-3 shrink-0 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    تراجع
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1 shadow cursor-pointer"
                  >
                    <CheckCircle2 size={15} />
                    <span>تخزين الصنف لطلب الكاشير</span>
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

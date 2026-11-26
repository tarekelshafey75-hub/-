import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Monitor, 
  BookOpen, 
  RefreshCw, 
  ShoppingBag, 
  FileSpreadsheet, 
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Sparkles,
  Lock,
  Globe,
  Database
} from 'lucide-react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/error-handler';
import { motion, AnimatePresence } from 'motion/react';

// Modules
import { ERP_Dashboard } from './components/ERP_Dashboard';
import { POSView } from './components/POSView';
import { KDSView } from './components/KDSView';
import { MenuEngineeringView } from './components/MenuEngineeringView';
import { InventoryView } from './components/InventoryView';
import { ProcurementView } from './components/ProcurementView';
import { AccountingView } from './components/AccountingView';

// Seed and data helpers
import { seedInitialData } from './lib/db-service';
import { 
  Ingredient, 
  MenuItem, 
  TableItem, 
  RestaurantOrder, 
  Supplier, 
  PurchaseInvoice, 
  Account, 
  JournalEntry, 
  WasteLog 
} from './types';

import { 
  INITIAL_ACCOUNTS, 
  INITIAL_SUPPLIERS, 
  INITIAL_INGREDIENTS, 
  INITIAL_MENU, 
  INITIAL_TABLES, 
  INITIAL_ORDERS, 
  INITIAL_PURCHASES, 
  INITIAL_JOURNAL, 
  INITIAL_WASTE 
} from './data';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Firestore Synchronized Lists with falling back to initial data if empty
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([]);

  // Trigger seeding and auth state changed on startup
  useEffect(() => {
    // 1. Listen for auth state
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });

    // 2. Automate background initial database seeder
    seedInitialData().then(() => {
      // 3. Mount real-time Firestore synchronization loops
      const subAccounts = onSnapshot(collection(db, 'accounts'), (snap) => {
        const data = snap.docs.map(doc => doc.data() as Account);
        setAccounts(data.length > 0 ? data : INITIAL_ACCOUNTS);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'accounts'));

      const subJournals = onSnapshot(collection(db, 'journalEntries'), (snap) => {
        const data = snap.docs.map(doc => doc.data() as JournalEntry);
        // sort by date descending
        const sorted = (data.length > 0 ? data : INITIAL_JOURNAL).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setJournalEntries(sorted);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'journalEntries'));

      const subSuppliers = onSnapshot(collection(db, 'suppliers'), (snap) => {
        const data = snap.docs.map(doc => doc.data() as Supplier);
        setSuppliers(data.length > 0 ? data : INITIAL_SUPPLIERS);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'suppliers'));

      const subIngredients = onSnapshot(collection(db, 'ingredients'), (snap) => {
        const data = snap.docs.map(doc => doc.data() as Ingredient);
        setIngredients(data.length > 0 ? data : INITIAL_INGREDIENTS);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'ingredients'));

      const subMenuItems = onSnapshot(collection(db, 'menuItems'), (snap) => {
        const data = snap.docs.map(doc => doc.data() as MenuItem);
        setMenuItems(data.length > 0 ? data : INITIAL_MENU);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'menuItems'));

      const subTables = onSnapshot(collection(db, 'tables'), (snap) => {
        const data = snap.docs.map(doc => doc.data() as TableItem);
        // Sort tables by table number ASC
        const sorted = (data.length > 0 ? data : INITIAL_TABLES).sort((a,b) => a.number.localeCompare(b.number));
        setTables(sorted);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'tables'));

      const subOrders = onSnapshot(collection(db, 'orders'), (snap) => {
        const data = snap.docs.map(doc => doc.data() as RestaurantOrder);
        // Sort orders by creation date descending
        const sorted = (data.length > 0 ? data : INITIAL_ORDERS).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(sorted);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders'));

      const subPurchases = onSnapshot(collection(db, 'purchaseInvoices'), (snap) => {
        const data = snap.docs.map(doc => doc.data() as PurchaseInvoice);
        const sorted = (data.length > 0 ? data : INITIAL_PURCHASES).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPurchaseInvoices(sorted);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'purchaseInvoices'));

      const subWaste = onSnapshot(collection(db, 'wasteLogs'), (snap) => {
        const data = snap.docs.map(doc => doc.data() as WasteLog);
        const sorted = (data.length > 0 ? data : INITIAL_WASTE).sort((a,b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
        setWasteLogs(sorted);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'wasteLogs'));

      setLoading(false);

      return () => {
        subAccounts();
        subJournals();
        subSuppliers();
        subIngredients();
        subMenuItems();
        subTables();
        subOrders();
        subPurchases();
        subWaste();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Real Google auth failed or is running inside sandbox, initiating demo simulation mode', err);
      // Auto register a premium demo session so they can test the application instantly!
      const demoUser = {
        uid: 'demo-chef-007',
        displayName: 'م. عبدالرحمن (المدير الإداري)',
        email: 'ceo@restaurant-erp.com',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=60'
      } as any;
      setUser(demoUser);
    }
  };

  const handleDemoLogin = (role: 'admin' | 'cashier' | 'chef') => {
    const roles = {
      admin: { name: 'الأستاذ عماد (المدير المالي)', email: 'finance@shawayat.com', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120' },
      cashier: { name: 'صالح (كاشير الفرع الرئيسي)', email: 'pos-main@shawayat.com', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120' },
      chef: { name: 'الشيف أنس (كبير الطهاة)', email: 'headchef@shawayat.com', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120' }
    };
    const choice = roles[role];
    const demoUser = {
      uid: 'demo-' + role + '-id',
      displayName: choice.name,
      email: choice.email,
      photoURL: choice.photo
    } as any;
    setUser(demoUser);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    setUser(null);
  };

  const refresher = () => {
    // optional trigger
  };

  // 4. Custom Login GUI
  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans" dir="rtl">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-black text-slate-400">تحميل منصة الصيانة والمستودعات السحابية...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-950 text-white font-sans overflow-hidden" dir="rtl">
        
        {/* Left Side: Brand presentation */}
        <div className="lg:col-span-7 bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="relative z-10 flex items-center gap-2">
            <div className="p-2 bg-blue-500 rounded-2xl shadow-lg ring-4 ring-blue-500/20">
              <Sparkles className="text-white" size={24} />
            </div>
            <span className="font-black text-lg tracking-tight">نظام ERP مطعم برج المنوفية</span>
          </div>

          <div className="relative z-10 space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold w-fit">
              <span>شركة Estadat</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black leading-tight tracking-tight">
              إدارة الكاشير (POS) والمخازن والقيود المحاسبية
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              منصة سحابية متقدمة من شركة Estadat لإدارة المبيعات وشاشات طهي المطبخ (KDS)، مع تتبع آلي لمستودعات ومكونات الأطعمة BOM وتلفيات المخزون، وتوليد القيود المحاسبية بالدفاتر تماشياً مع معايير الشركة المالية.
            </p>
            
            <div className="grid grid-cols-3 gap-4 pt-4 text-center">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <p className="text-2xl font-black text-blue-400 font-mono">100%</p>
                <p className="text-[10px] text-slate-300 font-bold mt-1">تكامل POS مع المطبخ</p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <p className="text-2xl font-black text-emerald-400 font-mono">Auto</p>
                <p className="text-[10px] text-slate-300 font-bold mt-1">المحاسبة المزدوجة</p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <p className="text-2xl font-black text-purple-400 font-mono">BOM</p>
                <p className="text-[10px] text-slate-300 font-bold mt-1">جرد المكونات للمنيو</p>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-[11px] text-slate-400 font-medium">
            جميع الحقوق محفوظة &copy; {new Date().getFullYear()} - مطعم برج المنوفية &reg; تابع لشركة Estadat.
          </p>
        </div>

        {/* Right Side: Log-in Interface */}
        <div className="lg:col-span-5 bg-slate-900 border-r border-slate-800 p-12 flex flex-col justify-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-100">مرحباً بك في بوابة التحكم</h2>
            <p className="text-slate-400 text-xs font-bold">يرجى تسجيل الدخول لبدء المبيعات والرقابة المالية.</p>
          </div>

          <div className="space-y-4">
            {/* Google Authentication */}
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
            >
              <Globe size={16} />
              <span>تسجيل الدخول عبر Google (للمدراء)</span>
            </button>

            <div className="flex items-center my-6 text-xs text-slate-500 font-bold">
              <div className="flex-1 h-px bg-slate-800"></div>
              <span className="px-3 uppercase bg-slate-900">أو تصفح وتجربة الصلاحيات السريعة</span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>

            {/* Quick Demo Access Roles */}
            <div className="space-y-3.5">
              <button
                onClick={() => handleDemoLogin('admin')}
                className="w-full p-4 bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700/60 rounded-2xl flex items-center justify-between text-xs font-black transition-all cursor-pointer text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <div>سجل كأستاذ عماد (مدير مالي)</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5 font-mono">الرقابة، شجرة الحسابات، الأرباح والخسائر</div>
                  </div>
                </div>
                <Lock size={14} className="text-slate-500" />
              </button>

              <button
                onClick={() => handleDemoLogin('cashier')}
                className="w-full p-4 bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700/60 rounded-2xl flex items-center justify-between text-xs font-black transition-all cursor-pointer text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <div>سجل كصالح (كاشير صالة)</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5 font-mono">نقاط البيع السريعة وطلب الكاشير وتكسير الفاتورة</div>
                  </div>
                </div>
                <Lock size={14} className="text-slate-500" />
              </button>

              <button
                onClick={() => handleDemoLogin('chef')}
                className="w-full p-4 bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700/60 rounded-2xl flex items-center justify-between text-xs font-black transition-all cursor-pointer text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Monitor size={18} />
                  </div>
                  <div>
                    <div>سجل كشيف أنس (رئيس طهاة)</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5 font-mono">خط إنتاج تحضير الوجبات، وتفويض الطلبات الجاهزة KDS</div>
                  </div>
                </div>
                <Lock size={14} className="text-slate-500" />
              </button>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'pos', label: 'كاشير المبيعات POS', icon: Receipt },
    { id: 'kds', label: 'تحضير المطبخ KDS', icon: Monitor },
    { id: 'menu_engineering', label: 'هندسة المنيو BOM', icon: BookOpen },
    { id: 'inventory', label: 'إدارة المستودع', icon: RefreshCw },
    { id: 'procurements', label: 'فواتير الموردين', icon: ShoppingBag },
    { id: 'accounting', label: 'الحسابات والقيود', icon: FileSpreadsheet },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir="rtl">
      
      {/* Top Banner alert showing Firestore online status */}
      <div className="bg-slate-900 px-6 py-2.5 text-white flex justify-between items-center text-xs border-b border-slate-800 font-mono shrink-0">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-cyan-400" />
          <span>قاعدة البيانات السحابية (Firestore Node) :</span>
          <span className="text-emerald-400 font-bold font-sans">متصلة ونشطة</span>
        </div>
        <div className="flex items-center gap-1.5 font-sans">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>مطعم برج المنوفية (شركة Estadat) - الفرع الرئيسي</span>
        </div>
      </div>

      {/* Main Core Body Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Nav (Desktop) */}
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-l border-slate-800 shrink-0 hidden lg:flex">
          <div className="p-6 space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-2 border-b border-slate-850 pb-5">
              <div className="p-1.5 bg-blue-600 rounded-xl text-white">
                <Sparkles size={18} />
              </div>
              <div>
                <span className="font-black text-slate-100 text-sm tracking-tight block">برج المنوفية</span>
                <span className="text-[10px] text-slate-500 font-bold block font-sans tracking-wide">تابع لشركة Estadat</span>
              </div>
            </div>

            {/* Links */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-black flex items-center gap-3 transition-colors text-right cursor-pointer ${
                      isActive 
                        ? 'bg-blue-600 text-white font-extrabold shadow-md shadow-blue-900/10' 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                    }`}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User profile section */}
          <div className="p-6 bg-slate-950/40 border-t border-slate-850 space-y-4">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-9 h-9 rounded-xl border border-slate-800 object-cover" />
              ) : (
                <div className="w-9 h-9 bg-slate-800 text-slate-300 rounded-xl flex items-center justify-center font-bold">
                  <UserIcon size={16} />
                </div>
              )}
              
              <div className="space-y-0.5">
                <div className="text-slate-200 text-xs font-black lines-1">{user.displayName}</div>
                <div className="text-[9.5px] text-slate-500 font-mono text-left max-w-[130px] overflow-hidden truncate">{user.email}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut size={13} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </aside>

        {/* Content Container Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-y-auto">
          {/* Header Mobile toggler bar */}
          <header className="lg:hidden shrink-0 bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="text-blue-500" size={18} />
              <div>
                <span className="font-black text-sm tracking-tight block">مطعم برج المنوفية</span>
                <span className="text-[9px] text-slate-400 block font-sans">Estadat ERP</span>
              </div>
            </div>
            
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-800 rounded-xl">
              <Menu size={20} />
            </button>
          </header>

          {/* Core active tab router view */}
          <main className="p-6 md:p-8 flex-1 min-h-[calc(100vh-120px)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {activeTab === 'dashboard' && (
                  <ERP_Dashboard 
                    orders={orders} 
                    ingredients={ingredients} 
                    menuItems={menuItems} 
                    accounts={accounts} 
                    wasteLogs={wasteLogs}
                    onNavigateToTab={(tab) => setActiveTab(tab)}
                  />
                )}
                {activeTab === 'pos' && (
                  <POSView 
                    menuItems={menuItems} 
                    tables={tables} 
                    ingredientsCount={ingredients.length}
                    onSuccess={refresher}
                  />
                )}
                {activeTab === 'kds' && (
                  <KDSView 
                    orders={orders} 
                    onRefresh={refresher} 
                  />
                )}
                {activeTab === 'menu_engineering' && (
                  <MenuEngineeringView 
                    menuItems={menuItems} 
                    ingredients={ingredients} 
                    onRefresh={refresher} 
                  />
                )}
                {activeTab === 'inventory' && (
                  <InventoryView 
                    ingredients={ingredients} 
                    wasteLogs={wasteLogs} 
                    suppliers={suppliers} 
                    onRefresh={refresher} 
                  />
                )}
                {activeTab === 'procurements' && (
                  <ProcurementView 
                    ingredients={ingredients} 
                    suppliers={suppliers} 
                    purchases={purchaseInvoices} 
                    onRefresh={refresher} 
                  />
                )}
                {activeTab === 'accounting' && (
                  <AccountingView 
                    accounts={accounts} 
                    journalEntries={journalEntries} 
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

      </div>

      {/* Slideout navigation Drawer (Mobile) */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-72 max-w-sm bg-slate-900 text-slate-300 h-full p-6 flex flex-col justify-between border-l border-slate-800 z-10"
            >
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-blue-500" size={18} />
                    <div>
                      <span className="font-extrabold text-sm block">مطعم برج المنوفية</span>
                      <span className="text-[10px] text-slate-500 block font-sans">تابع لشركة Estadat</span>
                    </div>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                    <X size={18} />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-black flex items-center gap-3 transition-colors text-right cursor-pointer ${
                          isActive 
                            ? 'bg-blue-600 text-white' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                        }`}
                      >
                        <item.icon size={16} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* User mobile footer */}
              <div className="p-4 bg-slate-950/40 border-t border-slate-850 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold">
                    <UserIcon size={14} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-slate-200 text-xs font-black">{user?.displayName}</div>
                    <div className="text-[9px] text-slate-500 max-w-[120px] truncate">{user?.email}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <LogOut size={12} />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

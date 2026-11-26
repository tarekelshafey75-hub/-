import { 
  Ingredient, 
  MenuItem, 
  TableItem, 
  Supplier, 
  Account, 
  RestaurantOrder, 
  JournalEntry, 
  PurchaseInvoice, 
  WasteLog 
} from './types';

export const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc-1', code: '1001', name: 'حساب الصندوق - كاش (Cash Registry)', type: 'Asset', balance: 12500 },
  { id: 'acc-2', code: '1002', name: 'حساب البنك - مدى/فيزا (Bank - Card/Pos)', type: 'Asset', balance: 34800 },
  { id: 'acc-3', code: '1101', name: 'مخزون المواد الغذائية والمكونات (Food Inventory)', type: 'Asset', balance: 8520 },
  { id: 'acc-4', code: '1201', name: 'حساب الذمم المدينة - تطبيقات التوصيل (Accounts Receivable)', type: 'Asset', balance: 1450 },
  { id: 'acc-5', code: '2001', name: 'حساب الذمم الدائنة - الموردين (Accounts Payable)', type: 'Liability', balance: 4100 },
  { id: 'acc-6', code: '3001', name: 'رأس المال المستثمر (Owner Capital)', type: 'Equity', balance: 50000 },
  { id: 'acc-7', code: '4001', name: 'إيرادات مبيعات المطعم (Sales Revenue)', type: 'Revenue', balance: 25400 },
  { id: 'acc-8', code: '5001', name: 'تكلفة المبيعات والمكونات - COGS (Cost of Food)', type: 'Expense', balance: 9150 },
  { id: 'acc-9', code: '5002', name: 'خسائر هدر وتلف المواد (Inventory Waste Expense)', type: 'Expense', balance: 380 },
  { id: 'acc-10', code: '5101', name: 'إيجار وتشغيل الفروع والمطعم (Store Operating Expenses)', type: 'Expense', balance: 2700 }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'مؤسسة الرياض لتوريد اللحوم الطازجة', contactPerson: 'أحمد القحطاني', phone: '+966 50 123 4567', email: 'meats@riyadhsupply.sa', address: 'حي المروة، الرياض' },
  { id: 'sup-2', name: 'شركة مزارع نجد للخضار والفاكهة', contactPerson: 'خالد الرشيد', phone: '+966 54 888 1234', email: 'fresh@najdfarms.com.sa', address: 'منطقة القصيم الزراعية' },
  { id: 'sup-3', name: 'شركة سحابة البن العالمية المحدودة', contactPerson: 'سمير الشايب', phone: '+966 56 321 0987', email: 'sales@cloudbeans.co', address: 'جدة، حي الروضة' }
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ing-1', name: 'شريحة لحم بقري فاخر (Beef Patty 150g)', unit: 'kg', currentStock: 45.5, minStock: 10, costPerUnit: 42.0 },
  { id: 'ing-2', name: 'خبز برجر طازج بالسمسم (Session Bun)', unit: 'piece', currentStock: 120, minStock: 25, costPerUnit: 1.1 },
  { id: 'ing-3', name: 'جبنة شيدر شرائح (Cheese Slices)', unit: 'piece', currentStock: 140, minStock: 30, costPerUnit: 0.6 },
  { id: 'ing-4', name: 'خس كابوتشا طازج (Lettuce)', unit: 'kg', currentStock: 12.0, minStock: 3, costPerUnit: 8.5 },
  { id: 'ing-5', name: 'حبات بطاطس طازجة (French Fries)', unit: 'kg', currentStock: 85.0, minStock: 15, costPerUnit: 5.2 },
  { id: 'ing-6', name: 'حبوب قهوة مختصة إثيوبي (Ethiopian Coffee Beans)', unit: 'kg', currentStock: 8.8, minStock: 2, costPerUnit: 95.0 },
  { id: 'ing-7', name: 'حليب كامل الدسم مبخر (Fresh Milk)', unit: 'liter', currentStock: 32.0, minStock: 8, costPerUnit: 6.0 },
  { id: 'ing-8', name: 'فيليه سالمون ترو طازج (Salmon Fillet)', unit: 'kg', currentStock: 14.5, minStock: 4, costPerUnit: 110.0 },
  { id: 'ing-9', name: 'شراب السكر الطبيعي (Sugar Syrup)', unit: 'liter', currentStock: 15.0, minStock: 3, costPerUnit: 12.0 },
  { id: 'ing-10', name: 'نعناع وليمون حامض طازج (Mint & Lime)', unit: 'kg', currentStock: 6.5, minStock: 2, costPerUnit: 15.0 },
  { id: 'ing-11', name: 'بودرة آيس كريم فانيليا (Vanilla Base)', unit: 'kg', currentStock: 20.0, minStock: 5, costPerUnit: 35.0 }
];

export const INITIAL_MENU: MenuItem[] = [
  {
    id: 'menu-1',
    name: 'برجر لحم كلاسيك (Classic Beef Burger)',
    category: 'وجبات رئيسية (Grill)',
    price: 34.0,
    prepSection: 'Grill',
    active: true,
    recipe: [
      { ingredientId: 'ing-1', name: 'شريحة لحم بقري فاخر (Beef Patty 150g)', quantity: 0.150, unit: 'kg' },
      { ingredientId: 'ing-2', name: 'خبز برجر طازج بالسمسم (Session Bun)', quantity: 1, unit: 'piece' },
      { ingredientId: 'ing-3', name: 'جبنة شيدر شرائح (Cheese Slices)', quantity: 1, unit: 'piece' },
      { ingredientId: 'ing-4', name: 'خس كابوتشا طازج (Lettuce)', quantity: 0.020, unit: 'kg' }
    ],
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 'menu-2',
    name: 'بطاطس مقلية ذهبية (Golden French Fries)',
    category: 'المقبلات (Appetizer)',
    price: 12.0,
    prepSection: 'Grill',
    active: true,
    recipe: [
      { ingredientId: 'ing-5', name: 'حبات بطاطس طازجة (French Fries)', quantity: 0.200, unit: 'kg' }
    ],
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 'menu-3',
    name: 'فيلي سالمون مشوي (Flame Salmon Fillet)',
    category: 'إطباق بحرية (Grill)',
    price: 68.0,
    prepSection: 'Grill',
    active: true,
    recipe: [
      { ingredientId: 'ing-8', name: 'فيليه سالمون ترو طازج (Salmon Fillet)', quantity: 0.220, unit: 'kg' }
    ],
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 'menu-4',
    name: 'كورتادو السحابة الباردة (Cortado Latte)',
    category: 'مشروبات (Drinks)',
    price: 18.0,
    prepSection: 'Drinks',
    active: true,
    recipe: [
      { ingredientId: 'ing-6', name: 'حبوب قهوة مختصة إثيوبي (Ethiopian Coffee Beans)', quantity: 0.018, unit: 'kg' },
      { ingredientId: 'ing-7', name: 'حليب كامل الدسم مبخر (Fresh Milk)', quantity: 0.150, unit: 'liter' }
    ],
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 'menu-5',
    name: 'موهيتو الإنتعاش الكلاسيكي (Mint Mojito)',
    category: 'مشروبات (Drinks)',
    price: 16.0,
    prepSection: 'Drinks',
    active: true,
    recipe: [
      { ingredientId: 'ing-9', name: 'شراب السكر الطبيعي (Sugar Syrup)', quantity: 0.040, unit: 'liter' },
      { ingredientId: 'ing-10', name: 'نعناع وليمون حامض طازج (Mint & Lime)', quantity: 0.025, unit: 'kg' }
    ],
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 'menu-6',
    name: 'سنداي الفانيليا الفاخر (Vanilla Sundae)',
    category: 'الحلويات (Dessert)',
    price: 15.0,
    prepSection: 'Dessert',
    active: true,
    recipe: [
      { ingredientId: 'ing-11', name: 'بودرة آيس كريم فانيليا (Vanilla Base)', quantity: 0.080, unit: 'kg' }
    ],
    image: 'https://images.unsplash.com/photo-1501443721117-37d2a1b94009?w=400&auto=format&fit=crop&q=60'
  }
];

export const INITIAL_TABLES: TableItem[] = [
  { id: 'tbl-1', number: 'الطاولة 1 (Dine-in)', status: 'Empty' },
  { id: 'tbl-2', number: 'الطاولة 2 (Dine-in)', status: 'Empty' },
  { id: 'tbl-3', number: 'الطاولة 3 (Vip)', status: 'Empty' },
  { id: 'tbl-4', number: 'الطاولة 4 (Family)', status: 'Empty' },
  { id: 'tbl-5', number: 'الطاولة 5 (Dine-in)', status: 'Empty' }
];

export const INITIAL_ORDERS: RestaurantOrder[] = [
  {
    id: 'order-1',
    orderNumber: 'ORD-2026-0501',
    type: 'Dine-in',
    tableId: 'tbl-1',
    tableNumber: 'الطاولة 1 (Dine-in)',
    items: [
      { menuItemId: 'menu-1', name: 'برجر لحم كلاسيك (Classic Beef Burger)', price: 34.0, quantity: 2 },
      { menuItemId: 'menu-2', name: 'بطاطس مقلية ذهبية (Golden French Fries)', price: 12.0, quantity: 1 },
      { menuItemId: 'menu-5', name: 'موهيتو الإنتعاش الكلاسيكي (Mint Mojito)', price: 16.0, quantity: 2 }
    ],
    subtotal: 112.0,
    tax: 16.8,
    total: 128.8,
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    status: 'Delivered',
    createdAt: new Date(Date.now() - 3600000 * 2.5),
    completedAt: new Date(Date.now() - 3600000 * 2)
  },
  {
    id: 'order-2',
    orderNumber: 'ORD-2026-0502',
    type: 'Takeaway',
    items: [
      { menuItemId: 'menu-3', name: 'فيلي سالمون مشوي (Flame Salmon Fillet)', price: 68.0, quantity: 1 },
      { menuItemId: 'menu-4', name: 'كورتادو السحابة الباردة (Cortado Latte)', price: 18.0, quantity: 1 }
    ],
    subtotal: 86.0,
    tax: 12.9,
    total: 98.9,
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    status: 'Delivered',
    createdAt: new Date(Date.now() - 3600000 * 1.5),
    completedAt: new Date(Date.now() - 3600000 * 1)
  },
  {
    id: 'order-3',
    orderNumber: 'ORD-2026-0503',
    type: 'Dine-in',
    tableId: 'tbl-2',
    tableNumber: 'الطاولة 2 (Dine-in)',
    items: [
      { menuItemId: 'menu-1', name: 'برجر لحم كلاسيك (Classic Beef Burger)', price: 34.0, quantity: 1 },
      { menuItemId: 'menu-2', name: 'بطاطس مقلية ذهبية (Golden French Fries)', price: 12.0, quantity: 1 }
    ],
    subtotal: 46.0,
    tax: 6.9,
    total: 52.9,
    paymentStatus: 'Unpaid',
    status: 'Preparing',
    createdAt: new Date(Date.now() - 15 * 60000)
  },
  {
    id: 'order-4',
    orderNumber: 'ORD-2026-0504',
    type: 'Delivery',
    customerName: 'فهد السلمي (مشرف الهدا)',
    items: [
      { menuItemId: 'menu-1', name: 'برجر لحم كلاسيك (Classic Beef Burger)', price: 34.0, quantity: 3 },
      { menuItemId: 'menu-6', name: 'سنداي الفانيليا الفاخر (Vanilla Sundae)', price: 15.0, quantity: 2 }
    ],
    subtotal: 132.0,
    tax: 19.8,
    total: 151.8,
    paymentMethod: 'Foodics',
    paymentStatus: 'Paid',
    status: 'Pending',
    createdAt: new Date(Date.now() - 5 * 60000)
  }
];

export const INITIAL_PURCHASES: PurchaseInvoice[] = [
  {
    id: 'pi-1',
    invoiceNumber: 'PINV-2026-01',
    supplierId: 'sup-1',
    supplierName: 'مؤسسة الرياض لتوريد اللحوم الطازجة',
    date: new Date(Date.now() - 3600000 * 24 * 3),
    items: [
      { ingredientId: 'ing-1', name: 'شريحة لحم بقري فاخر (Beef Patty 150g)', quantity: 20, unit: 'kg', pricePerUnit: 40.0, total: 800.0 }
    ],
    totalAmount: 800.0,
    paymentStatus: 'Paid'
  },
  {
    id: 'pi-2',
    invoiceNumber: 'PINV-2026-02',
    supplierId: 'sup-3',
    supplierName: 'شركة سحابة البن العالمية المحدودة',
    date: new Date(Date.now() - 3600000 * 24 * 1),
    items: [
      { ingredientId: 'ing-6', name: 'حبوب قهوة مختصة إثيوبي (Ethiopian Coffee Beans)', quantity: 5, unit: 'kg', pricePerUnit: 90.0, total: 450.0 }
    ],
    totalAmount: 450.0,
    paymentStatus: 'Paid'
  }
];

export const INITIAL_JOURNAL: JournalEntry[] = [
  {
    id: 'je-1',
    entryNumber: 'JV-2026-0001',
    date: new Date(Date.now() - 3600000 * 24 * 10),
    description: 'إييداع رأس المال المستثمر في البنك لتأسيس المشروع',
    reference: 'تأسيس المطعم',
    lines: [
      { accountId: 'acc-2', accountName: 'حساب البنك - مدى/فيزا (Bank - Card/Pos)', debit: 50000, credit: 0 },
      { accountId: 'acc-6', accountName: 'رأس المال المستثمر (Owner Capital)', debit: 0, credit: 50000 }
    ]
  },
  {
    id: 'je-2',
    entryNumber: 'JV-2026-0002',
    date: new Date(Date.now() - 3600000 * 24 * 5),
    description: 'شراء الدفعة الأولى من المواد واللحوم نقداً للغذاء',
    reference: 'تغذية المخزن الأولية',
    lines: [
      { accountId: 'acc-3', accountName: 'مخزون المواد الغذائية والمكونات (Food Inventory)', debit: 1500, credit: 0 },
      { accountId: 'acc-1', accountName: 'حساب الصندوق - كاش (Cash Registry)', debit: 0, credit: 1500 }
    ]
  }
];

export const INITIAL_WASTE: WasteLog[] = [
  {
    id: 'wl-1',
    ingredientId: 'ing-4',
    name: 'خس كابوتشا طازج (Lettuce)',
    quantity: 1.5,
    unit: 'kg',
    reason: 'Spoiled',
    loggedAt: new Date(Date.now() - 3600000 * 24 * 2),
    cost: 12.75
  },
  {
    id: 'wl-2',
    ingredientId: 'ing-7',
    name: 'حليب كامل الدسم مبخر (Fresh Milk)',
    quantity: 3,
    unit: 'liter',
    reason: 'Expired',
    loggedAt: new Date(Date.now() - 3600000 * 12),
    cost: 18.0
  }
];

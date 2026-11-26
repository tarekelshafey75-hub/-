export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  balance: number;
}

export interface JournalEntryLine {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: any; // Date, any or Timestamp
  description: string;
  reference: string;
  lines: JournalEntryLine[];
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string; // e.g. 'kg', 'g', 'piece', 'liter', 'ml'
  currentStock: number;
  minStock: number; // Low stock alert threshold
  costPerUnit: number; // Current weighted average cost
  supplierId?: string;
}

export interface RecipeItem {
  ingredientId: string;
  name: string;
  quantity: number; // Quantity of ingredient needed (e.g., 0.150 for 150g in a kg ingredient)
  unit: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string; // e.g. 'Grill', 'Drinks', 'Dessert', 'Appetizer'
  price: number;
  recipe: RecipeItem[];
  prepSection: 'Grill' | 'Drinks' | 'Dessert' | 'General';
  active: boolean;
  image?: string;
}

export interface TableItem {
  id: string;
  number: string;
  status: 'Empty' | 'Occupied';
  currentOrderId?: string;
}

export interface POSItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface RestaurantOrder {
  id: string;
  orderNumber: string;
  type: 'Dine-in' | 'Takeaway' | 'Delivery';
  tableId?: string;
  tableNumber?: string;
  customerName?: string;
  items: POSItem[];
  subtotal: number;
  tax: number; // 15% VAT in Saudi Arabia style
  total: number;
  paymentMethod?: 'Cash' | 'Card' | 'Foodics';
  paymentStatus: 'Unpaid' | 'Paid';
  status: 'Pending' | 'Preparing' | 'Ready' | 'Delivered' | 'Cancelled';
  createdAt: any;
  completedAt?: any;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address?: string;
}

export interface PurchaseInvoiceItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  total: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  date: any;
  items: PurchaseInvoiceItem[];
  totalAmount: number;
  paymentStatus: 'Paid' | 'Unpaid';
}

export interface WasteLog {
  id: string;
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  reason: 'Spoiled' | 'Spilled' | 'Expired' | 'Other';
  loggedAt: any;
  cost: number;
}

export interface Review {
  id: string;
  text: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
}

export interface AnalysisResult {
  reviews: Review[];
  summary: string;
  trends: { date: string; score: number }[];
  wordCloud: { text: string; value: number; type: 'praise' | 'complaint' }[];
  topActionableItems: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}


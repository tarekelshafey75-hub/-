import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  onSnapshot,
  query,
  orderBy,
  runTransaction
} from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './error-handler';
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
} from '../types';
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
} from '../data';

// Helper to check and seed initial data in Firestore if empty
export async function seedInitialData() {
  try {
    const q = query(collection(db, 'accounts'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      console.log('Database already seeded.');
      return;
    }
    
    console.log('Seeding initial data...');
    
    // 1. Seed Accounts
    for (const acc of INITIAL_ACCOUNTS) {
      await setDoc(doc(db, 'accounts', acc.id), acc);
    }
    
    // 2. Seed Suppliers
    for (const sup of INITIAL_SUPPLIERS) {
      await setDoc(doc(db, 'suppliers', sup.id), sup);
    }
    
    // 3. Seed Ingredients
    for (const ing of INITIAL_INGREDIENTS) {
      await setDoc(doc(db, 'ingredients', ing.id), ing);
    }
    
    // 4. Seed Menu Items
    for (const item of INITIAL_MENU) {
      await setDoc(doc(db, 'menuItems', item.id), item);
    }
    
    // 5. Seed Tables
    for (const tbl of INITIAL_TABLES) {
      await setDoc(doc(db, 'tables', tbl.id), tbl);
    }
    
    // 6. Seed Orders
    for (const order of INITIAL_ORDERS) {
      // Convert Date objects to serialized format or keep as timestamps
      const formatted = {
        ...order,
        createdAt: order.createdAt.toISOString ? order.createdAt.toISOString() : order.createdAt,
        completedAt: order.completedAt?.toISOString ? order.completedAt.toISOString() : order.completedAt || null
      };
      await setDoc(doc(db, 'orders', order.id), formatted);
    }
    
    // 7. Seed Purchases
    for (const pi of INITIAL_PURCHASES) {
      const formatted = {
        ...pi,
        date: pi.date.toISOString ? pi.date.toISOString() : pi.date
      };
      await setDoc(doc(db, 'purchaseInvoices', pi.id), formatted);
    }
    
    // 8. Seed Journal Entries
    for (const je of INITIAL_JOURNAL) {
      const formatted = {
        ...je,
        date: je.date.toISOString ? je.date.toISOString() : je.date
      };
      await setDoc(doc(db, 'journalEntries', je.id), formatted);
    }
    
    // 9. Seed Waste
    for (const wl of INITIAL_WASTE) {
      const formatted = {
        ...wl,
        loggedAt: wl.loggedAt.toISOString ? wl.loggedAt.toISOString() : wl.loggedAt
      };
      await setDoc(doc(db, 'wasteLogs', wl.id), formatted);
    }
    
    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding initial databases: ', err);
  }
}

// Generate new general ledger automated journal and adjust Account asset/liability balances in transaction
export async function recordSalesReceiptTransaction(orderData: Omit<RestaurantOrder, 'id' | 'orderNumber'>) {
  const orderId = 'ord-' + Math.random().toString(36).substr(2, 9);
  const orderNumber = 'ORD-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);
  
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Fetch current ingredient stock & menu items for cost evaluation
      const menuRef = collection(db, 'menuItems');
      const ingRef = collection(db, 'ingredients');
      const accRef = collection(db, 'accounts');
      
      const ingredientsSnapshot = await getDocs(ingRef);
      const ingredientsMap: Record<string, Ingredient> = {};
      ingredientsSnapshot.forEach(doc => {
        ingredientsMap[doc.id] = { id: doc.id, ...doc.data() } as Ingredient;
      });
      
      // Calculate total COGS and update ingredient stocks
      let totalCOGS = 0;
      const ingredientUpdates: Record<string, number> = {}; // ingredientId -> newStock
      
      for (const item of orderData.items) {
        // Fetch recipe from order item
        const menuDocRef = doc(db, 'menuItems', item.menuItemId);
        const menuDoc = await transaction.get(menuDocRef);
        if (menuDoc.exists()) {
          const menuItem = menuDoc.data() as MenuItem;
          for (const rec of menuItem.recipe || []) {
            const ingId = rec.ingredientId;
            const currentIng = ingredientsMap[ingId];
            if (currentIng) {
              const qtyNeeded = rec.quantity * item.quantity;
              const unitCost = currentIng.costPerUnit || 0;
              totalCOGS += qtyNeeded * unitCost;
              
              // New stock
              const oldStock = ingredientUpdates[ingId] !== undefined ? ingredientUpdates[ingId] : currentIng.currentStock;
              ingredientUpdates[ingId] = Math.max(0, oldStock - qtyNeeded);
            }
          }
        }
      }
      
      // 2. Perform Ingredient Stock updates
      for (const [ingId, newStock] of Object.entries(ingredientUpdates)) {
        const ingDocRef = doc(db, 'ingredients', ingId);
        transaction.update(ingDocRef, { currentStock: newStock });
      }
      
      // 3. Update Table Status if Dine-in
      if (orderData.type === 'Dine-in' && orderData.tableId) {
        const tableDocRef = doc(db, 'tables', orderData.tableId);
        transaction.update(tableDocRef, { status: orderData.paymentStatus === 'Paid' ? 'Empty' : 'Occupied', currentOrderId: orderData.paymentStatus === 'Paid' ? null : orderId });
      }
      
      // 4. Update Financial Accounts balances
      // Accounts mapped:
      // Cash Register: acc-1 (Asset)
      // Card Bank: acc-2 (Asset)
      // Accounts Receivable (Delivery app etc): acc-4 (Asset)
      // Food Inventory: acc-3 (Asset)
      // Sales Revenue: acc-7 (Revenue)
      // COGS Expense: acc-8 (Expense)
      
      const acc1Ref = doc(db, 'accounts', 'acc-1');
      const acc2Ref = doc(db, 'accounts', 'acc-2');
      const acc3Ref = doc(db, 'accounts', 'acc-3');
      const acc4Ref = doc(db, 'accounts', 'acc-4');
      const acc7Ref = doc(db, 'accounts', 'acc-7');
      const acc8Ref = doc(db, 'accounts', 'acc-8');
      
      const a1Snap = await transaction.get(acc1Ref);
      const a2Snap = await transaction.get(acc2Ref);
      const a3Snap = await transaction.get(acc3Ref);
      const a4Snap = await transaction.get(acc4Ref);
      const a7Snap = await transaction.get(acc7Ref);
      const a8Snap = await transaction.get(acc8Ref);
      
      let debitAccountId = 'acc-1';
      let debitAccountName = 'حساب الصندوق - كاش (Cash Registry)';
      
      if (orderData.paymentMethod === 'Card') {
        debitAccountId = 'acc-2';
        debitAccountName = 'حساب البنك - مدى/فيزا (Bank - Card/Pos)';
        transaction.update(acc2Ref, { balance: (a2Snap.data()?.balance || 0) + orderData.total });
      } else if (orderData.paymentMethod === 'Foodics' || orderData.type === 'Delivery') {
        debitAccountId = 'acc-4';
        debitAccountName = 'حساب الذمم المدينة - تطبيقات التوصيل (Accounts Receivable)';
        transaction.update(acc4Ref, { balance: (a4Snap.data()?.balance || 0) + orderData.total });
      } else {
        transaction.update(acc1Ref, { balance: (a1Snap.data()?.balance || 0) + orderData.total });
      }
      
      // Increase revenue
      transaction.update(acc7Ref, { balance: (a7Snap.data()?.balance || 0) + orderData.subtotal }); // Excl. VAT or total. For simplicity, total
      
      // Increase COGS & decrease Stock
      transaction.update(acc8Ref, { balance: (a8Snap.data()?.balance || 0) + totalCOGS });
      transaction.update(acc3Ref, { balance: Math.max(0, (a3Snap.data()?.balance || 0) - totalCOGS) });
      
      // 5. Create Double-Entry Journal Document
      const jeId = 'je-' + Math.random().toString(36).substr(2, 9);
      const entryNumber = 'JV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      const journalEntry: JournalEntry = {
        id: jeId,
        entryNumber,
        date: new Date().toISOString(),
        description: `تسجيل مبيعات طلب رقم ${orderNumber} (${orderData.type})`,
        reference: orderNumber,
        lines: [
          { accountId: debitAccountId, accountName: debitAccountName, debit: orderData.total, credit: 0 },
          { accountId: 'acc-7', accountName: 'إيرادات مبيعات المطعم (Sales Revenue)', debit: 0, credit: orderData.total },
          { accountId: 'acc-8', accountName: 'تكلفة المبيعات والمكونات - COGS (Cost of Food)', debit: totalCOGS, credit: 0 },
          { accountId: 'acc-3', accountName: 'مخزون المواد الغذائية والمكونات (Food Inventory)', debit: 0, credit: totalCOGS }
        ]
      };
      
      transaction.set(doc(db, 'journalEntries', jeId), journalEntry);
      
      // 6. Write Order details
      const finalOrder: RestaurantOrder = {
        ...orderData,
        id: orderId,
        orderNumber,
        createdAt: new Date().toISOString()
      };
      transaction.set(doc(db, 'orders', orderId), finalOrder);
    });
    
    return { success: true, orderNumber };
  } catch (err) {
    console.error('Error recording sales transaction: ', err);
    throw err;
  }
}

// Add inventory stock when supplier bill is registered and update average ingredient price & double-entry accounting
export async function addPurchaseInvoiceTransaction(pInvoice: Omit<PurchaseInvoice, 'id'>) {
  const piId = 'pi-' + Math.random().toString(36).substr(2, 9);
  
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Fetch current ingredients to recalculate average cost
      for (const item of pInvoice.items) {
        const ingDocRef = doc(db, 'ingredients', item.ingredientId);
        const ingSnap = await transaction.get(ingDocRef);
        if (ingSnap.exists()) {
          const ingData = ingSnap.data() as Ingredient;
          const oldStock = ingData.currentStock || 0;
          const oldCost = ingData.costPerUnit || 0;
          
          const pushedStock = item.quantity;
          const pushedCost = item.pricePerUnit;
          
          // Weighted Average Cost calculation
          const totalStock = oldStock + pushedStock;
          const newCost = totalStock > 0 ? ((oldStock * oldCost) + (pushedStock * pushedCost)) / totalStock : pushedCost;
          
          transaction.update(ingDocRef, {
            currentStock: totalStock,
            costPerUnit: Number(newCost.toFixed(2))
          });
        }
      }
      
      // 2. Adjust Ledger entries and accounts
      // Accounts mapped:
      // Food Inventory: acc-3 (Asset)
      // Accounts Payable / Suppliers: acc-5 (Liability)
      // Direct Cash Register Payment: acc-1 (Asset)
      const isPaid = pInvoice.paymentStatus === 'Paid';
      const offsetAccountId = isPaid ? 'acc-1' : 'acc-5';
      const offsetAccountName = isPaid ? 'حساب الصندوق - كاش (Cash Registry)' : 'حساب الذمم الدائنة - الموردين (Accounts Payable)';
      
      const acc3Ref = doc(db, 'accounts', 'acc-3');
      const offsetAccRef = doc(db, 'accounts', offsetAccountId);
      
      const a3Snap = await transaction.get(acc3Ref);
      const offsetSnap = await transaction.get(offsetAccRef);
      
      // Update Food Inventory asset account
      transaction.update(acc3Ref, { balance: (a3Snap.data()?.balance || 0) + pInvoice.totalAmount });
      
      // Update offset account (Decrease cash if cash-paid / Increase AP liability if unpaid)
      const currentOffsetBalance = offsetSnap.data()?.balance || 0;
      if (isPaid) {
        transaction.update(offsetAccRef, { balance: currentOffsetBalance - pInvoice.totalAmount });
      } else {
        transaction.update(offsetAccRef, { balance: currentOffsetBalance + pInvoice.totalAmount });
      }
      
      // 3. Create Automated Bookkeeping Entry
      const jeId = 'je-' + Math.random().toString(36).substr(2, 9);
      const entryNumber = 'JV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      
      const journalEntry: JournalEntry = {
        id: jeId,
        entryNumber,
        date: new Date().toISOString(),
        description: `فاتورة توريد مواد غذائية من ${pInvoice.supplierName} (رقم: ${pInvoice.invoiceNumber})`,
        reference: pInvoice.invoiceNumber,
        lines: [
          { accountId: 'acc-3', accountName: 'مخزون المواد الغذائية والمكونات (Food Inventory)', debit: pInvoice.totalAmount, credit: 0 },
          { accountId: offsetAccountId, accountName: offsetAccountName, debit: 0, credit: pInvoice.totalAmount }
        ]
      };
      
      transaction.set(doc(db, 'journalEntries', jeId), journalEntry);
      
      // 4. Save purchase invoice
      const finalInvoice = {
        ...pInvoice,
        id: piId,
        date: new Date().toISOString()
      };
      transaction.set(doc(db, 'purchaseInvoices', piId), finalInvoice);
    });
    
    return { success: true };
  } catch (err) {
    console.error('Error adding purchase transaction: ', err);
    throw err;
  }
}

// Log food waste, update inventory levels and book into general journal
export async function createWasteLogTransaction(wasteData: Omit<WasteLog, 'id' | 'loggedAt'>) {
  const wlId = 'wl-' + Math.random().toString(36).substr(2, 9);
  
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Fetch ingredient detail and deduct stock
      const ingDocRef = doc(db, 'ingredients', wasteData.ingredientId);
      const ingSnap = await transaction.get(ingDocRef);
      
      if (!ingSnap.exists()) {
        throw new Error('Ingredient not found');
      }
      
      const ingData = ingSnap.data() as Ingredient;
      const oldStock = ingData.currentStock || 0;
      const newStock = Math.max(0, oldStock - wasteData.quantity);
      
      transaction.update(ingDocRef, { currentStock: newStock });
      
      // 2. Adjust financial ledger
      // Inventory Waste Expense: acc-9 (Expense)
      // Food Inventory: acc-3 (Asset)
      const acc3Ref = doc(db, 'accounts', 'acc-3');
      const acc9Ref = doc(db, 'accounts', 'acc-9');
      
      const a3Snap = await transaction.get(acc3Ref);
      const a9Snap = await transaction.get(acc9Ref);
      
      transaction.update(acc9Ref, { balance: (a9Snap.data()?.balance || 0) + wasteData.cost });
      transaction.update(acc3Ref, { balance: Math.max(0, (a3Snap.data()?.balance || 0) - wasteData.cost) });
      
      // 3. Create General Journal entry
      const jeId = 'je-' + Math.random().toString(36).substr(2, 9);
      const entryNumber = 'JV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      
      const journalEntry: JournalEntry = {
        id: jeId,
        entryNumber,
        date: new Date().toISOString(),
        description: `تسجيل هدر وتلف صنف مخزني: ${wasteData.name} - السبب: ${wasteData.reason}`,
        reference: wlId,
        lines: [
          { accountId: 'acc-9', accountName: 'خسائر هدر وتلف المواد (Inventory Waste Expense)', debit: wasteData.cost, credit: 0 },
          { accountId: 'acc-3', accountName: 'مخزون المواد الغذائية والمكونات (Food Inventory)', debit: 0, credit: wasteData.cost }
        ]
      };
      
      transaction.set(doc(db, 'journalEntries', jeId), journalEntry);
      
      // 4. Save Waste Log document
      const finalLog: WasteLog = {
        ...wasteData,
        id: wlId,
        loggedAt: new Date().toISOString()
      };
      
      transaction.set(doc(db, 'wasteLogs', wlId), finalLog);
    });
    
    return { success: true };
  } catch (err) {
    console.error('Error writing waste log: ', err);
    throw err;
  }
}

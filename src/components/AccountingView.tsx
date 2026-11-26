import React, { useState } from 'react';
import { 
  BarChart, 
  Settings, 
  FileSpreadsheet, 
  FileText, 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Check, 
  CheckCircle2, 
  AlertTriangle,
  Coins,
  Download
} from 'lucide-react';
import { Account, JournalEntry } from '../types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';

interface AccountingViewProps {
  accounts: Account[];
  journalEntries: JournalEntry[];
}

export const AccountingView: React.FC<AccountingViewProps> = ({
  accounts,
  journalEntries
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'chart' | 'journal' | 'pl' | 'balance_sheet'>('chart');

  // Helper to fetch account balances
  const getBal = (accId: string) => {
    return accounts.find(a => a.id === accId)?.balance || 0;
  };

  // 1. Chart of Accounts calculations
  const assetsAccounts = accounts.filter(a => a.type === 'Asset');
  const liabilitiesAccounts = accounts.filter(a => a.type === 'Liability');
  const equityAccounts = accounts.filter(a => a.type === 'Equity');
  const revenueAccounts = accounts.filter(a => a.type === 'Revenue');
  const expenseAccounts = accounts.filter(a => a.type === 'Expense');

  // 2. Profit & Loss Statement Calculations
  const totalRevenue = revenueAccounts.reduce((sum, a) => sum + a.balance, 0);
  const cogsExpense = getBal('acc-8');
  const wasteExpense = getBal('acc-9');
  const totalExpenses = expenseAccounts.reduce((sum, a) => sum + a.balance, 0);
  
  const grossProfit = totalRevenue - cogsExpense;
  const netProfit = totalRevenue - totalExpenses;

  // 3. Balance Sheet calculations
  // Assets: Cash + Bank + Food Inventory + Accounts Receivable
  const totalAssets = assetsAccounts.reduce((sum, a) => sum + a.balance, 0);
  
  // Liabilities
  const totalLiabilities = liabilitiesAccounts.reduce((sum, a) => sum + a.balance, 0);
  
  // Equity: Initial Capital + Current Net Profit!
  const ownerEquityValue = getBal('acc-6'); // Base Capital
  const totalEquity = ownerEquityValue + netProfit;

  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  // Ledger verification check (Double-entry balance check)
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.05;

  // CSV Download Utilities with UTF-8 BOM so Arabic imports beautifully into Excel
  const downloadChartOfAccountsCSV = () => {
    const BOM = "\uFEFF";
    let csvContent = "رمز الحساب,اسم الحساب الدفتري,التبويب المحالي,الرصيد (ر.س)\n";
    accounts.forEach(acc => {
      const typeLabels: Record<string, string> = {
        Asset: 'أصول',
        Liability: 'خصوم',
        Equity: 'حقوق الملكية',
        Revenue: 'إيرادات',
        Expense: 'تكاليف ومصاريف'
      };
      const label = typeLabels[acc.type] || acc.type;
      const row = [
        acc.id,
        `"${acc.name.replace(/"/g, '""')}"`,
        `"${label}"`,
        acc.balance.toFixed(2)
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `دليل_الحسابات_برج_المنوفية_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJournalEntriesCSV = () => {
    const BOM = "\uFEFF";
    let csvContent = "رقم القيد,الوصف,تاريخ القيد,المرجع,رمز الحساب,اسم الحساب,مدين,دائن\n";
    
    journalEntries.forEach(je => {
      je.lines.forEach(line => {
        const row = [
          je.entryNumber,
          `"${je.description.replace(/"/g, '""')}"`,
          new Date(je.date).toLocaleDateString('ar-EG'),
          `"${je.reference.replace(/"/g, '""')}"`,
          line.accountId,
          `"${line.accountName.split(' - ')[0].replace(/"/g, '""')}"`,
          line.debit || 0,
          line.credit || 0
        ];
        csvContent += row.join(",") + "\n";
      });
    });

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `القيود_اليومية_برج_المنوفية_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadProfitLossCSV = () => {
    const BOM = "\uFEFF";
    let csvContent = "البند المحاسبي,القيمة التشغيلية (ر.س)\n";
    
    csvContent += `إيرادات مبيعات المطعم (الكلية),${totalRevenue.toFixed(2)}\n`;
    csvContent += `صافي الإيراد,${totalRevenue.toFixed(2)}\n`;
    csvContent += `تكلفة اللحوم والمكونات المستهلكة (BOM Food Cost),-${cogsExpense.toFixed(2)}\n`;
    csvContent += `إجمالي تكلفة المبيعات,-${cogsExpense.toFixed(2)}\n`;
    csvContent += `إجمالي الربح التشغيلي لمبيعات المنيو (Gross Profit),${grossProfit.toFixed(2)}\n`;
    csvContent += `خسائر ومصاريف هدر وتلف الأطعمة والمواد الخام,-${wasteExpense.toFixed(2)}\n`;
    csvContent += `إجمالي مصاريف التشغيل الطارئة,-${wasteExpense.toFixed(2)}\n`;
    csvContent += `صافي الربح النهائي (Net Profit),${netProfit.toFixed(2)}\n`;

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `بيان_الأرباح_والخسائر_برج_المنوفية_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadBalanceSheetCSV = () => {
    const BOM = "\uFEFF";
    let csvContent = "التبويب المحاسبي,البند المالي,القيمة (ر.س)\n";
    
    csvContent += "الأصول (Assets),,\n";
    assetsAccounts.forEach(a => {
      csvContent += `,${a.name.split(' - ')[0]},${a.balance.toFixed(2)}\n`;
    });
    csvContent += `,إجمالي الأصول,${totalAssets.toFixed(2)}\n\n`;
    
    csvContent += "الخصوم وحقوق الملكية (Liabilities & Equity),,\n";
    csvContent += `,ذمم دائنة موردين AP,${getBal('acc-5').toFixed(2)}\n`;
    csvContent += `,رأس مال شريك مؤسس,${getBal('acc-6').toFixed(2)}\n`;
    csvContent += `,صافي الأرباح المرحلة للعام,${netProfit.toFixed(2)}\n`;
    csvContent += `,إجمالي الخصوم وحقوق الملكية,${totalLiabilitiesAndEquity.toFixed(2)}\n`;
    
    csvContent += `\nالتوازن المالي,${isBalanced ? "موزون" : "غير متوازن"},${(totalAssets - totalLiabilitiesAndEquity).toFixed(2)}\n`;

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `الميزانية_العمومية_برج_المنوفية_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    if (activeSubTab === 'chart') downloadChartOfAccountsCSV();
    if (activeSubTab === 'journal') downloadJournalEntriesCSV();
    if (activeSubTab === 'pl') downloadProfitLossCSV();
    if (activeSubTab === 'balance_sheet') downloadBalanceSheetCSV();
  };

  const getExportButtonLabel = () => {
    if (activeSubTab === 'chart') return 'تصدير شجرة الحسابات (CSV)';
    if (activeSubTab === 'journal') return 'تصدير قيود اليومية المحاسبية (CSV)';
    if (activeSubTab === 'pl') return 'تصدير بيان الدخل P&L (CSV)';
    if (activeSubTab === 'balance_sheet') return 'تصدير الميزانية العمومية (CSV)';
    return 'تصدير البيانات (CSV)';
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      
      {/* Header controls with submenu toggler */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="text-blue-600" />
              <span>النظام المالي المحاسبي والتقارير القانونية (Auto Accounting)</span>
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">شجرة حسابات ERP المتراكمة، حركة موازين المراجعة، قائمة الدخل P&amp;L وتأثيث الميزانية العمومية آلياً.</p>
          </div>
          
          <div className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-1.5 text-xs font-black animate-pulse">
            <CheckCircle2 size={15} />
            <span>نظام القيد المزدوج مفعل ونشط</span>
          </div>
        </div>

        {/* Sub-tabs buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'chart', label: 'دليل شجرة الحسابات', desc: 'COA Chart' },
              { id: 'journal', label: 'القيود اليومية التلقائية', desc: 'GL Entries' },
              { id: 'pl', label: 'بيان الأرباح والخسائر', desc: 'P&L Statement' },
              { id: 'balance_sheet', label: 'الميزانية العمومية الافتتاحية', desc: 'Balance Sheet' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                  activeSubTab === tab.id 
                    ? 'bg-slate-900 border-slate-900 text-white shadow' 
                    : 'bg-white border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div>{tab.label}</div>
                <div className="text-[9.5px] opacity-65 font-mono font-medium mt-0.5">{tab.desc}</div>
              </button>
            ))}
          </div>

          <div>
            <button
              id="btn-accounting-csv-export"
              onClick={handleExportCSV}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm shadow-blue-100 transition-all cursor-pointer"
            >
              <Download size={14} className="shrink-0" />
              <span>{getExportButtonLabel()}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content pane */}
      <div>
        
        {/* VIEW 1: CHART OF ACCOUNTS */}
        {activeSubTab === 'chart' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* List chart */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden md:col-span-2">
              <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-xs text-right">أرصدة حسابات الأستاذ العام</h3>
                <span className="text-[10px] text-slate-400 font-serif">Chart of Accounts Tree</span>
              </div>
              
              <table className="w-full text-right border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold">
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-4">رمز الحساب</th>
                    <th className="px-6 py-4">اسم الحساب الدفتري</th>
                    <th className="px-6 py-4">التبويب المالي</th>
                    <th className="px-6 py-4 text-left">الرصيد التراكمي المستوطن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-semibold">
                  {accounts.map((acc) => {
                    const typeLabels: Record<string, string> = {
                      Asset: 'أصول (Asset)',
                      Liability: 'خصوم (Liability)',
                      Equity: 'حقوق الملكية (Equity)',
                      Revenue: 'إيرادات مبيعات (Revenue)',
                      Expense: 'تكاليف ومصاريف (Expense)'
                    };

                    const typeColors: Record<string, string> = {
                      Asset: 'bg-blue-50 text-blue-800',
                      Liability: 'bg-purple-50 text-purple-800',
                      Equity: 'bg-violet-50 text-violet-800',
                      Revenue: 'bg-emerald-50 text-emerald-800',
                      Expense: 'bg-rose-50 text-rose-800'
                    };

                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-500">
                          {acc.id}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {acc.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${typeColors[acc.type] || 'bg-slate-50'}`}>
                            {typeLabels[acc.type] || acc.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left font-mono font-bold text-slate-900 text-sm">
                          {acc.balance.toFixed(2)} ر.س
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* VIEW 2: JOURNAL ENTRIES LIST */}
        {activeSubTab === 'journal' && (
          <div className="space-y-6">
            
            {journalEntries.map((je) => (
              <div key={je.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Journal ticket Header */}
                <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {je.entryNumber}
                    </span>
                    <strong className="text-slate-800 font-bold text-xs">{je.description}</strong>
                  </div>
                  
                  <div className="flex items-center gap-3 text-slate-400 font-mono text-[10.5px]">
                    <span>تاريخ القيد: {new Date(je.date).toLocaleDateString('ar-SA')}</span>
                    <span>المرجع: {je.reference}</span>
                  </div>
                </div>

                {/* Journal lines */}
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="bg-slate-55/40 text-slate-400 font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">حساب الأستاذ</th>
                      <th className="px-6 py-3 text-center">مدين (Debit)</th>
                      <th className="px-6 py-3 text-left">دائن (Credit)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                    {je.lines.map((ln, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/20">
                        <td className={`px-6 py-3 ${ln.credit > 0 ? 'pr-12 text-slate-500' : 'font-bold text-slate-800'}`}>
                          {ln.accountName.split(' - ')[0]} ({ln.accountId})
                        </td>
                        <td className="px-6 py-3 text-center font-mono font-bold text-slate-900">
                          {ln.debit > 0 ? `${ln.debit.toFixed(2)} ر.س` : '-'}
                        </td>
                        <td className="px-6 py-3 text-left font-mono font-bold text-slate-900">
                          {ln.credit > 0 ? `${ln.credit.toFixed(2)} ر.س` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            
            {journalEntries.length === 0 && (
              <div className="py-16 text-center bg-white rounded-3xl border border-slate-100">
                <AlertTriangle size={48} className="mx-auto text-amber-500 opacity-20 mb-3" />
                <p className="text-xs font-bold text-slate-500">لم يتم رصد أي قيود محاسبية بالدفتر اليومي العام بعد.</p>
              </div>
            )}
            
          </div>
        )}

        {/* VIEW 3: PROFIT AND LOSS STATEMENT */}
        {activeSubTab === 'pl' && (
          <div className="max-w-2xl mx-auto bg-white border border-slate-150 rounded-3xl p-8 shadow-sm text-xs font-sans">
            
            <div className="text-center space-y-2 pb-6 border-b-2 border-slate-900 mb-8">
              <h3 className="text-lg font-black text-slate-800">قائمة تقرير الأرباح والخسائر والتشغيل (P&amp;L)</h3>
              <p className="text-slate-500 text-[10.5px]">المطعم لعام {new Date().getFullYear()} - تراكمي فوري</p>
            </div>

            <div className="space-y-6">
              
              {/* 1. Revenues */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-slate-800 border-b border-slate-200 pb-2">1. الإيرادات والمبيعات التشغيلية</h4>
                <div className="flex justify-between font-bold text-slate-600">
                  <span>إيرادات مبيعات المطعم (الكلية):</span>
                  <span className="font-mono text-slate-900 font-extrabold">{totalRevenue.toFixed(2)} ر.س</span>
                </div>
                
                <div className="flex justify-between border-t border-slate-200/50 pt-2 font-black text-slate-800 text-sm">
                  <span>صافي الإيراد:</span>
                  <span className="font-mono text-slate-900">{totalRevenue.toFixed(2)} ر.س</span>
                </div>
              </div>

              {/* 2. COGS */}
              <div className="space-y-3 pt-4">
                <h4 className="font-extrabold text-xs text-slate-800 border-b border-slate-200 pb-2">2. تكلفة المبيعات ومكونات الطهي</h4>
                <div className="flex justify-between font-bold text-slate-600">
                  <span>تكلفة اللحوم والمكونات المستهلكة (BOM Food Cost):</span>
                  <span className="font-mono text-slate-900">({cogsExpense.toFixed(2)}) ر.س</span>
                </div>
                
                <div className="flex justify-between border-t border-slate-200/50 pt-2 font-black text-slate-800 text-sm">
                  <span>إجمالي تكلفة المبيعات:</span>
                  <span className="font-mono text-slate-900">({cogsExpense.toFixed(2)}) ر.س</span>
                </div>
              </div>

              {/* 3. Gross Profit */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex justify-between items-center text-sm font-black text-slate-800 my-4">
                <span>إجمالي الربح التشغيلي لمبيعات المنيو (Gross Profit):</span>
                <span className="font-mono text-slate-900">{grossProfit.toFixed(2)} ر.س</span>
              </div>

              {/* 4. Expenses */}
              <div className="space-y-3 pt-4">
                <h4 className="font-extrabold text-xs text-slate-800 border-b border-slate-200 pb-2">3. المصاريف الأخرى والتسويات الميدانية</h4>
                <div className="flex justify-between font-bold text-slate-600">
                  <span>خسائر ومصاريف هدر وتلف الأطعمة والمواد الخام:</span>
                  <span className="font-mono text-slate-950">({wasteExpense.toFixed(2)}) ر.س</span>
                </div>
                
                <div className="flex justify-between border-t border-slate-200/50 pt-2 font-black text-slate-850 text-sm">
                  <span>إجمالي مصاريف التشغيل الطارئة:</span>
                  <span className="font-mono text-slate-900">({wasteExpense.toFixed(2)}) ر.س</span>
                </div>
              </div>

              {/* 5. Net Profit */}
              <div className="bg-blue-900 p-5 rounded-2xl text-white flex justify-between items-center text-base font-black my-8 shadow shadow-blue-100">
                <span className="flex items-center gap-1.5 font-sans">
                  <Coins />
                  <span>صافي الربح النهائي (Net Profit):</span>
                </span>
                
                <span className="font-mono text-lg">{netProfit.toFixed(2)} ر.س</span>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 4: BALANCE SHEET */}
        {activeSubTab === 'balance_sheet' && (
          <div className="max-w-2xl mx-auto bg-white border border-slate-150 rounded-3xl p-8 shadow-sm text-xs font-sans">
            
            <div className="text-center space-y-2 pb-6 border-b-2 border-slate-900 mb-8">
              <h3 className="text-lg font-black text-slate-800">قائمة المركز المالي والميزانية العمومية</h3>
              <p className="text-slate-500 text-[10.5px]">حتى تاريخ اليوم - للتجارة والتشغيل الفندقي</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Assets column */}
              <div className="space-y-4">
                <h4 className="font-black text-sm text-slate-850 border-b-2 border-slate-500 pb-2 flex justify-between">
                  <span>الأصول (Assets)</span>
                  <span className="text-[10px] text-slate-400">طرف مدين</span>
                </h4>

                <div className="space-y-3 font-semibold text-slate-600">
                  {assetsAccounts.map(a => (
                    <div key={a.id} className="flex justify-between items-center">
                      <span>{a.name.split(' - ')[0]}:</span>
                      <strong className="font-mono text-slate-900">{a.balance.toFixed(2)} ر.س</strong>
                    </div>
                  ))}
                  
                  <div className="h-px bg-slate-200 my-2" />
                  
                  <div className="flex justify-between items-center font-black text-slate-900 text-xs border-t border-slate-350 pt-2 bg-slate-50 p-2.5 rounded-lg">
                    <span>إجمالي الأصول (Assets Total):</span>
                    <strong className="font-mono text-blue-600">{totalAssets.toFixed(2)} ر.س</strong>
                  </div>
                </div>
              </div>

              {/* Liabilities and Equity column */}
              <div className="space-y-4">
                <h4 className="font-black text-sm text-slate-850 border-b-2 border-slate-500 pb-2 flex justify-between">
                  <span>الخصوم وحقوق الملكية</span>
                  <span className="text-[10px] text-slate-400">طرف دائن</span>
                </h4>

                <div className="space-y-3 font-semibold text-slate-600">
                  <div className="text-[10px] text-slate-400 font-extrabold select-none mb-1">الخصوم والالتزامات:</div>
                  <div className="flex justify-between items-center">
                    <span>ذمم دائنة موردين AP:</span>
                    <strong className="font-mono text-slate-900">{getBal('acc-5').toFixed(2)} ر.س</strong>
                  </div>

                  <div className="text-[10px] text-slate-400 font-extrabold select-none mt-3 mb-1">حقوق الملكية (Equity):</div>
                  <div className="flex justify-between items-center">
                    <span>رأس مال شريك مؤسس:</span>
                    <strong className="font-mono text-slate-950">{getBal('acc-6').toFixed(2)} ر.س</strong>
                  </div>
                  <div className="flex justify-between items-center text-blue-600">
                    <span>صافي الأرباح المرحلة للعام:</span>
                    <strong className="font-mono font-black">{netProfit.toFixed(2)} ر.س</strong>
                  </div>

                  <div className="h-px bg-slate-200 my-2" />
                  
                  <div className="flex justify-between items-center font-black text-slate-900 text-xs border-t border-slate-350 pt-2 bg-slate-50 p-2.5 rounded-lg">
                    <span>إجمالي الخصوم والملكية:</span>
                    <strong className="font-mono text-blue-600">{totalLiabilitiesAndEquity.toFixed(2)} ر.س</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Verification sign banner */}
            <div className={`mt-8 p-4 rounded-2xl flex items-center justify-between text-xs font-bold border ${isBalanced ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200 animate-pulse'}`}>
              <div className="flex items-center gap-1.5">
                {isBalanced ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>حالة توازن ميزان المركز المالي:</span>
              </div>
              
              <strong className="text-sm font-black">{isBalanced ? 'موزونة بدقة (Balanced)' : 'القيد غير متوازن!'}</strong>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};

import * as XLSX from 'xlsx';
import { formatCurrency, formatSignedBalance } from './currencyFormatter';

/**
 * Exports a multi-tab, formatted Excel workbook for a Group
 */
export const exportGroupExcel = (group, expenses = [], settlements = [], simplifiedTx = [], analyticsData = null) => {
  const currency = group.currency || 'INR';
  const wb = XLSX.utils.book_new();

  // --- SHEET 1: EXECUTIVE SUMMARY ---
  const summaryData = [
    ['SPLITWISE GROUP FINANCIAL STATEMENT REPORT'],
    ['Report Date:', new Date().toLocaleString('en-GB')],
    [],
    ['GROUP DETAILS'],
    ['Group Name:', group.name || 'N/A'],
    ['Status:', group.status || 'Active'],
    ['Trip Dates:', group.startDate && group.endDate ? `${new Date(group.startDate).toLocaleDateString('en-GB')} to ${new Date(group.endDate).toLocaleDateString('en-GB')}` : 'Active'],
    ['Total Group Spending:', group.totalSpending || 0, currency],
    ['Total Expense Records:', expenses.length],
    [],
    ['MEMBER NET BALANCES & POSITIONS'],
    ['Member Name', 'Email', `Total Paid (${currency})`, `Total Share (${currency})`, `Net Position (${currency})`, 'Status']
  ];

  (group.members || []).forEach(m => {
    const net = m.netBalance || 0;
    const statusStr = net > 0.01 ? 'Gets Back (Receivable)' : net < -0.01 ? 'Owes Money (Liability)' : 'Settled Up';
    summaryData.push([
      m.name || 'Member',
      m.email || 'N/A',
      m.totalPaid || 0,
      m.totalShare || 0,
      net,
      statusStr
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 25 },
    { wch: 30 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // --- SHEET 2: ITEMIZED EXPENSE LEDGER ---
  const expenseData = [
    ['#', 'Date', 'Description', 'Category', 'Paid By', `Total Amount (${currency})`, 'Participants Count']
  ];

  (expenses || []).forEach((exp, idx) => {
    const payerName = exp.payers?.[0]?.userId?.name || 'Someone';
    expenseData.push([
      idx + 1,
      new Date(exp.date).toLocaleDateString('en-GB'),
      exp.description || 'Expense',
      exp.category || 'General',
      payerName,
      exp.amount || 0,
      exp.participants?.length || 0
    ]);
  });

  const wsExpenses = XLSX.utils.aoa_to_sheet(expenseData);
  wsExpenses['!cols'] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 35 },
    { wch: 16 },
    { wch: 22 },
    { wch: 20 },
    { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expense Ledger');

  // --- SHEET 3: SIMPLIFIED SETTLEMENT PLAN ---
  const settlementData = [
    ['Payer (Who Owes)', 'Transfer', 'Recipient (Who Gets)', `Settlement Amount (${currency})`, 'Status']
  ];

  (simplifiedTx || []).forEach(st => {
    settlementData.push([
      st.fromUser?.name || 'Member',
      'MUST PAY',
      st.toUser?.name || 'Member',
      st.amount || 0,
      'Pending'
    ]);
  });

  if (simplifiedTx.length === 0) {
    settlementData.push(['No pending debts', '-', '-', 0, 'All Settled Up']);
  }

  const wsSettlements = XLSX.utils.aoa_to_sheet(settlementData);
  wsSettlements['!cols'] = [
    { wch: 22 },
    { wch: 12 },
    { wch: 22 },
    { wch: 24 },
    { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSettlements, 'Simplified Debt Plan');

  // --- SHEET 4: SETTLEMENT HISTORY ---
  const historyData = [
    ['Date', 'From Payer', 'To Recipient', `Amount (${currency})`, 'Note']
  ];

  (settlements || []).forEach(st => {
    historyData.push([
      new Date(st.date).toLocaleDateString('en-GB'),
      st.fromUser?.name || 'User',
      st.toUser?.name || 'User',
      st.amount || 0,
      st.note || 'Settlement'
    ]);
  });

  const wsHistory = XLSX.utils.aoa_to_sheet(historyData);
  wsHistory['!cols'] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 22 },
    { wch: 18 },
    { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsHistory, 'Settlement History');

  // Save Workbook file
  const fileName = `${(group.name || 'Group').replace(/[^a-zA-Z0-9]/g, '_')}_Financial_Report.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * Exports an individual Member Statement Excel spreadsheet
 */
export const exportMemberStatementExcel = (member, group, expenses = [], simplifiedTx = [], currency = 'INR') => {
  const memberName = member.name || 'Member';
  const memberId = (member._id || member.id || member.userId?._id || member.userId)?.toString();
  const wb = XLSX.utils.book_new();

  const totalPaid = member.totalPaid !== undefined ? member.totalPaid : 0;
  const totalShare = member.totalShare !== undefined ? member.totalShare : 0;
  const netBalance = member.netBalance !== undefined ? member.netBalance : (totalPaid - totalShare);

  // SHEET 1: MEMBER OVERVIEW
  const overviewData = [
    [`MEMBER FINANCIAL STATEMENT - ${memberName.toUpperCase()}`],
    ['Statement Date:', new Date().toLocaleString('en-GB')],
    [],
    ['MEMBER DETAILS'],
    ['Member Name:', memberName],
    ['Email:', member.email || 'N/A'],
    ['Group Name:', group.name || 'N/A'],
    [],
    ['FINANCIAL POSITION SUMMARY'],
    [`Total Paid Out-of-Pocket (${currency}):`, totalPaid],
    [`Total Consumption Share (${currency}):`, totalShare],
    [`Net Position (${currency}):`, netBalance],
    ['Overall Status:', netBalance > 0.01 ? 'Gets Back (Receivable)' : netBalance < -0.01 ? 'Owes Money (Liability)' : 'Settled Up']
  ];

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  wsOverview['!cols'] = [
    { wch: 35 },
    { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Member Overview');

  // SHEET 2: MEMBER TRANSACTION LEDGER
  const ledgerData = [
    ['Date', 'Description', 'Category', 'Paid By', `Total Expense (${currency})`, `Amount You Paid (${currency})`, `Your Share (${currency})`, `Net Impact (${currency})`]
  ];

  (expenses || []).forEach(exp => {
    const payerObj = (exp.payers || []).find(p => (p.userId?._id || p.userId)?.toString() === memberId);
    const participantObj = (exp.participants || []).find(p => (p.userId?._id || p.userId)?.toString() === memberId);

    if (!payerObj && !participantObj) return;

    const paidAmt = payerObj ? (payerObj.amount || 0) : 0;
    const shareAmt = participantObj ? (participantObj.shareAmount || 0) : 0;
    const netImpact = paidAmt - shareAmt;

    ledgerData.push([
      new Date(exp.date).toLocaleDateString('en-GB'),
      exp.description || 'Expense',
      exp.category || 'General',
      exp.payers?.[0]?.userId?.name || 'Someone',
      exp.amount || 0,
      paidAmt,
      shareAmt,
      netImpact
    ]);
  });

  const wsLedger = XLSX.utils.aoa_to_sheet(ledgerData);
  wsLedger['!cols'] = [
    { wch: 14 },
    { wch: 32 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, wsLedger, 'Member Ledger');

  const fileName = `${memberName.replace(/[^a-zA-Z0-9]/g, '_')}_Statement.xlsx`;
  XLSX.writeFile(wb, fileName);
};

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatSignedBalance } from './currencyFormatter';

/**
 * Generates a colorful, executive PDF report for a Group
 */
export const exportGroupPdf = (group, expenses = [], settlements = [], simplifiedTx = [], analyticsData = null) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const currency = group.currency || 'INR';
  const primaryColor = [99, 102, 241]; // Indigo/Violet #6366F1
  const darkTextColor = [30, 41, 59];   // Slate 800
  const emeraldColor = [16, 185, 129];  // Emerald 500
  const roseColor = [244, 63, 94];     // Rose 500

  // 1. TOP BRAND GRADIENT BANNER
  doc.setFillColor(79, 70, 229); // Deep Indigo
  doc.rect(0, 0, 210, 28, 'F');

  // Top Banner Decorative Accent Bar
  doc.setFillColor(168, 85, 247); // Purple accent
  doc.rect(0, 26, 210, 2, 'F');

  // Title Text inside Banner
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('SPLITWISE • FINANCIAL STATEMENT', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 196, 16, { align: 'right' });

  let yPos = 36;

  // 2. GROUP METADATA CARD BOX
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, yPos, 182, 26, 3, 3, 'FD');

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(group.name || 'Group Expense Report', 18, yPos + 8);

  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const dateStr = group.startDate && group.endDate
    ? `${new Date(group.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${new Date(group.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
    : 'Active Trip';
  doc.text(`Trip Period: ${dateStr}   |   Status: ${group.status || 'Active'}   |   Members: ${group.members?.length || 0}`, 18, yPos + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Spending: ${formatCurrency(group.totalSpending || 0, currency)}`, 18, yPos + 22);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Total Expenses: ${expenses.length} records`, 190, yPos + 22, { align: 'right' });

  yPos += 33;

  // 3. MEMBER NET BALANCES TABLE
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. MEMBER POSITIONS & NET BALANCES', 14, yPos);
  yPos += 3;

  const memberRows = (group.members || []).map(m => {
    const net = m.netBalance || 0;
    const statusStr = net > 0.01 ? 'Gets Back (Receivable)' : net < -0.01 ? 'Owes (Liability)' : 'Settled Up';
    return [
      m.name || 'Member',
      m.email || 'N/A',
      formatCurrency(m.totalPaid || 0, currency),
      formatCurrency(m.totalShare || 0, currency),
      formatSignedBalance(net, currency),
      statusStr
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Member Name', 'Email', 'Total Paid', 'Total Share', 'Net Balance', 'Status']],
    body: memberRows,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      2: { halign: 'right', fontStyle: 'bold' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'center', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const text = data.cell.text[0] || '';
        if (text.startsWith('+')) {
          data.cell.styles.textColor = emeraldColor;
        } else if (text.startsWith('-')) {
          data.cell.styles.textColor = roseColor;
        }
      }
      if (data.section === 'body' && data.column.index === 5) {
        const text = data.cell.text[0] || '';
        if (text.includes('Receivable')) {
          data.cell.styles.textColor = emeraldColor;
        } else if (text.includes('Liability')) {
          data.cell.styles.textColor = roseColor;
        }
      }
    }
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // 4. SIMPLIFIED SETTLEMENT PLAN TABLE
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. SIMPLIFIED DEBT SETTLEMENT PLAN', 14, yPos);
  yPos += 3;

  const settlementRows = (simplifiedTx || []).map(st => [
    st.fromUser?.name || 'Member',
    '→ MUST PAY →',
    st.toUser?.name || 'Member',
    formatCurrency(st.amount || 0, currency),
    'Pending Settlement'
  ]);

  if (settlementRows.length === 0) {
    settlementRows.push(['No pending settlements', '-', '-', formatCurrency(0, currency), 'All Settled']);
  }

  autoTable(doc, {
    startY: yPos,
    head: [['Payer (Who Owes)', 'Transfer Action', 'Recipient (Who Gets)', 'Settlement Amount', 'Status']],
    body: settlementRows,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [240, 253, 244]
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' },
      2: { fontStyle: 'bold', halign: 'left' },
      3: { fontStyle: 'bold', halign: 'right', textColor: [16, 185, 129] }
    }
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // 5. ITEMIZED EXPENSES TABLE
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. ITEMIZED EXPENSES LEDGER', 14, yPos);
  yPos += 3;

  const expenseRows = (expenses || []).map((exp, idx) => {
    const payerName = exp.payers?.[0]?.userId?.name || 'Someone';
    const numSplit = exp.participants?.length || 0;
    return [
      `#${idx + 1}`,
      new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      exp.description || 'Expense',
      exp.category || 'General',
      payerName,
      `${numSplit} members`,
      formatCurrency(exp.amount || 0, currency)
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Date', 'Description', 'Category', 'Paid By', 'Split Between', 'Total Amount']],
    body: expenseRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { width: 10, halign: 'center' },
      1: { width: 24 },
      3: { width: 25 },
      4: { fontStyle: 'bold' },
      5: { halign: 'center' },
      6: { halign: 'right', fontStyle: 'bold', textColor: [79, 70, 229] }
    }
  });

  // Footer page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Splitwise Detailed Report  •  Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
  }

  const fileName = `${(group.name || 'Group').replace(/[^a-zA-Z0-9]/g, '_')}_Expense_Report.pdf`;
  doc.save(fileName);
};

/**
 * Generates an individual Member Financial Statement PDF
 */
export const exportMemberStatementPdf = (member, group, expenses = [], simplifiedTx = [], currency = 'INR') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const memberName = member.name || 'Member';
  const memberId = (member._id || member.id || member.userId?._id || member.userId)?.toString();
  const primaryColor = [99, 102, 241];
  const darkTextColor = [30, 41, 59];
  const emeraldColor = [16, 185, 129];
  const roseColor = [244, 63, 94];

  // Header Banner
  doc.setFillColor(15, 23, 42); // Dark slate
  doc.rect(0, 0, 210, 28, 'F');
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 26, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MEMBER STATEMENT • SPLITWISE', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Statement Date: ${new Date().toLocaleDateString('en-GB')}`, 196, 16, { align: 'right' });

  let yPos = 36;

  // Member Card Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, yPos, 182, 30, 3, 3, 'FD');

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(memberName, 18, yPos + 8);

  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Group: ${group.name || 'N/A'}   |   Email: ${member.email || 'N/A'}`, 18, yPos + 15);

  const totalPaid = member.totalPaid !== undefined ? member.totalPaid : 0;
  const totalShare = member.totalShare !== undefined ? member.totalShare : 0;
  const netBalance = member.netBalance !== undefined ? member.netBalance : (totalPaid - totalShare);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`Total Paid Out-of-Pocket: ${formatCurrency(totalPaid, currency)}`, 18, yPos + 23);
  doc.text(`Total Consumption Share: ${formatCurrency(totalShare, currency)}`, 105, yPos + 23);
  
  const netStr = formatSignedBalance(netBalance, currency);
  doc.setTextColor(netBalance > 0.01 ? emeraldColor[0] : netBalance < -0.01 ? roseColor[0] : 100, 
                   netBalance > 0.01 ? emeraldColor[1] : netBalance < -0.01 ? roseColor[1] : 116, 
                   netBalance > 0.01 ? emeraldColor[2] : netBalance < -0.01 ? roseColor[2] : 139);
  doc.text(`Net Position: ${netStr}`, 190, yPos + 23, { align: 'right' });

  yPos += 38;

  // Filter transactions for this member
  const memberTx = expenses.map(exp => {
    const payerObj = (exp.payers || []).find(p => (p.userId?._id || p.userId)?.toString() === memberId);
    const participantObj = (exp.participants || []).find(p => (p.userId?._id || p.userId)?.toString() === memberId);

    if (!payerObj && !participantObj) return null;

    const paidAmt = payerObj ? (payerObj.amount || 0) : 0;
    const shareAmt = participantObj ? (participantObj.shareAmount || 0) : 0;
    const netImpact = paidAmt - shareAmt;

    return [
      new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      exp.description || 'Expense',
      exp.category || 'General',
      exp.payers?.[0]?.userId?.name || 'Someone',
      paidAmt > 0 ? formatCurrency(paidAmt, currency) : '-',
      shareAmt > 0 ? formatCurrency(shareAmt, currency) : '-',
      formatSignedBalance(netImpact, currency)
    ];
  }).filter(Boolean);

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`TRANSACTION HISTORY FOR ${memberName.toUpperCase()} (${memberTx.length})`, 14, yPos);
  yPos += 3;

  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Description', 'Category', 'Paid By', 'You Paid', 'Your Share', 'Net Impact']],
    body: memberTx,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const text = data.cell.text[0] || '';
        if (text.startsWith('+')) {
          data.cell.styles.textColor = emeraldColor;
        } else if (text.startsWith('-')) {
          data.cell.styles.textColor = roseColor;
        }
      }
    }
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Splitwise Member Statement  •  Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
  }

  const fileName = `${memberName.replace(/[^a-zA-Z0-9]/g, '_')}_Statement.pdf`;
  doc.save(fileName);
};

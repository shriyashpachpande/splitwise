const assert = require('assert');
const { calculateExpenseShares } = require('../services/expenseCalculationService');
const { calculateGroupBalances } = require('../services/balanceService');
const { simplifyBalances } = require('../services/balanceSimplificationService');
const { roundToCents, distributeAmountEqually } = require('../utils/moneyUtils');

// Dummy IDs
const U1 = '60d0fe4f5311236168a10901'; // Yash
const U2 = '60d0fe4f5311236168a10902'; // Madhav
const U3 = '60d0fe4f5311236168a10903'; // Azeem
const U4 = '60d0fe4f5311236168a10904'; // Rohan
const U5 = '60d0fe4f5311236168a10905'; // Riturani

let passedCount = 0;
let totalCount = 0;

function runTest(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`✅ TEST ${totalCount}: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`❌ TEST ${totalCount} FAILED: ${name}`);
    console.error(err.stack || err.message);
  }
}

console.log('====================================================');
console.log(' RUNNING EXPENSE & BALANCE ENGINE TEST SUITE (16/16)');
console.log('====================================================\n');

// Test 1: One payer + equal split
runTest('One payer + equal split', () => {
  const result = calculateExpenseShares({
    amount: 1200,
    payers: [{ userId: U1, amount: 1200 }],
    splitType: 'EQUAL',
    allMemberIds: [U1, U2, U3, U4]
  });

  assert.strictEqual(result.participants.length, 4);
  result.participants.forEach(p => {
    assert.strictEqual(p.shareAmount, 300);
  });

  const balances = calculateGroupBalances([U1, U2, U3, U4], [{
    payers: result.payers,
    participants: result.participants
  }]);

  assert.strictEqual(balances.invariantPassed, true);
  const yash = balances.memberBalances.find(m => m.userId === U1);
  assert.strictEqual(yash.netBalance, 900); // paid 1200, share 300 -> net +900
});

// Test 2: Multiple payers + equal split
runTest('Multiple payers + equal split', () => {
  const result = calculateExpenseShares({
    amount: 4000,
    payers: [
      { userId: U1, amount: 2000 },
      { userId: U2, amount: 2000 }
    ],
    splitType: 'EQUAL',
    allMemberIds: [U1, U2, U3, U4]
  });

  assert.strictEqual(result.participants.length, 4);
  result.participants.forEach(p => assert.strictEqual(p.shareAmount, 1000));

  const balances = calculateGroupBalances([U1, U2, U3, U4], [{
    payers: result.payers,
    participants: result.participants
  }]);

  assert.strictEqual(balances.invariantPassed, true);
  const u1Bal = balances.memberBalances.find(m => m.userId === U1);
  const u3Bal = balances.memberBalances.find(m => m.userId === U3);
  assert.strictEqual(u1Bal.netBalance, 1000); // paid 2000, share 1000 -> +1000
  assert.strictEqual(u3Bal.netBalance, -1000); // paid 0, share 1000 -> -1000
});

// Test 3: One payer + unequal split
runTest('One payer + unequal split', () => {
  const result = calculateExpenseShares({
    amount: 1000,
    payers: [{ userId: U1, amount: 1000 }],
    splitType: 'UNEQUAL',
    participants: [
      { userId: U1, shareAmount: 500 },
      { userId: U2, shareAmount: 300 },
      { userId: U3, shareAmount: 200 }
    ]
  });

  assert.strictEqual(result.participants.find(p => p.userId === U1).shareAmount, 500);
  assert.strictEqual(result.participants.find(p => p.userId === U2).shareAmount, 300);

  const balances = calculateGroupBalances([U1, U2, U3], [{
    payers: result.payers,
    participants: result.participants
  }]);

  assert.strictEqual(balances.invariantPassed, true);
  assert.strictEqual(balances.memberBalances.find(m => m.userId === U1).netBalance, 500);
  assert.strictEqual(balances.memberBalances.find(m => m.userId === U2).netBalance, -300);
});

// Test 4: Multiple payers + unequal split
runTest('Multiple payers + unequal split', () => {
  const result = calculateExpenseShares({
    amount: 1000,
    payers: [
      { userId: U1, amount: 600 },
      { userId: U2, amount: 400 }
    ],
    splitType: 'UNEQUAL',
    participants: [
      { userId: U1, shareAmount: 400 },
      { userId: U2, shareAmount: 300 },
      { userId: U3, shareAmount: 300 }
    ]
  });

  const balances = calculateGroupBalances([U1, U2, U3], [{
    payers: result.payers,
    participants: result.participants
  }]);

  assert.strictEqual(balances.invariantPassed, true);
  assert.strictEqual(balances.memberBalances.find(m => m.userId === U1).netBalance, 200);  // 600 - 400 = +200
  assert.strictEqual(balances.memberBalances.find(m => m.userId === U2).netBalance, 100);  // 400 - 300 = +100
  assert.strictEqual(balances.memberBalances.find(m => m.userId === U3).netBalance, -300); // 0 - 300 = -300
});

// Test 5: Item-wise split
runTest('Item-wise split', () => {
  const result = calculateExpenseShares({
    amount: 150,
    payers: [{ userId: U1, amount: 150 }],
    splitType: 'ITEM_WISE',
    items: [
      { name: 'Dal', price: 50, participants: [U1] },
      { name: 'Roti', price: 20, participants: [U2] },
      { name: 'Rice', price: 80, participants: [U3] }
    ]
  });

  const p1 = result.participants.find(p => p.userId === U1);
  const p2 = result.participants.find(p => p.userId === U2);
  const p3 = result.participants.find(p => p.userId === U3);

  assert.strictEqual(p1.shareAmount, 50);
  assert.strictEqual(p2.shareAmount, 20);
  assert.strictEqual(p3.shareAmount, 80);
});

// Test 6: Item shared between two people
runTest('Item shared between two people', () => {
  const result = calculateExpenseShares({
    amount: 120,
    payers: [{ userId: U1, amount: 120 }],
    splitType: 'ITEM_WISE',
    items: [
      { name: 'Paneer', price: 120, participants: [U1, U2] }
    ]
  });

  const p1 = result.participants.find(p => p.userId === U1);
  const p2 = result.participants.find(p => p.userId === U2);
  assert.strictEqual(p1.shareAmount, 60);
  assert.strictEqual(p2.shareAmount, 60);
});

// Test 7: Item shared between three people
runTest('Item shared between three people', () => {
  const result = calculateExpenseShares({
    amount: 120,
    payers: [{ userId: U1, amount: 120 }],
    splitType: 'ITEM_WISE',
    items: [
      { name: 'Pizza', price: 120, participants: [U1, U2, U3] }
    ]
  });

  result.participants.forEach(p => assert.strictEqual(p.shareAmount, 40));
});

// Test 8: ₹100 divided among 3 people
runTest('₹100 divided among 3 people (exact rounding)', () => {
  const result = calculateExpenseShares({
    amount: 100,
    payers: [{ userId: U1, amount: 100 }],
    splitType: 'EQUAL',
    allMemberIds: [U1, U2, U3]
  });

  const totalShares = result.participants.reduce((sum, p) => sum + p.shareAmount, 0);
  assert.strictEqual(roundToCents(totalShares), 100);
  // Expect [33.34, 33.33, 33.33]
  assert.strictEqual(result.participants[0].shareAmount, 33.34);
  assert.strictEqual(result.participants[1].shareAmount, 33.33);
  assert.strictEqual(result.participants[2].shareAmount, 33.33);
});

// Test 9: Multiple expenses
runTest('Multiple expenses aggregation', () => {
  const exp1 = calculateExpenseShares({
    amount: 1200,
    payers: [{ userId: U1, amount: 1200 }],
    splitType: 'EQUAL',
    allMemberIds: [U1, U2, U3, U4]
  }); // Yash +900, others -300 each

  const exp2 = calculateExpenseShares({
    amount: 4000,
    payers: [{ userId: U2, amount: 4000 }],
    splitType: 'EQUAL',
    allMemberIds: [U1, U2, U3, U4]
  }); // Madhav +3000, others -1000 each

  const balances = calculateGroupBalances([U1, U2, U3, U4], [
    { payers: exp1.payers, participants: exp1.participants },
    { payers: exp2.payers, participants: exp2.participants }
  ]);

  assert.strictEqual(balances.invariantPassed, true);
  // Yash: +900 - 1000 = -100
  assert.strictEqual(balances.memberBalances.find(m => m.userId === U1).netBalance, -100);
  // Madhav: -300 + 3000 = +2700
  assert.strictEqual(balances.memberBalances.find(m => m.userId === U2).netBalance, 2700);
  // Azeem: -300 - 1000 = -1300
  assert.strictEqual(balances.memberBalances.find(m => m.userId === U3).netBalance, -1300);
});

// Test 10: Expense edited
runTest('Expense edited recalculation', () => {
  let exp = calculateExpenseShares({
    amount: 1000,
    payers: [{ userId: U1, amount: 1000 }],
    splitType: 'EQUAL',
    allMemberIds: [U1, U2]
  }); // Yash +500, Madhav -500

  // Edit expense amount to 2000
  exp = calculateExpenseShares({
    amount: 2000,
    payers: [{ userId: U1, amount: 2000 }],
    splitType: 'EQUAL',
    allMemberIds: [U1, U2]
  });

  const balances = calculateGroupBalances([U1, U2], [{
    payers: exp.payers,
    participants: exp.participants
  }]);

  assert.strictEqual(balances.memberBalances.find(m => m.userId === U1).netBalance, 1000);
  assert.strictEqual(balances.memberBalances.find(m => m.userId === U2).netBalance, -1000);
});

// Test 11: Expense deleted
runTest('Expense deleted recalculation', () => {
  const exp1 = calculateExpenseShares({
    amount: 1000,
    payers: [{ userId: U1, amount: 1000 }],
    splitType: 'EQUAL',
    allMemberIds: [U1, U2]
  });

  // Balance with 1 expense
  const b1 = calculateGroupBalances([U1, U2], [{ payers: exp1.payers, participants: exp1.participants }]);
  assert.strictEqual(b1.memberBalances.find(m => m.userId === U1).netBalance, 500);

  // Delete expense (empty array)
  const b2 = calculateGroupBalances([U1, U2], []);
  assert.strictEqual(b2.memberBalances.find(m => m.userId === U1).netBalance, 0);
  assert.strictEqual(b2.memberBalances.find(m => m.userId === U2).netBalance, 0);
});

// Test 12: Partial settlement
runTest('Partial settlement', () => {
  const exp = calculateExpenseShares({
    amount: 1000,
    payers: [{ userId: U1, amount: 1000 }],
    splitType: 'EQUAL',
    allMemberIds: [U1, U2]
  }); // Madhav owes Yash 500

  // Madhav pays Yash 300
  const settlement = { fromUser: U2, toUser: U1, amount: 300 };

  const balances = calculateGroupBalances([U1, U2], [{ payers: exp.payers, participants: exp.participants }], [settlement]);
  assert.strictEqual(balances.invariantPassed, true);
  assert.strictEqual(balances.memberBalances.find(m => m.userId === U1).netBalance, 200);  // remaining owed 200
  assert.strictEqual(balances.memberBalances.find(m => m.userId === U2).netBalance, -200); // remaining debt 200
});

// Test 13: Full settlement
runTest('Full settlement', () => {
  const exp = calculateExpenseShares({
    amount: 1000,
    payers: [{ userId: U1, amount: 1000 }],
    splitType: 'EQUAL',
    allMemberIds: [U1, U2]
  }); // Madhav owes Yash 500

  // Madhav pays Yash 500
  const settlement = { fromUser: U2, toUser: U1, amount: 500 };

  const balances = calculateGroupBalances([U1, U2], [{ payers: exp.payers, participants: exp.participants }], [settlement]);
  assert.strictEqual(balances.invariantPassed, true);
  assert.strictEqual(balances.memberBalances.find(m => m.userId === U1).netBalance, 0);
  assert.strictEqual(balances.memberBalances.find(m => m.userId === U2).netBalance, 0);
});

// Test 14: Multiple settlements
runTest('Multiple settlements', () => {
  const exp = calculateExpenseShares({
    amount: 1000,
    payers: [{ userId: U1, amount: 1000 }],
    splitType: 'EQUAL',
    allMemberIds: [U1, U2]
  }); // Madhav owes Yash 500

  const s1 = { fromUser: U2, toUser: U1, amount: 200 };
  const s2 = { fromUser: U2, toUser: U1, amount: 300 };

  const balances = calculateGroupBalances([U1, U2], [{ payers: exp.payers, participants: exp.participants }], [s1, s2]);
  assert.strictEqual(balances.memberBalances.find(m => m.userId === U1).netBalance, 0);
  assert.strictEqual(balances.memberBalances.find(m => m.userId === U2).netBalance, 0);
});

// Test 15: Balance simplification algorithm
runTest('Balance simplification (A->B 500, B->C 500 -> A->C 500)', () => {
  // Yash(U1) +500, Madhav(U2) 0, Azeem(U3) -500
  const members = [
    { userId: U1, netBalance: 500 },
    { userId: U2, netBalance: 0 },
    { userId: U3, netBalance: -500 }
  ];

  const simplified = simplifyBalances(members);
  assert.strictEqual(simplified.length, 1);
  assert.strictEqual(simplified[0].fromUser, U3);
  assert.strictEqual(simplified[0].toUser, U1);
  assert.strictEqual(simplified[0].amount, 500);
});

// Test 16: Complex group (5+ members, 10+ expenses)
runTest('Complex group with 5 members and 10 expenses with invariant SUM=0 check', () => {
  const members = [U1, U2, U3, U4, U5];
  const expenses = [];

  for (let i = 1; i <= 10; i++) {
    const payerIndex = i % 5;
    const payerId = members[payerIndex];
    const amount = i * 250;

    const exp = calculateExpenseShares({
      amount,
      payers: [{ userId: payerId, amount }],
      splitType: i % 2 === 0 ? 'EQUAL' : 'UNEQUAL',
      allMemberIds: members,
      participants: i % 2 === 0 ? [] : members.map((m, idx) => ({
        userId: m,
        shareAmount: distributeAmountEqually(amount, 5)[idx]
      }))
    });

    expenses.push({ payers: exp.payers, participants: exp.participants });
  }

  const balances = calculateGroupBalances(members, expenses);
  assert.strictEqual(balances.invariantPassed, true);
  const totalSum = balances.memberBalances.reduce((acc, m) => acc + m.netBalance, 0);
  assert.strictEqual(roundToCents(totalSum), 0);
});

console.log(`\n====================================================`);
console.log(` SUMMARY: ${passedCount}/${totalCount} TESTS PASSED SUCCESSFULLY!`);
console.log(`====================================================\n`);

if (passedCount < totalCount) {
  process.exit(1);
}

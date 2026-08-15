const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const User = require('./models/User');
const Group = require('./models/Group');
const Expense = require('./models/Expense');
const Settlement = require('./models/Settlement');
const Activity = require('./models/Activity');
const { calculateExpenseShares } = require('./services/expenseCalculationService');

const seedData = async () => {
  try {
    await connectDB();

    console.log('Clearing existing database collections...');
    await User.deleteMany({});
    await Group.deleteMany({});
    await Expense.deleteMany({});
    await Settlement.deleteMany({});
    await Activity.deleteMany({});

    console.log('Creating demo users...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const users = await User.create([
      {
        name: 'Yash',
        email: 'yash@example.com',
        password: passwordHash,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yash'
      },
      {
        name: 'Madhav',
        email: 'madhav@example.com',
        password: passwordHash,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Madhav'
      },
      {
        name: 'Azeem',
        email: 'azeem@example.com',
        password: passwordHash,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Azeem'
      },
      {
        name: 'Rohan',
        email: 'rohan@example.com',
        password: passwordHash,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan'
      },
      {
        name: 'Riturani',
        email: 'riturani@example.com',
        password: passwordHash,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riturani'
      }
    ]);

    const [yash, madhav, azeem, rohan, riturani] = users;
    const memberIds = users.map(u => u._id.toString());

    console.log('Creating "Manali Trip" group...');
    const group = await Group.create({
      name: 'Manali Trip',
      description: 'Summer mountain getaway & adventure trip with friends',
      startDate: new Date('2026-08-08'),
      endDate: new Date('2026-08-18'),
      currency: 'INR',
      members: users.map(u => u._id),
      createdBy: yash._id
    });

    await Activity.create({
      groupId: group._id,
      user: yash._id,
      actionType: 'GROUP_CREATED',
      description: `Yash created group "Manali Trip"`
    });

    console.log('Creating expenses...');

    // Expense 1: Dinner (₹1200, Single payer, Equal split across 4 members)
    const exp1Calc = calculateExpenseShares({
      amount: 1200,
      payers: [{ userId: yash._id, amount: 1200 }],
      splitType: 'EQUAL',
      allMemberIds: [yash._id, madhav._id, azeem._id, rohan._id]
    });

    const exp1 = await Expense.create({
      groupId: group._id,
      description: 'Dinner at ABC Restaurant',
      category: 'Food',
      amount: 1200,
      date: new Date('2026-08-09T20:30:00Z'),
      payers: exp1Calc.payers,
      splitType: 'EQUAL',
      participants: exp1Calc.participants,
      createdBy: yash._id
    });

    await Activity.create({
      groupId: group._id,
      user: yash._id,
      actionType: 'EXPENSE_ADDED',
      description: `Yash added "Dinner at ABC Restaurant" (₹1,200.00)`
    });

    // Expense 2: Hotel (₹4000, Multi-payer Yash ₹2000 & Madhav ₹2000, Equal split across 4 members)
    const exp2Calc = calculateExpenseShares({
      amount: 4000,
      payers: [
        { userId: yash._id, amount: 2000 },
        { userId: madhav._id, amount: 2000 }
      ],
      splitType: 'EQUAL',
      allMemberIds: [yash._id, madhav._id, azeem._id, rohan._id]
    });

    const exp2 = await Expense.create({
      groupId: group._id,
      description: 'Hotel Grand Manali (2 Nights)',
      category: 'Hotel',
      amount: 4000,
      date: new Date('2026-08-10T11:00:00Z'),
      payers: exp2Calc.payers,
      splitType: 'EQUAL',
      participants: exp2Calc.participants,
      createdBy: madhav._id
    });

    await Activity.create({
      groupId: group._id,
      user: madhav._id,
      actionType: 'EXPENSE_ADDED',
      description: `Madhav added "Hotel Grand Manali" (₹4,000.00)`
    });

    // Expense 3: Highway Dhaba (₹150, Item-wise split)
    const exp3Calc = calculateExpenseShares({
      amount: 150,
      payers: [{ userId: yash._id, amount: 150 }],
      splitType: 'ITEM_WISE',
      items: [
        { name: 'Dal Tadka', price: 50, participants: [yash._id] },
        { name: 'Butter Roti (4)', price: 20, participants: [madhav._id] },
        { name: 'Jeera Rice', price: 80, participants: [azeem._id] }
      ]
    });

    const exp3 = await Expense.create({
      groupId: group._id,
      description: 'Highway Dhaba Lunch',
      category: 'Food',
      amount: 150,
      date: new Date('2026-08-11T13:15:00Z'),
      payers: exp3Calc.payers,
      splitType: 'ITEM_WISE',
      participants: exp3Calc.participants,
      items: exp3Calc.items,
      createdBy: yash._id
    });

    await Activity.create({
      groupId: group._id,
      user: yash._id,
      actionType: 'EXPENSE_ADDED',
      description: `Yash added "Highway Dhaba Lunch" (₹150.00)`
    });

    // Expense 4: River Rafting (₹2500, Paid by Madhav, Unequal split)
    const exp4Calc = calculateExpenseShares({
      amount: 2500,
      payers: [{ userId: madhav._id, amount: 2500 }],
      splitType: 'UNEQUAL',
      participants: [
        { userId: yash._id, shareAmount: 500 },
        { userId: madhav._id, shareAmount: 1000 },
        { userId: azeem._id, shareAmount: 500 },
        { userId: rohan._id, shareAmount: 500 }
      ]
    });

    await Expense.create({
      groupId: group._id,
      description: 'River Rafting & Safety Gear',
      category: 'Activities',
      amount: 2500,
      date: new Date('2026-08-12T10:00:00Z'),
      payers: exp4Calc.payers,
      splitType: 'UNEQUAL',
      participants: exp4Calc.participants,
      createdBy: madhav._id
    });

    await Activity.create({
      groupId: group._id,
      user: madhav._id,
      actionType: 'EXPENSE_ADDED',
      description: `Madhav added "River Rafting & Safety Gear" (₹2,500.00)`
    });

    console.log('Creating demo settlement...');
    // Madhav pays Yash ₹500
    await Settlement.create({
      groupId: group._id,
      fromUser: madhav._id,
      toUser: yash._id,
      amount: 500,
      date: new Date('2026-08-13T16:00:00Z'),
      note: 'Partial payment for hotel & dinner',
      createdBy: madhav._id
    });

    await Activity.create({
      groupId: group._id,
      user: madhav._id,
      actionType: 'SETTLEMENT_CREATED',
      description: `Madhav paid Yash ₹500.00`
    });

    console.log('\n====================================================');
    console.log(' SEEDING COMPLETED SUCCESSFULLY!');
    console.log(' Demo Login Credentials:');
    console.log(' Email: yash@example.com | Password: password123');
    console.log(' Email: madhav@example.com | Password: password123');
    console.log(' Email: azeem@example.com | Password: password123');
    console.log('====================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();

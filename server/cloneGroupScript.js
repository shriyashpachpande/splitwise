const mongoose = require('mongoose');
require('dotenv').config();

const Group = require('./models/Group');
const Expense = require('./models/Expense');
const Settlement = require('./models/Settlement');
const Activity = require('./models/Activity');

const cloneMlpGroup = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas.');

    // 1. Find original group "MLP"
    const originalGroup = await Group.findOne({ name: 'MLP' });
    if (!originalGroup) {
      console.error('❌ Original group "MLP" not found!');
      process.exit(1);
    }
    console.log(`Found original group "MLP" (ID: ${originalGroup._id})`);

    // 2. Check if "Demo MLP" already exists and cleanup if needed
    const existingDemo = await Group.findOne({ name: 'Demo MLP' });
    if (existingDemo) {
      console.log(`Cleaning up existing "Demo MLP" group (ID: ${existingDemo._id})...`);
      await Expense.deleteMany({ groupId: existingDemo._id });
      await Settlement.deleteMany({ groupId: existingDemo._id });
      await Activity.deleteMany({ groupId: existingDemo._id });
      await Group.findByIdAndDelete(existingDemo._id);
    }

    // 3. Create new group "Demo MLP"
    const newGroup = await Group.create({
      name: 'Demo MLP',
      description: originalGroup.description || 'Demo clone of MLP trip group',
      startDate: originalGroup.startDate,
      endDate: originalGroup.endDate,
      currency: originalGroup.currency || 'INR',
      members: originalGroup.members,
      createdBy: originalGroup.createdBy,
      inviteCode: `DMLP-${Math.floor(1000 + Math.random() * 9000)}`
    });

    console.log(`✅ Created new group "Demo MLP" (ID: ${newGroup._id})`);

    // 4. Clone all Expenses
    const expenses = await Expense.find({ groupId: originalGroup._id });
    console.log(`Cloning ${expenses.length} expenses...`);

    const clonedExpenses = expenses.map(exp => {
      const expObj = exp.toObject();
      delete expObj._id;
      delete expObj.createdAt;
      delete expObj.updatedAt;
      delete expObj.__v;
      expObj.groupId = newGroup._id;
      return expObj;
    });

    if (clonedExpenses.length > 0) {
      await Expense.insertMany(clonedExpenses);
    }
    console.log(`✅ ${clonedExpenses.length} expenses successfully cloned into Demo MLP!`);

    // 5. Clone all Settlements
    const settlements = await Settlement.find({ groupId: originalGroup._id });
    console.log(`Cloning ${settlements.length} settlements...`);

    const clonedSettlements = settlements.map(settle => {
      const settleObj = settle.toObject();
      delete settleObj._id;
      delete settleObj.createdAt;
      delete settleObj.updatedAt;
      delete settleObj.__v;
      settleObj.groupId = newGroup._id;
      return settleObj;
    });

    if (clonedSettlements.length > 0) {
      await Settlement.insertMany(clonedSettlements);
    }
    console.log(`✅ ${clonedSettlements.length} settlements successfully cloned into Demo MLP!`);

    // 6. Clone all Activities
    const activities = await Activity.find({ groupId: originalGroup._id });
    console.log(`Cloning ${activities.length} activities...`);

    const clonedActivities = activities.map(act => {
      const actObj = act.toObject();
      delete actObj._id;
      delete actObj.createdAt;
      delete actObj.updatedAt;
      delete actObj.__v;
      actObj.groupId = newGroup._id;
      return actObj;
    });

    if (clonedActivities.length > 0) {
      await Activity.insertMany(clonedActivities);
    }
    console.log(`✅ ${clonedActivities.length} activities successfully cloned into Demo MLP!`);

    console.log('\n🎉 SUCCESS! "Demo MLP" group has been created with all 100% exact records of MLP!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error cloning group:', err);
    process.exit(1);
  }
};

cloneMlpGroup();

const Group = require('../models/Group');
const GroupExpense = require('../models/GroupExpense');
const Student = require('../models/Student');
const Transaction = require('../models/Transaction');

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, description, avatar, firebaseUid } = req.body;

    if (!name || !firebaseUid) {
      return res.status(400).json({
        success: false,
        message: 'Name and firebaseUid are required'
      });
    }

    // Find the student
    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Generate unique invite code
    const inviteCode = await Group.generateInviteCode();

    // Create the group
    const group = new Group({
      name,
      description: description || '',
      avatar: avatar || null,
      owner: student._id,
      members: [],
      inviteCode
    });

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('owner', 'name email profilePhoto')
      .populate('members', 'name email profilePhoto');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: populatedGroup
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group',
      error: error.message
    });
  }
};

// Get all groups for a user (as owner or member)
exports.getUserGroups = async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Find groups where user is owner or member
    const groups = await Group.find({
      $or: [
        { owner: student._id },
        { members: student._id }
      ],
      isActive: true
    })
      .populate('owner', 'name email profilePhoto')
      .populate('members', 'name email profilePhoto')
      .sort({ createdAt: -1 });

    // Get expense counts for each group
    const groupsWithStats = await Promise.all(
      groups.map(async (group) => {
        const expenseCount = await GroupExpense.countDocuments({ group: group._id });
        const totalExpenses = await GroupExpense.aggregate([
          { $match: { group: group._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        return {
          ...group.toObject(),
          stats: {
            expenseCount,
            totalExpenses: totalExpenses.length > 0 ? totalExpenses[0].total : 0,
            memberCount: group.members.length + 1 // +1 for owner
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: groupsWithStats
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch groups',
      error: error.message
    });
  }
};

// Get group details
exports.getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate('owner', 'name email profilePhoto')
      .populate('members', 'name email profilePhoto');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error fetching group details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group details',
      error: error.message
    });
  }
};

// Update group
exports.updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, avatar, firebaseUid } = req.body;

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is owner
    if (!group.isOwner(student._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the group owner can update the group'
      });
    }

    // Update fields
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (avatar !== undefined) group.avatar = avatar;

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate('owner', 'name email profilePhoto')
      .populate('members', 'name email profilePhoto');

    res.status(200).json({
      success: true,
      message: 'Group updated successfully',
      data: updatedGroup
    });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update group',
      error: error.message
    });
  }
};

// Delete group
exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { firebaseUid } = req.body;

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is owner
    if (!group.isOwner(student._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the group owner can delete the group'
      });
    }

    // Soft delete
    group.isActive = false;
    await group.save();

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete group',
      error: error.message
    });
  }
};

// Join group by invite code
exports.joinGroupByCode = async (req, res) => {
  try {
    const { inviteCode, firebaseUid } = req.body;

    if (!inviteCode || !firebaseUid) {
      return res.status(400).json({
        success: false,
        message: 'Invite code and firebaseUid are required'
      });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase(), isActive: true });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code'
      });
    }

    // Check if already owner
    if (group.isOwner(student._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are the owner of this group'
      });
    }

    // Check if already a member
    if (group.isMember(student._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group'
      });
    }

    // Add member
    await group.addMember(student._id);

    const updatedGroup = await Group.findById(group._id)
      .populate('owner', 'name email profilePhoto')
      .populate('members', 'name email profilePhoto');

    res.status(200).json({
      success: true,
      message: 'Successfully joined the group',
      data: updatedGroup
    });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join group',
      error: error.message
    });
  }
};

// Remove member from group
exports.removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const { firebaseUid } = req.body;

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is owner
    if (!group.isOwner(student._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the group owner can remove members'
      });
    }

    // Remove member
    await group.removeMember(memberId);

    const updatedGroup = await Group.findById(groupId)
      .populate('owner', 'name email profilePhoto')
      .populate('members', 'name email profilePhoto');

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      data: updatedGroup
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member',
      error: error.message
    });
  }
};

// Leave group
exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { firebaseUid } = req.body;

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Owner cannot leave, must delete group instead
    if (group.isOwner(student._id)) {
      return res.status(400).json({
        success: false,
        message: 'Group owner cannot leave. Delete the group instead.'
      });
    }

    // Remove member
    await group.removeMember(student._id);

    res.status(200).json({
      success: true,
      message: 'Successfully left the group'
    });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave group',
      error: error.message
    });
  }
};

// Create expense
exports.createExpense = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { firebaseUid, amount, description, category, date, splitType, splits, notes } = req.body;

    if (!firebaseUid || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'FirebaseUid, amount, and description are required'
      });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is owner or member
    if (!group.isOwner(student._id) && !group.isMember(student._id)) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of the group to create expenses'
      });
    }

    const expense = new GroupExpense({
      group: groupId,
      paidBy: student._id,
      amount,
      description,
      category: category || 'other',
      date: date || new Date(),
      splitType: splitType || 'equal',
      splits: splits || [],
      notes: notes || ''
    });

    await expense.save();

    // Create transaction entry for the expense
    try {
      const transactionCategory = (!category || category === 'other') ? 'other_expense' : category;
      
      const transaction = new Transaction({
        student: student._id,
        group: groupId,
        type: 'expense',
        amount: amount,
        category: transactionCategory,
        description: description,
        date: date || new Date(),
        paymentMethod: 'other',
        notes: `Group expense in "${group.name}"${notes ? ` - ${notes}` : ''}`
      });

      await transaction.save();

      // Link transaction to expense
      expense.transactionId = transaction._id;
      await expense.save();
    } catch (transactionError) {
      console.error('Error creating transaction for expense:', transactionError);
      // Continue even if transaction creation fails
    }

    const populatedExpense = await GroupExpense.findById(expense._id)
      .populate('paidBy', 'name email profilePhoto')
      .populate('splits.member', 'name email profilePhoto');

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: populatedExpense
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense',
      error: error.message
    });
  }
};

// Get group expenses
exports.getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;

    const expenses = await GroupExpense.find({ group: groupId })
      .populate('paidBy', 'name email profilePhoto')
      .populate('splits.member', 'name email profilePhoto')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: expenses
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
      error: error.message
    });
  }
};

// Update expense
exports.updateExpense = async (req, res) => {
  try {
    const { groupId, expenseId } = req.params;
    const { firebaseUid, amount, description, category, date, splits, notes } = req.body;

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const expense = await GroupExpense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user is the one who created the expense
    if (expense.paidBy.toString() !== student._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the expense creator can update it'
      });
    }

    // Update fields
    if (amount !== undefined) expense.amount = amount;
    if (description) expense.description = description;
    if (category) expense.category = category;
    if (date) expense.date = date;
    if (splits) expense.splits = splits;
    if (notes !== undefined) expense.notes = notes;

    await expense.save();

    // Update associated transaction
    if (expense.transactionId) {
      try {
        const transactionCategory = (!expense.category || expense.category === 'other') ? 'other_expense' : expense.category;

        await Transaction.findByIdAndUpdate(expense.transactionId, {
          amount: expense.amount,
          category: transactionCategory,
          description: expense.description,
          date: expense.date,
          notes: `Group expense in "${expense.description}"${expense.notes ? ` - ${expense.notes}` : ''}`
        });
      } catch (transactionError) {
        console.error('Error updating transaction for expense:', transactionError);
      }
    }

    const updatedExpense = await GroupExpense.findById(expenseId)
      .populate('paidBy', 'name email profilePhoto')
      .populate('splits.member', 'name email profilePhoto');

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: updatedExpense
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense',
      error: error.message
    });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const { groupId, expenseId } = req.params;
    const { firebaseUid } = req.body;

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const expense = await GroupExpense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user is the one who created the expense
    if (expense.paidBy.toString() !== student._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the expense creator can delete it'
      });
    }

    // Delete associated transaction
    if (expense.transactionId) {
      try {
        await Transaction.findByIdAndDelete(expense.transactionId);
      } catch (transactionError) {
        console.error('Error deleting transaction for expense:', transactionError);
      }
    }

    await GroupExpense.findByIdAndDelete(expenseId);

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
      error: error.message
    });
  }
};

// Get group balances
exports.getGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { type } = req.query;

    let data;
    if (type === 'net') {
      data = await GroupExpense.calculateGroupBalances(groupId);
    } else {
      data = await GroupExpense.getSimplifiedSettlements(groupId);
    }

    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error calculating balances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate balances',
      error: error.message
    });
  }
};

// Settle expense
exports.settleExpense = async (req, res) => {
  try {
    const { groupId, expenseId } = req.params;

    const expense = await GroupExpense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    await expense.settle();

    const updatedExpense = await GroupExpense.findById(expenseId)
      .populate('paidBy', 'name email profilePhoto')
      .populate('splits.member', 'name email profilePhoto');

    res.status(200).json({
      success: true,
      message: 'Expense settled successfully',
      data: updatedExpense
    });
  } catch (error) {
    console.error('Error settling expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to settle expense',
      error: error.message
    });
  }
};
// Settle balance between two members
exports.settleBalance = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { fromUserId, toUserId, amount, firebaseUid } = req.body;

    if (!fromUserId || !toUserId || !amount || !firebaseUid) {
      return res.status(400).json({
        success: false,
        message: 'From user, to user, amount, and firebaseUid are required'
      });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const group = await Group.findById(groupId)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }


    // Verify permission: Either the debtor, the creditor (toUser), or the group owner can record a settlement
    const isOwner = group.owner._id.toString() === student._id.toString();
    const isCreditor = toUserId === student._id.toString();
    const isDebtor = fromUserId === student._id.toString();

    if (!isOwner && !isCreditor && !isDebtor) {
      return res.status(403).json({
        success: false,
        message: 'Only the debtor, the creditor, or the group owner can record this settlement'
      });
    }

    // Get the recipient user details
    const toUser = await Student.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found'
      });
    }

    // Create transaction entry for the settlement
    const transaction = new Transaction({
      student: fromUserId,
      group: group._id,
      receiver: toUserId,
      type: 'transfer',
      amount: amount,
      category: 'account_transfer',
      description: `Settlement to ${toUser.name}`,
      date: new Date(),
      paymentMethod: 'other',
      notes: `Group settlement in "${group.name}"`
    });

    await transaction.save();

    // Mark relevant expense splits as settled
    const expenses = await GroupExpense.find({ group: groupId, isSettled: false });
    
    for (const expense of expenses) {
      let updated = false;
      for (const split of expense.splits) {
        if (split.member.toString() === fromUserId && !split.settled) {
          split.settled = true;
          updated = true;
        }
      }
      
      if (updated) {
        // Check if all splits are settled
        const allSettled = expense.splits.every(s => s.settled);
        if (allSettled) {
          expense.isSettled = true;
          expense.settledAt = new Date();
        }
        await expense.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Settlement recorded successfully',
      data: {
        transaction,
        amount,
        from: { _id: student._id, name: student.name, email: student.email },
        to: { _id: toUser._id, name: toUser.name, email: toUser.email }
      }
    });
  } catch (error) {
    console.error('Error settling balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to settle balance',
      error: error.message
    });
  }
};

// Settle all simplified settlements for a group
exports.settleAll = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { firebaseUid } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ success: false, message: 'firebaseUid is required' });
    }

    const executor = await Student.findOne({ firebaseUid });
    if (!executor) {
      return res.status(404).json({ success: false, message: 'Executor student not found' });
    }

    const group = await Group.findById(groupId).populate('owner', 'name _id');
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isOwner = group.owner._id.toString() === executor._id.toString();

    // Compute simplified settlements
    const settlements = await GroupExpense.getSimplifiedSettlements(groupId);

    if (!settlements.length) {
      return res.status(200).json({ success: true, message: 'No settlements needed', data: [] });
    }

    const createdTransactions = [];

    // For marking splits
    const expenses = await GroupExpense.find({ group: groupId, isSettled: false });

    for (const s of settlements) {
      const fromId = s.from.userId;
      const toId = s.to.userId;
      const amount = s.amount;

      // Permission: owner can settle all; others can settle only their own outgoing settlements
      if (!isOwner && executor._id.toString() !== fromId) {
        // skip settlements not initiated by this user
        continue;
      }

      // Create transaction recorded under the payer (from)
      const transaction = new Transaction({
        student: fromId,
        group: groupId,
        receiver: toId,
        type: 'transfer',
        amount: amount,
        category: 'account_transfer',
        description: `Settlement to ${s.to.name}`,
        date: new Date(),
        paymentMethod: 'other',
        notes: `Group settlement in "${group.name}"`
      });

      await transaction.save();
      createdTransactions.push(transaction);

      // Mark relevant splits as settled for this debtor across expenses
      for (const expense of expenses) {
        let updated = false;
        for (const split of expense.splits) {
          if (split.member.toString() === fromId && !split.settled) {
            split.settled = true;
            updated = true;
          }
        }

        if (updated) {
          const allSettled = expense.splits.every(s => s.settled);
          if (allSettled) {
            expense.isSettled = true;
            expense.settledAt = new Date();
          }
          await expense.save();
        }
      }
    }

    res.status(200).json({ success: true, message: 'Settlements processed', data: { created: createdTransactions } });
  } catch (error) {
    console.error('Error settling all:', error);
    res.status(500).json({ success: false, message: 'Failed to process settlements', error: error.message });
  }
};

// Get group analytics
exports.getGroupAnalytics = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Calculate expense by member
    const expenses = await GroupExpense.find({ group: groupId })
      .populate('paidBy', 'name email profilePhoto');
    
    // Total expenses and count
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const expenseCount = expenses.length;
    
    // Expense by member
    const memberPaidMap = new Map();
    expenses.forEach(exp => {
      const memberId = exp.paidBy._id.toString();
      if (!memberPaidMap.has(memberId)) {
        memberPaidMap.set(memberId, {
          member: {
            _id: exp.paidBy._id,
            name: exp.paidBy.name,
            email: exp.paidBy.email,
            profilePhoto: exp.paidBy.profilePhoto
          },
          totalPaid: 0,
          count: 0
        });
      }
      const data = memberPaidMap.get(memberId);
      data.totalPaid += exp.amount;
      data.count += 1;
    });
    const expenseByMember = Array.from(memberPaidMap.values());
    
    // Category Breakdown
    const categoryMap = new Map();
    expenses.forEach(exp => {
      if (!categoryMap.has(exp.category)) {
        categoryMap.set(exp.category, {
          category: exp.category,
          total: 0,
          count: 0
        });
      }
      const data = categoryMap.get(exp.category);
      data.total += exp.amount;
      data.count += 1;
    });
    const categoryBreakdown = Array.from(categoryMap.values());
    
    // Timeline (Monthly)
    const monthMap = new Map();
    expenses.forEach(exp => {
      const date = new Date(exp.date);
      const monthYear = date.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
      if (!monthMap.has(monthYear)) {
        monthMap.set(monthYear, {
          month: monthYear,
          total: 0,
          count: 0,
          date: date // For sorting
        });
      }
      const data = monthMap.get(monthYear);
      data.total += exp.amount;
      data.count += 1;
    });
    const timeline = Array.from(monthMap.values()).sort((a, b) => a.date - b.date);
    
    // Current Balances
    const balances = await GroupExpense.calculateGroupBalances(groupId);
    const balancesMap = {};
    balances.forEach(b => {
      balancesMap[b.userId] = b.balance;
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalExpenses,
        expenseCount,
        expenseByMember,
        categoryBreakdown,
        timeline,
        balances: balancesMap
      }
    });
  } catch (error) {
    console.error('Error getting group analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get group analytics',
      error: error.message
    });
  }
};

// Get all transactions for a group (including settlements) - Merged View
exports.getGroupTransactions = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // 1. Fetch Group Expenses (Source of truth for expenses)
    const expensesPromise = GroupExpense.find({ group: groupId })
      .populate('paidBy', 'name email profilePhoto')
      .lean();

    // 2. Fetch Settlement Transactions (Source of truth for settlements)
    const settlementsPromise = Transaction.find({ 
      group: groupId, 
      type: 'transfer' 
    })
    .populate('student', 'name email profilePhoto')
    .populate('receiver', 'name email profilePhoto')
    .lean();

    const [expenses, settlements] = await Promise.all([expensesPromise, settlementsPromise]);

    // 3. Normalize expenses to match Transaction interface
    const normalizedExpenses = expenses.map(exp => ({
      _id: exp._id,
      type: 'expense',
      amount: exp.amount,
      description: exp.description,
      category: exp.category,
      date: exp.date,
      student: exp.paidBy, // Map paidBy to student to match Transaction schema
      group: exp.group,
      isGroupExpense: true
    }));

    // 4. Combine and Sort
    const allItems = [...normalizedExpenses, ...settlements].sort((a, b) => {
      return new Date(b.date) - new Date(a.date); // Descending
    });

    // 5. Pagination
    const total = allItems.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedItems = allItems.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: {
        transactions: paginatedItems,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching group transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch group transactions', error: error.message });
  }
};

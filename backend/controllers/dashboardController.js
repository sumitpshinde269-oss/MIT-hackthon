const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

/**
 * @desc    Get merchant dashboard financial summary
 * @route   GET /api/dashboard/summary?userId=<merchantId>
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId format',
      });
    }

    // Verify merchant exists
    const merchant = await User.findById(userId);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant user not found',
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Date range for today
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // This is a simple bookkeeping summary for an MVP and not an official accounting statement.
    const [
      todaySalesAgg,
      todayExpensesAgg,
      totalSalesAgg,
      totalExpensesAgg,
      totalReceivablesAgg,
      totalPayablesAgg,
      recentTransactions,
    ] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            type: 'sale',
            transactionDate: { $gte: startOfToday, $lte: endOfToday },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            type: 'expense',
            transactionDate: { $gte: startOfToday, $lte: endOfToday },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            type: 'sale',
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId: userObjectId,
            type: { $in: ['expense', 'loan_repayment'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Customer.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, total: { $sum: '$currentDue' } } },
      ]),
      Supplier.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, total: { $sum: '$currentPayable' } } },
      ]),
      Transaction.find({ userId: userObjectId })
        .sort({ transactionDate: -1, createdAt: -1 })
        .limit(5),
    ]);

    const todaySales = todaySalesAgg[0]?.total || 0;
    const todayExpenses = todayExpensesAgg[0]?.total || 0;
    const totalSales = totalSalesAgg[0]?.total || 0;
    const totalExpenses = totalExpensesAgg[0]?.total || 0;
    const totalReceivables = totalReceivablesAgg[0]?.total || 0;
    const totalPayables = totalPayablesAgg[0]?.total || 0;
    const netCashPosition = totalSales - totalExpenses;

    return res.json({
      success: true,
      data: {
        todaySales,
        todayExpenses,
        totalSales,
        totalExpenses,
        totalReceivables,
        totalPayables,
        netCashPosition,
        recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
};

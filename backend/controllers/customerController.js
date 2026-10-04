const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const User = require('../models/User');

/**
 * @desc    Get all customers for a merchant with total receivables
 * @route   GET /api/customers?userId=<merchantId>
 */
const getCustomers = async (req, res, next) => {
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

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [customers, totalReceivablesAgg] = await Promise.all([
      Customer.find({ userId: userObjectId }).sort({ currentDue: -1, createdAt: -1 }),
      Customer.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, total: { $sum: '$currentDue' } } },
      ]),
    ]);

    const totalReceivables = totalReceivablesAgg[0]?.total || 0;

    return res.json({
      success: true,
      data: {
        customers,
        totalReceivables,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single customer by ID
 * @route   GET /api/customers/:id
 */
const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format for customer',
      });
    }

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    return res.json({
      success: true,
      data: {
        customer,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
};

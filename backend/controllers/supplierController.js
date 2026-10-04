const mongoose = require('mongoose');
const Supplier = require('../models/Supplier');
const User = require('../models/User');

/**
 * @desc    Get all suppliers for a merchant with total payables
 * @route   GET /api/suppliers?userId=<merchantId>
 */
const getSuppliers = async (req, res, next) => {
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

    const [suppliers, totalPayablesAgg] = await Promise.all([
      Supplier.find({ userId: userObjectId }).sort({ currentPayable: -1, createdAt: -1 }),
      Supplier.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, total: { $sum: '$currentPayable' } } },
      ]),
    ]);

    const totalPayables = totalPayablesAgg[0]?.total || 0;

    return res.json({
      success: true,
      data: {
        suppliers,
        totalPayables,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single supplier by ID
 * @route   GET /api/suppliers/:id
 */
const getSupplierById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format for supplier',
      });
    }

    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    return res.json({
      success: true,
      data: {
        supplier,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
};

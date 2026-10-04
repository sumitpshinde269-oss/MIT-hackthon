const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

// Allowed transaction types
const ALLOWED_TYPES = [
  'sale',
  'expense',
  'customer_credit_given',
  'customer_payment_received',
  'supplier_purchase_credit',
  'supplier_payment',
  'loan_repayment',
];

/**
 * @desc    Create a new transaction
 * @route   POST /api/transactions
 */
const createTransaction = async (req, res, next) => {
  try {
    const {
      userId,
      type,
      amount,
      partyName,
      partyType,
      paymentMode,
      category,
      description,
      transactionDate,
      inputMethod,
      rawInputText,
      aiProcessed,
      status,
    } = req.body;

    // 1. Validation for required fields
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

    // Verify user exists in database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'type is required',
      });
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transaction type. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
      });
    }

    if (amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'amount is required',
      });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'amount must be greater than 0',
      });
    }

    let customerId = null;
    let supplierId = null;
    let assignedPartyType = partyType || 'other';
    const txnDate = transactionDate ? new Date(transactionDate) : new Date();

    // 2. Customer handling
    if (type === 'customer_credit_given') {
      if (!partyName || !partyName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'partyName is required for customer_credit_given',
        });
      }

      const trimmedName = partyName.trim();
      let customer = await Customer.findOne({
        userId,
        $or: [{ partyName: trimmedName }, { name: trimmedName }],
      });

      if (!customer) {
        customer = await Customer.create({
          userId,
          partyName: trimmedName,
          name: trimmedName,
          currentDue: 0,
        });
      }

      customer.currentDue = (customer.currentDue || 0) + parsedAmount;
      customer.lastTransactionDate = txnDate;
      await customer.save();

      customerId = customer._id;
      assignedPartyType = 'customer';
    } else if (type === 'customer_payment_received') {
      if (!partyName || !partyName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'partyName is required for customer_payment_received',
        });
      }

      const trimmedName = partyName.trim();
      const customer = await Customer.findOne({
        userId,
        $or: [{ partyName: trimmedName }, { name: trimmedName }],
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: `Customer '${trimmedName}' not found`,
        });
      }

      const currentDue = customer.currentDue || 0;
      if (parsedAmount > currentDue) {
        return res.status(400).json({
          success: false,
          message: `Payment amount (${parsedAmount}) exceeds customer current due of ${currentDue}`,
        });
      }

      customer.currentDue = currentDue - parsedAmount;
      customer.lastTransactionDate = txnDate;
      await customer.save();

      customerId = customer._id;
      assignedPartyType = 'customer';
    }

    // 3. Supplier handling
    else if (type === 'supplier_purchase_credit') {
      if (!partyName || !partyName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'partyName is required for supplier_purchase_credit',
        });
      }

      const trimmedName = partyName.trim();
      let supplier = await Supplier.findOne({
        userId,
        $or: [{ partyName: trimmedName }, { name: trimmedName }],
      });

      if (!supplier) {
        supplier = await Supplier.create({
          userId,
          partyName: trimmedName,
          name: trimmedName,
          companyName: trimmedName,
          currentPayable: 0,
        });
      }

      supplier.currentPayable = (supplier.currentPayable || 0) + parsedAmount;
      supplier.lastTransactionDate = txnDate;
      await supplier.save();

      supplierId = supplier._id;
      assignedPartyType = 'supplier';
    } else if (type === 'supplier_payment') {
      if (!partyName || !partyName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'partyName is required for supplier_payment',
        });
      }

      const trimmedName = partyName.trim();
      const supplier = await Supplier.findOne({
        userId,
        $or: [{ partyName: trimmedName }, { name: trimmedName }],
      });

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: `Supplier '${trimmedName}' not found`,
        });
      }

      const currentPayable = supplier.currentPayable || 0;
      if (parsedAmount > currentPayable) {
        return res.status(400).json({
          success: false,
          message: `Payment amount (${parsedAmount}) exceeds supplier current payable of ${currentPayable}`,
        });
      }

      supplier.currentPayable = currentPayable - parsedAmount;
      supplier.lastPaymentDate = txnDate;
      await supplier.save();

      supplierId = supplier._id;
      assignedPartyType = 'supplier';
    }

    // 4. Create and save Transaction record
    const transaction = await Transaction.create({
      userId,
      type,
      amount: parsedAmount,
      partyName: partyName ? partyName.trim() : '',
      partyType: assignedPartyType,
      paymentMode: paymentMode || 'cash',
      category: category || '',
      description: description || '',
      transactionDate: txnDate,
      inputMethod: inputMethod || 'manual',
      rawInputText: rawInputText || '',
      aiProcessed: Boolean(aiProcessed),
      status: status || 'confirmed',
      customerId,
      supplierId,
    });

    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get transactions with filters and pagination
 * @route   GET /api/transactions
 */
const getTransactions = async (req, res, next) => {
  try {
    const { userId, type, startDate, endDate } = req.query;

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

    const query = { userId: new mongoose.Types.ObjectId(userId) };

    if (type) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) {
        query.transactionDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.transactionDate.$lte = end;
      }
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const [totalTransactions, transactions] = await Promise.all([
      Transaction.countDocuments(query),
      Transaction.find(query)
        .sort({ transactionDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    const totalPages = Math.ceil(totalTransactions / limit) || 1;

    return res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: page,
          totalPages,
          totalTransactions,
          limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single transaction by ID
 * @route   GET /api/transactions/:id
 */
const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format for transaction',
      });
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    return res.json({
      success: true,
      data: {
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a transaction
 * @route   PUT /api/transactions/:id
 */
const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format for transaction',
      });
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    const { amount, category, description, paymentMode, transactionDate, status } = req.body;

    // Validate amount if passed
    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'amount must be greater than 0',
        });
      }
      transaction.amount = parsedAmount;
    }

    // TODO: future version must safely recalculate customer and supplier dues after transaction updates.
    if (category !== undefined) transaction.category = category;
    if (description !== undefined) transaction.description = description;
    if (paymentMode !== undefined) transaction.paymentMode = paymentMode;
    if (transactionDate !== undefined) transaction.transactionDate = new Date(transactionDate);
    if (status !== undefined) transaction.status = status;

    await transaction.save();

    return res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: {
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a transaction (MVP)
 * @route   DELETE /api/transactions/:id
 */
const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format for transaction',
      });
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // TODO: future version must safely reverse customer and supplier due calculations after transaction deletion.
    await Transaction.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },
    type: {
      type: String,
      enum: {
        values: [
          'sale',
          'expense',
          'customer_credit_given',
          'customer_payment_received',
          'supplier_purchase_credit',
          'supplier_payment',
          'loan_repayment',
          'CREDIT',
          'PAYMENT',
          'PURCHASE',
          'SALE',
        ],
        message: 'Invalid transaction type',
      },
      required: [true, 'type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    partyName: {
      type: String,
      default: '',
      trim: true,
    },
    partyType: {
      type: String,
      enum: ['customer', 'supplier', 'other'],
      default: 'other',
    },
    paymentMode: {
      type: String,
      default: 'cash',
      trim: true,
    },
    category: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    inputMethod: {
      type: String,
      default: 'manual',
    },
    rawInputText: {
      type: String,
      default: '',
    },
    aiProcessed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: 'confirmed',
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

module.exports = mongoose.model('Transaction', transactionSchema);

const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    partyName: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    companyName: {
      type: String,
      default: '',
      trim: true,
    },
    currentPayable: {
      type: Number,
      default: 0,
      min: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
    lastPaymentDate: {
      type: Date,
    },
    lastTransactionDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

module.exports = mongoose.model('Supplier', supplierSchema);

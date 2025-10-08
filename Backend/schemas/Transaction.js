// models/Transaction.js
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  gateway: {
    type: String,
    required: true,
    trim: true
  },
  transaction_date: {
    type: Date,
    default: Date.now // tương đương timestamp NOT NULL
  },
  account_number: {
    type: String,
    default: null
  },
  sub_account: {
    type: String,
    default: null
  },
  amount_in: {
    type: mongoose.Decimal128,
    default: 0.00
  },
  amount_out: {
    type: mongoose.Decimal128,
    default: 0.00
  },
  accumulated: {
    type: mongoose.Decimal128,
    default: 0.00
  },
  code: {
    type: String,
    default: null
  },
  transaction_content: {
    type: String,
    default: null
  },
  reference_number: {
    type: String,
    default: null
  },
  body: {
    type: String,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// tạo model
const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;

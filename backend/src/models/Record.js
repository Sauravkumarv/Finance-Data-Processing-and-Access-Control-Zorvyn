const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

recordSchema.index({ date: -1 });
recordSchema.index({ owner: 1, category: 1 });

module.exports = mongoose.model('Record', recordSchema);
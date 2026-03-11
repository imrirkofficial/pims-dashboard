const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
  category: String,      // Jemon: Gmail, Crypto, Social Media
  service: String,       // Jemon: Binance, Facebook
  email: String,
  username: String,
  password: { type: String, required: true },
  phone: String,
  remark: String,
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Account', AccountSchema);
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  title: String,
  fst_name: String,
  lst_name: String,
  email: String,
  phone: String,
  contact_type: String,
  message: String,
}, { timestamps: true });

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);

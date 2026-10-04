const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  con_name: String,
  address: String,
  tel: String,
  fax: String,
  email: String,
}, { timestamps: true });

module.exports = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);

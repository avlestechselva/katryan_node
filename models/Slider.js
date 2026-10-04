const mongoose = require('mongoose');

const SliderSchema = new mongoose.Schema({
  img_url: { type: String, required: true },
  img_id: String,
  dis_text: { type: String, required: true },
  pos: { type: Number, default: 1 },
  status: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.models.Slider || mongoose.model('Slider', SliderSchema);

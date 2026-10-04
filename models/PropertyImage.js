const mongoose = require('mongoose');

const PropertyImageSchema = new mongoose.Schema({
  propertyid: { type: String, required: true, index: true },
  img_url: { type: String, required: true },
  image_type: { type: String, enum: ['display_img', 'floorplan', 'epcGraph', 'brochure'] },
}, { timestamps: true });

module.exports = mongoose.models.PropertyImage || mongoose.model('PropertyImage', PropertyImageSchema);

const Slider = require('../models/Slider');
const { sliderUpload, cloudinary } = require('../config/multer');

exports.index = async (req, res) => {
  const sliders = await Slider.find().sort({ pos: 1 });
  res.render('admin/slider/index', {
    layout: 'layout/admin',
    page: 'slider',
    sliders,
  });
};

exports.store = (req, res) => {
  sliderUpload(req, res, async (err) => {
    if (err) {
      return res.redirect('/admin/slider?error=' + encodeURIComponent(err.message));
    }
    if (!req.file) {
      return res.redirect('/admin/slider?error=' + encodeURIComponent('Image file is required'));
    }
    const { dis_text, pos, status } = req.body;
    if (!dis_text || !status) {
      return res.redirect('/admin/slider?error=' + encodeURIComponent('All fields are required'));
    }
    await Slider.create({
      img_url: req.file.path,
      img_id: req.file.filename,
      dis_text,
      pos: pos || 1,
      status,
    });
    res.redirect('/admin/slider?success=' + encodeURIComponent('Image successfully stored'));
  });
};

exports.update = (req, res) => {
  sliderUpload(req, res, async (err) => {
    if (err) {
      return res.redirect('/admin/slider?error=' + encodeURIComponent(err.message));
    }
    const { dis_text, pos, status } = req.body;
    if (!dis_text || !status) {
      return res.redirect('/admin/slider?error=' + encodeURIComponent('All fields are required'));
    }

    const updateData = { dis_text, pos: pos || 1, status };

    if (req.file) {
      const existing = await Slider.findById(req.params.id);
      if (existing && existing.img_id) {
        try { await cloudinary.uploader.destroy(existing.img_id); } catch (e) { /* ignore */ }
      }
      updateData.img_url = req.file.path;
      updateData.img_id = req.file.filename;
    }

    await Slider.findByIdAndUpdate(req.params.id, updateData);
    res.redirect('/admin/slider?success=' + encodeURIComponent('Image successfully updated'));
  });
};

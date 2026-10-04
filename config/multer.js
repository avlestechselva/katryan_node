const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imageStorage = (folder) => new CloudinaryStorage({
  cloudinary,
  params: { folder, allowed_formats: ['jpg', 'jpeg', 'png'] },
});

const imageFilter = (req, file, cb) => {
  if (/jpeg|jpg|png/.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG/PNG images allowed'));
};

exports.sliderUpload = multer({
  storage: imageStorage('katryan/slider'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter,
}).single('img_file');

exports.cloudinary = cloudinary;

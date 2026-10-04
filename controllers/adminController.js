const Property = require('../models/Property');
const RegisterUser = require('../models/RegisterUser');
const Contact = require('../models/Contact');
const Message = require('../models/Message');

exports.index = async (req, res) => {
  const [propertyCount, userCount, msgCount, userDetail] = await Promise.all([
    Property.countDocuments(),
    RegisterUser.countDocuments(),
    Message.countDocuments(),
    Contact.findOne(),
  ]);
  res.render('admin/dashboard', {
    layout: 'layout/admin',
    page: 'home',
    propertyCount,
    userCount,
    msgCount,
    userDetail: userDetail || {},
  });
};

exports.updateContact = async (req, res) => {
  const { con_name, address, tel, fax, email } = req.body;
  try {
    await Contact.findByIdAndUpdate(req.params.id, { con_name, address, tel, fax, email }, { upsert: true });
    res.redirect('/admin?success=' + encodeURIComponent('Successfully Updated'));
  } catch (e) {
    res.redirect('/admin?error=' + encodeURIComponent('Update Failed'));
  }
};

exports.userList = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  const total = await RegisterUser.countDocuments();
  const users = await RegisterUser.find().sort({ _id: -1 }).skip(skip).limit(limit);
  const totalPages = Math.ceil(total / limit);
  res.render('admin/users/index', {
    layout: 'layout/admin',
    page: 'user',
    users,
    currentPage: page,
    totalPages,
  });
};

exports.messageList = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  const total = await Message.countDocuments();
  const messages = await Message.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
  const totalPages = Math.ceil(total / limit);
  res.render('admin/users/messages', {
    layout: 'layout/admin',
    page: 'messages',
    messages,
    currentPage: page,
    totalPages,
  });
};

exports.userView = async (req, res) => {
  const userData = await RegisterUser.findById(req.params.id);
  if (!userData) return res.redirect('/admin/users?error=' + encodeURIComponent('User not found'));
  res.render('admin/users/view', {
    layout: 'layout/admin',
    page: 'user',
    userData,
  });
};

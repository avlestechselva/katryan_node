const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.getLogin = (req, res) => {
  res.render('auth/login', { layout: false });
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.redirect('/admin/login?error=' + encodeURIComponent('Invalid email or password'));
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.redirect('/admin/login?error=' + encodeURIComponent('Invalid email or password'));
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/admin');
  } catch (e) {
    console.error(e);
    res.redirect('/admin/login?error=' + encodeURIComponent('Something went wrong'));
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/admin/login?success=' + encodeURIComponent('Logged out successfully'));
};

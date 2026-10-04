require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const methodOverride = require('method-override');
const path = require('path');
const helmet = require('helmet');
const connectDB = require('./config/database');
const User = require('./models/User');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout/app');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (e) {
    console.error('DB connection error:', e.message);
    res.status(503).send('Database connection failed: ' + e.message);
  }
});

app.use(async (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (e) {
      res.clearCookie('token');
    }
  }
  next();
});

app.use((req, res, next) => {
  res.locals.success = req.query.success ? [req.query.success] : [];
  res.locals.error = req.query.error ? [req.query.error] : [];
  res.locals.user = req.user || null;
  next();
});

app.use('/', require('./routes/web'));

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;

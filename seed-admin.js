require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  const email = 'admin@katryan.co.uk';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin user already exists:', email);
    process.exit(0);
  }

  const password = await bcrypt.hash('Admin@1234', 10);
  await User.create({ name: 'Admin', email, password });
  console.log('Admin user created successfully');
  console.log('Email:', email);
  console.log('Password: Admin@1234');
  console.log('Change your password after first login!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });

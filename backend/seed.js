const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

// Models
const User = require('./models/User');

// Load environment variables
dotenv.config();

// Override DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return false;
  }
};

const seedData = async () => {
  const connected = await connectDB();
  if (!connected) process.exit(1);

  try {
    console.log('Clearing existing users...');
    await User.deleteMany();

    console.log('Inserting test user...');
    await User.create({
      name: 'Test Administrator',
      email: 'test@admin.com',
      passwordHash: 'dummyhash', 
    });

    console.log('✅ Data inserted successfully! You should now see the "expense_tracker" database and "users" collection in Atlas.');
    process.exit(0);
  } catch (error) {
    console.error(`Error with seeding: ${error.message}`);
    process.exit(1);
  }
};

seedData();

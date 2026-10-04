require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Customer = require('./models/Customer');
const Supplier = require('./models/Supplier');
const Transaction = require('./models/Transaction');

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Database connected, starting seed process...');

    // Clear existing collections if connected
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany();
      await Customer.deleteMany();
      await Supplier.deleteMany();
      await Transaction.deleteMany();

      const user = await User.create({
        name: 'Ramesh Kumar',
        phone: '9876543210',
        shopName: 'Ramesh Kirana Store',
        address: 'Main Market, Pune',
      });

      const customer = await Customer.create({
        name: 'Suresh Patil',
        phone: '9123456780',
        address: 'Shivaji Nagar, Pune',
        balance: 1500,
      });

      const supplier = await Supplier.create({
        name: 'Shree Ganesh Wholesalers',
        phone: '9988776655',
        companyName: 'Ganesh Wholesale Mart',
        balance: 5000,
      });

      await Transaction.create({
        type: 'CREDIT',
        amount: 1500,
        customerId: customer._id,
        description: 'Monthly grocery udhaar',
      });

      console.log('[Seed] Successfully seeded sample data!');
    } else {
      console.log('[Seed] Skipped seeding: MongoDB not connected.');
    }

    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Error during seeding: ${error.message}`);
    process.exit(1);
  }
};

seedData();

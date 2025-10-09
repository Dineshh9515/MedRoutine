require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Medication = require('../models/Medication');

// Sample data for testing
const sampleUsers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password123',
    phone: '+1234567890',
    role: 'patient'
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    password: 'password123',
    phone: '+1234567891',
    role: 'caregiver'
  }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medroutine', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Medication.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users
    const createdUsers = await User.create(sampleUsers);
    console.log('👥 Created sample users');

    // Create sample medication for first user
    const sampleMedication = {
      user: createdUsers[0]._id,
      name: 'Aspirin',
      dosage: {
        amount: 100,
        unit: 'mg'
      },
      frequency: 'once_daily',
      schedule: [
        {
          time: '09:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        }
      ],
      startDate: new Date(),
      prescribedBy: 'Dr. Smith',
      reason: 'Heart health',
      instructions: 'Take with food',
      isActive: true
    };

    await Medication.create(sampleMedication);
    console.log('💊 Created sample medication');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nSample credentials:');
    console.log('Email: john@example.com');
    console.log('Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
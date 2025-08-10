const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

/**
 * Seed demo user for testing
 */
async function seedDemoUser() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rd_prediction', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB for seeding...');

    // Check if demo user already exists
    const existingDemo = await User.findOne({ email: 'demo@medical.com' });
    
    if (existingDemo) {
      console.log('✅ Demo user already exists');
      console.log('Email: demo@medical.com');
      console.log('Password: demo123');
      await mongoose.disconnect();
      return;
    }

    // Create demo user
    const demoUser = new User({
      username: 'demo',
      email: 'demo@medical.com',
      password: 'demo123',
      role: 'user',
      predictionCount: 0
    });

    await demoUser.save();
    
    console.log('✅ Demo user created successfully!');
    console.log('📧 Email: demo@medical.com');
    console.log('🔑 Password: demo123');
    console.log('');
    console.log('You can now use these credentials to login!');
    
    await mongoose.disconnect();
    console.log('Database connection closed.');
    
  } catch (error) {
    console.error('❌ Error seeding demo user:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedDemoUser();
}

module.exports = seedDemoUser;

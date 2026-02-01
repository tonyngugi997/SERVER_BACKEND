const { Sequelize } = require('sequelize');

// Create SQLite database (file-based)
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite', // This creates a file
  logging: false, // Set to console.log to see SQL queries
});

// Test the connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite database connected successfully');
    return sequelize;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };

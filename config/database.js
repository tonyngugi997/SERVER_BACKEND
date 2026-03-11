const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false, 
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


require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Resend } = require('resend');
const { Sequelize, DataTypes } = require('sequelize');

// Initialize Express app
const app = express();

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;

// Email client setup
// CORS configuration for Railway
app.use(cors({
  origin: ['*', 'https://healthcheck.railway.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'User-Agent', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url} from ${req.headers['host'] || req.ip}`);
  next();
});
    console.log('❌ Resend configuration error:', error.message);
    console.log('📧 Using console-only mode');
  }
} else {
  console.log('📧 Using console-only email mode');
}

// Database setup
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false,
});

// OTP Model
const OTP = sequelize.define('OTP', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  otp: {
    type: DataTypes.STRING(6),
    allowNull: false,
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// User Model - SIMPLIFIED VERSION
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user',
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Removed problematic columns for now
});

    // Health check endpoint for Railway
    app.get('/api/health', (req, res) => {
      console.log('🔍 Health check called from:', req.headers['host'] || req.headers['x-forwarded-host']);
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'SmarTQue Backend',
        environment: process.env.NODE_ENV || 'development'
      });
    });
    
    // HEAD method for health checks
    app.head('/api/health', (req, res) => {
      res.status(200).end();
    });
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  doctorName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  departmentName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dateTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  queueNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('upcoming', 'completed', 'cancelled'),
    defaultValue: 'upcoming',
  },
  consultationFee: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// Hash password before saving
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'smartque_dev_secret_2024', {
    expiresIn: '24h'
  });
};

// Send email function
const sendEmail = async (to, subject, html) => {
  if (!emailEnabled) {
    console.log(`\n📧 [DEV MODE] Email would be sent to: ${to}`);
    console.log(`📧 [DEV MODE] Subject: ${subject}`);
    console.log(`📧 [DEV MODE] HTML content prepared\n`);
    return true;
  }
  
  try {
    const { data, error } = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: [to],
      subject: subject,
      html: html,
    });
    
    if (error) {
      console.error('❌ Resend error:', error);
      return false;
    }
    
    console.log(`✅ Email sent to: ${to} (ID: ${data.id})`);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error);
    return false;
  }
};

// Send OTP email
const sendOtpEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #6C63FF, #00BFA6); padding: 40px; border-radius: 15px 15px 0 0; text-align: center; color: white;">
        <h1 style="margin: 0;">SmarTQue</h1>
        <p>Email Verification</p>
      </div>
      
      <div style="padding: 40px; background: white; border-radius: 0 0 15px 15px; border: 1px solid #e0e0e0; border-top: none;">
        <h2>Your Verification Code</h2>
        
        <div style="text-align: center; margin: 30px 0; padding: 30px; background: #f8f9fa; border-radius: 12px; border: 3px solid #6C63FF;">
          <h1 style="color: #6C63FF; font-size: 48px; letter-spacing: 10px; margin: 0; font-family: monospace;">${otp}</h1>
        </div>
        
        <p>Enter this 6-digit code in the app to verify your email address.</p>
        <p><strong>This code expires in 10 minutes.</strong></p>
        
        <div style="background: #fff8e1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffb300;">
          <p><strong>⚠️ Security Notice:</strong> Never share this code with anyone.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>© 2026 SmarTQue Inc.</p>
        </div>
      </div>
    </div>
  `;
  
  return await sendEmail(email, 'Your SmarTQue Verification Code', html);
};

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite database connected');
    
    // Sync database - DROP AND RECREATE to fix schema
    console.log('🔄 Syncing database tables...');
    await sequelize.sync({alter: true});
    console.log('✅ Database tables created');
    
    // Health check endpoint
    app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'SmarTQue Backend API v2.0',
        status: 'running',
        email: emailEnabled ? 'configured' : 'console-only',
        timestamp: new Date().toISOString()
      });
    });
    
    app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    });
    
    // Generate OTP endpoint
    app.post('/api/auth/generate-otp', async (req, res) => {
      try {
        const { email } = req.body;
        
        console.log('\n📱 OTP Request for:', email);
        
        if (!email) {
          return res.status(400).json({
            success: false,
            error: 'Email is required'
          });
        }
        
        // Simple email validation
        if (!email.includes('@') || !email.includes('.')) {
          return res.status(400).json({
            success: false,
            error: 'Invalid email format'
          });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            error: 'Email already registered. Please login instead.'
          });
        }
        
        // Clean old OTPs for this email
        await OTP.destroy({ where: { email } });
        
        // Generate new OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        
        await OTP.create({
          email,
          otp,
          expiresAt,
        });
        
        console.log(`📱 Generated OTP for ${email}: ${otp}`);
        console.log(`⏰ OTP expires at: ${expiresAt.toLocaleTimeString()}`);
        
        // Send email
        const emailSent = await sendOtpEmail(email, otp);
        
        if (!emailSent) {
          return res.status(500).json({
            success: false,
            error: 'Failed to send verification email'
          });
        }
        
        res.json({
          success: true,
          message: 'Verification code sent to your email',
          expiresIn: 600, // 10 minutes in seconds
          otp: otp, // For development only
        });
        
      } catch (error) {
        console.error('❌ OTP generation error:', error);
        res.status(500).json({
          success: false,
          error: 'Server error'
        });
      }
    });
    
    // Verify OTP endpoint
    app.post('/api/auth/verify-otp', async (req, res) => {
      try {
        const { email, otp } = req.body;
        
        console.log('\n🔍 OTP Verification for:', email);
        
        if (!email || !otp) {
          return res.status(400).json({
            success: false,
            error: 'Email and OTP are required'
          });
        }
        
        if (otp.length !== 6 || !/^\d+$/.test(otp)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid OTP format. Must be 6 digits.'
          });
        }
        
        const otpRecord = await OTP.findOne({
          where: { email },
          order: [['createdAt', 'DESC']]
        });
        
        if (!otpRecord) {
          return res.status(400).json({
            success: false,
            error: 'No verification request found for this email'
          });
        }
        
        if (new Date() > otpRecord.expiresAt) {
          await otpRecord.destroy();
          return res.status(400).json({
            success: false,
            error: 'Verification code has expired. Please request a new one.'
          });
        }
        
        if (otpRecord.otp !== otp) {
          otpRecord.attempts += 1;
          await otpRecord.save();
          
          return res.status(400).json({
            success: false,
            error: 'Invalid verification code',
            attemptsRemaining: 3 - otpRecord.attempts
          });
        }
        
        otpRecord.verified = true;
        await otpRecord.save();
        
        console.log('✅ OTP Verified for:', email);
        
        res.json({
          success: true,
          message: 'Email verified successfully!',
          verified: true,
        });
        
      } catch (error) {
        console.error('❌ OTP verification error:', error);
        res.status(500).json({
          success: false,
          error: 'Server error'
        });
      }
    });
    
    // Register endpoint
    app.post('/api/auth/register', async (req, res) => {
      try {
        const { email, password, name } = req.body;
        
        console.log('\n📝 Registration attempt for:', email);
        
        if (!email || !password || !name) {
          return res.status(400).json({
            success: false,
            error: 'All fields are required'
          });
        }
        
        if (password.length < 6) {
          return res.status(400).json({
            success: false,
            error: 'Password must be at least 6 characters'
          });
        }
        
        // Check OTP verification
        const verifiedOtp = await OTP.findOne({
          where: {
            email,
            verified: true,
          }
        });
        
        if (!verifiedOtp) {
          return res.status(400).json({
            success: false,
            error: 'Email verification required. Please verify your email first.'
          });
        }
        
        // Check existing user
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          await OTP.destroy({ where: { email } });
          return res.status(400).json({
            success: false,
            error: 'User already exists. Please login instead.'
          });
        }
        
        // Create user
        const user = await User.create({
          email,
          password,
          name,
          isEmailVerified: true,
        });
        
        // Clean OTP
        await OTP.destroy({ where: { email } });
        
        const token = generateToken(user.id);
        
        console.log('✅ Registration successful for:', email);
        
        res.status(201).json({
          success: true,
          message: 'Registration successful!',
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
          }
        });
        
      } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
          success: false,
          error: 'Server error'
        });
      }
    });
    
    // Login endpoint
    app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        console.log('\n🔐 Login attempt for:', email);
        
        if (!email || !password) {
          return res.status(400).json({
            success: false,
            error: 'Email and password are required'
          });
        }
        
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
          console.log('❌ User not found:', email);
          return res.status(401).json({
            success: false,
            error: 'Invalid email or password'
          });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            error: 'Invalid email or password'
          });
        }
        
        const token = generateToken(user.id);
        
        console.log('✅ Login successful for:', email);
        
        res.json({
          success: true,
          message: 'Login successful!',
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
          }
        });
        
      } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
          success: false,
          error: 'Server error'
        });
      }
    });
    
    // Forgot password endpoint
    app.post('/api/auth/forgot-password', async (req, res) => {
      try {
        const { email } = req.body;
        
        console.log('\n🔑 Forgot password request for:', email);
        
        if (!email) {
          return res.status(400).json({
            success: false,
            error: 'Email is required'
          });
        }
        
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
          // Don't reveal user existence for security
          console.log('📧 Reset request for non-existent email:', email);
          return res.json({
            success: true,
            message: 'If an account exists, password reset instructions have been sent to your email.'
          });
        }
        
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        console.log(`🔑 Reset token for ${email}: ${resetToken}`);
        console.log(`⏰ Token expires in 1 hour`);
        
        // Send reset email
        const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
        
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #6C63FF, #00BFA6); padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">Password Reset</h1>
            </div>
            
            <div style="padding: 40px; background: white; border-radius: 0 0 15px 15px; border: 1px solid #e0e0e0; border-top: none;">
              <p>Hello ${user.name},</p>
              <p>You requested to reset your password for SmarTQue.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #6C63FF; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #666;">This link will expire in 1 hour.</p>
            </div>
          </div>
        `;
        
        await sendEmail(email, 'Reset Your SmarTQue Password', html);
        
        res.json({
          success: true,
          message: 'Password reset instructions have been sent to your email.'
        });
        
      } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({
          success: false,
          error: 'Server error'
        });
      }
    });
    
    // Get current user profile
    app.get('/api/auth/me', async (req, res) => {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return res.status(401).json({
            success: false,
            error: 'No authentication token provided'
          });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smartque_dev_secret_2024');
        const user = await User.findByPk(decoded.id);
        
        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'User not found'
          });
        }
        
        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
          }
        });
        
      } catch (error) {
        console.error('❌ Profile error:', error);
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }
    });

    // ==================== APPOINTMENT ENDPOINTS ====================
    
    // Book appointment
    app.post('/api/appointments/book', async (req, res) => {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return res.status(401).json({
            success: false,
            error: 'No authentication token provided'
          });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smartque_dev_secret_2024');
        const { userId, doctorName, departmentName, dateTime, queueNumber, consultationFee } = req.body;
        
        if (!userId || !doctorName || !departmentName || !dateTime || !queueNumber) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields'
          });
        }
        
        const appointment = await Appointment.create({
          userId,
          doctorName,
          departmentName,
          dateTime,
          queueNumber,
          status: 'upcoming',
          consultationFee: consultationFee || 0,
        });
        
        res.status(201).json({
          success: true,
          appointment: appointment.toJSON(),
          message: 'Appointment booked successfully'
        });
        
      } catch (error) {
        console.error('❌ Book appointment error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to book appointment'
        });
      }
    });
    
    // Get user appointments
    app.get('/api/appointments/user/:userId', async (req, res) => {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return res.status(401).json({
            success: false,
            error: 'No authentication token provided'
          });
        }
        
        const { userId } = req.params;
        const appointments = await Appointment.findAll({
          where: { userId },
          order: [['dateTime', 'DESC']]
        });
        
        res.json({
          success: true,
          appointments: appointments.map(apt => apt.toJSON())
        });
        
      } catch (error) {
        console.error('❌ Get appointments error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch appointments'
        });
      }
    });
    
    // Cancel appointment
    app.post('/api/appointments/cancel/:appointmentId', async (req, res) => {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return res.status(401).json({
            success: false,
            error: 'No authentication token provided'
          });
        }
        
        const { appointmentId } = req.params;
        const appointment = await Appointment.findByPk(appointmentId);
        
        if (!appointment) {
          return res.status(404).json({
            success: false,
            error: 'Appointment not found'
          });
        }
        
        await appointment.update({ status: 'cancelled' });
        
        res.json({
          success: true,
          message: 'Appointment cancelled successfully'
        });
        
      } catch (error) {
        console.error('❌ Cancel appointment error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to cancel appointment'
        });
      }
    });
    
    // Reschedule appointment
    app.post('/api/appointments/reschedule/:appointmentId', async (req, res) => {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return res.status(401).json({
            success: false,
            error: 'No authentication token provided'
          });
        }
        
        const { appointmentId } = req.params;
        const { dateTime } = req.body;
        
        if (!dateTime) {
          return res.status(400).json({
            success: false,
            error: 'New date/time is required'
          });
        }
        
        const appointment = await Appointment.findByPk(appointmentId);
        
        if (!appointment) {
          return res.status(404).json({
            success: false,
            error: 'Appointment not found'
          });
        }
        
        await appointment.update({ dateTime });
        
        res.json({
          success: true,
          appointment: appointment.toJSON(),
          message: 'Appointment rescheduled successfully'
        });
        
      } catch (error) {
        console.error('❌ Reschedule appointment error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to reschedule appointment'
        });
      }
    });
    
    // Get next queue number
    app.get('/api/appointments/next-queue', async (req, res) => {
      try {
        const { department, date } = req.query;
        
        const appointmentDate = new Date(date);
        const dayStart = new Date(appointmentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(appointmentDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        const count = await Appointment.count({
          where: {
            departmentName: department,
            dateTime: {
              [require('sequelize').Op.between]: [dayStart, dayEnd]
            },
            status: 'upcoming'
          }
        });
        
        const nextNumber = count + 1;
        
        res.json({
          success: true,
          queueNumber: nextNumber.toString()
        });
        
      } catch (error) {
        console.error('❌ Get next queue number error:', error);
        res.status(500).json({
          success: false,
          queueNumber: '1'
        });
      }
    });
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 SmarTQue Backend Server (Fixed Version)');
      console.log('='.repeat(60));
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📧 Email mode: ${emailEnabled ? 'REAL' : 'CONSOLE-ONLY'}`);
      console.log('\n📋 Available Endpoints:');
      console.log('   POST /api/auth/login');
      console.log('   POST /api/auth/register');
      console.log('   POST /api/auth/generate-otp');
      console.log('   POST /api/auth/verify-otp');
      console.log('   POST /api/auth/forgot-password');
      console.log('   GET  /api/auth/me');
      console.log('   POST /api/appointments/book');
      console.log('   GET  /api/appointments/user/:userId');
      console.log('   POST /api/appointments/cancel/:appointmentId');
      console.log('   POST /api/appointments/reschedule/:appointmentId');
      console.log('   GET  /api/appointments/next-queue');
      console.log('   GET  /api/health');
      console.log('='.repeat(60) + '\n');
      
      console.log('💡 Test Registration Flow:');
      console.log('1. POST /api/auth/generate-otp with email');
      console.log('2. POST /api/auth/verify-otp with email and OTP');
      console.log('3. POST /api/auth/register with email, password, name\n');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start everything
startServer();
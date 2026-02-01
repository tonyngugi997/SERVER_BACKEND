# SmarTQue Backend

Hospital Queue Management System API

## Deployment on Railway

This app is configured for Railway deployment. Railway will automatically:
1. Install dependencies
2. Build the application
3. Start the server on the assigned PORT

## Environment Variables Required

- `PORT`: Server port (Railway provides this automatically)
- `JWT_SECRET`: Secret key for JWT tokens
- `NODE_ENV`: Environment (production/development)
- `RESEND_API_KEY`: For email functionality (optional)
- `RESEND_FROM_EMAIL`: Sender email address (optional)

## API Endpoints

- `GET /` - Health check
- `GET /api/health` - Health status
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/generate-otp` - Generate OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/appointments/book` - Book appointment
- `GET /api/appointments/user/:userId` - Get user appointments

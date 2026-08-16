const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const xssSanitizer = require('./middleware/xssSanitizerMiddleware');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// 1. Connect to Database
connectDB();

// 2. Security HTTP Headers (XSS, Clickjacking, MIME sniffing protection)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 3. Prevent NoSQL Injection attacks (Sanitize $, . from inputs)
app.use(mongoSanitize({
  replaceWith: '_'
}));

// 4. Rate Limiter - Protect against DDoS & Brute-Force Attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login/register/OTP attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/send-otp', authLimiter);

// 5. Cookie Parser Middleware (HttpOnly Cookie Auth Support)
app.use(cookieParser());

// 6. CORS Middleware
app.use(cors({
  credentials: true,
  origin: true
}));

// 7. Body Parser Middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 8. Recursive XSS Input Sanitizer Middleware
app.use(xssSanitizer);

// 9. API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api', require('./routes/expenseRoutes'));
app.use('/api', require('./routes/settlementRoutes'));
app.use('/api', require('./routes/analyticsRoutes'));

// 10. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Splitwise Financial Engine API is running securely' });
});

// 11. Centralized Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    message: err.message || 'An unexpected server error occurred'
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running securely in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;

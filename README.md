# Basalam Product Manager

A web-based product management system for Basalam vendors with 1500+ products, enabling bulk product editing and management.

## Project Structure

```
basalam-product-manager/
├── src/                    # Next.js frontend
├── server/                 # Express.js backend
│   ├── config/            # Database and configuration
│   ├── models/            # TypeScript interfaces and types
│   ├── routes/            # API routes
│   ├── migrations/        # Database migrations
│   └── __tests__/         # Test files
├── .env.example           # Environment variables template
├── .env.test             # Test environment variables
└── package.json          # Dependencies and scripts
```

## Features Implemented

### ✅ Task 1: Project and Initial Infrastructure

#### 1.1 Backend API Setup
- Express.js server with TypeScript
- Security middleware (Helmet, CORS)
- Logging with Morgan
- Database connection setup
- Basic API routes structure:
  - `/api/auth` - Authentication routes
  - `/api/products` - Product management routes
  - `/api/admin` - Admin panel routes
  - `/api/subscriptions` - Subscription management routes

#### 1.2 Database Models
- PostgreSQL database configuration
- Migration system with SQL files
- Database models and TypeScript interfaces:
  - **Users**: User accounts with Basalam SSO integration
  - **Subscriptions**: Subscription plans (1, 3, 6 months)
  - **Payment Requests**: Card-to-card payment tracking
  - **Activity Logs**: User activity tracking with JSONB details

#### 1.3 Basic Tests
- Jest testing framework setup
- Unit tests for all data models
- Database connection tests
- Test environment configuration
- 30 passing tests covering model interfaces and validation

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone and install dependencies:
```bash
cd basalam-product-manager
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Run database migrations:
```bash
npm run migrate
```

4. Start development servers:
```bash
# Frontend (Next.js)
npm run dev

# Backend (Express.js)
npm run server:dev
```

### Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run server` - Start Express.js server
- `npm run server:dev` - Start Express.js server with watch mode
- `npm run migrate` - Run database migrations
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Database Schema

### Users Table
- Stores user information from Basalam SSO
- Tracks access tokens and admin status
- Indexed on `basalam_user_id` and `vendor_id`

### Subscriptions Table
- Three plan types: 1_month, 3_month, 6_month
- Pricing: 150k, 450k, 690k Tomans respectively
- Status tracking: active, expired, cancelled

### Payment Requests Table
- Card-to-card payment tracking
- Admin approval workflow
- Transaction reference storage

### Activity Logs Table
- JSONB details for flexible logging
- IP address and user agent tracking
- Indexed for efficient querying

## Next Steps

The foundation is now ready for implementing:
- SSO authentication with Basalam
- Subscription and payment system
- Basalam API integration
- Product management features
- Admin panel
- User interface components

## Testing

All core models and database functionality are tested:
```bash
npm test
```

Tests cover:
- Model interface validation
- Type safety
- Database configuration
- Error handling
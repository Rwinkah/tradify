# **Tradify Wallet Service**

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Setup Instructions](#setup-instructions)
  - [Clone the Repository](#1-clone-the-repository)
  - [Install Dependencies](#2-install-dependencies)
  - [Configure Environment Variables](#3-configure-environment-variables)
  - [Set up the Database](#4-set-up-the-database)
  - [Set up Redis](#5-set-up-redis)
  - [Start the Application](#6-start-the-application)
- [Key Assumptions](#key-assumptions)
  - [Currency Management](#currency-management)
  - [Transaction Management](#transaction-management)
  - [Redis Usage](#redis-usage)
  - [Error Handling](#error-handling)
  - [Scalability](#scalability)
  - [Concurrency Control](#concurrency-control)

## **Overview**
Tradify is a wallet management service built using the NestJS framework. It provides functionality for managing user wallets, performing deposits, withdrawals, and currency swaps, and maintaining transaction histories. The service is designed with scalability, modularity, and transactional consistency in mind.

---

## **Features**
- User wallet management
- Deposit and withdrawal functionality
- Currency swaps with a fixed conversion rate
- Transaction history with query filters
- Redis integration for caching and OTP management
- TypeORM for database interactions
- Swagger for API documentation

---

## **Prerequisites**
- **Node.js**: Version 22 or higher
- **PostgreSQL**: Version 10 or higher
- **Redis**: Version 5 or higher
- **npm**: Version 7 or higher

---

## **Setup Instructions**

### **1. Clone the Repository**
```bash
git clone <repository-url>
cd tradify
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Configure Environment Variables**
Copy dummy env from `.env.example` and add the following configurations:

```markdown
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=tradify_db
DB_SYNCHRONIZE=true (⚠️ **Warning:** Set this to `false` in production to avoid accidental schema changes.)

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Email Configurations
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password
EMAIL_FROM=no-reply@example.com

# FX_API configurations
FX_API_KEY=examplekey
FX_ROOT_URL=https://v6.exchangerate-api.com/v6

# System Config
MOCK_BALANCE=false (⚠️ **Warning:** Only set this to `true` for testing purposes. Always set it to `false` in production.)
LOAD_DEFAULT_CURRENCIES=true (Set to `true` if you provide default currencies in `currencies.json`.)
```

### **4. Set up the Database**

psql -U postgres
CREATE DATABASE tradify_db;

### **5. Set up Redis**
# On Linux
sudo systemctl start redis

# On macOS (Homebrew)
brew services start redis

# Verify Redis is running
redis-cli ping

### **6. Start the application**

npm run start:dev

---

## **API Documentation**
The API documentation is available via Swagger. Once the application is running, you can access it at:

This provides detailed information about all available endpoints, request/response formats, and authentication requirements.

---
## **Key Assumptions**

### **1. Currency Management**
- Initial currencies are specified in the `currencies.json` file located in the `src/currency` directory.
- The `LOAD_DEFAULT_CURRENCIES` environment variable determines whether the default currencies are loaded into the database during application startup.
- All currency codes are validated against the `Currency` table before performing operations.
- The default currency is specified in the `.env` file using the `DEF_CURRENCY` variable (e.g., `'NGN'`).


### **2. Wallet Management**
- Each user is automatically assigned a wallet upon registration.
- Wallets are initialized with a balance in the default currency (`DEF_CURRENCY`) specified in the `.env` file.
- Wallet balances for other currencies are initialized with `0`.
- Wallet operations (e.g., deposits, withdrawals, swaps) are atomic and ensure consistency using database transactions.


### **3. Rate Management**
- Exchange rates are fetched from the [exchangerate](https://v6.exchangerate-api.com/v6)  API specified in the `.env` file (`FX_ROOT_URL` and `FX_API_KEY`).
- Exchange rates are cached in Redis for a duration specified by the `FX_CACHE_DURATION` environment variable (default: 5 minutes).
- If a cached rate is invalid or expired, it is deleted, and a fresh rate is fetched from the external API.
- The system assumes that all currencies listed in the `Currency` table are available in the external exchange rate API.

### **4. Transaction Management**
- All wallet operations (deposit, withdrawal, swap, trade) are logged as transactions in the `Transaction` table.
- Transactions are saved as part of atomic database operations to ensure consistency.
- Transactions can be queried with filters such as type, date range, and pagination.


### **5. Redis Usage**
- Redis is used for:
  - Caching exchange rates to reduce API calls.
  - Storing OTPs for email verification with a time-to-live (TTL) of 240 seconds.
- Redis connection details are configured in the `.env` file (`REDIS_HOST` and `REDIS_PORT`).

### **6. Email Notifications**
- Email notifications (e.g., OTPs) are sent using the SMTP configuration specified in the `.env` file.
- Email templates are stored in the `src/notification/emailTemplates` directory.
- OTP emails include the user's first name and a code that expires in 10 minutes.

### **7. Authentication and Authorization**
- JWT-based authentication is used, with the secret key specified in the `.env` file (`JWT_SECRET`).
- The `AuthGuard` ensures that all routes are protected by default unless explicitly marked as public using the `@Public()` decorator.
- The `VerifiedGuard` ensures that only verified users can access certain routes. It is applied selectively to routes that require user verification.


### **8. Error Handling**
- All operations validate inputs and throw appropriate exceptions:
  - `BadRequestException` for invalid inputs or insufficient balances.
  - `NotFoundException` for missing resources (e.g., user, wallet, currency).
  - `UnauthorizedException` for authentication or verification failures.
  - `InternalServerErrorException` for unexpected errors.
- A global exception filter (`AllExceptionsFilter`) is used to handle and log errors consistently.


### **9. Scalability**
- The service is modular, with separate modules for Wallet, Transaction, Notification, Currency, and Authentication.
- TypeORM is used for database interactions, allowing easy migration and scalability.
- Redis is used for caching and session management to improve performance.
- The system is designed to handle concurrent requests using database transactions to ensure consistency.

### **10. Concurrency Control**
- The system uses **Optimistic Locking** to ensure database integrity during concurrent operations.
- Each wallet balance has a `version` column, which is incremented with every update.
- When multiple transactions attempt to modify the same wallet balance, the system checks the `version` column to detect conflicts.
- If a conflict is detected (i.e., the `version` in the database does not match the `version` in the transaction), the operation is rejected, and the user is notified to retry.
- This approach ensures that no two transactions can overwrite each other's changes, maintaining consistency and preventing race conditions.

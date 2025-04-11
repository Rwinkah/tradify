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
Copy dummy env from .env.example and add the following configurations:

```markdown
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=tradify_db

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Email Configurations
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password
EMAIL_FROM=no-reply@example.com
```


# FX_API configurations
FX_API_KEY=examplekey
FX_ROOT_URL=https://v6.exchangerate-api.com/v6


# System Config
MOCK_BALANCE=boolean (WARNING!!! ONLY USE IN TESTING TO POPULATE TEST BALANCE ON CREATE)
LOAD_DEFAULT_CURRENCIES=true (Set to true if you provide default currencies in currencies.json)


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

### Key Assumptions
# Currency Management:

Initial Currencies are specified in the currencies.json file
All currency codes are validated against the Currency table before performing operations.

# Wallet Management:
Wallets are initialied with a wallet balance of the default currency specified in .env 


# Rate Management:

All currencies are  available on https://v6.exchangerate-api.com/v6 

# Transaction Management:

All wallet operations (deposit, withdrawal, swap, trader) are logged as transactions.
Transactions are saved as part of atomic database operations to ensure consistency.

# Redis Usage:

Redis is used for caching and OTP management.
OTPs are stored with a TTL (time-to-live) to ensure expiration.
And for caching fx-rates

# Error Handling:

All operations validate inputs and throw appropriate exceptions (e.g., BadRequestException, NotFoundException).

# Scalability:
The service is modular, with separate modules for Wallet, Transaction, and Notification.
TypeORM is used for database interactions, allowing easy migration and scalability.

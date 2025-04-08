# **Tradify Wallet Service**

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
Create a `.env` file in the root directory and add the following configurations:

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

# Other Configurations
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password
EMAIL_FROM=no-reply@example.com
```

### **4. Set up the databse**

psql -U postgres
CREATE DATABASE tradify_db;

### **5. Set up redis**
# On Linux
sudo systemctl start redis

# On macOS (Homebrew)
brew services start redis

# Verify Redis is running
redis-cli ping

### **6. Start the application**

npm run start:dev


### Key Assumptions
# Currency Management:

All currency codes are validated against the Currency table before performing operations.
Currency swaps use a fixed conversion rate of 0.5.

# Transaction Management:

All wallet operations (deposit, withdrawal, swap) are logged as transactions.
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
# BBayo Backend

BBayo Backend is a multi-branch enterprise inventory, sales, and accounting system. It is designed for single-tenant enterprise customers with custom workflows. The backend is built with **Express.js**, **Prisma ORM**, and **PostgreSQL**. It features branch isolation, role-based access control, audit logs, and comprehensive reporting.

---

## Table of Contents

1. [Features](#features)  
2. [Tech Stack](#tech-stack)  
3. [Getting Started](#getting-started)  
4. [Environment Variables](#environment-variables)  
5. [Database Setup](#database-setup)  
6. [API Endpoints](#api-endpoints)  
7. [Roles and Permissions](#roles-and-permissions)  
8. [Audit Logs](#audit-logs)  
9. [Reports](#reports)  
10. [Security](#security)  
11. [License](#license)

---

## Features

- Multi-branch architecture with branch isolation  
- Role-based access control (RBAC) for enterprise users  
- Inventory management with stock tracking, low stock alerts, and write-offs  
- Sales management with support for same-day reductions and returns  
- Payments and debtor book tracking with overages and outstanding balances  
- Expense tracking and financial reporting  
- Immutable, human-readable audit logs with timestamps  
- Support for general auditors via read-only access  

---

## Tech Stack

- **Server Framework:** Express.js  
- **ORM:** Prisma  
- **Database:** PostgreSQL (Supabase)  
- **Authentication:** Password-based, bcrypt for secure storage  
- **Deployment:** HTTPS-enabled for encrypted transit  

---

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/monesize/bbayo-Backend.git
cd bbayo-Backend
````

2. Install dependencies

```bash
npm install
```

3. Set up environment variables (see below)

4. Run database migrations

```bash
npx prisma migrate dev
```

5. Start the server

```bash
npm run dev
```

---

## Environment Variables

Create a `.env` file at the root with the following variables:

```env
DATABASE_URL=postgresql://user:password@host:port/dbname
PORT=5000
JWT_SECRET=your_jwt_secret
```

---

## Database Setup

* Prisma is used for ORM and migrations
* Run migrations:

```bash
npx prisma migrate dev --name init
```

* Optional: Generate Prisma client

```bash
npx prisma generate
```

* Database schema supports:

  * Users and roles
  * Branches
  * Customers
  * Inventory items and inventory movements
  * Sales, sale items, and return transactions
  * Payments and customer balances
  * Expenses
  * Audit logs

---

## API Endpoints

All endpoints are **authenticated**. Branch isolation is enforced. RBAC ensures users only perform allowed actions.

**Modules include:**

* Auth and user management
* Branch management
* Customer management
* Inventory management
* Sales and return management
* Payments and debtor book
* Expenses
* Audit logs
* Reports

---

## Roles and Permissions

| Role           | Scope             | Permissions                                                   |
| -------------- | ----------------- | ------------------------------------------------------------- |
| GENERAL_ADMIN  | All branches      | Full access, can add/remove users across branches, full CRUD  |
| BRANCH_ADMIN   | Assigned branches | Full access within their branch, can add/remove branch users  |
| BRANCH_MEMBER  | Assigned branches | Create records only, cannot update or delete existing records |
| GENERAL_VIEWER | All branches      | Read-only access for reporting and audit purposes             |

---

## Audit Logs

* Automatically generated for every successful DB transaction
* Immutable and read-only
* Human-readable actions including user first and last name, action performed, and reference record
* Timestamps included
* Can be filtered by user, module, or date

---

## Reports

* Inventory summary and low stock alerts
* Sales reports (daily, monthly, custom)
* Debtor book and customer balances
* Expenses and financial summaries
* Branch-level overview for multi-branch enterprises

---

## Security

* Passwords are hashed with bcrypt
* Sensitive customer data encrypted at rest (AES)
* HTTPS ensures secure data in transit
* Audit logs provide traceability for all actions

---

## License

This project is proprietary. Contact BBayo Ventures' team for licensing and enterprise usage.

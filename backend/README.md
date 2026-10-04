# VyaparSetu Backend

VyaparSetu is a simple bookkeeping API for kirana (small grocery) store owners. It helps a merchant record **sales**, **expenses**, **customer udhaar (credit)**, **supplier purchases/payments**, and **loan repayments**, then see a dashboard of cash, receivables, and payables.

This backend is **API-only** (no website UI). You talk to it with Postman, curl, or a frontend later.

> This is a simple bookkeeping summary for an MVP and not an official accounting statement.

---

## What it does

- Stores one merchant (`User`) and that merchant’s **transactions**, **customers**, and **suppliers** in MongoDB.
- Creates a sale, expense, or other transaction with `POST /api/transactions`.
- When you give **udhaar** to a customer, it creates/updates that customer and increases `currentDue`.
- When you record a **supplier credit purchase**, it creates/updates that supplier and increases `currentPayable`.
- When you **pay a supplier**, it decreases `currentPayable` (the supplier must already exist).
- Returns a **dashboard summary** (today’s sales/expenses, totals, receivables, payables, last 5 transactions).
- Lists customers sorted by who owes the most, and suppliers sorted by who you owe the most.

There is **no login**, **no payments gateway**, and **no AI/voice** in this backend. Every request that needs a merchant uses `userId` (the merchant’s MongoDB `_id`).

---

## Required technologies

| Tool | Why we use it |
|---|---|
| **Node.js** | Runs the JavaScript server |
| **Express.js** | HTTP API (routes, JSON, status codes) |
| **MongoDB Atlas** | Cloud database |
| **Mongoose** | Models and queries for MongoDB |
| **dotenv** | Loads secrets from `.env` (not committed to git) |
| **cors** | Lets a browser frontend call this API |
| **nodemon** | Restarts the server when you save a file (`npm run dev`) |

---

## Folder structure

```
backend/
├── config/
│   └── db.js                 # MongoDB Atlas connection
├── controllers/
│   ├── transactionController.js
│   ├── dashboardController.js
│   ├── customerController.js
│   └── supplierController.js
├── middleware/
│   └── errorMiddleware.js    # 404 + error JSON
├── models/
│   ├── User.js               # Merchant
│   ├── Transaction.js
│   ├── Customer.js
│   └── Supplier.js
├── routes/
│   ├── transactionRoutes.js
│   ├── dashboardRoutes.js
│   ├── customerRoutes.js
│   └── supplierRoutes.js
├── .env.example              # Copy this to .env
├── .gitignore
├── package.json
├── seed.js                   # Optional sample data (use carefully)
├── server.js                 # App entry: middleware + routes
└── README.md                 # This file
```

---

## Installation

1. Install **Node.js** (LTS) from https://nodejs.org
2. Open a terminal in the `backend` folder:

```bash
cd backend
```

3. Install packages:

```bash
npm install
```

---

## Environment variables

1. Copy the example file:

```bash
copy .env.example .env
```

On macOS/Linux use `cp .env.example .env`.

2. Open `.env` and set:

```
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/book-keeping?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
```

| Variable | Meaning |
|---|---|
| `MONGODB_URI` | Full MongoDB Atlas connection string (replace `YOUR_PASSWORD`; URL-encode special characters) |
| `PORT` | Server port (default **5000**) |
| `NODE_ENV` | Usually `development` |

Never commit `.env`. It is already in `.gitignore`.

3. In Atlas: create a database user, and allow your IP (or `0.0.0.0/0` for a hackathon demo).

---

## Run the server

Development (auto-restart with nodemon):

```bash
npm run dev
```

You should see something like:

```
[MongoDB] Connected to database: ...
Server running in development mode on port 5000
```

Production-style start (no auto-restart):

```bash
npm start
```

Health check in a browser: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## Before you test

Most routes need a **real merchant `userId`**. That is the `_id` of a document in the `users` collection.

1. Create a merchant in MongoDB Atlas (or Compass), for example:

```json
{
  "name": "Ramesh Kumar",
  "phone": "9876543210",
  "shopName": "Ramesh Kirana Store",
  "address": "Main Market, Pune"
}
```

2. Copy the `_id` and replace **every** `REPLACE_WITH_REAL_USER_ID` below.

**Supplier payment (test 4):** `supplier_payment` does **not** create a supplier. `Kumar Traders` must already exist for that merchant, with `currentPayable` **at least 1200**. Create a credit purchase first:

`POST http://localhost:5000/api/transactions`

```json
{
  "userId": "REPLACE_WITH_REAL_USER_ID",
  "type": "supplier_purchase_credit",
  "amount": 5000,
  "partyName": "Kumar Traders",
  "partyType": "supplier",
  "paymentMode": "credit",
  "category": "stock_purchase",
  "description": "Stock bought on credit from Kumar Traders",
  "inputMethod": "manual",
  "status": "confirmed"
}
```

---

## All API endpoints

Base URL: `http://localhost:5000`

### Health

| Method | URL | Description |
|---|---|---|
| GET | `/api/health` | Is the server running? |

### Transactions (CRUD)

| Method | URL | Description |
|---|---|---|
| POST | `/api/transactions` | Create a transaction |
| GET | `/api/transactions?userId=` | List that merchant’s transactions (optional `type`, `startDate`, `endDate`, `page`, `limit`) |
| GET | `/api/transactions/:id` | Get one transaction |
| PUT | `/api/transactions/:id` | Update amount / category / description / paymentMode / date / status |
| DELETE | `/api/transactions/:id` | Delete a transaction (MVP; does not reverse dues) |

**Create `type` values:** `sale`, `expense`, `customer_credit_given`, `customer_payment_received`, `supplier_purchase_credit`, `supplier_payment`, `loan_repayment`.

### Dashboard

| Method | URL | Description |
|---|---|---|
| GET | `/api/dashboard/summary?userId=` | Bookkeeping summary for one merchant |

### Customers (read only)

| Method | URL | Description |
|---|---|---|
| GET | `/api/customers?userId=` | Customers for that merchant, `currentDue` high → low, plus `totalReceivables` |
| GET | `/api/customers/:id` | One customer |

### Suppliers (read only)

| Method | URL | Description |
|---|---|---|
| GET | `/api/suppliers?userId=` | Suppliers for that merchant, `currentPayable` high → low, plus `totalPayables` |
| GET | `/api/suppliers/:id` | One supplier |

Common error shape:

```json
{
  "success": false,
  "message": "userId is required"
}
```

---

## Postman test examples

In Postman: set method + URL, for POST use **Body → raw → JSON**.

Replace `REPLACE_WITH_REAL_USER_ID` with your merchant `_id`.

IDs, dates, and exact money totals in responses will differ on your machine. The **shape** (`success`, `data`, field names) should match.

---

### 1. Health check

**GET** `http://localhost:5000/api/health`

**Expected (200):**

```json
{
  "success": true,
  "message": "VyaparSetu backend is running"
}
```

---

### 2. Create sale

**POST** `http://localhost:5000/api/transactions`

```json
{
  "userId": "REPLACE_WITH_REAL_USER_ID",
  "type": "sale",
  "amount": 4500,
  "paymentMode": "cash",
  "category": "grocery_sales",
  "description": "Daily kirana sales",
  "inputMethod": "manual",
  "status": "confirmed"
}
```

**Expected (201):**

```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "transaction": {
      "_id": "64f0c0a1b2c3d4e5f6789012",
      "userId": "REPLACE_WITH_REAL_USER_ID",
      "type": "sale",
      "amount": 4500,
      "partyName": "",
      "partyType": "other",
      "paymentMode": "cash",
      "category": "grocery_sales",
      "description": "Daily kirana sales",
      "transactionDate": "2026-04-10T16:30:00.000Z",
      "inputMethod": "manual",
      "rawInputText": "",
      "aiProcessed": false,
      "status": "confirmed",
      "customerId": null,
      "supplierId": null,
      "createdAt": "2026-04-10T16:30:00.000Z",
      "updatedAt": "2026-04-10T16:30:00.000Z",
      "__v": 0
    }
  }
}
```

---

### 3. Create customer udhaar

**POST** `http://localhost:5000/api/transactions`

```json
{
  "userId": "REPLACE_WITH_REAL_USER_ID",
  "type": "customer_credit_given",
  "amount": 700,
  "partyName": "Ramesh",
  "partyType": "customer",
  "paymentMode": "credit",
  "category": "grocery_sales",
  "description": "Ramesh took groceries on udhaar",
  "inputMethod": "manual",
  "status": "confirmed"
}
```

This creates customer **Ramesh** if needed and adds **700** to `currentDue`.

**Expected (201):**

```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "transaction": {
      "_id": "64f0c0a1b2c3d4e5f6789013",
      "userId": "REPLACE_WITH_REAL_USER_ID",
      "type": "customer_credit_given",
      "amount": 700,
      "partyName": "Ramesh",
      "partyType": "customer",
      "paymentMode": "credit",
      "category": "grocery_sales",
      "description": "Ramesh took groceries on udhaar",
      "transactionDate": "2026-04-10T16:31:00.000Z",
      "inputMethod": "manual",
      "rawInputText": "",
      "aiProcessed": false,
      "status": "confirmed",
      "customerId": "64f0c0a1b2c3d4e5f678aaaa",
      "supplierId": null,
      "createdAt": "2026-04-10T16:31:00.000Z",
      "updatedAt": "2026-04-10T16:31:00.000Z",
      "__v": 0
    }
  }
}
```

---

### 4. Create supplier payment

**POST** `http://localhost:5000/api/transactions`

```json
{
  "userId": "REPLACE_WITH_REAL_USER_ID",
  "type": "supplier_payment",
  "amount": 1200,
  "partyName": "Kumar Traders",
  "partyType": "supplier",
  "paymentMode": "cash",
  "category": "supplier_payment",
  "description": "Paid Kumar Traders for stock purchase",
  "inputMethod": "manual",
  "status": "confirmed"
}
```

**Expected (201)** after the supplier exists with enough payable:

```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "transaction": {
      "_id": "64f0c0a1b2c3d4e5f6789014",
      "userId": "REPLACE_WITH_REAL_USER_ID",
      "type": "supplier_payment",
      "amount": 1200,
      "partyName": "Kumar Traders",
      "partyType": "supplier",
      "paymentMode": "cash",
      "category": "supplier_payment",
      "description": "Paid Kumar Traders for stock purchase",
      "transactionDate": "2026-04-10T16:32:00.000Z",
      "inputMethod": "manual",
      "rawInputText": "",
      "aiProcessed": false,
      "status": "confirmed",
      "customerId": null,
      "supplierId": "64f0c0a1b2c3d4e5f678bbbb",
      "createdAt": "2026-04-10T16:32:00.000Z",
      "updatedAt": "2026-04-10T16:32:00.000Z",
      "__v": 0
    }
  }
}
```

If the supplier is missing you get **404** `"Supplier 'Kumar Traders' not found"`. If 1200 is more than `currentPayable` you get **400**.

---

### 5. Dashboard summary

**GET** `http://localhost:5000/api/dashboard/summary?userId=REPLACE_WITH_REAL_USER_ID`

**Expected (200):**

```json
{
  "success": true,
  "data": {
    "todaySales": 4500,
    "todayExpenses": 0,
    "totalSales": 4500,
    "totalExpenses": 0,
    "totalReceivables": 700,
    "totalPayables": 3800,
    "netCashPosition": 4500,
    "recentTransactions": []
  }
}
```

`recentTransactions` is an array of up to **5** latest transactions (same fields as a transaction document). Numbers above assume you just ran tests 2–4 after a **5000** credit purchase to Kumar Traders (5000 − 1200 = **3800** payable). On empty data, all numbers can be `0` and `recentTransactions` can be `[]`.

---

### 6. Get customers

**GET** `http://localhost:5000/api/customers?userId=REPLACE_WITH_REAL_USER_ID`

**Expected (200):**

```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "_id": "64f0c0a1b2c3d4e5f678aaaa",
        "userId": "REPLACE_WITH_REAL_USER_ID",
        "partyName": "Ramesh",
        "name": "Ramesh",
        "phone": "",
        "address": "",
        "currentDue": 700,
        "balance": 0,
        "lastTransactionDate": "2026-04-10T16:31:00.000Z",
        "createdAt": "2026-04-10T16:31:00.000Z",
        "updatedAt": "2026-04-10T16:31:00.000Z",
        "__v": 0
      }
    ],
    "totalReceivables": 700
  }
}
```

---

### 7. Get suppliers

**GET** `http://localhost:5000/api/suppliers?userId=REPLACE_WITH_REAL_USER_ID`

**Expected (200):**

```json
{
  "success": true,
  "data": {
    "suppliers": [
      {
        "_id": "64f0c0a1b2c3d4e5f678bbbb",
        "userId": "REPLACE_WITH_REAL_USER_ID",
        "partyName": "Kumar Traders",
        "name": "Kumar Traders",
        "phone": "",
        "companyName": "Kumar Traders",
        "currentPayable": 3800,
        "balance": 0,
        "lastPaymentDate": "2026-04-10T16:32:00.000Z",
        "lastTransactionDate": "2026-04-10T16:31:00.000Z",
        "createdAt": "2026-04-10T16:30:00.000Z",
        "updatedAt": "2026-04-10T16:32:00.000Z",
        "__v": 0
      }
    ],
    "totalPayables": 3800
  }
}
```

---

## Extra Postman examples (CRUD)

**List transactions**

`GET http://localhost:5000/api/transactions?userId=REPLACE_WITH_REAL_USER_ID`

```json
{
  "success": true,
  "data": {
    "transactions": [],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalTransactions": 0,
      "limit": 20
    }
  }
}
```

**Get / update / delete one transaction** (replace `:id`)

- `GET http://localhost:5000/api/transactions/:id` → `{ "success": true, "data": { "transaction": {} } }`
- `PUT http://localhost:5000/api/transactions/:id` with `{ "description": "Updated note" }` → `{ "success": true, "message": "Transaction updated successfully", "data": { "transaction": {} } }`
- `DELETE http://localhost:5000/api/transactions/:id` → `{ "success": true, "message": "Transaction deleted successfully" }`

**One customer / one supplier**

- `GET http://localhost:5000/api/customers/:id` → `{ "success": true, "data": { "customer": {} } }`
- `GET http://localhost:5000/api/suppliers/:id` → `{ "success": true, "data": { "supplier": {} } }`

---

## Suggested Postman order

1. Health  
2. Create sale  
3. Create customer udhaar  
4. Create supplier payment (after a credit purchase to **Kumar Traders**)  
5. Dashboard summary  
6. Get customers  
7. Get suppliers  

If health works but other calls return **500**, check `MONGODB_URI` (real password, not `<db_password>`) and restart `npm run dev`.

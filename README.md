# ShopSmart Pro — Inventory & Billing Management System

> Built for the 63 million small businesses in India that still run on notebooks and Excel sheets.

ShopSmart Pro is a production-ready, full-stack web application that helps small shop owners digitize their entire business operations — from stock management and POS billing to GST invoicing and sales analytics.

**Live Demo:** [shopsmart-pro-six.vercel.app](https://shopsmart-pro-six.vercel.app)  
**Backend API:** [shopsmart-pro-api.onrender.com](https://shopsmart-pro-api.onrender.com/api/health)

> Note: The backend runs on a free tier and may take 30-50 seconds to wake up on the first request. Subsequent requests are fast.

---

## The Problem This Solves

Walk into any kirana store, medical shop, or small retail outlet in India, chances are they track inventory in a register, calculate bills manually, and have no idea which products are running low until they run out. ShopSmart Pro gives these businesses a complete digital solution without any subscription cost or technical complexity.

---

## ✦ Features

**Authentication**
- JWT-based secure login and registration
- Password encryption with bcrypt
- Role-based access — Owner and Staff
- Protected API routes and frontend navigation

**Product Management**
- Full product CRUD with categories
- Selling price, cost price, and shipping cost tracking
- Live profit and margin calculation
- Low stock threshold alerts per product
- Table view and grid view with search and category filter

**Stock Manager**
- Stock In and Stock Out with quantity validation
- Real-time stock preview before confirming update
- Complete movement logs with timestamps and reasons
- Low stock banner with one-click restock shortcut

**Billing and POS**
- Product search with live dropdown from inventory
- Walk-in and regular customer modes
- Editable price per line item at billing time
- GST presets (0%, 5%, 12%, 18%, 28%) plus custom percentage input
- Discount field and multiple payment methods
- Stock auto-deducted on bill creation

**Invoice System**
- Professional PDF invoice with shop branding and GST breakdown
- Paginated invoice list with search and date range filter
- Single delete and bulk delete with confirmation dialog
- One-click PDF download per invoice

**Customer Management**
- Customer profiles with purchase history
- Pin important customers to the top of the list
- Search by name or phone number

**Reports and Analytics**
- Revenue trend with daily and monthly grouping
- Top selling products ranked by units sold
- Sales breakdown table with GST, discount, and average bill value
- CSV export for any report
- Quick filters — Today, Last 7 Days, This Month, All Time

**Dashboard**
- Live KPI cards — today's revenue, monthly revenue, total products, customer count
- 7-day revenue area chart
- Top products with progress bar visualization
- Low stock alert with direct restock links
- Recent bills and quick action shortcuts

---

## ✦ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router DOM 7 |
| Styling | Pure CSS — no UI library, custom animations |
| Charts | Recharts |
| Backend | Node.js 20, Express.js |
| Database | SQLite via better-sqlite3 |
| Authentication | JSON Web Tokens, bcryptjs |
| PDF Generation | PDFKit |
| HTTP Client | Axios |
| Deployment | Vercel (frontend), Render (backend) |

No external database server required. SQLite runs as a single file — zero infrastructure cost, zero configuration.

---

## ✦ Project Structure

```
ShopSmart-Pro/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── api/                # Axios API layer
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # Auth, Toast context providers
│   │   ├── hooks/              # Custom hooks
│   │   ├── pages/              # Route-level page components
│   │   ├── styles/             # Global and component CSS
│   │   └── utils/              # Currency, date formatters, constants
│   └── vercel.json             # SPA routing config for Vercel
│
└── server/                     # Node.js + Express backend
    ├── controllers/            # Route handler logic
    ├── middleware/             # JWT auth, role guard
    ├── routes/                 # API route definitions
    ├── utils/                  # PDF generator, CSV exporter
    ├── database.js             # SQLite schema and initialization
    └── index.js                # Express app entry point
```

---

## ✦ Running Locally

**Requirements:** Node.js 20+, Git

```bash
# Clone the repository
git clone https://github.com/RohitKr-codes/ShopSmart-Pro.git
cd ShopSmart-Pro

# Backend setup
cd server
npm install

# Create server/.env file
PORT=5000
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development

npm run dev

# Frontend setup — open a new terminal
cd client
npm install
npm run dev
```

Open `http://localhost:5173`

---

## ✦ API Reference

| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register | Register new account |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/products | List products |
| POST | /api/products | Create product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |
| GET | /api/inventory/low-stock | Low stock items |
| POST | /api/inventory/update-stock | Update stock |
| GET | /api/inventory/logs | Stock movement logs |
| POST | /api/billing | Create bill |
| GET | /api/billing | List bills |
| GET | /api/billing/:id/pdf | Download PDF |
| DELETE | /api/billing/:id | Delete bill |
| GET | /api/customers | List customers |
| POST | /api/customers | Add customer |
| GET | /api/dashboard | Dashboard stats |
| GET | /api/reports/sales | Sales report |
| GET | /api/reports/products | Product report |
| GET | /api/reports/export | Export CSV |

---

## ✦ What I Would Build Next

- Multi-tenant architecture — separate data per registered business
- Barcode scanner support for faster billing
- WhatsApp PDF sharing integration
- Supplier and purchase order management
- Mobile-first PWA version

---

## Author

**Rohit Kumar Rai**

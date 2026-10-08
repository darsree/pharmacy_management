# 💊 MediCore — Smart Pharmacy Management System

> A modern, AI-powered pharmacy management platform for medicine inventory, supplier management, purchasing, and pharmacy discovery.

## 🌟 Overview

**MediCore** is a full-stack pharmacy management system that brings pharmacy operations, medicine inventory, supplier management, AI assistance, and intelligent recommendations into one platform.

### 🎯 Core Goals

- 📦 Medicine & inventory management
- 🚚 Intelligent supplier selection
- 🏥 Pharmacy discovery for customers
- 🤖 AI-powered assistance
- 📊 Centralized pharmacy operations
- 🔐 Secure authentication and data management

---

## ✨ Key Features

### 📦 Medicine & Inventory Management

- Add, update, and manage medicines
- Track stock levels and expiry dates
- Manage medicine categories
- Identify low-stock medicines
- Maintain centralized inventory records

### 🚚 Smart Supplier Recommendation

MediCore recommends the best supplier for a selected medicine using:

```text
Supplier Evaluation
       │
       ├── 💰 Purchase Price
       ├── 🚚 Delivery Performance
       ├── ⭐ Supplier Rating
       ├── 📦 Product Availability
       └── ⏱️ Lead Time
              │
              ▼
      Weighted Scoring
              │
              ▼
        🏆 Best Supplier
```

### 🏥 Smart Pharmacy Finder

Customers can search for a medicine and discover pharmacies that match their requirements.

Ranking considers:

- 💊 Medicine price
- ⭐ Pharmacy rating
- 📦 Stock availability
- 📍 Distance
- 🚚 Delivery availability

```text
Search Medicine
      ↓
Find Matching Pharmacies
      ↓
Evaluate Price / Rating / Stock / Distance
      ↓
🏆 Ranked Pharmacies
```

### 🤖 AI Assistance

AI services assist pharmacy operations and provide intelligent responses through the application backend.

### 🔐 User Management

| Role | Purpose |
|------|---------|
| 👨‍⚕️ Pharmacist | Manage medicines, suppliers and pharmacy operations |
| 🏥 Pharmacy | Manage pharmacy inventory and availability |
| 👤 Customer | Search medicines and find pharmacies |
| 👑 Admin | Manage and monitor the platform |

---

## 🏗️ System Architecture

```text
                         ┌─────────────────────┐
                         │      MediCore       │
                         │   Pharmacy System   │
                         └──────────┬──────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
        ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
        │   Customer   │    │  Pharmacist  │    │    Admin     │
        │   Interface  │    │   Interface  │    │   Interface  │
        └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
               │                   │                   │
               └───────────────────┼───────────────────┘
                                   ▼
                         ┌──────────────────┐
                         │   React / Vite   │
                         │    Frontend      │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   Node.js Server │
                         └────────┬─────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                ▼                 ▼                 ▼
        ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
        │  Supabase   │   │  AI Service │   │Recommendation│
        │  PostgreSQL │   │    Groq     │   │    Engine    │
        └─────────────┘   └─────────────┘   └─────────────┘
```

---

## 🧠 Recommendation Engine

### Supplier Score

```text
30% Purchase Price
25% Delivery Performance
20% Supplier Rating
15% Availability
10% Lead Time
```

### Pharmacy Score

```text
30% Medicine Price
25% Pharmacy Rating
20% Stock Availability
15% Distance
10% Delivery Availability
```

The highest-ranked options are displayed first.

---

## 🛠️ Technology Stack

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS

**Backend**
- Node.js
- REST APIs

**Database & Services**
- Supabase
- PostgreSQL
- Supabase Authentication

**AI**
- Groq AI

**Tools**
- Git
- GitHub
- npm
- VS Code

---

## 📁 Project Structure

```text
medicore/
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   └── recommendations/
│   ├── context/
│   │   └── PharmacyContext.tsx
│   ├── data/
│   │   └── recommendationMockData.ts
│   ├── pages/
│   │   ├── SuppliersPage.tsx
│   │   ├── PharmacyFinderPage.tsx
│   │   └── ...
│   ├── services/
│   │   ├── aiService.ts
│   │   ├── storageService.ts
│   │   └── recommendationService.ts
│   ├── types/
│   │   └── index.ts
│   └── App.tsx
│
├── server.ts
├── supabase/
│   ├── schema.sql
│   └── recommendation_migration.sql
├── package.json
├── .env
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/darsree/pharmacy_management.git
cd pharmacy_management
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

> ⚠️ Never commit your actual `.env` file or API keys.

### 4. Setup Database

Run the required SQL files in Supabase:

```text
supabase/schema.sql
supabase/recommendation_migration.sql
```

### 5. Start the Application

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🔄 Application Flow

### 👨‍⚕️ Pharmacist / Admin

```text
Login
  ↓
Dashboard
  ↓
Manage Medicines
  ↓
Select Medicine
  ↓
Supplier Recommendation
  ↓
Compare Suppliers
  ↓
Select Best Supplier
  ↓
Create Purchase Order
```

### 👤 Customer

```text
Login
  ↓
Find Pharmacy
  ↓
Search Medicine
  ↓
Enable Location
  ↓
Find Available Pharmacies
  ↓
Compare Price / Stock / Distance
  ↓
Choose Pharmacy
```

---

## 📊 Recommendation Factors

| Factor | Supplier | Pharmacy |
|--------|:--------:|:--------:|
| 💰 Price | ✅ | ✅ |
| ⭐ Rating | ✅ | ✅ |
| 📦 Stock / Availability | ✅ | ✅ |
| 🚚 Delivery | ✅ | ✅ |
| 📍 Distance | — | ✅ |
| ⏱️ Lead Time | ✅ | — |

---

## 🔒 Security

- Environment-based secret management
- Supabase authentication
- Database-level access policies
- Role-based application access
- Separation of frontend and backend responsibilities
- Secure API communication

---

## 💡 Why MediCore?

Traditional pharmacy systems often require users to manually compare suppliers or search multiple pharmacies.

MediCore introduces **intelligent recommendations** directly into the workflow.

```text
Medicine
   ↓
Analyze Available Options
   ↓
Intelligent Ranking
   ↓
🏆 Best Option
```

This reduces decision-making time and improves the pharmacy experience.

---

## 🔮 Future Enhancements

- 📍 Real-time pharmacy location tracking
- 📦 Real-time inventory synchronization
- 💳 Online medicine ordering
- 🚚 Delivery tracking
- 📈 Advanced pharmacy analytics
- 🤖 AI-based demand forecasting
- 💰 Dynamic supplier price comparison
- 🔔 Low-stock and expiry notifications
- 📱 Mobile application
- 🧾 Digital prescription processing

---

## 📌 Project Status

🚧 **Active Development**

MediCore is continuously being enhanced with intelligent pharmacy management and recommendation capabilities.

---

## 📄 License

This project is developed for educational and project purposes.

---

<div align="center">

### 💊 MediCore

**Smarter Pharmacy Management. Better Decisions.**

</div>

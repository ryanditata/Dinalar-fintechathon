# 📈 Dinalar - AI Stock Portfolio Optimization Platform (Fintechathon)

<img width="3064" height="1760" alt="Macbook-Air-dinalar my id" src="https://github.com/user-attachments/assets/1a9691e0-9fe1-409a-9bc1-a622781d978f" /> <img width="960" height="1954" alt="iPhone-14-PRO-MAX-dinalar my id" src="https://github.com/user-attachments/assets/2a504d60-b857-4759-8b6b-2121408137fd" />

🌐 **Live Platform:** [https://dinalar.my.id](https://dinalar.my.id)  
📱 **Android App (APK):** [Download dinalar.apk](./dinalar.apk)

> **Dinalar** (Digital Investment Analysis for Literacy and Rationality) is a modern stock portfolio analysis and optimization platform powered by **Modern Portfolio Theory (MPT / Markowitz Mean-Variance Optimization)**. Engineered for both Indonesian capital market investors (**IDX**) and global exchange investors (**NASDAQ / NYSE**), the platform provides interactive simulations, quantitative risk metrics, real-world discrete lot sizing, automated PDF report generation, and an adaptive interface for both Desktop Web and Mobile Android (via Capacitor).

---

## 🌟 Key Features

### 1. 🧮 Portfolio Optimization Engine (Modern Portfolio Theory)

- **Mean-Variance Optimization (Markowitz)**: Identifies the most efficient asset allocation to maximize expected return for a targeted level of risk.
- **Two Recommended Portfolio Profiles**:
    - **Max Sharpe Ratio (Tangency Portfolio)**: Optimal asset weight allocation maximizing excess return per unit of volatility above the _risk-free rate_.
    - **Minimum Volatility Portfolio**: Defensive allocation engineered to achieve the lowest possible portfolio variance and risk.
- **Efficient Frontier & Monte Carlo Simulation**: Interactive visualization of the optimal boundary mapping thousands of simulated portfolio weight combinations alongside individual assets.
- **Comprehensive Quantitative Risk Metrics**:
    - _Expected Annual Return_ & _Annualized Volatility_
    - _Sharpe Ratio_, _Sortino Ratio_, & _Omega Ratio_
    - _Value at Risk (VaR 95%)_ & _Conditional VaR (CVaR / Expected Shortfall 95%)_
    - _Maximum Drawdown_ & Inter-asset Correlation/Covariance Matrices.
- **Discrete Lot Allocation Engine**:
    - Converts theoretical continuous percentage weights into actionable round lots (100 shares per lot for the Indonesia Stock Exchange / IDX, 1 share per unit for US exchanges NASDAQ/NYSE).
    - Automatically calculates cash leftover and net deployed capital.

### 2. 🌍 Multi-Exchange & Multi-Currency Support

- Supports both Indonesia Stock Exchange (**IDX**) equities and global US equities (**NASDAQ / NYSE**).
- Automated currency formatting and number localization (**IDR / Rp** for IDX and **USD / $** for US exchanges).
- Flexible analysis timeframe horizons: **1D, 5D, 1M, 3M, 6M, 1Y, 3Y, 5Y**, and **All** (complete available historical data).
- Configurable Risk-Free Rate (_$R_f$_) benchmarked against Indonesian Sovereign Bonds (SBN), Bank Indonesia BI-Rate, or US Treasury Yields.

### 3. 📱 Dual-View Adaptive UI (Desktop Web & Mobile Hybrid / Android)

- **Automatic Device View Resolver**: Context-aware runtime resolver that dynamically serves dedicated mobile views (_app-like bottom navigation, swipeable sheets_) or comprehensive desktop dashboards (_multi-column tables, multi-metric modals_).
- **Capacitor Mobile Ready**: Fully pre-configured with Capacitor (`@capacitor/android`) for direct compilation into a native Android APK.
- **Bilingual Support (Multi-Language)**: Native support for both Indonesian (ID) and English (EN) with a real-time language switcher.
- **Modern Dark & Light Mode**: Premium fintech-grade aesthetic supporting Dark Mode, Light Mode, and system preferences.

### 4. 📊 Automated Stock Pipeline & Data Ingestion

- **Yahoo Finance Integration**: Automated daily closing price data fetching (_Open, High, Low, Close, Volume_).
- **Artisan CLI Pipeline**: Scheduled console command (`php artisan stocks:fetch-daily`) with rate-limiting for automated price synchronization.
- **Scraper & Excel Export**: Administrative tools to scrape historical ticker data and export datasets directly to Microsoft Excel (`.xlsx`).
- **Bulk Stock Import**: Easy catalog expansion through Excel/CSV bulk import.

### 5. 🔗 Collaboration & Reporting

- **Public Shareable Portfolio Link**: Generates a secure, cryptographically random tokenized URL (`/shared/portfolio/{token}`) to share optimization results with clients or peers without requiring authentication.
- **Official PDF Report Generator**: Generates comprehensive multi-page investment advisory reports in a single click (_Executive Summary, Weight Allocation, Risk Analysis, Discrete Lot Purchase Table, Regulatory Disclaimers_).
- **Persistent Optimization History**: Saves historical analyses to the user's account for longitudinal portfolio tracking and performance evaluation.

### 6. 🛡️ Admin Management & Back-Office

- **Admin Dashboard**: Real-time platform telemetry, active user tracking, total active tickers, and daily optimization frequency.
- **Stock Management**: Centralized equity master data management, ticker activation toggles, and historical price audits.
- **User Management**: Role-based access control (RBAC) and user account administration (_Admin / Regular User_).
- **Optimization Audit Logs**: Comprehensive historical log monitoring across all platform users with one-click Excel export.

---

## 🏗️ Architecture & Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Dinalar Architecture                     │
├──────────────────────────────┬──────────────────────────────┤
│        Frontend (SPA)        │        Backend & API         │
│  • React 19 + TypeScript     │  • Laravel 12 (PHP 8.2+)     │
│  • Inertia.js v2             │  • Inertia Monolith Bridge   │
│  • Tailwind CSS v4           │  • MySQL / SQLite            │
│  • Radix UI / shadcn/ui      │  • Socialite (Google OAuth)  │
│  • Recharts & Lucide Icons   │  • PhpSpreadsheet            │
│  • Capacitor Android Native  │  • Device View Resolver      │
└──────────────┬───────────────┴──────────────┬───────────────┘
               │                              │
               └──────────────┬───────────────┘
                              ▼
        ┌───────────────────────────────────────────┐
        │       Python Optimization Engine          │
        │  • Flask WSGI Microservice / CLI Script   │
        │  • NumPy, SciPy (SLSQP), Pandas           │
        │  • Modern Portfolio Theory (MPT)          │
        │  • Monte Carlo & Efficient Frontier       │
        └───────────────────────────────────────────┘
```

### Detailed Stack

- **Backend**: [Laravel 12](https://laravel.com), PHP 8.2+, [Inertia.js v2](https://inertiajs.com)
- **Frontend**: [React 19](https://react.dev), [TypeScript](https://www.typescriptlang.org), [Tailwind CSS v4](https://tailwindcss.com)
- **UI Components & Charts**: [Radix UI](https://www.radix-ui.com), [Lucide React](https://lucide.dev), [Recharts](https://recharts.org), [Framer Motion](https://www.framer.com/motion/)
- **Mobile Container**: [Capacitor 7/8](https://capacitorjs.com) (Android SDK)
- **Quantitative Engine**: Python 3 (Flask, SciPy, NumPy, Pandas, Gunicorn)
- **Export & Utility Tools**: [jsPDF](https://github.com/parallax/jsPDF), [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable), [PhpSpreadsheet](https://phpspreadsheet.readthedocs.io/)

---

## 📁 Directory Structure

```
Dinalar/
├── app/
│   ├── Console/Commands/       # Artisan commands (stocks:fetch-daily)
│   ├── Http/Controllers/
│   │   ├── Admin/              # Dashboard, Stocks, Scraper, Users, History
│   │   ├── Auth/               # Login, Register, Google OAuth 2.0
│   │   └── User/               # Portfolio, Stocks, UserDashboard
│   ├── Models/                 # Stock, StockPrice, UserBasket, PortfolioOptimization, User
│   └── Services/               # DeviceViewResolver (Desktop Web vs Native Mobile detection)
├── database/
│   ├── migrations/             # Database schema migrations
│   └── seeders/                # Database seeders (Admin & Seed data)
├── model/                      # Python Portfolio Optimizer Engine
│   ├── app.py                  # Flask microservice API endpoint (/optimize)
│   ├── optimize_portfolio.py   # MPT Markowitz, SLSQP optimizer, Monte Carlo, NSGA-II
│   └── requirements.txt        # Python package dependencies
├── resources/
│   ├── js/
│   │   ├── components/         # Shared UI components (Modals, Charts, Header, Sidebar)
│   │   ├── i18n/               # Language Context & Localization dictionaries (ID & EN)
│   │   ├── pages/
│   │   │   ├── admin/          # Admin back-office views
│   │   │   ├── auth/           # Login, Register, Password Reset pages
│   │   │   └── user/           # User client views
│   │   │       ├── analyze/    # Basket, Optimization Results, History pages
│   │   │       ├── dashboard/  # User Dashboard
│   │   │       ├── mobile/     # Dedicated Mobile / Capacitor App views
│   │   │       └── saham/      # Stock Catalog & Historical Analysis views
│   │   └── types/              # TypeScript interface definitions
│   └── css/                    # Tailwind CSS v4 stylesheets
├── routes/
│   ├── web.php                 # Core application, user, and admin routing
│   └── auth.php                # Authentication & Google Socialite routes
├── capacitor.config.ts         # Capacitor Android container configuration
└── vite.config.ts              # Vite asset bundling configuration
```

---

## 🚀 Installation & Getting Started

### 1. System Prerequisites

Ensure the following tools are installed on your machine:

- **PHP** >= 8.2 with extensions: `pdo`, `mbstring`, `openssl`, `curl`, `gd`, `zip`
- **Composer** (v2.x)
- **Node.js** >= 18.x and **NPM**
- **Python** >= 3.9 and **pip**
- **MySQL** or **SQLite**

---

### 2. Clone Repository & Install Dependencies

```bash
# 1. Clone the repository
git clone https://github.com/ryanditata/Dinalar-fintechathon.git
cd Dinalar-fintechathon

# 2. Install PHP backend dependencies (Composer)
composer install

# 3. Install JavaScript / React frontend dependencies (NPM)
npm install
```

---

### 3. Environment Configuration (`.env`)

Copy the example environment file and generate the application encryption key:

```bash
cp .env.example .env
php artisan key:generate
```

Configure your database connection and optimization engine parameters in `.env`:

```env
APP_NAME=Dinalar
APP_ENV=local
APP_URL=http://localhost:8000

# Database Configuration (Example for MySQL)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dinalar
DB_USERNAME=root
DB_PASSWORD=

# Alternatively, use SQLite for zero-configuration setup:
# DB_CONNECTION=sqlite

# Python Optimization Engine Endpoint (Select one)
# Option A: PythonAnywhere Cloud Microservice (Default, ready-to-use)
PYTHON_API_URL=https://ryanditata.pythonanywhere.com/optimize

# Option B: Local Flask microservice
# PYTHON_API_URL=http://127.0.0.1:10000/optimize
```

---

### 4. Database Migration & Seeding

Execute the schema migrations and seed the default administrator account:

```bash
php artisan migrate --seed
```

> **Default Administrator Credentials:**
>
> - **Email**: `admin@example.com`
> - **Password**: `password`

---

### 5. Running the Python Optimization Engine (Optional for Local Execution)

If you prefer to run the mathematical optimization engine locally:

```bash
# Navigate to the model directory
cd model

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask microservice server (port 10000)
python app.py
```

---

### 6. Initial Stock Data Synchronization

Populate historical price data for IDX and NASDAQ tickers from Yahoo Finance:

```bash
# Fetch daily closing prices for all active tickers
php artisan stocks:fetch-daily
```

---

### 7. Starting the Development Servers

Open two terminal windows to run the web server and the frontend asset compiler simultaneously:

```bash
# Terminal 1: Run the Laravel Development Web Server
php artisan serve

# Terminal 2: Run the Vite Development Server (Hot Module Replacement)
npm run dev
```

Open your browser and navigate to: **`http://localhost:8000`**

---

## 📱 Running the Mobile Application (Capacitor Android)

### 📥 Download Pre-Built Android APK

The compiled Android application can be downloaded directly from the repository:

- **Direct Download:** [`dinalar.apk`](./dinalar.apk)

---

### 🔨 Building from Source

This repository is fully configured for compilation into a native Android application:

```bash
# 1. Build the production frontend assets
npm run build

# 2. Synchronize web assets to the Android Capacitor container
npx cap sync android

# 3. Open the project in Android Studio to launch the emulator or build the APK
npx cap open android
```

---

## 🛠️ Helpful CLI Commands

| Command                                           | Description                                                            |
| :------------------------------------------------ | :--------------------------------------------------------------------- |
| `php artisan stocks:fetch-daily`                  | Fetches the latest daily closing prices for all active equities        |
| `php artisan stocks:fetch-daily --ticker=BBCA.JK` | Fetches historical price data for a specific ticker                    |
| `php artisan stocks:fetch-daily --bursa=IDX`      | Fetches historical prices filtered by exchange (IDX / NASDAQ)          |
| `npm run dev`                                     | Launches the Vite development server with Hot Module Replacement (HMR) |
| `npm run build`                                   | Compiles and bundles production frontend assets                        |
| `npm run types`                                   | Executes TypeScript type checking (`tsc --noEmit`)                     |
| `npm run format`                                  | Formats frontend code using Prettier with Tailwind CSS sorting plugin  |
| `npm run lint`                                    | Runs ESLint code style and quality audits                              |
| `npx cap sync android`                            | Synchronizes frontend build outputs to the native Android project      |

---

## 🔒 Roles & Access Control

| Role      | Permissions & Scope                                                                                                                                                   |
| :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Admin** | Unrestricted access to the administration back-office (`/admin`), user management, stock import, real-time Yahoo Finance scraper, and global optimization audit logs. |
| **User**  | Access to equity exploration, persistent portfolio basket, MPT Markowitz optimization engine, personal history, PDF report generation, and public share links.        |

---

## 📄 License

This project was developed as an innovation entry for the **Fintechathon** competition and is licensed under the [MIT License](LICENSE).

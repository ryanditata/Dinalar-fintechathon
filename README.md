# 📈 Dinalar - Smart Portfolio Optimizer (Fintechathon)

> **Dinalar** (Dinamika Alokasi Aset Cerdas) adalah platform analisis dan optimasi portofolio investasi saham modern berbasis **Modern Portfolio Theory (MPT / Markowitz Mean-Variance Optimization)**. Platform ini dirancang untuk investor pasar modal Indonesia (**IDX**) maupun bursa global (**NASDAQ / NYSE**), dilengkapi simulasi interaktif, kalkulasi metrik risiko kuantitatif, alokasi lot/lembar riil, export laporan PDF, serta antarmuka adaptif untuk Web Desktop dan Mobile Android (Capacitor).

---

## 🌟 Fitur Utama

### 1. 🧮 Portfolio Optimization Engine (Modern Portfolio Theory)
- **Mean-Variance Optimization (Markowitz)**: Menentukan alokasi aset paling efisien untuk memaksimalkan return pada tingkat risiko tertentu.
- **Dua Profil Portofolio Rekomendasi**:
  - **Max Sharpe Ratio (Tangency Portfolio)**: Alokasi bobot optimal yang memaksimalkan imbal hasil per unit risiko di atas *risk-free rate*.
  - **Minimum Volatility Portfolio**: Alokasi defensif dengan volatilitas/risiko terendah.
- **Efficient Frontier & Monte Carlo Simulation**: Visualisasi kurva batas efisien yang memetakan ribuan simulasi kombinasi bobot portofolio beserta aset individual.
- **Metrik Risiko Kuantitatif Lengkap**:
  - *Expected Annual Return* & *Annualized Volatility*
  - *Sharpe Ratio*, *Sortino Ratio*, & *Omega Ratio*
  - *Value at Risk (VaR 95%)* & *Conditional VaR (CVaR / Expected Shortfall 95%)*
  - *Maximum Drawdown* & Matriks Korelasi / Kovarians antar saham.
- **Kalkulasi Alokasi Lot Riil (Discrete Allocation)**:
  - Pembagian modal investasi ke dalam satuan lot saham (100 lembar untuk bursa IDX, 1 lembar untuk bursa NASDAQ/NYSE).
  - Perhitungan sisa dana (*cash leftover*) dan rekapitulasi modal riil terpakai.

### 2. 🌍 Multi-Exchange & Multi-Currency Support
- Mendukung emiten saham bursa efek Indonesia (**IDX**) dan bursa saham global (**NASDAQ / NYSE**).
- Format mata uang dan penomoran otomatis (**IDR / Rp** untuk IDX dan **$ USD** untuk non-IDX).
- Pilihan horison waktu analisis yang fleksibel: **1D, 5D, 1M, 3M, 6M, 1Y, 3Y, 5Y**, hingga **All** (seluruh data historis).
- Parameter suku bunga bebas risiko (*Risk-Free Rate*) yang dapat dikustomisasi (acuan SBN / BI-Rate / US Treasury Yield).

### 3. 📱 Dual View Adaptive UI (Desktop Web & Mobile Hybrid / Android)
- **Automatic Device View Resolver**: Sistem otomatis mendeteksi perangkat untuk menyajikan tampilan khusus mobile (*app-like bottom bar, swipeable sheets*) atau desktop (*comprehensive multi-column dashboard*).
- **Capacitor Mobile Ready**: Sudah terkonfigurasi dengan Capacitor (`@capacitor/android`) untuk deployment ke aplikasi native Android APK.
- **Bilingual (Multi-Bahasa)**: Dukungan penuh Bahasa Indonesia (ID) dan Bahasa Inggris (EN) dengan *real-time language switcher*.
- **Modern Dark & Light Mode**: Desain elegan bernuansa fintech dengan tema gelap, terang, atau mengikuti sistem operasi.

### 4. 📊 Data Scraper & Pipeline Saham Otomatis
- **Yahoo Finance Integration**: Pengambilan data harga saham harian otomatis (*open, high, low, close, volume*).
- **Artisan CLI Pipeline**: Perintah terjadwal (`php artisan stocks:fetch-daily`) untuk sinkronisasi harga emiten aktif secara berkala.
- **Scraper & Export Excel**: Kemudahan bagi admin untuk men-scrape data historis emiten dan mengunduhnya dalam format Microsoft Excel (`.xlsx`).
- **Bulk Stock Import**: Kemudahan impor daftar emiten saham melalui file Excel/CSV.

### 5. 🔗 Kolaborasi & Pelaporan
- **Public Shareable Portfolio Link**: Buat tautan publik berbasis token unik (`/shared/portfolio/{token}`) agar hasil optimasi dapat dibagikan kepada rekan atau klien tanpa memerlukan login.
- **Export Laporan PDF Resmi**: Pembuatan dokumen laporan analisis portofolio komprehensif dalam satu klik (*Executive Summary, Alokasi Bobot, Analisis Risiko, Tabel Pembelian Lot*).
- **Riwayat Optimasi Portofolio**: Riwayat optimasi tersimpan di akun pengguna untuk evaluasi performa portofolio dari waktu ke waktu.

### 6. 🛡️ Admin Management & Back-Office
- **Admin Dashboard**: Statistik platform, jumlah pengguna online, total emiten aktif, dan metrik optimasi harian.
- **Stock Management**: Manajemen master data saham, aktivasi/deaktivasi emiten, dan riwayat pergerakan harga.
- **User Management**: Manajemen akun dan hak akses pengguna (*Admin / Regular User*).
- **Optimization Log & Audit**: Pemantauan histori analisis seluruh pengguna dengan fitur ekspor rekap data ke Excel.

---

## 🏗️ Arsitektur & Teknologi

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

### Stack Detail
- **Backend**: [Laravel 12](https://laravel.com), PHP 8.2+, [Inertia.js v2](https://inertiajs.com)
- **Frontend**: [React 19](https://react.dev), [TypeScript](https://www.typescriptlang.org), [Tailwind CSS v4](https://tailwindcss.com)
- **UI Components & Charts**: [Radix UI](https://www.radix-ui.com), [Lucide React](https://lucide.dev), [Recharts](https://recharts.org), [Framer Motion](https://www.framer.com/motion/)
- **Mobile Container**: [Capacitor 7/8](https://capacitorjs.com) (Android SDK)
- **Data Engine**: Python 3 (Flask, SciPy, NumPy, Pandas, Gunicorn)
- **Export Tools**: [jsPDF](https://github.com/parallax/jsPDF), [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable), [PhpSpreadsheet](https://phpspreadsheet.readthedocs.io/)

---

## 📁 Struktur Direktori

```
Dinalar/
├── app/
│   ├── Console/Commands/       # Artisan commands (stocks:fetch-daily)
│   ├── Http/Controllers/
│   │   ├── Admin/              # Dashboard, Saham, Scraper, Users, History
│   │   ├── Auth/               # Login, Register, Google OAuth 2.0
│   │   └── User/               # Portfolio, Saham, UserDashboard
│   ├── Models/                 # Stock, StockPrice, UserBasket, PortfolioOptimization, User
│   └── Services/               # DeviceViewResolver (Deteksi Web Desktop vs Mobile Native)
├── database/
│   ├── migrations/             # Skema tabel database
│   └── seeders/                # Database seeders (Admin & Dummy data)
├── model/                      # Python Portfolio Optimizer Engine
│   ├── app.py                  # Flask microservice API endpoint (/optimize)
│   ├── optimize_portfolio.py   # MPT Markowitz, SLSQP optimizer, Monte Carlo
│   └── requirements.txt        # Dependensi Python
├── resources/
│   ├── js/
│   │   ├── components/         # Komponen UI bersama (Modals, Charts, Header, Sidebar)
│   │   ├── i18n/               # Language Context & Kamus Terjemahan (ID & EN)
│   │   ├── pages/
│   │   │   ├── admin/          # Tampilan Back-office Admin
│   │   │   ├── auth/           # Halaman Login, Register, Password Reset
│   │   │   └── user/           # Tampilan Pengguna
│   │   │       ├── analyze/    # Halaman Keranjang, Hasil Optimasi, Riwayat
│   │   │       ├── dashboard/  # Dashboard Pengguna
│   │   │       ├── mobile/     # Tampilan Khusus Mobile / Capacitor App
│   │   │       └── saham/      # Katalog Saham & Analisis Historis
│   │   └── types/              # TypeScript interface definitions
│   └── css/                    # Tailwind CSS v4 styling
├── routes/
│   ├── web.php                 # Route aplikasi utama, user, dan admin
│   └── auth.php                # Route autentikasi & Google Socialite
├── capacitor.config.ts         # Konfigurasi Capacitor untuk Android
└── vite.config.ts              # Konfigurasi bundling Vite
```

---

## 🚀 Panduan Instalasi & Menjalankan Project

### 1. Prasyarat Sistem
Pastikan perangkat Anda telah terpasang:
- **PHP** >= 8.2 dengan ekstensi `pdo`, `mbstring`, `openssl`, `curl`, `gd`, `zip`
- **Composer** (v2.x)
- **Node.js** >= 18.x dan **NPM**
- **Python** >= 3.9 dan **pip**
- **MySQL** atau **SQLite**

---

### 2. Kloning Repository & Instalasi Dependensi

```bash
# 1. Clone repository
git clone https://github.com/ryanditata/Dinalar-fintechathon.git
cd Dinalar-fintechathon

# 2. Install dependensi PHP (Composer)
composer install

# 3. Install dependensi JavaScript/React (NPM)
npm install
```

---

### 3. Konfigurasi Environment (`.env`)

Salin file contoh konfigurasi dan buat application key:

```bash
cp .env.example .env
php artisan key:generate
```

Sesuaikan parameter database dan URL pada file `.env`:

```env
APP_NAME=Dinalar
APP_ENV=local
APP_URL=http://localhost:8000

# Konfigurasi Database (Contoh MySQL)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dinalar
DB_USERNAME=root
DB_PASSWORD=

# Atau gunakan SQLite jika ingin cepat tanpa MySQL:
# DB_CONNECTION=sqlite

# Konfigurasi Engine Optimasi Python (Pilih salah satu)
# Opsi A: Menggunakan microservice cloud PythonAnywhere (Default)
PYTHON_API_URL=https://ryanditata.pythonanywhere.com/optimize

# Opsi B: Menggunakan service lokal Flask
# PYTHON_API_URL=http://127.0.0.1:10000/optimize
```

---

### 4. Setup Database & Seed Data

Jalankan migrasi database dan pengisian akun admin default:

```bash
php artisan migrate --seed
```

> **Akun Admin Default:**
> - **Email**: `admin@example.com`
> - **Password**: `password`

---

### 5. Menjalankan Engine Optimasi Python (Opsional jika menjalankan lokal)

Jika Anda ingin menjalankan kalkulasi optimasi Python secara lokal di komputer Anda:

```bash
# Masuk ke direktori model
cd model

# Install dependensi Python
pip install -r requirements.txt

# Jalankan server Flask (port 10000)
python app.py
```

---

### 6. Sinkronisasi Data Saham Awal

Untuk mengisi data harga historis saham IDX dan NASDAQ dari Yahoo Finance:

```bash
# Fetch data harga saham aktif
php artisan stocks:fetch-daily
```

---

### 7. Menjalankan Server Aplikasi

Buka dua jendela terminal untuk menjalankan web server dan compiler aset:

```bash
# Terminal 1: Jalankan Web Server Laravel
php artisan serve

# Terminal 2: Jalankan Vite Dev Server (Hot Module Replacement)
npm run dev
```

Buka browser dan akses aplikasi di: **`http://localhost:8000`**

---

## 📱 Menjalankan Aplikasi Mobile (Capacitor Android)

Project ini siap di-build menjadi aplikasi Android native menggunakan Capacitor:

```bash
# 1. Build aset frontend produksi
npm run build

# 2. Sinkronkan aset ke folder Android Capacitor
npx cap sync android

# 3. Buka project di Android Studio untuk menjalankan emulator / build APK
npx cap open android
```

---

## 🛠️ Perintah CLI Berguna

| Perintah | Deskripsi |
| :--- | :--- |
| `php artisan stocks:fetch-daily` | Mengambil harga penutupan harian terbaru untuk seluruh saham aktif |
| `php artisan stocks:fetch-daily --ticker=BBCA.JK` | Mengambil data harga saham untuk emiten spesifik |
| `php artisan stocks:fetch-daily --bursa=IDX` | Mengambil data harga saham khusus bursa tertentu (IDX / NASDAQ) |
| `npm run dev` | Menjalankan Vite development server dengan HMR |
| `npm run build` | Melakukan compile dan bundle aset untuk produksi |
| `npm run types` | Menjalankan pengecekan tipe data TypeScript (`tsc --noEmit`) |
| `npm run format` | Memformat kode frontend menggunakan Prettier & Tailwind plugin |
| `npm run lint` | Menjalankan audit linter ESLint |
| `npx cap sync android` | Sinkronisasi perubahan frontend ke project native Android |

---

## 🔒 Hak Akses & Akun Bawaan

| Role | Akses & Wewenang |
| :--- | :--- |
| **Admin** | Akses ke seluruh menu back-office (`/admin`), manajemen user, impor data saham, live scraper harga Yahoo Finance, audit riwayat optimasi global. |
| **User** | Akses ke katalog saham, keranjang analisis portofolio, simulasi MPT Markowitz, riwayat optimasi pribadi, generator laporan PDF, dan tautan share publik. |

---

## 📄 Lisensi

Project ini dikembangkan sebagai karya inovasi untuk kompetisi **Fintechathon** dan dilindungi di bawah lisensi [MIT License](LICENSE).

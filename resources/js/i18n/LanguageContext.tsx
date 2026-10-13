import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Language = 'id' | 'en';

type NestedObject = {
    [key: string]: string | NestedObject;
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
    t: (path: string, params?: Record<string, string | number>) => string;
}

const idDictionary: NestedObject = {
    common: {
        save: 'Simpan',
        cancel: 'Batal',
        delete: 'Hapus',
        edit: 'Ubah',
        search: 'Cari',
        filter: 'Filter',
        loading: 'Memuat...',
        close: 'Tutup',
        back: 'Kembali',
        continue: 'Lanjutkan',
        confirm: 'Konfirmasi',
        reset: 'Atur Ulang',
        download: 'Unduh',
        share: 'Bagikan',
        all: 'Semua',
        popular: 'Populer',
        gainers: 'Top Gainers',
        losers: 'Top Losers',
        view_all: 'Lihat Semua',
        empty: 'Tidak ada data',
        actions: 'Aksi',
        status: 'Status',
        yes_delete: 'Ya, Hapus',
        saving: 'Menyimpan...',
        saved: 'Tersimpan',
        deleting: 'Menghapus...',
        analyze: 'Analisis',
        more: 'lagi',
    },
    nav: {
        home: 'Beranda',
        dashboard: 'Dashboard',
        saham: 'Saham',
        basket: 'Keranjang',
        history: 'Riwayat',
        profile: 'Profil',
        settings: 'Pengaturan',
        logout: 'Keluar',
        login: 'Masuk',
        register: 'Daftar',
        floating_nav: 'Navigasi Melayang',
    },
    dashboard: {
        title: 'Dashboard',
        greeting_morning: 'Selamat Pagi',
        greeting_afternoon: 'Selamat Siang',
        greeting_evening: 'Selamat Sore',
        greeting_night: 'Selamat Malam',
        explore_stocks: 'Eksplorasi Saham',
        basket_stocks: 'Keranjang Saham',
        portfolio_history: 'Riwayat Portofolio',
        recent_optimizations: 'Riwayat Optimasi Terakhir',
        no_recent_optimizations: 'Belum ada riwayat optimasi. Mulai pilih saham di keranjang dan optimalkan sekarang!',
        total_optimizations: 'Total Optimasi',
        total_stocks: 'Total Saham Aktif',
        risk_free_rate: 'Risk-Free Rate',
        market_status: 'Status Pasar',
        market_selection: 'Bursa Pilihan',
        top_stocks_movers: 'Pergerakan Saham Unggulan',
        popular_stocks_subtitle: 'Saham yang sering dianalisis oleh pengguna Dinalar',
        gainers_subtitle: 'Saham dengan kenaikan harga tertinggi hari ini',
        losers_subtitle: 'Saham dengan penurunan harga terdalam hari ini',
        view_results: 'Lihat Hasil',
        default_investor: 'INVESTOR DINALAR',
        ai_portfolio_capital: 'Modal Portofolio AI',
        estimated_capital: 'Estimasi Modal',
        recent_portfolio: 'Portofolio Terakhir',
        no_stocks_movement: 'Belum ada data pergerakan saham.',
        quick_actions: 'Aksi Cepat',
        wallet_card_aria: 'Kartu Modal Portofolio',
        portfolio: 'Portofolio',
        return_label: 'Return',
        volatility_label: 'Volatilitas',
        show_balance: 'Tampilkan Saldo',
        hide_balance: 'Sembunyikan Saldo',
        basket_aria: 'Keranjang Saham ({count} dipilih)',
    },
    saham: {
        title: 'Daftar Saham',
        market_explorer: 'Market Explorer',
        search_placeholder: 'Cari kode ticker atau nama emiten...',
        filter_all_sectors: 'Semua Sektor',
        sort_by: 'Urutkan Berdasarkan',
        sort_ticker_asc: 'Kode Saham (A-Z)',
        sort_ticker_desc: 'Kode Saham (Z-A)',
        sort_price_asc: 'Harga (Terendah)',
        sort_price_desc: 'Harga (Tertinggi)',
        sort_change_asc: 'Perubahan (Terendah)',
        sort_change_desc: 'Perubahan (Tertinggi)',
        price: 'Harga Terakhir',
        change_24h: 'Perubahan',
        volume: 'Volume',
        sector: 'Sektor',
        add_to_basket: 'Tambah ke Keranjang',
        remove_from_basket: 'Hapus dari Keranjang',
        analyze_quick: 'Analisis Saham',
        showing_stocks: 'Menampilkan {count} saham',
        no_stocks_found: 'Saham tidak ditemukan dengan kata kunci tersebut.',
        today: 'Hari Ini',
        other_stocks: 'Emiten Lainnya',
        added_to_basket_toast: 'Saham {ticker} berhasil ditambahkan ke keranjang!',
        add_to_basket_error: 'Gagal menyimpan saham {ticker} ke keranjang.',
        in_basket_title: 'Sudah di Keranjang (Buka Analisis)',
        analyze_add_title: 'Analisis & Tambah ke Keranjang',
        in_basket_aria: 'Sudah di Keranjang {ticker}',
        analyze_add_aria: 'Analisis dan Tambah {ticker}',
        clear_search: 'Hapus Pencarian',
    },
    basket: {
        title: 'Keranjang Portofolio',
        subtitle: 'Pilih parameter dan kombinasi saham untuk menghasilkan bobot alokasi portofolio yang optimal.',
        selected_stocks: 'Saham Terpilih',
        stocks_count: '{count} Saham Dipilih',
        clear_all: 'Kosongkan Keranjang',
        parameters_title: 'Parameter Optimasi',
        initial_capital: 'Modal Investasi Awal (Rp)',
        initial_capital_placeholder: 'Masukkan nominal modal...',
        risk_free_rate_label: 'Risk-Free Rate Tahunan (%)',
        risk_free_rate_desc: 'Biasanya mengacu pada suku bunga BI Rate / SBN 10 Tahun (contoh: 6.0%)',
        timeframe_label: 'Periode Data Historis',
        timeframe_1m: '1 Bulan',
        timeframe_3m: '3 Bulan',
        timeframe_6m: '6 Bulan',
        timeframe_1y: '1 Tahun',
        timeframe_2y: '2 Tahun',
        timeframe_3y: '3 Tahun',
        optimization_method: 'Metode Target Optimasi',
        method_sharpe: 'Maksimum Sharpe Ratio (Keseimbangan Return & Risiko)',
        method_variance: 'Minimum Volatilitas (Risiko Paling Rendah)',
        run_optimization: 'Jalankan Optimasi Portofolio',
        optimizing: 'Mengoptimalkan Portofolio...',
        empty_basket_title: 'Keranjang Masih Kosong',
        empty_basket_desc: 'Silakan pilih minimal 2 saham dari halaman Saham untuk dapat melakukan analisis optimasi portofolio.',
        add_stocks_now: 'Pilih Saham Sekarang',
        clear_modal_title: 'Kosongkan Keranjang?',
        clear_modal_desc: 'Apakah Anda yakin ingin menghapus seluruh saham dari keranjang analisis? Tindakan ini tidak dapat dibatalkan.',
        min_stocks_required: 'Pilih minimal 2 saham untuk melakukan optimasi portofolio.',
    },
    result: {
        title: 'Hasil Optimasi Portofolio',
        subtitle: 'Alokasi portofolio optimal berdasarkan Modern Portfolio Theory (Markowitz) & AI Analysis.',
        reference_code: 'Kode Referensi',
        analyzed_at: 'Waktu Analisis',
        summary_title: 'Ringkasan Kinerja Portofolio',
        expected_return: 'Expected Return Tahunan',
        expected_return_desc: 'Estimasi imbal hasil tahunan yang diproyeksikan',
        volatility_risk: 'Volatilitas Portofolio (Risiko)',
        volatility_desc: 'Standar deviasi risiko fluktuasi harga tahunan',
        sharpe_ratio: 'Sharpe Ratio',
        sharpe_ratio_desc: 'Rasio imbal hasil terhadap risiko yang dihadapi',
        weight_allocation: 'Rekomendasi Bobot Alokasi Saham',
        ticker_column: 'Saham',
        weight_column: 'Bobot Alokasi',
        nominal_column: 'Estimasi Nominal Investasi',
        lots_column: 'Estimasi Jumlah Lot',
        efficient_frontier: 'Kurva Efficient Frontier',
        efficient_frontier_desc: 'Simulasi portofolio acak dan titik portofolio optimal',
        export_pdf: 'Unduh Laporan PDF',
        export_excel: 'Ekspor Excel',
        save_portfolio: 'Simpan ke Riwayat',
        portfolio_saved: 'Portofolio berhasil disimpan ke riwayat Anda.',
    },
    history: {
        title: 'Riwayat Optimasi',
        subtitle: 'Daftar portofolio yang telah Anda simpan dan analisis sebelumnya.',
        saved_portfolios: 'Portofolio Tersimpan',
        portfolios_count: 'Portofolio',
        metric_return: 'Return',
        metric_volatility: 'Volatilitas',
        metric_sharpe: 'Sharpe Ratio',
        empty_history_title: 'Belum Ada Riwayat',
        empty_history_desc: 'Lakukan analisis portofolio di keranjang untuk melihat hasil dan menyimpan riwayat di sini.',
        empty_history_desc_short: 'Hasil kalkulasi portofolio yang Anda jalankan akan tersimpan otomatis di sini.',
        create_portfolio_btn: 'Mulai Buat Portofolio',
        start_analysis: 'Mulai Analisis Baru',
        edit_title_modal: 'Ubah Judul Portofolio',
        edit_title_desc: 'Sesuaikan nama portofolio untuk memudahkan pencarian di kemudian hari.',
        portfolio_name_placeholder: 'Nama portofolio...',
        title_required: 'Judul portofolio tidak boleh kosong.',
        update_success: 'Judul portofolio berhasil diperbarui.',
        update_error: 'Gagal memperbarui judul.',
        delete_modal_title: 'Hapus Riwayat Portofolio',
        delete_modal_desc: 'Apakah Anda yakin ingin menghapus portofolio "{title}"? Seluruh data riwayat analisis ini tidak dapat dikembalikan.',
        delete_confirm_prefix: 'Apakah Anda yakin ingin menghapus portofolio',
        delete_confirm_suffix: 'Seluruh data riwayat analisis ini tidak dapat dikembalikan.',
        delete_success: 'Riwayat portofolio berhasil dihapus.',
        delete_error: 'Gagal menghapus riwayat.',
    },
    landing: {
        tagline: 'AI Stock Portfolio Optimization Platform',
        hero_title: 'Investasi Saham Cerdas Berbasis Data & AI',
        hero_subtitle: 'Optimalkan bobot alokasi portofolio saham IHSG Anda dengan teori Modern Portfolio Markowitz untuk imbal hasil maksimal pada tingkat risiko terukur.',
        cta_start: 'Mulai Optimasi Sekarang',
        cta_explore: 'Jelajahi Saham',
        features_title: 'Fitur Unggulan Platform Dinalar',
    },
    profile: {
        title: 'Profil Saya',
        account: 'Akun',
        account_desc: 'Informasi akun',
        edit_profile: 'Informasi Profil',
        update_account: 'Perbarui Akun',
        full_name: 'Nama Lengkap',
        full_name_placeholder: 'Nama lengkap Anda',
        email: 'Alamat Email',
        email_placeholder: 'email@contoh.com',
        email_unverified: 'Email Belum Diverifikasi',
        email_unverified_desc: 'Silakan verifikasi email Anda untuk menikmati seluruh fitur Dinalar secara maksimal.',
        resend_verification: 'Kirim ulang tautan verifikasi',
        verification_sent: 'Tautan verifikasi baru telah dikirim ke alamat email Anda.',
        update_success: 'Informasi profil berhasil diperbarui.',
        update_error: 'Gagal memperbarui profil. Periksa kembali isian Anda.',
        delete_account: 'Hapus Akun',
        delete_warning: 'Peringatan! Harap berhati-hati, tindakan ini tidak dapat dibatalkan.',
        delete_confirm_title: 'Apakah Anda yakin ingin menghapus akun?',
        delete_confirm_desc: 'Setelah akun dihapus, seluruh data dan riwayat optimasi akan dihapus secara permanen. Masukkan kata sandi Anda untuk konfirmasi.',
        enter_password_to_confirm: 'Masukkan Kata Sandi untuk Konfirmasi',
        enter_password_placeholder: 'Kata sandi akun Anda',
        delete_success: 'Akun Anda telah berhasil dihapus.',
        change_password: 'Kata Sandi',
        password_title: 'Kata Sandi',
        update_password: 'Perbarui Kata Sandi',
        password_desc: 'Keamanan akun',
        current_password: 'Kata Sandi Saat Ini',
        current_password_placeholder: 'Masukkan kata sandi saat ini',
        new_password: 'Kata Sandi Baru',
        new_password_placeholder: 'Minimal 8 karakter',
        confirm_new_password: 'Konfirmasi Kata Sandi Baru',
        confirm_password_placeholder: 'Ulangi kata sandi baru',
        min_8_chars: 'Minimal 8 karakter',
        password_match: 'Kata sandi cocok',
        password_mismatch: 'Kata sandi belum cocok',
        show_password: 'Tampilkan kata sandi',
        hide_password: 'Sembunyikan kata sandi',
        update_password_btn: 'Perbarui',
        password_success: 'Kata sandi berhasil diperbarui.',
        password_error: 'Gagal memperbarui kata sandi. Periksa kembali isian Anda.',
        language: 'Bahasa (Language)',
        language_desc: 'Pilih bahasa tampilan',
        about_title: 'Tentang Dinalar',
        about_desc: 'Versi aplikasi 1.0.0',
        about_modal_text: 'Dinalar adalah platform optimasi portofolio saham berbasis Artificial Intelligence. Maksimalkan return dan kendalikan risiko saham pilihan Anda.',
        theme: 'Tema Tampilan',
        light: 'Terang',
        dark: 'Gelap',
        system: 'Sistem',
        terms: 'Syarat & Ketentuan',
        privacy: 'Kebijakan Privasi',
    },
    analysis: {
        drag_to_close: 'Geser ke bawah untuk menutup',
        horizon_title: 'Horison Analisis',
        all: 'Semua',
        time_range: 'Rentang Waktu',
        start_date: 'Mulai',
        end_date: 'Selesai',
        apply: 'Terapkan',
        short_range_warning: 'Rentang Singkat:',
        short_range_desc: 'Data < 30 hari ({days} hari bursa). Rujukan utama pergerakan adalah',
        short_range_metric_ref: 'Return Periode',
        calculating: 'Menghitung return historis & volatilitas...',
        closing_price_chart: 'Grafik Harga Penutupan',
        trading_days: 'Hari Bursa',
        no_price_data: 'Tidak ada data harga pada rentang ini.',
        period_return: 'Return Periode',
        period_return_desc: 'Perubahan selama {count} hari bursa',
        price_range: 'Rentang Harga',
        low: 'Low:',
        high: 'High:',
        price_range_desc: 'Harga terendah & tertinggi',
        expected_return: 'Expected Return',
        expected_return_desc: 'Proyeksi tahunan model',
        volatility: 'Volatilitas',
        volatility_desc: 'Risiko fluktuasi tahunan',
        update: 'Perbarui',
        add: 'Tambahkan',
        already_in_basket: 'Sudah di Keranjang',
    },
};

const enDictionary: NestedObject = {
    common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        search: 'Search',
        filter: 'Filter',
        loading: 'Loading...',
        close: 'Close',
        back: 'Back',
        continue: 'Continue',
        confirm: 'Confirm',
        reset: 'Reset',
        download: 'Download',
        share: 'Share',
        all: 'All',
        popular: 'Popular',
        gainers: 'Top Gainers',
        losers: 'Top Losers',
        view_all: 'View All',
        empty: 'No data available',
        actions: 'Actions',
        status: 'Status',
        yes_delete: 'Yes, Delete',
        saving: 'Saving...',
        saved: 'Saved',
        deleting: 'Deleting...',
        analyze: 'Analyze',
        more: 'more',
    },
    nav: {
        home: 'Home',
        dashboard: 'Dashboard',
        saham: 'Stocks',
        basket: 'Basket',
        history: 'History',
        profile: 'Profile',
        settings: 'Settings',
        logout: 'Log Out',
        login: 'Log In',
        register: 'Sign Up',
        floating_nav: 'Floating Navigation',
    },
    dashboard: {
        title: 'Dashboard',
        greeting_morning: 'Good Morning',
        greeting_afternoon: 'Good Afternoon',
        greeting_evening: 'Good Evening',
        greeting_night: 'Good Night',
        explore_stocks: 'Explore Stocks',
        basket_stocks: 'Stock Basket',
        portfolio_history: 'Portfolio History',
        recent_optimizations: 'Recent Portfolio Optimizations',
        no_recent_optimizations: 'No recent optimizations yet. Start by selecting stocks in your basket and optimize now!',
        total_optimizations: 'Total Optimizations',
        total_stocks: 'Active Stocks',
        risk_free_rate: 'Risk-Free Rate',
        market_status: 'Market Status',
        market_selection: 'Market Explorer',
        top_stocks_movers: 'Top Market Movers',
        popular_stocks_subtitle: 'Stocks frequently analyzed by Dinalar investors',
        gainers_subtitle: 'Stocks with the highest price increases today',
        losers_subtitle: 'Stocks with the largest price declines today',
        view_results: 'View Results',
        default_investor: 'DINALAR INVESTOR',
        ai_portfolio_capital: 'AI Portfolio Capital',
        estimated_capital: 'Estimated Capital',
        recent_portfolio: 'Latest Portfolio',
        no_stocks_movement: 'No stock movement data available.',
        quick_actions: 'Quick Actions',
        wallet_card_aria: 'Portfolio Capital Card',
        portfolio: 'Portfolio',
        return_label: 'Return',
        volatility_label: 'Volatility',
        show_balance: 'Show Balance',
        hide_balance: 'Hide Balance',
        basket_aria: 'Stock Basket ({count} selected)',
    },
    saham: {
        title: 'Stock Explorer',
        market_explorer: 'Market Explorer',
        search_placeholder: 'Search ticker symbol or company name...',
        filter_all_sectors: 'All Sectors',
        sort_by: 'Sort By',
        sort_ticker_asc: 'Ticker (A-Z)',
        sort_ticker_desc: 'Ticker (Z-A)',
        sort_price_asc: 'Price (Lowest)',
        sort_price_desc: 'Price (Highest)',
        sort_change_asc: 'Change (Lowest)',
        sort_change_desc: 'Change (Highest)',
        price: 'Last Price',
        change_24h: 'Change',
        volume: 'Volume',
        sector: 'Sector',
        add_to_basket: 'Add to Basket',
        remove_from_basket: 'Remove from Basket',
        analyze_quick: 'Quick Analyze',
        showing_stocks: 'Showing {count} stocks',
        no_stocks_found: 'No stocks matched your search keywords.',
        today: 'Today',
        other_stocks: 'Other Stocks',
        added_to_basket_toast: 'Stock {ticker} successfully added to basket!',
        add_to_basket_error: 'Failed to add stock {ticker} to basket.',
        in_basket_title: 'Already in Basket (Open Analysis)',
        analyze_add_title: 'Analyze & Add to Basket',
        in_basket_aria: 'Already in Basket {ticker}',
        analyze_add_aria: 'Analyze and Add {ticker}',
        clear_search: 'Clear Search',
    },
    basket: {
        title: 'Portfolio Basket',
        subtitle: 'Select investment parameters and stock combinations to generate optimal portfolio allocation weights.',
        selected_stocks: 'Selected Stocks',
        stocks_count: '{count} Stocks Selected',
        clear_all: 'Clear Basket',
        parameters_title: 'Optimization Parameters',
        initial_capital: 'Initial Investment Capital (IDR)',
        initial_capital_placeholder: 'Enter capital amount...',
        risk_free_rate_label: 'Annual Risk-Free Rate (%)',
        risk_free_rate_desc: 'Typically refers to BI Rate or 10-Year Government Bond Yield (e.g. 6.0%)',
        timeframe_label: 'Historical Data Timeframe',
        timeframe_1m: '1 Month',
        timeframe_3m: '3 Months',
        timeframe_6m: '6 Months',
        timeframe_1y: '1 Year',
        timeframe_2y: '2 Years',
        timeframe_3y: '3 Years',
        optimization_method: 'Target Optimization Method',
        method_sharpe: 'Maximum Sharpe Ratio (Balanced Return & Risk)',
        method_variance: 'Minimum Volatility (Lowest Risk)',
        run_optimization: 'Run Portfolio Optimization',
        optimizing: 'Optimizing Portfolio...',
        empty_basket_title: 'Basket is Currently Empty',
        empty_basket_desc: 'Please select at least 2 stocks from the Stocks page to perform portfolio optimization.',
        add_stocks_now: 'Select Stocks Now',
        clear_modal_title: 'Clear Stock Basket?',
        clear_modal_desc: 'Are you sure you want to remove all stocks from your analysis basket? This action cannot be undone.',
        min_stocks_required: 'Please select at least 2 stocks to optimize your portfolio.',
    },
    result: {
        title: 'Portfolio Optimization Results',
        subtitle: 'Optimal asset allocation calculated via Modern Portfolio Theory (Markowitz) & AI Analysis.',
        reference_code: 'Reference Code',
        analyzed_at: 'Analysis Date',
        summary_title: 'Portfolio Performance Summary',
        expected_return: 'Annual Expected Return',
        expected_return_desc: 'Projected annualized return based on historical performance',
        volatility_risk: 'Portfolio Volatility (Risk)',
        volatility_desc: 'Standard deviation representing annualized price fluctuation risk',
        sharpe_ratio: 'Sharpe Ratio',
        sharpe_ratio_desc: 'Risk-adjusted return efficiency ratio',
        weight_allocation: 'Recommended Asset Weight Allocation',
        ticker_column: 'Ticker',
        weight_column: 'Allocation Weight',
        nominal_column: 'Estimated Investment Amount',
        lots_column: 'Estimated Lots',
        efficient_frontier: 'Efficient Frontier Curve',
        efficient_frontier_desc: 'Randomized Monte Carlo simulation and optimal portfolio points',
        export_pdf: 'Download PDF Report',
        export_excel: 'Export to Excel',
        save_portfolio: 'Save to History',
        portfolio_saved: 'Portfolio successfully saved to your history.',
    },
    history: {
        title: 'Optimization History',
        subtitle: 'List of portfolios you have previously analyzed and saved.',
        saved_portfolios: 'Saved Portfolios',
        portfolios_count: 'Portfolios',
        metric_return: 'Return',
        metric_volatility: 'Volatility',
        metric_sharpe: 'Sharpe Ratio',
        empty_history_title: 'No History Yet',
        empty_history_desc: 'Run a portfolio analysis from your basket to see results and save your records here.',
        empty_history_desc_short: 'Calculated portfolio results will be automatically saved here.',
        create_portfolio_btn: 'Start Creating Portfolio',
        start_analysis: 'Start New Analysis',
        edit_title_modal: 'Edit Portfolio Title',
        edit_title_desc: 'Customize the portfolio name to make it easier to find later.',
        portfolio_name_placeholder: 'Portfolio name...',
        title_required: 'Portfolio title cannot be empty.',
        update_success: 'Portfolio title updated successfully.',
        update_error: 'Failed to update title.',
        delete_modal_title: 'Delete Portfolio Record',
        delete_modal_desc: 'Are you sure you want to delete portfolio "{title}"? This optimization record cannot be recovered.',
        delete_confirm_prefix: 'Are you sure you want to delete portfolio',
        delete_confirm_suffix: 'This optimization record cannot be recovered.',
        delete_success: 'Portfolio record deleted successfully.',
        delete_error: 'Failed to delete record.',
    },
    landing: {
        tagline: 'AI Stock Portfolio Optimization Platform',
        hero_title: 'Smart Stock Investing Powered by Data & AI',
        hero_subtitle: 'Optimize your IDX stock portfolio weights with Markowitz Modern Portfolio Theory for maximum return at a calculated risk level.',
        cta_start: 'Start Optimizing Now',
        cta_explore: 'Explore Stocks',
        features_title: 'Key Platform Features',
    },
    profile: {
        title: 'My Profile',
        account: 'Account',
        account_desc: 'Account information',
        edit_profile: 'Profile Information',
        update_account: 'Update Account',
        full_name: 'Full Name',
        full_name_placeholder: 'Your full name',
        email: 'Email Address',
        email_placeholder: 'email@example.com',
        email_unverified: 'Email Unverified',
        email_unverified_desc: 'Please verify your email address to access all Dinalar features.',
        resend_verification: 'Resend verification link',
        verification_sent: 'A new verification link has been sent to your email address.',
        update_success: 'Profile information updated successfully.',
        update_error: 'Failed to update profile. Please check your inputs.',
        delete_account: 'Delete Account',
        delete_warning: 'Warning! Please proceed with caution, this cannot be undone.',
        delete_confirm_title: 'Are you sure you want to delete your account?',
        delete_confirm_desc: 'Once your account is deleted, all of its resources and data will be permanently deleted. Please enter your password to confirm.',
        enter_password_to_confirm: 'Enter Password to Confirm',
        enter_password_placeholder: 'Your account password',
        delete_success: 'Your account has been deleted successfully.',
        change_password: 'Password',
        password_title: 'Password',
        update_password: 'Update Password',
        password_desc: 'Account security',
        current_password: 'Current Password',
        current_password_placeholder: 'Enter current password',
        new_password: 'New Password',
        new_password_placeholder: 'Minimum 8 characters',
        confirm_new_password: 'Confirm New Password',
        confirm_password_placeholder: 'Repeat new password',
        min_8_chars: 'Minimum 8 characters',
        password_match: 'Passwords match',
        password_mismatch: 'Passwords do not match yet',
        show_password: 'Show password',
        hide_password: 'Hide password',
        update_password_btn: 'Update',
        password_success: 'Password updated successfully.',
        password_error: 'Failed to update password. Please check your inputs.',
        language: 'Language',
        language_desc: 'Select display language',
        about_title: 'About Dinalar',
        about_desc: 'App version 1.0.0',
        about_modal_text: 'Dinalar is an Artificial Intelligence-powered stock portfolio optimization platform. Maximize returns and control risks of your selected stocks.',
        theme: 'App Theme',
        light: 'Light',
        dark: 'Dark',
        system: 'System',
        terms: 'Terms & Conditions',
        privacy: 'Privacy Policy',
    },
    analysis: {
        drag_to_close: 'Swipe down to close',
        horizon_title: 'Analysis Horizon',
        all: 'All',
        time_range: 'Time Range',
        start_date: 'Start',
        end_date: 'End',
        apply: 'Apply',
        short_range_warning: 'Short Range:',
        short_range_desc: 'Data < 30 days ({days} trading days). Primary reference is',
        short_range_metric_ref: 'Period Return',
        calculating: 'Calculating historical returns & volatility...',
        closing_price_chart: 'Closing Price Chart',
        trading_days: 'Trading Days',
        no_price_data: 'No price data available for this range.',
        period_return: 'Period Return',
        period_return_desc: 'Change over {count} trading days',
        price_range: 'Price Range',
        low: 'Low:',
        high: 'High:',
        price_range_desc: 'Lowest & highest price',
        expected_return: 'Expected Return',
        expected_return_desc: 'Annual model projection',
        volatility: 'Volatility',
        volatility_desc: 'Annual fluctuation risk',
        update: 'Update',
        add: 'Add to Basket',
        already_in_basket: 'Already in Basket',
    },
};

const translations: Record<Language, NestedObject> = {
    id: idDictionary,
    en: enDictionary,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'dinalar_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(STORAGE_KEY) as Language;
                if (saved === 'id' || saved === 'en') {
                    return saved;
                }
            } catch {
                // Ignore localStorage errors
            }
        }
        return 'id'; // Default Bahasa Indonesia
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(STORAGE_KEY, lang);
                document.documentElement.lang = lang;
            } catch {
                // Ignore localStorage errors
            }
        }
    };

    const toggleLanguage = () => {
        setLanguage(language === 'id' ? 'en' : 'id');
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.documentElement.lang = language;
        }
    }, [language]);

    /**
     * Mengambil teks berdasarkan path bertingkat (misal: 'dashboard.greeting')
     * dan mengganti parameter jika ada (misal: { name: 'Ryan' } untuk '{name}')
     */
    const t = (path: string, params?: Record<string, string | number>): string => {
        const keys = path.split('.');

        let current: NestedObject | string | undefined = translations[language];
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = (current as NestedObject)[key];
            } else {
                // Fallback ke bahasa Indonesia jika key tidak ditemukan di bahasa terpilih
                let fallback: NestedObject | string | undefined = translations.id;
                for (const fallbackKey of keys) {
                    if (fallback && typeof fallback === 'object' && fallbackKey in fallback) {
                        fallback = (fallback as NestedObject)[fallbackKey];
                    } else {
                        fallback = undefined;
                        break;
                    }
                }
                current = fallback || path;
                break;
            }
        }

        let result = typeof current === 'string' ? current : path;

        // Interpolasi parameter: {name} atau {{name}}
        if (params && typeof result === 'string') {
            Object.entries(params).forEach(([paramKey, val]) => {
                const regexSingle = new RegExp(`{${paramKey}}`, 'g');
                const regexDouble = new RegExp(`{{${paramKey}}}`, 'g');
                result = result.replace(regexDouble, String(val)).replace(regexSingle, String(val));
            });
        }

        return result;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        // Fallback aman jika komponen di luar provider
        return {
            language: 'id',
            setLanguage: () => {},
            toggleLanguage: () => {},
            t: (path: string) => path,
        };
    }
    return context;
};

export default LanguageContext;

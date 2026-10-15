import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.dinalar.app',
    appName: 'Dinalar',
    webDir: 'public',
    server: {
        // Ganti URL ini dengan domain live backend Laravel Anda ketika sudah dideploy
        url: 'https://dinalar.my.id',
        cleartext: true,
        androidScheme: 'https',
    },
    // Menambahkan penanda pada User-Agent agar Laravel selalu mengenali perangkat mobile
    appendUserAgent: 'Capacitor/Mobile DinalarApp',
    plugins: {
        SplashScreen: {
            launchShowDuration: 1800,
            launchAutoHide: true,
            backgroundColor: '#ffffff',
            androidScaleType: 'CENTER',
            showSpinner: false,
        },
        StatusBar: {
            style: 'DARK',
            backgroundColor: '#f4f4f5',
            overlaysWebView: false,
        },
    },
};

export default config;

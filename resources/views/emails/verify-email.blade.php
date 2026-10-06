<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifikasi Alamat Email - Dinalar</title>
    <!-- Instrument Sans Font -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
    <style>
        /* Base Reset */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; display: block; }
        body { 
            margin: 0; 
            padding: 0; 
            width: 100% !important; 
            height: 100% !important; 
            background-color: #050505; 
            font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            color: #ffffff; 
        }
        
        /* Mobile Responsive */
        @media screen and (max-width: 600px) {
            .email-wrapper {
                padding: 16px 8px !important;
            }
            .content-card {
                padding: 24px 18px !important;
                border-radius: 14px !important;
            }
            .btn-action {
                display: block !important;
                width: 100% !important;
                box-sizing: border-box !important;
                text-align: center !important;
                padding: 12px 20px !important;
            }
            .logo-img {
                height: 30px !important;
                width: auto !important;
            }
            .card-title {
                font-size: 19px !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #050505;">

    <!-- Outer Wrapper Table (Dark Pitch Black Background) -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #050505; min-height: 100vh;">
        <tr>
            <td align="center" class="email-wrapper" style="padding: 40px 16px;">
                
                <!-- Main Email Container (560px) -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px;">
                    
                    <!-- 1. LOGO HEADER -->
                    <tr>
                        <td align="center" style="padding-bottom: 24px;">
                            <a href="{{ config('app.url') }}" target="_blank" style="text-decoration: none; display: inline-block;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" style="vertical-align: middle;">
                                            <img src="{{ rtrim(config('app.url'), '/') }}/images/newLogo.png?v=4" alt="Dinalar Logo" class="logo-img" style="height: 36px; width: auto; max-height: 40px; object-fit: contain;" />
                                        </td>
                                    </tr>
                                </table>
                            </a>
                        </td>
                    </tr>

                    <!-- 2. DARK GLASS HERO CARD (PERSIS SEPERTI GAMBAR) -->
                    <tr>
                        <td>
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="content-card" style="background: linear-gradient(135deg, #18181b 0%, #111113 45%, #0d1a15 80%, #062319 100%); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 18px; padding: 34px 30px; box-shadow: 0 10px 35px -5px rgba(0, 0, 0, 0.8), 0 0 25px rgba(5, 150, 105, 0.12);">
                                
                                <!-- BADGE HEADER (PERSIS STYLE BADGE DARK PADA GAMBAR) -->
                                <tr>
                                    <td align="left" style="padding-bottom: 22px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="background-color: rgba(255, 255, 255, 0.07); border: 1px solid rgba(255, 255, 255, 0.22); border-radius: 9999px; padding: 5px 14px;">
                                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <!-- Emerald Icon -->
                                                            <td style="vertical-align: middle; padding-right: 7px; color: #10b981; line-height: 1;">
                                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
                                                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                                                    <path d="m9 12 2 2 4-4"/>
                                                                </svg>
                                                            </td>
                                                            <!-- Badge Text (Pure White) -->
                                                            <td style="vertical-align: middle; font-size: 12px; font-weight: 600; color: #ffffff; letter-spacing: 0.1px; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                                                Verifikasi Akun
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- CARD TITLE -->
                                <tr>
                                    <td align="left" style="padding-bottom: 14px;">
                                        <h1 class="card-title" style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; line-height: 1.35; letter-spacing: -0.3px; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                            Konfirmasi Alamat Email Anda
                                        </h1>
                                    </td>
                                </tr>

                                <!-- GREETING & MESSAGE -->
                                <tr>
                                    <td align="left" style="padding-bottom: 24px;">
                                        <p style="margin: 0 0 10px 0; font-size: 15px; color: #f4f4f5; line-height: 1.5; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                            Halo <strong style="color: #ffffff;">{{ $user->name ?? 'Pengguna Dinalar' }}</strong>,
                                        </p>
                                        <p style="margin: 0; font-size: 14px; color: #a1a1aa; line-height: 1.6; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                            Terima kasih telah mendaftar di <strong>Dinalar</strong>. Untuk mengamankan akun dan mulai menggunakan seluruh fitur analisis portofolio saham, silakan konfirmasi email Anda dengan menekan tombol di bawah:
                                        </p>
                                    </td>
                                </tr>

                                <!-- CTA BUTTON (PERSIS STYLE BUTTON PADA GAMBAR "+ SAHAM") -->
                                <tr>
                                    <td align="center" style="padding: 4px 0 28px 0;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" style="border-radius: 8px; background-color: #059669; box-shadow: 0 3px 12px rgba(5, 150, 105, 0.40);">
                                                    <a href="{{ $url }}" target="_blank" class="btn-action" style="display: inline-block; font-size: 13px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; letter-spacing: 0.2px; background-color: #059669; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                                        Verifikasi Email Sekarang
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- NOTICE BOX (DARK TRANSLUCENT) -->
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 16px;">
                                            <tr>
                                                <td style="font-size: 12px; color: #a1a1aa; line-height: 1.5; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                                    <strong>Informasi:</strong> Tautan verifikasi ini berlaku selama <strong>60 menit</strong>. Jika Anda tidak merasa mendaftar di Dinalar, abaikan email ini dengan aman.
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- FALLBACK URL LINK -->
                                <tr>
                                    <td style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 16px;">
                                        <p style="margin: 0 0 6px 0; font-size: 12px; color: #71717a; line-height: 1.4; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                            Jika tombol di atas tidak dapat diklik, salin dan buka tautan ini:
                                        </p>
                                        <p style="margin: 0; font-size: 11px; line-height: 1.4; word-break: break-all; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                            <a href="{{ $url }}" style="color: #10b981; text-decoration: underline;">
                                                {{ $url }}
                                            </a>
                                        </p>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>

                    <!-- 3. FOOTER -->
                    <tr>
                        <td align="center" style="padding-top: 24px; font-size: 12px; color: #52525b; line-height: 1.5; font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                            <p style="margin: 0 0 4px 0;">
                                &copy; {{ date('Y') }} <strong>Dinalar</strong> - AI Stock Portfolio Optimization Platform. All Rights Reserved.
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>

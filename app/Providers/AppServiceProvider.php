<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (app()->environment('production')) {
            URL::forceScheme('https');
        }

        VerifyEmail::toMailUsing(function (object $notifiable, string $url) {
            $locale = request()->input('lang') ?: (request()->cookie('dinalar_locale') ?: 'id');
            $locale = in_array($locale, ['id', 'en']) ? $locale : 'id';

            $subject = $locale === 'en'
                ? 'Verify Your Email Address - Dinalar'
                : 'Verifikasi Alamat Email Anda - Dinalar';

            return (new MailMessage)
                ->subject($subject)
                ->view('emails.verify-email', [
                    'user' => $notifiable,
                    'url' => $url,
                    'locale' => $locale,
                ]);
        });

        ResetPassword::toMailUsing(function (object $notifiable, string $token) {
            $url = url(route('password.reset', [
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ], false));

            $locale = request()->input('lang') ?: (request()->cookie('dinalar_locale') ?: 'id');
            $locale = in_array($locale, ['id', 'en']) ? $locale : 'id';

            $subject = $locale === 'en'
                ? 'Reset Password Notification - Dinalar'
                : 'Atur Ulang Kata Sandi - Dinalar';

            return (new MailMessage)
                ->subject($subject)
                ->view('emails.reset-password', [
                    'user' => $notifiable,
                    'url' => $url,
                    'count' => config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60),
                    'locale' => $locale,
                ]);
        });
    }
}

<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\Role;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

#[Signature('netmap:emergency-login {email : Email admin yang terdaftar}')]
#[Description('Buat link login sekali pakai untuk admin saat login Google tidak bisa dipakai')]
final class EmergencyLoginCommand extends Command
{
    public static function cacheKey(string $nonce): string
    {
        return "emergency-login:{$nonce}";
    }

    public function handle(): int
    {
        $user = User::query()->whereEmail((string) $this->argument('email'))->first();

        if ($user === null || $user->isDisabled() || ! $user->hasRole(Role::Admin->value)) {
            $this->error('Email tersebut bukan admin aktif di NetMap.');

            return self::FAILURE;
        }

        $ttl = (int) config('netmap.emergency_login_ttl_minutes');
        $nonce = Str::random(48);
        Cache::put(self::cacheKey($nonce), $user->getKey(), now()->addMinutes($ttl));

        // Relative signature: the request reaches Laravel through Caddy / the Next dev proxy.
        $path = URL::temporarySignedRoute('auth.emergency', now()->addMinutes($ttl), ['nonce' => $nonce], absolute: false);

        AuditLog::record(action: 'auth.emergency_link_created', user: $user, target: $user->email, ip: '127.0.0.1');

        $this->info("Link login darurat untuk {$user->email} (berlaku {$ttl} menit, sekali pakai):");
        $this->line(config('netmap.frontend_url').$path);

        return self::SUCCESS;
    }
}

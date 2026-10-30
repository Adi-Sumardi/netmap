<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Data\GoogleProfile;
use App\Enums\LoginRejection;
use App\Enums\UserStatus;
use App\Exceptions\LoginRejectedException;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Container\Attributes\Config;

/**
 * Matches a Google account against the allowlist. Never creates users.
 */
final class AuthenticateGoogleUser
{
    /**
     * @param  list<string>  $allowedDomains
     */
    public function __construct(
        #[Config('netmap.google_allowed_domains')]
        private readonly array $allowedDomains = [],
    ) {}

    public function handle(GoogleProfile $profile, ?string $ip): User
    {
        if (! $profile->emailVerified) {
            $this->reject(LoginRejection::Unverified, $profile, $ip);
        }

        if ($this->allowedDomains !== [] && ! in_array($profile->domain(), $this->allowedDomains, true)) {
            $this->reject(LoginRejection::NotRegistered, $profile, $ip, 'domain_not_allowed');
        }

        $user = User::query()->where('google_id', $profile->id)->first()
            ?? User::query()->whereEmail($profile->email)->first();

        if ($user === null) {
            $this->reject(LoginRejection::NotRegistered, $profile, $ip);
        }

        // The email is allowlisted, but it was already claimed by a different Google account.
        if ($user->google_id !== null && $user->google_id !== $profile->id) {
            $this->reject(LoginRejection::NotRegistered, $profile, $ip, 'google_id_mismatch');
        }

        if ($user->isDisabled()) {
            $this->reject(LoginRejection::Disabled, $profile, $ip);
        }

        $firstLogin = $user->google_id === null;

        $user->fill([
            'google_id' => $profile->id,
            'name' => $profile->name ?? $user->name,
            'avatar_url' => $profile->avatarUrl,
            'status' => UserStatus::Active,
            'last_login_at' => now(),
            'last_login_ip' => $ip,
        ]);

        if ($user->email !== $profile->email && User::query()->whereEmail($profile->email)->doesntExist()) {
            $user->email = $profile->email;
        }

        $user->save();

        AuditLog::record(
            action: $firstLogin ? 'auth.first_login' : 'auth.login',
            user: $user,
            target: $user->email,
            meta: ['provider' => 'google'],
            ip: $ip,
        );

        return $user;
    }

    private function reject(LoginRejection $reason, GoogleProfile $profile, ?string $ip, ?string $detail = null): never
    {
        AuditLog::record(
            action: 'auth.login_rejected',
            target: $profile->email,
            meta: array_filter(['reason' => $reason->value, 'detail' => $detail, 'provider' => 'google']),
            ip: $ip,
        );

        throw new LoginRejectedException($reason, $profile->email);
    }
}

<?php

declare(strict_types=1);

namespace App\Data;

use Laravel\Socialite\Contracts\User as SocialiteUser;

final readonly class GoogleProfile
{
    public function __construct(
        public string $id,
        public string $email,
        public bool $emailVerified,
        public ?string $name,
        public ?string $avatarUrl,
    ) {}

    public static function fromSocialite(SocialiteUser $user): self
    {
        /** @var array<string, mixed> $raw */
        $raw = method_exists($user, 'getRaw') ? $user->getRaw() : [];

        // userinfo v3 uses "email_verified", the older v2 endpoint "verified_email".
        $verified = $raw['email_verified'] ?? $raw['verified_email'] ?? false;

        return new self(
            id: (string) $user->getId(),
            email: strtolower((string) $user->getEmail()),
            emailVerified: $verified === true || $verified === 'true',
            name: $user->getName(),
            avatarUrl: $user->getAvatar(),
        );
    }

    public function domain(): string
    {
        return substr($this->email, (int) strrpos($this->email, '@') + 1);
    }
}

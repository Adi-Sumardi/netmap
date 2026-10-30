<?php

declare(strict_types=1);

namespace App\Exceptions;

use App\Enums\LoginRejection;
use RuntimeException;

final class LoginRejectedException extends RuntimeException
{
    public function __construct(
        public readonly LoginRejection $reason,
        public readonly string $email,
    ) {
        parent::__construct("Google sign-in rejected ({$reason->value}) for {$email}");
    }
}

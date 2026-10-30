<?php

declare(strict_types=1);

namespace App\Enums;

enum UserStatus: string
{
    case Invited = 'invited';
    case Active = 'active';
    case Disabled = 'disabled';

    public function label(): string
    {
        return match ($this) {
            self::Invited => 'Diundang',
            self::Active => 'Aktif',
            self::Disabled => 'Nonaktif',
        };
    }
}

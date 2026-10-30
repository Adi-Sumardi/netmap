<?php

declare(strict_types=1);

namespace App\Exceptions;

final class UserChangeForbiddenException extends NetmapException
{
    public static function self(): self
    {
        return new self('Kamu tidak bisa mengubah peran atau menonaktifkan akunmu sendiri.');
    }

    public static function lastAdmin(): self
    {
        return new self('Harus ada minimal 1 admin aktif. Tambahkan admin lain dulu.');
    }

    public static function deleteSignedIn(): self
    {
        return new self('Akun yang sudah pernah login tidak bisa dihapus. Nonaktifkan saja.');
    }

    public function errorCode(): string
    {
        return 'user_change_forbidden';
    }
}

<?php

declare(strict_types=1);

namespace App\Actions\Users;

use App\Enums\Role;
use App\Enums\UserStatus;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class CreateUser
{
    public function handle(string $email, Role $role, ?string $name, User $actor): User
    {
        return DB::transaction(function () use ($email, $role, $name, $actor): User {
            $user = User::create([
                'email' => $email,
                'name' => $name,
                'status' => UserStatus::Invited,
            ]);
            $user->assignRole($role->value);

            AuditLog::record(
                action: 'user.invited',
                user: $actor,
                target: $user->email,
                after: ['role' => $role->value],
            );

            return $user;
        });
    }
}

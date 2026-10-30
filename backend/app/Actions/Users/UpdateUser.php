<?php

declare(strict_types=1);

namespace App\Actions\Users;

use App\Enums\Role;
use App\Enums\UserStatus;
use App\Exceptions\UserChangeForbiddenException;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class UpdateUser
{
    /**
     * $enabled = false disables the account, true re-enables it.
     */
    public function handle(User $user, User $actor, ?Role $role = null, ?bool $enabled = null, ?string $name = null): User
    {
        $currentRole = $user->primaryRole();
        $changesRole = $role !== null && $role !== $currentRole;
        $disables = $enabled === false && ! $user->isDisabled();

        if ($user->is($actor) && ($changesRole || $disables)) {
            throw UserChangeForbiddenException::self();
        }

        if ($currentRole === Role::Admin && ($changesRole || $disables)
            && User::query()->activeAdmins()->whereKeyNot($user->getKey())->doesntExist()) {
            throw UserChangeForbiddenException::lastAdmin();
        }

        $before = $this->snapshot($user);

        DB::transaction(function () use ($user, $role, $changesRole, $enabled, $name): void {
            if ($changesRole) {
                $user->syncRoles([$role->value]);
            }

            if ($enabled === false) {
                $user->status = UserStatus::Disabled;
            } elseif ($enabled === true && $user->isDisabled()) {
                $user->status = $user->google_id === null ? UserStatus::Invited : UserStatus::Active;
            }

            if ($name !== null) {
                $user->name = $name;
            }

            $user->save();
        });

        if ($disables) {
            $user->revokeSessions();
        }

        $user->unsetRelation('roles');

        AuditLog::record(
            action: 'user.updated',
            user: $actor,
            target: $user->email,
            before: $before,
            after: $this->snapshot($user),
        );

        return $user;
    }

    /**
     * @return array<string, string|null>
     */
    private function snapshot(User $user): array
    {
        return [
            'role' => $user->primaryRole()?->value,
            'status' => $user->status->value,
            'name' => $user->name,
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Actions\Users;

use App\Exceptions\UserChangeForbiddenException;
use App\Models\AuditLog;
use App\Models\User;

/**
 * Only invitations that were never used can be removed; signed-in accounts are disabled instead,
 * so their audit trail keeps pointing at a real user.
 */
final class DeleteUser
{
    public function handle(User $user, User $actor): void
    {
        if ($user->is($actor)) {
            throw UserChangeForbiddenException::self();
        }

        if ($user->google_id !== null) {
            throw UserChangeForbiddenException::deleteSignedIn();
        }

        $email = $user->email;
        $user->delete();

        AuditLog::record(action: 'user.invitation_removed', user: $actor, target: $email);
    }
}

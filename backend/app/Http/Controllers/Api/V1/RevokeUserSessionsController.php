<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\UserChangeForbiddenException;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class RevokeUserSessionsController extends Controller
{
    public function __invoke(Request $request, User $user): JsonResponse
    {
        if ($user->is($request->user())) {
            throw UserChangeForbiddenException::self();
        }

        $user->revokeSessions();

        AuditLog::record(action: 'user.sessions_revoked', user: $request->user(), target: $user->email);

        return response()->json(['message' => "Semua sesi {$user->email} sudah diputus."]);
    }
}

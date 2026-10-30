<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Console\Commands\EmergencyLoginCommand;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

/**
 * One-time sign-in link created by `php artisan netmap:emergency-login` for when Google is unreachable.
 */
final class EmergencyLoginController extends Controller
{
    public function __invoke(Request $request, string $nonce): RedirectResponse
    {
        $userId = Cache::pull(EmergencyLoginCommand::cacheKey($nonce));
        $user = $userId === null ? null : User::query()->find($userId);

        abort_if($user === null || $user->isDisabled() || ! $user->hasRole(Role::Admin->value), 410, 'Link login darurat sudah tidak berlaku.');

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        AuditLog::record(action: 'auth.emergency_login', user: $user, target: $user->email);

        return redirect()->away(config('netmap.frontend_url').$user->homePath());
    }
}

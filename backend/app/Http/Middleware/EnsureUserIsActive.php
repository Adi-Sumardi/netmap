<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

final class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof User && $user->isDisabled()) {
            if ($request->hasSession()) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
            }

            throw new AuthenticationException;
        }

        return $next($request);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\AuthenticateGoogleUser;
use App\Data\GoogleProfile;
use App\Enums\LoginRejection;
use App\Enums\Role;
use App\Exceptions\LoginRejectedException;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;
use LogicException;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirect;
use Throwable;

final class GoogleAuthController extends Controller
{
    public function redirect(): SymfonyRedirect
    {
        $google = Socialite::driver('google');

        if (! $google instanceof AbstractProvider) {
            throw new LogicException('The google Socialite driver must be an OAuth2 provider.');
        }

        return $google
            ->scopes(['openid', 'email', 'profile'])
            ->with(['prompt' => 'select_account'])
            ->redirect();
    }

    public function callback(Request $request, AuthenticateGoogleUser $authenticate): RedirectResponse
    {
        try {
            $profile = GoogleProfile::fromSocialite(Socialite::driver('google')->user());
        } catch (Throwable $e) {
            report($e);

            return $this->toLogin(LoginRejection::OauthFailed);
        }

        try {
            $user = $authenticate->handle($profile, $request->ip());
        } catch (LoginRejectedException $e) {
            return $this->toLogin($e->reason, $e->email);
        }

        Auth::guard('web')->login($user, remember: $user->primaryRole() === Role::CctvViewer);
        $request->session()->regenerate();

        return redirect()->away(config('netmap.frontend_url').$user->homePath());
    }

    private function toLogin(LoginRejection $reason, ?string $email = null): RedirectResponse
    {
        $query = http_build_query(array_filter(['error' => $reason->value, 'email' => $email]));

        return redirect()->away(config('netmap.frontend_url').'/login?'.$query);
    }
}

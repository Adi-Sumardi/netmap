<?php

declare(strict_types=1);

use App\Enums\Role;
use App\Enums\UserStatus;
use App\Models\AuditLog;
use App\Models\User;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;
use Laravel\Socialite\Two\User as SocialiteUser;

/**
 * @param  array<string, mixed>  $raw
 */
function fakeGoogle(array $raw = []): void
{
    $raw = array_merge([
        'sub' => 'google-123',
        'email' => 'teknisi@gmail.com',
        'email_verified' => true,
        'name' => 'Teknisi Jaringan',
        'picture' => 'https://lh3.googleusercontent.com/a/avatar',
    ], $raw);

    $user = (new SocialiteUser)->setRaw($raw)->map([
        'id' => $raw['sub'],
        'email' => $raw['email'],
        'name' => $raw['name'],
        'avatar' => $raw['picture'],
    ]);

    $provider = Mockery::mock(GoogleProvider::class);
    $provider->shouldReceive('user')->andReturn($user);
    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);
}

it('signs in an allowlisted email on first login and activates it', function () {
    $user = User::factory()->withRole(Role::Technician)->create(['email' => 'Teknisi@Gmail.com']);
    fakeGoogle();

    $this->get('/auth/google/callback')->assertRedirect('http://netmap.test/');

    $this->assertAuthenticatedAs($user);
    expect($user->fresh())
        ->status->toBe(UserStatus::Active)
        ->google_id->toBe('google-123')
        ->name->toBe('Teknisi Jaringan');
    expect(AuditLog::query()->where('action', 'auth.first_login')->exists())->toBeTrue();
});

it('sends cctv viewers to the cctv screen', function () {
    User::factory()->withRole(Role::CctvViewer)->create(['email' => 'teknisi@gmail.com']);
    fakeGoogle();

    $this->get('/auth/google/callback')->assertRedirect('http://netmap.test/cctv');
});

it('rejects an email that is not on the allowlist and does not create a user', function () {
    fakeGoogle(['email' => 'orang.asing@gmail.com']);

    $this->get('/auth/google/callback')
        ->assertRedirect('http://netmap.test/login?error=not_registered&email=orang.asing%40gmail.com');

    $this->assertGuest();
    expect(User::query()->count())->toBe(0);
    expect(AuditLog::query()->where('action', 'auth.login_rejected')->value('target'))->toBe('orang.asing@gmail.com');
});

it('rejects a disabled account', function () {
    User::factory()->disabled()->withRole(Role::Technician)->create(['email' => 'teknisi@gmail.com', 'google_id' => 'google-123']);
    fakeGoogle();

    $this->get('/auth/google/callback')->assertRedirect('http://netmap.test/login?error=disabled&email=teknisi%40gmail.com');
    $this->assertGuest();
});

it('rejects an unverified google email', function () {
    User::factory()->withRole(Role::Technician)->create(['email' => 'teknisi@gmail.com']);
    fakeGoogle(['email_verified' => false]);

    $this->get('/auth/google/callback')->assertRedirect('http://netmap.test/login?error=unverified&email=teknisi%40gmail.com');
    $this->assertGuest();
});

it('rejects a different google account using an email that was already claimed', function () {
    User::factory()->active()->withRole(Role::Admin)->create(['email' => 'teknisi@gmail.com', 'google_id' => 'google-original']);
    fakeGoogle(['sub' => 'google-other']);

    $this->get('/auth/google/callback')->assertRedirect('http://netmap.test/login?error=not_registered&email=teknisi%40gmail.com');
    $this->assertGuest();
});

it('enforces the optional workspace domain list', function () {
    config(['netmap.google_allowed_domains' => ['kantor.co.id']]);
    User::factory()->withRole(Role::Technician)->create(['email' => 'teknisi@gmail.com']);
    fakeGoogle();

    $this->get('/auth/google/callback')->assertRedirect('http://netmap.test/login?error=not_registered&email=teknisi%40gmail.com');
});

it('reports oauth failures without leaking details', function () {
    $provider = Mockery::mock(GoogleProvider::class);
    $provider->shouldReceive('user')->andThrow(new RuntimeException('invalid state'));
    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $this->get('/auth/google/callback')->assertRedirect('http://netmap.test/login?error=oauth_failed');
});

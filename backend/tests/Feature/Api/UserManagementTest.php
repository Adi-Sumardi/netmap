<?php

declare(strict_types=1);

use App\Enums\Role;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Support\Facades\DB;

function admin(): User
{
    return User::factory()->active()->withRole(Role::Admin)->create();
}

it('returns 401 json for guests', function () {
    $this->getJson('/api/v1/me')->assertUnauthorized()->assertJson(['code' => 'unauthenticated']);
});

it('returns the current user with permissions', function () {
    $user = User::factory()->active()->withRole(Role::CctvViewer)->create();

    $this->actingAs($user)->getJson('/api/v1/me')
        ->assertOk()
        ->assertJsonPath('data.role', 'cctv_viewer')
        ->assertJsonPath('data.permissions', ['view-cctv'])
        ->assertJsonPath('data.home_path', '/cctv');
});

it('lets an admin add an email to the allowlist', function () {
    $this->actingAs(admin())->postJson('/api/v1/users', ['email' => ' Baru@Gmail.com ', 'role' => 'technician'])
        ->assertCreated()
        ->assertJsonPath('data.email', 'baru@gmail.com')
        ->assertJsonPath('data.status', 'invited')
        ->assertJsonPath('data.role', 'technician');

    expect(User::query()->whereEmail('baru@gmail.com')->first()->hasRole('technician'))->toBeTrue();
});

it('rejects duplicate emails case-insensitively', function () {
    User::factory()->create(['email' => 'ada@gmail.com']);

    $this->actingAs(admin())->postJson('/api/v1/users', ['email' => 'ADA@gmail.com', 'role' => 'technician'])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'validation_failed')
        ->assertJsonValidationErrors('email');
});

it('forbids non-admins from managing users', function () {
    $tech = User::factory()->active()->withRole(Role::Technician)->create();

    $this->actingAs($tech)->getJson('/api/v1/users')->assertForbidden()->assertJson(['code' => 'forbidden']);
});

it('disables a user and revokes their sessions', function () {
    $target = User::factory()->active()->withRole(Role::Technician)->create();
    DB::table('sessions')->insert(['id' => 'abc', 'user_id' => $target->id, 'payload' => '', 'last_activity' => time()]);

    $this->actingAs(admin())->patchJson("/api/v1/users/{$target->id}", ['enabled' => false])
        ->assertOk()
        ->assertJsonPath('data.status', 'disabled');

    expect(DB::table('sessions')->where('user_id', $target->id)->exists())->toBeFalse();
});

it('re-enables a disabled user to active, or invited if they never signed in', function () {
    $signedIn = User::factory()->disabled()->withRole(Role::Technician)->create();
    $neverSignedIn = User::factory()->withRole(Role::Technician)->create(['status' => UserStatus::Disabled]);
    $admin = admin();

    $this->actingAs($admin)->patchJson("/api/v1/users/{$signedIn->id}", ['enabled' => true])->assertJsonPath('data.status', 'active');
    $this->actingAs($admin)->patchJson("/api/v1/users/{$neverSignedIn->id}", ['enabled' => true])->assertJsonPath('data.status', 'invited');
});

it('does not let an admin disable or demote themselves', function () {
    $admin = admin();
    admin();

    $this->actingAs($admin)->patchJson("/api/v1/users/{$admin->id}", ['enabled' => false])
        ->assertStatus(409)->assertJsonPath('code', 'user_change_forbidden');
    $this->actingAs($admin)->patchJson("/api/v1/users/{$admin->id}", ['role' => 'technician'])
        ->assertStatus(409);
});

it('keeps at least one active admin', function () {
    $admin = admin();
    $otherAdmin = admin();
    $otherAdmin->update(['status' => UserStatus::Disabled]);
    $invitedAdmin = User::factory()->withRole(Role::Admin)->create();

    // Disabling the invited admin is fine: $admin stays.
    $this->actingAs($admin)->patchJson("/api/v1/users/{$invitedAdmin->id}", ['enabled' => false])->assertOk();

    $tech = User::factory()->active()->withRole(Role::Technician)->create();
    $tech->syncRoles(['admin']);
    $this->actingAs($tech)->patchJson("/api/v1/users/{$admin->id}", ['role' => 'technician'])->assertOk();
    $this->actingAs($tech->fresh())->patchJson("/api/v1/users/{$tech->id}", ['enabled' => false])->assertStatus(409);
});

it('blocks a disabled user that still has a session', function () {
    $user = User::factory()->disabled()->withRole(Role::Technician)->create();

    $this->actingAs($user)->getJson('/api/v1/me')->assertUnauthorized();
});

it('only deletes invitations that were never used', function () {
    $admin = admin();
    $invited = User::factory()->withRole(Role::Technician)->create();
    $active = User::factory()->active()->withRole(Role::Technician)->create();

    $this->actingAs($admin)->deleteJson("/api/v1/users/{$invited->id}")->assertOk();
    $this->actingAs($admin)->deleteJson("/api/v1/users/{$active->id}")->assertStatus(409);
    expect(User::query()->find($invited->id))->toBeNull();
});

it('creates a single-use emergency login link for admins', function () {
    $admin = admin();

    $this->artisan('netmap:emergency-login', ['email' => $admin->email])->assertSuccessful();

    $tech = User::factory()->active()->withRole(Role::Technician)->create();
    $this->artisan('netmap:emergency-login', ['email' => $tech->email])->assertFailed();
});

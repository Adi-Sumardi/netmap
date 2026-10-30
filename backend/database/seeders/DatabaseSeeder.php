<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\Role;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Seeder;

final class DatabaseSeeder extends Seeder
{
    /**
     * Required data only. Demo data lives in DemoSeeder and is never run in production.
     */
    public function run(): void
    {
        $this->call(RolesAndPermissionsSeeder::class);

        $email = config('netmap.initial_admin_email');

        if (! is_string($email) || $email === '') {
            $this->command?->warn('NETMAP_INITIAL_ADMIN_EMAIL is empty: no admin added to the allowlist.');

            return;
        }

        $admin = User::query()->whereEmail($email)->first()
            ?? User::create(['email' => $email, 'status' => UserStatus::Invited]);

        $admin->assignRole(Role::Admin->value);

        $this->command?->info("Admin allowlisted: {$admin->email}");
    }
}

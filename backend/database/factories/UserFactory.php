<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\Role;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
final class UserFactory extends Factory
{
    /**
     * An allowlisted email that has not signed in yet.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'email' => fake()->unique()->userName().'@gmail.com',
            'name' => null,
            'google_id' => null,
            'avatar_url' => null,
            'status' => UserStatus::Invited,
        ];
    }

    public function active(): static
    {
        return $this->state(fn () => [
            'name' => fake()->name(),
            'google_id' => 'g-'.Str::random(16),
            'status' => UserStatus::Active,
            'last_login_at' => now(),
        ]);
    }

    public function disabled(): static
    {
        return $this->active()->state(fn () => ['status' => UserStatus::Disabled]);
    }

    public function withRole(Role $role): static
    {
        return $this->afterCreating(fn (User $user) => $user->assignRole($role->value));
    }
}

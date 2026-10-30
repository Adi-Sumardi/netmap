<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Role;
use App\Enums\UserStatus;
use Carbon\CarbonImmutable;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $email
 * @property string|null $name
 * @property string|null $google_id
 * @property string|null $avatar_url
 * @property UserStatus $status
 * @property CarbonImmutable|null $last_login_at
 * @property string|null $last_login_ip
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['email', 'name', 'google_id', 'avatar_url', 'status', 'last_login_at', 'last_login_ip'])]
#[Hidden(['google_id', 'remember_token'])]
final class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => UserStatus::class,
            'last_login_at' => 'immutable_datetime',
        ];
    }

    /**
     * @return Attribute<string, string>
     */
    protected function email(): Attribute
    {
        return Attribute::make(set: fn (string $value) => Str::lower(trim($value)));
    }

    /**
     * @param  Builder<self>  $query
     */
    public function scopeWhereEmail(Builder $query, string $email): void
    {
        $query->whereRaw('lower(email) = ?', [Str::lower(trim($email))]);
    }

    /**
     * @param  Builder<self>  $query
     */
    public function scopeActiveAdmins(Builder $query): void
    {
        $query->where('status', '!=', UserStatus::Disabled->value)->role(Role::Admin->value);
    }

    public function isDisabled(): bool
    {
        return $this->status === UserStatus::Disabled;
    }

    public function primaryRole(): ?Role
    {
        $name = $this->getRoleNames()->first();

        return $name === null ? null : Role::tryFrom($name);
    }

    /**
     * Where the frontend should land after sign-in.
     */
    public function homePath(): string
    {
        return $this->primaryRole() === Role::CctvViewer ? '/cctv' : '/';
    }

    public function revokeSessions(): void
    {
        DB::table('sessions')->where('user_id', $this->getKey())->delete();
        $this->forceFill(['remember_token' => null])->saveQuietly();
    }
}

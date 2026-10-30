<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

#[Fillable(['user_id', 'action', 'target', 'ip', 'before', 'after', 'meta'])]
final class AuditLog extends Model
{
    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'before' => 'array',
            'after' => 'array',
            'meta' => 'array',
            'created_at' => 'immutable_datetime',
        ];
    }

    protected static function booted(): void
    {
        // Audit entries are append-only.
        self::updating(fn () => throw new LogicException('Audit logs cannot be modified.'));
        self::deleting(fn () => throw new LogicException('Audit logs cannot be deleted.'));
    }

    /**
     * @param  array<string, mixed>|null  $meta
     * @param  array<string, mixed>|null  $before
     * @param  array<string, mixed>|null  $after
     */
    public static function record(
        string $action,
        ?User $user = null,
        ?string $target = null,
        ?array $meta = null,
        ?array $before = null,
        ?array $after = null,
        ?string $ip = null,
    ): self {
        return self::create([
            'user_id' => $user?->getKey(),
            'action' => $action,
            'target' => $target,
            'ip' => $ip ?? request()->ip(),
            'before' => $before,
            'after' => $after,
            'meta' => $meta,
        ]);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

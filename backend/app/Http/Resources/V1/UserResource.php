<?php

declare(strict_types=1);

namespace App\Http\Resources\V1;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
final class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $role = $this->primaryRole();

        return [
            'id' => $this->id,
            'email' => $this->email,
            'name' => $this->name,
            'avatar_url' => $this->avatar_url,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'role' => $role?->value,
            'role_label' => $role?->label(),
            'role_description' => $role?->description(),
            'has_signed_in' => $this->google_id !== null,
            'last_login_at' => $this->last_login_at?->toIso8601ZuluString(),
            'is_self' => $request->user()?->is($this->resource) ?? false,
            'created_at' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}

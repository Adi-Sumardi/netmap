<?php

declare(strict_types=1);

namespace App\Http\Resources\V1;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
final class MeResource extends JsonResource
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
            'role' => $role?->value,
            'role_label' => $role?->label(),
            'roles' => $this->getRoleNames()->values(),
            'permissions' => $this->getAllPermissions()->pluck('name')->values(),
            'home_path' => $this->homePath(),
        ];
    }
}

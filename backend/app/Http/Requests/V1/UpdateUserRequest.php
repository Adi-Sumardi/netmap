<?php

declare(strict_types=1);

namespace App\Http\Requests\V1;

use App\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateUserRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'role' => ['sometimes', Rule::enum(Role::class)],
            'enabled' => ['sometimes', 'boolean'],
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'role.enum' => 'Peran tidak dikenal.',
            'enabled.boolean' => 'Nilai aktif/nonaktif tidak valid.',
        ];
    }

    public function role(): ?Role
    {
        return $this->has('role') ? Role::from((string) $this->validated('role')) : null;
    }

    public function enabled(): ?bool
    {
        return $this->has('enabled') ? $this->boolean('enabled') : null;
    }
}

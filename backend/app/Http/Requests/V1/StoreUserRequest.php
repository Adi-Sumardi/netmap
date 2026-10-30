<?php

declare(strict_types=1);

namespace App\Http\Requests\V1;

use App\Enums\Role;
use App\Models\User;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

final class StoreUserRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => Str::lower(trim((string) $this->input('email'))),
            'name' => $this->filled('name') ? trim((string) $this->input('name')) : null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email' => [
                'required', 'email:rfc', 'max:255',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (User::query()->whereEmail((string) $value)->exists()) {
                        $fail('Email ini sudah ada di daftar akses.');
                    }
                },
            ],
            'role' => ['required', Rule::enum(Role::class)],
            'name' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Email Google wajib diisi.',
            'email.email' => 'Format email belum benar.',
            'role.required' => 'Pilih peran.',
            'role.enum' => 'Peran tidak dikenal.',
        ];
    }

    public function role(): Role
    {
        return Role::from((string) $this->validated('role'));
    }
}

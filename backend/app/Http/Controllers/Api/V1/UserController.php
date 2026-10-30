<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\Users\CreateUser;
use App\Actions\Users\DeleteUser;
use App\Actions\Users\UpdateUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\StoreUserRequest;
use App\Http\Requests\V1\UpdateUserRequest;
use App\Http\Resources\V1\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * The Google sign-in allowlist (Pengaturan → Pengguna & akses).
 */
final class UserController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $users = User::query()
            ->with('roles')
            ->orderByRaw("CASE status WHEN 'active' THEN 0 WHEN 'invited' THEN 1 ELSE 2 END")
            ->orderBy('email')
            ->get();

        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request, CreateUser $createUser): JsonResponse
    {
        $user = $createUser->handle(
            email: (string) $request->validated('email'),
            role: $request->role(),
            name: $request->validated('name'),
            actor: $request->user(),
        );

        return UserResource::make($user->load('roles'))
            ->additional(['message' => "{$user->email} ditambahkan. Sekarang bisa masuk dengan Google."])
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateUserRequest $request, User $user, UpdateUser $updateUser): UserResource
    {
        $user = $updateUser->handle(
            user: $user,
            actor: $request->user(),
            role: $request->role(),
            enabled: $request->enabled(),
            name: $request->has('name') ? $request->validated('name') : null,
        );

        $message = match ($request->enabled()) {
            false => "{$user->email} dinonaktifkan dan semua sesinya diputus.",
            true => "{$user->email} diaktifkan lagi.",
            null => 'Perubahan disimpan.',
        };

        return UserResource::make($user->load('roles'))->additional(['message' => $message]);
    }

    public function destroy(Request $request, User $user, DeleteUser $deleteUser): JsonResponse
    {
        $deleteUser->handle($user, $request->user());

        return response()->json(['message' => 'Undangan dihapus.']);
    }
}

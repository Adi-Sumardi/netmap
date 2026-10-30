<?php

declare(strict_types=1);

use App\Enums\Permission;
use App\Http\Controllers\Api\V1\LogoutController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\RevokeUserSessionsController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('v1.')->middleware(['auth:sanctum', 'active'])->group(function () {
    Route::get('me', MeController::class)->name('me');
    Route::post('auth/logout', LogoutController::class)->name('auth.logout');

    Route::middleware('can:'.Permission::ManageUsers->value)->group(function () {
        Route::apiResource('users', UserController::class)->except('show');
        Route::post('users/{user}/revoke-sessions', RevokeUserSessionsController::class)->name('users.revoke-sessions');
    });
});

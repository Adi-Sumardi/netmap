<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\EmergencyLoginController;
use App\Http\Controllers\Auth\GoogleAuthController;
use Illuminate\Support\Facades\Route;

// The UI is the Next.js app. Laravel only serves the sign-in redirects here.
Route::prefix('auth')->name('auth.')->middleware('throttle:10,1')->group(function () {
    Route::get('google/redirect', [GoogleAuthController::class, 'redirect'])->name('google.redirect');
    Route::get('google/callback', [GoogleAuthController::class, 'callback'])->name('google.callback');
    Route::get('emergency/{nonce}', EmergencyLoginController::class)->middleware('signed:relative')->name('emergency');
});

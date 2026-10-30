<?php

declare(strict_types=1);

use App\Enums\UserStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Users are an allowlist for Google sign-in: no password columns.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->string('name')->nullable();
            $table->string('google_id')->nullable()->unique();
            $table->string('avatar_url', 1024)->nullable();
            $table->string('status', 20)->default(UserStatus::Invited->value)->index();
            $table->rememberToken();
            $table->timestampTz('last_login_at')->nullable();
            $table->ipAddress('last_login_ip')->nullable();
            $table->timestampsTz();
        });

        DB::statement('CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email))');

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('users');
    }
};

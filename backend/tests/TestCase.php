<?php

declare(strict_types=1);

namespace Tests;

use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected bool $seed = true;

    protected string $seeder = RolesAndPermissionsSeeder::class;
}

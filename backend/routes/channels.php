<?php

declare(strict_types=1);

use App\Enums\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('netmap', fn (User $user) => $user->can(Permission::ViewNetwork->value));

Broadcast::channel('segment.{segmentId}', fn (User $user) => $user->can(Permission::ViewNetwork->value));

Broadcast::channel('cctv', fn (User $user) => $user->can(Permission::ViewCctv->value));

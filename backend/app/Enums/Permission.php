<?php

declare(strict_types=1);

namespace App\Enums;

enum Permission: string
{
    case ViewNetwork = 'view-network';
    case ManageDevices = 'manage-devices';
    case ManageReservations = 'manage-reservations';
    case ResolveConflicts = 'resolve-conflicts';
    case ViewCctv = 'view-cctv';
    case MikrotikWrite = 'mikrotik-write';
    case ManageSettings = 'manage-settings';
    case ManageUsers = 'manage-users';
}

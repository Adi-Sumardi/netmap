<?php

declare(strict_types=1);

namespace App\Enums;

enum Role: string
{
    case Admin = 'admin';
    case Technician = 'technician';
    case CctvViewer = 'cctv_viewer';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::Technician => 'Teknisi',
            self::CctvViewer => 'Viewer CCTV',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Admin => 'Semua, termasuk ubah MikroTik',
            self::Technician => 'Perangkat, reservasi, konflik',
            self::CctvViewer => 'Hanya Live CCTV',
        };
    }

    /**
     * @return list<Permission>
     */
    public function permissions(): array
    {
        return match ($this) {
            self::Admin => Permission::cases(),
            self::Technician => [
                Permission::ViewNetwork,
                Permission::ManageDevices,
                Permission::ManageReservations,
                Permission::ResolveConflicts,
                Permission::ViewCctv,
            ],
            self::CctvViewer => [Permission::ViewCctv],
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(fn (self $role) => $role->value, self::cases());
    }
}

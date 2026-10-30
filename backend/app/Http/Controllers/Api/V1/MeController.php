<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\MeResource;
use Illuminate\Http\Request;

final class MeController extends Controller
{
    public function __invoke(Request $request): MeResource
    {
        return MeResource::make($request->user());
    }
}

<?php

declare(strict_types=1);

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * Business-rule errors. Rendered as {"message", "code"} (see rules/api.md).
 */
abstract class NetmapException extends RuntimeException
{
    abstract public function errorCode(): string;

    public function status(): int
    {
        return 409;
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'code' => $this->errorCode(),
        ], $this->status());
    }
}

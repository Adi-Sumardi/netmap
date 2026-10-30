<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Reason codes sent to the frontend as /login?error=<value>.
 */
enum LoginRejection: string
{
    case NotRegistered = 'not_registered';
    case Disabled = 'disabled';
    case Unverified = 'unverified';
    case OauthFailed = 'oauth_failed';
}

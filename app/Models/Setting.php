<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
    ];

    /**
     * Cast the value attribute based on the type field.
     */
    protected function value(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                if ($value === null) {
                    return null;
                }

                if ($this->type === 'boolean') {
                    return (bool) $value;
                }

                if ($this->type === 'integer') {
                    return (int) $value;
                }

                if ($this->type === 'json' && $value) {
                    // If it's already an array, return it (happens when accessed after setValue)
                    if (is_array($value)) {
                        return $value;
                    }

                    // Otherwise try to decode JSON string
                    try {
                        return json_decode($value, true, 512, JSON_THROW_ON_ERROR);
                    } catch (\JsonException $e) {
                        // Return original string if invalid JSON
                        return $value;
                    }
                }

                return $value;
            },
            set: function ($value) {
                if ($value === null) {
                    return null;
                }

                if ($this->type === 'json' && is_array($value)) {
                    return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                }

                return $value;
            }
        );
    }
}

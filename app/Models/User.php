<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens;
    use HasFactory;
    use Notifiable;

    public const ROLE_ADMIN = 'admin';
    public const ROLE_USER = 'user';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'email_preferences',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'email_verified_at',
        'created_at',
        'updated_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'email_preferences' => 'array',
    ];

    /**
     * The attributes that should be appended.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'avatar'
    ];

    /**
     * Get the user's avatar.
     *
     * @return string
     */
    public function getAvatarAttribute()
    {
        return 'https://www.gravatar.com/avatar/' . md5($this->email) . '?s=56&d=mm';
    }

    public function scopeAdmin($query)
    {
        return $query->where('role', 'admin');
    }

    public function posts()
    {
        return $this->hasMany(Post::class, 'created_by');
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isSubscribedToComments()
    {
        return $this->email_preferences['comments'] ?? false;
    }

    public function isSubscribedToStatusUpdates()
    {
        return $this->email_preferences['status_updates'] ?? false;
    }
}

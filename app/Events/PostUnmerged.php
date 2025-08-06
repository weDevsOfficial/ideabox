<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Post;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PostUnmerged
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public Post $sourcePost;
    public Post $targetPost;
    public User $user;

    /**
     * Create a new event instance.
     */
    public function __construct(Post $sourcePost, Post $targetPost, User $user)
    {
        $this->sourcePost = $sourcePost;
        $this->targetPost = $targetPost;
        $this->user = $user;
    }
}

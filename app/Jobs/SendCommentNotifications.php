<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Post;
use App\Models\Comment;
use App\Models\User;
use App\Notifications\CommentNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class SendCommentNotifications implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * Create a new job instance.
     */
    public function __construct(
        protected Post $post,
        protected Comment $comment,
        protected Collection $userIds
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Ensure post has all needed relationships loaded
        if (!$this->post->relationLoaded('board') || !$this->post->relationLoaded('status')) {
            $this->post->load(['board', 'status']);
        }

        // Ensure comment has user loaded
        if (!$this->comment->relationLoaded('user')) {
            $this->comment->load('user');
        }

        // Process user IDs in smaller chunks to avoid memory issues
        $this->userIds->chunk(20)->each(function ($chunk) {
            try {
                // Fetch users in this chunk
                $users = User::whereIn('id', $chunk)->get();

                if ($users->isEmpty()) {
                    return;
                }

                // Send notifications using the batch method
                Notification::send($users, new CommentNotification($this->post, $this->comment));
            } catch (\Throwable $e) {
                // Log the error but continue processing other chunks
                Log::error('Failed to send comment notifications to user batch', [
                    'error' => $e->getMessage(),
                    'post_id' => $this->post->id,
                    'comment_id' => $this->comment->id,
                    'user_count' => count($chunk),
                ]);
            }
        });
    }
}

<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Post;
use App\Models\Comment;
use App\Notifications\CommentNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
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
     * The chunk size for processing subscriptions.
     *
     * @var int
     */
    protected int $chunkSize = 10;

    /**
     * Create a new job instance.
     */
    public function __construct(
        protected Post $post,
        protected Comment $comment
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $this->loadRelationships();

        // Process subscribed users in chunks
        $this->post->subscriptions()
            ->with('user')
            ->chunk($this->chunkSize, function ($subscriptions) {
                try {
                    // Map subscriptions to users and filter out nulls
                    $users = $subscriptions->map->user->filter();

                    if ($users->isEmpty()) {
                        return;
                    }

                    // Filter out the user who made the comment, or users who turned off notifications
                    $eligibleUsers = $users->reject(
                        fn ($user) =>
                        $user->id === $this->comment->user_id ||
                        !$user->isSubscribedToComments()
                    );

                    if ($eligibleUsers->isEmpty()) {
                        return;
                    }

                    // Send notifications using the batch method
                    Notification::send($eligibleUsers, new CommentNotification($this->post, $this->comment));
                } catch (\Throwable $e) {
                    // Log the error but continue processing other chunks
                    Log::error('Failed to send comment notifications', [
                        'error' => $e->getMessage(),
                        'post_id' => $this->post->id,
                        'comment_id' => $this->comment->id,
                        'subscription_count' => $subscriptions->count(),
                        'exception_class' => get_class($e),
                        'exception_trace' => $e->getTraceAsString(),
                    ]);
                }
            });
    }

    /**
     * Load necessary relationships for the notification.
     */
    protected function loadRelationships(): void
    {
        // Ensure post has all needed relationships loaded
        if (!$this->post->relationLoaded('board') || !$this->post->relationLoaded('status')) {
            $this->post->load(['board', 'status']);
        }

        // Ensure comment has user loaded
        if (!$this->comment->relationLoaded('user')) {
            $this->comment->load('user');
        }
    }
}

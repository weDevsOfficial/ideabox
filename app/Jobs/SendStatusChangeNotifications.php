<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Post;
use App\Notifications\FeedbackStatusChanged;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class SendStatusChangeNotifications implements ShouldQueue
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
        protected Post $post
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

                    // Filter out users who turned off status change notifications
                    $eligibleUsers = $users->filter(
                        fn ($user) =>
                        $user->isSubscribedToStatusUpdates()
                    );

                    if ($eligibleUsers->isEmpty()) {
                        return;
                    }

                    Notification::send($eligibleUsers, new FeedbackStatusChanged($this->post));
                } catch (\Throwable $e) {
                    // Log the error but continue processing other chunks
                    Log::error('Failed to send status change notifications', [
                        'error' => $e->getMessage(),
                        'post_id' => $this->post->id,
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
    }
}

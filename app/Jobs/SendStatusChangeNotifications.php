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
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

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
     * Create a new job instance.
     */
    public function __construct(
        protected Post $post,
        protected Collection $voterIds
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Process in smaller chunks to avoid memory issues
        $this->voterIds->chunk(10)->each(function ($chunk) {
            // Load users in a single query for this chunk
            $voters = $this->post->votes()
                ->whereIn('user_id', $chunk)
                ->with('user')
                ->get();

            foreach ($voters as $voter) {
                try {
                    if ($voter->user) {
                        $voter->user->notify(new FeedbackStatusChanged($this->post));
                    }
                } catch (\Throwable $e) {
                    // Log the error but continue processing other voters
                    Log::error('Failed to send status change notification', [
                        'post_id' => $this->post->id,
                        'voter_id' => $voter->user_id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        });
    }
}

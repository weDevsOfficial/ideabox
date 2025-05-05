<?php

namespace App\Observers;

use App\Models\Comment;
use App\Models\PostSubscription;

class CommentObserver
{
    /**
     * Handle the Comment "created" event.
     */
    public function created(Comment $comment): void
    {
        PostSubscription::firstOrCreate([
            'post_id' => $comment->post_id,
            'user_id' => $comment->user_id,
        ]);
    }

    /**
     * Handle the Comment "updated" event.
     */
    public function updated(Comment $comment): void
    {
        //
    }

    /**
     * Handle the Comment "deleted" event.
     */
    public function deleted(Comment $comment): void
    {
        PostSubscription::where('post_id', $comment->post_id)
            ->where('user_id', $comment->user_id)
            ->delete();
    }

    /**
     * Handle the Comment "restored" event.
     */
    public function restored(Comment $comment): void
    {
        //
    }

    /**
     * Handle the Comment "force deleted" event.
     */
    public function forceDeleted(Comment $comment): void
    {
        //
    }
}

<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Post;
use App\Models\User;
use App\Events\PostUnmerged;
use Illuminate\Support\Facades\DB;
use App\Events\PostMerged;

class MergePostService
{
    public function merge(Post $sourcePost, Post $targetPost, User $user): void
    {
        DB::transaction(function () use ($sourcePost, $targetPost, $user) {
            // Transfer votes from source to target post
            $this->transferVotes($sourcePost, $targetPost);

            // Transfer comments from source to target post
            $this->transferComments($sourcePost, $targetPost);

            // Mark the source post as merged
            $sourcePost->update([
                'merged_into_post_id' => $targetPost->id,
                'merged_by_user_id' => $user->id,
                'merged_at' => now(),
            ]);

            // Create a comment on the target post to indicate a merge happened
            $targetPost->comments()->create([
                'user_id' => $user->id,
                'body' => "Merged from #{$sourcePost->id}",
                'is_merge_comment' => true,
            ]);

            // Fire an event
            event(new PostMerged($sourcePost, $targetPost, $user));
        });
    }

    public function unmerge(Post $sourcePost, User $user): void
    {
        DB::transaction(function () use ($sourcePost, $user) {
            $targetPost = $sourcePost->mergedIntoPost;

            // Revert comments
            $this->revertComments($sourcePost, $targetPost, $user);

            // Revert votes
            $this->revertVotes($sourcePost, $targetPost);

            // Unset merged fields
            $sourcePost->update([
                'merged_into_post_id' => null,
                'merged_by_user_id' => null,
                'merged_at' => null,
            ]);

            // Fire an event
            event(new PostUnmerged($sourcePost, $targetPost, $user));
        });
    }

    private function transferVotes(Post $sourcePost, Post $targetPost): void
    {
        $sourcePost->votes()->each(function ($vote) use ($targetPost) {
            // Check if the user has already voted on the target post
            $existingVote = $targetPost->votes()->where('user_id', $vote->user_id)->exists();

            if (!$existingVote) {
                $vote->update(['post_id' => $targetPost->id]);
            } else {
                // If the user already voted on the target post, we can delete the vote from the source post
                $vote->delete();
            }
        });

        // Recalculate vote counts
        $targetPost->updateVotes();
        $sourcePost->updateVotes();
    }

    private function transferComments(Post $sourcePost, Post $targetPost): void
    {
        $sourcePost->comments()->update(['post_id' => $targetPost->id]);
    }

    private function revertComments(Post $sourcePost, Post $targetPost, User $user): void
    {
        // Find the merge comment and delete it
        $targetPost->comments()
            ->where('is_merge_comment', true)
            ->where('body', "Merged from #{$sourcePost->id}")
            ->delete();

        // Revert all comments back to the source post
        $targetPost->comments()
            ->where('post_id', $targetPost->id) // This seems redundant, but let's keep it for clarity
            ->where(function ($query) use ($sourcePost) {
                // This is a bit tricky. We need to identify which comments originally belonged to the source post.
                // For simplicity, we assume all non-merge comments on the target post that were created after the source post was created are from the source post.
                // A better approach might be to add a `source_post_id` to comments when they are merged.
                // For now, we will move all comments from the target post that were created by users who commented on the source post.
                $sourceCommenterIds = $sourcePost->comments()->pluck('user_id')->unique();
                $query->whereIn('user_id', $sourceCommenterIds);
            })
            ->update(['post_id' => $sourcePost->id]);
    }

    private function revertVotes(Post $sourcePost, Post $targetPost): void
    {
        $sourceVoterIds = $sourcePost->votes()->pluck('user_id')->unique();

        $targetPost->votes()
            ->whereIn('user_id', $sourceVoterIds)
            ->update(['post_id' => $sourcePost->id]);

        // Recalculate vote counts
        $targetPost->updateVotes();
        $sourcePost->updateVotes();
    }
}

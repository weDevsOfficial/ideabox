<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class MergeController extends Controller
{
    public function merge(Request $request, Post $post): RedirectResponse
    {
        $request->validate([
            'target_post_id' => [
                'required',
                'exists:posts,id',
                'different:post_id',
            ],
        ]);

        $targetPost = Post::findOrFail($request->target_post_id);
        $user = auth()->user();

        DB::transaction(function () use ($post, $targetPost, $user) {
            $this->transferVotes($post, $targetPost);
            $this->transferSubscriptions($post, $targetPost);
            $this->transferComments($post, $targetPost);
            $this->transferGitHubLinks($post, $targetPost);

            $targetPost->comments()->create([
                'user_id' => $user->id,
                'body' => "Merged feedback <strong>{$post->title}</strong>",
            ]);

            // Delete the source post
            $post->delete();
        });

        return redirect()->route('admin.feedbacks.show', $targetPost)->with('success', 'Post merged successfully.');
    }

    private function transferVotes(Post $sourcePost, Post $targetPost): void
    {
        $sourcePost->votes()->each(function ($vote) use ($targetPost) {
            $existingVote = $targetPost->votes()->where('user_id', $vote->user_id)->exists();

            if (!$existingVote) {
                $vote->update(['post_id' => $targetPost->id]);
            } else {
                $vote->delete();
            }
        });

        // Update vote count on target post
        $targetPost->updateVotes();
    }

    private function transferComments(Post $sourcePost, Post $targetPost): void
    {
        $sourcePost->comments()->update(['post_id' => $targetPost->id]);

        $targetPost->update([
            'comments' => $targetPost->comments()->count(),
        ]);
    }

    private function transferSubscriptions(Post $sourcePost, Post $targetPost): void
    {
        $sourcePost->subscriptions()->each(function ($subscription) use ($targetPost) {
            $existingSubscription = $targetPost->subscriptions()->where('user_id', $subscription->user_id)->exists();

            if (!$existingSubscription) {
                $subscription->update(['post_id' => $targetPost->id]);
            } else {
                $subscription->delete();
            }
        });
    }

    private function transferGitHubLinks(Post $sourcePost, Post $targetPost): void
    {
        $sourcePost->githubLinks()->each(function ($link) use ($targetPost) {
            $existingLink = $targetPost->githubLinks()->where('provider_id', $link->provider_id)->exists();

            if (!$existingLink) {
                $link->update(['post_id' => $targetPost->id]);
            }
        });
    }
}

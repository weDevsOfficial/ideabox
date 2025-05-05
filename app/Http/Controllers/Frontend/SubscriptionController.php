<?php

namespace App\Http\Controllers\Frontend;

use App\Models\Post;
use Illuminate\Http\Request;
use App\Models\PostSubscription;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\URL;

class SubscriptionController extends Controller
{
    /**
     * Toggle subscription status
     */
    public function toggle(Request $request, Post $post)
    {
        $isSubscribed = $post->subscriptions()->where('user_id', auth()->id())->exists();

        if ($isSubscribed) {
            $post->subscriptions()->where('user_id', auth()->id())->delete();
            $status = false;
        } else {
            PostSubscription::create([
                'post_id' => $post->id,
                'user_id' => auth()->id(),
            ]);
            $status = true;
        }

        if ($request->wantsJson()) {
            return response()->json(['subscribed' => $status]);
        }

        return back()->with('success', $status ? 'Subscribed successfully.' : 'Unsubscribed successfully.');
    }

    /**
     * Get subscription status
     */
    public function status(Post $post)
    {
        return response()->json([
            'subscribed' => $post->subscriptions()->where('user_id', auth()->id())->exists()
        ]);
    }

    /**
     * Handle unsubscribe from email link
     */
    public function unsubscribe(Request $request, Post $post)
    {
        if (!$request->hasValidSignature()) {
            abort(403);
        }

        $post->subscriptions()->where('user_id', $request->user_id)->delete();

        return redirect()->route('post.show', [$post->board->slug, $post->slug])
            ->with('success', 'You have been unsubscribed from notifications for this post.');
    }

    /**
     * Generate a signed unsubscribe URL
     */
    public static function generateUnsubscribeUrl(Post $post, int $userId): string
    {
        return URL::signedRoute('post.unsubscribe', [
            'post' => $post->slug,
            'user_id' => $userId
        ]);
    }
}

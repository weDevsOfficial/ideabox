<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Post;
use App\Models\Comment;
use App\Helpers\Formatting;
use Illuminate\Bus\Queueable;
use Illuminate\Support\HtmlString;
use Illuminate\Support\Facades\Log;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class CommentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * Create a new notification instance.
     */
    public function __construct(protected Post $post, protected Comment $comment)
    {
        if (!$post->relationLoaded('board')) {
            $post->load('board', 'status');
        }

        if (!$comment->relationLoaded('user')) {
            $comment->load('user');
        }
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        try {
            $statusColor = $this->post->status->color ?? '#4f46e5';
            $statusName = $this->post->status->name ?? 'Open';
            $title = htmlspecialchars($this->post->title, ENT_QUOTES, 'UTF-8');
            $titleExcerpt = Formatting::excerpt($title, 70);
            $commentBody = nl2br(htmlspecialchars(strip_tags($this->comment->body)));
            $statusBadge = "<span style=\"display: inline-block; background-color: {$statusColor}; color: white; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px;\">{$statusName}</span>";
            $emailHash = md5(strtolower(trim($this->comment->user->email ?? 'unknown')));
            $avatarUrl = "https://www.gravatar.com/avatar/{$emailHash}?s=56&d=mp";

            return (new MailMessage())
                ->subject("New Comment on: {$titleExcerpt}")
                ->greeting("Hello, {$notifiable->name}!")
                ->line("A new comment has been added to a feedback you're following:")
                ->line(new HtmlString($this->generateCommentHtml($statusBadge, $avatarUrl, $commentBody)))
                ->action('View Discussion', route('post.show', [$this->post->board, $this->post]))
                ->line("Reply to continue the conversation.");

        } catch (\Throwable $e) {
            Log::error('Error creating comment notification email', [
                'error' => $e->getMessage(),
                'post_id' => $this->post->id,
                'comment_id' => $this->comment->id,
                'notifiable_id' => $notifiable->id ?? null,
            ]);

            // Provide a fallback message
            return (new MailMessage())
                ->subject('New Comment')
                ->greeting("Hello!")
                ->line('A new comment has been added to a feedback you\'re following.')
                ->action('View Feedback', route('post.show', [$this->post->board, $this->post]))
                ->line('Thank you for using IdeaBox!');
        }
    }

    /**
     * Generate the HTML for the comment notification.
     */
    private function generateCommentHtml(string $statusBadge, string $avatarUrl, string $commentBody): string
    {
        $titleSection = "<h2 style=\"margin-top: 0; font-size: 18px; color: #111827;\">{$this->post->title}</h2>";

        $statusSection = "<div style=\"margin: 16px 0; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;\">
            <div style=\"font-size: 14px; color: #6b7280; margin-bottom: 4px;\">Status: {$statusBadge}</div>
            " . (!empty($this->post->board->name) ? "<div style=\"font-size: 14px; color: #6b7280; margin-top: 8px;\">Board: <strong>{$this->post->board->name}</strong></div>" : "") . "
        </div>";

        $commentHeader = "<div style=\"margin-top: 12px;\">
            <div style=\"display: flex; align-items: center; margin-bottom: 8px;\">
                <img src=\"{$avatarUrl}\" style=\"width: 28px; height: 28px; border-radius: 50%; margin-right: 8px;\" alt=\"{$this->comment->user->name}'s avatar\" />
                <span style=\"font-weight: 600; color: #4b5563;\">{$this->comment->user->name}</span>
            </div>";

        $commentContent = "<div style=\"background-color: #ffffff; border-radius: 6px; padding: 12px; border: 1px solid #e5e7eb;\">
            {$commentBody}
        </div>";

        $commentFooter = "</div>";

        return "<div style=\"border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 16px; margin-bottom: 16px; background-color: #f9fafb;\">" .
            $titleSection .
            $statusSection .
            $commentHeader .
            $commentContent .
            $commentFooter .
        "</div>";
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'post_id' => $this->post->id,
            'post_title' => $this->post->title,
            'comment_id' => $this->comment->id,
            'commenter_name' => $this->comment->user->name ?? 'Unknown User',
        ];
    }
}

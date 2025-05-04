<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Post;
use App\Helpers\Formatting;
use Illuminate\Bus\Queueable;
use Illuminate\Support\HtmlString;
use Illuminate\Support\Facades\Log;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewFeedbackPosted extends Notification implements ShouldQueue
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
    public function __construct(protected Post $post)
    {
        if (!$post->relationLoaded('board')) {
            $post->load(['board', 'status', 'creator']);
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
            $body = nl2br(htmlspecialchars(strip_tags($this->post->body)));
            $statusBadge = "<span style=\"display: inline-block; background-color: {$statusColor}; color: white; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px;\">{$statusName}</span>";
            $posterName = htmlspecialchars($this->post->creator->name ?? 'Anonymous', ENT_QUOTES, 'UTF-8');
            $posterAvatar = $this->post->creator->avatar ?? 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

            return (new MailMessage())
                ->subject('New Feedback Posted: ' . Formatting::excerpt($title, 70))
                ->greeting("Hello, {$notifiable->name}!")
                ->line('A new feedback has been posted:')
                ->line(new HtmlString($this->generateFeedbackHtml($statusBadge, $title, $body, $posterName, $posterAvatar)))
                ->action('View Feedback', route('post.show', [$this->post->board, $this->post]))
                ->line('Thank you for using IdeaBox!');
        } catch (\Throwable $e) {
            Log::error('Error creating feedback notification email', [
                'error' => $e->getMessage(),
                'post_id' => $this->post->id,
                'notifiable_id' => $notifiable->id ?? null,
            ]);

            // Provide a fallback message
            return (new MailMessage())
                ->subject('New Feedback Posted')
                ->greeting('Hello!')
                ->line('A new feedback has been posted.')
                ->action('View Feedback', route('post.show', [$this->post->board, $this->post]))
                ->line('Thank you for using IdeaBox!');
        }
    }

    /**
     * Generate the HTML for the feedback notification.
     */
    private function generateFeedbackHtml(string $statusBadge, string $title, string $body, string $posterName, string $posterAvatar): string
    {
        $titleSection = "<h2 style=\"margin-top: 0; font-size: 18px; color: #111827;\">{$title}</h2>";

        $statusSection = "<div style=\"margin: 16px 0; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;\">
            <div style=\"font-size: 14px; color: #6b7280; margin-bottom: 4px;\">Status: {$statusBadge}</div>
            " . (!empty($this->post->board->name) ? "<div style=\"font-size: 14px; color: #6b7280; margin-top: 8px;\">Board: <strong>{$this->post->board->name}</strong></div>" : "") . "
        </div>";

        $posterSection = "<div style=\"display: flex; align-items: center; margin-bottom: 12px;\">
            <img src=\"{$posterAvatar}\" style=\"width: 28px; height: 28px; border-radius: 50%; margin-right: 8px;\" alt=\"{$posterName}'s avatar\" />
            <span style=\"font-weight: 600; color: #4b5563;\">Posted by {$posterName}</span>
        </div>";

        $bodyContent = "<div style=\"background-color: #ffffff; border-radius: 6px; padding: 12px; border: 1px solid #e5e7eb;\">
            <div style=\"color: #4b5563; font-size: 14px;\">{$body}</div>
        </div>";

        return "<div style=\"border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 16px; margin-bottom: 16px; background-color: #f9fafb;\">" .
            $titleSection .
            $statusSection .
            $posterSection .
            $bodyContent .
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
            'board_id' => $this->post->board->id,
            'board_name' => $this->post->board->name,
            'poster_name' => $this->post->creator->name ?? 'Anonymous',
        ];
    }
}

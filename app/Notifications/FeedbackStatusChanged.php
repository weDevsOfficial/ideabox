<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Post;
use App\Helpers\Formatting;
use Illuminate\Bus\Queueable;
use Illuminate\Support\HtmlString;
use Illuminate\Support\Facades\Log;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use App\Http\Controllers\Frontend\SubscriptionController;

class FeedbackStatusChanged extends Notification implements ShouldQueue
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
        if (!$post->relationLoaded('status')) {
            $post->load('status', 'board');
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
            $postTitle = htmlspecialchars($this->post->title, ENT_QUOTES, 'UTF-8');
            $statusName = $this->post->status->name;
            $statusColor = $this->post->status->color ?? '#4f46e5';

            $bodyExcerpt = '';
            if (!empty($this->post->body)) {
                $bodyExcerpt = Formatting::excerpt(strip_tags($this->post->body), 150);
            }

            // Customize subject line with post title
            $subject = "Feedback Status Updated: {$postTitle}";

            // Prepare status badge HTML
            $statusBadge = "<span style=\"display: inline-block; background-color: {$statusColor}; color: white; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px;\">{$statusName}</span>";

            return (new MailMessage())
                ->subject($subject)
                ->greeting("Hello, {$notifiable->name}!")
                ->line("The status of a feedback you're following has been updated:")

                // Feedback details panel
                ->line(new HtmlString("<div style=\"border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 16px; margin-bottom: 16px; background-color: #f9fafb;\">
                    <h2 style=\"margin-top: 0; font-size: 18px; color: #111827;\">{$postTitle}</h2>
                    <div style=\"margin-bottom: 12px; color: #4b5563; font-size: 14px;\">{$bodyExcerpt}</div>
                    <div style=\"margin-top: 16px;\">
                        <p style=\"font-size: 14px; color: #6b7280; margin: 0;\">Status: {$statusBadge}</p>
                        " . (!empty($this->post->board->name) ? "<p style=\"font-size: 14px; color: #6b7280; margin: 8px 0 0 0;\">Board: <strong>{$this->post->board->name}</strong></p>" : "") . "
                    </div>
                </div>"))

                ->action('View Feedback Details', route('post.show', [$this->post->board, $this->post]))
                ->line(new HtmlString('If you no longer wish to receive notifications for this feedback, <a href="' . SubscriptionController::generateUnsubscribeUrl($this->post, $notifiable->id) . '">click here to unsubscribe</a>.'))
                ->line("Thank you for your engagement!");
        } catch (\Throwable $e) {
            Log::error('Error creating mail notification', [
                'error' => $e->getMessage(),
                'post_id' => $this->post->id,
                'notifiable_id' => $notifiable->id ?? null,
            ]);

            // Provide a fallback message
            return (new MailMessage())
                ->subject('Feedback Status Updated')
                ->greeting("Hello!")
                ->line('The status of a feedback you submitted or voted on has been updated.')
                ->action('View Your Feedbacks', route('home'))
                ->line('Thank you for your contribution!');
        }
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
            'status_id' => $this->post->status_id,
            'status_name' => $this->post->status->name ?? null,
        ];
    }
}

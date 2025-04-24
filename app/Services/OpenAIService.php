<?php

namespace App\Services;

use OpenAI\Client;
use OpenAI\Factory;

class OpenAIService
{
    protected Client $client;

    public function __construct()
    {
        $this->client = (new Factory())
            ->withApiKey(config('services.openai.api_key'))
            ->make();
    }

    public function generateFeatureDescription(string $title): string
    {
        $response = $this->client->chat()->create([
            'model' => 'gpt-3.5-turbo',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are a product manager helping to write concise feature descriptions. Write a clear, concise, and well-structured description of the feature based on the title provided.'
                ],
                [
                    'role' => 'user',
                    'content' => "Please write a concise description for this feature within 50 words: {$title}"
                ]
            ],
            'temperature' => 0.7,
            'max_tokens' => 500,
        ]);

        return $response->choices[0]->message->content;
    }
}

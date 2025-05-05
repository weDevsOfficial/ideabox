<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Post;
use App\Models\Vote;
use App\Models\Comment;
use App\Models\PostSubscription;
use Illuminate\Support\Facades\DB;

class MigrateExistingSubscriptions extends Command
{
    protected $signature = 'subscriptions:migrate-existing';
    protected $description = 'Migrate existing post creators, voters and commenters to post_subscriptions table';

    public function handle()
    {
        $this->info('Starting migration of existing subscriptions...');

        DB::beginTransaction();
        try {
            // Subscribe post creators
            $this->info('Migrating post creators...');
            Post::select('id', 'created_by')->chunk(100, function ($posts) {
                foreach ($posts as $post) {
                    PostSubscription::firstOrCreate([
                        'post_id' => $post->id,
                        'user_id' => $post->created_by,
                    ]);
                }
            });

            // Subscribe voters
            $this->info('Migrating voters...');
            Vote::select('post_id', 'user_id')->chunk(100, function ($votes) {
                foreach ($votes as $vote) {
                    PostSubscription::firstOrCreate([
                        'post_id' => $vote->post_id,
                        'user_id' => $vote->user_id,
                    ]);
                }
            });

            // Subscribe commenters
            $this->info('Migrating commenters...');
            Comment::select('post_id', 'user_id')->chunk(100, function ($comments) {
                foreach ($comments as $comment) {
                    PostSubscription::firstOrCreate([
                        'post_id' => $comment->post_id,
                        'user_id' => $comment->user_id,
                    ]);
                }
            });

            DB::commit();
            $this->info('Successfully migrated all existing subscriptions!');

            return Command::SUCCESS;
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Failed to migrate subscriptions: ' . $e->getMessage());

            return Command::FAILURE;
        }
    }
}

<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->foreignId('merged_into_post_id')->nullable()->constrained('posts')->nullOnDelete();
            $table->foreignId('merged_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('merged_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropForeign(['merged_into_post_id']);
            $table->dropForeign(['merged_by_user_id']);
            $table->dropColumn(['merged_into_post_id', 'merged_by_user_id', 'merged_at']);
        });
    }
};

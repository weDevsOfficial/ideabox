<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class() extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('post_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['post_id', 'user_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->json('email_preferences')->nullable()->after('role');
        });

        // Set default values for all existing users
        DB::statement("UPDATE users SET email_preferences = ? WHERE email_preferences IS NULL", [
            json_encode([
                'comments' => true,
                'status_updates' => true,
            ])
        ]);

        // Migrate existing subscriptions
        Artisan::call('subscriptions:migrate-existing');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_subscriptions');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('email_preferences');
        });
    }
};

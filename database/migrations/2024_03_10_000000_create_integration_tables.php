<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('integration_providers', function (Blueprint $table) {
            $table->id();
            $table->string('type');  // github, slack, asana, etc.
            $table->string('name');
            $table->string('access_token')->nullable();
            $table->string('refresh_token')->nullable();
            $table->json('settings')->nullable();
            $table->timestamp('authenticated_at')->nullable();
            $table->timestamps();
        });

        Schema::create('integration_repositories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('integration_provider_id')->constrained()->onDelete('cascade');
            $table->string('name');         // Repository name
            $table->string('full_name');    // Full repo name (e.g., owner/repo)
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        Schema::create('post_integration_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->onDelete('cascade');
            $table->foreignId('integration_provider_id')->constrained()->onDelete('cascade');
            $table->foreignId('integration_repository_id')->nullable()->constrained()->nullOnDelete();
            $table->string('external_id')->nullable();
            $table->string('external_url')->nullable();
            $table->string('status')->default('pending');
            $table->json('settings')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_integration_links');
        Schema::dropIfExists('integration_repositories');
        Schema::dropIfExists('integration_providers');
    }
};

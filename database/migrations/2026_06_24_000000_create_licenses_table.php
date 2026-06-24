<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Stores the Freemius license/subscription snapshot for the install.
     * IdeaBox gates premium features on the presence of an active license.
     */
    public function up(): void
    {
        Schema::create('licenses', function (Blueprint $table) {
            $table->id();
            $table->string('provider')->default('freemius');
            $table->string('license_id')->index();
            $table->string('plan_id')->nullable();
            $table->string('plan_title')->nullable();
            $table->string('pricing_id')->nullable();
            $table->string('freemius_user_id')->nullable();
            $table->string('install_id')->nullable();
            $table->string('subscription_id')->nullable();
            $table->string('status')->default('active');
            $table->boolean('is_active')->default(true);
            $table->timestamp('expiration')->nullable();
            $table->json('data')->nullable();
            $table->timestamps();

            $table->unique(['provider', 'license_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('licenses');
    }
};

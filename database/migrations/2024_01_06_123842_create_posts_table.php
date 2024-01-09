<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('description');
            $table->integer('vote')->default(0);
            $table->integer('comments')->default(0);
            $table->unsignedBigInteger('status_id')->nullable();
            $table->unsignedBigInteger('board_id');
            $table->unsignedBigInteger('by')->nullable();
            $table->unsignedBigInteger('created_by')->index();
            $table->unsignedBigInteger('owner')->nullable();
            $table->unsignedInteger('eta')->nullable();
            $table->unsignedInteger('impact')->nullable();
            $table->unsignedInteger('effort')->nullable();
            $table->timestamps();

            $table->foreign('status_id')->references('id')->on('statuses')->onDelete('set null');
            $table->foreign('board_id')->references('id')->on('boards');
            $table->foreign('by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('owner')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};

<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\StatusController;
use App\Http\Controllers\Frontend\HomeController;
use App\Http\Controllers\Frontend\PostController;
use App\Http\Controllers\Admin\FeedbackController;
use App\Http\Controllers\Frontend\BoardController;
use App\Http\Controllers\Admin\UserSearchController;
use App\Http\Controllers\Frontend\CommentController;
use App\Http\Controllers\Admin\BoardController as AdminBoardController;
use App\Http\Controllers\Admin\CommentController as AdminCommentController;
use App\Http\Controllers\FeatureDescriptionController;
use App\Http\Controllers\Admin\GitHubIntegrationController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', [HomeController::class, 'index'])
    ->name('home');
Route::get('/b/{board}', [BoardController::class, 'show'])
    ->name('board.show');
Route::get('/b/{board}/{post}', [PostController::class, 'show'])
    ->name('post.show');
Route::get('/p/{post}/comments', [CommentController::class, 'index'])->name('post.comments.index');

// route group with 'admin' prefix
Route::prefix('admin')->middleware('auth', 'verified', 'admin')->group(function () {
    Route::redirect('/', '/admin/feedbacks');

    Route::get('/feedbacks', [FeedbackController::class, 'index'])->name('admin.feedbacks.index');
    Route::get('/feedbacks/{post}', [FeedbackController::class, 'show'])->name('admin.feedbacks.show');
    Route::post('/feedbacks', [FeedbackController::class, 'store'])->name('admin.feedbacks.store');
    Route::post('/feedbacks/{post}', [FeedbackController::class, 'update'])->name('admin.feedbacks.update');
    Route::put('/feedbacks/{post}/update', [FeedbackController::class, 'updateContent'])->name('admin.feedbacks.update-content');
    Route::post('/feedbacks/{post}/vote', [FeedbackController::class, 'addVote'])->name('admin.feedbacks.vote');
    Route::delete('/feedbacks/{post}', [FeedbackController::class, 'destroy'])->name('admin.feedbacks.destroy');
    Route::post('/api/generate-feature-description', [FeedbackController::class, 'generateDescription'])->name('api.generate-feature-description');

    Route::delete('/comment/{comment}', [AdminCommentController::class, 'destroy'])->name('admin.comments.destroy');

    Route::put('/boards/{board}', [AdminBoardController::class, 'update'])->name('admin.boards.update');
    Route::post('/boards', [AdminBoardController::class, 'store'])->name('admin.boards.store');
    Route::delete('/boards/{board}', [AdminBoardController::class, 'destroy'])->name('admin.boards.destroy');

    Route::get('/boards', [AdminBoardController::class, 'index'])->name('admin.boards.index');
    Route::get('/boards/{board}', [AdminBoardController::class, 'show'])->name('admin.boards.show');

    Route::get('/statuses', [StatusController::class, 'index'])->name('admin.statuses.index');
    Route::post('/statuses', [StatusController::class, 'store'])->name('admin.statuses.store');
    Route::put('/statuses/update', [StatusController::class, 'update'])->name('admin.statuses.update');

    Route::get('/users', [UserController::class, 'index'])->name('admin.users.index');
    Route::post('/users', [UserController::class, 'store'])->name('admin.users.store');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('admin.users.update');

    Route::get('/search-users', [UserSearchController::class, 'search'])->name('admin.users.search');

    // Integrations main page
    Route::get('/integrations', [App\Http\Controllers\Admin\IntegrationsController::class, 'index'])->name('admin.integrations.index');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/b/{board}', [BoardController::class, 'store'])->name('board.posts.store');
    Route::post('/p/{post}/vote', [PostController::class, 'vote'])->name('post.vote');
    Route::post('/p/{post}/comments', [CommentController::class, 'store'])->name('post.comments.store');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// GitHub Integration Routes
Route::middleware(['auth', 'admin'])->prefix('admin/integrations/github')->name('admin.integrations.github.')->group(function () {
    Route::get('/', [GitHubIntegrationController::class, 'settings'])->name('settings');
    Route::post('/connect', [GitHubIntegrationController::class, 'connect'])->name('connect');
    Route::get('/callback', [GitHubIntegrationController::class, 'callback'])->name('callback');
    Route::delete('/disconnect/{provider}', [GitHubIntegrationController::class, 'disconnect'])->name('disconnect');

    // Repository management
    Route::post('/search-repositories', [GitHubIntegrationController::class, 'searchRepositories'])->name('search-repositories');
    Route::post('/add-repository', [GitHubIntegrationController::class, 'addRepository'])->name('add-repository');
    Route::get('/list-repositories/{provider}', [GitHubIntegrationController::class, 'getRepositories'])->name('list-repositories');
    Route::delete('/repositories/{repository}', [GitHubIntegrationController::class, 'removeRepository'])->name('repositories.remove');

    // Issue management
    Route::get('/search-issues', [GitHubIntegrationController::class, 'searchIssues'])->name('search-issues');
    Route::post('/link-issue/{post}', [GitHubIntegrationController::class, 'linkIssue'])->name('link-issue');
    Route::post('/create-issue/{post}', [GitHubIntegrationController::class, 'createIssue'])->name('create-issue');
    Route::delete('/unlink-issue/{post}/{linkId}', [GitHubIntegrationController::class, 'unlinkIssue'])->name('unlink-issue');
});

// GitHub Webhook Route
Route::post('/webhooks/github', [App\Http\Controllers\Webhooks\GitHubWebhookController::class, 'handle'])->name('webhooks.github');

require __DIR__ . '/auth.php';

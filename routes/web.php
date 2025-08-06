<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\StatusController;
use App\Http\Controllers\Frontend\HomeController;
use App\Http\Controllers\Frontend\PostController;
use App\Http\Controllers\Admin\FeedbackController;
use App\Http\Controllers\Admin\MergeController;
use App\Http\Controllers\Frontend\BoardController;
use App\Http\Controllers\Admin\UserSearchController;
use App\Http\Controllers\Frontend\CommentController;
use App\Http\Controllers\Admin\IntegrationsController;
use App\Http\Controllers\Admin\GitHub\GitHubIssueController;
use App\Http\Controllers\Admin\GitHub\GitHubAccountController;
use App\Http\Controllers\Admin\GitHub\GitHubRepositoryController;
use App\Http\Controllers\Admin\BoardController as AdminBoardController;
use App\Http\Controllers\Admin\CommentController as AdminCommentController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Frontend\SubscriptionController;

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

    // Settings management
    Route::get('/settings', [SettingController::class, 'index'])->name('admin.settings.index');
    Route::post('/settings', [SettingController::class, 'update'])->name('admin.settings.update');

    Route::get('/feedbacks/search', [FeedbackController::class, 'search'])->name('admin.feedbacks.search');
    Route::get('/feedbacks', [FeedbackController::class, 'index'])->name('admin.feedbacks.index');
    Route::get('/feedbacks/{post}', [FeedbackController::class, 'show'])->name('admin.feedbacks.show');
    Route::post('/feedbacks', [FeedbackController::class, 'store'])->name('admin.feedbacks.store');
    Route::post('/feedbacks/{post}', [FeedbackController::class, 'update'])->name('admin.feedbacks.update');
    Route::put('/feedbacks/{post}/update', [FeedbackController::class, 'updateContent'])->name('admin.feedbacks.update-content');
    Route::post('/feedbacks/{post}/vote', [FeedbackController::class, 'addVote'])->name('admin.feedbacks.vote');
    Route::delete('/feedbacks/{post}', [FeedbackController::class, 'destroy'])->name('admin.feedbacks.destroy');
    Route::post('/feedbacks/{post}/merge', [MergeController::class, 'merge'])->name('admin.feedbacks.merge');

    Route::post('/api/generate-feature-description', [FeedbackController::class, 'generateDescription'])->name('api.generate-feature-description');

    Route::delete('/comment/{comment}', [AdminCommentController::class, 'destroy'])->name('admin.comments.destroy');

    // Board management
    Route::put('/boards/{board}', [AdminBoardController::class, 'update'])->name('admin.boards.update');
    Route::post('/boards', [AdminBoardController::class, 'store'])->name('admin.boards.store');
    Route::delete('/boards/{board}', [AdminBoardController::class, 'destroy'])->name('admin.boards.destroy');
    Route::get('/boards', [AdminBoardController::class, 'index'])->name('admin.boards.index');
    Route::get('/boards/{board}', [AdminBoardController::class, 'show'])->name('admin.boards.show');

    // Status management
    Route::get('/statuses', [StatusController::class, 'index'])->name('admin.statuses.index');
    Route::post('/statuses', [StatusController::class, 'store'])->name('admin.statuses.store');
    Route::put('/statuses/update', [StatusController::class, 'update'])->name('admin.statuses.update');

    // User management
    Route::get('/users', [UserController::class, 'index'])->name('admin.users.index');
    Route::get('/users/all', [UserController::class, 'allUsers'])->name('admin.users.all');
    Route::post('/users', [UserController::class, 'store'])->name('admin.users.store');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('admin.users.update');

    Route::get('/search-users', [UserSearchController::class, 'search'])->name('admin.users.search');

    // Integrations main page
    Route::get('/integrations', [IntegrationsController::class, 'index'])->name('admin.integrations.index');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/b/{board}', [BoardController::class, 'store'])->name('board.posts.store');
    Route::post('/p/{post}/vote', [PostController::class, 'vote'])->name('post.vote');
    Route::post('/p/{post}/comments', [CommentController::class, 'store'])->name('post.comments.store');

    Route::post('posts/{post}/subscription', [SubscriptionController::class, 'toggle'])->name('post.subscription.toggle');
    Route::get('posts/{post}/subscription', [SubscriptionController::class, 'status'])->name('post.subscription.status');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/email-preferences', [ProfileController::class, 'updateEmailPreferences'])->name('profile.email-preferences');
});

Route::get('posts/{post}/unsubscribe', [SubscriptionController::class, 'unsubscribe'])->name('post.unsubscribe');

// GitHub Integration Routes - Updated to use the new controllers
Route::middleware(['auth', 'admin', 'verified'])->prefix('admin/integrations/github')->name('admin.integrations.github.')->group(function () {
    // Account management
    Route::get('/', [GitHubAccountController::class, 'settings'])->name('settings');
    Route::post('/connect', [GitHubAccountController::class, 'connect'])->name('connect');
    Route::get('/callback', [GitHubAccountController::class, 'callback'])->name('callback');
    Route::delete('/disconnect/{provider}', [GitHubAccountController::class, 'disconnect'])->name('disconnect');

    // Repository management
    Route::post('/search-repositories', [GitHubRepositoryController::class, 'search'])->name('search-repositories');
    Route::post('/add-repository', [GitHubRepositoryController::class, 'add'])->name('add-repository');
    Route::get('/list-repositories/{provider}', [GitHubRepositoryController::class, 'list'])->name('list-repositories');
    Route::delete('/repositories/{repository}', [GitHubRepositoryController::class, 'remove'])->name('repositories.remove');

    // Issue management
    Route::get('/search-issues', [GitHubIssueController::class, 'search'])->name('search-issues');
    Route::get('/get-issue', [GitHubIssueController::class, 'get'])->name('get-issue');
    Route::post('/link-issue/{post}', [GitHubIssueController::class, 'link'])->name('link-issue');
    Route::post('/create-issue/{post}', [GitHubIssueController::class, 'create'])->name('create-issue');
    Route::delete('/unlink-issue/{post}/{linkId}', [GitHubIssueController::class, 'unlink'])->name('unlink-issue');
});

require __DIR__ . '/auth.php';

<?php

namespace App\Http\Controllers\Admin\GitHub;

use App\Models\IntegrationProvider;
use App\Models\IntegrationRepository;
use App\Models\Post;
use App\Models\PostIntegrationLink;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;

class GitHubIssueController extends BaseGitHubController
{
    /**
     * Search for issues in a repository
     */
    public function search(Request $request)
    {
        $search = $request->input('search');
        $providerId = $request->input('provider_id');
        $repoId = $request->input('repository_id');

        $provider = $this->getGitHubProvider($providerId);
        if (!$provider) {
            return $this->handleGitHubError($request, 'Invalid GitHub provider.', 400);
        }

        $integration = $this->getGitHubIntegration($provider);
        if (!$integration) {
            return $this->handleGitHubError($request, 'GitHub integration not available.', 500);
        }

        $repository = IntegrationRepository::findOrFail($repoId);
        $query = $search ?? '';

        $issues = $integration->searchIssues($repository->full_name, $query);

        return response()->json([
            'issues' => $issues,
        ]);
    }

    /**
     * Get a specific issue
     */
    public function get(Request $request)
    {
        $request->validate([
            'provider_id' => 'required|exists:integration_providers,id',
            'repository_full_name' => 'required|string',
            'issue_number' => 'required|integer',
        ]);

        $provider = $this->getGitHubProvider($request->provider_id);
        if (!$provider) {
            return $this->handleGitHubError($request, 'Invalid GitHub provider.', 400);
        }

        $integration = $this->getGitHubIntegration($provider);
        if (!$integration) {
            return $this->handleGitHubError($request, 'GitHub integration not available.', 500);
        }

        $repositoryFullName = $request->input('repository_full_name');
        $issueNumber = $request->input('issue_number');

        // Use the findOrCreateRepository helper method
        $repository = $this->findOrCreateRepository($provider, $repositoryFullName);

        $issue = $integration->getIssue($repository, $issueNumber);

        if (!$issue) {
            return $this->handleGitHubError($request, 'Failed to get issue details.', 404);
        }

        return response()->json([
            'issue' => $issue,
        ]);
    }

    /**
     * Create an issue from a post
     */
    public function create(Request $request, Post $post)
    {
        $post->load('board');

        $request->validate([
            'repository_id' => 'required|exists:integration_repositories,id',
            'title' => 'required|string',
            'body' => 'required|string',
        ]);

        $repository = IntegrationRepository::findOrFail($request->repository_id);
        $provider = IntegrationProvider::findOrFail($repository->integration_provider_id);

        $integration = $this->getGitHubIntegration($provider);
        if (!$integration) {
            return $this->handleGitHubError($request, 'GitHub integration not available.', 500);
        }

        // Prepare issue body with post reference
        $issueBody = $request->body;
        $issueBody .= "\n\n---";
        $issueBody .= "\n\n*(This issue was created from a post on IdeaBox: ";
        $issueBody .= "[" . $post->title . "](" . route('post.show', [$post->board->slug, $post->slug]) . ")*)";

        // Create issue using the integration service
        $issue = $integration->createIssue($repository, $request->title, $issueBody);

        if (!$issue) {
            return $this->handleGitHubError($request, 'Failed to create GitHub issue.', 500);
        }

        // Create link record
        PostIntegrationLink::create([
            'post_id' => $post->id,
            'integration_provider_id' => $provider->id,
            'integration_repository_id' => $repository->id,
            'external_id' => (string) $issue['number'],
            'external_url' => $issue['url'],
            'status' => $issue['state'],
            'settings' => [
                'title' => $issue['title'],
            ],
        ]);

        return redirect()->back()->with('success', 'Issue created successfully');
    }

    /**
     * Link a GitHub issue to a post.
     */
    public function link(Request $request, Post $post)
    {
        $validated = $request->validate([
            'repository_id' => 'required|exists:integration_repositories,id',
            'integration_provider_id' => 'required|exists:integration_providers,id',
            'external_id' => 'required|string',
        ]);

        $repository = IntegrationRepository::findOrFail($validated['repository_id']);
        $provider = IntegrationProvider::findOrFail($repository->integration_provider_id);

        $integration = $this->getGitHubIntegration($provider);
        if (!$integration) {
            return $this->handleGitHubError($request, 'GitHub integration not available.', 500);
        }

        // Get issue details using integration service
        $issue = $integration->getIssue($repository, $validated['external_id']);

        if (!$issue) {
            return $this->handleGitHubError($request, 'Failed to get issue details from GitHub.', 500);
        }

        // Check if the issue is already linked
        $existingLink = PostIntegrationLink::where('post_id', $post->id)
            ->where('integration_repository_id', $validated['repository_id'])
            ->where('external_id', $validated['external_id'])
            ->first();

        if ($existingLink) {
            return redirect()->back()->with('error', 'This issue is already linked to the post.');
        }

        // Create link record
        PostIntegrationLink::create([
            'post_id' => $post->id,
            'integration_provider_id' => $validated['integration_provider_id'],
            'integration_repository_id' => $validated['repository_id'],
            'external_id' => $validated['external_id'],
            'external_url' => $issue['url'],
            'status' => $issue['state'],
            'settings' => [
                'title' => $issue['title'],
            ],
        ]);

        return redirect()->back()->with('success', 'Issue linked successfully');
    }

    /**
     * Unlink a GitHub issue from a post.
     */
    public function unlink(Request $request, Post $post, int $linkId)
    {
        $link = PostIntegrationLink::findOrFail($linkId);

        if ($link->post_id !== $post->id) {
            return redirect()->back()->with('error', 'This issue is not linked to the post.');
        }

        $link->delete();

        return redirect()->back()->with('success', 'GitHub issue unlinked successfully.');
    }
}

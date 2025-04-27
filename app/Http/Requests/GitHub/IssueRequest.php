<?php

namespace App\Http\Requests\GitHub;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Route;

class IssueRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        $rules = [
            'provider_id' => 'required|exists:integration_providers,id',
        ];

        $routeName = Route::currentRouteName();

        // Add context-specific rules
        if ($routeName === 'admin.integrations.github.search-issues') {
            $rules['repository_id'] = 'required|exists:integration_repositories,id';
        } elseif ($routeName === 'admin.integrations.github.get-issue') {
            $rules['repository_full_name'] = 'required|string';
            $rules['issue_number'] = 'required|integer';
        } elseif ($routeName === 'admin.integrations.github.create-issue') {
            $rules['repository_id'] = 'required|exists:integration_repositories,id';
            $rules['title'] = 'required|string';
            $rules['body'] = 'required|string';
        } elseif ($routeName === 'admin.integrations.github.link-issue') {
            $rules['repository_id'] = 'required|exists:integration_repositories,id';
            $rules['external_id'] = 'required|string';
        }

        return $rules;
    }
}

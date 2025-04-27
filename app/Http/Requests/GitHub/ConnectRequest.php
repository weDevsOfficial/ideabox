<?php

namespace App\Http\Requests\GitHub;

use Illuminate\Foundation\Http\FormRequest;

class ConnectRequest extends FormRequest
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
        return [
            'client_id' => 'required|string',
            'client_secret' => 'required|string',
        ];
    }
}

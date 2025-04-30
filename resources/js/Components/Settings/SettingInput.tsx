import React, { useState } from 'react';
import { TextField, Textarea } from '@wedevs/tail-react';
import LinkManager from './LinkManager';

interface Setting {
  id: number | null;
  key: string;
  value: string | null;
  type: string;
  group: string;
  label: string;
  description: string | null;
}

interface SettingInputProps {
  setting: Setting;
  value: string | null;
  onChange: (value: any) => void;
}

export default function SettingInput({
  setting,
  value,
  onChange,
}: SettingInputProps) {
  // Track JSON validation errors
  const [jsonError, setJsonError] = useState<string | null>(null);

  const validateJson = (value: string): boolean => {
    try {
      JSON.parse(value);
      setJsonError(null);
      return true;
    } catch (e) {
      setJsonError((e as Error).message);
      return false;
    }
  };

  const formatJson = () => {
    try {
      if (value) {
        const parsed = JSON.parse(value);
        const formatted = JSON.stringify(parsed, null, 2);
        onChange(formatted);
      }
    } catch (e) {
      // Don't format if invalid JSON
    }
  };

  switch (setting.type) {
    case 'boolean':
      return (
        <div>
          <input
            type="checkbox"
            checked={value === '1' || value === 'true'}
            onChange={(e) => onChange(e.target.checked ? '1' : '0')}
            className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
          />
        </div>
      );

    case 'json':
      // Special handling for links
      if (setting.key === 'footer_links' || setting.key === 'header_links') {
        return <LinkManager value={value} onChange={onChange} />;
      }

      return (
        <div>
          <div className="mb-1 flex justify-end">
            <button
              type="button"
              onClick={formatJson}
              className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Format JSON
            </button>
          </div>

          <Textarea
            value={value || ''}
            onChange={(e: any) => {
              const newValue = e.target.value;
              onChange(newValue);
              if (newValue) {
                validateJson(newValue);
              } else {
                setJsonError(null);
              }
            }}
            rows={10}
            className="w-full font-mono text-sm"
            error={jsonError || ''}
          />

          {jsonError && (
            <p className="mt-1 text-sm text-red-600">{jsonError}</p>
          )}
        </div>
      );

    case 'text':
      return <Textarea value={value || ''} onChange={onChange} rows={3} />;

    default:
      return <TextField type="text" value={value || ''} onChange={onChange} />;
  }
}

import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@wedevs/tail-react';

interface IntegrationCard {
  name: string;
  description: string;
  icon: string;
  route: string;
  status: 'available' | 'coming_soon';
}

interface Props {
  active_integrations: {
    github: number;
    // Add more integration counts as they become available
  };
}

export default function IntegrationsIndex({ active_integrations }: Props) {
  const integrations: IntegrationCard[] = [
    {
      name: 'GitHub',
      description:
        'Connect to GitHub to create issues from feedback items and track their status.',
      icon: 'https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png',
      route: route('admin.integrations.github.settings'),
      status: 'available',
    },
    // {
    //   name: 'Slack',
    //   description:
    //     'Receive notifications in Slack when new feedback is submitted.',
    //   icon: 'https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_128.png',
    //   route: '#',
    //   status: 'coming_soon',
    // },
    // {
    //   name: 'Jira',
    //   description: 'Connect to Jira to create issues from feedback items.',
    //   icon: 'https://wac-cdn.atlassian.com/assets/img/favicons/atlassian/favicon.png',
    //   route: '#',
    //   status: 'coming_soon',
    // },
  ];

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Integrations
        </h2>
      }
    >
      <Head title="Integrations" />

      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
        <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Integrations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">
            Connect IdeaBox to your favorite tools and services to streamline
            your workflow.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-700"
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <img
                      src={integration.icon}
                      alt={`${integration.name} logo`}
                      className="w-8 h-8 mr-3"
                    />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {integration.name}
                    </h3>
                    {integration.status === 'available' &&
                      active_integrations.github > 0 && (
                        <span className="ml-auto bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-xs font-medium px-2.5 py-0.5 rounded">
                          Connected ({active_integrations.github})
                        </span>
                      )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {integration.description}
                  </p>
                  {integration.status === 'available' ? (
                    <Button
                      variant="secondary"
                      as={Link}
                      href={integration.route}
                    >
                      Configure
                    </Button>
                  ) : (
                    <span className="inline-flex items-center px-4 py-2 bg-gray-300 dark:bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-widest cursor-not-allowed">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

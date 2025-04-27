import React, { useState } from 'react';
import { Button } from '@wedevs/tail-react';
import { IntegrationRepository, PostIntegrationLink, PostType } from '@/types';
import LinkedIssuesList from './LinkedIssuesList';
import CreateIssueModal from './CreateIssueModal';
import LinkIssueModal from './LinkIssueModal';

interface Props {
  post: PostType;
  repositories: IntegrationRepository[];
  linkedIssues: PostIntegrationLink[];
}

export default function GitHubIssueLinker({
  post,
  repositories,
  linkedIssues,
}: Props) {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isLinkModalOpen, setLinkModalOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mt-8">
        <h3 className="text-base font-semibold dark:text-gray-300">
          GitHub Issues
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="small"
            onClick={() => setLinkModalOpen(true)}
          >
            Link Issue
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setCreateModalOpen(true)}
          >
            Create Issue
          </Button>
        </div>
      </div>

      <div className="">
        {linkedIssues.length > 0 ? (
          <LinkedIssuesList links={linkedIssues} post={post} />
        ) : (
          <div className="bg-gray-50 dark:bg-gray-900 p-4 text-center border border-gray-200 dark:border-gray-800 rounded-lg mb-4 mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No GitHub issues linked to this feedback yet.
            </p>
          </div>
        )}

        <CreateIssueModal
          post={post}
          repositories={repositories}
          isOpen={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
        />

        <LinkIssueModal
          isOpen={isLinkModalOpen}
          post={post}
          repositories={repositories}
          closeModal={() => setLinkModalOpen(false)}
        />
      </div>
    </div>
  );
}

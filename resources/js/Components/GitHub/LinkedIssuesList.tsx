import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from '@inertiajs/react';
import { Button, ConfirmModal } from '@wedevs/tail-react';
import { PostIntegrationLink, PostType } from '@/types';
import { useState } from 'react';
import classNames from 'classnames';

type Props = {
  links: PostIntegrationLink[];
  post: PostType;
};

function LinkedIssuesList({ links, post }: Props) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<PostIntegrationLink | null>(
    null
  );
  const form = useForm();

  const handleDeleteClick = (link: PostIntegrationLink) => {
    setLinkToDelete(link);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (linkToDelete) {
      form.delete(
        route('admin.integrations.github.unlink-issue', {
          post: post.slug,
          linkId: linkToDelete.id,
        })
      );
      setIsDeleteModalOpen(false);
      setLinkToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setLinkToDelete(null);
  };

  return (
    <ul className="divide-y">
      {links.map((link) => (
        <li key={link.id} className="py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={classNames(
                  'inline-block px-2 py-1 text-xs font-medium rounded-full text-white',
                  {
                    'bg-[#8250df]': link.status === 'closed',
                    'bg-[#16a34a]': link.status !== 'closed',
                  }
                )}
              >
                {link.status === 'closed' ? 'Closed' : 'Open'}
              </span>
              <a
                href={link.external_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                #{link.external_id}: {link.settings.title}
              </a>
            </div>

            <div>
              <Button
                variant="secondary"
                size="small"
                onClick={() => handleDeleteClick(link)}
              >
                <XMarkIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </li>
      ))}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Unlink Issue"
        message="Are you sure you want to unlink this issue?"
        buttonLabel="Unlink"
        buttonVariant="danger"
      />
    </ul>
  );
}

export default LinkedIssuesList;

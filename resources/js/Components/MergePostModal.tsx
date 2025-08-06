import { useState, FC } from 'react';
import { router } from '@inertiajs/react';
import { PostType } from '@/types';
import {
  Button,
  Modal,
  ModalActions,
  ModalBody,
  ModalHeader,
  Notice,
  TextField,
} from '@wedevs/tail-react';
import axios from 'axios';

interface MergePostModalProps {
  post: PostType;
  show: boolean;
  onClose: () => void;
}

const MergePostModal: FC<MergePostModalProps> = ({ post, show, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<PostType[]>([]);
  const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm) return;
    setLoading(true);
    try {
      const response = await axios.get(
        route('admin.feedbacks.search', { search: searchTerm }),
      );
      setResults(response.data.filter((p: PostType) => p.id !== post.id));
    } catch (error) {
      console.error('Error searching for posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleMerge = () => {
    if (!selectedPost) return;

    router.post(
      route('admin.feedbacks.merge', { post: post.slug }),
      {
        target_post_id: selectedPost.id,
      },
      {
        onSuccess: () => {
          onClose();
          setSearchTerm('');
          setResults([]);
          setSelectedPost(null);
        },
      },
    );
  };

  return (
    <Modal isOpen={show} onClose={onClose}>
      <ModalHeader>Merge Feedback</ModalHeader>

      <ModalBody>
        {selectedPost && (
          <Notice
            type="info"
            className="mb-4"
            label={
              <>
                Merge feedback "<strong>{post.title}</strong>" into{' '}
                <strong>"{selectedPost?.title || 'another feedback'}"</strong>
              </>
            }
          />
        )}

        <div className="space-y-4">
          <div className="flex gap-2">
            <TextField
              value={searchTerm}
              onChange={setSearchTerm}
              onKeyPress={handleKeyPress}
              disabled={loading}
              placeholder="Search for a feedback..."
              className="flex-1"
            />
            <Button
              variant="secondary"
              onClick={handleSearch}
              disabled={loading}
              className="mb-4"
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="max-h-60 overflow-y-auto">
              <ul className="space-y-2">
                {results.map((result) => (
                  <li
                    key={result.id}
                    className={`cursor-pointer rounded-md border p-3 ${
                      selectedPost?.id === result.id
                        ? 'border-indigo-300 bg-indigo-100 dark:border-indigo-600 dark:bg-indigo-900'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setSelectedPost(result)}
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {result.title}
                    </p>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {result.body.substring(0, 100)}...
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalActions className="gap-2">
        <Button onClick={handleMerge} disabled={!selectedPost}>
          Merge
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </ModalActions>
    </Modal>
  );
};

export default MergePostModal;

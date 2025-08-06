import { useState, FC } from 'react';
import { router } from '@inertiajs/react';
import { PostType } from '@/types';
import Modal from '@/Components/Modal';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
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
    <Modal show={show} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900">Merge Post</h2>
        <p className="mt-1 text-sm text-gray-600">
          Search for a post to merge{' '}
          <strong>
            #{post.id} {post.title}
          </strong>{' '}
          into.
        </p>

        <div className="mt-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Search for a post by title..."
          />
          <PrimaryButton
            className="mt-2"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </PrimaryButton>
        </div>

        {results.length > 0 && (
          <div className="mt-4 max-h-60 overflow-y-auto">
            <ul>
              {results.map((result) => (
                <li
                  key={result.id}
                  className={`cursor-pointer rounded-md p-2 ${selectedPost?.id === result.id ? 'bg-indigo-100' : ''}`}
                  onClick={() => setSelectedPost(result)}
                >
                  <p className="font-semibold">{result.title}</p>
                  <p className="text-sm text-gray-500">
                    {result.body.substring(0, 100)}...
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton
            className="ml-3"
            onClick={handleMerge}
            disabled={!selectedPost}
          >
            Merge
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
};

export default MergePostModal;

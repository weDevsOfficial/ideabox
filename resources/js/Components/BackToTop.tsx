import { useEffect, useRef } from 'react';
import { ChevronUpIcon } from '@heroicons/react/24/outline';

const BackToTop = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (buttonRef.current) {
        buttonRef.current.style.display =
          window.scrollY > 900 ? 'block' : 'none';
      }
    };

    window.addEventListener('scroll', handleScroll);

    handleScroll(); // Initial check on component mount

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      ref={buttonRef}
      onClick={scrollToTop}
      style={{ display: 'none' }}
      className="fixed bottom-8 right-8 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-500 focus:outline-none dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      <ChevronUpIcon className="h-6 w-6" />
    </button>
  );
};

export default BackToTop;

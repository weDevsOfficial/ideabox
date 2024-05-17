import React, { useEffect, useState } from 'react';
import { ChevronUpIcon } from '@heroicons/react/24/outline';

const BackToTop = () => {
  const [showTopButton, setShowTopButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 900) {
        setShowTopButton(true);
      } else {
        setShowTopButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    showTopButton && (
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-500 focus:outline-none dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <ChevronUpIcon className="h-6 w-6" />
      </button>
    )
  );
};

export default BackToTop;

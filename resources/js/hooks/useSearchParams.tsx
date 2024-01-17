import { useState, useEffect, useCallback } from 'react';

const useSearchParams = () => {
  const [searchParams, setSearchParams] = useState(
    new URLSearchParams(window.location.search)
  );

  const updateSearchParam = useCallback(
    (param: string, value: string | null | undefined) => {
      const newSearchParams = new URLSearchParams(window.location.search);
      if (value === null || value === undefined) {
        newSearchParams.delete(param);
      } else {
        newSearchParams.set(param, value);
      }
      // Update the URL without reloading the page
      window.history.pushState({}, '', '?' + newSearchParams.toString());
      // Manually trigger a custom event
      window.dispatchEvent(new Event('searchparamchange'));
    },
    []
  );

  useEffect(() => {
    const handlePopState = () => {
      setSearchParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    // Listen for the custom event
    window.addEventListener('searchparamchange', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('searchparamchange', handlePopState);
    };
  }, []);

  return [searchParams, updateSearchParam];
};

export default useSearchParams;

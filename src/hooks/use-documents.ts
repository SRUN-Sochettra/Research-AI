import { useState, useEffect } from 'react';
import type { Document } from '@/types/database';

export function useDocuments() {
  const [documents] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDocuments = async () => {
    setIsLoading(true);
    // call API/DB
    setIsLoading(false);
  };

  useEffect(() => {
    // Avoid synchronous setState during render by calling inside effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDocuments();
  }, []);

  return { documents, isLoading, fetchDocuments };
}

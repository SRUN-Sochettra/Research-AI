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
    fetchDocuments();
  }, []);

  return { documents, isLoading, fetchDocuments };
}

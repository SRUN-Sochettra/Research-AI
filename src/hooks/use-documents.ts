import { useState, useEffect } from 'react';

export function useDocuments() {
  const [documents, setDocuments] = useState<any[]>([]);
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

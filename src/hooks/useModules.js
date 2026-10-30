import { useEffect, useState } from 'react';
import { fetchModules, fetchProgress } from '../services/learningService';
import { useAuth } from './useAuth';

export function useModules({ includeProgress = false } = {}) {
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function reload() {
    setLoading(true);
    setError('');
    try {
      const [moduleRows, progressRows] = await Promise.all([
        fetchModules(),
        includeProgress && user?.id ? fetchProgress(user.id) : Promise.resolve([]),
      ]);
      setModules(moduleRows);
      setProgress(progressRows);
      return moduleRows;
    } catch (nextError) {
      console.error(nextError);
      setError(nextError.message || 'Gagal memuat data pembelajaran.');
      return [];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, [user?.id, includeProgress]);

  return { modules, progress, loading, error, reload, setModules, setProgress };
}

import React, { useState, useEffect } from 'react';
import { loadLocated } from '@/lib/data/loaders';

const TestDataLoader: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 TestDataLoader: Loading data...');
        const loadedData = await loadLocated();
        console.log('✅ TestDataLoader: Loaded', loadedData.length, 'rows');
        setData(loadedData);
      } catch (err) {
        console.error('❌ TestDataLoader: Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div>Loading test data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px' }}>
      <h3>Test Data Loader</h3>
      <p>Loaded {data.length} rows</p>
      {data.length > 0 && (
        <div>
          <h4>Sample Data:</h4>
          <pre>{JSON.stringify(data.slice(0, 2), null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default TestDataLoader;

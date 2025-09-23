import React, { useState, useEffect } from 'react';
import { loadLocated } from '@/lib/data/loaders';

const DataDebugger: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔍 DataDebugger: Loading data...');
        const loadedData = await loadLocated();
        console.log('✅ DataDebugger: Loaded', loadedData.length, 'rows');
        setData(loadedData);
      } catch (err) {
        console.error('❌ DataDebugger: Error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div style={{padding: '20px', background: '#f0f0f0'}}>Loading debug data...</div>;

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px', borderRadius: '8px' }}>
      <h3>🔍 Data Debugger</h3>
      <p><strong>Total rows:</strong> {data.length}</p>
      {data.length > 0 && (
        <div>
          <h4>Sample Data (first 3 rows):</h4>
          <pre style={{background: '#fff', padding: '10px', borderRadius: '4px', fontSize: '12px'}}>
            {JSON.stringify(data.slice(0, 3), null, 2)}
          </pre>
          
          <h4>All Clients:</h4>
          <ul>
            {data.map((row, index) => (
              <li key={index}>
                {row.client} ({row.market}) - {row.status}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DataDebugger;

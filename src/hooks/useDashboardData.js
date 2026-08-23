import { useState, useEffect } from 'react';
import { fetchDashboardData, fetchSnapshots } from '../services/dataService';

export const useDashboardData = (selectedPeriod) => {
  const [residents, setResidents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSnapshot, setCurrentSnapshot] = useState(null);
  const [previousSnapshot, setPreviousSnapshot] = useState(null);

  useEffect(() => {
    fetchSnapshots().then(setSnapshots).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedPeriod) return;
    
    setLoading(true);
    setError(null);
    
    fetchDashboardData(selectedPeriod)
      .then((result) => {
        const currentRes = result.current.data.filter(d => d.category === 'resident');
        const currentFac = result.current.data.filter(d => d.category === 'faculty');
        
        const prevRes = result.previous?.data.filter(d => d.category === 'resident') || [];
        const prevFac = result.previous?.data.filter(d => d.category === 'faculty') || [];

        // Scenario B: Calculate deltas comparing current period with previous period
        const mergeComparison = (current, previous) => {
          return current.map(c => {
            const prev = previous.find(p => p.name === c.name);
            return {
              ...c,
              comparison: prev ? {
                PDI: prev.PDI,
                PDI_noF: prev.PDI_noF,
                WQS_adj: prev.WQS_adj,
                LAQ: prev.LAQ,
                INT: prev.INT,
                V: prev.V,
                delta_PDI: c.PDI - prev.PDI,
                delta_PDI_noF: c.PDI_noF - prev.PDI_noF,
                delta_WQS: c.WQS_adj - prev.WQS_adj,
                delta_V: c.V - prev.V
              } : null
            };
          });
        };

        setResidents(mergeComparison(currentRes, prevRes));
        setFaculty(mergeComparison(currentFac, prevFac));
        setCurrentSnapshot(result.current.snapshot);
        setPreviousSnapshot(result.previous?.snapshot || null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedPeriod]);

  return { residents, faculty, snapshots, loading, error, currentSnapshot, previousSnapshot };
};
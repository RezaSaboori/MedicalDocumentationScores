import { useState, useEffect } from 'react';
import { getUploadedDatasets } from '../services/dataService';

export const useDataProcessing = () => {
  const [uploadedDatasets, setUploadedDatasets] = useState([]);
  const [activeDataset, setActiveDataset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDatasets = () => {
      const history = getUploadedDatasets();
      setUploadedDatasets(history);
      if (history.length > 0 && !activeDataset) {
        setActiveDataset(history[0]);
      }
      setIsLoading(false);
    };
    loadDatasets();
  }, []);

  const refreshDatasets = () => {
    const history = getUploadedDatasets();
    setUploadedDatasets(history);
    if (history.length > 0) {
      setActiveDataset(history[0]);
    }
  };

  const selectDataset = (dataset) => {
    setActiveDataset(dataset);
  };

  return {
    uploadedDatasets,
    activeDataset,
    isLoading,
    refreshDatasets,
    selectDataset
  };
};
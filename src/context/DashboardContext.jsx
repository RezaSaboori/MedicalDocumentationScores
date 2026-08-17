import React, { createContext, useContext } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';

const DashboardContext = createContext(null);

export const DashboardProvider = ({ children }) => {
  const dashboardData = useDashboardData();
  return (
    <DashboardContext.Provider value={dashboardData}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
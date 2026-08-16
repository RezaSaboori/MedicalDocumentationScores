import React from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import { useDashboardData } from './hooks/useDashboardData';
import './App.css';

function App() {
  const { data, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="page-content app-loading">
        <div className="glass u-container u-container--md app-loading-card">
          <h2 className="app-loading-title">در حال بارگذاری داده‌ها...</h2>
        </div>
      </div>
    );
  }

  return <DashboardLayout data={data.current} />;
}

export default App;
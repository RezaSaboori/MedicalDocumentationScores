import React from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import './App.css';

function DashboardContent() {
  const { loading } = useDashboard();

  if (loading) {
    return (
      <div className="page-content app-loading">
        <div className="glass u-container u-container--md app-loading-card">
          <h2 className="app-loading-title">در حال بارگذاری داده‌ها...</h2>
        </div>
      </div>
    );
  }

  return <DashboardLayout />;
}

function App() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}

export default App;
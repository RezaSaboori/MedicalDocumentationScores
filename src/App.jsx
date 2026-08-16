import React from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import { useDashboardData } from './hooks/useDashboardData';

// Ensure theme.css and glass.css are imported in your main entry file (e.g., main.jsx)
// import './styles/theme.css';
// import './styles/glass.css';

function App() {
  // Initialize data hook at the root level to pass down via Context if needed later
  const { loading } = useDashboardData();

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="glass u-container u-container--md" style={{ padding: 'var(--spacing-xl)' }}>
          <h2 style={{ color: 'var(--color-gray10)' }}>در حال بارگذاری داده‌ها...</h2>
        </div>
      </div>
    );
  }

  return <DashboardLayout />;
}

export default App;
import React from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import { DashboardProvider } from './context/DashboardContext';
import AccessGate from './components/auth/AccessGate';
import './App.css';

function App() {
  return (
    <AccessGate>
      <DashboardProvider>
        <DashboardLayout />
      </DashboardProvider>
    </AccessGate>
  );
}

export default App;
import React from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import { DashboardProvider } from './context/DashboardContext';
import './App.css';

function App() {
  return (
    <DashboardProvider>
      <DashboardLayout />
    </DashboardProvider>
  );
}

export default App;
import { generateMockPhysicians } from '../utils/mockData';

/**
 * Mock data service.
 * In a production environment, this will be replaced with actual API calls
 * or CSV parsing logic (e.g., using PapaParse).
 */
export const fetchDashboardData = async () => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // TODO: Replace with actual CSV parsing / API logic
  return {
    current: generateMockPhysicians(),
    previous: [],
  };
};
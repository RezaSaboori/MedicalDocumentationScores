
# Medical Documentation Scores Dashboard

A modern, production-grade React dashboard application for visualizing the quality of medical documentation entered by residents. This application replaces the legacy Python/Dash implementation with a modular, component-based React architecture powered by Vite, utilizing glassmorphism UI styling and interactive Nivo charts.

## 🛠️ Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite
- **UI/Styling:** Custom CSS Variables, Glassmorphism (Liquid Glass system)
- **Charts:** Nivo (`@nivo/scatterplot`, `@nivo/bar`)
- **Data Parsing:** PapaParse (for CSV ingestion)
- **State Management:** React Hooks (Custom hooks)

## 📁 Project Structure

```text
src/
├── components/
│   ├── charts/       # Reusable Nivo chart components
│   ├── filters/      # Dashboard filtering controls
│   ├── kpis/         # Key Performance Indicator cards
│   ├── layout/       # Core layout and grid structures
│   └── table/        # Audit data table
├── hooks/            # Custom React hooks (e.g., useDashboardData)
├── services/         # Data fetching and CSV parsing logic
├── styles/           # Global themes (theme.css, glass.css, base.css)
└── utils/            # Constants, formatters, and flag logic
```

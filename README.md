# Road Safety Enforcement Data Visualization
# Road Safety Enforcement Data Visualization-Group32

## About the Website

This website is a comprehensive data visualization platform for Australian road safety enforcement data. It provides interactive visualizations and analytics tools to explore road safety metrics across Australian states and territories. The platform transforms complex enforcement data into clear, actionable insights through interactive maps, charts, and data tables.

### Key Features

- **Interactive Australian Map**: Explore road safety data across all states and territories with hover tooltips and color-coded visualizations
- **Multiple Analytics Pages**: 
  - **Fines**: Analyze traffic fines data with bar, line, and pie charts
  - **Positive Breath Tests**: Visualize alcohol breath test results over time and by jurisdiction
  - **Positive Drug Tests**: Explore drug test data with interactive filtering
  - **Alcohol & Drug Tests**: Combined analysis of all alcohol and drug testing data
- **Interactive Visualizations**: 
  - Bar charts for state comparisons
  - Line charts for temporal trends
  - Pie charts for proportional distribution
- **Advanced Filtering**: Year range selection, metric comparison, and jurisdiction filtering
- **KPI Dashboard**: Key performance indicators showing totals, highest, and lowest state values
- **Responsive Design**: Modern, accessible interface built with D3.js

### Technologies Used

- **D3.js**: Interactive data visualizations and map rendering
- **KNIME**: Data processing and workflow management
- **HTML/CSS/JavaScript**: Frontend development
- **BITRE Datasets**: Australian road safety enforcement data

---

## Project Progress

### Stand Up 1: Project Initiation and Planning

During the first standup, we established the project foundation and outlined our vision for the road safety data visualization platform.

**Ideas and Concepts:**
- Identified the need for visualizing Australian road safety enforcement data
- Planned to use BITRE datasets covering fines, breath tests, and drug tests
- Designed a multi-page structure with dedicated analytics pages
- Conceptualized an interactive Australian map as the homepage centerpiece
- Decided on D3.js for creating dynamic, interactive visualizations

**Implementation in Website:**
- Created the homepage (`index.html`) with an interactive map of Australia
- Implemented dataset switching functionality for different data types (Positive Breath Tests, Positive Drug Tests, Alcohol & Drug Tests)
- Set up the project structure with separate pages for each analytics category
- Established the navigation system with dropdown menus for easy access to analytics pages

---

### Stand Up 2: Core Features Development

In the second standup, we focused on building the core analytical features and visualization components.

**Ideas and Concepts:**
- Developed the three-chart system: bar charts for comparisons, line charts for trends, and pie charts for distributions
- Implemented KPI metrics to provide quick insights (Total, Highest State, Lowest State)
- Created filtering and comparison capabilities for deeper data exploration
- Designed a unified analytics framework that could be reused across different data pages

**Implementation in Website:**
- Built the analytics pages (`fines.html`, `positive_breath_tests.html`, `positive_drug_tests.html`, `alcohol_drug_tests.html`)
- Created `analytics-common.js` as a shared library for chart rendering and data processing
- Implemented individual page scripts (`fines.page.js`, etc.) for data-specific configurations
- Added interactive controls for year range selection, metric comparison, and jurisdiction filtering
- Developed the KPI dashboard component that updates dynamically based on selected data
- Created data tables for detailed numerical views alongside visualizations

---

### Stand Up 3: Refinement and Enhancement

The third standup focused on polishing the user experience, adding advanced features, and ensuring data accuracy.

**Ideas and Concepts:**
- Enhanced interactivity with hover tooltips and smooth transitions
- Implemented responsive design principles for better accessibility
- Added reset and filter management controls for improved usability
- Created the About page to showcase the team and project mission
- Improved data processing to handle multiple datasets and column detection automatically

**Implementation in Website:**
- Enhanced the homepage map with automatic column detection for flexible data loading
- Added smooth transitions and animations to charts using D3.js transitions
- Implemented the About page (`about.html`) with team member profiles and project information
- Added reset buttons and improved filter controls across all analytics pages
- Created a consistent design system with reusable CSS components
- Improved tooltip functionality with better formatting and accessibility
- Enhanced the map with year filtering and automatic latest year selection

---

## How Ideas Were Used in the Website

### Interactive Map Concept
The homepage features an interactive Australian map that allows users to:
- Switch between different datasets using button controls
- Hover over states to see detailed information in tooltips
- View color-coded visualizations based on data values
- Clear the map with a "No Data" option

### Multi-Chart Analytics System
Each analytics page implements a consistent three-chart approach:
1. **Bar Charts**: Enable state-by-state comparison with filtering capabilities
2. **Line Charts**: Show trends over time with customizable year ranges
3. **Pie Charts**: Display proportional distribution with configurable top N slices

### Data Exploration Features
- **Year Range Filtering**: Users can select specific time periods to analyze trends
- **Jurisdiction Selection**: Multi-select filters allow comparing specific states/territories
- **Metric Comparison**: Compare multiple metrics side-by-side in bar charts
- **KPI Dashboard**: Quick insights at the top of each analytics page

### Responsive Design
- Mobile-friendly navigation with dropdown menus
- Flexible layouts that adapt to different screen sizes
- Accessible color schemes and interactive elements

---

## Team Members

- **Harnihal** - Project Lead
- **Joshua**- Data Engineer (105735912)
- **SwanHtet** - Visualization Specialist 

---

## Data Sources

All data is sourced from BITRE (Bureau of Infrastructure, Transport and Regional Economics) road safety enforcement datasets, processed using KNIME workflows for data cleaning and aggregation.

---

## Acknowledgments

We would like to acknowledge ChatGPT for providing assistance throughout the development of this project. ChatGPT helped with:
- Code structure and organization
- D3.js visualization implementation guidance
- Problem-solving for data processing challenges
- Best practices for interactive data visualization
- JavaScript optimization and error handling
_geo.json map for australia

---

© 2025 Group 32 — Road Safety Enforcement

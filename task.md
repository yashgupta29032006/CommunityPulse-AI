# Tasks: CommunityPulse AI Geolocation Refactor

- [x] Location & Services Layer
  - [x] Update Types (`src/types/index.ts`) with `UserLocation` and `LocationProvider` interfaces
  - [x] Implement pluggable Location Services (`src/services/locationService.ts`) with Browser GPS, IP, Nominatim, and Manual Geocoding
- [x] Telemetry & Grounding Updates
  - [x] Refactor Mock Data (`src/services/mockData.ts`) to dynamically generate sub-regions (Downtown, Industrial, Residential, Tech Park) relative to user coordinates
  - [x] Update RAG Context (`src/services/ragContext.ts`) to use dynamic coordinates and names
- [x] Backend API Route Updates
  - [x] Refactor Chat API (`src/app/api/chat/route.ts`) to ground Gemini in user coordinates, city, and dynamic sub-regions
  - [x] Update Forecast, Alerts, and Recommendations APIs to filter by dynamic location
- [x] UI / UX Refactoring
  - [x] Create Location Status & Search Banner (`src/components/LocationBanner.tsx`)
  - [x] Update Leaflet Map (`src/components/LeafletMap.tsx`) to show "You Are Here" marker and center on user coordinates
  - [x] Update Report Compiler (`src/components/ReportGenerator.tsx`) to remove Singapore names and localize headings
  - [x] Update main Dashboard Layout (`src/app/page.tsx`, `src/components/DashboardHeader.tsx`) to orchestrate geolocations
- [x] Verification
  - [x] Run typescript checks (`npm run build`)
  - [x] Verify Geolocation allowed/denied flows
  - [x] Generate walk-through report

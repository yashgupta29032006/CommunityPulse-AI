# CommunityPulse AI — Decision Intelligence Platform (Singapore)

**Grounded Generative AI & Urban Telemetry Orchestration // Google Gen AI APAC Challenge Submission**

CommunityPulse AI is a production-quality, visually stunning Decision Intelligence Platform designed to help governments, NGOs, and citizens optimize public utility and environmental responses. Moving beyond simple chatbots or static dashboards, this platform models Singapore's dense urban sectors (Central Area, Jurong Industrial, Woodlands, and Changi), integrates real-time air quality (AQI), heat indices, traffic congestion, and citizen complaints, forecasts risk curves, and provides a conversational AI Copilot with complete reasoning explainability.

---

## 🌟 Key Features

1. **AI Decision Copilot (PulseCopilot)**: A conversational AI sidebar powered by the Gemini API (`gemini-2.5-flash`). It interprets natural language requests, reasons over municipal telemetry, suggest actions, and presents logical chain-of-thought steps.
2. **Retrieval-Augmented Generation (RAG)**: Injects live metrics, citizen complaints, active warning alerts, and current resource logs directly into the Gemini prompt context, ensuring factual responses and eliminating hallucinations.
3. **Closed-Loop Decision Orchestration**: Allows City Administrators to "execute" AI-recommended protocols (e.g. deploying air purification grids, opening cooling shelters, or dispatching traffic patrols). Deploying resources immediately updates the active assets table, dynamically lowers local hazards (AQI, temperature, congestion), and recalculates risk indices.
4. **Unified Operations Dashboard**: Interactive cards and charts showcasing air quality index, weather temperature/humidity, traffic utilization, healthcare demand, and citizen complaints.
5. **Interactive GIS Map**: Supports a dual map interface:
   - **Geographic View**: Powered by Leaflet, displaying live CartoDB Dark Matter / Positron maps centered in Singapore, rendering PM2.5 and temperature dispersion rings.
   - **Schematic View**: A stylized vector (SVG) schematic map that runs 100% offline, fits dark dashboards, and highlights alert regions.
6. **Predictive Forecasting**: Multi-variable 7-day outlook charts showing projected temperature rises, traffic commutes, and AQI fluctuations using Recharts area, line, and bar charts.
7. **Explainable AI (XAI)**: Exposes reasoning logs (inputs used, chain of thought steps, evidence grounding, and confidence percentages) next to every AI answer.
8. **Situation Report Compiler**: An automated report builder compiling real-time metrics, active alerts, and recommendations into a formatted daily executive brief downloadable as a vector PDF.
9. **Role-Based Views**: Tailors features and metrics for **Citizens**, **NGO Coordinators** (focusing on elderly vulnerability index), and **City Administrators** (command resource controls).

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router) with React 19 & TypeScript
- **Styling**: Tailwind CSS v4 (supporting transition-ready Dark/Light theme toggles)
- **Data Visualization**: Recharts (with client-side hydration failsafes)
- **Mapping**: Leaflet & React-Leaflet (Map overlays)
- **AI Engine**: Google Gen AI SDK (`@google/genai`) referencing `gemini-2.5-flash`
- **Containerization**: Multi-stage lightweight Dockerfile (Alpine-based Node image)

---

## 📁 Directory Architecture

```
/
├── Dockerfile                  # Multi-stage production container build
├── package.json                # Project dependencies (Next, React, Leaflet, Recharts)
├── tsconfig.json               # TypeScript rules
├── src/
│   ├── types/
│   │   └── index.ts            # Type contracts (RegionData, Alert, Recommendation, etc.)
│   ├── services/
│   │   ├── mockData.ts         # Telemetry database & closed-loop modifiers
│   │   └── ragContext.ts       # RAG context compiler
│   ├── app/
│   │   ├── page.tsx            # Main layout controller and closed loop state
│   │   ├── layout.tsx          # HTML header, metadata, & Inter font loading
│   │   ├── globals.css         # CSS Variables, dark overrides, and Leaflet styles
│   │   └── api/
│   │       ├── chat/           # Gemini API chat router (with local fallback)
│   │       ├── forecast/       # 7-day mathematical prediction engine
│   │       ├── alerts/         # Anomaly detection system
│   │       └── recommendations/# Grounded action recommendations
│   └── components/
│       ├── LandingPage.tsx     # Hero landing page and persona selector
│       ├── DashboardHeader.tsx # Navigation, local clock, alerts badge, and theme toggler
│       ├── InteractiveMap.tsx  # Dynamic Leaflet map wrapper and SVG schematic fallback
│       ├── LeafletMap.tsx      # Leaflet tile layers & CircleMarker hot spots
│       ├── KpiGrid.tsx         # Responsive KPI summary cards matching active persona
│       ├── AnalyticsCharts.tsx # Recharts historical timeline area and bar charts
│       ├── CopilotPanel.tsx    # PulseCopilot Chat and Explainability Drawer
│       ├── AlertsPanel.tsx     # Active anomalies log & deploy action handlers
│       └── ReportGenerator.tsx # Print-ready situation report compiler & PDF print engine
```

---

## 🚀 Setup & Execution

### 1. Environment Configuration
Create a `.env` or `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```
Add your Gemini API Key:
```env
GEMINI_API_KEY=AIzaSy...
```
*(Failsafe: If no `GEMINI_API_KEY` is provided, the platform automatically engages a highly context-aware local heuristic engine so reviewers can fully interact with the chat and explainability features immediately).*

### 2. Run the Development Server
Install dependencies and run local server:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your browser.

### 3. Build & Verify for Production
Verify compilation and TypeScript type checking:
```bash
npm run build
npm run start
```

---

## 🐳 Docker Deployment

### 1. Build Container Image
```bash
docker build -t community-pulse-ai .
```

### 2. Run Container Locally
Run the container, passing your Gemini API Key:
```bash
docker run -p 3000:3000 -e GEMINI_API_KEY="your_api_key_here" community-pulse-ai
```
Access the application at [http://localhost:3000](http://localhost:3000).

---

## ☁️ Google Cloud Run Deployment Guide

Deploy your containerized platform directly to Google Cloud Run in three simple commands:

### Prerequisites
1. Install the Google Cloud CLI (`gcloud`).
2. Log in and configure your target project:
   ```bash
   gcloud auth login
   gcloud config set project [YOUR_PROJECT_ID]
   ```

### Step 1: Build & Submit to Artifact Registry
Use Cloud Build to build the image and push it to Google Artifact Registry:
```bash
gcloud builds submit --tag gcr.io/[YOUR_PROJECT_ID]/community-pulse-ai
```

### Step 2: Deploy to Cloud Run
Deploy the container, injecting the Gemini API key securely. Enable public unauthenticated access for submission testing:
```bash
gcloud run deploy community-pulse-ai \
  --image gcr.io/[YOUR_PROJECT_ID]/community-pulse-ai \
  --platform managed \
  --region asia-southeast1 \
  --set-env-vars GEMINI_API_KEY="[YOUR_GEMINI_API_KEY]" \
  --allow-unauthenticated
```
*(Replace `asia-southeast1` with your preferred region, e.g. `us-central1` or `australia-southeast1`).*

### Step 3: Access Deployment
Once completed, the terminal will print a service URL (e.g. `https://community-pulse-ai-xxxxxx-as.a.run.app`). Your APAC Challenge submission is now live, containerized, and scaling on Google Cloud!

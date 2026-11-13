# Hulikere Gram Panchayat Asset Manager

A lightweight civic asset management web application built for **Hulikere Gram Panchayat** (Mandya District, Karnataka, India) using **React**, **Vite**, **Tailwind CSS**, **Leaflet** (OpenStreetMap tiles), and **Recharts**. All data is stored locally in `src/data/assets.json` and edits persist in browser `localStorage` with no backend required.

## Prerequisites

- **Node.js** 18+ and **npm**

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. (Optional) Fetch real OpenStreetMap data for Hulikere via Overpass API:

   ```bash
   npm run fetch:osm
   ```

   This runs `scripts/fetchOsm.js`, queries Overpass API by area name (`"Hulikere"` in `"Mandya"` district) with a configurable fallback bounding box (`CONFIG.fallbackBbox` in `scripts/fetchOsm.js`), converts the results to GeoJSON in `src/data/osm.json`, and logs feature counts by type.

3. Start the development server:

   ```bash
   npm run dev
   ```

3. Open the local URL shown in your terminal (typically `http://localhost:5173`).

4. Build for production (optional):

   ```bash
   npm run build
   npm run preview
   ```

## Demo Credentials

The login screen displays both hardcoded demo accounts with 1-click fill/login buttons:

| Role | Username | Password | Permissions |
| --- | --- | --- | --- |
| **Admin (PDO)** | `admin` | `admin123` | Full access: add/edit/delete assets, log maintenance, report/resolve complaints, reset demo data |
| **Viewer** | `viewer` | `viewer123` | Read-only browsing across Home, Map, Dashboard, Complaints, Wards, and Print Register |

## Included Pages & Features

- **Home Screen**: Overview metrics and large navigation cards to Map, Dashboard, Complaints, Print Register, and Wards.
- **Map Page**: Full-screen OpenStreetMap Leaflet view clustered around `12.52, 76.90` with condition-colored asset markers/roads, layer checkboxes, ward & condition filters, corner legend, asset side panel (details, photo placeholder, maintenance history), **Add Asset** (click on map or use GPS location), **Edit / Delete**, and **Report a Problem**.
- **Dashboard**: Summary KPI cards (water tanks, road km, public buildings, street lights, % lights working), Recharts bar chart of condition by asset type, ward-wise breakdown table, and a **Needs Attention** list linking directly to assets on the map.
- **Complaints**: Tracks `New`, `Open`, `In Progress`, and `Resolved` complaints with attached field photos; updating a complaint automatically updates the linked asset's condition and maintenance history.
- **Public Citizen Report (`/report`) & QR Notice Board**: No-login bilingual Kannada/English form at `/report` (choose problem type, tap map or use GPS location, attach compressed camera/upload photo, optional phone number) that creates `New` complaints, paired with a printable QR poster on the Home page.
- **Photo Compression & IndexedDB Storage**: Photos taken or uploaded on Add Asset, Report Problem, and `/report` are compressed under 300 KB and stored as binary blobs in IndexedDB.
- **Print Register**: A4-printable register tables for all 4 asset categories with Gram Panchayat header, date, signature lines, and per-table **Download CSV** buttons.
- **Bilingual Toggle (`English / ಕನ್ನಡ`)**: Translates UI labels, asset names, asset subtypes, and statuses using `Noto Sans Kannada`.
- **Reset demo data**: Restores `localStorage` back to the original sample dataset in `src/data/assets.json`.

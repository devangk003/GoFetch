# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/d240d840-464c-4704-8602-651923069988

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/d240d840-464c-4704-8602-651923069988) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/d240d840-464c-4704-8602-651923069988) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)



Build a modern, sleek, and responsive React web app dashboard for exploring air quality data. It should have a futuristic UI similar to Google Maps or Apple Maps design language.

Pages and Features:

1. 🌐 **Main Dashboard Layout**
   - Fullscreen interactive map using Leaflet.js or Mapbox
   - Floating cards styled with Tailwind (glassmorphism preferred)
   - Top navbar with app name and navigation tabs: [map], [trends], [predictions]

2. 🔍 **Natural Language Search Bar**
   - Positioned at the top or floating over the map
   - Accepts queries like “AQI in Mumbai last week”
   - Simple UI with a search icon, placeholder, and clear button

3. 🗺️ **Map View**
   - Uses Leaflet.js to display monitoring stations with colored AQI markers (green to red gradient)
   - Clicking a marker shows a popup with:
     - Monitoring station name
     - AQI value
     - Date
     - Top pollutant

4. 📈 **Trends View**
   - Use Chart.js or Recharts
   - Interactive line charts for AQI over time
   - Bar charts to compare multiple locations

5. 🔮 **Prediction Page**
   - Select city and date range
   - Show predicted AQI for next 3–7 days using a card layout
   - Optional: Add confidence interval with shaded graph

6. 📱 **Mobile-First Responsive Design**
   - Tailwind CSS for layout and styling
   - Collapsible sidebar for filters
   - Cards and map auto-stack on mobile
   - Fixed bottom navbar on mobile for navigation

7. ⚠️ **UX Enhancements**
   - Loading skeletons while data loads
   - Empty state cards when no results
   - Error cards with retry buttons

8. 🌙 **Dark Mode Support**
   - Toggle in navbar
   - Smooth transitions between light/dark mode

Use modern design principles: smooth transitions, rounded corners, soft shadows, and hover animations. Use Tailwind utility classes and React functional components throughout. The data comes from an API endpoint.

**Complete API Endpoints**

##### **Core Required Endpoints:**
- ✅ `GET /api/data` - Fetch all data with pagination
- ✅ `POST /api/search` - Advanced search with body filters
- ✅ `GET /api/predict/:city` - AI predictions for cities

##### **Enhanced Endpoints:**
- ✅ `GET /api/v1/air-quality` - Full data access
- ✅ `GET /api/v1/air-quality/search` - Query string search
- ✅ `POST /api/v1/air-quality/search` - Advanced POST search
- ✅ `GET /api/v1/air-quality/predict/:city` - AI predictions
- ✅ `GET /api/v1/air-quality/geo` - Geographic data for mapping
- ✅ `GET /api/v1/air-quality/statistics` - Statistical summaries
- ✅ `GET /api/v1/air-quality/trends` - Monthly trends
- ✅ `GET /api/v1/air-quality/alerts` - High pollution events
- ✅ `GET /api/v1/air-quality/state/:state` - State-specific data
- ✅ `GET /api/v1/air-quality/:id` - Individual records
- ✅ `GET /api/v1/air-quality/health-check` - API health status
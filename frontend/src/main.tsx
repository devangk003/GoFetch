import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'leaflet/dist/leaflet.css' // Import Leaflet CSS

createRoot(document.getElementById("root")!).render(<App />);

import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// StrictMode is intentionally omitted: it double-invokes effects in dev,
// which races GSAP's imperative timelines against each other (GSAP
// timelines aren't designed to be re-entered mid-flight).
createRoot(document.getElementById('root')!).render(<App />);

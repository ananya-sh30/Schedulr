// src/App.tsx
import { useEffect } from "react";
import SchedulerPanel from "./components/SchedulerPanel";

import "./index.css";

function App() {
  useEffect(() => {
    const loadScript = (src: string, name: string) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;

      script.onload = () => {
        console.log(`${name} WASM Module loaded.`);
      };

      script.onerror = () => {
        console.error(`Failed to load ${name} WASM module.`);
      };

      document.body.appendChild(script);
    };

    loadScript("/fcfs.js", "FCFS");
    loadScript("/sjf.js", "SJF");
    loadScript("/rr.js", "RR");
    loadScript("/priority.js", "PRIORITY");
  }, []);

  return (
    <div>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center pt-4">
        <SchedulerPanel />
      </div>
    </div>
  );
}

export default App;

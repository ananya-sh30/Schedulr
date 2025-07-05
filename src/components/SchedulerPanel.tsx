import { useState } from "react";
import FCFSForm from "./FCFSForm";
import SJFForm from "./SJFForm";
import RRForm from "./RRForm";
import PRIORITYForm from "./PRIORITYForm";

// Algorithm configurations
const algorithms = [
  { label: "FCFS", value: "fcfs", color: "blue" },
  { label: "SJF", value: "sjf", color: "teal" },
  { label: "Round Robin", value: "rr", color: "amber" },
  { label: "Priority", value: "prio", color: "slate" },
] as const;

type AlgoKey = (typeof algorithms)[number]["value"];

// Static Tailwind class mappings (no dynamic interpolation)
const colorClasses: Record<string, { selected: string; unselected: string }> = {
  blue: {
    selected: "bg-blue-600 text-white border-blue-700 scale-105",
    unselected: "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:shadow",
  },
  teal: {
    selected: "bg-teal-600 text-white border-teal-700 scale-105",
    unselected: "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:shadow",
  },
  amber: {
    selected: "bg-amber-600 text-white border-amber-700 scale-105",
    unselected: "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:shadow",
  },
  slate: {
    selected: "bg-slate-600 text-white border-slate-700 scale-105",
    unselected: "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:shadow",
  },
};

const SchedulerPanel = () => {
  const [selectedAlgo, setSelectedAlgo] = useState<AlgoKey>("fcfs");

  return (
    <div className="w-full pt-20 px-4 pb-10">
      {/* Title and Subheading */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Schedulr++</h1>
        <p className="text-md text-gray-500">
          Visualize CPU scheduling algorithms powered by C++ and WebAssembly.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap justify-center gap-3">
        {algorithms.map(({ label, value, color }) => (
          <button
            key={value}
            onClick={() => setSelectedAlgo(value)}
            className={`px-5 py-2.5 rounded-lg font-semibold border text-sm transition-all duration-200 shadow-sm ${
              selectedAlgo === value
                ? colorClasses[color].selected
                : colorClasses[color].unselected
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Algorithm Form Section */}
      <div>
        {selectedAlgo === "fcfs" && <FCFSForm />}
        {selectedAlgo === "sjf" && <SJFForm />}
        {selectedAlgo === "rr" && <RRForm />}
        {selectedAlgo === "prio" && <PRIORITYForm />}
      </div>
    </div>
  );
};

export default SchedulerPanel;

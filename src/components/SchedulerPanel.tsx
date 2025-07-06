import { useState } from "react";
import FCFSForm from "./FCFSForm";
import SJFForm from "./SJFForm";
import RRForm from "./RRForm";
import PRIORITYForm from "./PRIORITYForm";
import GridBackground from "./GridBackground";


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
    <div className="w-full pb-10">
 <div className="relative pt-20 pb-4 overflow-hidden ">
      <GridBackground />

      <div className="relative z-10 text-center">
        <h1 className="text-5xl font-extrabold text-gray-800 tracking-tight">
          Schedulr<sup className="text-indigo-600 text-2xl">++</sup>
        </h1>
        <p className="mt-3 text-lg text-gray-500 leading-relaxed">
          Powered by <span className="font-semibold text-gray-700">C++</span> and{" "}
          <span className="font-semibold text-gray-700">WebAssembly</span>
        </p>
      </div>
    

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap justify-center gap-4 mt-10 relative z-10 ">
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
      <div className="relative z-10 px-2">
        {selectedAlgo === "fcfs" && <FCFSForm />}
        {selectedAlgo === "sjf" && <SJFForm />}
        {selectedAlgo === "rr" && <RRForm />}
        {selectedAlgo === "prio" && <PRIORITYForm />}
      </div>
    </div>
    </div>
  );
};

export default SchedulerPanel;

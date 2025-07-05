import { useState } from "react";
import Results from "./Results";
import GanttChart from "./GanttChart";
import ProcessStateVisualizer from "./ProcessStateVisualizer";
import { motion } from "framer-motion";
import { Cpu, Play, PlusCircle } from "lucide-react";

function SJFForm() {
  const [processes, setProcesses] = useState([{ arrival: 0, burst: 1 }]);
  const [result, setResult] = useState<any | null>(null);
  const [mode, setMode] = useState<"non-preemptive" | "preemptive">("non-preemptive");

  const addProcess = () => {
    setProcesses([...processes, { arrival: 0, burst: 1 }]);
  };

  const update = (index: number, field: "arrival" | "burst", value: number) => {
    const newProcs = [...processes];
    newProcs[index][field] = value;
    setProcesses(newProcs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const arrivalTimes = processes.map((p) => p.arrival);
    const burstTimes = processes.map((p) => p.burst);

    const SJFModule = await (window as any).SJFModule();
    const VectorInt = SJFModule.VectorInt;

    const arrivalVec = new VectorInt();
    const burstVec = new VectorInt();
    arrivalTimes.forEach((t) => arrivalVec.push_back(t));
    burstTimes.forEach((t) => burstVec.push_back(t));

    const output = JSON.parse(
      mode === "non-preemptive"
        ? SJFModule.sjf_schedule(arrivalVec, burstVec)
        : SJFModule.sjf_preemptive_schedule(arrivalVec, burstVec)
    );

    setResult(output);

    arrivalVec.delete();
    burstVec.delete();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 mt-10">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-6">
        {/* Form Section */}
        <div className="bg-white p-6 rounded-lg shadow w-full lg:w-1/2 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="flex items-center justify-center gap-2 text-teal-600 mb-2">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-bold flex justify-center items-center gap-2">
                  <Cpu className="w-8 h-8" />
                  SJF Scheduler
                </h2>
                <p className="text-xs text-gray-500">
                  Schedule Shortest Job First processes
                </p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "non-preemptive" | "preemptive")}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="non-preemptive">Non-Preemptive</option>
                <option value="preemptive">Preemptive</option>
              </select>
            </div>

            {/* Process Inputs */}
            {processes.map((proc, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-teal-50 border border-teal-200 p-4 rounded-lg shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-teal-700">Process P{index + 1}</h3>
                  {index === processes.length - 1 && (
                    <button
                      type="button"
                      onClick={addProcess}
                      className="flex items-center gap-1 text-sm bg-teal-500 text-white px-3 py-1 rounded hover:bg-teal-600"
                    >
                      <PlusCircle className="w-4 h-4" /> Add Process
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Arrival Time */}
                  <div>
                    <label className="text-sm block mb-1 text-gray-700">Arrival Time</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={20}
                        value={proc.arrival}
                        onChange={(e) =>
                          update(index, "arrival", parseInt(e.target.value))
                        }
                        className="w-full"
                      />
                      <input
                        type="number"
                        value={proc.arrival}
                        onChange={(e) =>
                          update(index, "arrival", parseInt(e.target.value))
                        }
                        className="w-16 border border-gray-300 rounded px-1 py-0.5 text-sm"
                      />
                    </div>
                  </div>

                  {/* Burst Time */}
                  <div>
                    <label className="text-sm block mb-1 text-gray-700">Burst Time</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={proc.burst}
                        onChange={(e) =>
                          update(index, "burst", parseInt(e.target.value))
                        }
                        className="w-full"
                      />
                      <input
                        type="number"
                        value={proc.burst}
                        onChange={(e) =>
                          update(index, "burst", parseInt(e.target.value))
                        }
                        className="w-16 border border-gray-300 rounded px-1 py-0.5 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-teal-600 text-white p-3 rounded-lg hover:bg-teal-700 text-lg font-semibold flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Schedule
            </button>
          </form>
        </div>

        {/* Results Section */}
        {result && (
          <div className="w-full lg:w-1/2 space-y-6">
            <Results
              processTable={result.process_table}
              averageTurnaround={result.average_turnaround}
              averageWaiting={result.average_waiting}
            />
            <GanttChart
              processes={result.process_table}
              runningProcessMap={result.running_process}
            />
            <ProcessStateVisualizer
              processes={result.process_table}
              readyQueue={result.ready_queue}
              runningProcessMap={result.running_process}
              completedPIDs={result.completed}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default SJFForm;

import { useState } from "react";
import Results from "./Results";
import GanttChart from "./GanttChart";
import ProcessStateVisualizer from "./ProcessStateVisualizer";
import { motion } from "framer-motion";
import { Cpu, PlusCircle, Play } from "lucide-react";

function PRIORITYForm() {
  const [processes, setProcesses] = useState([{ arrival: 0, burst: 1, priority: 1 }]);
  const [result, setResult] = useState<any | null>(null);
  const [mode, setMode] = useState<"non-preemptive" | "preemptive">("non-preemptive");

  const addProcess = () => {
    setProcesses([...processes, { arrival: 0, burst: 1, priority: 1 }]);
  };

  const update = (
    index: number,
    field: "arrival" | "burst" | "priority",
    value: number
  ) => {
    const newProcs = [...processes];
    newProcs[index][field] = value;
    setProcesses(newProcs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const arrivalTimes = processes.map((p) => p.arrival);
    const burstTimes = processes.map((p) => p.burst);
    const priorities = processes.map((p) => p.priority);

    const PModule = await (window as any).PModule();
    const VectorInt = PModule.VectorInt;

    const arrivalVec = new VectorInt();
    const burstVec = new VectorInt();
    const priorityVec = new VectorInt();

    arrivalTimes.forEach((t) => arrivalVec.push_back(t));
    burstTimes.forEach((t) => burstVec.push_back(t));
    priorities.forEach((p) => priorityVec.push_back(p));

    const output = JSON.parse(
      mode === "non-preemptive"
        ? PModule.priority_schedule(arrivalVec, burstVec, priorityVec)
        : PModule.priority_preemptive_schedule(arrivalVec, burstVec, priorityVec)
    );
    setResult(output);

    arrivalVec.delete();
    burstVec.delete();
    priorityVec.delete();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 mt-10">
      <div
        className={`flex flex-col ${
          result ? "lg:flex-row lg:items-start lg:gap-6" : "items-center"
        }`}
      >
        {/* Form Section */}
        <div
          className={`bg-white p-6 rounded-lg shadow w-full max-w-xl ${
            result ? "lg:w-1/2" : ""
          }`}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="flex flex-col items-center justify-center text-slate-700 mb-4">
              <div className="flex items-center gap-2 ">
                <Cpu className="w-7 h-7" />
                <h2 className="text-2xl font-bold text-center">Priority Scheduler</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 text-center">
                Control execution based on process importance
              </p>
            </div>

            {/* Mode Selector */}
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "non-preemptive" | "preemptive")}
                className="w-full border border-slate-300 rounded px-3 py-2"
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
                className="bg-slate-50 border border-slate-200 p-4 rounded-lg shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-slate-700">Process P{index + 1}</h3>
                  {index === processes.length - 1 && (
                    <button
                      type="button"
                      onClick={addProcess}
                      className="text-sm bg-slate-600 text-white px-3 py-1 rounded hover:bg-slate-700 flex items-center gap-1"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Add 
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Arrival Time */}
                  <div>
                    <label className="text-sm block mb-1 text-slate-700">Arrival</label>
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
                        className="w-16 border border-slate-300 rounded px-1 py-0.5 text-sm"
                      />
                    </div>
                  </div>

                  {/* Burst Time */}
                  <div>
                    <label className="text-sm block mb-1 text-slate-700">Burst</label>
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
                        className="w-16 border border-slate-300 rounded px-1 py-0.5 text-sm"
                      />
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="text-sm block mb-1 text-slate-700">Priority</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={proc.priority}
                        onChange={(e) =>
                          update(index, "priority", parseInt(e.target.value))
                        }
                        className="w-full"
                      />
                      <input
                        type="number"
                        value={proc.priority}
                        onChange={(e) =>
                          update(index, "priority", parseInt(e.target.value))
                        }
                        className="w-16 border border-slate-300 rounded px-1 py-0.5 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-slate-700 text-white p-3 rounded-lg hover:bg-slate-800 text-lg font-semibold flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Schedule
            </button>
          </form>
        </div>

        {/* Results Section */}
        {result && (
          <div className="w-full lg:w-1/2 mt-10 lg:mt-0 space-y-6">
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

export default PRIORITYForm;

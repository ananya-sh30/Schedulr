import { useState } from "react";
import Results from "./Results";
import GanttChart from "./GanttChart";
import ProcessStateVisualizer from "./ProcessStateVisualizer";
import { motion } from "framer-motion";
import { PlusCircle, Play, Cpu } from "lucide-react";

function FCFSForm() {
  const [processes, setProcesses] = useState([{ arrival: 0, burst: 1 }]);
  const [result, setResult] = useState<any | null>(null);

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

    const FCFSModule = await (window as any).FCFSModule();
    const VectorInt = FCFSModule.VectorInt;

    const arrivalVec = new VectorInt();
    const burstVec = new VectorInt();

    arrivalTimes.forEach((t) => arrivalVec.push_back(t));
    burstTimes.forEach((t) => burstVec.push_back(t));

    const output = JSON.parse(FCFSModule.fcfs_schedule(arrivalVec, burstVec));
    setResult(output);

    arrivalVec.delete();
    burstVec.delete();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 mt-16">
      <div
        className={`flex flex-col ${
          result ? "lg:flex-row lg:items-start lg:gap-6" : "items-center"
        }`}
      >
        {/* Form Section */}
        <div
          className={`bg-white p-6 rounded-xl shadow-md w-full max-w-xl ${
            result ? "lg:w-1/2" : ""
          }`}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-blue-500 flex justify-center items-center gap-2">
                <Cpu className="w-7 h-7" />
                FCFS Scheduler
              </h2>
              <p className="text-xs text-gray-500 mb-4 text-center">
                Schedule First-Come-First-Serve processes
              </p>
            </div>

            {processes.map((proc, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 p-4 rounded-lg shadow-sm"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-blue-500">
                    Process P{index + 1}
                  </h3>
                  {index === processes.length - 1 && (
                    <button
                      type="button"
                      onClick={addProcess}
                      className="flex items-center gap-1 text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Add 
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Arrival Time */}
                  <div>
                    <label className="text-sm block mb-1 text-gray-700">
                      Arrival Time
                    </label>
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
                        className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>

                  {/* Burst Time */}
                  <div>
                    <label className="text-sm block mb-1 text-gray-700">
                      Burst Time
                    </label>
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
                        className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-700 text-md font-semibold transition"
            >
              <Play className="w-6 h-6" />
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

export default FCFSForm;

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  RefreshCcw,
  Clock,
  Timer,
  CheckCircle,
  Cpu,
} from "lucide-react";

type Process = {
  pid: number;
  arrivalTime: number;
  start?: number;
  end?: number;
};

type Props = {
  processes: Process[];
  readyQueue: Record<number, number[]>;
  runningProcessMap: Record<number, number>;
  completedPIDs: number[];
};

const ProcessStateVisualizer = ({
  processes,
  readyQueue,
  runningProcessMap,
  completedPIDs,
}: Props) => {
  const [currentTime, setCurrentTime] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const maxTime = Math.max(
    ...Object.keys(runningProcessMap).map((t) => parseInt(t, 10)),
    ...processes.map((p) => p.end ?? 0)
  );

  const startSimulation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCurrentTime(0);
    const id = window.setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= maxTime) {
          clearInterval(id);
          return prev;
        }
        return prev + 1;
      });
    }, 1600);
    intervalRef.current = id;
  };

  useEffect(() => {
    startSimulation();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [maxTime]);

  const currentReadyQueue: Process[] = (readyQueue[currentTime] || [])
    .map((pid) => processes.find((p) => p.pid === pid))
    .filter((p): p is Process => !!p);

  const currentRunningPID = runningProcessMap[currentTime];
  const runningProcess =
    processes.find((p) => p.pid === currentRunningPID) || null;

  const completed: Process[] = completedPIDs
    .map((pid) => processes.find((p) => p.pid === pid))
    .filter((p): p is Process => !!p && (p.end ?? Infinity) <= currentTime);

  return (
    <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-indigo-700 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Process State at Time {currentTime}
        </h3>
        <button
          onClick={startSimulation}
          className="flex items-center gap-1 text-sm bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 transition"
        >
          <RefreshCcw className="w-4 h-4" />
          Rerun Animation
        </button>
      </div>

      {/* State Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ready Queue */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-1">
            <Timer className="w-4 h-4" />
            Ready Queue
          </h4>
          <div className="flex gap-2 flex-wrap">
            {currentReadyQueue.length > 0 ? (
              currentReadyQueue.map((p) => (
                <motion.div
                  key={`ready-${p.pid}`}
                  className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded shadow text-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  P{p.pid}
                </motion.div>
              ))
            ) : (
              <div className="text-xs text-gray-400">No processes waiting</div>
            )}
          </div>
        </div>

        {/* Running Process */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-1">
            <Cpu className="w-4 h-4" />
            Running
          </h4>
          {runningProcess ? (
            <motion.div
              key={`running-${runningProcess.pid}-${currentTime}`}
              className="bg-green-100 text-green-800 px-4 py-2 rounded shadow text-sm font-semibold inline-block"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              P{runningProcess.pid}
            </motion.div>
          ) : (
            <div className="text-xs text-gray-400">CPU Idle</div>
          )}
        </div>

        {/* Completed Processes */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Completed
          </h4>
          <div className="flex gap-2 flex-wrap">
            {completed.length > 0 ? (
              completed.map((p) => (
                <motion.div
                  key={`done-${p.pid}`}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  P{p.pid}
                </motion.div>
              ))
            ) : (
              <div className="text-xs text-gray-400">No processes finished yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessStateVisualizer;

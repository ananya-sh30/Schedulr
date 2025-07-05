// src/components/FCFSResults.tsx
import { motion } from "framer-motion";

type Process = {
  pid: number;
  arrival: number;
  burst: number;
  start: number;
  end: number;
  turnaround: number;
  waiting: number;
};

type ResultsProps = {
  processTable: Process[];
  averageTurnaround: number;
  averageWaiting: number;
};

const Results = ({ processTable, averageTurnaround, averageWaiting }: ResultsProps) => {
  return (
    <motion.div
      className="bg-gray-50 p-6 rounded-xl shadow-lg"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.h3
        className="text-xl font-bold mb-6 text-indigo-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Scheduling Summary
      </motion.h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-indigo-100 text-indigo-900">
            <tr>
              <th className="px-4 py-2">PID</th>
              <th className="px-4 py-2">Arrival</th>
              <th className="px-4 py-2">Burst</th>
              <th className="px-4 py-2">Start</th>
              <th className="px-4 py-2">End</th>
              <th className="px-4 py-2">Turnaround</th>
              <th className="px-4 py-2">Waiting</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {processTable.map((p, idx) => (
              <motion.tr
                key={p.pid}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
              >
                <td className="px-4 py-2 font-medium text-center">P{p.pid}</td>
                <td className="px-4 py-2 text-center">{p.arrival}</td>
                <td className="px-4 py-2 text-center">{p.burst}</td>
                <td className="px-4 py-2 text-center">{p.start}</td>
                <td className="px-4 py-2 text-center">{p.end}</td>
                <td className="px-4 py-2 text-center">{p.turnaround}</td>
                <td className="px-4 py-2 text-center">{p.waiting}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <motion.div
        className="mt-6 space-y-1 text-sm text-gray-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p>
          <strong>Average Turnaround Time:</strong>{" "}
          <span className="text-indigo-600 font-semibold">
            {averageTurnaround}
          </span>
        </p>
        <p>
          <strong>Average Waiting Time:</strong>{" "}
          <span className="text-indigo-600 font-semibold">
            {averageWaiting}
          </span>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default Results;

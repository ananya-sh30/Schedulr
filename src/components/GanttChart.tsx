import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart2 } from "lucide-react";

type TimelineEntry = {
  time: number;
  pid: number; // -1 for idle
};

type Process = {
  pid: number;
  arrival: number;
  burst: number;
  start: number;
  end: number;
};

type GanttChartProps = {
  processes: Process[];
  runningProcessMap: Record<number, number>;
};

const colorPalette = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"
];

const GanttChart = ({ processes, runningProcessMap }: GanttChartProps) => {
  const [currentTime, setCurrentTime] = useState(0);

  const timeline: TimelineEntry[] = useMemo(() => {
    const times = Object.keys(runningProcessMap).map(Number);
    if (times.length === 0) return [];

    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const result: TimelineEntry[] = [];
    let lastPid: number | null = null;

    for (let t = minTime; t <= maxTime + 1; t++) {
      const pid = runningProcessMap.hasOwnProperty(t) ? runningProcessMap[t] : -1;
      if (pid !== lastPid) {
        result.push({ time: t, pid });
        lastPid = pid;
      }
    }

    return result;
  }, [runningProcessMap]);

  if (!timeline.length || !processes.length) return null;

  const sortedTimeline = [...timeline].sort((a, b) => a.time - b.time);
  const startTime = sortedTimeline[0].time;
  const endTime = Math.max(...processes.map((p) => p.end));
  const totalTime = endTime - startTime;

  useEffect(() => {
    setCurrentTime(startTime);
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= endTime) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeline]);

  const buildBlocks = () => {
    const blocks = [];

    for (let i = 0; i < sortedTimeline.length; i++) {
      const current = sortedTimeline[i];
      const next = sortedTimeline[i + 1];
      const start = current.time;
      const end = next ? next.time : endTime;
      const duration = end - start;

      if (duration <= 0) continue;

      const widthPercent = (duration / totalTime) * 100;
      const isActive = currentTime >= start && currentTime < end;

      const style = {
        width: `${widthPercent}%`,
        backgroundColor:
          current.pid === -1
            ? "#d1d5db"
            : colorPalette[current.pid % colorPalette.length],
      };

      const label = current.pid === -1 ? "Idle" : `P${current.pid}`;

      blocks.push(
        <motion.div
          key={`block-${start}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`h-full flex items-center justify-center text-xs font-semibold ${
            current.pid === -1 ? "text-gray-700" : "text-white"
          } ${isActive ? "ring-2 ring-offset-1 ring-indigo-500" : ""}`}
          style={style}
          title={`${label} (${start} - ${end})`}
        >
          {label}
        </motion.div>
      );
    }

    return blocks;
  };

  const renderTimeLabels = () => {
    const labels = [];
    const step = totalTime > 20 ? 2 : 1;

    for (let t = startTime; t <= endTime; t += step) {
      const leftPercent = ((t - startTime) / totalTime) * 100;
      labels.push(
        <div
          key={t}
          className="absolute text-[10px] text-gray-700 font-mono"
          style={{
            left: `${leftPercent}%`,
            transform: "translateX(-50%)",
          }}
        >
          {t}
        </div>
      );
    }
    return labels;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-2 mb-2 text-indigo-700">
        <BarChart2 className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Gantt Chart</h3>
      </div>

      <div className="relative w-full h-12 flex border border-gray-300 rounded overflow-hidden">
        {buildBlocks()}
      </div>

      <div className="relative mt-2 w-full h-5">
        {renderTimeLabels()}
      </div>
    </div>
  );
};

export default GanttChart;

#include <emscripten/bind.h>
#include <vector>
#include <algorithm>
#include <queue>
#include <string>
#include <sstream>
#include <iostream>
#include <map>
#include <iomanip>

using namespace emscripten;

struct Process {
    int pid;
    int arrival;
    int burst;
    int priority;
    int start = -1;
    int end = -1;
    int remaining;
    int waiting;
    int turnaround;
};

// -------------------- Non-Preemptive --------------------
std::string priority_schedule(const std::vector<int>& arrival, const std::vector<int>& burst, const std::vector<int>& priority) {
    int n = arrival.size();
    std::vector<Process> proc(n);
    for (int i = 0; i < n; ++i) {
        proc[i] = {i + 1, arrival[i], burst[i], priority[i]};
    }

    int currentTime = 0, completedCount = 0;
    std::vector<std::pair<int, int>> timeline;
    std::map<int, std::vector<int>> readyQueue;
    std::map<int, int> running;
    std::vector<int> completedPIDs;
    double totalTurnaround = 0, totalWaiting = 0;

    std::vector<bool> done(n, false);

    while (completedCount < n) {
        // Build ready queue at current time
        std::vector<int> rq;
        for (int i = 0; i < n; ++i) {
            if (!done[i] && proc[i].arrival <= currentTime) {
                rq.push_back(proc[i].pid);
            }
        }

        readyQueue[currentTime] = rq;

        // Find process with highest priority
        int idx = -1;
        for (int i = 0; i < n; ++i) {
            if (!done[i] && proc[i].arrival <= currentTime) {
                if (idx == -1 || proc[i].priority < proc[idx].priority ||
                    (proc[i].priority == proc[idx].priority && proc[i].arrival < proc[idx].arrival)) {
                    idx = i;
                }
            }
        }

        // If no process is ready, just move time forward
        if (idx == -1) {
            currentTime++;
            continue;
        }

        proc[idx].start = currentTime;
        proc[idx].end = currentTime + proc[idx].burst;
        proc[idx].turnaround = proc[idx].end - proc[idx].arrival;
        proc[idx].waiting = proc[idx].start - proc[idx].arrival;

        totalTurnaround += proc[idx].turnaround;
        totalWaiting += proc[idx].waiting;

        timeline.emplace_back(currentTime, proc[idx].pid);

        // Log every second during execution
        for (int t = currentTime; t < proc[idx].end; ++t) {
            running[t] = proc[idx].pid;

            // Build ready queue during execution (excluding running process)
            std::vector<int> rq_during;
            for (int i = 0; i < n; ++i) {
                if (!done[i] && proc[i].arrival <= t && i != idx) {
                    rq_during.push_back(proc[i].pid);
                }
            }
            readyQueue[t] = rq_during;
        }

        currentTime = proc[idx].end;
        done[idx] = true;
        completedCount++;
        completedPIDs.push_back(proc[idx].pid);
    }

    // Build output JSON
    std::ostringstream oss;
    oss << "{";

    // Process table
    oss << "\"process_table\":[";
    for (int i = 0; i < n; ++i) {
        const auto& p = proc[i];
        oss << "{"
            << "\"pid\":" << p.pid << ","
            << "\"arrival\":" << p.arrival << ","
            << "\"burst\":" << p.burst << ","
            << "\"priority\":" << p.priority << ","
            << "\"start\":" << p.start << ","
            << "\"end\":" << p.end << ","
            << "\"turnaround\":" << p.turnaround << ","
            << "\"waiting\":" << p.waiting
            << "}";
        if (i != n - 1) oss << ",";
    }
    oss << "],";

    // Timeline
    oss << "\"timeline\":[";
    for (size_t i = 0; i < timeline.size(); ++i) {
        oss << "{"
            << "\"time\":" << timeline[i].first << ","
            << "\"pid\":" << timeline[i].second
            << "}";
        if (i != timeline.size() - 1) oss << ",";
    }
    oss << "],";

    // Ready queue per second
    oss << "\"ready_queue\":{";
    for (auto it = readyQueue.begin(); it != readyQueue.end(); ++it) {
        oss << "\"" << it->first << "\":[";
        for (size_t j = 0; j < it->second.size(); ++j) {
            oss << it->second[j];
            if (j != it->second.size() - 1) oss << ",";
        }
        oss << "]";
        if (std::next(it) != readyQueue.end()) oss << ",";
    }
    oss << "},";

    // Running process per second
    oss << "\"running_process\":{";
    for (auto it = running.begin(); it != running.end(); ++it) {
        oss << "\"" << it->first << "\":" << it->second;
        if (std::next(it) != running.end()) oss << ",";
    }
    oss << "},";

    // Completed PIDs
    oss << "\"completed\":[";
    for (size_t i = 0; i < completedPIDs.size(); ++i) {
        oss << completedPIDs[i];
        if (i != completedPIDs.size() - 1) oss << ",";
    }
    oss << "],";

    // Averages
    oss << std::fixed << std::setprecision(2);
    oss << "\"average_turnaround\":" << (totalTurnaround / n) << ",";
    oss << "\"average_waiting\":" << (totalWaiting / n);

    oss << "}";

    return oss.str();
}

// -------------------- Preemptive --------------------
std::string priority_preemptive_schedule(const std::vector<int>& arrival, const std::vector<int>& burst, const std::vector<int>& priority) {
    int n = arrival.size();
    std::vector<Process> proc(n);
    for (int i = 0; i < n; ++i)
        proc[i] = {i + 1, arrival[i], burst[i], priority[i], -1, -1, burst[i]};

    int t = 0, completed = 0;
    std::vector<int> completedPIDs;
    std::vector<std::pair<int, int>> timeline;
    std::map<int, std::vector<int>> readyQueue;
    std::map<int, int> running;
    int last_pid = -1;
    double totalTurnaround = 0, totalWaiting = 0;

    while (completed < n) {
        int idx = -1;
        for (int i = 0; i < n; ++i) {
            if (proc[i].arrival <= t && proc[i].remaining > 0) {
                if (idx == -1 || proc[i].priority < proc[idx].priority ||
                    (proc[i].priority == proc[idx].priority && proc[i].arrival < proc[idx].arrival)) {
                    idx = i;
                }
            }
        }

        std::vector<int> rq;
        for (int i = 0; i < n; ++i) {
            if (proc[i].arrival <= t && proc[i].remaining > 0 && i != idx)
                rq.push_back(proc[i].pid);
        }
        readyQueue[t] = rq;

        if (idx == -1) {
            t++;
            continue;
        }

        if (proc[idx].start == -1)
            proc[idx].start = t;

        proc[idx].remaining--;
        running[t] = proc[idx].pid;

        if (proc[idx].pid != last_pid) {
            timeline.emplace_back(t, proc[idx].pid);
            last_pid = proc[idx].pid;
        }

        if (proc[idx].remaining == 0) {
            proc[idx].end = t + 1;
            proc[idx].turnaround = proc[idx].end - proc[idx].arrival;
            proc[idx].waiting = proc[idx].turnaround - proc[idx].burst;

            totalTurnaround += proc[idx].turnaround;
            totalWaiting += proc[idx].waiting;

            completed++;
            completedPIDs.push_back(proc[idx].pid);
        }

        t++;
    }

    std::ostringstream oss;
    oss << "{";

    oss << "\"process_table\":[";
    for (int i = 0; i < n; ++i) {
        const auto& p = proc[i];
        oss << "{"
            << "\"pid\":" << p.pid << ","
            << "\"arrival\":" << p.arrival << ","
            << "\"burst\":" << p.burst << ","
            << "\"priority\":" << p.priority << ","
            << "\"start\":" << p.start << ","
            << "\"end\":" << p.end << ","
            << "\"turnaround\":" << p.turnaround << ","
            << "\"waiting\":" << p.waiting
            << "}";
        if (i != n - 1) oss << ",";
    }
    oss << "],";

    oss << "\"timeline\":[";
    for (size_t i = 0; i < timeline.size(); ++i) {
        oss << "{"
            << "\"time\":" << timeline[i].first << ","
            << "\"pid\":" << timeline[i].second
            << "}";
        if (i != timeline.size() - 1) oss << ",";
    }
    oss << "],";

    oss << "\"ready_queue\":{";
    for (auto it = readyQueue.begin(); it != readyQueue.end(); ++it) {
        oss << "\"" << it->first << "\":[";
        for (size_t j = 0; j < it->second.size(); ++j) {
            oss << it->second[j];
            if (j != it->second.size() - 1) oss << ",";
        }
        oss << "]";
        if (std::next(it) != readyQueue.end()) oss << ",";
    }
    oss << "},";

    oss << "\"running_process\":{";
    for (auto it = running.begin(); it != running.end(); ++it) {
        oss << "\"" << it->first << "\":" << it->second;
        if (std::next(it) != running.end()) oss << ",";
    }
    oss << "},";

    oss << "\"completed\":[";
    for (size_t i = 0; i < completedPIDs.size(); ++i) {
        oss << completedPIDs[i];
        if (i != completedPIDs.size() - 1) oss << ",";
    }
    oss << "],";

    oss << std::fixed << std::setprecision(2);
    oss << "\"average_turnaround\":" << (totalTurnaround / n) << ",";
    oss << "\"average_waiting\":" << (totalWaiting / n);
    oss << "}";

    return oss.str();
}

// -------------------- Binding --------------------
EMSCRIPTEN_BINDINGS(priority_module) {
    register_vector<int>("VectorInt");
    function("priority_schedule", &priority_schedule);
    function("priority_preemptive_schedule", &priority_preemptive_schedule);
}

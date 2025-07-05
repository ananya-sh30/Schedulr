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
    int start = -1;
    int end = -1;
    int remaining;
    int waiting;
    int turnaround;
};


std::string sjf_schedule(const std::vector<int>& arrivalTimes, const std::vector<int>& burstTimes) {
    int n = arrivalTimes.size();
    std::vector<Process> proc(n);
    for (int i = 0; i < n; i++) {
        proc[i] = {i + 1, arrivalTimes[i], burstTimes[i], -1, -1, burstTimes[i]};
    }

    int currentTime = 0, completed = 0;
    std::vector<std::pair<int, int>> timeline;
    std::map<int, std::vector<int>> readyQueue;
    std::map<int, int> running;
    std::vector<int> done(n, 0);
    std::vector<int> completedPIDs;

    double totalTurnaround = 0, totalWaiting = 0;

    while (completed < n) {
        std::vector<int> rq;
        for (int i = 0; i < n; ++i) {
            if (!done[i] && proc[i].arrival <= currentTime) {
                rq.push_back(proc[i].pid);
            }
        }
        readyQueue[currentTime] = rq;

        int idx = -1, minBurst = 1e9;
        for (int i = 0; i < n; ++i) {
            if (!done[i] && proc[i].arrival <= currentTime && proc[i].burst < minBurst) {
                minBurst = proc[i].burst;
                idx = i;
            }
        }

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

        timeline.push_back({currentTime, proc[idx].pid});

        for (int t = currentTime; t < proc[idx].end; ++t)
            running[t] = proc[idx].pid;

        currentTime = proc[idx].end;
        done[idx] = 1;
        completed++;
        completedPIDs.push_back(proc[idx].pid);
    }

    // Serialize JSON
    std::ostringstream oss;
    oss << "{";

    // process_table
    oss << "\"process_table\":[";
    for (int i = 0; i < n; ++i) {
        const auto& p = proc[i];
        oss << "{"
            << "\"pid\":" << p.pid << ","
            << "\"arrival\":" << p.arrival << ","
            << "\"burst\":" << p.burst << ","
            << "\"start\":" << p.start << ","
            << "\"end\":" << p.end << ","
            << "\"turnaround\":" << p.turnaround << ","
            << "\"waiting\":" << p.waiting
            << "}";
        if (i != n - 1) oss << ",";
    }
    oss << "],";

    // timeline
    oss << "\"timeline\":[";
    for (size_t i = 0; i < timeline.size(); ++i) {
        oss << "{"
            << "\"time\":" << timeline[i].first << ","
            << "\"pid\":" << timeline[i].second
            << "}";
        if (i != timeline.size() - 1) oss << ",";
    }
    oss << "],";

    // ready_queue
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

    // running_process
    oss << "\"running_process\":{";
    for (auto it = running.begin(); it != running.end(); ++it) {
        oss << "\"" << it->first << "\":" << it->second;
        if (std::next(it) != running.end()) oss << ",";
    }
    oss << "},";

    // completed list
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


std::string sjf_preemptive_schedule(const std::vector<int>& arrivalTimes, const std::vector<int>& burstTimes) {
    int n = arrivalTimes.size();
    std::vector<Process> proc(n);
    for (int i = 0; i < n; i++) {
        proc[i] = {i + 1, arrivalTimes[i], burstTimes[i], -1, -1, burstTimes[i]};
    }

    int t = 0, completed = 0, shortest = -1, minm = 1e9;
    std::vector<int> completedPIDs;
    std::vector<std::pair<int, int>> timeline;
    std::map<int, std::vector<int>> readyQueue;
    std::map<int, int> running;
    double totalTurnaround = 0, totalWaiting = 0;
    int last_pid = -1;

    while (completed < n) {
        // Step 1: Find the shortest remaining time process at time t
        shortest = -1;
        minm = 1e9;
        for (int i = 0; i < n; i++) {
            if (proc[i].arrival <= t && proc[i].remaining > 0) {
                if (proc[i].remaining < minm ||
                    (proc[i].remaining == minm && proc[i].arrival < proc[shortest].arrival) ||
                    (proc[i].remaining == minm && proc[i].arrival == proc[shortest].arrival && proc[i].pid < proc[shortest].pid)) {
                    minm = proc[i].remaining;
                    shortest = i;
                }
            }
        }

        // Step 2: Build ready queue excluding the currently running process
        std::vector<int> rq;
        for (int i = 0; i < n; i++) {
            if (proc[i].arrival <= t && proc[i].remaining > 0 && i != shortest) {
                rq.push_back(proc[i].pid);
            }
        }
        readyQueue[t] = rq;

        // Step 3: If no process is ready to run, idle
        if (shortest == -1) {
            t++;
            continue;
        }

        // Step 4: Run the chosen process
        if (proc[shortest].start == -1)
            proc[shortest].start = t;

        proc[shortest].remaining--;
        running[t] = proc[shortest].pid;

        if (last_pid != proc[shortest].pid) {
            timeline.push_back({t, proc[shortest].pid});
            last_pid = proc[shortest].pid;
        }

        // Step 5: Check for completion
        if (proc[shortest].remaining == 0) {
            proc[shortest].end = t + 1;
            proc[shortest].turnaround = proc[shortest].end - proc[shortest].arrival;
            proc[shortest].waiting = proc[shortest].turnaround - proc[shortest].burst;

            totalTurnaround += proc[shortest].turnaround;
            totalWaiting += proc[shortest].waiting;

            completed++;
            completedPIDs.push_back(proc[shortest].pid);
        }

        t++;
    }

    // Step 6: Serialize output
    std::ostringstream oss;
    oss << "{";

    oss << "\"process_table\":[";
    for (int i = 0; i < n; ++i) {
        const auto& p = proc[i];
        oss << "{"
            << "\"pid\":" << p.pid << ","
            << "\"arrival\":" << p.arrival << ","
            << "\"burst\":" << p.burst << ","
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


// Bind functions to JS
EMSCRIPTEN_BINDINGS(sjf_module) {
    emscripten::register_vector<int>("VectorInt");
    emscripten::function("sjf_schedule", &sjf_schedule);
    emscripten::function("sjf_preemptive_schedule", &sjf_preemptive_schedule);
    
}

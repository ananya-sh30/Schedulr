#include <emscripten/bind.h>
#include <vector>
#include <string>
#include <sstream>
#include <iomanip>
#include <map>
#include <algorithm>

using namespace std;
using namespace emscripten;

struct Process {
    int pid;
    int arrival;
    int burst;
    int start = -1;
    int end = -1;
    int turnaround = -1;
    int waiting = -1;
};

string fcfs_schedule(vector<int> arrival, vector<int> burst) {
    int n = arrival.size();
    vector<Process> processes(n);
    vector<pair<int, int>> timeline;         // {time, pid}
    map<int, vector<int>> readyQueue;        // {time, [pids]}
    map<int, int> running;                   // {time, pid}
    vector<int> completed;

    for (int i = 0; i < n; ++i) {
        processes[i] = { i + 1, arrival[i], burst[i] };
    }

    sort(processes.begin(), processes.end(), [](const Process& a, const Process& b) {
        return a.arrival < b.arrival;
    });

    int currentTime = 0;
    int completedCount = 0;
    double totalTurnaround = 0, totalWaiting = 0;
    Process* current = nullptr;

    while (completedCount < n) {
        // Build ready queue: all arrived and not yet started
        vector<int> rq;
        for (const auto& p : processes) {
            if (p.arrival <= currentTime && p.start == -1) {
                rq.push_back(p.pid);
            }
        }
        readyQueue[currentTime] = rq;

        // If CPU is idle, schedule next in FCFS
        if (!current && !rq.empty()) {
            for (auto& p : processes) {
                if (p.pid == rq[0]) {
                    p.start = currentTime;
                    p.end = p.start + p.burst;
                    p.turnaround = p.end - p.arrival;
                    p.waiting = p.start - p.arrival;
                    totalTurnaround += p.turnaround;
                    totalWaiting += p.waiting;
                    current = &p;

                    timeline.emplace_back(currentTime, p.pid);
                    break;
                }
            }
        }

        // Mark running process
        if (current) {
            running[currentTime] = current->pid;
            if (currentTime + 1 == current->end) {
                completed.push_back(current->pid);
                current = nullptr;
                completedCount++;
            }
        }

        currentTime++;
    }

    // Serialize output
    ostringstream oss;
    oss << "{";

    // Process table
    oss << "\"process_table\":[";
    for (int i = 0; i < n; ++i) {
        const auto& p = processes[i];
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

    // Ready queue
    oss << "\"ready_queue\":{";
    for (auto it = readyQueue.begin(); it != readyQueue.end(); ++it) {
        oss << "\"" << it->first << "\":[";
        for (size_t j = 0; j < it->second.size(); ++j) {
            oss << it->second[j];
            if (j != it->second.size() - 1) oss << ",";
        }
        oss << "]";
        auto next = it;
        ++next;
        if (next != readyQueue.end()) oss << ",";
    }
    oss << "},";

    // Running process
    oss << "\"running_process\":{";
    for (auto it = running.begin(); it != running.end(); ++it) {
        oss << "\"" << it->first << "\":" << it->second;
        auto next = it;
        ++next;
        if (next != running.end()) oss << ",";
    }
    oss << "},";

    // Completed list
    oss << "\"completed\":[";
    for (size_t i = 0; i < completed.size(); ++i) {
        oss << completed[i];
        if (i != completed.size() - 1) oss << ",";
    }
    oss << "],";

    // Averages
    oss << fixed << setprecision(2);
    oss << "\"average_turnaround\":" << (totalTurnaround / n) << ",";
    oss << "\"average_waiting\":" << (totalWaiting / n);

    oss << "}";

    return oss.str();
}

EMSCRIPTEN_BINDINGS(scheduling_module) {
    register_vector<int>("VectorInt");
    emscripten::function("fcfs_schedule", &fcfs_schedule);
}

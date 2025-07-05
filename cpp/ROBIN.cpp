#include <emscripten/bind.h>
#include <vector>
#include <string>
#include <sstream>
#include <iomanip>
#include <map>
#include <queue>
#include <algorithm>

using namespace std;
using namespace emscripten;

struct Process {
    int pid;
    int arrival;
    int burst;
    int remaining;
    int start = -1;
    int end = -1;
    int turnaround = -1;
    int waiting = -1;
};

string rr_schedule(vector<int> arrival, vector<int> burst, int quantum) {
    int n = arrival.size();
    vector<Process> processes(n);
    vector<pair<int, int>> timeline;
    map<int, vector<int>> readyQueue;
    map<int, int> running;
    vector<int> completed;
    queue<int> rq;

    for (int i = 0; i < n; ++i) {
        processes[i] = { i + 1, arrival[i], burst[i], burst[i] };
    }

    int currentTime = 0;
    int completedCount = 0;
    double totalTurnaround = 0, totalWaiting = 0;
    map<int, bool> inQueue;

    while (completedCount < n) {
        // Add newly arrived processes
        for (int i = 0; i < n; ++i) {
            if (processes[i].arrival == currentTime && !inQueue[i]) {
                rq.push(i);
                inQueue[i] = true;
            }
        }

        if (!rq.empty()) {
            int idx = rq.front();
            rq.pop();
            Process& p = processes[idx];

            // Record ready queue AFTER popping current process
            vector<int> currentRQ;
            queue<int> temp = rq;
            while (!temp.empty()) {
                currentRQ.push_back(processes[temp.front()].pid);
                temp.pop();
            }
            readyQueue[currentTime] = currentRQ;

            if (p.start == -1) {
                p.start = currentTime;
            }

            int execTime = min(quantum, p.remaining);

            for (int t = 0; t < execTime; ++t) {
                running[currentTime] = p.pid;
                if (t == 0) {
                    timeline.emplace_back(currentTime, p.pid);
                }
                currentTime++;

                // Check for arrivals during execution
                for (int i = 0; i < n; ++i) {
                    if (processes[i].arrival == currentTime && !inQueue[i]) {
                        rq.push(i);
                        inQueue[i] = true;
                    }
                }
            }

            p.remaining -= execTime;

            if (p.remaining == 0) {
                p.end = currentTime;
                p.turnaround = p.end - p.arrival;
                p.waiting = p.turnaround - p.burst;
                totalTurnaround += p.turnaround;
                totalWaiting += p.waiting;
                completed.push_back(p.pid);
                completedCount++;
            } else {
                rq.push(idx); // requeue
            }
        } else {
            // CPU idle, still log ready queue as empty
            readyQueue[currentTime] = {};
            currentTime++;
        }
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

    // Completed
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
    emscripten::function("rr_schedule", &rr_schedule);
}

import { config } from './config.js';
import eventBus from './eventBus.js'; // Import eventBus
// State management for the application
class StateManager {
    constructor() {
        this.appData = null;
        // Data loading is now handled by main.js to ensure correct order
    }

    loadData() {
        const savedData = localStorage.getItem(config.localStorageKeys.appData);
        let appData = savedData ? JSON.parse(savedData) : null;

        if (!appData || !appData.contractors) {
            appData = JSON.parse(JSON.stringify(config.initialData));
        }
        
        this.appData = appData;
        
        const savedLog = localStorage.getItem(config.localStorageKeys.dispatchLog);
        if (savedLog) {
            this.dispatchLog = JSON.parse(savedLog);
        } else {
            this.dispatchLog = [];
        }
    }

    saveData() {
        localStorage.setItem(config.localStorageKeys.appData, JSON.stringify(this.appData));
        eventBus.emit('dataUpdated');
    }

    // Dispatch Log Management
    saveLog() {
        localStorage.setItem(config.localStorageKeys.dispatchLog, JSON.stringify(this.dispatchLog));
        eventBus.emit('logUpdated');
    }

    addDispatchEntry(entry) {
        // Ensure entry has a unique ID and default status
        const newEntry = {
            ...entry,
            id: Date.now(), // Unique ID for the entry
            status: 'Dispatched' // Initial status
        };
        this.dispatchLog.unshift(newEntry);
        this.saveLog();
    }

    updateEntryStatus(id, status) {
        const entryIndex = this.dispatchLog.findIndex(entry => entry.id === id);
        if (entryIndex !== -1) {
            this.dispatchLog[entryIndex].status = status;
            this.saveLog();
            return true;
        }
        return false;
    }

    updateLogEntry(id, updatedEntry) {
        const entryIndex = this.dispatchLog.findIndex(entry => entry.id === id);
        if (entryIndex !== -1) {
            this.dispatchLog[entryIndex] = { ...this.dispatchLog[entryIndex], ...updatedEntry };
            this.saveLog();
            return true;
        }
        return false;
    }

    deleteLogEntry(id) {
        const initialLength = this.dispatchLog.length;
        this.dispatchLog = this.dispatchLog.filter(entry => entry.id !== id);
        if (this.dispatchLog.length < initialLength) {
            this.saveLog();
            return true;
        }
        return false;
    }

    clearLog() {
        this.dispatchLog = [];
        localStorage.removeItem(config.localStorageKeys.dispatchLog);
        eventBus.emit('logUpdated');
    }

    generateTestData() {
        if (!confirm("Are you sure you want to replace all existing data with test data? This cannot be undone.")) {
            return;
        }

        const testLog = [];
        const shifts = ["Day Shift", "Night Shift - Before Midnight", "Night Shift After Midnight"];
        const statuses = ["Dispatched", "Verified"];
        const contractorNames = this.getContractors();

        if (contractorNames.length === 0) {
            alert("No contractors found. Please add contractors before generating test data.");
            return;
        }

        for (let i = 0; i < 75; i++) {
            const randomContractorName = contractorNames[Math.floor(Math.random() * contractorNames.length)];
            const contractorData = this.appData.contractors[randomContractorName];

            if (!contractorData.trucks || contractorData.trucks.length === 0) continue;
            if (!contractorData.destinations || contractorData.destinations.length === 0) continue;
            if (!this.appData.sources || this.appData.sources.length === 0) continue;

            const randomTruck = contractorData.trucks[Math.floor(Math.random() * contractorData.trucks.length)];
            const randomDestination = contractorData.destinations[Math.floor(Math.random() * contractorData.destinations.length)];
            const randomSource = this.appData.sources[Math.floor(Math.random() * this.appData.sources.length)];
            const randomShift = shifts[Math.floor(Math.random() * shifts.length)];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));

            let capacity = randomTruck.capacity;
            if (randomContractorName.includes("Petrotreatment")) {
                capacity = Math.floor(Math.random() * (60 - 40 + 1)) + 40;
            }

            testLog.push({
                id: Date.now() + i,
                date: date.toLocaleDateString('en-GB'),
                contractor: randomContractorName,
                license: randomTruck.license,
                capacity: capacity,
                source: randomSource,
                destination: randomDestination,
                shift: randomShift,
                status: randomStatus
            });
        }

        this.dispatchLog = testLog;
        this.saveLog();
        alert("Test data has been generated.");
    }

    // --- Data Getters ---
    getFilteredLogs(filters) {
        // Ensure dispatchLog is initialized, otherwise return empty array
        if (!this.dispatchLog) return [];

        return this.dispatchLog.filter(entry => {
            const licenseMatch = !filters.search || entry.license.toLowerCase().includes(filters.search);
            const contractorMatch = !filters.contractor || entry.contractor === filters.contractor;
            const sourceMatch = !filters.source || entry.source === filters.source;
            const destinationMatch = !filters.destination || entry.destination === filters.destination;
            const statusMatch = !filters.status || entry.status === filters.status;

            return licenseMatch && contractorMatch && sourceMatch && destinationMatch && statusMatch;
        });
    }

    getLogEntry(id) {
        return this.dispatchLog.find(entry => entry.id === id);
    }

    getContractors() {
        return this.appData.contractors ? Object.keys(this.appData.contractors).sort() : [];
    }

    getSources() {
        return this.appData.sources ? [...this.appData.sources].sort() : [];
    }

    getAllDestinations() {
        const allDestinations = new Set();
        if (this.appData.contractors) {
            Object.values(this.appData.contractors).forEach(c => {
                if (c.destinations) {
                    c.destinations.forEach(d => allDestinations.add(d));
                }
            });
        }
        return Array.from(allDestinations).sort();
    }
    
    getDestinationsForContractor(contractorName) {
        if (this.appData.contractors && this.appData.contractors[contractorName] && this.appData.contractors[contractorName].destinations) {
            return [...this.appData.contractors[contractorName].destinations].sort();
        }
        return [];
    }

    getTrucksForContractor(contractorName) {
        if (this.appData.contractors && this.appData.contractors[contractorName] && this.appData.contractors[contractorName].trucks) {
            return [...this.appData.contractors[contractorName].trucks].sort((a, b) => a.license.localeCompare(b.license));
        }
        return [];
    }

    getCapacityForTruck(contractorName, license) {
        const trucks = this.getTrucksForContractor(contractorName);
        const truck = trucks.find(t => t.license === license);
        return truck ? truck.capacity : null;
    }

    // --- Data Setters ---
    contractorExists(name) {
        return this.appData.contractors.hasOwnProperty(name);
    }

    addContractor(name) {
        if (!this.appData.contractors[name]) {
            this.appData.contractors[name] = { trucks: [], destinations: [] };
            this.saveData();
        }
    }

    updateContractor(oldName, newName) {
        if (oldName === newName) return;
        if (this.appData.contractors.hasOwnProperty(newName)) {
            console.warn(`Contractor with name '${newName}' already exists.`);
            return;
        }
        const data = this.appData.contractors[oldName];
        delete this.appData.contractors[oldName];
        this.appData.contractors[newName] = data;
        
        this.dispatchLog.forEach(entry => {
            if (entry.contractor === oldName) {
                entry.contractor = newName;
            }
        });
        this.saveLog();
        
        this.saveData();
    }

    deleteContractor(name) {
        delete this.appData.contractors[name];
        
        this.dispatchLog = this.dispatchLog.filter(entry => entry.contractor !== name);
        this.saveLog();

        this.saveData();
    }

    addTruck(contractor, license, capacity) {
        if (this.appData.contractors[contractor]) {
            this.appData.contractors[contractor].trucks.push({ license, capacity });
            this.saveData();
        }
    }

    updateTruck(contractor, license, newCapacity) {
        if (this.appData.contractors[contractor]) {
            const truck = this.appData.contractors[contractor].trucks.find(t => t.license === license);
            if (truck) {
                truck.capacity = newCapacity;
                this.saveData();
            }
        }
    }

    deleteTruck(contractor, license) {
        if (this.appData.contractors[contractor]) {
            this.appData.contractors[contractor].trucks = this.appData.contractors[contractor].trucks.filter(t => t.license !== license);
            this.saveData();
        }
    }
}

const stateManager = new StateManager();
export default stateManager;

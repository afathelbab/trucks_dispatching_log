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
        this.appData = savedData ? JSON.parse(savedData) : JSON.parse(JSON.stringify(config.initialData));
        
        const savedLog = localStorage.getItem(config.localStorageKeys.dispatchLog);
        if (savedLog) {
            // Ensure IDs are numbers if they were saved as strings
            this.dispatchLog = JSON.parse(savedLog);
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
            status: 'pending' // Initial status
        };
        this.dispatchLog.unshift(newEntry);
        this.dispatchLog.unshift(entry);
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

    deleteLogEntry(id) {
        const initialLength = this.dispatchLog.length;
        this.dispatchLog = this.dispatchLog.filter(entry => entry.id !== id);
        if (this.dispatchLog.length < initialLength) {
            this.saveLog();
            return true;
        }
        return false;
        }
    }

    clearLog() {
        this.dispatchLog = [];
        localStorage.removeItem(config.localStorageKeys.dispatchLog);
        eventBus.emit('logUpdated');
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
                c.destinations.forEach(d => allDestinations.add(d));
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
            console.warn(`Contractor with name "${newName}" already exists.`);
            return;
        }
        const data = this.appData.contractors[oldName];
        delete this.appData.contractors[oldName];
        this.appData.contractors[newName] = data;
        // TODO: Update dispatchLog entries with the new contractor name
        this.saveData();
    }

    deleteContractor(name) {
        delete this.appData.contractors[name];
        // TODO: Clean up dispatchLog entries associated with this contractor
        this.saveData();
    }
}

const stateManager = new StateManager();
export default stateManager;
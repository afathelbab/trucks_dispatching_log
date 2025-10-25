import { config } from './config.js';
// State management for the application
class StateManager {
    constructor() {
        this.appData = null;
        this.dispatchLog = [];
        this.currentStep = 1;
        // Data loading is now handled by main.js to ensure correct order
    }

    loadData() {
        const savedData = localStorage.getItem(config.localStorageKeys.appData);
        this.appData = savedData ? JSON.parse(savedData) : JSON.parse(JSON.stringify(config.initialData));
        
        const savedLog = localStorage.getItem(config.localStorageKeys.dispatchLog);
        if (savedLog) {
            this.dispatchLog = JSON.parse(savedLog);
        }
    }

    saveData() {
        localStorage.setItem(config.localStorageKeys.appData, JSON.stringify(this.appData));
        eventBus.emit('dataUpdated');
    }

    saveLog() {
        localStorage.setItem(config.localStorageKeys.dispatchLog, JSON.stringify(this.dispatchLog));
        eventBus.emit('logUpdated');
    }

    addDispatchEntry(entry) {
        this.dispatchLog.unshift(entry);
        this.saveLog();
    }

    updateEntryStatus(id, status) {
        const entryIndex = this.dispatchLog.findIndex(entry => entry.id === id);
        if (entryIndex !== -1) {
            this.dispatchLog[entryIndex].status = status;
            this.saveLog();
        }
    }

    clearLog() {
        this.dispatchLog = [];
        localStorage.removeItem(config.localStorageKeys.dispatchLog);
        eventBus.emit('logUpdated');
    }

    // --- Data Getters ---

    getContractors() {
        return this.appData.contractors ? Object.keys(this.appData.contractors).sort() : [];
    }

    getSources() {
        return this.appData.sources ? [...this.appData.sources].sort() : [];
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
    addContractor(contractorData) {
        if (!this.appData.contractors[contractorData.name]) {
            this.appData.contractors[contractorData.name] = { trucks: [], destinations: [] };
            this.saveData();
        }
    }
}

const stateManager = new StateManager();
export default stateManager;
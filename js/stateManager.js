// State management for the application
class StateManager {
    constructor() {
        this.appData = null;
        this.dispatchLog = [];
        this.currentStep = 1;
        this.loadData();
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
}

const stateManager = new StateManager();
export default stateManager;
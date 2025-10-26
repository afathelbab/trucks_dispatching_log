import stateManager from './stateManager.js';
import eventBus from './eventBus.js';

class SettingsController {
    constructor() {
        this.elements = {};
        this.initializeElements();
        this.attachEventListeners();
        this.setupEventBusListeners();
    }

    initializeElements() {
        this.elements = {
            // Settings tabs
            settingsTabs: document.querySelectorAll('.settings-tab'),
            settingsContents: document.querySelectorAll('.settings-content'),
            
            // Contractor management
            contractorList: document.getElementById('contractor-list'),
            addContractorBtn: document.getElementById('add-contractor-btn'),
            contractorNameInput: document.getElementById('contractor-name'),
            
            // Truck management
            truckList: document.getElementById('truck-list'),
            addTruckBtn: document.getElementById('add-truck-btn'),
            truckLicenseInput: document.getElementById('truck-license'),
            truckCapacityInput: document.getElementById('truck-capacity'),
            
            // Source management
            sourceList: document.getElementById('source-list'),
            addSourceBtn: document.getElementById('add-source-btn'),
            sourceNameInput: document.getElementById('source-name'),
            
            // Data management
            generateTestDataBtn: document.getElementById('generate-test-data'),
            clearDataBtn: document.getElementById('clear-data'),
            exportDataBtn: document.getElementById('export-data'),
            importDataBtn: document.getElementById('import-data'),
            importFileInput: document.getElementById('import-file')
        };
    }

    attachEventListeners() {
        // Settings tabs
        this.elements.settingsTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Contractor management
        if (this.elements.addContractorBtn) {
            this.elements.addContractorBtn.addEventListener('click', () => this.addContractor());
        }

        // Truck management
        if (this.elements.addTruckBtn) {
            this.elements.addTruckBtn.addEventListener('click', () => this.addTruck());
        }

        // Source management
        if (this.elements.addSourceBtn) {
            this.elements.addSourceBtn.addEventListener('click', () => this.addSource());
        }

        // Data management
        if (this.elements.generateTestDataBtn) {
            this.elements.generateTestDataBtn.addEventListener('click', () => this.generateTestData());
        }
        
        if (this.elements.clearDataBtn) {
            this.elements.clearDataBtn.addEventListener('click', () => this.clearData());
        }
        
        if (this.elements.exportDataBtn) {
            this.elements.exportDataBtn.addEventListener('click', () => this.exportData());
        }
        
        if (this.elements.importDataBtn) {
            this.elements.importDataBtn.addEventListener('click', () => this.importData());
        }
        
        if (this.elements.importFileInput) {
            this.elements.importFileInput.addEventListener('change', (e) => this.handleFileImport(e));
        }
    }

    setupEventBusListeners() {
        eventBus.on('dataUpdated', () => this.refreshSettings());
    }

    switchTab(tabId) {
        // Update tab navigation
        this.elements.settingsTabs.forEach(tab => {
            const isActive = tab.dataset.tab === tabId;
            tab.classList.toggle('active', isActive);
            tab.classList.toggle('bg-blue-100', isActive);
            tab.classList.toggle('text-blue-700', isActive);
        });

        // Update tab content
        this.elements.settingsContents.forEach(content => {
            const isTargetTab = content.id === `${tabId}-settings`;
            content.classList.toggle('hidden', !isTargetTab);
        });
    }

    refreshSettings() {
        this.refreshContractorList();
        this.refreshTruckList();
        this.refreshSourceList();
    }

    refreshContractorList() {
        if (!this.elements.contractorList) return;
        
        const contractors = stateManager.getContractors();
        this.elements.contractorList.innerHTML = contractors.map(contractor => `
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span class="font-medium text-gray-900 dark:text-white">${contractor}</span>
                <div class="flex space-x-2">
                    <button onclick="settingsController.editContractor('${contractor}')" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Edit</button>
                    <button onclick="settingsController.deleteContractor('${contractor}')" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                </div>
            </div>
        `).join('');
    }

    refreshTruckList() {
        if (!this.elements.truckList) return;
        
        const contractors = stateManager.getContractors();
        let html = '';
        
        contractors.forEach(contractor => {
            const trucks = stateManager.getTrucksForContractor(contractor);
            if (trucks.length > 0) {
                html += `
                    <div class="mb-4">
                        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">${contractor}</h4>
                        <div class="space-y-2">
                            ${trucks.map(truck => `
                                <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <span class="text-sm text-gray-900 dark:text-white">${truck.license} (${truck.capacity || 'N/A'} m³)</span>
                                    <div class="flex space-x-2">
                                        <button onclick="settingsController.editTruck('${contractor}', '${truck.license}')" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs">Edit</button>
                                        <button onclick="settingsController.deleteTruck('${contractor}', '${truck.license}')" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs">Delete</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        });
        
        this.elements.truckList.innerHTML = html;
    }

    refreshSourceList() {
        if (!this.elements.sourceList) return;
        
        const sources = stateManager.getSources();
        this.elements.sourceList.innerHTML = sources.map(source => `
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span class="font-medium text-gray-900 dark:text-white">${source}</span>
                <button onclick="settingsController.deleteSource('${source}')" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">Delete</button>
            </div>
        `).join('');
    }

    addContractor() {
        const name = this.elements.contractorNameInput.value.trim();
        if (!name) {
            this.showError('Please enter a contractor name.');
            return;
        }

        if (stateManager.contractorExists(name)) {
            this.showError('Contractor already exists.');
            return;
        }

        stateManager.addContractor(name);
        this.elements.contractorNameInput.value = '';
        this.showSuccess('Contractor added successfully!');
    }

    addTruck() {
        const license = this.elements.truckLicenseInput.value.trim();
        const capacity = parseFloat(this.elements.truckCapacityInput.value);
        
        if (!license) {
            this.showError('Please enter a truck license.');
            return;
        }

        if (isNaN(capacity) || capacity <= 0) {
            this.showError('Please enter a valid capacity.');
            return;
        }

        // For now, add to first contractor (you might want to add a contractor selector)
        const contractors = stateManager.getContractors();
        if (contractors.length === 0) {
            this.showError('Please add a contractor first.');
            return;
        }

        stateManager.addTruck(contractors[0], license, capacity);
        this.elements.truckLicenseInput.value = '';
        this.elements.truckCapacityInput.value = '';
        this.showSuccess('Truck added successfully!');
    }

    addSource() {
        const name = this.elements.sourceNameInput.value.trim();
        if (!name) {
            this.showError('Please enter a source name.');
            return;
        }

        const sources = stateManager.getSources();
        if (sources.includes(name)) {
            this.showError('Source already exists.');
            return;
        }

        sources.push(name);
        stateManager.appData.sources = sources;
        stateManager.saveData();
        
        this.elements.sourceNameInput.value = '';
        this.showSuccess('Source added successfully!');
    }

    generateTestData() {
        stateManager.generateTestData();
        this.showSuccess('Test data generated successfully!');
    }

    clearData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            stateManager.clearLog();
            this.showSuccess('Data cleared successfully!');
        }
    }

    exportData() {
        const data = {
            appData: stateManager.appData,
            dispatchLog: stateManager.dispatchLog
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'truck-dispatch-data.json';
        a.click();
        URL.revokeObjectURL(url);
        
        this.showSuccess('Data exported successfully!');
    }

    importData() {
        this.elements.importFileInput.click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.appData && data.dispatchLog) {
                    stateManager.appData = data.appData;
                    stateManager.dispatchLog = data.dispatchLog;
                    stateManager.saveData();
                    stateManager.saveLog();
                    this.showSuccess('Data imported successfully!');
                } else {
                    this.showError('Invalid file format.');
                }
            } catch (error) {
                this.showError('Error reading file.');
            }
        };
        reader.readAsText(file);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${type === 'error' ? 'error-message' : 'success-message'}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

export default SettingsController;

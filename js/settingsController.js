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
            settingsTabs: document.querySelectorAll('#settings-tabs button[data-tab]'),
            settingsPanels: document.querySelectorAll('.settings-panel'),
            
            // Contractor management
            contractorPanel: document.getElementById('contractors-panel'),
            addContractorBtn: document.getElementById('add-contractor-btn'),
            contractorNameInput: document.getElementById('contractor-name'),
            
            // Truck management
            truckPanel: document.getElementById('trucks-panel'),
            addTruckBtn: document.getElementById('add-truck-btn'),
            truckLicenseInput: document.getElementById('truck-license'),
            truckCapacityInput: document.getElementById('truck-capacity'),
            
            // Source management
            sourcePanel: document.getElementById('sources-panel'),
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
            tab.addEventListener('click', (e) => this.switchTab(e.currentTarget.dataset.tab));
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
            this.elements.generateTestDataBtn.addEventListener('click', () => {
                stateManager.generateTestData();
                this.showSuccess('Test data has been generated successfully!');
                eventBus.emit('logUpdated');
                eventBus.emit('dataUpdated');
            });
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
        
        // Initialize panel content for the first tab
        setTimeout(() => {
            this.refreshSettings();
        }, 100);
    }

    setupEventBusListeners() {
        eventBus.on('dataUpdated', () => this.refreshSettings());
    }

    switchTab(tabId) {
        // Update tab navigation
        this.elements.settingsTabs.forEach(tab => {
            const isActive = tab.dataset.tab === tabId;
            tab.classList.toggle('border-indigo-500', isActive);
            tab.classList.toggle('text-indigo-600', isActive);
            tab.classList.toggle('border-transparent', !isActive);
            tab.classList.toggle('text-gray-500', !isActive);
        });

        // Update tab content
        this.elements.settingsPanels.forEach(panel => {
            const isTargetTab = panel.id === `${tabId}-panel`;
            panel.classList.toggle('hidden', !isTargetTab);
        });
        
        // Refresh the panel content
        this.refreshSettings();
    }

    refreshSettings() {
        this.refreshContractorPanel();
        this.refreshTruckPanel();
        this.refreshSourcePanel();
    }

    refreshContractorPanel() {
        if (!this.elements.contractorPanel) return;
        
        const contractors = stateManager.getContractors();
        
        let html = `
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Contractors</h3>
            <div class="flex gap-4 mb-4">
                <input type="text" id="contractor-name" placeholder="Enter contractor name" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                <button id="add-contractor-btn" class="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition">
                    Add Contractor
                </button>
            </div>
            <div class="space-y-2 max-h-96 overflow-y-auto">
        `;
        
        if (contractors.length === 0) {
            html += `<p class="text-gray-500 text-center py-4">No contractors added yet.</p>`;
        } else {
            html += contractors.map(contractor => `
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span class="font-medium text-gray-900 dark:text-white">${contractor}</span>
                    <div class="flex space-x-2">
                        <button onclick="window.settingsController.deleteContractor('${contractor}')" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                    </div>
                </div>
            `).join('');
        }
        
        html += `</div>`;
        this.elements.contractorPanel.innerHTML = html;
        
        // Re-attach event listeners
        const addBtn = document.getElementById('add-contractor-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addContractor());
        }
    }

    refreshTruckPanel() {
        if (!this.elements.truckPanel) return;
        
        const contractors = stateManager.getContractors();
        
        let html = `
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Trucks</h3>
            <div class="space-y-4">
        `;
        
        if (contractors.length === 0) {
            html += `<p class="text-gray-500 text-center py-4">No contractors available. Add a contractor first.</p>`;
        } else {
            contractors.forEach(contractor => {
                const trucks = stateManager.getTrucksForContractor(contractor);
                html += `
                    <div class="mb-4">
                        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">${contractor}</h4>
                        <div class="space-y-2">
                            ${trucks.length > 0 ? trucks.map(truck => `
                                <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <span class="text-sm text-gray-900 dark:text-white">${truck.license} (${truck.capacity !== null && truck.capacity !== undefined ? truck.capacity + ' m³' : 'N/A'})</span>
                                    <button onclick="window.settingsController.deleteTruck('${contractor}', '${truck.license}')" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs">Delete</button>
                                </div>
                            `).join('') : '<p class="text-sm text-gray-500 italic">No trucks for this contractor</p>'}
                        </div>
                    </div>
                `;
            });
        }
        
        html += `</div>`;
        this.elements.truckPanel.innerHTML = html;
    }

    refreshSourcePanel() {
        if (!this.elements.sourcePanel) return;
        
        const sources = stateManager.getSources();
        
        let html = `
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Sources</h3>
            <div class="space-y-2 max-h-96 overflow-y-auto">
        `;
        
        if (sources.length === 0) {
            html += `<p class="text-gray-500 text-center py-4">No sources added yet.</p>`;
        } else {
            html += sources.map(source => `
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span class="font-medium text-gray-900 dark:text-white">${source}</span>
                </div>
            `).join('');
        }
        
        html += `</div>`;
        this.elements.sourcePanel.innerHTML = html;
    }

    addContractor() {
        const input = document.getElementById('contractor-name');
        if (!input) return;
        
        const name = input.value.trim();
        if (!name) {
            this.showError('Please enter a contractor name.');
            return;
        }

        if (stateManager.contractorExists(name)) {
            this.showError('Contractor already exists.');
            return;
        }

        stateManager.addContractor(name);
        input.value = '';
        this.showSuccess('Contractor added successfully!');
        this.refreshSettings();
    }

    addTruck() {
        const licenseInput = document.getElementById('truck-license');
        const capacityInput = document.getElementById('truck-capacity');
        
        if (!licenseInput || !capacityInput) return;
        
        const license = licenseInput.value.trim();
        const capacity = parseFloat(capacityInput.value);
        
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
        licenseInput.value = '';
        capacityInput.value = '';
        this.showSuccess('Truck added successfully!');
        this.refreshSettings();
    }

    addSource() {
        const input = document.getElementById('source-name');
        if (!input) return;
        
        const name = input.value.trim();
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
        
        input.value = '';
        this.showSuccess('Source added successfully!');
        this.refreshSettings();
    }
    
    deleteContractor(name) {
        if (confirm(`Are you sure you want to delete contractor "${name}"?`)) {
            stateManager.deleteContractor(name);
            this.showSuccess('Contractor deleted successfully!');
            this.refreshSettings();
        }
    }
    
    deleteTruck(contractor, license) {
        if (confirm(`Are you sure you want to delete truck "${license}"?`)) {
            stateManager.deleteTruck(contractor, license);
            this.showSuccess('Truck deleted successfully!');
            this.refreshSettings();
        }
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

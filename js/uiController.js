import stateManager from './stateManager.js';
import eventBus from './eventBus.js';

// UI Controller for managing DOM interactions
class UIController {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.setupEventBusListeners();
        this.currentStep = 1;
    }

    initializeElements() {
        // Form elements
        this.elements = {
            contractorSelect: document.getElementById('contractor'),
            licenseSelect: document.getElementById('license'),
            capacityInput: document.getElementById('capacity'),
            sourceSelect: document.getElementById('source'),
            destinationSelect: document.getElementById('destination'),
            shiftSelect: document.getElementById('shift'),
            dispatchDateInput: document.getElementById('dispatch-date'),
            submitBtn: document.getElementById('submit-btn'),

            // Step navigation
            nextStep1Btn: document.getElementById('next-step-1'),
            nextStep2Btn: document.getElementById('next-step-2'),
            prevStep2Btn: document.getElementById('prev-step-2'),
            prevStep3Btn: document.getElementById('prev-step-3'),
            
            // Log elements
            logTableBody: document.getElementById('log-table-body'),
            emptyLogMessage: document.getElementById('empty-log-message'),
            
            // Filter elements
            searchLogInput: document.getElementById('search-log'),
            filterContractorSelect: document.getElementById('filter-contractor'),
            filterSourceSelect: document.getElementById('filter-source'),
            filterDestinationSelect: document.getElementById('filter-destination'),
            filterStatusSelect: document.getElementById('filter-status'),
            
            // Settings elements
            settingsBtn: document.getElementById('settings-btn'),
            settingsModal: document.getElementById('settings-modal'),
            closeSettingsBtn: document.getElementById('close-settings-btn'),
            settingsTabs: document.getElementById('settings-tabs'),

            // Other buttons
            generateDataBtn: document.getElementById('generate-data-btn'),
            clearLogBtn: document.getElementById('clear-log-btn'),

            // Report elements
            reportContractorSelect: document.getElementById('report-contractor'),
        };
    }

    attachEventListeners() {
        // Form listeners
        this.elements.contractorSelect.addEventListener('change', () => this.handleContractorChange());
        this.elements.licenseSelect.addEventListener('change', () => this.handleLicenseChange());
        this.elements.submitBtn.addEventListener('click', () => this.handleSubmit());

        // Step navigation listeners
        this.elements.nextStep1Btn.addEventListener('click', () => this.goToStep(2));
        this.elements.prevStep2Btn.addEventListener('click', () => this.goToStep(1));
        this.elements.nextStep2Btn.addEventListener('click', () => this.goToStep(3));
        this.elements.prevStep3Btn.addEventListener('click', () => this.goToStep(2));
        
        // Filter listeners
        this.elements.searchLogInput.addEventListener('input', () => this.applyFiltersAndRender());
        this.elements.filterContractorSelect.addEventListener('change', () => this.applyFiltersAndRender());
        this.elements.filterSourceSelect.addEventListener('change', () => this.applyFiltersAndRender());
        this.elements.filterDestinationSelect.addEventListener('change', () => this.applyFiltersAndRender());
        this.elements.filterStatusSelect.addEventListener('change', () => this.applyFiltersAndRender());
        
        // Other buttons
        this.elements.generateDataBtn.addEventListener('click', () => stateManager.generateTestData());
        this.elements.clearLogBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to permanently delete all log entries? This cannot be undone.")) {
                stateManager.clearLog();
                alert("The dispatch log has been cleared.");
            }
        });

        // Event delegation for log table actions (edit, delete, toggle status)
        this.elements.logTableBody.addEventListener('click', (e) => {
            const target = e.target;
            const button = target.closest('button[data-action]');
            
            if (button) {
                const logId = parseInt(button.dataset.logId);
                const action = button.dataset.action;

                if (action === 'delete') {
                    if (confirm('Are you sure you want to delete this entry?')) {
                        stateManager.deleteLogEntry(logId);
                    }
                } else if (action === 'edit') {
                    const entry = stateManager.getLogEntry(logId);
                    if (entry) {
                        const newCapacity = prompt("Enter new capacity:", entry.capacity);
                        if (newCapacity !== null) {
                            stateManager.updateLogEntry(logId, { capacity: newCapacity });
                        }
                    }
                }
                return;
            }

            const statusBadge = target.closest('.status-badge[data-log-id]');
            if (statusBadge) {
                const logId = parseInt(statusBadge.dataset.logId);
                const currentStatus = statusBadge.dataset.status;
                const newStatus = currentStatus === 'Verified' ? 'Dispatched' : 'Verified';
                stateManager.updateEntryStatus(logId, newStatus);
            }
        });
    }

    setupEventBusListeners() {
        eventBus.on('dataUpdated', () => this.populateAllDropdowns());
        eventBus.on('logUpdated', () => this.applyFiltersAndRender());
    }
    
    populateAllDropdowns() {
        const contractors = stateManager.getContractors();
        const sources = stateManager.getSources();
        
        this.populateSelect(this.elements.contractorSelect, contractors, 'Select Contractor');
        this.populateSelect(this.elements.sourceSelect, sources, 'Select Source');
        
        this.populateSelect(this.elements.filterContractorSelect, contractors, 'All Contractors');
        this.populateSelect(this.elements.filterSourceSelect, sources, 'All Sources'); 
        const allDestinations = stateManager.getAllDestinations();
        this.populateSelect(this.elements.filterDestinationSelect, allDestinations, 'All Destinations');

        this.populateSelect(this.elements.reportContractorSelect, contractors, 'Select Contractor');
    }
    
    populateSelect(selectElement, options, defaultText) {
        const currentValue = selectElement.value;
        selectElement.innerHTML = `<option value="">${defaultText}</option>`;
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            selectElement.appendChild(optionElement);
        });
        selectElement.value = currentValue;
    }
    
    applyFiltersAndRender() {
        const filters = {
            search: this.elements.searchLogInput.value.toLowerCase(),
            contractor: this.elements.filterContractorSelect.value,
            source: this.elements.filterSourceSelect.value,
            destination: this.elements.filterDestinationSelect.value,
            status: this.elements.filterStatusSelect.value
        };
        
        this.renderFilteredLog(filters);
    }
    
    renderFilteredLog(filters) {
        const logs = stateManager.getFilteredLogs(filters);
        const tableBody = this.elements.logTableBody;
        const emptyMessage = this.elements.emptyLogMessage;
        
        tableBody.innerHTML = '';
        
        if (logs.length === 0) {
            emptyMessage.classList.remove('hidden');
            return;
        }
        
        emptyMessage.classList.add('hidden');
        logs.forEach((log, index) => {
            const row = this.createLogRow(log, index);
            tableBody.appendChild(row);
        });
    }
    
    createLogRow(log, index) {
        const row = document.createElement('tr');
        row.className = `border-b hover:bg-gray-50 ${log.status === 'Verified' ? 'bg-green-50' : ''}`;
        
        const cells = [
            { text: log.date, classes: 'text-left' },
            { text: log.contractor, classes: 'text-left' },
            { text: log.license, classes: 'text-left' },
            { text: log.capacity, classes: 'text-center' },
            { text: log.source, classes: 'text-left' },
            { text: log.destination, classes: 'text-left' },
            { text: log.shift, classes: 'text-center' },
            { text: this.getStatusBadge(log.status, log.id), classes: 'text-center', isHTML: true },
            { text: this.getActionButtons(log.id), classes: 'text-right', isHTML: true }
        ];
        
        cells.forEach(cell => {
            const td = document.createElement('td');
            td.className = `px-6 py-4 whitespace-nowrap ${cell.classes}`;
            if (cell.isHTML) {
                td.innerHTML = cell.text;
            } else {
                td.textContent = cell.text;
            }
            row.appendChild(td);
        });
        
        return row;
    }
    
    getStatusBadge(status, logId) {
        const statusClasses = {
            Dispatched: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
            Verified: 'bg-green-100 text-green-800 hover:bg-green-200',
        };

        const statusText = {
            Dispatched: 'Dispatched',
            Verified: 'Verified',
        }
        
        return `<span 
                    class="status-badge px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${statusClasses[status]}" 
                    data-log-id="${logId}" 
                    data-status="${status}" 
                    title="Click to toggle status"
                >
                    ${statusText[status]}
                </span>`;
    }
    
    getActionButtons(logId) {
        return `
            <div class="flex justify-end space-x-2">
                <button data-log-id="${logId}" data-action="edit" class="text-indigo-600 hover:text-indigo-900">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                    </svg>
                </button>
                <button data-log-id="${logId}" data-action="delete" class="text-red-600 hover:text-red-900">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
        `;
    }

    updateStepIndicator(step) {
        for (let i = 1; i <= 3; i++) {
            const indicator = document.getElementById(`step-${i}-indicator`);
            const div = indicator.querySelector('div');
            const p = indicator.querySelector('p');
            
            if (i < step) {
                this.setStepCompleted(div, p);
            } else if (i === step) {
                this.setStepCurrent(div, p);
            } else {
                this.setStepFuture(div, p);
            }
        }
    }

    setStepCompleted(div, p) {
        div.classList.remove('bg-blue-600', 'bg-gray-200');
        div.classList.add('bg-green-500');
        p.classList.remove('text-blue-600', 'text-gray-400');
        p.classList.add('text-green-500');
    }

    setStepCurrent(div, p) {
        div.classList.remove('bg-green-500', 'bg-gray-200');
        div.classList.add('bg-blue-600');
        p.classList.remove('text-green-500', 'text-gray-400');
        p.classList.add('text-blue-600');
    }

    setStepFuture(div, p) {
        div.classList.remove('bg-green-500', 'bg-blue-600');
        div.classList.add('bg-gray-200');
        p.classList.remove('text-green-500', 'text-blue-600');
        p.classList.add('text-gray-400');
    }

    handleContractorChange() {
        const selectedContractor = this.elements.contractorSelect.value;
        const trucks = stateManager.getTrucksForContractor(selectedContractor);
        const destinations = stateManager.getDestinationsForContractor(selectedContractor);
        
        this.populateSelect(this.elements.licenseSelect, trucks.map(t => t.license), 'Select License');
        this.populateSelect(this.elements.destinationSelect, destinations, 'Select Destination');

        this.elements.capacityInput.value = '';
        this.elements.licenseSelect.disabled = !selectedContractor;
        this.elements.destinationSelect.disabled = !selectedContractor;
        this.elements.capacityInput.readOnly = !selectedContractor.includes("Petrotreatment");
        this.elements.capacityInput.classList.toggle('bg-gray-200', !selectedContractor.includes("Petrotreatment"));
    }

    handleLicenseChange() {
        const selectedContractor = this.elements.contractorSelect.value;
        const selectedLicense = this.elements.licenseSelect.value;
        const capacity = stateManager.getCapacityForTruck(selectedContractor, selectedLicense);
        this.elements.capacityInput.value = capacity || '';
    }

    validateStep1() {
        const contractor = this.elements.contractorSelect.value;
        const license = this.elements.licenseSelect.value;
        const capacity = this.elements.capacityInput.value;
        
        if (!contractor || !license || !capacity) {
            alert('Please fill in all fields in Step 1');
            return false;
        }
        return true;
    }

    validateStep2() {
        const source = this.elements.sourceSelect.value;
        const destination = this.elements.destinationSelect.value;
        
        if (!source || !destination) {
            alert('Please select both source and destination');
            return false;
        }
        if (source === destination) {
            alert('Source and destination cannot be the same');
            return false;
        }
        return true;
    }

    validateStep3() {
        const shift = this.elements.shiftSelect.value;
        const dispatchDate = this.elements.dispatchDateInput.value;
        
        if (!shift || !dispatchDate) {
            alert('Please fill in both shift and dispatch date');
            return false;
        }
        return true;
    }

    goToStep(step) {
        document.getElementById(`step-${this.currentStep}`).classList.replace('visible-section', 'hidden-section');
        this.currentStep = step;
        document.getElementById(`step-${this.currentStep}`).classList.replace('hidden-section', 'visible-section');
        this.updateStepIndicator(this.currentStep);
    }

    handleSubmit() {
        if (!this.validateStep1() || !this.validateStep2() || !this.validateStep3()) return;
        
        const dateString = this.elements.dispatchDateInput.value;
        const parts = dateString.split('-');
        let dispatchDate = new Date(parts[0], parts[1] - 1, parts[2]);

        if (this.elements.shiftSelect.value === "Night Shift After Midnight") {
            dispatchDate.setDate(dispatchDate.getDate() + 1);
        }

        const formData = {
            date: dispatchDate.toLocaleDateString('en-GB'),
            contractor: this.elements.contractorSelect.value,
            license: this.elements.licenseSelect.value,
            capacity: this.elements.capacityInput.value,
            source: this.elements.sourceSelect.value,
            destination: this.elements.destinationSelect.value,
            shift: this.elements.shiftSelect.value,
        };
        
        stateManager.addDispatchEntry(formData);
        this.resetForm();
    }

    resetForm() {
        this.elements.contractorSelect.value = '';
        this.elements.licenseSelect.innerHTML = '<option value="">-- Select License Number --</option>';
        this.elements.licenseSelect.disabled = true;
        this.elements.capacityInput.value = '';
        this.elements.sourceSelect.value = '';
        this.elements.destinationSelect.innerHTML = '<option value="">-- Select a Destination --</option>';
        this.elements.destinationSelect.disabled = true;
        this.elements.shiftSelect.value = '';
        this.setInitialDate();
        this.goToStep(1);
    }

    setInitialDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;
        this.elements.dispatchDateInput.value = todayString;
    }
}

export default new UIController();
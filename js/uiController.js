import stateManager from './stateManager.js';
import eventBus from './eventBus.js';

class UIController {
    constructor() {
        this.elements = {};
        this.isDarkMode = false;
        this.initializeElements();
        this.attachEventListeners();
        this.setupEventBusListeners();
        this.loadThemePreference();
    }

    initializeElements() {
        this.elements = {
            // Form elements
            contractorSelect: document.getElementById('contractor'),
            licenseSelect: document.getElementById('license'),
            capacityInput: document.getElementById('capacity'),
            sourceSelect: document.getElementById('source'),
            destinationSelect: document.getElementById('destination'),
            shiftSelect: document.getElementById('shift'),
            dateInput: document.getElementById('date'),
            
            // Buttons
            submitBtn: document.getElementById('submit-btn'),
            clearBtn: document.getElementById('clear-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            closeSettingsBtn: document.getElementById('close-settings-btn'),
            themeToggle: document.getElementById('theme-toggle'),
            
            // Modals
            settingsModal: document.getElementById('settings-modal'),
            
            // Other elements
            currentDateDisplay: document.getElementById('current-date'),
            currentTimeDisplay: document.getElementById('current-time'),
            body: document.body
        };
    }

    attachEventListeners() {
        if (this.elements.contractorSelect) {
            this.elements.contractorSelect.addEventListener('change', () => this.onContractorChange());
        }
        
        if (this.elements.submitBtn) {
            this.elements.submitBtn.addEventListener('click', () => this.handleSubmit());
        }
        
        if (this.elements.clearBtn) {
            this.elements.clearBtn.addEventListener('click', () => this.clearForm());
        }
        
        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', () => this.openSettingsModal());
        }
        
        if (this.elements.closeSettingsBtn) {
            this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
        }
        
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    openSettingsModal() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.classList.remove('hidden');
        }
    }

    closeSettingsModal() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.classList.add('hidden');
        }
    }

    setupEventBusListeners() {
        eventBus.on('dataUpdated', () => this.populateFormOptions());
    }

    populateFormOptions() {
        this.populateContractors();
        this.populateSources();
        this.populateShifts();
    }

    populateContractors() {
        if (!this.elements.contractorSelect) return;
        
        const contractors = stateManager.getContractors();
        this.populateSelect(this.elements.contractorSelect, contractors, 'Select Contractor');
    }

    populateSources() {
        if (!this.elements.sourceSelect) return;
        
        const sources = stateManager.getSources();
        this.populateSelect(this.elements.sourceSelect, sources, 'Select Source');
    }

    populateShifts() {
        if (!this.elements.shiftSelect) return;
        
        const shifts = ['Day Shift', 'Night Shift - Before Midnight', 'Night Shift After Midnight'];
        this.populateSelect(this.elements.shiftSelect, shifts, 'Select Shift');
    }

    populateSelect(selectElement, options, defaultText) {
        if (!selectElement) return;
        
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

    onContractorChange() {
        const contractor = this.elements.contractorSelect.value;
        if (!contractor) {
            this.elements.licenseSelect.disabled = true;
            this.elements.destinationSelect.disabled = true;
            return;
        }

        this.elements.licenseSelect.disabled = false;
        this.elements.destinationSelect.disabled = false;
        this.populateLicenses(contractor);
        this.populateDestinations(contractor);
    }

    populateLicenses(contractor) {
        if (!this.elements.licenseSelect) return;
        
        const trucks = stateManager.getTrucksForContractor(contractor);
        this.populateSelect(this.elements.licenseSelect, trucks.map(t => t.license), 'Select License');
    }

    populateDestinations(contractor) {
        if (!this.elements.destinationSelect) return;
        
        const destinations = stateManager.getDestinationsForContractor(contractor);
        this.populateSelect(this.elements.destinationSelect, destinations, 'Select Destination');
    }

    onLicenseChange() {
        const contractor = this.elements.contractorSelect.value;
        const license = this.elements.licenseSelect.value;
        
        if (!contractor || !license) return;

        const capacity = stateManager.getCapacityForTruck(contractor, license);
        if (capacity !== null) {
            this.elements.capacityInput.value = capacity;
        }
    }

    handleSubmit() {
        const formData = this.getFormData();
        if (!this.validateForm(formData)) return;

        stateManager.addDispatchEntry(formData);
        this.clearForm();
        this.showSuccess('Dispatch entry added successfully!');
    }

    getFormData() {
        return {
            date: this.elements.dateInput.value,
            contractor: this.elements.contractorSelect.value,
            license: this.elements.licenseSelect.value,
            capacity: parseFloat(this.elements.capacityInput.value),
            source: this.elements.sourceSelect.value,
            destination: this.elements.destinationSelect.value,
            shift: this.elements.shiftSelect.value
        };
    }

    validateForm(data) {
        const requiredFields = ['date', 'contractor', 'license', 'capacity', 'source', 'destination', 'shift'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                this.showError(`Please fill in the ${field} field.`);
                return false;
            }
        }

        if (isNaN(data.capacity) || data.capacity <= 0) {
            this.showError('Please enter a valid capacity.');
            return false;
        }

        return true;
    }

    clearForm() {
        if (this.elements.contractorSelect) this.elements.contractorSelect.value = '';
        if (this.elements.licenseSelect) this.elements.licenseSelect.value = '';
        if (this.elements.capacityInput) this.elements.capacityInput.value = '';
        if (this.elements.sourceSelect) this.elements.sourceSelect.value = '';
        if (this.elements.destinationSelect) this.elements.destinationSelect.value = '';
        if (this.elements.shiftSelect) this.elements.shiftSelect.value = '';
        if (this.elements.dateInput) this.elements.dateInput.value = this.getCurrentDate();
    }

    getCurrentDate() {
        const now = new Date();
        return now.toISOString().split('T')[0];
    }

    setInitialDate() {
        if (this.elements.dateInput) {
            this.elements.dateInput.value = this.getCurrentDate();
        }
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

    updateDateTime() {
        const now = new Date();
        if (this.elements.currentDateDisplay) {
            this.elements.currentDateDisplay.textContent = now.toLocaleDateString('en-GB', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
        if (this.elements.currentTimeDisplay) {
            this.elements.currentTimeDisplay.textContent = now.toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
        this.saveThemePreference();
    }

    applyTheme() {
        if (this.isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    loadThemePreference() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.isDarkMode = savedTheme === 'dark';
        } else {
            this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        this.applyTheme();
    }

    saveThemePreference() {
        localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    }
}

export default UIController;

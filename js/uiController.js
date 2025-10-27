import stateManager from './stateManager.js';
import eventBus from './eventBus.js';
import settingsController from './settingsController.js';

class UIController {
    constructor(settingsController) {
        this.elements = {};
        this.isDarkMode = false;
        this.settingsController = settingsController;
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
            dispatchDateInput: document.getElementById('dispatch-date'),
            
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

        if (this.elements.licenseSelect) {
            this.elements.licenseSelect.addEventListener('change', () => this.onLicenseChange());
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
            this.settingsController.refreshSettings();
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

        if (contractor === 'Petrotreatment') {
            this.elements.capacityInput.readOnly = false;
            this.elements.capacityInput.classList.remove('bg-gray-200');
            this.elements.capacityInput.classList.add('bg-white');
        } else {
            this.elements.capacityInput.readOnly = true;
            this.elements.capacityInput.classList.remove('bg-white');
            this.elements.capacityInput.classList.add('bg-gray-200');
        }
    }

    onLicenseChange() {
        const contractor = this.elements.contractorSelect.value;
        const license = this.elements.licenseSelect.value;
        
        if (!contractor || !license) return;

        // Only auto-fill capacity for Elsamy and Elbassyouny
        if (contractor === 'Elsamy' || contractor === 'Elbassyouny') {
            const capacity = stateManager.getCapacityForTruck(contractor, license);
            if (capacity !== null && capacity !== undefined) {
                this.elements.capacityInput.value = capacity;
            }
        } else if (contractor === 'Petrotreatment') {
            // For Petrotreatment, clear the capacity to allow manual entry
            this.elements.capacityInput.value = '';
        }
    }
    
    populateLicenses(contractorName) {
        if (!this.elements.licenseSelect) return;
        
        const trucks = stateManager.getTrucksForContractor(contractorName);
        this.populateSelect(this.elements.licenseSelect, trucks.map(t => t.license), 'Select License Number');
    }
    
    populateDestinations(contractorName) {
        if (!this.elements.destinationSelect) return;
        
        const destinations = stateManager.getDestinationsForContractor(contractorName);
        this.populateSelect(this.elements.destinationSelect, destinations, 'Select a Destination');
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
            date: this.elements.dispatchDateInput.value,
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
        if (this.elements.dispatchDateInput) this.elements.dispatchDateInput.value = this.getCurrentDate();
        
        // Reset license and destination disabled state
        if (this.elements.licenseSelect) this.elements.licenseSelect.disabled = true;
        if (this.elements.destinationSelect) this.elements.destinationSelect.disabled = true;
    }

    getCurrentDate() {
        const now = new Date();
        return now.toISOString().split('T')[0];
    }

    setInitialDate() {
        if (this.elements.dispatchDateInput) {
            this.elements.dispatchDateInput.value = this.getCurrentDate();
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
        
        // Toggle icon visibility
        const sunIcon = document.getElementById('sun-icon');
        const moonIcon = document.getElementById('moon-icon');
        
        if (sunIcon && moonIcon) {
            if (this.isDarkMode) {
                sunIcon.classList.remove('hidden');
                moonIcon.classList.add('hidden');
            } else {
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
            }
        }
    }

    applyTheme() {
        if (this.isDarkMode) {
            document.documentElement.classList.add('dark');
            // Also add dark-theme class for CSS variables
            document.documentElement.classList.add('dark-theme');
            document.documentElement.classList.remove('light-theme');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.remove('dark-theme');
            document.documentElement.classList.add('light-theme');
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
        
        // Update icon visibility based on initial theme
        const sunIcon = document.getElementById('sun-icon');
        const moonIcon = document.getElementById('moon-icon');
        if (sunIcon && moonIcon) {
            if (this.isDarkMode) {
                sunIcon.classList.remove('hidden');
                moonIcon.classList.add('hidden');
            } else {
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
            }
        }
    }

    saveThemePreference() {
        localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    }
}

export default UIController;
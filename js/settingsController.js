import stateManager from './stateManager.js';
import eventBus from './eventBus.js';

// Settings controller for managing all settings-related functionality
class SettingsController {
    constructor() {
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.elements = {
            settingsModal: document.getElementById('settings-modal'),
            settingsTabs: document.getElementById('settings-tabs'),
            settingsPanels: document.getElementById('settings-panels'),
            contractorsPanel: document.getElementById('contractors-panel'),
            trucksPanel: document.getElementById('trucks-panel'),
            sourcesPanel: document.getElementById('sources-panel'),
            destinationsPanel: document.getElementById('destinations-panel'),
            settingsBtn: document.getElementById('settings-btn'),
            closeSettingsBtn: document.getElementById('close-settings-btn')
        };
    }

    bindEvents() {
        this.elements.settingsBtn.addEventListener('click', () => this.openSettingsModal());
        this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
        this.elements.settingsTabs.addEventListener('click', (e) => this.handleTabClick(e));
        window.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.closeSettingsModal();
            }
        });

        // Event delegation for all panels
        this.elements.settingsPanels.addEventListener('click', (e) => {
            const target = e.target;
            if (target.matches('.add-contractor-btn')) {
                this.addContractor();
            } else if (target.matches('.edit-contractor-btn')) {
                this.editContractor(target.dataset.name);
            } else if (target.matches('.delete-contractor-btn')) {
                this.deleteContractor(target.dataset.name);
            } else if (target.matches('.add-truck-btn')) {
                this.addTruck();
            } else if (target.matches('.edit-truck-btn')) {
                this.editTruck(target.dataset.contractor, target.dataset.license);
            } else if (target.matches('.delete-truck-btn')) {
                this.deleteTruck(target.dataset.contractor, target.dataset.license);
            } else if (target.matches('.add-source-btn')) {
                this.addSource();
            } else if (target.matches('.edit-source-btn')) {
                this.editSource(target.dataset.name);
            } else if (target.matches('.delete-source-btn')) {
                this.deleteSource(target.dataset.name);
            } else if (target.matches('.add-destination-btn')) {
                this.addDestination();
            } else if (target.matches('.edit-destination-btn')) {
                this.editDestination(target.dataset.contractor, target.dataset.name);
            } else if (target.matches('.delete-destination-btn')) {
                this.deleteDestination(target.dataset.contractor, target.dataset.name);
            }
        });
    }

    openSettingsModal() {
        this.elements.settingsModal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        this.renderAllPanels();
        this.switchTab('contractors');
    }

    closeSettingsModal() {
        this.elements.settingsModal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }

    handleTabClick(e) {
        const tab = e.target.closest('[data-tab]');
        if (!tab) return;

        const tabId = tab.getAttribute('data-tab');
        this.switchTab(tabId);
    }
    
    switchTab(tabId) {
        this.elements.settingsTabs.querySelectorAll('[data-tab]').forEach(tab => {
            tab.classList.toggle('border-indigo-500', tab.dataset.tab === tabId);
            tab.classList.toggle('text-indigo-600', tab.dataset.tab === tabId);
            tab.classList.toggle('border-transparent', tab.dataset.tab !== tabId);
            tab.classList.toggle('text-gray-500', tab.dataset.tab !== tabId);
        });

        this.elements.settingsPanels.querySelectorAll('.settings-panel').forEach(panel => {
            panel.classList.toggle('hidden', panel.id !== `${tabId}-panel`);
        });
    }

    renderAllPanels() {
        this.renderContractorsPanel();
        this.renderTrucksPanel();
        this.renderSourcesPanel();
        this.renderDestinationsPanel();
    }

    renderContractorsPanel() {
        const contractors = stateManager.getContractors();
        let listItems = contractors.map(name => `
            <li class="flex justify-between items-center p-3 bg-white border rounded-lg">
                <span>${name}</span>
                <div class="space-x-2">
                    <button data-name="${name}" class="edit-contractor-btn text-blue-500 hover:underline">Edit</button>
                    <button data-name="${name}" class="delete-contractor-btn text-red-500 hover:underline">Delete</button>
                </div>
            </li>
        `).join('');

        const html = `
            <div class="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 class="font-semibold mb-2">Add New Contractor</h3>
                <div class="flex gap-2">
                    <input type="text" id="new-contractor-name" placeholder="Contractor Name" class="flex-grow p-2 border rounded-md">
                    <button class="add-contractor-btn px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add</button>
                </div>
            </div>
            <div>
                <h3 class="font-semibold mb-2">Existing Contractors</h3>
                <ul class="space-y-2">${listItems}</ul>
            </div>
        `;
        this.elements.contractorsPanel.innerHTML = html;
    }

    addContractor() {
        const nameInput = this.elements.contractorsPanel.querySelector('#new-contractor-name');
        const name = nameInput.value.trim();
        if (!name) {
            alert("Contractor name cannot be empty.");
            return;
        }
        if (stateManager.contractorExists(name)) {
            alert("Contractor already exists.");
            return;
        }
        stateManager.addContractor(name);
        nameInput.value = '';
        this.renderContractorsPanel();
        eventBus.emit('dataUpdated');
    }

    editContractor(oldName) {
        const newName = prompt("Enter the new name for the contractor:", oldName);
        if (newName && newName.trim() && newName.trim() !== oldName) {
            if (stateManager.contractorExists(newName.trim())) {
                alert("A contractor with this name already exists.");
                return;
            }
            stateManager.updateContractor(oldName, newName.trim());
            this.renderContractorsPanel();
            eventBus.emit('dataUpdated');
        }
    }

    deleteContractor(name) {
        if (confirm(`Are you sure you want to delete contractor "${name}"? This will also delete all associated data.`)) {
            stateManager.deleteContractor(name);
            this.renderContractorsPanel();
            eventBus.emit('dataUpdated');
        }
    }

    renderTrucksPanel() {
        const contractors = stateManager.getContractors();
        let contractorOptions = contractors.map(c => `<option value="${c}">${c}</option>`).join('');
        let truckListHtml = contractors.map(contractorName => {
            const trucks = stateManager.getTrucksForContractor(contractorName);
            if (!trucks.length) return '';
            let trucksHTML = trucks.map(truck => `
                <li class="flex justify-between items-center p-2 bg-gray-50 border-l-4 border-gray-300">
                    <span><strong>${truck.license}</strong> (Capacity: ${truck.capacity || 'N/A'})</span>
                    <div class="space-x-2">
                        <button data-contractor="${contractorName}" data-license="${truck.license}" class="edit-truck-btn text-blue-500 hover:underline">Edit</button>
                        <button data-contractor="${contractorName}" data-license="${truck.license}" class="delete-truck-btn text-red-500 hover:underline">Delete</button>
                    </div>
                </li>
            `).join('');
            return `
                <div class="p-3 bg-white border rounded-lg">
                    <h4 class="font-bold text-lg mb-2">${contractorName}</h4>
                    <ul class="space-y-1">${trucksHTML}</ul>
                </div>
            `;
        }).join('');

        const html = `
            <div class="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 class="font-semibold mb-2">Add New Truck</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <select id="new-truck-contractor" class="p-2 border rounded-md">${contractorOptions}</select>
                    <input type="text" id="new-truck-license" placeholder="License Number" class="p-2 border rounded-md">
                    <input type="number" id="new-truck-capacity" placeholder="Capacity (optional)" class="p-2 border rounded-md">
                </div>
                <button class="add-truck-btn mt-2 px-4 py-2 w-full bg-blue-600 text-white rounded-md hover:bg-blue-700">Add Truck</button>
            </div>
            <div>
                <h3 class="font-semibold mb-2">Existing Trucks</h3>
                <div class="space-y-4">${truckListHtml}</div>
            </div>
        `;
        this.elements.trucksPanel.innerHTML = html;
    }

    addTruck() {
        const contractor = this.elements.trucksPanel.querySelector('#new-truck-contractor').value;
        const license = this.elements.trucksPanel.querySelector('#new-truck-license').value.trim();
        const capacity = this.elements.trucksPanel.querySelector('#new-truck-capacity').value;
        if (!contractor || !license) {
            alert("Please select a contractor and provide a license number.");
            return;
        }
        stateManager.addTruck(contractor, license, capacity ? parseFloat(capacity) : null);
        this.renderTrucksPanel();
        eventBus.emit('dataUpdated');
    }

    editTruck(contractor, license) {
        const truck = stateManager.getTrucksForContractor(contractor).find(t => t.license === license);
        const newCapacity = prompt(`Enter new capacity for truck ${license}:`, truck.capacity || '');
        if (newCapacity !== null) {
            stateManager.updateTruck(contractor, license, newCapacity ? parseFloat(newCapacity) : null);
            this.renderTrucksPanel();
            eventBus.emit('dataUpdated');
        }
    }

    deleteTruck(contractor, license) {
        if (confirm(`Are you sure you want to delete truck ${license}?`)) {
            stateManager.deleteTruck(contractor, license);
            this.renderTrucksPanel();
            eventBus.emit('dataUpdated');
        }
    }

    renderSourcesPanel() {
        const sources = stateManager.getSources();
        let listItems = sources.map(name => `
            <li class="flex justify-between items-center p-3 bg-white border rounded-lg">
                <span>${name}</span>
                <div class="space-x-2">
                    <button data-name="${name}" class="edit-source-btn text-blue-500 hover:underline">Edit</button>
                    <button data-name="${name}" class="delete-source-btn text-red-500 hover:underline">Delete</button>
                </div>
            </li>
        `).join('');

        const html = `
            <div class="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 class="font-semibold mb-2">Add New Source</h3>
                <div class="flex gap-2">
                    <input type="text" id="new-source-name" placeholder="Source Name" class="flex-grow p-2 border rounded-md">
                    <button class="add-source-btn px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add</button>
                </div>
            </div>
            <div>
                <h3 class="font-semibold mb-2">Existing Sources</h3>
                <ul class="space-y-2">${listItems}</ul>
            </div>
        `;
        this.elements.sourcesPanel.innerHTML = html;
    }

    addSource() {
        const nameInput = this.elements.sourcesPanel.querySelector('#new-source-name');
        const name = nameInput.value.trim();
        if (!name) { alert("Source name cannot be empty."); return; }
        stateManager.appData.sources.push(name);
        stateManager.saveData();
        this.renderSourcesPanel();
        eventBus.emit('dataUpdated');
    }

    editSource(oldName) {
        const newName = prompt("Enter new name for source:", oldName);
        if (newName && newName.trim() && newName.trim() !== oldName) {
            const index = stateManager.appData.sources.indexOf(oldName);
            if (index > -1) {
                stateManager.appData.sources[index] = newName.trim();
                stateManager.saveData();
                this.renderSourcesPanel();
                eventBus.emit('dataUpdated');
            }
        }
    }

    deleteSource(name) {
        if (confirm(`Are you sure you want to delete source "${name}"?`)) {
            stateManager.appData.sources = stateManager.appData.sources.filter(s => s !== name);
            stateManager.saveData();
            this.renderSourcesPanel();
            eventBus.emit('dataUpdated');
        }
    }

    renderDestinationsPanel() {
        const contractors = stateManager.getContractors();
        let contractorOptions = contractors.map(c => `<option value="${c}">${c}</option>`).join('');
        let destinationListHtml = contractors.map(contractorName => {
            const destinations = stateManager.getDestinationsForContractor(contractorName);
            if (!destinations.length) return '';
            let destinationsHTML = destinations.map(dest => `
                <li class="flex justify-between items-center p-2 bg-gray-50 border-l-4 border-gray-300">
                    <span>${dest}</span>
                    <div class="space-x-2">
                        <button data-contractor="${contractorName}" data-name="${dest}" class="edit-destination-btn text-blue-500 hover:underline">Edit</button>
                        <button data-contractor="${contractorName}" data-name="${dest}" class="delete-destination-btn text-red-500 hover:underline">Delete</button>
                    </div>
                </li>
            `).join('');
            return `
                <div class="p-3 bg-white border rounded-lg">
                    <h4 class="font-bold text-lg mb-2">${contractorName}</h4>
                    <ul class="space-y-1">${destinationsHTML}</ul>
                </div>
            `;
        }).join('');

        const html = `
            <div class="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 class="font-semibold mb-2">Add New Destination</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <select id="new-destination-contractor" class="p-2 border rounded-md">${contractorOptions}</select>
                    <input type="text" id="new-destination-name" placeholder="Destination Name" class="p-2 border rounded-md">
                </div>
                <button class="add-destination-btn mt-2 px-4 py-2 w-full bg-blue-600 text-white rounded-md hover:bg-blue-700">Add Destination</button>
            </div>
            <div>
                <h3 class="font-semibold mb-2">Existing Destinations by Contractor</h3>
                <div class="space-y-4">${destinationListHtml}</div>
            </div>
        `;
        this.elements.destinationsPanel.innerHTML = html;
    }

    addDestination() {
        const contractor = this.elements.destinationsPanel.querySelector('#new-destination-contractor').value;
        const name = this.elements.destinationsPanel.querySelector('#new-destination-name').value.trim();
        if (!contractor || !name) { alert("Please select a contractor and enter a destination name."); return; }
        if (!stateManager.appData.contractors[contractor].destinations) {
            stateManager.appData.contractors[contractor].destinations = [];
        }
        stateManager.appData.contractors[contractor].destinations.push(name);
        stateManager.saveData();
        this.renderDestinationsPanel();
        eventBus.emit('dataUpdated');
    }

    editDestination(contractor, oldName) {
        const newName = prompt("Enter new name for destination:", oldName);
        if (newName && newName.trim() && newName.trim() !== oldName) {
            const destinations = stateManager.appData.contractors[contractor].destinations;
            const index = destinations.indexOf(oldName);
            if (index > -1) {
                destinations[index] = newName.trim();
                stateManager.saveData();
                this.renderDestinationsPanel();
                eventBus.emit('dataUpdated');
            }
        }
    }

    deleteDestination(contractor, name) {
        if (confirm(`Are you sure you want to delete destination "${name}" for ${contractor}?`)) {
            const destinations = stateManager.appData.contractors[contractor].destinations;
            stateManager.appData.contractors[contractor].destinations = destinations.filter(d => d !== name);
            stateManager.saveData();
            this.renderDestinationsPanel();
            eventBus.emit('dataUpdated');
        }
    }
}

export default new SettingsController();

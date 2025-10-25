// Settings controller for managing all settings-related functionality
class SettingsController {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.setupEventBusListeners();
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
        // Settings modal events
        this.elements.settingsBtn.addEventListener('click', () => this.openSettingsModal());
        this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
        
        // Tab navigation
        this.elements.settingsTabs.addEventListener('click', (e) => this.handleTabClick(e));
        
        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.closeSettingsModal();
            }
        });
    }

    setupEventBusListeners() {
        eventBus.on('settingsUpdated', () => {
            this.renderAllPanels();
        });
    }

    openSettingsModal() {
        this.elements.settingsModal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        this.renderAllPanels();
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
        // Update tab buttons
        const tabs = this.elements.settingsTabs.querySelectorAll('[data-tab]');
        tabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('border-indigo-500', 'text-indigo-600');
                tab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            } else {
                tab.classList.remove('border-indigo-500', 'text-indigo-600');
                tab.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            }
        });

        // Update panels
        const panels = this.elements.settingsPanels.querySelectorAll('[data-panel]');
        panels.forEach(panel => {
            panel.classList.toggle('hidden', panel.getAttribute('data-panel') !== tabId);
        });
    }

    renderAllPanels() {
        this.renderContractorsPanel();
        this.renderTrucksPanel();
        this.renderSourcesPanel();
        this.renderDestinationsPanel();
    }

    renderContractorsPanel() {
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
                <ul id="contractor-list" class="space-y-2"></ul>
            </div>
        `;
        this.elements.contractorsPanel.innerHTML = html;
        this.populateContractorList();
        
        // Add event listener for the Add button
        const addButton = this.elements.contractorsPanel.querySelector('.add-contractor-btn');
        addButton.addEventListener('click', () => this.addContractor());
    }

    populateContractorList() {
        const list = document.getElementById('contractor-list');
        const contractors = stateManager.getContractors();
        list.innerHTML = '';
        
        contractors.forEach(name => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center p-3 bg-white border rounded-lg';
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = name;

            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.className = 'text-blue-500 hover:underline mr-2';
            editBtn.addEventListener('click', () => this.editContractor(name));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'text-red-500 hover:underline';
            deleteBtn.addEventListener('click', () => this.deleteContractor(name));
            
            const actionDiv = document.createElement('div');
            actionDiv.appendChild(editBtn);
            actionDiv.appendChild(deleteBtn);
            
            li.appendChild(nameSpan);
            li.appendChild(actionDiv);
            list.appendChild(li);
        });
    }

    addContractor() {
        const nameInput = document.getElementById('new-contractor-name');
        const name = nameInput.value.trim();
        
        if (!name) {
            alert("Contractor name cannot be empty.");
            return;
        }
        
        if (stateManager.contractorExists(name)) {
            alert("Contractor already exists.");
            return;
        }
        
        stateManager.addContractor({ name, licenses: [] });
        nameInput.value = '';
        eventBus.emit('settingsUpdated');
    }

    editContractor(oldName) {
        const newName = prompt("Enter the new name for the contractor:", oldName);
        if (newName && newName.trim() && newName.trim() !== oldName) {
            if (stateManager.contractorExists(newName.trim())) {
                alert("A contractor with this name already exists.");
                return;
            }
            
            stateManager.updateContractor(oldName, newName.trim());
            eventBus.emit('settingsUpdated');
        }
    }

    deleteContractor(name) {
        if (confirm(`Are you sure you want to delete contractor "${name}"? This will also delete all associated data.`)) {
            stateManager.deleteContractor(name);
            eventBus.emit('settingsUpdated');
        }
    }

    renderTrucksPanel() {
        // Similar to renderContractorsPanel but for trucks
        this.elements.trucksPanel.innerHTML = '<h3>Trucks Management Coming Soon</h3>';
    }

    renderSourcesPanel() {
        // Similar to renderContractorsPanel but for sources
        this.elements.sourcesPanel.innerHTML = '<h3>Sources Management Coming Soon</h3>';
    }

    renderDestinationsPanel() {
        // Similar to renderContractorsPanel but for destinations
        this.elements.destinationsPanel.innerHTML = '<h3>Destinations Management Coming Soon</h3>';
    }
}

export default new SettingsController();
window.addEventListener('error', function(event) {
    console.error('Global error handler caught:', event.error);
    console.error('Error details:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

import eventBus from './eventBus.js';
import stateManager from './stateManager.js';
import UIController from './uiController.js';
import SettingsController from './settingsController.js';
import ReportController from './reportController.js';
import DashboardController from './dashboardController.js';
import TabController from './tabController.js';

class App {
    constructor() {
        this.initialize();
    }

    initialize() {
        console.log('App initializing...');
        
        // Check critical dependencies
        const dependencies = {
            'Google Charts': typeof google !== 'undefined',
            'Chart.js': typeof Chart !== 'undefined',
            'D3.js': typeof d3 !== 'undefined',
            'html2canvas': typeof html2canvas !== 'undefined',
            'jsPDF': typeof window.jspdf !== 'undefined',
            'XLSX': typeof XLSX !== 'undefined'
        };
        
        const missingDeps = Object.entries(dependencies)
            .filter(([name, loaded]) => !loaded)
            .map(([name]) => name);
            
        if (missingDeps.length > 0) {
            console.warn('Missing dependencies:', missingDeps);
        }
        
        // Initialize controllers
        this.dashboardController = new DashboardController();
        this.uiController = new UIController();
        this.dashboardController = new DashboardController();
        this.tabController = new TabController(this.dashboardController, this.uiController);
        
        // Initialize state and UI
        stateManager.loadData();
        this.uiController.setInitialDate();
        this.uiController.populateFormOptions();
        
        // Initialize dashboard
        this.dashboardController.updateDateTime();
        setInterval(() => this.dashboardController.updateDateTime(), 1000);
        
        // Initialize settings
        this.settingsController.switchTab('contractors');
        
        // Emit initial events
        eventBus.emit('dataUpdated');
        eventBus.emit('logUpdated');
        
        // Initialize dashboard with default data
        setTimeout(() => {
            this.dashboardController.refreshDashboard();
        }, 100);
        
        console.log('App initialized successfully');
    }
}

new App();

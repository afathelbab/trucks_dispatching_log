import eventBus from './eventBus.js';
import stateManager from './stateManager.js';
import uiController from './uiController.js';
import settingsController from './settingsController.js';
import reportController from './reportController.js';
import exportController from './exportController.js';

class App {
    constructor() {
        this.initialize();
    }

    initialize() {
        document.addEventListener('DOMContentLoaded', () => {
            // All modules are now loaded and ready.
            // Now, explicitly load data and notify the UI.
            stateManager.loadData();
            uiController.setInitialDate();
            eventBus.emit('dataUpdated');
            eventBus.emit('logUpdated');
        });
    }
}

new App();
import stateManager from './stateManager.js';
import eventBus from './eventBus.js';

class ReportController {
    constructor() {
        this.elements = {};
        this.initializeElements();
        this.attachEventListeners();
        this.setupEventBusListeners();
    }

    initializeElements() {
        this.elements = {
            generateReportBtn: document.getElementById('generate-report-btn'),
            generateTruckReportBtn: document.getElementById('generate-truck-report'),
            reportContainer: document.getElementById('report-container'),
            truckReportContainer: document.getElementById('truck-report-container')
        };
    }

    attachEventListeners() {
        if (this.elements.generateReportBtn) {
            this.elements.generateReportBtn.addEventListener('click', () => this.generateMainReport());
        }
    }

    setupEventBusListeners() {
        eventBus.on('logUpdated', () => this.refreshReports());
    }

    generateMainReport() {
        const reportData = stateManager.dispatchLog;
        if (!reportData || reportData.length === 0) {
            this.showError('No data available to generate report.');
            return;
        }

        this.elements.generateReportBtn.disabled = true;
        this.elements.generateReportBtn.textContent = 'Generating...';

        try {
            this.generateAndDisplayReport(reportData);
        } catch (error) {
            console.error('Error generating report:', error);
            this.showError('Error generating report. Please try again.');
        } finally {
            this.elements.generateReportBtn.disabled = false;
            this.elements.generateReportBtn.textContent = 'Generate';
        }
    }

    generateTruckReport() {
        const reportData = stateManager.dispatchLog;
        if (!reportData || reportData.length === 0) {
            this.showError('No data available to generate truck report.');
            return;
        }

        this.elements.generateTruckReportBtn.disabled = true;
        this.elements.generateTruckReportBtn.textContent = 'Generating...';

        try {
            this.generateAndDisplayTruckReport(reportData);
        } catch (error) {
            console.error('Error generating truck report:', error);
            this.showError('Error generating truck report. Please try again.');
        } finally {
            this.elements.generateTruckReportBtn.disabled = false;
            this.elements.generateTruckReportBtn.textContent = 'Generate';
        }
    }

    generateAndDisplayReport(reportData) {
        if (!reportData || reportData.length === 0) {
            this.showError('No data available to generate report.');
            return;
        }

        const summary = this.calculateSummary(reportData);
        const html = this.generateReportHTML(summary, reportData);
        
        if (this.elements.reportContainer) {
            this.elements.reportContainer.innerHTML = html;
        }
    }

    generateAndDisplayTruckReport(reportData) {
        if (!reportData || reportData.length === 0) {
            this.showError('No data available to generate truck report.');
            return;
        }

        const truckSummary = this.calculateTruckSummary(reportData);
        const html = this.generateTruckReportHTML(truckSummary);
        
        if (this.elements.truckReportContainer) {
            this.elements.truckReportContainer.innerHTML = html;
        }
    }

    calculateSummary(data) {
        const summary = {
            totalEntries: data.length,
            totalCapacity: data.reduce((sum, entry) => sum + parseFloat(entry.capacity || 0), 0),
            byContractor: {},
            bySource: {},
            byDestination: {},
            byShift: {}
        };

        data.forEach(entry => {
            // By contractor
            if (!summary.byContractor[entry.contractor]) {
                summary.byContractor[entry.contractor] = { count: 0, capacity: 0 };
            }
            summary.byContractor[entry.contractor].count++;
            summary.byContractor[entry.contractor].capacity += parseFloat(entry.capacity || 0);

            // By source
            if (!summary.bySource[entry.source]) {
                summary.bySource[entry.source] = { count: 0, capacity: 0 };
            }
            summary.bySource[entry.source].count++;
            summary.bySource[entry.source].capacity += parseFloat(entry.capacity || 0);

            // By destination
            if (!summary.byDestination[entry.destination]) {
                summary.byDestination[entry.destination] = { count: 0, capacity: 0 };
            }
            summary.byDestination[entry.destination].count++;
            summary.byDestination[entry.destination].capacity += parseFloat(entry.capacity || 0);

            // By shift
            if (!summary.byShift[entry.shift]) {
                summary.byShift[entry.shift] = { count: 0, capacity: 0 };
            }
            summary.byShift[entry.shift].count++;
            summary.byShift[entry.shift].capacity += parseFloat(entry.capacity || 0);
        });

        return summary;
    }

    calculateTruckSummary(data) {
        const truckSummary = {};

        data.forEach(entry => {
            if (!truckSummary[entry.license]) {
                truckSummary[entry.license] = {
                    license: entry.license,
                    contractor: entry.contractor,
                    totalTrips: 0,
                    totalCapacity: 0,
                    destinations: new Set(),
                    sources: new Set()
                };
            }
            
            truckSummary[entry.license].totalTrips++;
            truckSummary[entry.license].totalCapacity += parseFloat(entry.capacity || 0);
            truckSummary[entry.license].destinations.add(entry.destination);
            truckSummary[entry.license].sources.add(entry.source);
        });

        // Convert Sets to Arrays
        Object.values(truckSummary).forEach(truck => {
            truck.destinations = Array.from(truck.destinations);
            truck.sources = Array.from(truck.sources);
        });

        return truckSummary;
    }

    generateReportHTML(summary, data) {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dispatch Report Summary</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div class="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100">Total Entries</h3>
                        <p class="text-3xl font-bold text-blue-600 dark:text-blue-300">${summary.totalEntries}</p>
                    </div>
                    <div class="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold text-green-900 dark:text-green-100">Total Capacity</h3>
                        <p class="text-3xl font-bold text-green-600 dark:text-green-300">${summary.totalCapacity.toFixed(2)} m³</p>
                    </div>
                    <div class="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold text-purple-900 dark:text-purple-100">Average Capacity</h3>
                        <p class="text-3xl font-bold text-purple-600 dark:text-purple-300">${(summary.totalCapacity / summary.totalEntries).toFixed(2)} m³</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">By Contractor</h3>
                        <div class="space-y-2">
                            ${Object.entries(summary.byContractor).map(([contractor, data]) => `
                                <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                    <span class="font-medium text-gray-900 dark:text-white">${contractor}</span>
                                    <span class="text-sm text-gray-600 dark:text-gray-300">${data.count} trips, ${data.capacity.toFixed(2)} m³</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">By Destination</h3>
                        <div class="space-y-2">
                            ${Object.entries(summary.byDestination).map(([destination, data]) => `
                                <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                    <span class="font-medium text-gray-900 dark:text-white">${destination}</span>
                                    <span class="text-sm text-gray-600 dark:text-gray-300">${data.count} trips, ${data.capacity.toFixed(2)} m³</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateTruckReportHTML(truckSummary) {
        const trucks = Object.values(truckSummary);
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Truck Performance Report</h2>
                
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">License</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contractor</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Trips</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Capacity</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Avg Capacity</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Destinations</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            ${trucks.map(truck => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${truck.license}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${truck.contractor}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${truck.totalTrips}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${truck.totalCapacity.toFixed(2)} m³</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${(truck.totalCapacity / truck.totalTrips).toFixed(2)} m³</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${truck.destinations.join(', ')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    refreshReports() {
        // Refresh reports when data changes
        if (this.elements.reportContainer && this.elements.reportContainer.innerHTML) {
            this.generateMainReport();
        }
        if (this.elements.truckReportContainer && this.elements.truckReportContainer.innerHTML) {
            this.generateTruckReport();
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
}

export default ReportController;

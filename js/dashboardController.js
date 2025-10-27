import stateManager from './stateManager.js';
import chartController from './chartController.js';
import eventBus from './eventBus.js';

class DashboardController {
    constructor() {
        this.currentFilters = {
            startDate: null,
            endDate: null,
            contractor: '',
            shift: ''
        };
        this.dashboardCharts = {};
        this.initializeElements();
        this.attachEventListeners();
        this.setupEventBusListeners();
        this.setDefaultDateRange();
    }

    initializeElements() {
        this.elements = {
            // Dashboard controls
            dashboardStartDate: document.getElementById('dashboard-start-date'),
            dashboardEndDate: document.getElementById('dashboard-end-date'),
            dashboardContractorFilter: document.getElementById('dashboard-contractor-filter'),
            dashboardShiftFilter: document.getElementById('dashboard-shift-filter'),
            applyDashboardFilters: document.getElementById('apply-dashboard-filters'),

            // Metric cards
            totalTrucksMetric: document.getElementById('total-trucks-metric'),
            totalCapacityMetric: document.getElementById('total-capacity-metric'),
            activeContractorsMetric: document.getElementById('active-contractors-metric'),
            avgDailyTripsMetric: document.getElementById('avg-daily-trips-metric'),

            // Chart containers
            dashboardTrendChart: document.getElementById('dashboard-trend-chart'),
            dashboardSankeyChart: document.getElementById('dashboard-sankey-chart'),
            dashboardContractorChart: document.getElementById('dashboard-contractor-chart'),
            dashboardSourceChart: document.getElementById('dashboard-source-chart'),
            dashboardDestinationChart: document.getElementById('dashboard-destination-chart'),

            // Date and time display
            currentDate: document.getElementById('current-date'),
            currentTime: document.getElementById('current-time'),
            
            // Log table
            logTableBody: document.getElementById('log-table-body'),
            emptyLogMessage: document.getElementById('empty-log-message'),
            searchLog: document.getElementById('search-log'),
            filterContractor: document.getElementById('filter-contractor'),
            filterSource: document.getElementById('filter-source'),
            filterDestination: document.getElementById('filter-destination'),
            filterStatus: document.getElementById('filter-status')
        };
    }

    attachEventListeners() {
        // Dashboard filter controls
        if (this.elements.applyDashboardFilters) {
            this.elements.applyDashboardFilters.addEventListener('click', () => this.applyFilters());
        }
        
        // Auto-update when filters change
        if (this.elements.dashboardStartDate) {
            this.elements.dashboardStartDate.addEventListener('change', () => this.applyFilters());
        }
        if (this.elements.dashboardEndDate) {
            this.elements.dashboardEndDate.addEventListener('change', () => this.applyFilters());
        }
        if (this.elements.dashboardContractorFilter) {
            this.elements.dashboardContractorFilter.addEventListener('change', () => this.applyFilters());
        }
        if (this.elements.dashboardShiftFilter) {
            this.elements.dashboardShiftFilter.addEventListener('change', () => this.applyFilters());
        }

        // Log table filters
        if (this.elements.searchLog) {
            this.elements.searchLog.addEventListener('input', () => this.refreshLogTable());
        }
        if (this.elements.filterContractor) {
            this.elements.filterContractor.addEventListener('change', () => this.refreshLogTable());
        }
        if (this.elements.filterSource) {
            this.elements.filterSource.addEventListener('change', () => this.refreshLogTable());
        }
        if (this.elements.filterDestination) {
            this.elements.filterDestination.addEventListener('change', () => this.refreshLogTable());
        }
        if (this.elements.filterStatus) {
            this.elements.filterStatus.addEventListener('change', () => this.refreshLogTable());
        }

        // Update time display
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 1000);
    }

    setupEventBusListeners() {
        eventBus.on('dataUpdated', () => {
            this.populateFilters();
            this.populateLogFilters();
        });
        eventBus.on('logUpdated', () => {
            this.refreshDashboard();
            this.refreshLogTable();
        });
    }

    setDefaultDateRange() {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        this.elements.dashboardStartDate.value = thirtyDaysAgo.toISOString().split('T')[0];
        this.elements.dashboardEndDate.value = today.toISOString().split('T')[0];
        
        this.currentFilters.startDate = thirtyDaysAgo;
        this.currentFilters.endDate = today;
    }

    updateDateTime() {
        const now = new Date();
        this.elements.currentDate.textContent = now.toLocaleDateString('en-GB');
        this.elements.currentTime.textContent = now.toLocaleTimeString('en-GB');
    }

    populateFilters() {
        const contractors = stateManager.getContractors();
        this.populateSelect(this.elements.dashboardContractorFilter, contractors, 'All Contractors');
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

    applyFilters() {
        this.currentFilters.startDate = new Date(this.elements.dashboardStartDate.value);
        this.currentFilters.endDate = new Date(this.elements.dashboardEndDate.value);
        this.currentFilters.contractor = this.elements.dashboardContractorFilter.value;
        this.currentFilters.shift = this.elements.dashboardShiftFilter.value;

        this.refreshDashboard();
    }

    getFilteredData() {
        if (!stateManager.dispatchLog) return [];

        return stateManager.dispatchLog.filter(entry => {
            const entryDate = this.parseDate(entry.date);
            
            // Date range filter
            if (this.currentFilters.startDate && entryDate < this.currentFilters.startDate) return false;
            if (this.currentFilters.endDate && entryDate > this.currentFilters.endDate) return false;
            
            // Contractor filter
            if (this.currentFilters.contractor && entry.contractor !== this.currentFilters.contractor) return false;
            
            // Shift filter
            if (this.currentFilters.shift && entry.shift !== this.currentFilters.shift) return false;
            
            return true;
        });
    }

    parseDate(dateString) {
        const [day, month, year] = dateString.split('/');
        return new Date(year, month - 1, day);
    }

    refreshDashboard() {
        const filteredData = this.getFilteredData();
        this.updateMetrics(filteredData);
        this.updateCharts(filteredData);
    }

    updateMetrics(data) {
        const totalTrucks = data.length;
        const totalCapacity = data.reduce((sum, entry) => sum + parseFloat(entry.capacity || 0), 0);
        const activeContractors = new Set(data.map(entry => entry.contractor)).size;
        
        // Calculate average daily trips
        const dateRange = Math.max(1, Math.ceil((this.currentFilters.endDate - this.currentFilters.startDate) / (1000 * 60 * 60 * 24)));
        const avgDailyTrips = (totalTrucks / dateRange).toFixed(1);

        this.elements.totalTrucksMetric.textContent = totalTrucks;
        this.elements.totalCapacityMetric.textContent = `${totalCapacity.toFixed(0)} m³`;
        this.elements.activeContractorsMetric.textContent = activeContractors;
        this.elements.avgDailyTripsMetric.textContent = avgDailyTrips;
    }

    async updateCharts(data) {
        if (data.length === 0) {
            this.clearCharts();
            return;
        }

        try {
            // Destroy existing charts
            this.destroyCharts();

            // Create new charts
            await Promise.all([
                this.createTrendChart(data),
                this.createSankeyChart(data),
                this.createContractorChart(data),
                this.createSourceChart(data),
                this.createDestinationChart(data)
            ]);
        } catch (error) {
            console.error('Error updating dashboard charts:', error);
        }
    }

    destroyCharts() {
        Object.values(this.dashboardCharts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.dashboardCharts = {};
    }

    clearCharts() {
        this.destroyCharts();
        
        // Clear chart containers
        const containers = [
            this.elements.dashboardTrendChart,
            this.elements.dashboardContractorChart,
            this.elements.dashboardSourceChart,
            this.elements.dashboardDestinationChart
        ];
        
        containers.forEach(container => {
            if (container) {
                const ctx = container.getContext('2d');
                ctx.clearRect(0, 0, container.width, container.height);
            }
        });

        // Clear Sankey chart
        if (this.elements.dashboardSankeyChart) {
            this.elements.dashboardSankeyChart.innerHTML = '<p class="text-center text-gray-500 py-8">No data available</p>';
        }
    }

    async createTrendChart(data) {
        if (typeof Chart === 'undefined') return;

        const dateMap = {};
        const labels = [];
        const truckCountData = [];
        const capacityData = [];

        // Group data by date
        data.forEach(entry => {
            const date = entry.date;
            if (!dateMap[date]) {
                dateMap[date] = { trucks: 0, capacity: 0 };
                labels.push(date);
            }
            dateMap[date].trucks++;
            dateMap[date].capacity += parseFloat(entry.capacity || 0);
        });

        // Sort labels chronologically
        labels.sort((a, b) => this.parseDate(a) - this.parseDate(b));

        // Populate data arrays
        labels.forEach(date => {
            truckCountData.push(dateMap[date].trucks);
            capacityData.push(dateMap[date].capacity);
        });

        const ctx = this.elements.dashboardTrendChart.getContext('2d');
        this.dashboardCharts.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Number of Trucks',
                        data: truckCountData,
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        yAxisID: 'yTrucks',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Total Capacity (m³)',
                        data: capacityData,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        yAxisID: 'yCapacity',
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Dispatch Trends'
                    }
                },
                scales: {
                    yTrucks: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Number of Trucks'
                        },
                        min: 0
                    },
                    yCapacity: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Capacity (m³)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        min: 0
                    }
                }
            }
        });
    }

    async createSankeyChart(data) {
        if (typeof google === 'undefined') return;

        const sankeyData = this.generateSankeyData(data);
        
        return new Promise((resolve) => {
            google.charts.load('current', {'packages':['sankey']});
            google.charts.setOnLoadCallback(() => {
                this.drawSankeyChart(sankeyData);
                resolve();
            });
        });
    }

    generateSankeyData(data) {
        const nodes = new Set();
        const links = {};

        data.forEach(entry => {
            nodes.add(entry.source);
            nodes.add(entry.contractor);
            nodes.add(entry.destination);

            const sourceContractor = `${entry.source}|${entry.contractor}`;
            links[sourceContractor] = (links[sourceContractor] || 0) + 1;

            const contractorDest = `${entry.contractor}|${entry.destination}`;
            links[contractorDest] = (links[contractorDest] || 0) + 1;
        });

        const nodeArray = Array.from(nodes).map(name => ({ name }));
        const linkArray = Object.entries(links).map(([key, value]) => {
            const [source, target] = key.split('|');
            const sourceIndex = nodeArray.findIndex(n => n.name === source);
            const targetIndex = nodeArray.findIndex(n => n.name === target);
            return { source: sourceIndex, target: targetIndex, value };
        });

        return { nodes: nodeArray, links: linkArray };
    }

    drawSankeyChart(data) {
        if (data.nodes.length <= 1) {
            this.elements.dashboardSankeyChart.innerHTML = '<p class="text-center text-gray-500 py-8">Insufficient data for flow chart</p>';
            return;
        }

        const dataArray = [['From', 'To', 'Weight']];
        data.links.forEach(link => {
            dataArray.push([data.nodes[link.source].name, data.nodes[link.target].name, link.value]);
        });

        const dataTable = google.visualization.arrayToDataTable(dataArray);

        const options = {
            height: 320,
            sankey: {
                node: {
                    label: { fontName: 'Inter', fontSize: 12, color: '#000', bold: true },
                    nodePadding: 15
                },
                link: {
                    colorMode: 'gradient',
                }
            }
        };

        const chart = new google.visualization.Sankey(this.elements.dashboardSankeyChart);
        chart.draw(dataTable, options);
        this.dashboardCharts.sankeyChart = chart;
    }

    async createContractorChart(data) {
        if (typeof Chart === 'undefined') return;

        const contractorData = this.groupData(data, 'contractor');
        this.createDoughnutChart(this.elements.dashboardContractorChart, 'By Contractor', contractorData, 'contractorChart');
    }

    async createSourceChart(data) {
        if (typeof Chart === 'undefined') return;

        const sourceData = this.groupData(data, 'source');
        this.createDoughnutChart(this.elements.dashboardSourceChart, 'By Source', sourceData, 'sourceChart');
    }

    async createDestinationChart(data) {
        if (typeof Chart === 'undefined') return;

        const destinationData = this.groupData(data, 'destination');
        this.createDoughnutChart(this.elements.dashboardDestinationChart, 'By Destination', destinationData, 'destinationChart');
    }

    groupData(data, key) {
        return data.reduce((acc, entry) => {
            const groupKey = entry[key];
            if (!acc[groupKey]) {
                acc[groupKey] = { count: 0, capacity: 0 };
            }
            acc[groupKey].count++;
            acc[groupKey].capacity += parseFloat(entry.capacity || 0);
            return acc;
        }, {});
    }

    createDoughnutChart(canvas, label, dataObject, chartId) {
        const ctx = canvas.getContext('2d');
        const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
        
        this.dashboardCharts[chartId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(dataObject),
                datasets: [{
                    label: 'Number of Trucks',
                    data: Object.values(dataObject).map(d => d.count),
                    backgroundColor: chartColors,
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        text: `${label}: Truck Count Distribution`
                    }
                }
            }
        });
    }
    
    populateLogFilters() {
        if (!this.elements.filterContractor) return;
        
        const contractors = stateManager.getContractors();
        this.elements.filterContractor.innerHTML = '<option value="">All Contractors</option>';
        contractors.forEach(contractor => {
            const option = document.createElement('option');
            option.value = contractor;
            option.textContent = contractor;
            this.elements.filterContractor.appendChild(option);
        });
        
        const sources = stateManager.getSources();
        if (this.elements.filterSource) {
            this.elements.filterSource.innerHTML = '<option value="">All Sources</option>';
            sources.forEach(source => {
                const option = document.createElement('option');
                option.value = source;
                option.textContent = source;
                this.elements.filterSource.appendChild(option);
            });
        }
        
        const destinations = stateManager.getAllDestinations();
        if (this.elements.filterDestination) {
            this.elements.filterDestination.innerHTML = '<option value="">All Destinations</option>';
            destinations.forEach(destination => {
                const option = document.createElement('option');
                option.value = destination;
                option.textContent = destination;
                this.elements.filterDestination.appendChild(option);
            });
        }
    }
    
    refreshLogTable() {
        if (!this.elements.logTableBody || !stateManager.dispatchLog) return;
        
        const filters = {
            search: this.elements.searchLog ? this.elements.searchLog.value.toLowerCase() : '',
            contractor: this.elements.filterContractor ? this.elements.filterContractor.value : '',
            source: this.elements.filterSource ? this.elements.filterSource.value : '',
            destination: this.elements.filterDestination ? this.elements.filterDestination.value : '',
            status: this.elements.filterStatus ? this.elements.filterStatus.value : ''
        };
        
        const filteredLogs = stateManager.getFilteredLogs(filters);
        
        if (filteredLogs.length === 0) {
            this.elements.logTableBody.innerHTML = '';
            if (this.elements.emptyLogMessage) {
                this.elements.emptyLogMessage.classList.remove('hidden');
            }
            return;
        }
        
        if (this.elements.emptyLogMessage) {
            this.elements.emptyLogMessage.classList.add('hidden');
        }
        
        this.elements.logTableBody.innerHTML = filteredLogs.map(entry => `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="p-3 text-sm text-gray-900 dark:text-gray-100">${entry.date}</td>
                <td class="p-3 text-sm text-gray-900 dark:text-gray-100">${entry.contractor}</td>
                <td class="p-3 text-sm text-gray-900 dark:text-gray-100">${entry.license}</td>
                <td class="p-3 text-sm text-gray-900 dark:text-gray-100 text-center">${entry.capacity || 'N/A'}</td>
                <td class="p-3 text-sm text-gray-900 dark:text-gray-100">${entry.source}</td>
                <td class="p-3 text-sm text-gray-900 dark:text-gray-100">${entry.destination}</td>
                <td class="p-3 text-sm text-gray-900 dark:text-gray-100">${entry.shift}</td>
                <td class="p-3 text-sm">
                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${entry.status === 'Verified' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'}">
                        ${entry.status}
                    </span>
                </td>
            </tr>
        `).join('');
    }
}

export default DashboardController;

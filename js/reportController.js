import stateManager from './stateManager.js';
import chartController from './chartController.js';
import uiController from './uiController.js';

class ReportController {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.elements = {
            generateReportBtn: document.getElementById('generate-report-btn'),
            reportStartDateInput: document.getElementById('report-start-date'),
            reportEndDateInput: document.getElementById('report-end-date'),
            reportOutput: document.getElementById('report-output'),

            generateTruckReportBtn: document.getElementById('generate-truck-report-btn'),
            reportContractorSelect: document.getElementById('report-contractor'),
            reportLicenseSelect: document.getElementById('report-license'),
            truckReportStartDateInput: document.getElementById('truck-report-start-date'),
            truckReportEndDateInput: document.getElementById('truck-report-end-date'),
            truckReportOutput: document.getElementById('truck-report-output'),
        };
    }

    attachEventListeners() {
        this.elements.generateReportBtn.addEventListener('click', () => this.generateMainReport());
        this.elements.generateTruckReportBtn.addEventListener('click', () => this.generateTruckReport());

        this.elements.reportContractorSelect.addEventListener('change', () => this.handleReportContractorChange());
    }

    handleReportContractorChange() {
        const selectedContractor = this.elements.reportContractorSelect.value;
        const trucks = stateManager.getTrucksForContractor(selectedContractor);
        uiController.populateSelect(this.elements.reportLicenseSelect, trucks.map(t => t.license), 'Select License');
        this.elements.reportLicenseSelect.disabled = !selectedContractor;
    }

    parseDate(dateString) { // DD/MM/YYYY to Date object
        const [day, month, year] = dateString.split('/');
        return new Date(year, month - 1, day);
    }

    generateMainReport() {
        const startDateValue = this.elements.reportStartDateInput.value;
        const endDateValue = this.elements.reportEndDateInput.value;

        if (!startDateValue || !endDateValue) {
            alert("Please select both a start and end date for the report.");
            return;
        }

        const startDate = new Date(startDateValue);
        const endDate = new Date(endDateValue);

        if (startDate > endDate) {
            alert("Start date cannot be after the end date.");
            return;
        }

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        const filteredLog = stateManager.dispatchLog.filter(entry => {
            const entryDate = this.parseDate(entry.date);
            return entryDate >= startDate && entryDate <= endDate;
        });

        this.generateAndDisplayReport(filteredLog, startDate, endDate);
    }

    generateTruckReport() {
        const contractor = this.elements.reportContractorSelect.value;
        const license = this.elements.reportLicenseSelect.value;
        const startDateValue = this.elements.truckReportStartDateInput.value;
        const endDateValue = this.elements.truckReportEndDateInput.value;

        if (!contractor || !license || !startDateValue || !endDateValue) {
            alert("Please select a contractor, truck, and both a start and end date.");
            return;
        }

        const startDate = new Date(startDateValue);
        const endDate = new Date(endDateValue);
        if (startDate > endDate) {
            alert("Start date cannot be after the end date.");
            return;
        }
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        const filteredLog = stateManager.dispatchLog.filter(entry => {
            const entryDate = this.parseDate(entry.date);
            return entry.license === license && entryDate >= startDate && entryDate <= endDate;
        });

        this.generateAndDisplayTruckReport(filteredLog, license, startDate, endDate);
    }

    generateAndDisplayReport(reportData, startDate, endDate) {
        chartController.destroyCharts();
        this.elements.reportOutput.innerHTML = '';
        this.elements.reportOutput.classList.remove('hidden');

        if (reportData.length === 0) {
            this.elements.reportOutput.innerHTML = `<p class="text-center text-gray-500 py-4">No data available for the selected period.</p>`;
            return;
        }

        const sankeyData = this.generateSankeyData(reportData);

        let lineChartLabels = [];
        let truckCountData = [];
        let capacityData = [];
        let reportTitle = '';

        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) { // Single Day Report
            reportTitle = `Report for ${startDate.toLocaleDateString('en-GB')}`;
            lineChartLabels = ['Night After Midnight', 'Day Shift', 'Night Before Midnight'];
            const shiftOrder = { 'Night Shift After Midnight': 0, 'Day Shift': 1, 'Night Shift - Before Midnight': 2 };
            truckCountData = [0, 0, 0];
            capacityData = [0, 0, 0];

            reportData.forEach(entry => {
                const idx = shiftOrder[entry.shift];
                if (idx !== undefined) {
                    truckCountData[idx]++;
                    capacityData[idx] += parseFloat(entry.capacity || 0);
                }
            });

        } else { // Daily breakdown
            reportTitle = `Report from ${startDate.toLocaleDateString('en-GB')} to ${endDate.toLocaleDateString('en-GB')}`;
            const dateMap = {};
            let currentDate = new Date(startDate);
            let i = 0;
            while (currentDate <= endDate) {
                const dateString = currentDate.toLocaleDateString('en-GB');
                lineChartLabels.push(dateString.slice(0, 5)); // DD/MM
                dateMap[dateString] = i;
                truckCountData.push(0);
                capacityData.push(0);
                currentDate.setDate(currentDate.getDate() + 1);
                i++;
            }

            reportData.forEach(entry => {
                const idx = dateMap[entry.date];
                if (idx !== undefined) {
                    truckCountData[idx]++;
                    capacityData[idx] += parseFloat(entry.capacity || 0);
                }
            });
        }

        const totalTrucks = reportData.length;
        const totalCapacity = reportData.reduce((sum, entry) => sum + parseFloat(entry.capacity || 0), 0);

        const bySource = this.groupData(reportData, 'source');
        const byDestination = this.groupData(reportData, 'destination');
        const byContractor = this.groupData(reportData, 'contractor');

        let reportHTML = `
            <div class="flex justify-between items-center mb-4">
               <h3 class="text-xl font-bold">${reportTitle}</h3>
               <div class="flex gap-2">
                   <button data-export="pdf" class="px-3 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-red-600">Export PDF</button>
                   <button data-export="excel" class="px-3 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-green-600">Export Excel</button>
               </div>
            </div>

            <div class="mb-8">
                <h4 class="font-semibold mb-2 text-gray-700">Dispatch Flow Overview</h4>
                <div id="sankey-chart" class="w-full h-96"></div>
            </div>
            <hr class="my-8"/>

            <div class="mb-8">
               <h4 class="font-semibold mb-2 text-gray-700">Trend Overview</h4>
               <div class="bg-gray-50 p-4 rounded-lg">
                   <canvas id="trendChart"></canvas>
               </div>
            </div>
            <hr class="my-8"/>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 summarycards">
               <div class="bg-gray-100 p-4 rounded-lg">
                   <p class="text-sm text-gray-600">Total Trucks</p>
                   <p class="text-2xl font-bold">${totalTrucks}</p>
               </div>
               <div class="bg-gray-100 p-4 rounded-lg">
                   <p class="text-sm text-gray-600">Total Capacity (m³)</p>
                   <p class="text-2xl font-bold">${totalCapacity.toFixed(2)}</p>
               </div>
            </div>
        `;

        reportHTML += this.createTableAndChart('Breakdown by Source', bySource, 'sourceChart');
        reportHTML += this.createTableAndChart('Breakdown by Destination', byDestination, 'destinationChart');
        reportHTML += this.createTableAndChart('Breakdown by Contractor', byContractor, 'contractorChart');

        reportHTML += this.generateSummaryTable(reportData);

        this.elements.reportOutput.innerHTML = reportHTML;

        chartController.createSankeyChart(sankeyData);
        chartController.createTrendChart(lineChartLabels, truckCountData, capacityData);

        chartController.createDoughnutChart('sourceChart', 'By Source', bySource);
        chartController.createDoughnutChart('destinationChart', 'By Destination', byDestination);
        chartController.createDoughnutChart('contractorChart', 'By Contractor', byContractor);
    }

    generateSankeyData(reportData) {
        const nodes = new Set();
        const links = {};

        reportData.forEach(entry => {
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

    groupData(reportData, key) {
        return reportData.reduce((acc, entry) => {
            const groupKey = entry[key];
            if (!acc[groupKey]) {
                acc[groupKey] = { count: 0, capacity: 0 };
            }
            acc[groupKey].count++;
            acc[groupKey].capacity += parseFloat(entry.capacity || 0);
            return acc;
        }, {});
    }

    createTableAndChart(title, dataObject, chartId) {
        let content = `<div class="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center breakdownsection">`;
        content += `<div><canvas id="${chartId}"></canvas></div>`;
        let table = `<div><h4 class="font-semibold mb-2">${title}</h4><div class="overflow-x-auto"><table class="w-full text-sm">
            <thead class="bg-gray-50"><tr>
            <th class="p-2 text-left font-medium text-gray-600 rounded-l-md">${title.replace('Breakdown by ', '')}</th>
            <th class="p-2 text-right font-medium text-gray-600">Trucks</th>
            <th class="p-2 text-right font-medium text-gray-600 rounded-r-md">Capacity (m³)</th>
            </tr></thead><tbody>`;
        for (const key in dataObject) {
            table += `<tr class="border-b"><td class="p-2">${key}</td><td class="p-2 text-right">${dataObject[key].count}</td><td class="p-2 text-right">${dataObject[key].capacity.toFixed(2)}</td></tr>`;
        }
        table += `</tbody></table></div></div>`;
        content += table;
        content += `</div><hr class="my-6"/>`;
        return content;
    }

    generateSummaryTable(reportData) {
        const summary = {};
        reportData.forEach(entry => {
            if (!summary[entry.contractor]) summary[entry.contractor] = {};
            if (!summary[entry.contractor][entry.source]) summary[entry.contractor][entry.source] = {};
            if (!summary[entry.contractor][entry.source][entry.destination]) {
                summary[entry.contractor][entry.source][entry.destination] = { count: 0, capacity: 0 };
            }
            summary[entry.contractor][entry.source][entry.destination].count++;
            summary[entry.contractor][entry.source][entry.destination].capacity += parseFloat(entry.capacity);
        });

        let table = `
            <div class="mt-8">
                <h3 class="text-xl font-bold mb-4">Detailed Summary Table</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left border" id="summary-table">
                        <thead class="bg-gray-100">
                            <tr>
                                <th class="p-2 border">Contractor</th>
                                <th class="p-2 border">Source</th>
                                <th class="p-2 border">Destination</th>
                                <th class="p-2 border text-right">Trucks</th>
                                <th class="p-2 border text-right">Total Capacity (m³)</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        Object.keys(summary).sort().forEach(contractor => {
            Object.keys(summary[contractor]).sort().forEach(source => {
                Object.keys(summary[contractor][source]).sort().forEach(destination => {
                    const data = summary[contractor][source][destination];
                    table += `
                        <tr class="border">
                            <td class="p-2 border">${contractor}</td>
                            <td class="p-2 border">${source}</td>
                            <td class="p-2 border">${destination}</td>
                            <td class="p-2 border text-right">${data.count}</td>
                            <td class="p-2 border text-right">${data.capacity.toFixed(2)}</td>
                        </tr>
                    `;
                });
            });
        });

        table += `</tbody></table></div></div>`;
        return table;
    }

    generateAndDisplayTruckReport(reportData, license, startDate, endDate) {
        this.elements.truckReportOutput.innerHTML = '';
        this.elements.truckReportOutput.classList.remove('hidden');

        if (reportData.length === 0) {
            this.elements.truckReportOutput.innerHTML = `<p class="text-center text-gray-500 py-4">No data available for this truck in the selected period.</p>`;
            return;
        }

        const totalTrips = reportData.length;
        const totalCapacity = reportData.reduce((sum, entry) => sum + parseFloat(entry.capacity || 0), 0);

        let tableHTML = `
            <h3 class="text-xl font-bold mb-4">History for Truck: ${license}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div class="bg-gray-100 p-4 rounded-lg">
                    <p class="text-sm text-gray-600">Total Trips</p>
                    <p class="text-2xl font-bold">${totalTrips}</p>
                </div>
                <div class="bg-gray-100 p-4 rounded-lg">
                    <p class="text-sm text-gray-600">Total Capacity Hauled (m³)</p>
                    <p class="text-2xl font-bold">${totalCapacity.toFixed(2)}</p>
                </div>
            </div>
            <table class="w-full text-left text-sm">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="p-3 font-semibold text-gray-600 rounded-l-lg">Date</th>
                        <th class="p-3 font-semibold text-gray-600">Source</th>
                        <th class="p-3 font-semibold text-gray-600">Destination</th>
                        <th class="p-3 font-semibold text-gray-600">Shift</th>
                        <th class="p-3 font-semibold text-gray-600">Capacity (m³)</th>
                        <th class="p-3 font-semibold text-gray-600 rounded-r-lg">Status</th>
                    </tr>
                </thead>
                <tbody>`;

        reportData.sort((a,b) => this.parseDate(b.date) - this.parseDate(a.date)).forEach(entry => {
            tableHTML += `
                <tr class="border-b">
                    <td class="p-3">${entry.date}</td>
                    <td class="p-3">${entry.source}</td>
                    <td class="p-3">${entry.destination}</td>
                    <td class="p-3">${entry.shift}</td>
                    <td class="p-3">${entry.capacity}</td>
                    <td class="p-3">${entry.status}</td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table>`;
        this.elements.truckReportOutput.innerHTML = tableHTML;
    }
}

export default new ReportController();

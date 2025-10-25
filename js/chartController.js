// Chart controller for managing all chart-related functionality
class ChartController {
    constructor() {
        this.reportCharts = {};
    }

    destroyCharts() {
        Object.values(this.reportCharts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.reportCharts = {};
    }

    createSankeyChart(dataArray) {
        if (dataArray.length <= 1) return;

        google.charts.load('current', {'packages':['sankey']});
        google.charts.setOnLoadCallback(() => this.drawSankeyChart(dataArray));
    }

    drawSankeyChart(dataArray) {
        const data = google.visualization.arrayToDataTable(dataArray);
        const contractorNames = Object.keys(stateManager.appData.contractors);
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
        const contractorColors = {};
        
        contractorNames.forEach((name, i) => {
            contractorColors[name] = colors[i % colors.length];
        });
        
        const uniqueNodes = Array.from(new Set(dataArray.slice(1).flatMap(row => [row[0], row[1]])));
        const nodeColors = uniqueNodes.map(node => contractorColors[node] || '#6B7280');

        const options = {
            height: 450,
            sankey: {
                node: {
                    colors: nodeColors,
                    label: { fontName: 'Inter', fontSize: 13, color: '#000', bold: true },
                    nodePadding: 20
                },
                link: {
                    colorMode: 'gradient',
                }
            }
        };

        const chart = new google.visualization.Sankey(document.getElementById('sankeyChart_div'));
        chart.draw(data, options);
    }

    createTrendChart(labels, truckData, capacityData) {
        const ctx = document.getElementById('trendChart').getContext('2d');
        this.reportCharts['trendChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Number of Trucks',
                        data: truckData,
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
            options: this.getTrendChartOptions()
        });
    }

    getTrendChartOptions() {
        return {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            stacked: false,
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
                    min: 0,
                    ticks: {
                        stepSize: 1
                    }
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
        };
    }

    createDoughnutChart(chartId, label, dataObject) {
        const ctx = document.getElementById(chartId).getContext('2d');
        const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
        
        this.reportCharts[chartId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(dataObject),
                datasets: [{
                    label: `Number of Trucks`,
                    data: Object.values(dataObject).map(d => d.count),
                    backgroundColor: chartColors,
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: `${label}: Truck Count Distribution`
                    }
                }
            }
        });
    }
}

export default new ChartController();
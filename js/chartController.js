import stateManager from './stateManager.js';

// Chart controller for managing all chart-related functionality
class ChartController {
    constructor() {
        this.reportCharts = {};
        this.sankeyData = null;
    }

    destroyCharts() {
        Object.values(this.reportCharts).forEach(chart => {
            if (chart) {
                if (chart.destroy) {
                    chart.destroy();
                } else if (chart.clearChart) {
                    chart.clearChart();
                }
            }
        });
        this.reportCharts = {};
    }

    getChart(chartId) {
        return this.reportCharts[chartId];
    }

    createSankeyChart(data) {
        this.sankeyData = data;
        if (data.nodes.length <= 1) return Promise.resolve();

        return new Promise((resolve) => {
            google.charts.load('current', {'packages':['sankey']});
            google.charts.setOnLoadCallback(() => {
                this.drawSankeyChart(data);
                resolve();
            });
        });
    }

    drawSankeyChart(data) {
        const dataArray = [['From', 'To', 'Weight']];
        data.links.forEach(link => {
            dataArray.push([data.nodes[link.source].name, data.nodes[link.target].name, link.value]);
        });

        const dataTable = google.visualization.arrayToDataTable(dataArray);

        const options = {
            height: 450,
            sankey: {
                node: {
                    label: { fontName: 'Inter', fontSize: 13, color: '#000', bold: true },
                    nodePadding: 20
                },
                link: {
                    colorMode: 'gradient',
                }
            }
        };

        const chart = new google.visualization.Sankey(document.getElementById('sankey-chart'));
        chart.draw(dataTable, options);
        this.reportCharts['sankeyChart'] = chart;
    }

    createTrendChart(labels, truckData, capacityData) {
        return new Promise((resolve) => {
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
                options: {
                    ...this.getTrendChartOptions(),
                    animation: {
                        onComplete: () => {
                            resolve();
                        }
                    }
                }
            });
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
        return new Promise((resolve) => {
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
                    },
                    animation: {
                        onComplete: () => {
                            resolve();
                        }
                    }
                }
            });
        });
    }
}

export default new ChartController();

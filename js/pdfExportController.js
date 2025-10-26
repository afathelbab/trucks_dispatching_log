import chartController from './chartController.js';

class ExportController {
    constructor() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-export="pdf"]')) {
                this.exportToPDF();
            } else if (e.target.matches('[data-export="excel"]')) {
                this.exportToExcel();
            }
        });
    }

    async exportToPDF() {
        try {
            const reportContent = document.getElementById('report-output');
            if (reportContent.classList.contains('hidden')) {
                alert("Please generate a report first.");
                return;
            }

            const { jsPDF } = window.jspdf;
            if (!jsPDF.API.autoTable) {
                console.error("jsPDF-AutoTable is required. Please include it in your project.");
                alert("PDF export functionality is not fully configured. Please contact support.");
                return;
            }

            const reportTitle = reportContent.querySelector('h3').innerText;

            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

            // --- Cover Page ---
            pdf.setFontSize(18);
            pdf.text("Belayiem Petroleum Company - PETROBEL", pdf.internal.pageSize.getWidth() / 2, 80, { align: 'center' });
            pdf.setFontSize(22);
            pdf.text("Truck Dispatch Report", pdf.internal.pageSize.getWidth() / 2, 100, { align: 'center' });
            pdf.setFontSize(16);
            pdf.text(reportTitle, pdf.internal.pageSize.getWidth() / 2, 120, { align: 'center' });
            pdf.setFontSize(12);
            pdf.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, pdf.internal.pageSize.getWidth() / 2, 130, { align: 'center' });

            pdf.addPage();

            const pageHeight = pdf.internal.pageSize.getHeight();
            const pageWidth = pdf.internal.pageSize.getWidth();
            const margin = 15;
            let y = margin;

            // --- Summary Cards ---
            const summaryCards = reportContent.querySelector('.summarycards');
            if (summaryCards) {
                const canvas = await html2canvas(summaryCards, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pageWidth - margin * 2;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                if (y + imgHeight + margin > pageHeight) {
                    pdf.addPage();
                    y = margin;
                }
                pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
                y += imgHeight + 10;
            }

            // --- Matrix Chart ---
            const matrixChart = await this.createMatrixChart(chartController.sankeyData);
            if(matrixChart) {
                if (y + 100 > pageHeight) { // Estimate space for chart
                    pdf.addPage();
                    y = margin;
                }
                pdf.text("Dispatch Flow Matrix", margin, y);
                y += 5;
                const imgWidth = pageWidth - margin * 2;
                const imgHeight = (matrixChart.height * imgWidth) / matrixChart.width;
                pdf.addImage(matrixChart.toDataURL('image/png'), 'PNG', margin, y, imgWidth, imgHeight);
                y += imgHeight + 10;
            }

            // --- Trend Chart ---
            const trendChartCanvas = reportContent.querySelector('#trendChart');
            if (trendChartCanvas) {
                const imgData = trendChartCanvas.toDataURL('image/png');
                const imgWidth = pageWidth - margin * 2;
                const imgHeight = (trendChartCanvas.height * imgWidth) / trendChartCanvas.width;
                if (y + imgHeight + margin > pageHeight) {
                    pdf.addPage();
                    y = margin;
                }
                pdf.text("Trend Overview", margin, y);
                y += 5;
                pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
                y += imgHeight + 10;
            }

            // --- Doughnut Charts and Tables ---
            const breakdownSections = reportContent.querySelectorAll('.breakdownsection');
            for (const section of breakdownSections) {
                const chartContainer = section.querySelector('div'); // The div containing the canvas
                const table = section.querySelector('table');
                const title = section.querySelector('h4').innerText;

                if (y + 100 > pageHeight) { // Estimate space for chart
                    pdf.addPage();
                    y = margin;
                }
                
                pdf.text(title, margin, y);
                y += 5;

                const chartCanvas = await html2canvas(chartContainer, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                const chartImg = chartCanvas.toDataURL('image/png');
                const imgWidth = pageWidth - margin * 2;
                const imgHeight = (chartCanvas.height * imgWidth) / chartCanvas.width;
                pdf.addImage(chartImg, 'PNG', margin, y, imgWidth, imgHeight);
                y += imgHeight + 10;

                if (y + 20 > pageHeight) { // Estimate space for table
                    pdf.addPage();
                    y = margin;
                }

                pdf.autoTable({
                    html: table,
                    startY: y,
                    theme: 'grid',
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0] }
                });

                y = pdf.autoTable.previous.finalY + 10;
            }

            // --- Detailed Summary Table ---
            const summaryTable = document.getElementById('summary-table');
            if (summaryTable) {
                pdf.addPage();
                y = margin;
                pdf.text("Detailed Summary Table", margin, y);
                y += 5;
                pdf.autoTable({ html: summaryTable, startY: y, theme: 'grid' });
            }

            // --- Footer and Header ---
            const pageCount = pdf.internal.getNumberOfPages();
            for(let i = 2; i <= pageCount; i++) { // Start from page 2, as page 1 is the cover
                pdf.setPage(i);
                // Header
                pdf.setFontSize(12);
                pdf.text("Belayiem Petroleum Company - PETROBEL", pdf.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
                // Footer
                pdf.setFontSize(10);
                pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.getWidth() / 2, 287, { align: 'center' });
                pdf.text('Developed by Ahmed Fathelbab - fath@petrobel.org', pdf.internal.pageSize.getWidth() / 2, 292, { align: 'center' });
            }

            pdf.save(`${reportTitle.replace(/ /g, '_')}.pdf`);
        } catch (error) {
            console.error("Error exporting to PDF:", error);
            alert("An error occurred while exporting to PDF. Please check the console for details.");
        }
    }

    async createMatrixChart(data) {
        if (!data || !data.nodes || !data.links) return null;

        const { nodes, links } = data;
        const nodeNames = nodes.map(n => n.name);

        const width = 800;
        const height = 800;
        const margin = { top: 100, right: 50, bottom: 50, left: 100 };

        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .style("background", "white");

        const x = d3.scaleBand().domain(d3.range(nodeNames.length)).range([margin.left, width - margin.right]);
        const y = d3.scaleBand().domain(d3.range(nodeNames.length)).range([margin.top, height - margin.bottom]);

        svg.append("g")
            .attr("transform", `translate(0, ${margin.top})`)
            .call(d3.axisTop(x).tickFormat(i => nodeNames[i]))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "start");

        svg.append("g")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(y).tickFormat(i => nodeNames[i]));

        const color = d3.scaleSequential(d3.interpolateBlues).domain([0, d3.max(links, d => d.value)]);

        const g = svg.append("g");

        links.forEach(link => {
            g.append("rect")
                .attr("x", x(link.target))
                .attr("y", y(link.source))
                .attr("width", x.bandwidth())
                .attr("height", y.bandwidth())
                .attr("fill", color(link.value));

            g.append("text")
                .attr("x", x(link.target) + x.bandwidth() / 2)
                .attr("y", y(link.source) + y.bandwidth() / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .attr("fill", link.value > d3.max(links, l => l.value) / 2 ? "white" : "black")
                .text(link.value);
        });

        const canvas = await html2canvas(svg.node(), { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        return canvas;
    }

    exportToExcel() {
        const wb = XLSX.utils.book_new();
        const summaryTable = document.getElementById('summary-table');
        if (summaryTable) {
            const ws = XLSX.utils.table_to_sheet(summaryTable);
            XLSX.utils.book_append_sheet(wb, ws, "Summary");
        }
        XLSX.writeFile(wb, 'dispatch_report.xlsx');
    }
}

export default new ExportController();
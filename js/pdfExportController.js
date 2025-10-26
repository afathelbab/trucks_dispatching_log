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

            // Add a small delay to ensure all elements are rendered
            await new Promise(resolve => setTimeout(resolve, 500));

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
                try {
                    console.log("Attempting to capture summaryCards...");
                    const canvas = await html2canvas(summaryCards, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: true });
                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = pageWidth - margin * 2;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    if (y + imgHeight + margin > pageHeight) {
                        pdf.addPage();
                        y = margin;
                    }
                    pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
                    y += imgHeight + 10;
                    console.log("summaryCards captured successfully.");
                } catch (error) {
                    console.error("Error capturing summaryCards:", error);
                    throw new Error("Failed to capture summaryCards");
                }
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

                try {
                    console.log(`Attempting to capture breakdown section: ${title}`);
                    const chartCanvas = await html2canvas(chartContainer, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: true });
                    const chartImg = chartCanvas.toDataURL('image/png');
                    const imgWidth = pageWidth - margin * 2;
                    const imgHeight = (chartCanvas.height * imgWidth) / chartCanvas.width;
                    pdf.addImage(chartImg, 'PNG', margin, y, imgWidth, imgHeight);
                    y += imgHeight + 10;
                    console.log(`Breakdown section "${title}" captured successfully.`);
                } catch (error) {
                    console.error(`Error capturing breakdown section "${title}":`, error);
                    throw new Error(`Failed to capture breakdown section "${title}"`);
                }

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
        const outerRadius = Math.min(width, height) * 0.5 - 100;
        const innerRadius = outerRadius - 20;

        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-width / 2, -height / 2, width, height])
            .style("background", "white");

        const matrix = (() => {
            const index = new Map(nodeNames.map((name, i) => [name, i]));
            const matrix = Array.from(index, () => new Array(index.size).fill(0));
            for (const { source, target, value } of links) {
                matrix[source][target] += value;
            }
            return matrix;
        })();

        const chord = d3.chord()
            .padAngle(0.05)
            .sortSubgroups(d3.descending);

        const arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        const ribbon = d3.ribbon()
            .radius(innerRadius);

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const chords = chord(matrix);

        const group = svg.append("g")
            .selectAll("g")
            .data(chords.groups)
            .join("g");

        group.append("path")
            .attr("fill", d => color(d.index))
            .attr("stroke", d => d3.rgb(color(d.index)).darker())
            .attr("d", arc);

        group.append("text")
            .each(d => (d.angle = (d.startAngle + d.endAngle) / 2))
            .attr("dy", "0.35em")
            .attr("transform", d => `
                rotate(${(d.angle * 180 / Math.PI - 90)})
                translate(${outerRadius + 5})
                ${d.angle > Math.PI ? "rotate(180)" : ""}
            `)
            .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
            .text((d, i) => nodeNames[i]);

        svg.append("g")
            .attr("fill-opacity", 0.67)
            .selectAll("path")
            .data(chords)
            .join("path")
            .attr("d", ribbon)
            .attr("fill", d => color(d.target.index))
            .attr("stroke", d => d3.rgb(color(d.target.index)).darker());

        const svgNode = svg.node();
        
        // Temporarily append to the body to ensure styles are applied
        svgNode.style.position = 'absolute';
        svgNode.style.left = '-9999px';
        document.body.appendChild(svgNode);

        try {
            console.log("Attempting to capture chord chart...");
            const canvas = await html2canvas(svgNode, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: true });
            console.log("Chord chart captured successfully.");
            return canvas;
        } catch (error) {
            console.error("Error capturing chord chart:", error);
            throw new Error("Failed to capture chord chart");
        } finally {
            // Clean up
            document.body.removeChild(svgNode);
        }
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

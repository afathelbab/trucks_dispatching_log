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
            const summaryCards = reportContent.querySelector('.summary-cards');
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

            // --- Sankey Chart ---
            const sankeyChartObj = chartController.getChart('sankeyChart');
            if (sankeyChartObj) {
                const imgData = sankeyChartObj.getImageURI();
                const chartDiv = document.getElementById('sankeyChart_div');
                const imgWidth = pageWidth - margin * 2;
                const imgHeight = (chartDiv.clientHeight * imgWidth) / chartDiv.clientWidth;
                if (y + imgHeight + margin > pageHeight) {
                    pdf.addPage();
                    y = margin;
                }
                pdf.text("Dispatch Flow Overview", margin, y);
                y += 5;
                pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
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
            const breakdownSections = reportContent.querySelectorAll('.breakdown-section');
            for (const section of breakdownSections) {
                const chartCanvas = section.querySelector('canvas');
                const table = section.querySelector('table');
                const title = section.querySelector('h4').innerText;

                if (y + 90 > pageHeight) { // Estimate space for chart and table
                    pdf.addPage();
                    y = margin;
                }
                
                pdf.text(title, margin, y);
                y += 5;

                const chartImg = chartCanvas.toDataURL('image/png');
                pdf.addImage(chartImg, 'PNG', margin, y, 80, 80);

                pdf.autoTable({
                    html: table,
                    startY: y,
                    startX: margin + 90,
                    theme: 'grid',
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [243, 244, 246] }
                });

                y = Math.max(y + 90, pdf.autoTable.previous.finalY + 10);
            }

            // --- Detailed Summary Table ---
            const summaryTable = document.getElementById('summary-table');
            if (summaryTable) {
                if (y + 20 > pageHeight) {
                    pdf.addPage();
                    y = margin;
                }
                pdf.text("Detailed Summary Table", margin, y);
                y += 5;
                pdf.autoTable({ html: summaryTable, startY: y, theme: 'grid' });
            }

            pdf.save(`${reportTitle.replace(/ /g, '_')}.pdf`);
        } catch (error) {
            console.error("Error exporting to PDF:", error);
            alert("An error occurred while exporting to PDF. Please check the console for details.");
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

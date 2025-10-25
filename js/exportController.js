// Export functionality for PDF and Excel
class ExportController {
    constructor() {
        this.bindExportButtons();
    }

    bindExportButtons() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-export="pdf"]')) {
                this.exportToPDF();
            } else if (e.target.matches('[data-export="excel"]')) {
                this.exportToExcel();
            }
        });
    }

    async exportToPDF() {
        const { jsPDF } = window.jspdf;
        if (!jsPDF.autoTable) {
            console.error("jsPDF-AutoTable is required. Please include it in your project.");
            alert("PDF export functionality is not fully configured. Please contact support.");
            return;
        }

        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const reportContent = document.getElementById('report-output');
        const reportTitle = reportContent.querySelector('h3').innerText;

        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 15;
        let y = margin;

        // --- Helper function to add elements and manage pages ---
        const addElement = async (element, isChart = false) => {
            if (!element || element.offsetParent === null) return; // Skip hidden or non-existent elements

            const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = isChart ? pageWidth - margin * 2 : (pageWidth - margin * 2) / 2;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            if (y + imgHeight + margin > pageHeight) {
                pdf.addPage();
                y = margin;
            }

            pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
            y += imgHeight + 10; // Add some space after the element
        };

        // --- Add Report Title ---
        pdf.setFontSize(18);
        pdf.text(reportTitle, margin, y);
        y += 10;

        // --- Add Summary Cards ---
        const summaryCards = reportContent.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
        if (summaryCards) {
            const canvas = await html2canvas(summaryCards, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - margin * 2;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
            y += imgHeight + 10;
        }

        // --- Add Charts ---
        await addElement(reportContent.querySelector('#sankeyChart_div'), true);
        await addElement(reportContent.querySelector('#trendChart').parentElement, true);

        // --- Add Doughnut Charts and Tables ---
        const breakdownSections = reportContent.querySelectorAll('.grid.grid-cols-1.lg\\:grid-cols-2');
        for (const section of breakdownSections) {
            const chartCanvas = section.querySelector('canvas');
            const table = section.querySelector('table');

            if (y + 80 > pageHeight) { // Estimate space for doughnut chart
                pdf.addPage();
                y = margin;
            }

            // Add chart
            const chartImg = chartCanvas.toDataURL('image/png');
            pdf.addImage(chartImg, 'PNG', margin, y, 80, 80);

            // Add table next to chart
            pdf.autoTable({
                html: table,
                startY: y,
                startX: margin + 90,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [243, 244, 246] } // gray-100
            });

            y = Math.max(y + 90, pdf.autoTable.previous.finalY + 10);
        }

        // --- Add Detailed Summary Table ---
        const summaryTable = document.getElementById('summary-table');
        if (summaryTable) {
            if (y + 20 > pageHeight) { // Check if there's space for the table header
                pdf.addPage();
                y = margin;
            }
            pdf.autoTable({ html: summaryTable, startY: y, theme: 'grid' });
        }

        // --- Save the PDF ---
        pdf.save(`${reportTitle.replace(/ /g, '_')}.pdf`);
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
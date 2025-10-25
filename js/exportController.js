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

    exportToPDF() {
        const { jsPDF } = window.jspdf;
        const reportContent = document.getElementById('report-output');
        const reportTitle = reportContent.querySelector('h3').innerText;

        const exportButtons = reportContent.querySelector('.flex.justify-between.items-center');
        if (exportButtons) exportButtons.style.display = 'none';

        html2canvas(reportContent, { scale: 2, useCORS: true }).then(canvas => {
            if (exportButtons) exportButtons.style.display = 'flex';

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;

            let imgWidth = pdfWidth - 20;
            let imgHeight = imgWidth / ratio;
            let heightLeft = imgHeight;
            let position = 10;

            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 20);

            while (heightLeft > 0) {
                position = -(imgHeight - heightLeft) + 10;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= (pdfHeight - 20);
            }

            pdf.save(`${reportTitle.replace(/ /g, '_')}.pdf`);
        }).catch(err => {
            console.error("Error exporting to PDF:", err);
            if (exportButtons) exportButtons.style.display = 'flex';
        });
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

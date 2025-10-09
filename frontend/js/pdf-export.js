// PDF Export Module using jsPDF
// This module generates professional PDF batch records with proper formatting

class PDFExporter {
    constructor() {
        this.jsPDF = null;
        this.autoTable = null;
        this.currentY = 0;
        this.pageWidth = 210; // A4 width in mm
        this.pageHeight = 297; // A4 height in mm
        this.margins = { top: 20, right: 15, bottom: 20, left: 15 };
    }

    /**
     * Load jsPDF library dynamically
     */
    async loadLibraries() {
        if (this.jsPDF) return;

        try {
            // Load jsPDF from CDN
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js');

            this.jsPDF = window.jspdf.jsPDF;
            this.autoTable = true;
        } catch (error) {
            console.error('Error loading PDF libraries:', error);
            throw new Error('No se pudieron cargar las librerías de PDF');
        }
    }

    /**
     * Load external script
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Generate PDF for a batch record
     * @param {Object} record - Batch record data
     * @param {Object} formulation - Formulation data
     * @param {Object} signatures - Digital signatures
     */
    async generateBatchRecordPDF(record, formulation, signatures = {}) {
        try {
            await this.loadLibraries();

            // Create new PDF document
            const doc = new this.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            this.currentY = this.margins.top;

            // Add header
            this.addHeader(doc, record);

            // Add basic information
            this.addBasicInfo(doc, record);

            // Add formulation table
            if (formulation && formulation.length > 0) {
                this.addFormulationTable(doc, formulation);
            }

            // Add signatures
            if (signatures) {
                await this.addSignatures(doc, signatures);
            }

            // Add footer to all pages
            this.addFooters(doc);

            // Save PDF
            const filename = `Batch_Record_${record.batch_number || 'DRAFT'}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);

            return { success: true, filename };
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    }

    /**
     * Add professional header to PDF
     */
    addHeader(doc, record) {
        // Background rectangle for header
        doc.setFillColor(44, 62, 80); // #2c3e50
        doc.rect(0, 0, this.pageWidth, 35, 'F');

        // Company name/logo area
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('BATCH RECORD', this.pageWidth / 2, 15, { align: 'center' });

        // Subtitle
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('CONTROL DE PRODUCCIÓN', this.pageWidth / 2, 23, { align: 'center' });

        // Document info
        doc.setFontSize(9);
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, this.pageWidth / 2, 30, { align: 'center' });

        // Reset text color
        doc.setTextColor(0, 0, 0);
        this.currentY = 40;
    }

    /**
     * Add basic information section
     */
    addBasicInfo(doc, record) {
        // Section title
        doc.setFillColor(74, 144, 226); // #4a90e2
        doc.rect(this.margins.left, this.currentY, this.pageWidth - this.margins.left - this.margins.right, 10, 'F');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('INFORMACIÓN BÁSICA', this.pageWidth / 2, this.currentY + 7, { align: 'center' });

        doc.setTextColor(0, 0, 0);
        this.currentY += 15;

        // Create table with basic info
        const basicData = [
            ['NÚMERO DE LOTE:', record.batch_number || '-'],
            ['PRODUCTO:', record.product_name || '-'],
            ['CANTIDAD A PRODUCIR:', `${record.quantity || 0} KG`],
            ['FECHA DE PRODUCCIÓN:', record.production_date ? new Date(record.production_date).toLocaleDateString() : '-'],
            ['OPERADOR:', record.operator_name || '-'],
            ['VERIFICADOR:', record.verificador_name || '-'],
            ['ESTADO:', this.getStatusText(record.status)]
        ];

        doc.autoTable({
            startY: this.currentY,
            head: [],
            body: basicData,
            theme: 'grid',
            styles: {
                fontSize: 10,
                cellPadding: 4
            },
            columnStyles: {
                0: { fontStyle: 'bold', fillColor: [232, 232, 232], cellWidth: 60 },
                1: { fillColor: [255, 255, 153] } // Light yellow
            },
            margin: { left: this.margins.left, right: this.margins.right }
        });

        this.currentY = doc.lastAutoTable.finalY + 10;
    }

    /**
     * Add formulation table
     */
    addFormulationTable(doc, formulation) {
        // Check if we need a new page
        if (this.currentY > 200) {
            doc.addPage();
            this.currentY = this.margins.top;
        }

        // Section title
        doc.setFillColor(74, 144, 226);
        doc.rect(this.margins.left, this.currentY, this.pageWidth - this.margins.left - this.margins.right, 10, 'F');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('FORMULACIÓN DE MATERIAS PRIMAS', this.pageWidth / 2, this.currentY + 7, { align: 'center' });

        doc.setTextColor(0, 0, 0);
        this.currentY += 15;

        // Prepare table data
        const tableData = formulation.map((item, index) => [
            (index + 1).toString(),
            item.rm_name || item.material_name || '-',
            `${item.percentage || 0}%`,
            `${item.theoretical_quantity || 0} ${item.rm_unit || 'KG'}`,
            `${item.actual_quantity || ''} ${item.rm_unit || 'KG'}`,
            item.lot_number || '-',
            item.dispensed_by || '-'
        ]);

        // Calculate totals
        const totalPercentage = formulation.reduce((sum, item) => sum + (parseFloat(item.percentage) || 0), 0);
        const totalTheoretical = formulation.reduce((sum, item) => sum + (parseFloat(item.theoretical_quantity) || 0), 0);
        const totalActual = formulation.reduce((sum, item) => sum + (parseFloat(item.actual_quantity) || 0), 0);

        // Add totals row
        tableData.push([
            '',
            'TOTAL',
            `${totalPercentage.toFixed(2)}%`,
            `${totalTheoretical.toFixed(3)} KG`,
            `${totalActual.toFixed(3)} KG`,
            '',
            ''
        ]);

        doc.autoTable({
            startY: this.currentY,
            head: [['#', 'MATERIA PRIMA', '%', 'CANT. TEÓRICA', 'CANT. REAL', 'LOTE MP', 'DISPENSADO POR']],
            body: tableData,
            theme: 'grid',
            styles: {
                fontSize: 8,
                cellPadding: 3
            },
            headStyles: {
                fillColor: [208, 208, 208],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                1: { cellWidth: 45 },
                2: { cellWidth: 15, halign: 'center' },
                3: { cellWidth: 25, halign: 'center', fillColor: [230, 243, 255] },
                4: { cellWidth: 25, halign: 'center' },
                5: { cellWidth: 25, halign: 'center' },
                6: { cellWidth: 35 }
            },
            didParseCell: (data) => {
                // Style the totals row
                if (data.row.index === tableData.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [240, 240, 240];
                }
            },
            margin: { left: this.margins.left, right: this.margins.right }
        });

        this.currentY = doc.lastAutoTable.finalY + 10;
    }

    /**
     * Add signatures section
     */
    async addSignatures(doc, signatures) {
        // Check if we need a new page
        if (this.currentY > 220) {
            doc.addPage();
            this.currentY = this.margins.top;
        }

        // Section title
        doc.setFillColor(74, 144, 226);
        doc.rect(this.margins.left, this.currentY, this.pageWidth - this.margins.left - this.margins.right, 10, 'F');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('FIRMAS Y APROBACIONES', this.pageWidth / 2, this.currentY + 7, { align: 'center' });

        doc.setTextColor(0, 0, 0);
        this.currentY += 15;

        const signatureRoles = [
            { key: 'operator', label: 'OPERADOR' },
            { key: 'verificador', label: 'VERIFICADOR' },
            { key: 'director', label: 'DIRECTOR TÉCNICO' }
        ];

        const boxWidth = 55;
        const boxHeight = 35;
        const spacing = 5;
        let xPos = this.margins.left;

        for (const role of signatureRoles) {
            // Draw signature box
            doc.setDrawColor(0);
            doc.setLineWidth(0.5);
            doc.rect(xPos, this.currentY, boxWidth, boxHeight);

            // Add label
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(role.label, xPos + boxWidth / 2, this.currentY - 2, { align: 'center' });

            // Add signature image if available
            if (signatures[role.key] && signatures[role.key].data) {
                try {
                    const signData = signatures[role.key].data;
                    doc.addImage(signData, 'PNG', xPos + 5, this.currentY + 2, boxWidth - 10, boxHeight - 15);

                    // Add timestamp
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'normal');
                    const timestamp = new Date(signatures[role.key].timestamp).toLocaleString();
                    doc.text(`${timestamp}`, xPos + boxWidth / 2, this.currentY + boxHeight - 2, { align: 'center' });
                } catch (error) {
                    console.error(`Error adding signature for ${role.key}:`, error);
                }
            } else {
                // Add placeholder text
                doc.setFontSize(8);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(150, 150, 150);
                doc.text('Sin firma', xPos + boxWidth / 2, this.currentY + boxHeight / 2, { align: 'center' });
                doc.setTextColor(0, 0, 0);
            }

            xPos += boxWidth + spacing;
        }

        this.currentY += boxHeight + 15;
    }

    /**
     * Add footer to all pages
     */
    addFooters(doc) {
        const pageCount = doc.internal.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            // Footer line
            doc.setDrawColor(200);
            doc.setLineWidth(0.5);
            doc.line(this.margins.left, this.pageHeight - 15, this.pageWidth - this.margins.right, this.pageHeight - 15);

            // Footer text
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.setFont('helvetica', 'normal');

            // Left side - document info
            doc.text('Batch Records System', this.margins.left, this.pageHeight - 10);

            // Center - generation date
            doc.text(`Generado: ${new Date().toLocaleString()}`, this.pageWidth / 2, this.pageHeight - 10, { align: 'center' });

            // Right side - page number
            doc.text(`Página ${i} de ${pageCount}`, this.pageWidth - this.margins.right, this.pageHeight - 10, { align: 'right' });
        }
    }

    /**
     * Get status text in Spanish
     */
    getStatusText(status) {
        const statusMap = {
            draft: 'Borrador',
            signed: 'Firmado',
            verified: 'Verificado',
            approved: 'Aprobado',
            rejected: 'Rechazado'
        };
        return statusMap[status] || status;
    }

    /**
     * Export multiple records to a single PDF
     */
    async generateMultipleRecordsPDF(records) {
        try {
            await this.loadLibraries();

            const doc = new this.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            for (let i = 0; i < records.length; i++) {
                if (i > 0) {
                    doc.addPage();
                }

                this.currentY = this.margins.top;
                this.addHeader(doc, records[i]);
                this.addBasicInfo(doc, records[i]);
            }

            this.addFooters(doc);

            const filename = `Batch_Records_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);

            return { success: true, filename };
        } catch (error) {
            console.error('Error generating multiple records PDF:', error);
            throw error;
        }
    }
}

// Global instance
let pdfExporter;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    pdfExporter = new PDFExporter();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PDFExporter, pdfExporter };
}

// pdf.js - Handles PDF generation for individual receipts and daily reports

class PDFGenerator {
    constructor() {
        this.jsPDF = window.jspdf.jsPDF;
        this.margins = {
            top: 20,
            left: 20,
            right: 20,
            bottom: 20
        };
        this.pageWidth = 210; // A4 width in mm
        this.pageHeight = 297; // A4 height in mm
    }

    generateIndividualPDF(patientData) {
        try {
            const doc = new this.jsPDF();
            let yPosition = this.margins.top;

            // Header
            yPosition = this.addHeader(doc, yPosition, 'Comprobante de Servicio');
            
            // Sucursal y Fecha
            yPosition = this.addSucursalAndDate(doc, yPosition, patientData.sucursal);
            
            yPosition += 10; // Space

            // Cliente Information
            yPosition = this.addClientInfo(doc, yPosition, patientData);
            
            yPosition += 10; // Space

            // Economic Details
            yPosition = this.addEconomicDetails(doc, yPosition, patientData);
            
            yPosition += 10; // Space

            // Payment Method Details
            yPosition = this.addPaymentDetails(doc, yPosition, patientData.pago);
            
            yPosition += 10; // Space

            // Observations (if any)
            if (patientData.observaciones && patientData.observaciones.trim()) {
                yPosition = this.addObservations(doc, yPosition, patientData.observaciones);
                yPosition += 10;
            }

            // Signature line and legal text
            yPosition = this.addSignatureSection(doc, yPosition);

            // Optional coupon
            yPosition = this.addCoupon(doc, yPosition);

            // Save PDF
            const fileName = `Comprobante_${patientData.cliente.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('es-MX').replace(/\//g, '-')}.pdf`;
            doc.save(fileName);

            return { success: true, fileName };
        } catch (error) {
            console.error('Error generating individual PDF:', error);
            return { success: false, error: error.message };
        }
    }

    generateGlobalPDF(patientsList, stats) {
        try {
            const doc = new this.jsPDF();
            let yPosition = this.margins.top;

            // Header
            yPosition = this.addHeader(doc, yPosition, 'Nota de Remisión – Registro Diario');
            
            // Sucursal y Fecha
            const sucursal = patientsList.length > 0 ? patientsList[0].sucursal : 'Todas las sucursales';
            yPosition = this.addSucursalAndDate(doc, yPosition, sucursal);
            
            yPosition += 10; // Space

            // Patients table
            yPosition = this.addPatientsTable(doc, yPosition, patientsList);

            // Totals section
            yPosition = this.addDailyTotals(doc, yPosition, stats);

            // Payment method breakdown
            yPosition = this.addPaymentBreakdown(doc, yPosition, stats);

            // Signature and comments section
            yPosition = this.addDailySignatureSection(doc, yPosition);

            // Save PDF
            const fileName = `Cierre_Diario_${new Date().toLocaleDateString('es-MX').replace(/\//g, '-')}.pdf`;
            doc.save(fileName);

            return { success: true, fileName };
        } catch (error) {
            console.error('Error generating global PDF:', error);
            return { success: false, error: error.message };
        }
    }

    addHeader(doc, yPosition, title) {
        // Clinic name
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('RENOVÉ CLÍNICA & SPA', this.pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 8;
        
        // Document title
        doc.setFontSize(14);
        doc.setFont(undefined, 'normal');
        doc.text(title, this.pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 15;
        
        return yPosition;
    }

    addSucursalAndDate(doc, yPosition, sucursal) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        
        const today = new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        doc.text(`Sucursal: ${sucursal}`, this.margins.left, yPosition);
        doc.text(`Fecha: ${today}`, this.pageWidth - this.margins.right, yPosition, { align: 'right' });
        
        return yPosition + 8;
    }

    addClientInfo(doc, yPosition, patientData) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('INFORMACIÓN DEL CLIENTE', this.margins.left, yPosition);
        
        yPosition += 8;
        
        doc.setFont(undefined, 'normal');
        doc.text(`Cliente: ${patientData.cliente}`, this.margins.left, yPosition);
        yPosition += 6;
        doc.text(`Teléfono: ${patientData.telefono}`, this.margins.left, yPosition);
        yPosition += 6;
        doc.text(`Tratamiento: ${patientData.tratamiento}`, this.margins.left, yPosition);
        
        return yPosition + 8;
    }

    addEconomicDetails(doc, yPosition, patientData) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('DETALLE ECONÓMICO', this.margins.left, yPosition);
        
        yPosition += 8;
        
        doc.setFont(undefined, 'normal');
        
        const costoRegular = parseFloat(patientData.costo_regular || 0);
        const promocion = parseFloat(patientData.promocion || 0);
        const totalPagado = parseFloat(patientData.pago.pago_realizado || 0);
        
        doc.text(`Precio Regular: ${this.formatCurrency(costoRegular)}`, this.margins.left, yPosition);
        yPosition += 6;
        doc.text(`Precio con Promoción: ${this.formatCurrency(promocion)}`, this.margins.left, yPosition);
        yPosition += 8;
        
        doc.setFont(undefined, 'bold');
        doc.text(`TOTAL PAGADO: ${this.formatCurrency(totalPagado)}`, this.margins.left, yPosition);
        
        return yPosition + 8;
    }

    addPaymentDetails(doc, yPosition, pagoData) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('MÉTODO DE PAGO', this.margins.left, yPosition);
        
        yPosition += 8;
        
        doc.setFont(undefined, 'normal');
        
        if (pagoData.metodo === 'mixto') {
            const efectivo = parseFloat(pagoData.detalle.efectivo || 0);
            const tarjeta = parseFloat(pagoData.detalle.tarjeta || 0);
            
            doc.text('Pago Mixto:', this.margins.left, yPosition);
            yPosition += 6;
            doc.text(`  • Efectivo: ${this.formatCurrency(efectivo)}`, this.margins.left, yPosition);
            yPosition += 6;
            doc.text(`  • Tarjeta: ${this.formatCurrency(tarjeta)}`, this.margins.left, yPosition);
        } else {
            const metodoCap = pagoData.metodo.charAt(0).toUpperCase() + pagoData.metodo.slice(1);
            doc.text(`${metodoCap}: ${this.formatCurrency(pagoData.pago_realizado)}`, this.margins.left, yPosition);
        }
        
        return yPosition + 8;
    }

    addObservations(doc, yPosition, observaciones) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('OBSERVACIONES', this.margins.left, yPosition);
        
        yPosition += 8;
        
        doc.setFont(undefined, 'normal');
        
        // Split long text into multiple lines
        const lines = doc.splitTextToSize(observaciones, this.pageWidth - this.margins.left - this.margins.right);
        lines.forEach(line => {
            doc.text(line, this.margins.left, yPosition);
            yPosition += 6;
        });
        
        return yPosition;
    }

    addSignatureSection(doc, yPosition) {
        // Add some space before signature
        yPosition += 20;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        // Signature line
        const signatureLineY = yPosition;
        doc.line(this.margins.left, signatureLineY, this.pageWidth - this.margins.right, signatureLineY);
        
        yPosition += 8;
        doc.text('Firma del Cliente', this.pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 15;
        
        // Legal text
        doc.setFontSize(9);
        const legalText = 'Al firmar, confirmo que leí y resolví mis dudas. Acepto los riesgos y beneficios del tratamiento.';
        const legalLines = doc.splitTextToSize(legalText, this.pageWidth - this.margins.left - this.margins.right);
        
        legalLines.forEach(line => {
            doc.text(line, this.pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 5;
        });
        
        return yPosition + 10;
    }

    addCoupon(doc, yPosition) {
        // Check if there's space for coupon
        if (yPosition > this.pageHeight - 60) return yPosition;
        
        yPosition += 10;
        
        // Coupon border
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.rect(this.margins.left, yPosition, this.pageWidth - this.margins.left - this.margins.right, 30);
        
        yPosition += 8;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('CUPÓN DE DESCUENTO', this.pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 8;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Facial Rejuveness $1,500 (antes $3,500)', this.pageWidth / 2, yPosition, { align: 'center' });
        
        yPosition += 6;
        doc.text('Válido únicamente en su próxima cita', this.pageWidth / 2, yPosition, { align: 'center' });
        
        return yPosition + 15;
    }

    addPatientsTable(doc, yPosition, patientsList) {
        if (patientsList.length === 0) {
            doc.setFontSize(12);
            doc.text('No hay pacientes registrados para el día de hoy.', this.margins.left, yPosition);
            return yPosition + 20;
        }

        // Table headers
        const headers = [
            'Cliente',
            'Teléfono',
            'Tratamiento',
            'Regular',
            'Promoción',
            'Pagado',
            'Método',
            'Observaciones'
        ];

        // Table data
        const data = patientsList.map(patient => [
            patient.cliente,
            patient.telefono,
            patient.tratamiento,
            this.formatCurrency(patient.costo_regular),
            this.formatCurrency(patient.promocion),
            this.formatCurrency(patient.pago.pago_realizado),
            this.formatPaymentMethod(patient.pago),
            patient.observaciones || ''
        ]);

        // Use autoTable plugin
        doc.autoTable({
            head: [headers],
            body: data,
            startY: yPosition,
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            headStyles: {
                fillColor: [66, 139, 202],
                textColor: 255,
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 25 }, // Cliente
                1: { cellWidth: 20 }, // Teléfono
                2: { cellWidth: 30 }, // Tratamiento
                3: { cellWidth: 18 }, // Regular
                4: { cellWidth: 18 }, // Promoción
                5: { cellWidth: 18 }, // Pagado
                6: { cellWidth: 25 }, // Método
                7: { cellWidth: 35 }  // Observaciones
            },
            margin: { left: this.margins.left, right: this.margins.right }
        });

        return doc.lastAutoTable.finalY + 10;
    }

    addDailyTotals(doc, yPosition, stats) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('TOTALES DEL DÍA', this.margins.left, yPosition);
        
        yPosition += 10;
        
        doc.setFont(undefined, 'normal');
        
        doc.text(`Total Pacientes del Día: ${stats.totalPacientes}`, this.margins.left, yPosition);
        yPosition += 6;
        doc.text(`Total Promociones Aplicadas: ${this.formatCurrency(stats.totalPromociones)}`, this.margins.left, yPosition);
        yPosition += 6;
        doc.text(`Total Pagado Hoy: ${this.formatCurrency(stats.totalPagado)}`, this.margins.left, yPosition);
        
        return yPosition + 10;
    }

    addPaymentBreakdown(doc, yPosition, stats) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('TOTALES POR MÉTODO DE PAGO', this.margins.left, yPosition);
        
        yPosition += 10;
        
        doc.setFont(undefined, 'normal');
        
        doc.text(`Total en Efectivo: ${this.formatCurrency(stats.totalEfectivo)}`, this.margins.left, yPosition);
        yPosition += 6;
        doc.text(`Total en Tarjeta: ${this.formatCurrency(stats.totalTarjeta)}`, this.margins.left, yPosition);
        yPosition += 6;
        doc.text(`Total Mixto: ${this.formatCurrency(stats.totalMixto)}`, this.margins.left, yPosition);
        
        if (stats.totalMixto > 0) {
            yPosition += 6;
            doc.text(`  • Efectivo (mixto): ${this.formatCurrency(stats.desgloseMixto.efectivo)}`, this.margins.left, yPosition);
            yPosition += 6;
            doc.text(`  • Tarjeta (mixto): ${this.formatCurrency(stats.desgloseMixto.tarjeta)}`, this.margins.left, yPosition);
        }
        
        return yPosition + 15;
    }

    addDailySignatureSection(doc, yPosition) {
        // Check if we need a new page
        if (yPosition > this.pageHeight - 80) {
            doc.addPage();
            yPosition = this.margins.top;
        }
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('FIRMAS Y COMENTARIOS', this.margins.left, yPosition);
        
        yPosition += 15;
        
        doc.setFont(undefined, 'normal');
        
        // Signature lines
        const signatureY = yPosition;
        doc.line(this.margins.left, signatureY, 80, signatureY);
        doc.line(110, signatureY, this.pageWidth - this.margins.right, signatureY);
        
        yPosition += 8;
        doc.text('Responsable de Caja', this.margins.left + 15, yPosition);
        doc.text('Médico', 125, yPosition);
        
        yPosition += 20;
        
        // Comments section
        doc.text('Comentarios o Incidencias:', this.margins.left, yPosition);
        yPosition += 10;
        
        // Comment lines
        for (let i = 0; i < 4; i++) {
            doc.line(this.margins.left, yPosition, this.pageWidth - this.margins.right, yPosition);
            yPosition += 8;
        }
        
        return yPosition;
    }

    formatPaymentMethod(pagoData) {
        if (pagoData.metodo === 'mixto') {
            const efectivo = this.formatCurrency(pagoData.detalle.efectivo);
            const tarjeta = this.formatCurrency(pagoData.detalle.tarjeta);
            return `Mixto: ${efectivo} + ${tarjeta}`;
        }
        
        return pagoData.metodo.charAt(0).toUpperCase() + pagoData.metodo.slice(1);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount || 0);
    }

    // Print functionality for browser printing
    printIndividualReceipt(patientData) {
        try {
            const printContent = this.generateIndividualPrintHTML(patientData);
            const printArea = document.getElementById('print-individual');
            
            if (printArea) {
                printArea.innerHTML = printContent;
                printArea.classList.remove('hidden');
                
                // Trigger print
                window.print();
                
                // Hide print area after printing
                setTimeout(() => {
                    printArea.classList.add('hidden');
                }, 1000);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error printing individual receipt:', error);
            return { success: false, error: error.message };
        }
    }

    printDailyReport(patientsList, stats) {
        try {
            const printContent = this.generateDailyReportHTML(patientsList, stats);
            const printArea = document.getElementById('print-global');
            
            if (printArea) {
                printArea.innerHTML = printContent;
                printArea.classList.remove('hidden');
                
                // Trigger print
                window.print();
                
                // Hide print area after printing
                setTimeout(() => {
                    printArea.classList.add('hidden');
                }, 1000);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error printing daily report:', error);
            return { success: false, error: error.message };
        }
    }

    generateIndividualPrintHTML(patientData) {
        const today = new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="print-header">
                <h1 style="text-align: center; margin-bottom: 10px;">RENOVÉ CLÍNICA & SPA</h1>
                <h2 style="text-align: center; margin-bottom: 20px;">Comprobante de Servicio</h2>
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <span>Sucursal: ${patientData.sucursal}</span>
                    <span>Fecha: ${today}</span>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>INFORMACIÓN DEL CLIENTE</h3>
                <p>Cliente: ${patientData.cliente}</p>
                <p>Teléfono: ${patientData.telefono}</p>
                <p>Tratamiento: ${patientData.tratamiento}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>DETALLE ECONÓMICO</h3>
                <p>Precio Regular: ${this.formatCurrency(patientData.costo_regular)}</p>
                <p>Precio con Promoción: ${this.formatCurrency(patientData.promocion)}</p>
                <p><strong>TOTAL PAGADO: ${this.formatCurrency(patientData.pago.pago_realizado)}</strong></p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>MÉTODO DE PAGO</h3>
                ${this.generatePaymentHTML(patientData.pago)}
            </div>
            
            ${patientData.observaciones ? `
                <div style="margin-bottom: 20px;">
                    <h3>OBSERVACIONES</h3>
                    <p>${patientData.observaciones}</p>
                </div>
            ` : ''}
            
            <div style="margin-top: 40px; text-align: center;">
                <div style="border-top: 1px solid black; width: 200px; margin: 0 auto 10px;"></div>
                <p>Firma del Cliente</p>
                <p style="font-size: 12px; margin-top: 20px;">
                    Al firmar, confirmo que leí y resolví mis dudas. Acepto los riesgos y beneficios del tratamiento.
                </p>
            </div>
        `;
    }

    generateDailyReportHTML(patientsList, stats) {
        const today = new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const sucursal = patientsList.length > 0 ? patientsList[0].sucursal : 'Todas las sucursales';

        return `
            <div class="print-header">
                <h1 style="text-align: center; margin-bottom: 10px;">RENOVÉ CLÍNICA & SPA</h1>
                <h2 style="text-align: center; margin-bottom: 20px;">Nota de Remisión – Registro Diario</h2>
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <span>Sucursal: ${sucursal}</span>
                    <span>Fecha: ${today}</span>
                </div>
            </div>
            
            ${this.generatePatientsTableHTML(patientsList)}
            
            <div style="margin-top: 30px;">
                <h3>TOTALES DEL DÍA</h3>
                <p>Total Pacientes del Día: ${stats.totalPacientes}</p>
                <p>Total Promociones Aplicadas: ${this.formatCurrency(stats.totalPromociones)}</p>
                <p>Total Pagado Hoy: ${this.formatCurrency(stats.totalPagado)}</p>
            </div>
            
            <div style="margin-top: 20px;">
                <h3>TOTALES POR MÉTODO DE PAGO</h3>
                <p>Total en Efectivo: ${this.formatCurrency(stats.totalEfectivo)}</p>
                <p>Total en Tarjeta: ${this.formatCurrency(stats.totalTarjeta)}</p>
                <p>Total Mixto: ${this.formatCurrency(stats.totalMixto)}</p>
                ${stats.totalMixto > 0 ? `
                    <p style="margin-left: 20px;">• Efectivo (mixto): ${this.formatCurrency(stats.desgloseMixto.efectivo)}</p>
                    <p style="margin-left: 20px;">• Tarjeta (mixto): ${this.formatCurrency(stats.desgloseMixto.tarjeta)}</p>
                ` : ''}
            </div>
            
            <div style="margin-top: 40px;">
                <h3>FIRMAS Y COMENTARIOS</h3>
                <div style="display: flex; justify-content: space-between; margin-top: 30px;">
                    <div style="text-align: center;">
                        <div style="border-top: 1px solid black; width: 150px; margin-bottom: 10px;"></div>
                        <span>Responsable de Caja</span>
                    </div>
                    <div style="text-align: center;">
                        <div style="border-top: 1px solid black; width: 150px; margin-bottom: 10px;"></div>
                        <span>Médico</span>
                    </div>
                </div>
                
                <div style="margin-top: 30px;">
                    <p>Comentarios o Incidencias:</p>
                    <div style="border-top: 1px solid black; margin: 10px 0;"></div>
                    <div style="border-top: 1px solid black; margin: 10px 0;"></div>
                    <div style="border-top: 1px solid black; margin: 10px 0;"></div>
                    <div style="border-top: 1px solid black; margin: 10px 0;"></div>
                </div>
            </div>
        `;
    }

    generatePaymentHTML(pagoData) {
        if (pagoData.metodo === 'mixto') {
            return `
                <p>Pago Mixto:</p>
                <p style="margin-left: 20px;">• Efectivo: ${this.formatCurrency(pagoData.detalle.efectivo)}</p>
                <p style="margin-left: 20px;">• Tarjeta: ${this.formatCurrency(pagoData.detalle.tarjeta)}</p>
            `;
        }
        
        const metodoCap = pagoData.metodo.charAt(0).toUpperCase() + pagoData.metodo.slice(1);
        return `<p>${metodoCap}: ${this.formatCurrency(pagoData.pago_realizado)}</p>`;
    }

    generatePatientsTableHTML(patientsList) {
        if (patientsList.length === 0) {
            return '<p>No hay pacientes registrados para el día de hoy.</p>';
        }

        let tableHTML = `
            <table class="print-table" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #f0f0f0;">
                        <th style="border: 1px solid black; padding: 8px;">Cliente</th>
                        <th style="border: 1px solid black; padding: 8px;">Teléfono</th>
                        <th style="border: 1px solid black; padding: 8px;">Tratamiento</th>
                        <th style="border: 1px solid black; padding: 8px;">Regular</th>
                        <th style="border: 1px solid black; padding: 8px;">Promoción</th>
                        <th style="border: 1px solid black; padding: 8px;">Pagado</th>
                        <th style="border: 1px solid black; padding: 8px;">Método</th>
                        <th style="border: 1px solid black; padding: 8px;">Observaciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        patientsList.forEach(patient => {
            tableHTML += `
                <tr>
                    <td style="border: 1px solid black; padding: 4px;">${patient.cliente}</td>
                    <td style="border: 1px solid black; padding: 4px;">${patient.telefono}</td>
                    <td style="border: 1px solid black; padding: 4px;">${patient.tratamiento}</td>
                    <td style="border: 1px solid black; padding: 4px;">${this.formatCurrency(patient.costo_regular)}</td>
                    <td style="border: 1px solid black; padding: 4px;">${this.formatCurrency(patient.promocion)}</td>
                    <td style="border: 1px solid black; padding: 4px;">${this.formatCurrency(patient.pago.pago_realizado)}</td>
                    <td style="border: 1px solid black; padding: 4px;">${this.formatPaymentMethod(patient.pago)}</td>
                    <td style="border: 1px solid black; padding: 4px;">${patient.observaciones || ''}</td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        return tableHTML;
    }
}

// Create global instance
const pdfGenerator = new PDFGenerator();

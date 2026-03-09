import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

import autoTable from 'jspdf-autotable';

type JsPDFWithAutoTable = any;

export type DocumentType = 'MFP' | 'GENERAL' | 'FISCAL';

export interface ReportData {
    companyName: string;
    clientName: string;
    opportunityName?: string;
    rnc?: string;
    items: Array<any>;
    subtotal: number;
    tax: number;
    total: number;
    date: string;
    ncf?: string;
    paymentMethods?: string[];
    termsAndConditions?: string;
    mfpConfig?: {
        rentalPeriodMonths: number;
        businessType: string;
        annualInterestRate: number;
    };
    mfpTotals?: {
        equipmentTotal: number;
        totalBnService: number;
        totalColorService: number;
        totalService: number;
        monthlyHardware: number;
        monthlyTotal: number;
        totalContract: number;
    };
}

export interface TenantConfig {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
    templateStyle?: 'classic' | 'modern' | 'minimal' | 'bold';
}

export const generatePDF = (
    type: DocumentType,
    data: ReportData,
    config: TenantConfig,
    isPreview?: boolean
) => {
    // Validate MFP
    if (type === 'MFP') {
        const invalidItems = data.items.filter(i =>
            !i.bwCostPerCopy && !i.colorCostPerCopy && !i.bwVolume
        );
        if (invalidItems.length > 0) {
            throw new Error('Validación Fallida: Los equipos MFP requieren costo por copia (B/N o Color) y Volúmenes calculados.');
        }
    }

    // Init Doc
    const orientation = type === 'MFP' ? 'landscape' : 'portrait';
    const doc = new jsPDF({ orientation }) as JsPDFWithAutoTable;
    const primaryHex = config.primaryColor || '#0891b2'; // default: cyan-600

    // Fonts & styles mapping
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Draw Header Line
    doc.setFillColor(primaryHex);
    doc.rect(0, 0, pageWidth, 15, 'F');

    // Title
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);

    let docTitle = 'Cotización';
    if (type === 'MFP') docTitle = 'Propuesta de Equipos MFP';
    if (type === 'FISCAL') docTitle = 'Factura con Valor Fiscal';

    doc.text(docTitle, 14, 30);

    // Tenant / Client Info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`De: ${data.companyName}`, 14, 40);
    doc.text(`Para: ${data.clientName}`, 14, 46);
    if (data.opportunityName) {
        doc.text(`Proyecto: ${data.opportunityName}`, 14, 52);
    }

    if (type === 'FISCAL' && data.rnc) {
        doc.text(`RNC: ${data.rnc}`, 14, data.opportunityName ? 58 : 52);
        if (data.ncf) doc.text(`NCF: ${data.ncf}`, 14, data.opportunityName ? 64 : 58);
    }

    doc.text(`Fecha: ${data.date}`, pageWidth - 14, 40, { align: 'right' });

    // Draw Line
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 65, pageWidth - 14, 65);

    let startY = 75;
    let finalY = startY;

    // Table Config
    if (type === 'MFP') {
        const fmt = (num: any) => num ? `$${Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
        const raw = (num: any) => num ? Number(num).toLocaleString('en-US') : '-';

        autoTable(doc, {
            startY,
            head: [['Código', 'Descripción Item', 'Nivel de Precio', 'Precio Equipo', 'CxC B/N', 'Volumen B/N', 'CxC Color', 'Volumen Color', 'Servicio B/N', 'Servicio Color', 'Mensualidad Hardware', 'Mensualidad Negocio']],
            body: data.items.map(i => [
                i.code || 'N/A',
                i.description,
                i.priceLevel || 'Normal',
                fmt(i.equipmentPrice),
                raw(i.bwCostPerCopy),
                raw(i.bwVolume),
                raw(i.colorCostPerCopy),
                raw(i.colorVolume),
                fmt(i.monthlyBnService),
                fmt(i.monthlyColorService),
                fmt(i.monthlyHardware),
                fmt(i.monthlyBusiness)
            ]),
            foot: [[
                '', '', 'Total Equipos:',
                data.mfpTotals ? fmt(data.mfpTotals.equipmentTotal) : '',
                '', '', '', 'Totales:',
                data.mfpTotals ? fmt(data.mfpTotals.totalBnService) : '',
                data.mfpTotals ? fmt(data.mfpTotals.totalColorService) : '',
                data.mfpTotals ? fmt(data.mfpTotals.monthlyHardware) : '',
                data.mfpTotals ? fmt(data.mfpTotals.monthlyTotal) : ''
            ]],
            headStyles: { fillColor: primaryHex, fontSize: 8, halign: 'center', cellPadding: 2 },
            bodyStyles: { fontSize: 7, halign: 'center', cellPadding: 2 },
            footStyles: { fillColor: '#f1f5f9', textColor: '#0f172a', fontSize: 8, fontStyle: 'bold', halign: 'center' },
            alternateRowStyles: { fillColor: '#f8fafc' },
            columnStyles: {
                1: { halign: 'left' }
            }
        });

        finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : startY + 50;

        doc.setFont('', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30);
        doc.text('Resumen de la Cotización', 14, finalY);

        finalY += 5;

        const metrics = [
            { label: 'Valor Total Equipos', value: data.mfpTotals ? fmt(data.mfpTotals.equipmentTotal) : '-', color: '#ffffff' },
            { label: 'Total Servicio B/N', value: data.mfpTotals ? fmt(data.mfpTotals.totalBnService) : '-', color: '#ffffff' },
            { label: 'Total Servicio Color', value: data.mfpTotals ? fmt(data.mfpTotals.totalColorService) : '-', color: '#ffffff' },
            { label: 'Mensualidad Hardware', value: (data.mfpConfig?.businessType === 'RENTA' && data.mfpTotals) ? fmt(data.mfpTotals.monthlyHardware) : '-', color: '#f5f3ff' },
            { label: 'Pago Mensual Total', value: data.mfpTotals ? fmt(data.mfpTotals.monthlyTotal) : '-', color: '#ecfeff' },
            { label: 'Total del Contrato', value: data.mfpTotals ? fmt(data.mfpTotals.totalContract) : '-', color: primaryHex, textColor: '#ffffff' }
        ];

        let currentX = 14;
        const boxWidth = 43;
        const boxHeight = 18;

        metrics.forEach((m) => {
            // Box background and border
            doc.setFillColor(m.color);
            doc.setDrawColor(220, 226, 235);
            doc.rect(currentX, finalY, boxWidth, boxHeight, 'FD');

            // Label
            if (m.textColor) {
                doc.setTextColor(m.textColor);
            } else {
                doc.setTextColor(100, 116, 139); // slate-500
            }
            doc.setFontSize(7);
            doc.setFont('', 'normal');
            doc.text(m.label, currentX + 3, finalY + 6);

            // Value
            if (m.textColor) {
                doc.setTextColor(m.textColor);
            } else {
                doc.setTextColor(15, 23, 42); // slate-900
            }
            doc.setFontSize(9);
            doc.setFont('', 'bold');
            doc.text(m.value, currentX + 3, finalY + 14);

            currentX += boxWidth + 4; // Add gap
        });

        // Signatures at the bottom
        finalY += boxHeight + 35;
        doc.setFontSize(8);
        doc.setFont('', 'bold');
        doc.setTextColor(30);

        doc.text('Aceptado por el Cliente:', 14, finalY);
        doc.line(49, finalY, 100, finalY);

        doc.text('Ejecutivo de negocios:', 115, finalY);
        doc.line(148, finalY, 195, finalY);

        doc.text('Gerente de Ventas:', 210, finalY);
        doc.line(238, finalY, 280, finalY);

    } else {
        // General or Fiscal
        const docStyle = config.templateStyle || 'modern';

        if (docStyle === 'classic') {
            // CLÁSICO: Tabla tradicional y conservadora con colores suaves
            autoTable(doc, {
                startY,
                head: [['Cant.', 'Código / Descripción', 'Precio U.', 'Monto']],
                body: data.items.map(i => [
                    i.quantity || 1,
                    i.description,
                    `$${i.unitPrice.toFixed(2)}`,
                    `$${(i.unitPrice * (i.quantity || 1)).toFixed(2)}`
                ]),
                headStyles: { fillColor: '#e2e8f0', textColor: '#1e293b', fontSize: 9, lineWidth: 0.1, lineColor: '#94a3b8' },
                bodyStyles: { fontSize: 8, lineWidth: 0.1, lineColor: '#cbd5e1' },
                theme: 'grid'
            });
        }
        else if (docStyle === 'minimal') {
            // MINIMALISTA: Sin bordes de tabla, diseño limpio y espacial
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('CANT', 15, startY);
            doc.text('DESCRIPCIÓN', 35, startY);
            doc.text('TOTAL', pageWidth - 15, startY, { align: 'right' });

            doc.line(14, startY + 2, pageWidth - 14, startY + 2);

            let currentY = startY + 10;
            data.items.forEach(i => {
                doc.setTextColor(60, 60, 60);
                doc.text(`${i.quantity || 1}`, 15, currentY);
                doc.text(i.description, 35, currentY);
                doc.text(`$${(i.unitPrice * (i.quantity || 1)).toFixed(2)}`, pageWidth - 15, currentY, { align: 'right' });
                currentY += 8;
            });

            doc.line(14, currentY, pageWidth - 14, currentY);
            // Simulate lastAutoTable value for the next section
            (doc as any).lastAutoTable = { finalY: currentY + 5 };
        }
        else if (docStyle === 'bold') {
            // CORPORATIVO BOLD: Cajas negras de acento, tipografía fuerte
            autoTable(doc, {
                startY,
                head: [['CANT.', 'DESCRIPCIÓN DEL ARTÍCULO', 'P. UNITARIO', 'IMPORTE TOTAL']],
                body: data.items.map(i => [
                    i.quantity || 1,
                    i.description.toUpperCase(),
                    `$${i.unitPrice.toFixed(2)}`,
                    `$${(i.unitPrice * (i.quantity || 1)).toFixed(2)}`
                ]),
                headStyles: { fillColor: '#0f172a', textColor: '#ffffff', fontSize: 10, fontStyle: 'bold' },
                bodyStyles: { fontSize: 9, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: '#f1f5f9' },
                theme: 'striped'
            });
        }
        else {
            // MODERN (Default): Colored header matched to Primary Color
            autoTable(doc, {
                startY,
                head: [['Ctd.', 'Descripción', 'P. Unitario', 'Total']],
                body: data.items.map(i => [
                    i.quantity || 1,
                    i.description,
                    `$${i.unitPrice.toFixed(2)}`,
                    `$${(i.unitPrice * (i.quantity || 1)).toFixed(2)}`
                ]),
                headStyles: { fillColor: primaryHex, fontSize: 9 },
                bodyStyles: { fontSize: 8 },
                alternateRowStyles: { fillColor: '#f8fafc' },
                theme: 'striped'
            });
        }

        // Totals Section
        finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : startY + 50;

        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);

        if (docStyle === 'bold') {
            // Caja decorativa fuerte para el total
            doc.setFillColor('#0f172a');
            doc.rect(pageWidth - 70, finalY + 10, 56, 30, 'F');
            doc.setTextColor(255, 255, 255);
            doc.text('SUBTOTAL:', pageWidth - 65, finalY + 18);
            doc.text(`$${data.subtotal.toFixed(2)}`, pageWidth - 18, finalY + 18, { align: 'right' });

            if (data.ncf || data.tax > 0) {
                doc.text('ITBIS:', pageWidth - 65, finalY + 26);
                doc.text(`$${data.tax.toFixed(2)}`, pageWidth - 18, finalY + 26, { align: 'right' });

                doc.setFont('', 'bold');
                doc.setFontSize(12);
                doc.text('TOTAL:', pageWidth - 65, finalY + 36);
                doc.text(`$${data.total.toFixed(2)}`, pageWidth - 18, finalY + 36, { align: 'right' });
            } else {
                doc.setFont('', 'bold');
                doc.setFontSize(12);
                doc.text('TOTAL:', pageWidth - 65, finalY + 28);
                doc.text(`$${data.total.toFixed(2)}`, pageWidth - 18, finalY + 28, { align: 'right' });
            }
        }
        else if (docStyle === 'minimal') {
            // Totales al ras sin cajas
            doc.text('Subtotal', pageWidth - 60, finalY + 15);
            doc.text(`$${data.subtotal.toFixed(2)}`, pageWidth - 15, finalY + 15, { align: 'right' });

            if (data.ncf || data.tax > 0) {
                doc.text('ITBIS (18%)', pageWidth - 60, finalY + 22);
                doc.text(`$${data.tax.toFixed(2)}`, pageWidth - 15, finalY + 22, { align: 'right' });

                doc.line(pageWidth - 60, finalY + 26, pageWidth - 15, finalY + 26);

                doc.setFont('', 'bold');
                doc.setFontSize(14);
                doc.text('TOTAL', pageWidth - 60, finalY + 33);
                doc.text(`$${data.total.toFixed(2)}`, pageWidth - 15, finalY + 33, { align: 'right' });
            } else {
                doc.line(pageWidth - 60, finalY + 19, pageWidth - 15, finalY + 19);

                doc.setFont('', 'bold');
                doc.setFontSize(14);
                doc.text('TOTAL', pageWidth - 60, finalY + 26);
                doc.text(`$${data.total.toFixed(2)}`, pageWidth - 15, finalY + 26, { align: 'right' });
            }
        }
        else {
            // Classic & Modern (Default Layout)
            doc.text('Subtotal:', pageWidth - 60, finalY + 15);
            doc.text(`$${data.subtotal.toFixed(2)}`, pageWidth - 14, finalY + 15, { align: 'right' });

            if (data.ncf || data.tax > 0) {
                doc.text('ITBIS (18%):', pageWidth - 60, finalY + 22);
                doc.text(`$${data.tax.toFixed(2)}`, pageWidth - 14, finalY + 22, { align: 'right' });

                doc.setFont('', 'bold');
                doc.text('TOTAL:', pageWidth - 60, finalY + 32);
                doc.text(`$${data.total.toFixed(2)}`, pageWidth - 14, finalY + 32, { align: 'right' });
                doc.setFont('', 'normal');
            } else {
                doc.setFont('', 'bold');
                doc.text('TOTAL:', pageWidth - 60, finalY + 25);
                doc.text(`$${data.total.toFixed(2)}`, pageWidth - 14, finalY + 25, { align: 'right' });
                doc.setFont('', 'normal');
            }
        }
    }

    // Terms and Conditions at the bottom
    if (data.termsAndConditions) {
        // Create new page if needed or print at bottom
        if (finalY + 60 > pageHeight) {
            doc.addPage();
        }

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('Términos y Condiciones:', 14, pageHeight - 40);

        const splitTerms = doc.splitTextToSize(data.termsAndConditions, pageWidth - 28);
        doc.text(splitTerms, 14, pageHeight - 33);
    } else {
        // Default footer branding
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Generado por Antü CRM Motor de Documentos 2.0', pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // File Name matching requested nomenclature
    const sanitizedClient = data.clientName.replace(/\s+/g, '_').toUpperCase();
    const dateFormatted = data.date.replace(/[\/\\]/g, '-');
    const fileName = `${type}_${sanitizedClient}_${dateFormatted}.pdf`;

    // Create blob with explicit PDF MIME type to prevent corruption
    const pdfBlob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(pdfBlob);

    if (isPreview) {
        return blobUrl;
    }

    // Trigger download via anchor element (more reliable than doc.save across browsers)
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    // Revoke after short delay to allow download to start
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    return blobUrl;
};

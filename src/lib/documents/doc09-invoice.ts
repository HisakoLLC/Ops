import { Document, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, ShadingType, Header, Footer, PageBreak } from "docx";
import { format } from "date-fns";

export function buildInvoice(data: Record<string, any>): Document {
  const lineItems = data.line_items || [];
  const totalAmount = data.amount || 0;
  const settings = data.settings || {};
  
  const fromName = settings.company_legal_name || "Hisako Technologies";
  const fromEmail = settings.email || "hello@hisako.eu";
  
  const clientName = data.client_name || "[Client Name]";
  const invoiceDate = data.issued_date ? format(new Date(data.issued_date), "MM/dd/yyyy") : format(new Date(), "MM/dd/yyyy");
  
  const paymentTermsDays = settings.payment_terms_days || 7;

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5 inch margins
          },
        },
        children: [
          // Huge Header: HISAKO AI STUDIOS
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: "HISAKO AI",
                font: "Arial Black",
                size: 100, // 50pt
                color: "000000",
              }),
            ],
            spacing: { after: 0, line: 600 },
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: "STUDIOS",
                font: "Arial Black",
                size: 100, // 50pt
                color: "000000",
              }),
              new TextRun({
                text: "®",
                font: "Arial",
                size: 36, // 18pt
                superScript: true,
                color: "000000",
              }),
            ],
            spacing: { after: 400, line: 600 },
          }),

          // Invoice Number Line
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "INVOICE N°", font: "Arial", bold: true, size: 20 }),
                        ],
                      }),
                    ],
                    borders: { bottom: { style: BorderStyle.NONE }, top: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                  }),
                  new TableCell({
                    width: { size: 85, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: data.invoice_ref || "0001", font: "Arial", size: 20 }),
                        ],
                      }),
                    ],
                    borders: { bottom: { style: BorderStyle.NONE }, top: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                  }),
                ],
              }),
            ],
          }),

          // Spacing
          new Paragraph({ text: "", spacing: { before: 400, after: 0 } }),

          // 3 Columns: FROM, TO, DATE
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "FROM", font: "Arial", bold: true, size: 16 })], spacing: { after: 100 } }),
                      new Paragraph({ children: [new TextRun({ text: fromName, font: "Arial", size: 16 })] }),
                      new Paragraph({ children: [new TextRun({ text: fromEmail, font: "Arial", size: 16 })] }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "TO", font: "Arial", bold: true, size: 16 })], spacing: { after: 100 } }),
                      new Paragraph({ children: [new TextRun({ text: clientName, font: "Arial", size: 16 })] }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "DATE", font: "Arial", bold: true, size: 16 })], spacing: { after: 100 } }),
                      new Paragraph({ children: [new TextRun({ text: invoiceDate, font: "Arial", size: 16 })] }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { before: 600, after: 0 } }),

          // Table Header
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ width: { size: 55, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "DESCRIPTION OF SERVICES", font: "Arial", bold: true, size: 16 })] })] }),
                  new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "QTY", font: "Arial", bold: true, size: 16 })] })] }),
                  new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "HOURS", font: "Arial", bold: true, size: 16 })] })] }),
                  new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "SUBTOTAL", font: "Arial", bold: true, size: 16 })] })] }),
                ],
              }),
            ],
          }),

          // Table Rows
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: lineItems.length > 0 
              ? lineItems.map((item: any) => new TableRow({
                  children: [
                    new TableCell({ width: { size: 55, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: item.description || "", font: "Arial", size: 18 })], spacing: { before: 100, after: 100 } })] }),
                    new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1", font: "Arial", size: 18 })], spacing: { before: 100, after: 100 } })] }),
                    new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "-", font: "Arial", size: 18 })], spacing: { before: 100, after: 100 } })] }),
                    new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: Number(item.amount || 0).toFixed(2), font: "Arial", size: 18 })], spacing: { before: 100, after: 100 } })] }),
                  ],
                }))
              : [
                  new TableRow({
                    children: [
                      new TableCell({ width: { size: 100, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "No line items specified.", font: "Arial", size: 18 })], spacing: { before: 100, after: 100 } })] }),
                    ],
                  })
                ],
          }),

          new Paragraph({ text: "", spacing: { before: 400, after: 0 } }),

          // Totals Section
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [] }),
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    children: [
                      new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                          bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                          left: { style: BorderStyle.NONE },
                          right: { style: BorderStyle.NONE },
                          insideHorizontal: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                          insideVertical: { style: BorderStyle.NONE },
                        },
                        rows: [
                          new TableRow({
                            children: [
                              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TAXES", font: "Arial", bold: true, size: 16 })], spacing: { before: 60, after: 60 } })] }),
                              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "0%", font: "Arial", size: 18 })], spacing: { before: 60, after: 60 } })] }),
                            ],
                          }),
                          new TableRow({
                            children: [
                              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", font: "Arial", bold: true, size: 16 })], spacing: { before: 60, after: 60 } })] }),
                              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: Number(totalAmount).toFixed(2), font: "Arial", size: 18 })], spacing: { before: 60, after: 60 } })] }),
                            ],
                          }),
                        ],
                      })
                    ]
                  }),
                ],
              }),
            ],
          }),
        ],

        // Footer for QR, Terms, Payment Details
        footers: {
          default: new Footer({
          children: [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
              },
              rows: [
                new TableRow({
                  children: [
                    // QR Code Placeholder
                    new TableCell({
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: "[ QR CODE PLACEHOLDER ]",
                              font: "Arial",
                              bold: true,
                              size: 16,
                              color: "888888"
                            }),
                          ],
                          spacing: { before: 100 }
                        })
                      ],
                      margins: { top: 100, bottom: 100, left: 0, right: 100 },
                      borders: { right: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE } }
                    }),
                    // Terms and Conditions
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "TERMS AND CONDITIONS", font: "Arial", bold: true, size: 14 })], spacing: { after: 100 } }),
                        new Paragraph({ children: [new TextRun({ text: `Payment is due within ${paymentTermsDays} days of invoice date unless otherwise agreed in writing. Late payments are subject to a 5% late fee after 10 days. All services rendered are non-refundable. By submitting payment, you agree to the outlined terms and deliverables.`, font: "Arial", size: 14, color: "444444" })] }),
                      ],
                      margins: { top: 100, bottom: 100, left: 200, right: 200 },
                      borders: { left: { style: BorderStyle.SINGLE, size: 12, color: "000000" }, right: { style: BorderStyle.SINGLE, size: 12, color: "000000" }, top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE } }
                    }),
                    // Payments Methods
                    new TableCell({
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "PAYMENTS METHODS", font: "Arial", bold: true, size: 14 })], spacing: { after: 100 } }),
                        new Paragraph({ children: [new TextRun({ text: "Hisako LTD\nBANK ACCOUNT NUMBER: 2020286430841\nSWIFT NUMBER: EQBLKENAXXX", font: "Arial", size: 14, color: "444444" })] }),
                      ],
                      margins: { top: 100, bottom: 100, left: 200, right: 0 },
                      borders: { left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE } }
                    }),
                  ],
                })
              ]
            })
          ]
        })
        }
      }
    ]
  });
}

import {
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  ShadingType,
  HeightRule,
  Footer,
  PageNumber
} from "docx";

// Map of document titles to their subtitles
const SUBTITLES: Record<string, string> = {
  "DISCOVERY CALL SCRIPT & NOTES": "HISAKO AI WORKFLOW AUDIT",
  "INTAKE QUESTIONNAIRE & REQUIREMENTS": "CLIENT ONBOARDING SYSTEM",
  "PROPOSAL FOR AUTOMATION SERVICES": "OPERATIONAL EFFICIENCY UPGRADE",
  "MASTER SERVICES AGREEMENT": "STANDARD ENGAGEMENT TERMS",
  "NON-DISCLOSURE AGREEMENT": "CONFIDENTIALITY DEED",
  "ONBOARDING CHECKLIST": "GETTING STARTED INTEGRATION",
  "PIPELINE HANDOVER DOCUMENT": "LIVE SYSTEM DOCUMENTATION",
  "MONTHLY PERFORMANCE REPORT": "PIPELINE METRICS & INSIGHTS",
};

// 1. Clean minimal header (no tables or shading)
export const h1 = (title: string) => {
  const subtitle = SUBTITLES[title] || "HISAKO AI SYSTEM DOCUMENT";

  return new Paragraph({
    children: [
      new TextRun({
        text: "HISAKO  |  AI AGENCY\n",
        font: "Courier New",
        size: 20, // 10pt
        color: "666666",
        bold: true,
      }),
      new TextRun({
        text: title.toUpperCase() + "\n",
        font: "Arial Black",
        size: 40, // 20pt
        color: "000000",
        bold: true,
      }),
      new TextRun({
        text: subtitle.toUpperCase(),
        font: "Arial",
        size: 20, // 10pt
        color: "888888",
      }),
    ],
    border: {
      bottom: {
        color: "000000",
        space: 12,
        style: BorderStyle.SINGLE,
        size: 18, // ~2.25pt
      },
    },
    spacing: { before: 240, after: 360 },
  });
};

// 2. Section Headings - Level 1
export const h2 = (text: string) => new Paragraph({
  children: [
    new TextRun({
      text,
      font: "Arial Black",
      size: 28, // 14pt
      color: "000000",
      bold: true,
    }),
  ],
  border: {
    bottom: {
      color: "CCCCCC",
      space: 8,
      style: BorderStyle.SINGLE,
      size: 8, // 1pt
    },
  },
  spacing: { before: 360, after: 120 },
});

// 3. Section Headings - Level 2
export const h3 = (text: string) => new Paragraph({
  children: [
    new TextRun({
      text,
      font: "Arial",
      size: 24, // 12pt
      color: "000000",
      bold: true,
    }),
  ],
  spacing: { before: 240, after: 80 },
});

// 4. Body Paragraph
export const p = (text: string, important = false) => new Paragraph({
  children: [
    new TextRun({
      text,
      font: "Arial",
      size: 22, // 11pt
      color: important ? "000000" : "333333",
      bold: important,
    }),
  ],
  spacing: { after: 120, line: 276, lineRule: HeightRule.AUTO },
});

// 5. Key-Value Row (Uses standard single-row table with 0 border sides, only thin bottom border)
export const kv = (key: string, value: string | undefined | null) => new Table({
  rows: [
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: key.toUpperCase(),
                  font: "Courier New",
                  size: 18, // 9pt
                  color: "666666",
                  bold: true,
                }),
              ],
            }),
          ],
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "E0E0E0" },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
          },
          margins: { top: 80, bottom: 80 },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: value ?? "[NOT PROVIDED]",
                  font: "Arial",
                  size: 22, // 11pt
                  color: "000000",
                  bold: true,
                }),
              ],
            }),
          ],
          width: { size: 70, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "E0E0E0" },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
          },
          margins: { top: 80, bottom: 80 },
        }),
      ],
    }),
  ],
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
  },
});

export const rule = () => new Paragraph({
  spacing: { after: 180 },
});

// 6. Minimal bracketed status tag
export const tag = (text: string) => new Paragraph({
  children: [
    new TextRun({
      text: `[ ${text.toUpperCase()} ]`,
      font: "Courier New",
      size: 20,
      color: "333333",
      bold: true,
    }),
  ],
  spacing: { after: 120 },
});

// 7. Clean text band (instead of colored shaded table)
export const darkBand = (text: string) => new Paragraph({
  children: [
    new TextRun({
      text: `// ${text.toUpperCase()}`,
      font: "Courier New",
      size: 22,
      color: "000000",
      bold: true,
    }),
  ],
  spacing: { before: 180, after: 120 },
});

// 8. Clean callout (Uses left border only, no complex tables that render diagonal borders)
export const callout = (text: string) => new Table({
  rows: [
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text,
                  font: "Arial",
                  size: 22, // 11pt
                  color: "333333",
                  italics: true,
                }),
              ],
            }),
          ],
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.SINGLE, size: 24, color: "000000" }, // 3pt black left border
            right: { style: BorderStyle.NONE },
          },
          margins: { top: 120, bottom: 120, left: 180, right: 180 },
        }),
      ],
    }),
  ],
  width: { size: 100, type: WidthType.PERCENTAGE },
});

// 9. Standard clean table
export const table = (rows: TableRow[]) => {
  const styledRows = rows.map((r, rowIndex) => {
    const cells = (r as any).options?.children || [];
    
    const styledCells = cells.map((c: any) => {
      const isHeader = rowIndex === 0;
      const fill = isHeader ? "EFEFEF" : "FFFFFF";
      const font = isHeader ? "Courier New" : "Arial";
      const size = isHeader ? 20 : 22; // 10pt or 11pt
      const color = "000000";
      const bold = isHeader;
      const allCaps = isHeader;
      
      let cellText = "";
      try {
        const paras = c.options?.children || [];
        cellText = paras.map((p: any) => 
          p.options?.children?.map((tr: any) => tr.options?.text || tr.text || "").join("") || ""
        ).join("\n");
      } catch {
        cellText = "";
      }
      
      return new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: cellText,
                font,
                size,
                color,
                bold,
                allCaps,
              }),
            ],
            spacing: { before: 60, after: 60 },
          }),
        ],
        shading: { fill, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
          left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
          right: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
        },
      });
    });
 
    return new TableRow({
      children: styledCells,
    });
  });

  return new Table({
    rows: styledRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
};

export const row = (cells: TableCell[]) => new TableRow({
  children: cells,
});

export const cell = (text: string, bold = false) => new TableCell({
  children: [
    new Paragraph({
      children: [new TextRun({ text, bold })],
    }),
  ],
  margins: { top: 80, bottom: 80, left: 80, right: 80 },
});

// 10. Clean signature block
export const signatureBlock = (party1: string, party2: string) => {
  const makeSigColumn = (party: string) => new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text: party, font: "Arial", size: 22, color: "000000", bold: true })],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "SIGNATURE", font: "Courier New", size: 16, color: "666666", allCaps: true })],
        spacing: { before: 180, after: 60 },
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" } },
        spacing: { after: 180 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "FULL NAME", font: "Courier New", size: 16, color: "666666", allCaps: true })],
        spacing: { before: 60, after: 60 },
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" } },
        spacing: { after: 180 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "DATE", font: "Courier New", size: 16, color: "666666", allCaps: true })],
        spacing: { before: 60, after: 60 },
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" } },
        spacing: { after: 60 },
      }),
    ],
    width: { size: 45, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
  });

  return new Table({
    rows: [
      new TableRow({
        children: [
          makeSigColumn(party1),
          new TableCell({
            children: [],
            width: { size: 10, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
          }),
          makeSigColumn(party2),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
};

// 11. Minimal official stamp (no complex tables or bright colors)
export const officialStamp = () => {
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return new Paragraph({
    children: [
      new TextRun({
        text: "ISSUED BY HISAKO AI AGENCY\n",
        font: "Courier New",
        size: 18,
        color: "000000",
        bold: true,
      }),
      new TextRun({
        text: `hisako.eu  ·  hello@hisako.eu  ·  Nairobi, Kenya\nDocument generated: ${dateStr}`,
        font: "Arial",
        size: 16,
        color: "666666",
      }),
    ],
    alignment: AlignmentType.CENTER,
    border: {
      top: { style: BorderStyle.SINGLE, size: 8, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: "CCCCCC" },
    },
    spacing: { before: 360, after: 180 },
  });
};

// 12. Minimal page footer
export const buildFooter = () => new Footer({
  children: [
    new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "HISAKO TEAM  ·  hisako.eu  ·  hello@hisako.eu",
                      font: "Courier New",
                      size: 16, // 8pt
                      color: "333333",
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "CONFIDENTIAL — FOR NAMED RECIPIENT ONLY",
                      font: "Courier New",
                      size: 14, // 7pt
                      color: "888888",
                    }),
                  ],
                }),
              ],
              width: { size: 70, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Page ",
                      font: "Courier New",
                      size: 16,
                      color: "888888",
                    }),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      font: "Courier New",
                      size: 16,
                      color: "888888",
                    }),
                    new TextRun({
                      text: " / ",
                      font: "Courier New",
                      size: 16,
                      color: "888888",
                    }),
                    new TextRun({
                      children: [PageNumber.TOTAL_PAGES],
                      font: "Courier New",
                      size: 16,
                      color: "888888",
                    }),
                  ],
                  alignment: AlignmentType.RIGHT,
                }),
              ],
              width: { size: 30, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
            }),
          ],
        }),
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 8, color: "CCCCCC" },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
    }),
  ],
});

// 13. Bullet points
export const bullet = (text: string) => new Paragraph({
  children: [
    new TextRun({
      text: "•  ",
      font: "Arial",
      size: 22,
      color: "000000",
      bold: true,
    }),
    new TextRun({
      text,
      font: "Arial",
      size: 22,
      color: "333333",
    }),
  ],
  indent: { left: 400, hanging: 200 },
  spacing: { after: 80 },
});

// Section builder helper (uses 1 inch normal margins)
export const buildSection = (children: any[]) => ({
  properties: {
    page: {
      margin: {
        top: 1440,   // 1 inch
        bottom: 1440,// 1 inch
        left: 1440,  // 1 inch
        right: 1440, // 1 inch
        header: 720,
        footer: 720,
      },
    },
  },
  footers: {
    default: buildFooter(),
  },
  children,
});

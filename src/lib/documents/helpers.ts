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

// 1. Dark Header Block
export const h1 = (title: string) => {
  const subtitle = SUBTITLES[title] || "HISAKO AI SYSTEM DOCUMENT";

  return new Table({
    rows: [
      // Dark row
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "HISAKO  |  AI AGENCY",
                    font: "Courier New",
                    size: 24, // 16px
                    color: "FFFFFF",
                    bold: true,
                    allCaps: true,
                  }),
                ],
                spacing: { before: 400, after: 600 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: title,
                    font: "Arial Black",
                    size: 72, // 48px
                    color: "FFFFFF",
                    bold: true,
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: subtitle,
                    font: "Arial",
                    size: 33, // 22px
                    color: "AAAAAA",
                    italics: true,
                  }),
                ],
                spacing: { after: 600 },
              }),
            ],
            shading: { fill: "111111", type: ShadingType.CLEAR },
            margins: { top: 600, bottom: 600, left: 600, right: 600 },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
          }),
        ],
      }),
      // Orange stripe row (60px = 900 dxa)
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "" })],
              }),
            ],
            shading: { fill: "E8400C", type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
          }),
        ],
        height: { value: 900, rule: HeightRule.EXACT },
      }),
      // White spacer row (120px = 1800 dxa)
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "" })],
              }),
            ],
            shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
          }),
        ],
        height: { value: 1800, rule: HeightRule.EXACT },
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
};

// 3. Section Headings - Level 1
export const h2 = (text: string) => new Paragraph({
  children: [
    new TextRun({
      text,
      font: "Arial Black",
      size: 42, // 28px
      color: "0A0A0A",
      bold: true,
    }),
  ],
  border: {
    bottom: {
      color: "E8400C",
      space: 12,
      style: BorderStyle.SINGLE,
      size: 32, // 4px
    },
  },
  spacing: { before: 280, after: 120 },
});

// 3. Section Headings - Level 2
export const h3 = (text: string) => new Paragraph({
  children: [
    new TextRun({
      text,
      font: "Arial",
      size: 36, // 24px
      color: "111111",
      bold: true,
    }),
  ],
  border: {
    left: {
      color: "E8400C",
      space: 12,
      style: BorderStyle.SINGLE,
      size: 96, // 16px (12pt)
    },
  },
  indent: { left: 200 },
  spacing: { before: 200, after: 100 },
});

// 4. Body Text
export const p = (text: string, important = false) => new Paragraph({
  children: [
    new TextRun({
      text,
      font: "Arial",
      size: 33, // 22px
      color: important ? "0A0A0A" : "444444",
      bold: important,
    }),
  ],
  spacing: { line: 276, lineRule: HeightRule.AUTO, after: 120 },
});

// 2. Metadata Table Helper
export const kv = (key: string, value: string | undefined | null) => new Table({
  rows: [
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: key,
                  font: "Courier New",
                  size: 26, // 17px
                  color: "888888",
                  bold: true,
                  allCaps: true,
                }),
              ],
            }),
          ],
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.SINGLE, size: 8, color: "DDDDDD" },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
          },
          margins: { top: 120, bottom: 120 },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: value ?? "[NOT PROVIDED]",
                  font: "Arial",
                  size: 33, // 22px
                  color: "0A0A0A",
                  bold: true,
                }),
              ],
            }),
          ],
          width: { size: 70, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.SINGLE, size: 8, color: "DDDDDD" },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
          },
          margins: { top: 120, bottom: 120 },
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
  spacing: { after: 200 },
});

// 5. Orange Tag Labels
export const tag = (text: string) => new Table({
  rows: [
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text,
                  font: "Courier New",
                  size: 24, // 16px
                  color: "FFFFFF",
                  bold: true,
                  allCaps: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: { fill: "E8400C", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 160, right: 160 },
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
  width: { size: 2500, type: WidthType.DXA },
});

// 6. Dark Band
export const darkBand = (text: string) => new Table({
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
                  size: 33, // 22px
                  color: "FFFFFF",
                  bold: true,
                  allCaps: true,
                }),
              ],
            }),
          ],
          shading: { fill: "2A2A2A", type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 200, right: 200 },
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
});

// 7. Callout Box
export const callout = (text: string) => new Table({
  rows: [
    new TableRow({
      children: [
        new TableCell({
          children: [],
          shading: { fill: "E8400C", type: ShadingType.CLEAR },
          width: { size: 280, type: WidthType.DXA },
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
                  text,
                  font: "Arial",
                  size: 33, // 22px
                  color: "0A0A0A",
                  italics: true,
                }),
              ],
              spacing: { before: 100, after: 100 },
            }),
          ],
          shading: { fill: "FDF1EE", type: ShadingType.CLEAR },
          margins: { top: 200, bottom: 200, left: 300, right: 300 },
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
});

// 8. Table Styling Interceptor
export const table = (rows: TableRow[]) => {
  const styledRows = rows.map((r, rowIndex) => {
    // Attempt to access children cells of TableRow options
    const cells = (r as any).options?.children || [];
    
    const styledCells = cells.map((c: any) => {
      const isHeader = rowIndex === 0;
      const fill = isHeader ? "111111" : (rowIndex % 2 === 0 ? "F7F7F5" : "FFFFFF");
      const font = isHeader ? "Courier New" : "Arial";
      const size = isHeader ? 24 : 33; // 16px or 22px
      const color = isHeader ? "FFFFFF" : "0A0A0A";
      const bold = isHeader;
      const allCaps = isHeader;
      
      // Get text of cell
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
            spacing: { before: 80, after: 80 },
          }),
        ],
        shading: { fill, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 8, color: "DDDDDD" },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: "DDDDDD" },
          left: { style: BorderStyle.SINGLE, size: 8, color: "DDDDDD" },
          right: { style: BorderStyle.SINGLE, size: 8, color: "DDDDDD" },
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
  margins: { top: 100, bottom: 100, left: 100, right: 100 },
});

// 9. Signature Blocks
export const signatureBlock = (party1: string, party2: string) => {
  const makeSigColumn = (party: string) => new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text: party, font: "Arial", size: 33, color: "0A0A0A", bold: true })],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "SIGNATURE", font: "Courier New", size: 20, color: "888888", allCaps: true })],
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" } },
        spacing: { after: 300 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "FULL NAME", font: "Courier New", size: 20, color: "888888", allCaps: true })],
        spacing: { before: 100, after: 100 },
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" } },
        spacing: { after: 300 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "TITLE", font: "Courier New", size: 20, color: "888888", allCaps: true })],
        spacing: { before: 100, after: 100 },
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" } },
        spacing: { after: 300 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "DATE", font: "Courier New", size: 20, color: "888888", allCaps: true })],
        spacing: { before: 100, after: 100 },
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" } },
        spacing: { after: 100 },
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
          // Spacer column
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

// 10. Official Stamp
export const officialStamp = () => {
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "ISSUED BY HISAKO AI AGENCY",
                    font: "Courier New",
                    size: 24, // 16px
                    color: "E8400C",
                    bold: true,
                    allCaps: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 150, after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "hisako.eu  ·  hello@hisako.eu  ·  Nairobi, Kenya",
                    font: "Arial",
                    size: 20, // 13px
                    color: "888888",
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Document generated: ${dateStr}`,
                    font: "Arial",
                    size: 16, // 10px
                    color: "888888",
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 150 },
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 48, color: "E8400C" }, // ~6pt (8px)
              bottom: { style: BorderStyle.SINGLE, size: 48, color: "E8400C" },
              left: { style: BorderStyle.SINGLE, size: 48, color: "E8400C" },
              right: { style: BorderStyle.SINGLE, size: 48, color: "E8400C" },
            },
            margins: { top: 200, bottom: 200, left: 200, right: 200 },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
};

// 11. Page Footer Builder
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
                      size: 21, // 14px
                      color: "0A0A0A",
                    }),
                  ],
                  spacing: { before: 100 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "CONFIDENTIAL — FOR NAMED RECIPIENT ONLY",
                      font: "Courier New",
                      size: 20, // 13px
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
                      size: 21,
                      color: "888888",
                    }),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      font: "Courier New",
                      size: 21,
                      color: "888888",
                    }),
                    new TextRun({
                      text: " / ",
                      font: "Courier New",
                      size: 21,
                      color: "888888",
                    }),
                    new TextRun({
                      children: [PageNumber.TOTAL_PAGES],
                      font: "Courier New",
                      size: 21,
                      color: "888888",
                    }),
                  ],
                  alignment: AlignmentType.RIGHT,
                  spacing: { before: 100 },
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
        top: { style: BorderStyle.SINGLE, size: 32, color: "E8400C" }, // 4px top border
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
    }),
  ],
});

// 12. Bullet Points
export const bullet = (text: string) => new Paragraph({
  children: [
    new TextRun({
      text: "›  ",
      font: "Arial",
      size: 33, // 22px
      color: "E8400C",
      bold: true,
    }),
    new TextRun({
      text,
      font: "Arial",
      size: 33, // 22px
      color: "444444",
    }),
  ],
  indent: { left: 560, hanging: 280 },
  spacing: { after: 120 },
});

// Section builder helper
export const buildSection = (children: any[]) => ({
  properties: {
    page: {
      margin: {
        top: 0,
        bottom: 1440,
        left: 1440,
        right: 1440,
        header: 0,
        footer: 720,
      },
    },
  },
  footers: {
    default: buildFooter(),
  },
  children,
});

import { Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType } from "docx";

export const h1 = (text: string) => new Paragraph({
  text,
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 200 },
});

export const h2 = (text: string) => new Paragraph({
  text,
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 300, after: 150 },
});

export const h3 = (text: string) => new Paragraph({
  text,
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 100 },
});

export const p = (text: string, bold = false) => new Paragraph({
  children: [new TextRun({ text, bold })],
  spacing: { after: 150 },
});

export const kv = (key: string, value: string | undefined | null) => new Paragraph({
  children: [
    new TextRun({ text: `${key}: `, bold: true }),
    new TextRun({ text: value ?? "[NOT PROVIDED]" }),
  ],
  spacing: { after: 150 },
});

export const rule = () => new Paragraph({
  border: {
    bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 },
  },
  spacing: { after: 200 },
});

export const table = (rows: TableRow[]) => new Table({
  rows,
  width: { size: 100, type: WidthType.PERCENTAGE },
});

export const cell = (text: string, bold = false) => new TableCell({
  children: [new Paragraph({ children: [new TextRun({ text, bold })] })],
  margins: { top: 100, bottom: 100, left: 100, right: 100 },
});

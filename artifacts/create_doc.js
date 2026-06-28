
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, LevelFormat, TableOfContents, PageBreak
} = require('docx');
const fs = require('fs');

const COLOR_PRIMARY = "1F4E79";
const COLOR_SECONDARY = "2E75B6";
const COLOR_ACCENT = "4472C4";
const COLOR_HEADER_BG = "1F4E79";
const COLOR_ROW_ALT = "EBF3FB";
const COLOR_WHITE = "FFFFFF";
const COLOR_TEXT = "1A1A1A";
const COLOR_GRAY = "595959";

const border = { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    children: [new TextRun({ text, bold: true, size: 36, color: COLOR_PRIMARY, font: "Arial" })]
  });
}
function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, bold: true, size: 28, color: COLOR_SECONDARY, font: "Arial" })]
  });
}
function body(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, size: 22, color: COLOR_TEXT, font: "Arial" })]
  });
}
function bullet(text, level) {
  level = level || 0;
  return new Paragraph({
    numbering: { reference: "bullets", level: level },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 22, color: COLOR_TEXT, font: "Arial" })]
  });
}
function spacer(before) {
  before = before || 120;
  return new Paragraph({ spacing: { before: before, after: 0 }, children: [new TextRun("")] });
}
function sectionDivider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_SECONDARY, space: 1 } },
    children: [new TextRun("")]
  });
}
function codeBlock(lines) {
  return lines.map(function(line, i) {
    return new Paragraph({
      spacing: { before: i === 0 ? 100 : 0, after: i === lines.length - 1 ? 100 : 0 },
      shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
      indent: { left: 360 },
      children: [new TextRun({ text: line, font: "Courier New", size: 18, color: "333333" })]
    });
  });
}
function infoBox(title, lines, bgColor, borderColor) {
  bgColor = bgColor || "EBF3FB";
  borderColor = borderColor || "2E75B6";
  var rows = [];
  if (title) {
    rows.push(new TableRow({
      children: [new TableCell({
        borders: { top: { style: BorderStyle.SINGLE, size: 4, color: borderColor }, bottom: noBorder, left: { style: BorderStyle.SINGLE, size: 8, color: borderColor }, right: noBorder },
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 40, left: 160, right: 160 },
        children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 22, color: COLOR_PRIMARY, font: "Arial" })] })]
      })]
    }));
  }
  lines.forEach(function(line, i) {
    rows.push(new TableRow({
      children: [new TableCell({
        borders: {
          top: noBorder,
          bottom: i === lines.length - 1 ? { style: BorderStyle.SINGLE, size: 4, color: borderColor } : noBorder,
          left: { style: BorderStyle.SINGLE, size: 8, color: borderColor },
          right: noBorder
        },
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        margins: { top: 40, bottom: i === lines.length - 1 ? 80 : 40, left: 160, right: 160 },
        children: [new Paragraph({ children: [new TextRun({ text: line, size: 20, color: COLOR_TEXT, font: "Courier New" })] })]
      })]
    }));
  });
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder },
    rows: rows
  });
}
function infoBoxText(title, lines, bgColor, borderColor) {
  bgColor = bgColor || "EBF3FB";
  borderColor = borderColor || "2E75B6";
  var rows = [];
  if (title) {
    rows.push(new TableRow({
      children: [new TableCell({
        borders: { top: { style: BorderStyle.SINGLE, size: 4, color: borderColor }, bottom: noBorder, left: { style: BorderStyle.SINGLE, size: 8, color: borderColor }, right: noBorder },
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 40, left: 160, right: 160 },
        children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 22, color: COLOR_PRIMARY, font: "Arial" })] })]
      })]
    }));
  }
  lines.forEach(function(line, i) {
    rows.push(new TableRow({
      children: [new TableCell({
        borders: {
          top: noBorder,
          bottom: i === lines.length - 1 ? { style: BorderStyle.SINGLE, size: 4, color: borderColor } : noBorder,
          left: { style: BorderStyle.SINGLE, size: 8, color: borderColor },
          right: noBorder
        },
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        margins: { top: 40, bottom: i === lines.length - 1 ? 80 : 40, left: 160, right: 160 },
        children: [new Paragraph({ children: [new TextRun({ text: line, size: 21, color: COLOR_TEXT, font: "Arial" })] })]
      })]
    }));
  });
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder },
    rows: rows
  });
}
function dataTable(headers, rows, colWidths) {
  var totalWidth = colWidths.reduce(function(a, b) { return a + b; }, 0);
  var tableRows = [];
  tableRows.push(new TableRow({
    tableHeader: true,
    children: headers.map(function(h, i) {
      return new TableCell({
        borders: borders,
        width: { size: colWidths[i], type: WidthType.DXA },
        shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 140, right: 140 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 20, color: COLOR_WHITE, font: "Arial" })] })]
      });
    })
  }));
  rows.forEach(function(row, ri) {
    tableRows.push(new TableRow({
      children: row.map(function(cell, ci) {
        return new TableCell({
          borders: borders,
          width: { size: colWidths[ci], type: WidthType.DXA },
          shading: { fill: ri % 2 === 0 ? COLOR_WHITE : COLOR_ROW_ALT, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 140, right: 140 },
          children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20, color: COLOR_TEXT, font: "Arial" })] })]
        });
      })
    }));
  });
  return new Table({ width: { size: totalWidth, type: WidthType.DXA }, columnWidths: colWidths, rows: tableRows });
}

var doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
      ]},
      { reference: "numbers", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]}
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22, color: COLOR_TEXT } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 36, bold: true, color: COLOR_PRIMARY, font: "Arial" }, paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, color: COLOR_SECONDARY, font: "Arial" }, paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, color: COLOR_ACCENT, font: "Arial" }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ]
  },
  sections: [
    // ── Cover Page ──
    {
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children: [
        spacer(1800),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [6500, 2860],
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder },
          rows: [new TableRow({ children: [
            new TableCell({ borders: noBorders, shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR }, margins: { top: 200, bottom: 200, left: 300, right: 200 }, children: [
              new Paragraph({ children: [new TextRun({ text: "Strands Agents", bold: true, size: 52, color: COLOR_WHITE, font: "Arial" })] }),
              new Paragraph({ children: [new TextRun({ text: "AgentSkills Plugin Guide", size: 26, color: "BDD7EE", font: "Arial" })] }),
            ]}),
            new TableCell({ borders: noBorders, shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR }, margins: { top: 200, bottom: 200, left: 200, right: 300 }, verticalAlign: VerticalAlign.CENTER, children: [
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Technical Reference", size: 20, color: "BDD7EE", font: "Arial" })] }),
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "v1.0", size: 24, color: COLOR_WHITE, font: "Arial", bold: true })] }),
            ]}),
          ]})]
        }),
        spacer(400),
        sectionDivider(),
        spacer(200),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Strands Agents \u2014 AgentSkills \ud50c\ub7ec\uadf8\uc778", bold: true, size: 40, color: COLOR_PRIMARY, font: "Arial" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "\uad6c\ud604 \ubc0f \ud65c\uc6a9 \uac00\uc774\ub4dc", size: 30, color: COLOR_GRAY, font: "Arial" })] }),
        sectionDivider(),
        spacer(300),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\uc774 \ubb38\uc11c\ub294 Strands Agents\uc758 AgentSkills \ud50c\ub7ec\uadf8\uc778 \uacf5\uc2dd \ubb38\uc11c\ub97c \uae30\ubc18\uc73c\ub85c", size: 22, color: COLOR_GRAY, font: "Arial" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 }, children: [new TextRun({ text: "\uc2a4\ud0ac \uc2dc\uc2a4\ud15c\uc758 \uac1c\ub150, \uad6c\ud604 \ubc29\ubc95, \ud65c\uc6a9 \ud328\ud134\uc744 \uc815\ub9ac\ud55c \uae30\uc220 \ucc38\uc870 \ubb38\uc11c\uc785\ub2c8\ub2e4.", size: 22, color: COLOR_GRAY, font: "Arial" })] }),
        spacer(600),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\ucc38\uc870: https://strandsagents.com/docs/user-guide/concepts/plugins/skills/", size: 20, color: COLOR_SECONDARY, font: "Arial" })] }),
        new Paragraph({ children: [new PageBreak()] }),
      ]
    },
    // ── Main Content ──
    {
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      headers: {
        default: new Header({ children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_SECONDARY, space: 1 } },
          children: [new TextRun({ text: "Strands Agents \u2014 AgentSkills \ud50c\ub7ec\uadf8\uc778 \uad6c\ud604 \uac00\uc774\ub4dc", size: 18, color: COLOR_GRAY, font: "Arial" })]
        })] })
      },
      footers: {
        default: new Footer({ children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_SECONDARY, space: 1 } },
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: "Page ", size: 18, color: COLOR_GRAY, font: "Arial" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: COLOR_GRAY, font: "Arial" }),
            new TextRun({ text: " / ", size: 18, color: COLOR_GRAY, font: "Arial" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: COLOR_GRAY, font: "Arial" }),
          ]
        })] })
      },
      children: [
        // TOC
        new TableOfContents("\ubaa9  \ucc28", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ children: [new PageBreak()] }),

        // 1. Overview
        heading1("1. \uac1c\uc694 (Overview)"),
        sectionDivider(),
        heading2("1.1 Skills\ub780 \ubb34\uc5c7\uc778\uac00?"),
        body("AgentSkills\ub294 Strands Agents \ud504\ub808\uc784\uc6cc\ud06c\uc758 \ud50c\ub7ec\uadf8\uc778\uc73c\ub85c, \uc5d0\uc774\uc804\ud2b8\uc5d0\uac8c \ud544\uc694\ud560 \ub54c\ub9cc \uc804\ubb38\ud654\ub41c \uc9c0\uce68\uc744 \uc81c\uacf5\ud558\ub294 \ubaa8\ub4c8\uc2dd \uc2a4\ud0ac \ud328\ud0a4\uc9c0 \uc2dc\uc2a4\ud15c\uc785\ub2c8\ub2e4. \uc2dc\uc2a4\ud15c \ud504\ub86c\ud504\ud2b8\uc5d0 \ubaa8\ub4e0 \uc9c0\uce68\uc744 \ubbf8\ub9ac \ub85c\ub4dc\ud558\ub294 \ub300\uc2e0, \uc5d0\uc774\uc804\ud2b8\uac00 \uad00\ub828\uc131\uc774 \uc788\uc744 \ub54c\ub9cc \uc2a4\ud0ac\uc744 \ubc1c\uacac\ud558\uace0 \ud65c\uc131\ud654\ud569\ub2c8\ub2e4."),
        spacer(80),
        body("AgentSkills \ud50c\ub7ec\uadf8\uc778\uc740 Agent Skills \uacf5\uac1c \uc0ac\uc591(agentskills.io/specification)\uc744 \ub530\ub974\uba70, \uc810\uc9c4\uc801 \uacf5\uac1c(Progressive Disclosure) \ubc29\uc2dd\uc744 \uc0ac\uc6a9\ud569\ub2c8\ub2e4:"),
        bullet("\uacbd\ub7c9 \uba54\ud0c0\ub370\uc774\ud130(\uc774\ub984, \uc124\uba85)\ub9cc \uc2dc\uc2a4\ud15c \ud504\ub86c\ud504\ud2b8\uc5d0 \uc8fc\uc785"),
        bullet("\uc5d0\uc774\uc804\ud2b8\uac00 \ub3c4\uad6c \ud638\ucd9c\uc744 \ud1b5\ud574 \uc2a4\ud0ac\uc744 \ud65c\uc131\ud654\ud560 \ub54c \uc804\uccb4 \uc9c0\uce68 \ub85c\ub4dc"),
        bullet("\ucee8\ud14d\uc2a4\ud2b8 \uc708\ub3c4\uc6b0\ub97c \ud6a8\uc728\uc801\uc73c\ub85c \uc720\uc9c0\ud558\uba74\uc11c \uae4a\uc740 \uc804\ubb38 \uc9c0\uc2dd \uc81c\uacf5"),
        spacer(160),
        heading2("1.2 \uae30\uc874 \ubc29\uc2dd\uc758 \ubb38\uc81c\uc810"),
        body("\uc5d0\uc774\uc804\ud2b8\uac00 \ubcf5\uc7a1\ud55c \uc791\uc5c5\uc744 \ucc98\ub9ac\ud560\uc218\ub85d \uc2dc\uc2a4\ud15c \ud504\ub86c\ud504\ud2b8\uac00 \ube44\ub300\ud574\uc9d1\ub2c8\ub2e4. \uc608\ub97c \ub4e4\uc5b4 PDF \ucc98\ub9ac, \ub370\uc774\ud130 \ubd84\uc11d, \ucf54\ub4dc \ub9ac\ubdf0, \uc774\uba54\uc77c \uc791\uc131\uc744 \ubaa8\ub450 \ucc98\ub9ac\ud558\ub294 \ub2e8\uc77c \uc5d0\uc774\uc804\ud2b8\ub294 \ubaa8\ub4e0 \uae30\ub2a5\uc5d0 \ub300\ud55c \uc9c0\uce68\uc774 \ub2f4\uae34 \uac70\ub300\ud55c \ud504\ub86c\ud504\ud2b8\ub97c \uac16\uac8c \ub429\ub2c8\ub2e4."),
        spacer(80),
        dataTable(
          ["\ubb38\uc81c", "\uc124\uba85"],
          [
            ["\ucee8\ud14d\uc2a4\ud2b8 \uc708\ub3c4\uc6b0 \ube44\ub300\ud654", "\ub300\ud615 \ud504\ub86c\ud504\ud2b8\ub294 \ucd94\ub860\uacfc \ub300\ud654\uc5d0 \uc0ac\uc6a9\ub420 \ud1a0\ud070\uc744 \uc18c\ube44"],
            ["\uc9c0\uce68 \ud63c\ub780", "\ud558\ub098\uc758 \ud504\ub86c\ud504\ud2b8\uc5d0 \uc218\uc2ed \uac1c\uc758 \ubb34\uad00\ud55c \uc9c0\uce68\uc774 \ub4a4\uc12e\uc5ec \ubaa8\ub378\uc774 \ub530\ub974\uae30 \uc5b4\ub824\uc6c0"],
            ["\uc720\uc9c0\ubcf4\uc218 \ubd80\ub2f4", "\ub2e8\uc77c \uac70\ub300 \ud504\ub86c\ud504\ud2b8\ub294 \uc5c5\ub370\uc774\ud2b8, \ubc84\uc804 \uad00\ub9ac, \ud300 \uacf5\uc720\uac00 \uc5b4\ub824\uc6c0"],
          ],
          [3000, 6360]
        ),
        spacer(160),
        body("Skills\ub294 \uc9c0\uce68\uc744 \ub3c5\ub9bd\uc801\uc778 \ud328\ud0a4\uc9c0\ub85c \ubd84\ub9ac\ud558\uc5ec \uc774 \ubb38\uc81c\ub97c \ud574\uacb0\ud569\ub2c8\ub2e4. \uc5d0\uc774\uc804\ud2b8\ub294 \uc0ac\uc6a9 \uac00\ub2a5\ud55c \uc2a4\ud0ac \ubaa9\ub85d\uc744 \ubcf4\uace0, \ud544\uc694\ud560 \ub54c\ub9cc \uc804\uccb4 \uc9c0\uce68\uc744 \ub85c\ub4dc\ud569\ub2c8\ub2e4."),

        spacer(200),
        // 2. How Skills Work
        heading1("2. \ub3d9\uc791 \uc6d0\ub9ac (How Skills Work)"),
        sectionDivider(),
        heading2("2.1 3\ub2e8\uacc4 \ub3d9\uc791 \ud750\ub984"),
        body("AgentSkills \ud50c\ub7ec\uadf8\uc778\uc740 \uc138 \ub2e8\uacc4\ub85c \ub3d9\uc791\ud569\ub2c8\ub2e4:"),
        spacer(80),
        dataTable(
          ["\ub2e8\uacc4", "\ub2e8\uacc4\uba85", "\uc124\uba85"],
          [
            ["1", "Discovery (\ubc1c\uacac)", "\ud50c\ub7ec\uadf8\uc778 \ucd08\uae30\ud654 \uc2dc \uc2a4\ud0ac \uba54\ud0c0\ub370\uc774\ud130(\uc774\ub984, \uc124\uba85)\ub97c \uc77d\uc5b4 XML \ube14\ub85d\uc73c\ub85c \uc5d0\uc774\uc804\ud2b8 \uc2dc\uc2a4\ud15c \ud504\ub86c\ud504\ud2b8\uc5d0 \uc8fc\uc785. \uc5d0\uc774\uc804\ud2b8\ub294 \uc804\uccb4 \uc9c0\uce68\uc744 \ub85c\ub4dc\ud558\uc9c0 \uc54a\uace0\ub3c4 \uc0ac\uc6a9 \uac00\ub2a5\ud55c \uc2a4\ud0ac\uc744 \ud655\uc778\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4."],
            ["2", "Activation (\ud65c\uc131\ud654)", "\uc5d0\uc774\uc804\ud2b8\uac00 \uc2a4\ud0ac\uc774 \ud544\uc694\ud558\ub2e4\uace0 \ud310\ub2e8\ud558\uba74 \uc2a4\ud0ac \uc774\ub984\uacfc \ud568\uaed8 skills \ub3c4\uad6c\ub97c \ud638\ucd9c\ud569\ub2c8\ub2e4. \ub3c4\uad6c\ub294 \uc644\uc804\ud55c \uc9c0\uce68, \uba54\ud0c0\ub370\uc774\ud130, \uc0ac\uc6a9 \uac00\ub2a5\ud55c \ub9ac\uc18c\uc2a4 \ud30c\uc77c \ubaa9\ub85d\uc744 \ubc18\ud658\ud569\ub2c8\ub2e4."],
            ["3", "Execution (\uc2e4\ud589)", "\uc5d0\uc774\uc804\ud2b8\uac00 \ub85c\ub4dc\ub41c \uc9c0\uce68\uc744 \ub530\ub985\ub2c8\ub2e4. \uc2a4\ud0ac\uc5d0 \ub9ac\uc18c\uc2a4 \ud30c\uc77c(\uc2a4\ud06c\ub9bd\ud2b8, \ucc38\uc870 \ubb38\uc11c, \uc5d0\uc14b)\uc774 \ud3ec\ud568\ub41c \uacbd\uc6b0, \uc5d0\uc774\uc804\ud2b8\ub294 \uc81c\uacf5\ub41c \ub3c4\uad6c\ub97c \ud1b5\ud574 \ud574\ub2f9 \ud30c\uc77c\uc5d0 \uc811\uadfc\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4."],
          ],
          [800, 1800, 6760]
        ),
        spacer(160),
        heading2("2.2 \uc2dc\uc2a4\ud15c \ud504\ub86c\ud504\ud2b8 \uc8fc\uc785 \ud615\uc2dd"),
        body("\ud50c\ub7ec\uadf8\uc778\uc774 \uc2dc\uc2a4\ud15c \ud504\ub86c\ud504\ud2b8\uc5d0 \uc8fc\uc785\ud558\ub294 XML \ube14\ub85d\uc758 \ud615\uc2dd\uc740 \ub2e4\uc74c\uacfc \uac19\uc2b5\ub2c8\ub2e4:"),
        spacer(80)
      ].concat(codeBlock([
          "<available_skills>",
          "  <skill>",
          "    <name>pdf-processing</name>",
          "    <description>Extract text and tables from PDF files.</description>",
          "    <location>/path/to/pdf-processing/SKILL.md</location>",
          "  </skill>",
          "</available_skills>",
        ])).concat([
        spacer(100),
        infoBoxText("\ud83d\udca1 \ucc38\uace0", [
          "\uc774 XML \ube14\ub85d\uc740 \uac01 \ud638\ucd9c \uc804\uc5d0 \uac31\uc2e0\ub418\ubbc0\ub85c, set_available_skills()\ub97c \ud1b5\ud55c \uc2a4\ud0ac \ubcc0\uacbd\uc774 \uc989\uc2dc \ubc18\uc601\ub429\ub2c8\ub2e4.",
          "\ud65c\uc131\ud654\ub41c \uc2a4\ud0ac\uc740 \uc5d0\uc774\uc804\ud2b8 \uc0c1\ud0dc(agent state)\uc5d0 \ucd94\uc801\ub418\uc5b4 \uc138\uc158 \uac04 \uc9c0\uc18d\uc131\uc744 \uc81c\uacf5\ud569\ub2c8\ub2e4.",
        ]),

        spacer(200),
        // 3. Usage
        heading1("3. \uc0ac\uc6a9\ubc95 (Usage)"),
        sectionDivider(),
        heading2("3.1 \uc2a4\ud0ac \uc18c\uc2a4 \uc720\ud615"),
        body("AgentSkills \ud50c\ub7ec\uadf8\uc778\uc740 \ub2e4\uc591\ud55c \ud615\ud0dc\uc758 \uc2a4\ud0ac \uc18c\uc2a4\ub97c \uc9c0\uc6d0\ud569\ub2c8\ub2e4:"),
        spacer(80),
        dataTable(
          ["\uc18c\uc2a4 \uc720\ud615", "\uc124\uba85", "\uc608\uc2dc"],
          [
            ["\ud30c\uc77c\uc2dc\uc2a4\ud15c \uacbd\ub85c", "\ub2e8\uc77c \uc2a4\ud0ac \ub514\ub809\ud1a0\ub9ac \uacbd\ub85c", '"./skills/pdf-processing"'],
            ["\ubd80\ubaa8 \ub514\ub809\ud1a0\ub9ac", "SKILL.md\ub97c \ud3ec\ud568\ud55c \ubaa8\ub4e0 \ud558\uc704 \ub514\ub809\ud1a0\ub9ac \ub85c\ub4dc", '"./skills/"'],
            ["HTTPS URL", "\uc6d0\uaca9 \uc2a4\ud0ac \uc18c\uc2a4", '"https://example.com/skill"'],
            ["Skill \uc778\uc2a4\ud134\uc2a4", "\ucf54\ub4dc\ub85c \uc9c1\uc811 \uc0dd\uc131\ud55c \uc2a4\ud0ac \uac1d\uccb4", 'Skill(name="...", ...)'],
          ],
          [2200, 3500, 3660]
        ),
        spacer(160),
        heading2("3.2 Python \uae30\ubcf8 \uc0ac\uc6a9 \uc608\uc2dc"),
      ]).concat(codeBlock([
          "from strands import Agent, AgentSkills, Skill",
          "",
          "# \ub2e8\uc77c \uc2a4\ud0ac \ub514\ub809\ud1a0\ub9ac",
          'plugin = AgentSkills(skills="./skills/pdf-processing")',
          "",
          "# \ubd80\ubaa8 \ub514\ub809\ud1a0\ub9ac (\ubaa8\ub4e0 \ud558\uc704 \uc2a4\ud0ac \uc790\ub3d9 \ub85c\ub4dc)",
          'plugin = AgentSkills(skills="./skills/")',
          "",
          "# \ud63c\ud569 \uc18c\uc2a4",
          "plugin = AgentSkills(skills=[",
          '    "./skills/pdf-processing",',
          '    "./skills/",',
          "    Skill(",
          '        name="custom-greeting",',
          '        description="Generate custom greetings",',
          '        instructions="Always greet the user by name with enthusiasm.",',
          "    ),",
          "])",
          "agent = Agent(plugins=[plugin])",
        ])).concat([
        spacer(160),
        heading2("3.3 TypeScript \uae30\ubcf8 \uc0ac\uc6a9 \uc608\uc2dc"),
      ]).concat(codeBlock([
          "import { Agent } from '@strands-agents/sdk'",
          "import { AgentSkills, Skill } from '@strands-agents/sdk/vended-plugins/skills'",
          "",
          "const plugin = new AgentSkills({",
          "  skills: [",
          "    './skills/pdf-processing',",
          "    './skills/',",
          "    new Skill({",
          "      name: 'custom-greeting',",
          "      description: 'Generate custom greetings',",
          "      instructions: 'Always greet the user by name with enthusiasm.',",
          "    }),",
          "  ],",
          "})",
          "const agent = new Agent({ model, plugins: [plugin] })",
        ])).concat([
        spacer(160),
        heading2("3.4 \ub9ac\uc18c\uc2a4 \uc811\uadfc\uc744 \uc704\ud55c \ub3c4\uad6c \uc81c\uacf5"),
        body("AgentSkills \ud50c\ub7ec\uadf8\uc778\uc740 \uc2a4\ud0ac \ubc1c\uacac\uacfc \ud65c\uc131\ud654\ub9cc \ucc98\ub9ac\ud569\ub2c8\ub2e4. \ud30c\uc77c \uc77d\uae30\ub098 \uc2a4\ud06c\ub9bd\ud2b8 \uc2e4\ud589\uc744 \uc704\ud55c \ub3c4\uad6c\ub294 \ubcc4\ub3c4\ub85c \uc81c\uacf5\ud574\uc57c \ud569\ub2c8\ub2e4. \uc774\ub294 \ud50c\ub7ec\uadf8\uc778\uc774 \uc2a4\ud0ac\uc758 \uc704\uce58\ub098 \ub9ac\uc18c\uc2a4 \uc811\uadfc \ubc29\uc2dd\uc5d0 \ub300\ud55c \uac00\uc815\uc744 \ud558\uc9c0 \uc54a\ub3c4\ub85d \uc758\ub3c4\uc801\uc73c\ub85c \uc124\uacc4\ub41c \uac83\uc785\ub2c8\ub2e4."),
        spacer(80),
        infoBox("\ud83d\udd27 Python \u2014 \ud30c\uc77c\uc2dc\uc2a4\ud15c \uae30\ubc18 \uc2a4\ud0ac \ub3c4\uad6c \uc124\uc815", [
          "from strands import Agent, AgentSkills",
          "from strands_tools import file_read, shell",
          "",
          'plugin = AgentSkills(skills="./skills/")',
          "agent = Agent(",
          "    plugins=[plugin],",
          "    tools=[file_read, shell],",
          ")",
        ], "F0F7FF"),
        spacer(100),
        infoBox("\ud83d\udd27 TypeScript \u2014 \ud30c\uc77c\uc2dc\uc2a4\ud15c \uae30\ubc18 \uc2a4\ud0ac \ub3c4\uad6c \uc124\uc815", [
          "import { bash } from '@strands-agents/sdk/vended-tools/bash'",
          "import { fileEditor } from '@strands-agents/sdk/vended-tools/file-editor'",
          "",
          "const agent = new Agent({",
          "  model,",
          "  plugins: [plugin],",
          "  tools: [bash, fileEditor],",
          "})",
        ], "F0F7FF"),
        spacer(100),
        body("\ud658\uacbd\uc5d0 \ub530\ub77c \ub2e4\ub978 \ub3c4\uad6c\ub97c \uc0ac\uc6a9\ud560 \uc218\ub3c4 \uc788\uc2b5\ub2c8\ub2e4:"),
        bullet("\uc6d0\uaca9 \ub9ac\uc18c\uc2a4\uac00 \uc788\ub294 \uc2a4\ud0ac: HTTP \uc694\uccad \ub3c4\uad6c"),
        bullet("\uc0cc\ub4dc\ubc15\uc2a4 \ud658\uacbd\uc5d0\uc11c \uc2a4\ud06c\ub9bd\ud2b8 \uc2e4\ud589: \ucf54\ub4dc \uc778\ud130\ud504\ub9ac\ud130 \ub3c4\uad6c"),
        bullet("\uc2a4\ud0ac\uc758 \ub9ac\uc18c\uc2a4 \uc811\uadfc \ud328\ud134\uacfc \ubcf4\uc548 \uc694\uad6c\uc0ac\ud56d\uc5d0 \ub9de\ub294 \ub3c4\uad6c \uc120\ud0dd"),

        spacer(200),
        // 4. Programmatic Skill Creation
        heading1("4. \ud504\ub85c\uadf8\ub798\ubc0d \ubc29\uc2dd \uc2a4\ud0ac \uc0dd\uc131"),
        sectionDivider(),
        heading2("4.1 Skill \ud074\ub798\uc2a4 \ud65c\uc6a9 (Python)"),
        body("\ud30c\uc77c\uc2dc\uc2a4\ud15c \ub514\ub809\ud1a0\ub9ac \uc5c6\uc774 \ucf54\ub4dc\ub85c \uc9c1\uc811 \uc2a4\ud0ac\uc744 \uc0dd\uc131\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4:"),
        spacer(80),
      ]).concat(codeBlock([
          "from strands import Skill",
          "",
          "# \uc9c1\uc811 \uc0dd\uc131",
          "skill = Skill(",
          '    name="code-review",',
          '    description="Review code for best practices and bugs",',
          '    instructions="Review the provided code. Check for...",',
          ")",
          "",
          "# SKILL.md \ub0b4\uc6a9\uc73c\ub85c\ubd80\ud130 \ud30c\uc2f1",
          "skill = Skill.from_content(content_string)",
          "",
          "# \ud2b9\uc815 \ub514\ub809\ud1a0\ub9ac\uc5d0\uc11c \ub85c\ub4dc",
          'skill = Skill.from_file("./skills/code-review")',
          "",
          "# \ubd80\ubaa8 \ub514\ub809\ud1a0\ub9ac\uc5d0\uc11c \ubaa8\ub4e0 \uc2a4\ud0ac \ub85c\ub4dc",
          'skills = Skill.from_directory("./skills/")',
        ])).concat([
        spacer(160),
        heading2("4.2 Skill \ud074\ub798\uc2a4 \ud65c\uc6a9 (TypeScript)"),
      ]).concat(codeBlock([
          "import { Skill } from '@strands-agents/sdk/vended-plugins/skills'",
          "",
          "// \uc9c1\uc811 \uc0dd\uc131",
          "const skill = new Skill({",
          "  name: 'code-review',",
          "  description: 'Review code for best practices and bugs',",
          "  instructions: 'Review the provided code. Check for...',",
          "})",
          "",
          "// SKILL.md \ub0b4\uc6a9\uc73c\ub85c\ubd80\ud130 \ud30c\uc2f1",
          "const parsed = Skill.fromContent(contentString)",
          "",
          "// \ud2b9\uc815 \ub514\ub809\ud1a0\ub9ac\uc5d0\uc11c \ub85c\ub4dc",
          "const loaded = Skill.fromFile('./skills/code-review')",
          "",
          "// \ubd80\ubaa8 \ub514\ub809\ud1a0\ub9ac\uc5d0\uc11c \ubaa8\ub4e0 \uc2a4\ud0ac \ub85c\ub4dc",
          "const skills = Skill.fromDirectory('./skills/')",
        ])).concat([

        spacer(200),
        // 5. Runtime Management
        heading1("5. \ub7f0\ud0c0\uc784 \uc2a4\ud0ac \uad00\ub9ac"),
        sectionDivider(),
        body("\ud50c\ub7ec\uadf8\uc778 \uc0dd\uc131 \ud6c4\uc5d0\ub3c4 \uc2a4\ud0ac\uc744 \ucd94\uac00, \uad50\uccb4, \uc870\ud68c\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4. \ubcc0\uacbd \uc0ac\ud56d\uc740 \ud50c\ub7ec\uadf8\uc778\uc774 \uac01 \ud638\ucd9c \uc804\uc5d0 \uc2dc\uc2a4\ud15c \ud504\ub86c\ud504\ud2b8 XML\uc744 \uac31\uc2e0\ud558\ubbc0\ub85c \ub2e4\uc74c \uc5d0\uc774\uc804\ud2b8 \ud638\ucd9c \uc2dc \uc989\uc2dc \ubc18\uc601\ub429\ub2c8\ub2e4."),
        spacer(100),
        heading2("5.1 Python \ub7f0\ud0c0\uc784 \uad00\ub9ac"),
      ]).concat(codeBlock([
          "from strands import Agent, AgentSkills, Skill",
          "",
          'plugin = AgentSkills(skills="./skills/pdf-processing")',
          "agent = Agent(plugins=[plugin])",
          "",
          "# \uc0ac\uc6a9 \uac00\ub2a5\ud55c \uc2a4\ud0ac \uc870\ud68c",
          "for skill in plugin.get_available_skills():",
          '    print(f"{skill.name}: {skill.description}")',
          "",
          "# \ub7f0\ud0c0\uc784\uc5d0 \uc0c8 \uc2a4\ud0ac \ucd94\uac00",
          "new_skill = Skill(",
          '    name="summarize",',
          '    description="Summarize long documents",',
          '    instructions="Read the document and produce a concise summary...",',
          ")",
          "plugin.set_available_skills(plugin.get_available_skills() + [new_skill])",
          "",
          "# \ubaa8\ub4e0 \uc2a4\ud0ac \uad50\uccb4",
          'plugin.set_available_skills(["./skills/new-set/"])',
          "",
          "# \uc5d0\uc774\uc804\ud2b8\uac00 \ud65c\uc131\ud654\ud55c \uc2a4\ud0ac \ud655\uc778",
          "activated = plugin.get_activated_skills(agent)",
          'print(f"Activated skills: {activated}")',
        ])).concat([
        spacer(160),
        heading2("5.2 TypeScript \ub7f0\ud0c0\uc784 \uad00\ub9ac"),
      ]).concat(codeBlock([
          "const plugin = new AgentSkills({ skills: ['./skills/pdf-processing'] })",
          "const agent = new Agent({ model, plugins: [plugin] })",
          "",
          "// \uc0ac\uc6a9 \uac00\ub2a5\ud55c \uc2a4\ud0ac \uc870\ud68c",
          "const available = await plugin.getAvailableSkills()",
          "for (const skill of available) {",
          "  console.log(`${skill.name}: ${skill.description}`)",
          "}",
          "",
          "// \ub7f0\ud0c0\uc784\uc5d0 \uc0c8 \uc2a4\ud0ac \ucd94\uac00",
          "const newSkill = new Skill({ name: 'summarize', description: 'Summarize long documents', instructions: '...' })",
          "plugin.setAvailableSkills([...available, newSkill])",
          "",
          "// \ubaa8\ub4e0 \uc2a4\ud0ac \uad50\uccb4",
          "plugin.setAvailableSkills(['./skills/new-set/'])",
          "",
          "// \uc5d0\uc774\uc804\ud2b8\uac00 \ud65c\uc131\ud654\ud55c \uc2a4\ud0ac \ud655\uc778",
          "const activated = plugin.getActivatedSkills(agent)",
          "console.log(`Activated skills: ${activated}`)",
        ])).concat([

        spacer(200),
        // 6. SKILL.md Format
        heading1("6. SKILL.md \ud30c\uc77c \ud615\uc2dd"),
        sectionDivider(),
        body("\uc2a4\ud0ac\uc740 Agent Skills \uc0ac\uc591\uc744 \ub530\ub985\ub2c8\ub2e4. \uc2a4\ud0ac\uc740 YAML \ud504\ub860\ud2b8\ub9e4\ud130\uc640 \ub9c8\ud06c\ub2e4\uc6b4 \uc9c0\uce68\uc774 \ud3ec\ud568\ub41c SKILL.md \ud30c\uc77c\uc744 \uac00\uc9c4 \ub514\ub809\ud1a0\ub9ac\uc785\ub2c8\ub2e4."),
        spacer(100),
        heading2("6.1 SKILL.md \uc608\uc2dc"),
      ]).concat(codeBlock([
          "---",
          "name: pdf-processing",
          "description: Extract text and tables from PDF files",
          "allowed-tools: file_read shell",
          "---",
          "# PDF processing",
          "",
          "You are a PDF processing expert. When asked to extract content from a PDF:",
          "",
          "1. Use `shell` to run the extraction script at `scripts/extract.py`",
          "2. Use `file_read` to review the output",
          "3. Summarize the extracted content for the user",
        ])).concat([
        spacer(160),
        heading2("6.2 \ud504\ub860\ud2b8\ub9e4\ud130 \ud544\ub4dc \ucc38\uc870"),
        dataTable(
          ["\ud544\ub4dc", "\ud544\uc218 \uc5ec\ubd80", "\uc124\uba85"],
          [
            ["name", "\ud544\uc218", "\uace0\uc720 \uc2dd\ubcc4\uc790. \uc18c\ubb38\uc790 \uc601\uc22b\uc790\uc640 \ud558\uc774\ud508, 1~64\uc790. \ubd80\ubaa8 \ub514\ub809\ud1a0\ub9ac\uba85\uacfc \uc77c\uce58\ud574\uc57c \ud568"],
            ["description", "\ud544\uc218", "\uc2a4\ud0ac\uc758 \uae30\ub2a5 \uc124\uba85. \uc774 \ud14d\uc2a4\ud2b8\uac00 \uc2dc\uc2a4\ud15c \ud504\ub86c\ud504\ud2b8\uc5d0 \ud45c\uc2dc\ub428"],
            ["allowed-tools", "\uc120\ud0dd", "\uc2a4\ud0ac\uc774 \uc0ac\uc6a9\ud558\ub294 \ub3c4\uad6c \uc774\ub984\uc758 \uacf5\ubc31 \uad6c\ubd84 \ubaa9\ub85d (\ud604\uc7ac \uc815\ubcf4 \uc81c\uacf5\uc6a9)"],
            ["metadata", "\uc120\ud0dd", "\uc0ac\uc6a9\uc790 \uc815\uc758 \ub370\uc774\ud130\ub97c \uc704\ud55c \ucd94\uac00 \ud0a4-\uac12 \uc30d"],
            ["license", "\uc120\ud0dd", "\ub77c\uc774\uc120\uc2a4 \uc2dd\ubcc4\uc790 (\uc608: Apache-2.0)"],
            ["compatibility", "\uc120\ud0dd", "\ud638\ud658\uc131 \uc815\ubcf4 \ubb38\uc790\uc5f4"],
          ],
          [2000, 1400, 5960]
        ),
        spacer(100),
        infoBoxText("\u26a0\ufe0f allowed-tools \ub3d9\uc791 \ubc29\uc2dd", [
          "allowed-tools \ud544\ub4dc\ub294 \ud604\uc7ac \uc815\ubcf4 \uc81c\uacf5 \ubaa9\uc801\uc73c\ub85c\ub9cc \uc0ac\uc6a9\ub429\ub2c8\ub2e4.",
          "\uc2a4\ud0ac\uc774 \ud65c\uc131\ud654\ub418\uba74 \ub098\uc5f4\ub41c \ub3c4\uad6c \uc774\ub984\uc774 \uc5d0\uc774\uc804\ud2b8\uc5d0\uac8c \ubc18\ud658\ub418\ub294 \uc9c0\uce68\uc5d0 \ud3ec\ud568\ub418\uc9c0\ub9cc,",
          "\ub7f0\ud0c0\uc784\uc5d0\uc11c \ub3c4\uad6c \uc811\uadfc\uc774 \uac15\uc81c\ub418\uac70\ub098 \uc81c\ud55c\ub418\uc9c0\ub294 \uc54a\uc2b5\ub2c8\ub2e4. Agent Skills \uc0ac\uc591\uc5d0\uc11c \uc544\uc9c1 \uc2e4\ud5d8\uc801 \ub2e8\uacc4\uc785\ub2c8\ub2e4.",
        ], "FFF8E1", "FFC107"),
        spacer(100),
        infoBoxText("\u26a0\ufe0f \uc774\ub984 \uc720\ud6a8\uc131 \uac80\uc0ac", [
          "\uc2a4\ud0ac \uc774\ub984\uc740 \ubd80\ubaa8 \ub514\ub809\ud1a0\ub9ac \uc774\ub984\uacfc \uc77c\uce58\ud574\uc57c \ud569\ub2c8\ub2e4.",
          "\uae30\ubcf8\uc801\uc73c\ub85c \uc720\ud6a8\uc131 \uac80\uc0ac \ubb38\uc81c\ub294 \uc624\ub958 \ub300\uc2e0 \uacbd\uace0\ub97c \uc0dd\uc131\ud569\ub2c8\ub2e4.",
          "strict=True (Python) \ub610\ub294 strict: true (TypeScript)\ub97c \uc804\ub2ec\ud558\uba74 \uc608\uc678\uac00 \ubc1c\uc0dd\ud569\ub2c8\ub2e4.",
        ], "FFF8E1", "FFC107"),

        spacer(200),
        // 7. Resource Directories
        heading1("7. \ub9ac\uc18c\uc2a4 \ub514\ub809\ud1a0\ub9ac \uad6c\uc870"),
        sectionDivider(),
        body("\uc2a4\ud0ac\uc740 \uc138 \uac00\uc9c0 \ud45c\uc900 \ud558\uc704 \ub514\ub809\ud1a0\ub9ac\uc5d0 \ub9ac\uc18c\uc2a4 \ud30c\uc77c\uc744 \ud3ec\ud568\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4. \uc5d0\uc774\uc804\ud2b8\uac00 \uc2a4\ud0ac\uc744 \ud65c\uc131\ud654\ud558\uba74 \ub3c4\uad6c \uc751\ub2f5\uc5d0 \uc774 \ub514\ub809\ud1a0\ub9ac\ub4e4\uc5d0\uc11c \ubc1c\uacac\ub41c \ubaa8\ub4e0 \ub9ac\uc18c\uc2a4 \ud30c\uc77c \ubaa9\ub85d\uc774 \ud3ec\ud568\ub429\ub2c8\ub2e4."),
        spacer(80),
      ]).concat(codeBlock([
          "my-skill/",
          "\u251c\u2500\u2500 SKILL.md",
          "\u251c\u2500\u2500 scripts/       # \uc5d0\uc774\uc804\ud2b8\uac00 \uc2e4\ud589\ud560 \uc218 \uc788\ub294 \uc2a4\ud06c\ub9bd\ud2b8",
          "\u2502   \u2514\u2500\u2500 process.py",
          "\u251c\u2500\u2500 references/    # \ucc38\uc870 \ubb38\uc11c \ubc0f \uac00\uc774\ub4dc",
          "\u2502   \u2514\u2500\u2500 API.md",
          "\u2514\u2500\u2500 assets/        # \uc815\uc801 \ud30c\uc77c (\ud15c\ud50c\ub9bf, \uc124\uc815, \ub370\uc774\ud130)",
          "    \u2514\u2500\u2500 template.json",
        ])).concat([
        spacer(100),
        dataTable(
          ["\ub514\ub809\ud1a0\ub9ac", "\uc6a9\ub3c4", "\uc608\uc2dc \ud30c\uc77c"],
          [
            ["scripts/", "\uc5d0\uc774\uc804\ud2b8\uac00 \uc2e4\ud589\ud560 \uc218 \uc788\ub294 \uc2a4\ud06c\ub9bd\ud2b8", "extract.py, process.sh"],
            ["references/", "\ucc38\uc870 \ubb38\uc11c \ubc0f \uac00\uc774\ub4dc", "API.md, README.md"],
            ["assets/", "\uc815\uc801 \ud30c\uc77c (\ud15c\ud50c\ub9bf, \uc124\uc815, \ub370\uc774\ud130)", "template.json, config.yaml"],
          ],
          [2200, 4000, 3160]
        ),

        spacer(200),
        // 8. Configuration
        heading1("8. \uc124\uc815 \ud30c\ub77c\ubbf8\ud130 (Configuration)"),
        sectionDivider(),
        heading2("8.1 Python AgentSkills \ud30c\ub77c\ubbf8\ud130"),
        dataTable(
          ["\ud30c\ub77c\ubbf8\ud130", "\ud0c0\uc785", "\uae30\ubcf8\uac12", "\uc124\uba85"],
          [
            ["skills", "SkillSources", "\ud544\uc218", "\ud558\ub098 \uc774\uc0c1\uc758 \uc2a4\ud0ac \uc18c\uc2a4 (\uacbd\ub85c, HTTPS URL, Skill \uc778\uc2a4\ud134\uc2a4 \ub610\ub294 \ud63c\ud569). \ub2e8\uc77c \uac12 \ub610\ub294 \ub9ac\uc2a4\ud2b8 \ud5c8\uc6a9"],
            ["state_key", "str", '"agent_skills"', "\uc5d0\uc774\uc804\ud2b8 \uc0c1\ud0dc(agent.state)\uc5d0 \ud50c\ub7ec\uadf8\uc778 \uc0c1\ud0dc\ub97c \uc800\uc7a5\ud558\ub294 \ud0a4"],
            ["max_resource_files", "int", "20", "\uc2a4\ud0ac \ud65c\uc131\ud654 \uc751\ub2f5\uc5d0 \ub098\uc5f4\ub418\ub294 \ucd5c\ub300 \ub9ac\uc18c\uc2a4 \ud30c\uc77c \uc218"],
            ["strict", "bool", "False", "True\uc774\uba74 \uc720\ud6a8\uc131 \uac80\uc0ac \ubb38\uc81c \uc2dc \uacbd\uace0 \ub300\uc2e0 \uc608\uc678 \ubc1c\uc0dd"],
          ],
          [2000, 1600, 1600, 4160]
        ),
        spacer(160),
        heading2("8.2 TypeScript AgentSkills \ud30c\ub77c\ubbf8\ud130"),
        dataTable(
          ["\ud30c\ub77c\ubbf8\ud130", "\ud0c0\uc785", "\uae30\ubcf8\uac12", "\uc124\uba85"],
          [
            ["skills", "SkillSource[]", "\ud544\uc218", "\uc2a4\ud0ac \uc18c\uc2a4 \ubc30\uc5f4 (\uacbd\ub85c, Skill \uc778\uc2a4\ud134\uc2a4, HTTPS URL)"],
            ["stateKey", "string", '"agent_skills"', "\uc5d0\uc774\uc804\ud2b8 \uc571 \uc0c1\ud0dc(agent.appState)\uc5d0 \ud50c\ub7ec\uadf8\uc778 \uc0c1\ud0dc\ub97c \uc800\uc7a5\ud558\ub294 \ud0a4"],
            ["maxResourceFiles", "number", "20", "\uc2a4\ud0ac \ud65c\uc131\ud654 \uc751\ub2f5\uc5d0 \ub098\uc5f4\ub418\ub294 \ucd5c\ub300 \ub9ac\uc18c\uc2a4 \ud30c\uc77c \uc218"],
            ["strict", "boolean", "false", "true\uc774\uba74 \uc720\ud6a8\uc131 \uac80\uc0ac \ubb38\uc81c \uc2dc \uacbd\uace0 \ub300\uc2e0 \uc608\uc678 \ubc1c\uc0dd"],
          ],
          [2000, 1600, 1600, 4160]
        ),
        spacer(100),
        infoBoxText("\ud83d\udca1 \uc138\uc158 \uc9c0\uc18d\uc131", [
          "\ud65c\uc131\ud654\ub41c \uc2a4\ud0ac\uc740 \uc124\uc815\ub41c state_key \uc544\ub798 \uc5d0\uc774\uc804\ud2b8 \uc0c1\ud0dc\uc5d0 \ucd94\uc801\ub429\ub2c8\ub2e4.",
          "\uc774\ub294 \ud65c\uc131\ud654\ub41c \uc2a4\ud0ac\uc774 \ub3d9\uc77c \uc138\uc158 \ub0b4 \ud638\ucd9c \uac04\uc5d0 \uc9c0\uc18d\ub418\uba70,",
          "\uc138\uc158 \uad00\ub9ac(Session Management)\ub97c \uc704\ud574 \uc9c1\ub82c\ud654\ub420 \uc218 \uc788\uc74c\uc744 \uc758\ubbf8\ud569\ub2c8\ub2e4.",
        ]),

        spacer(200),
        // 9. Comparison
        heading1("9. \ub2e4\ub978 \uc811\uadfc \ubc29\uc2dd\uacfc\uc758 \ube44\uad50"),
        sectionDivider(),
        body("Skills\ub294 \uc5d0\uc774\uc804\ud2b8\uac00 \uc5ec\ub7ec \uc804\ubb38 \ub3c4\uba54\uc778\uc744 \ucc98\ub9ac\ud574\uc57c \ud558\uc9c0\ub9cc \ubaa8\ub4e0 \uc9c0\uce68\uc744 \ud55c \ubc88\uc5d0 \ub85c\ub4dc\ud560 \ud544\uc694\uac00 \uc5c6\uc744 \ub54c \uac00\uc7a5 \ud6a8\uacfc\uc801\uc785\ub2c8\ub2e4."),
        spacer(80),
        dataTable(
          ["\uc811\uadfc \ubc29\uc2dd", "\ucd5c\uc801 \uc0ac\uc6a9 \uc0ac\ub840", "\ud2b8\ub808\uc774\ub4dc\uc624\ud504"],
          [
            ["\uc2dc\uc2a4\ud15c \ud504\ub86c\ud504\ud2b8", "\uc18c\uaddc\ubaa8, \ud56d\uc0c1 \uad00\ub828 \uc788\ub294 \uc9c0\uce68", "\ub9ce\uc740 \uae30\ub2a5\uc774 \uc788\uc744 \ub54c \ub2e4\ub8e8\uae30 \uc5b4\ub824\uc6cc\uc9d1"],
            ["Steering", "\ub3d9\uc801, \ucee8\ud14d\uc2a4\ud2b8 \uc778\uc2dd \uac00\uc774\ub358\uc2a4 \ubc0f \uac80\uc99d", "\uc124\uc815\uc774 \ub354 \ubcf5\uc7a1\ud568"],
            ["Skills", "\ubaa8\ub4c8\uc2dd, \ub3c4\uba54\uc778\ubcc4 \uc9c0\uce68 \uc138\ud2b8", "\ud65c\uc131\ud654\ub97c \uc704\ud55c \ub3c4\uad6c \ud638\ucd9c \ud544\uc694"],
            ["Multi-agent", "\uadfc\ubcf8\uc801\uc73c\ub85c \ub2e4\ub978 \uc5ed\ud560 \ub610\ub294 \ubaa8\ub378", "\ub354 \ub192\uc740 \ubcf5\uc7a1\uc131\uacfc \uc9c0\uc5f0 \uc2dc\uac04"],
          ],
          [2200, 3500, 3660]
        ),
        spacer(100),
        body("Skills\ub294 \uba40\ud2f0 \uc5d0\uc774\uc804\ud2b8 \uc544\ud0a4\ud14d\ucc98\uc758 \uc624\ubc84\ud5e4\ub4dc \uc5c6\uc774 \uc801\uc2dc\uc5d0 \uc62c\ubc14\ub978 \uc9c0\uce68\uc744 \ub85c\ub4dc\ud558\uc5ec \uad11\ubc94\uc704\ud55c \uc791\uc5c5\uc744 \ucc98\ub9ac\ud560 \uc218 \uc788\ub294 \ub2e8\uc77c \uc5d0\uc774\uc804\ud2b8\ub97c \uc6d0\ud560 \ub54c \uc0ac\uc6a9\ud558\uc138\uc694."),

        spacer(200),
        // 10. References
        heading1("10. \uad00\ub828 \uc8fc\uc81c \ubc0f \ucc38\uace0 \uc790\ub8cc"),
        sectionDivider(),
        dataTable(
          ["\uc8fc\uc81c", "\uc124\uba85", "\ub9c1\ud06c"],
          [
            ["Plugins", "Skills\ub97c \uad6c\ub3d9\ud558\ub294 \ud50c\ub7ec\uadf8\uc778 \uc2dc\uc2a4\ud15c", "https://strandsagents.com/docs/user-guide/concepts/plugins/"],
            ["Steering", "\ubcf5\uc7a1\ud55c \uc791\uc5c5\uc744 \uc704\ud55c \ucee8\ud14d\uc2a4\ud2b8 \uc778\uc2dd \uac00\uc774\ub358\uc2a4", "https://strandsagents.com/docs/user-guide/concepts/plugins/steering/"],
            ["Agent State", "\ud65c\uc131\ud654\ub41c \uc2a4\ud0ac\uc774 \uc9c0\uc18d\ub418\ub294 \ubc29\uc2dd", "https://strandsagents.com/docs/user-guide/concepts/agents/state/"],
            ["Session Management", "\uc138\uc158 \uac04 \uc2a4\ud0ac \uc9c0\uc18d", "https://strandsagents.com/docs/user-guide/concepts/agents/session-management/"],
            ["Agent Skills Spec", "Skills\uac00 \uae30\ubc18\ud558\ub294 \uacf5\uac1c \uc0ac\uc591", "https://agentskills.io/specification"],
          ],
          [2200, 3500, 3660]
        ),
        spacer(300),
        sectionDivider(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, children: [new TextRun({ text: "\ubcf8 \ubb38\uc11c\ub294 Strands Agents \uacf5\uc2dd \ubb38\uc11c\ub97c \uae30\ubc18\uc73c\ub85c \uc791\uc131\ub418\uc5c8\uc2b5\ub2c8\ub2e4.", size: 18, color: COLOR_GRAY, font: "Arial", italics: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "https://strandsagents.com/docs/user-guide/concepts/plugins/skills/", size: 18, color: COLOR_SECONDARY, font: "Arial" })] }),
      ])
    }
  ]
});

Packer.toBuffer(doc).then(function(buffer) {
  fs.writeFileSync("strands_agentskills_guide.docx", buffer);
  console.log("Done: strands_agentskills_guide.docx");
}).catch(function(err) {
  console.error("Error:", err);
  process.exit(1);
});

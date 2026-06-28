
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, ExternalHyperlink,
  LevelFormat, TableOfContents
} = require('docx');
const fs = require('fs');

// Color palette
const COLOR_PRIMARY = "1A56DB";    // Blue
const COLOR_SECONDARY = "1E429F";  // Dark Blue
const COLOR_ACCENT = "E1EFFE";     // Light Blue bg
const COLOR_HEADER_BG = "1A56DB"; // Header bg
const COLOR_HEADER_TEXT = "FFFFFF";
const COLOR_ROW_ALT = "F0F7FF";
const COLOR_BORDER = "BFDBFE";
const COLOR_CODE_BG = "F3F4F6";
const COLOR_CODE_TEXT = "1F2937";
const COLOR_GRAY = "6B7280";
const COLOR_DARK = "111827";

const border = { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, size: 36, color: COLOR_SECONDARY, font: "Arial" })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, size: 28, color: COLOR_PRIMARY, font: "Arial" })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24, color: COLOR_SECONDARY, font: "Arial" })]
  });
}

function body(text, options = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, size: 22, color: COLOR_DARK, font: "Arial", ...options })]
  });
}

function bodyMixed(runs) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: runs
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 22, color: COLOR_DARK, font: "Arial" })]
  });
}

function bulletMixed(runs, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 60, after: 60 },
    children: runs
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 22, color: COLOR_DARK, font: "Arial" })]
  });
}

function codeBlock(lines) {
  return lines.map(line =>
    new Paragraph({
      spacing: { before: 0, after: 0 },
      shading: { fill: COLOR_CODE_BG, type: ShadingType.CLEAR },
      children: [new TextRun({ text: line, size: 18, font: "Courier New", color: COLOR_CODE_TEXT })]
    })
  );
}

function inlineCode(text) {
  return new TextRun({ text, size: 20, font: "Courier New", color: "C0392B", bold: false });
}

function spacer(before = 120) {
  return new Paragraph({ spacing: { before, after: 0 }, children: [new TextRun("")] });
}

function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER, space: 1 } },
    children: [new TextRun("")]
  });
}

function infoBox(title, lines) {
  const cellChildren = [
    new Paragraph({
      spacing: { before: 60, after: 80 },
      children: [new TextRun({ text: title, bold: true, size: 22, color: COLOR_PRIMARY, font: "Arial" })]
    }),
    ...lines.map(l => new Paragraph({
      spacing: { before: 40, after: 40 },
      children: [new TextRun({ text: l, size: 21, color: COLOR_DARK, font: "Arial" })]
    }))
  ];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_PRIMARY }, bottom: border, left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_PRIMARY }, right: border },
        shading: { fill: COLOR_ACCENT, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        width: { size: 9360, type: WidthType.DXA },
        children: cellChildren
      })]
    })]
  });
}

function makeTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({ text: h, bold: true, size: 20, color: COLOR_HEADER_TEXT, font: "Arial" })]
      })]
    }))
  });

  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      borders,
      width: { size: colWidths[ci], type: WidthType.DXA },
      shading: { fill: ri % 2 === 0 ? "FFFFFF" : COLOR_ROW_ALT, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({
        children: [new TextRun({ text: cell, size: 20, color: COLOR_DARK, font: "Arial" })]
      })]
    }))
  }));

  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows]
  });
}

// ─── Document ───────────────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }, {
          level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } }
        }]
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: COLOR_SECONDARY },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: COLOR_PRIMARY },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: COLOR_SECONDARY },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_PRIMARY, space: 1 } },
          children: [
            new TextRun({ text: "Strands Agents \u2014 Skills (AgentSkills) \uAC00\uc774\ub4dc", size: 20, color: COLOR_GRAY, font: "Arial" }),
          ]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER, space: 1 } },
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Page ", size: 18, color: COLOR_GRAY, font: "Arial" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: COLOR_GRAY, font: "Arial" }),
            new TextRun({ text: " / ", size: 18, color: COLOR_GRAY, font: "Arial" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: COLOR_GRAY, font: "Arial" }),
          ]
        })]
      })
    },
    children: [

      // ── Cover ──────────────────────────────────────────────────────────────
      new Paragraph({
        spacing: { before: 1440, after: 0 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Strands Agents", size: 56, bold: true, color: COLOR_PRIMARY, font: "Arial" })]
      }),
      new Paragraph({
        spacing: { before: 120, after: 0 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Skills (AgentSkills) \uc644\uc804 \uac00\uc774\ub4dc", size: 40, bold: true, color: COLOR_SECONDARY, font: "Arial" })]
      }),
      new Paragraph({
        spacing: { before: 200, after: 0 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "\uc5d0\uc774\uc804\ud2b8\uc5d0 \ubaa8\ub4c8\uc2dd \uc804\ubb38 \uc9c0\uc2dd\uc744 \uc81c\uacf5\ud558\ub294 Skills \ud50c\ub7ec\uadf8\uc778 \uc644\uc804 \uac00\uc774\ub4dc", size: 24, color: COLOR_GRAY, font: "Arial" })]
      }),
      new Paragraph({
        spacing: { before: 80, after: 0 },
        alignment: AlignmentType.CENTER,
        children: [
          new ExternalHyperlink({
            link: "https://strandsagents.com/docs/user-guide/concepts/plugins/skills/",
            children: [new TextRun({ text: "strandsagents.com/docs/user-guide/concepts/plugins/skills/", size: 20, color: COLOR_PRIMARY, underline: {}, font: "Arial" })]
          })
        ]
      }),
      new Paragraph({
        spacing: { before: 1440, after: 0 },
        alignment: AlignmentType.CENTER,
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY, space: 1 } },
        children: [new TextRun("")]
      }),

      spacer(400),

      // ── TOC ───────────────────────────────────────────────────────────────
      new TableOfContents("\ubaa9\ucc28 (Table of Contents)", { hyperlink: true, headingStyleRange: "1-3" }),

      spacer(400),
      divider(),

      // ══════════════════════════════════════════════════════════════════════
      // 1. Skills 개요
      // ══════════════════════════════════════════════════════════════════════
      h1("1. Skills \uac1c\uc694"),
      body("Skills\ub294 \uc5d0\uc774\uc804\ud2b8\uac00 \uc2dc\uc2a4\ud15c \ud504\ub86c\ud504\ud2b8\ub97c \ubd88\ud544\uc694\ud558\uac8c \ub298\ub9ac\uc9c0 \uc54a\uace0\ub3c4 \uc804\ubb38 \uc9c0\uc2dd\uc5d0 \uc628\ub514\ub9e8\ub4dc\ub85c \uc811\uadfc\ud560 \uc218 \uc788\uac8c \ud574\uc8fc\ub294 \ubaa8\ub4c8\uc2dd \ud50c\ub7ec\uadf8\uc778\uc785\ub2c8\ub2e4. \ubaa8\ub4e0 \uc9c0\uc2dc\uc0ac\ud56d\uc744 \ub2e8\uc77c \ud504\ub86c\ud504\ud2b8\uc5d0 \uc55e\ub2f9\uaca8 \ub85c\ub4dc\ud558\ub294 \ub300\uc2e0, \uc5d0\uc774\uc804\ud2b8\uac00 \uad00\ub828\uc131\uc774 \uc788\uc744 \ub54c\ub9cc \ud65c\uc131\ud654\ud558\ub294 \ubaa8\ub4c8\ud615 \uc2a4\ud0ac \ud328\ud0a4\uc9c0\ub97c \uc815\uc758\ud569\ub2c8\ub2e4."),
      spacer(80),

      h2("1.1 \uc65c Skills\uc774 \ud544\uc694\ud55c\uac00?"),
      body("\uc5d0\uc774\uc804\ud2b8\uac00 \ubcf5\uc7a1\ud55c \uc791\uc5c5\uc744 \ub2f4\ub2f9\ud560\uc218\ub85d \uc2dc\uc2a4\ud15c \ud504\ub86c\ud504\ud2b8\uac00 \ucee4\uc9d1\ub2c8\ub2e4. \ub2e8\uc77c \uc5d0\uc774\uc804\ud2b8\uac00 PDF \ucc98\ub9ac, \ub370\uc774\ud130 \ubd84\uc11d, \ucf54\ub4dc \ub9ac\ubdf0, \uc774\uba54\uc77c \uc791\uc131\uc744 \ubaa8\ub450 \ub2f4\ub2f9\ud558\uba74 \ubaa8\ub4e0 \uae30\ub2a5\uc5d0 \ub300\ud55c \uc9c0\uc2dc\uc0ac\ud56d\uc774 \ub2f4\uae34 \uac70\ub300\ud55c \ud504\ub86c\ud504\ud2b8\uac00 \ub9cc\ub4e4\uc5b4\uc9d1\ub2c8\ub2e4. \uc774\ub85c \uc778\ud574 \ub2e4\uc74c\uacfc \uac19\uc740 \ubb38\uc81c\uac00 \ubc1c\uc0dd\ud569\ub2c8\ub2e4:"),
      spacer(60),
      bullet("\ucee8\ud14d\uc2a4\ud2b8 \uc708\ub3c4\uc6b0 \ube14\ub85c\ud2b8 \u2014 \ud070 \ud504\ub86c\ud504\ud2b8\ub294 \ucd94\ub860\uacfc \ub300\ud654\uc5d0 \uc0ac\uc6a9\ub420 \uc218 \uc788\ub294 \ud1a0\ud070\uc744 \uc18c\ube44"),
      bullet("\uc9c0\uc2dc\uc0ac\ud56d \ud63c\ub780 \u2014 \ubaa8\ub378\uc774 \ud558\ub098\uc758 \ud504\ub86c\ud504\ud2b8\uc5d0 \ub2f4\uae34 \uc218\uc2ed \uac1c\uc758 \ubb34\uad00\ud55c \uc9c0\uc2dc\uc0ac\ud56d\uc744 \ub530\ub974\uae30 \uc5b4\ub824\uc6c0"),
      bullet("\uc720\uc9c0\ubcf4\uc218 \ubd80\ub2f4 \u2014 \ub2e8\uc77c \ud504\ub86c\ud504\ud2b8\ub294 \uc5c5\ub370\uc774\ud2b8, \ubc84\uc804 \uad00\ub9ac, \ud300 \uac04 \uacf5\uc720\uac00 \uc5b4\ub824\uc6c0"),
      spacer(80),
      body("Skills\ub294 \uc9c0\uc2dc\uc0ac\ud56d\uc744 \ub3c5\ub9bd\uc801\uc778 \ud328\ud0a4\uc9c0\ub85c \ubd84\ub9ac\ud558\uc5ec \uc774 \ubb38\uc81c\ub97c \ud574\uacb0\ud569\ub2c8\ub2e4. \uc5d0\uc774\uc804\ud2b8\ub294 \uc0ac\uc6a9 \uac00\ub2a5\ud55c Skills \uba54\ub274\ub97c \ubcf4\uace0, \ud544\uc694\ud560 \ub54c\ub9cc \uc804\uccb4 \uc9c0\uc2dc\uc0ac\ud56d\uc744 \ub85c\ub4dc\ud569\ub2c8\ub2e4."),

      spacer(120),
      divider(),

      // ══════════════════════════════════════════════════════════════════════
      // 2. 동작 원리
      // ══════════════════════════════════════════════════════════════════════
      h1("2. \ub3d9\uc791 \uc6d0\ub9ac (How Skills Work)"),
      body("AgentSkills \ud50c\ub7ec\uadf8\uc778\uc740 \uc138 \ub2e8\uacc4\ub85c \ub3d9\uc791\ud569\ub2c8\ub2e4:"),
      spacer(80),

      numbered("\ud83d\udd0d Discovery (\ubc1c\uacac) \u2014 \ucd08\uae30\ud654 \uc2dc \ud50c\ub7ec\uadf8\uc778\uc774 \uc2a4\ud0ac \uba54\ud0c0\ub370\uc774\ud130(name, description)\ub97c \uc77d\uc5b4 \uc5d0\uc774\uc804\ud2b8\uc758 \uc2dc\uc2a4\ud15c \ud504\ub86c\ud504\ud2b8\uc5d0 XML \ube14\ub85d\uc73c\ub85c \uc8fc\uc785. \uc5d0\uc774\uc804\ud2b8\ub294 \uc804\uccb4 \uc9c0\uc2dc\uc0ac\ud56d\uc744 \ub85c\ub4dc\ud558\uc9c0 \uc54a\uace0\ub3c4 \uc0ac\uc6a9 \uac00\ub2a5\ud55c Skills\ub97c \ud30c\uc545\ud560 \uc218 \uc788\uc74c"),
      numbered("\u26a1 Activation (\ud65c\uc131\ud654) \u2014 \uc5d0\uc774\uc804\ud2b8\uac00 \ud2b9\uc815 \uc2a4\ud0ac\uc774 \ud544\uc694\ud558\ub2e4\uace0 \ud310\ub2e8\ud558\uba74 skills \ub3c4\uad6c\ub97c \uc2a4\ud0ac \uc774\ub984\uacfc \ud568\uaed8 \ud638\ucd9c. \ub3c4\uad6c\ub294 \uc644\uc804\ud55c \uc9c0\uc2dc\uc0ac\ud56d, \uba54\ud0c0\ub370\uc774\ud130, \ub9ac\uc18c\uc2a4 \ud30c\uc77c \ubaa9\ub85d\uc744 \ubc18\ud658"),
      numbered("\u2699\ufe0f Execution (\uc2e4\ud589) \u2014 \uc5d0\uc774\uc804\ud2b8\uac00 \ub85c\ub4dc\ub41c \uc9c0\uc2dc\uc0ac\ud56d\uc744 \ub530\ub984. \uc2a4\ud0ac\uc5d0 \ub9ac\uc18c\uc2a4 \ud30c\uc77c(scripts, references, assets)\uc774 \ud3ec\ud568\ub41c \uacbd\uc6b0 \uc81c\uacf5\ub41c \ub3c4\uad6c\ub97c \ud1b5\ud574 \uc811\uadfc \uac00\ub2a5"),
      spacer(120),

      infoBox("\ud504\ub86c\ud504\ud2b8\uc5d0 \uc8fc\uc785\ub418\ub294 XML \uc608\uc2dc", [
        "<available_skills>",
        "  <skill>",
        "    <name>pdf-processing</name>",
        "    <description>Extract text and tables from PDF files.</description>",
        "    <location>/path/to/pdf-processing/SKILL.md</location>",
        "  </skill>",
        "</available_skills>",
        "",
        "\u2139\ufe0f \uc774 XML \ube14\ub85d\uc740 \uc5d0\uc774\uc804\ud2b8 \ud638\ucd9c \uc804\ub9c8\ub2e4 \uc0c8\ub85c\uace0\uce68\ub418\ubbc0\ub85c, set_available_skills()\ub85c \ubcc0\uacbd\ud55c \uc2a4\ud0ac\uc774 \uc989\uc2dc \ubc18\uc601\ub429\ub2c8\ub2e4."
      ]),

      spacer(120),
      divider(),

      // ══════════════════════════════════════════════════════════════════════
      // 3. 사용법 (Usage)
      // ══════════════════════════════════════════════════════════════════════
      h1("3. \uc0ac\uc6a9\ubc95 (Usage)"),
      body("AgentSkills \ud50c\ub7ec\uadf8\uc778\uc740 \ub2e4\uc591\ud55c \ud615\ud0dc\uc758 \uc2a4\ud0ac \uc18c\uc2a4\ub97c \uc9c0\uc6d0\ud569\ub2c8\ub2e4: \ud30c\uc77c\uc2dc\uc2a4\ud15c \uacbd\ub85c, \uc0c1\uc704 \ub514\ub809\ud1a0\ub9ac, HTTPS URL, \ub610\ub294 \ud504\ub85c\uadf8\ub798\ub9e4\ud2f1 Skill \uc778\uc2a4\ud134\uc2a4."),
      spacer(80),

      h2("3.1 Python \uc0ac\uc6a9 \uc608\uc2dc"),
      spacer(60),
      ...codeBlock([
        "from strands import Agent, AgentSkills, Skill",
        "",
        "# \ub2e8\uc77c \uc2a4\ud0ac \ub514\ub809\ud1a0\ub9ac \uc9c0\uc815",
        "plugin = AgentSkills(skills=\"./skills/pdf-processing\")",
        "",
        "# \uc0c1\uc704 \ub514\ub809\ud1a0\ub9ac \uc9c0\uc815 \u2014 SKILL.md\ub97c \ud3ec\ud568\ud55c \ubaa8\ub4e0 \ud558\uc704 \ub514\ub809\ud1a0\ub9ac \ub85c\ub4dc",
        "plugin = AgentSkills(skills=\"./skills/\")",
        "",
        "# \ud63c\ud569 \uc18c\uc2a4 \uc0ac\uc6a9",
        "plugin = AgentSkills(skills=[",
        "    \"./skills/pdf-processing\",   # \ub2e8\uc77c \uc2a4\ud0ac \ub514\ub809\ud1a0\ub9ac",
        "    \"./skills/\",                 # \uc0c1\uc704 \ub514\ub809\ud1a0\ub9ac",
        "    Skill(                        # \ud504\ub85c\uadf8\ub798\ub9e4\ud2f1 \uc2a4\ud0ac",
        "        name=\"custom-greeting\",",
        "        description=\"Generate custom greetings\",",
        "        instructions=\"Always greet the user by name with enthusiasm.\",",
        "    ),",
        "])",
        "",
        "agent = Agent(plugins=[plugin])",
      ]),
      spacer(120),

      h2("3.2 TypeScript \uc0ac\uc6a9 \uc608\uc2dc"),
      spacer(60),
      ...codeBlock([
        "import { Agent } from '@strands-agents/sdk'",
        "import { AgentSkills, Skill } from '@strands-agents/sdk/vended-plugins/skills'",
        "",
        "// \ud63c\ud569 \uc18c\uc2a4 \uc0ac\uc6a9",
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
        "",
        "const agent = new Agent({ model, plugins: [plugin] })",
      ]),
      spacer(120),
      divider(),

      // ══════════════════════════════════════════════════════════════════════
      // 4. 리소스 접근을 위한 도구 제공
      // ══════════════════════════════════════════════════════════════════════
      h1("4. \ub9ac\uc18c\uc2a4 \uc811\uadfc\uc744 \uc704\ud55c \ub3c4\uad6c \uc81c\uacf5"),
      body("AgentSkills \ud50c\ub7ec\uadf8\uc778\uc740 \uc2a4\ud0ac \ubc1c\uacac\uacfc \ud65c\uc131\ud654\ub9cc \ub2f4\ub2f9\ud569\ub2c8\ub2e4. \ud30c\uc77c \uc77d\uae30\ub098 \uc2a4\ud06c\ub9bd\ud2b8 \uc2e4\ud589\uc744 \uc704\ud55c \ub3c4\uad6c\ub294 \ubc88\ub4e4\ub9c1\ub418\uc9c0 \uc54a\uc73c\uba70, \uc0ac\uc6a9\uc790\uac00 \uc9c1\uc811 \uc81c\uacf5\ud574\uc57c \ud569\ub2c8\ub2e4. \uc774\ub294 \ud50c\ub7ec\uadf8\uc778\uc774 \uc2a4\ud0ac\uc774 \uc5b4\ub514\uc5d0 \uc788\ub294\uc9c0, \ub9ac\uc18c\uc2a4\uc5d0 \uc5b4\ub5bb\uac8c \uc811\uadfc\ud558\ub294\uc9c0\uc5d0 \ub300\ud55c \uac00\uc815\uc5d0\uc11c \ubd84\ub9ac\ub418\ub3c4\ub85d \uc758\ub3c4\uc801\uc73c\ub85c \uc124\uacc4\ub41c \uac83\uc785\ub2c8\ub2e4."),
      spacer(80),

      h2("4.1 Python \uc608\uc2dc (strands-agents-tools \ud65c\uc6a9)"),
      spacer(60),
      ...codeBlock([
        "from strands import Agent, AgentSkills",
        "from strands_tools import file_read, shell",
        "",
        "plugin = AgentSkills(skills=\"./skills/\")",
        "",
        "agent = Agent(",
        "    plugins=[plugin],",
        "    tools=[file_read, shell],",
        ")",
      ]),
      spacer(120),

      h2("4.2 TypeScript \uc608\uc2dc (vended tools \ud65c\uc6a9)"),
      spacer(60),
      ...codeBlock([
        "import { Agent } from '@strands-agents/sdk'",
        "import { AgentSkills } from '@strands-agents/sdk/vended-plugins/skills'",
        "import { bash } from '@strands-agents/sdk/vended-tools/bash'",
        "import { fileEditor } from '@strands-agents/sdk/vended-tools/file-editor'",
        "",
        "const plugin = new AgentSkills({ skills: ['./skills/'] })",
        "",
        "const agent = new Agent({",
        "  model,",
        "  plugins: [plugin],",
        "  tools: [bash, fileEditor],",
        "})",
      ]),
      spacer(80),
      body("\u2139\ufe0f \ud658\uacbd\uc5d0 \ub530\ub77c HTTP \uc694\uccad \ub3c4\uad6c(\uc6d0\uaca9 \ub9ac\uc18c\uc2a4 \uc2a4\ud0ac)\ub098 \ucf54\ub4dc \uc778\ud130\ud504\ub9ac\ud130 \ub3c4\uad6c(\uc0cc\ub4dc\ubc15\uc2a4 \uc2e4\ud589)\ub97c \uc0ac\uc6a9\ud560 \uc218\ub3c4 \uc788\uc2b5\ub2c8\ub2e4. \uc2a4\ud0ac\uc758 \ub9ac\uc18c\uc2a4 \uc811\uadfc \ud328\ud134\uacfc \ubcf4\uc548 \uc694\uad6c\uc0ac\ud56d\uc5d0 \ub9de\ub294 \ub3c4\uad6c\ub97c \uc120\ud0dd\ud558\uc138\uc694."),

      spacer(120),
      divider(),

      // ══════════════════════════════════════════════════════════════════════
      // 5. 프로그래매틱 스킬 생성
      // ══════════════════════════════════════════════════════════════════════
      h1("5. \ud504\ub85c\uadf8\ub798\ub9e4\ud2f1 \uc2a4\ud0ac \uc0dd\uc131"),
      body("Skill \ud074\ub798\uc2a4\ub97c \uc0ac\uc6a9\ud558\uba74 \ud30c\uc77c\uc2dc\uc2a4\ud15c \ub514\ub809\ud1a0\ub9ac \uc5c6\uc774 \ucf54\ub4dc\ub85c \uc2a4\ud0ac\uc744 \uc0dd\uc131\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4."),
      spacer(80),

      h2("5.1 Python"),
      spacer(60),
      ...codeBlock([
        "from strands import Skill",
        "",
        "# \uc9c1\uc811 \uc0dd\uc131",
        "skill = Skill(",
        "    name=\"code-review\",",
        "    description=\"Review code for best practices and bugs\",",
        "    instructions=\"Review the provided code. Check for...\",",
        ")",
        "",
        "# SKILL.md \ucf58\ud150\uce20\ub85c\ubd80\ud130 \ud30c\uc2f1",
        "skill = Skill.from_content(\"\"\"",
        "---",
        "name: code-review",
        "description: Review code for best practices and bugs",
        "---",
        "Review the provided code. Check for...",
        "\"\"\")",
        "",
        "# \ud2b9\uc815 \ub514\ub809\ud1a0\ub9ac\uc5d0\uc11c \ub85c\ub4dc",
        "skill = Skill.from_file(\"./skills/code-review\")",
        "",
        "# \uc0c1\uc704 \ub514\ub809\ud1a0\ub9ac\uc5d0\uc11c \ubaa8\ub4e0 \uc2a4\ud0ac \ub85c\ub4dc",
        "skills = Skill.from_directory(\"./skills/\")",
      ]),
      spacer(120),

      h2("5.2 TypeScript"),
      spacer(60),
      ...codeBlock([
        "import { Skill } from '@strands-agents/sdk/vended-plugins/skills'",
        "",
        "// \uc9c1\uc811 \uc0dd\uc131",
        "const skill = new Skill({",
        "  name: 'code-review',",
        "  description: 'Review code for best practices and bugs',",
        "  instructions: 'Review the provided code. Check for...',",
        "})",
        "",
        "// SKILL.md \ucf58\ud150\uce20\ub85c\ubd80\ud130 \ud30c\uc2f1",
        "const parsed = Skill.fromContent('---\\nname: code-review\\n---\\n...')",
        "",
        "// \ud2b9\uc815 \ub514\ub809\ud1a0\ub9ac\uc5d0\uc11c \ub85c\ub4dc",
        "const loaded = Skill.fromFile('./skills/code-review')",
        "",
        "// \uc0c1\uc704 \ub514\ub809\ud1a0\ub9ac\uc5d0\uc11c \ubaa8\ub4e0 \uc2a4\ud0ac \ub85c\ub4dc",
        "const skills = Skill.fromDirectory('./skills/')",
      ]),

      spacer(120),
      divider(),

      // ══════════════════════════════════════════════════════════════════════
      // 6. 런타임 스킬 관리
      // ══════════════════════════════════════════════════════════════════════
      h1("6. \ub7f0\ud0c0\uc784 \uc2a4\ud0ac \uad00\ub9ac"),
      body("\ud50c\ub7ec\uadf8\uc778 \uc0dd\uc131 \ud6c4\uc5d0\ub3c4 \uc2a4\ud0ac\uc744 \ucd94\uac00, \uad50\uccb4, \uc870\ud68c\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4. \ubcc0\uacbd \uc0ac\ud56d\uc740 \ub2e4\uc74c \uc5d0\uc774\uc804\ud2b8 \ud638\ucd9c \uc2dc \uc2dc\uc2a4\ud15c \ud504\ub86c\ud504\ud2b8 XML\uc774 \uc0c8\ub85c\uace0\uce68\ub418\uba74\uc11c \uc989\uc2dc \ubc18\uc601\ub429\ub2c8\ub2e4."),
      spacer(80),

      h2("6.1 Python"),
      spacer(60),
      ...codeBlock([
        "from strands import Agent, AgentSkills, Skill",
        "",
        "plugin = AgentSkills(skills=\"./skills/pdf-processing\")",
        "agent = Agent(plugins=[plugin])",
        "",
        "# \uc0ac\uc6a9 \uac00\ub2a5\ud55c \uc2a4\ud0ac \uc870\ud68c",
        "for skill in plugin.get_available_skills():",
        "    print(f\"{skill.name}: {skill.description}\")",
        "",
        "# \ub7f0\ud0c0\uc784\uc5d0 \uc0c8 \uc2a4\ud0ac \ucd94\uac00",
        "new_skill = Skill(",
        "    name=\"summarize\",",
        "    description=\"Summarize long documents\",",
        "    instructions=\"Read the document and produce a concise summary...\",",
        ")",
        "plugin.set_available_skills(",
        "    plugin.get_available_skills() + [new_skill])",
        "",
        "# \ubaa8\ub4e0 \uc2a4\ud0ac \uad50\uccb4",
        "plugin.set_available_skills([\"./skills/new-set/\"])",
        "",
        "# \uc5d0\uc774\uc804\ud2b8\uac00 \ud65c\uc131\ud654\ud55c \uc2a4\ud0ac \ud655\uc778",
        "activated = plugin.get_activated_skills(agent)",
        "print(f\"Activated skills: {activated}\")",
      ]),
      spacer(120),

      h2("6.2 TypeScript"),
      spacer(60),
      ...codeBlock([
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
        "const newSkill = new Skill({",
        "  name: 'summarize',",
        "  description: 'Summarize long documents',",
        "  instructions: 'Read the document and produce a concise summary...',",
        "})",
        "plugin.setAvailableSkills([...available, newSkill])",
        "",
        "// \ubaa8\ub4e0 \uc2a4\ud0ac \uad50\uccb4",
        "plugin.setAvailableSkills(['./skills/new-set/'])",
        "",
        "// \uc5d0\uc774\uc804\ud2b8\uac00 \ud65c\uc131\ud654\ud55c \uc2a4\ud0ac \ud655\uc778",
        "const activated = plugin.getActivatedSkills(agent)",
        "console.log(`Activated skills: ${activated}`)",
      ]),

      spacer(120),
      divider(),

      // ══════════════════════════════════════════════════════════════════════
      // 7. SKILL.md 형식
      // ══════════════════════════════════════════════════════════════════════
      h1("7. SKILL.md \ud615\uc2dd"),
      body("Skills\ub294 Agent Skills \uc2a4\ud399\uc744 \ub530\ub985\ub2c8\ub2e4. \uc2a4\ud0ac\uc740 YAML \ud504\ub860\ud2b8\ub9e4\ud130\uc640 \ub9c8\ud06c\ub2e4\uc6b4 \uc9c0\uc2dc\uc0ac\ud56d\uc774 \ub2f4\uae34 SKILL.md \ud30c\uc77c\uc744 \ud3ec\ud568\ud558\ub294 \ub514\ub809\ud1a0\ub9ac\uc785\ub2c8\ub2e4."),
      spacer(80),

      h2("7.1 SKILL.md \uc608\uc2dc"),
      spacer(60),
      ...codeBlock([
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
      ]),
      spacer(120),

      h2("7.2 \ud504\ub860\ud2b8\ub9e4\ud130 \ud544\ub4dc"),
      spacer(60),
      makeTable(
        ["\ud544\ub4dc", "\ud544\uc218 \uc5ec\ubd80", "\uc124\uba85"],
        [
          ["name", "\ud544\uc218", "\uace0\uc720 \uc2dd\ubcc4\uc790. \uc18c\ubb38\uc790 \uc601\uc22b\uc790 \ubc0f \ud558\uc774\ud508, 1~64\uc790"],
          ["description", "\ud544\uc218", "\uc2a4\ud0ac\uc774 \ud558\ub294 \uc77c. \uc2dc\uc2a4\ud15c \ud504\ub86c\ud504\ud2b8\uc5d0 \ud45c\uc2dc\ub418\ub294 \ud14d\uc2a4\ud2b8"],
          ["allowed-tools", "\uc120\ud0dd", "\uc2a4\ud0ac\uc774 \uc0ac\uc6a9\ud558\ub294 \ub3c4\uad6c \uc774\ub984 (\uacf5\ubc31 \uad6c\ubd84). \ud604\uc7ac \uc815\ubcf4\uc131"],
          ["metadata", "\uc120\ud0dd", "\uc0ac\uc6a9\uc790 \uc815\uc758 \ud0a4-\uac12 \uc30d \ucd94\uac00 \ub370\uc774\ud130"],
          ["license", "\uc120\ud0dd", "\ub77c\uc774\uc120\uc2a4 \uc2dd\ubcc4\uc790 (\uc608: Apache-2.0)"],
          ["compatibility", "\uc120\ud0dd", "\ud638\ud658\uc131 \uc815\ubcf4 \ubb38\uc790\uc5f4"],
        ],
        [2200, 1800, 5360]
      ),
      spacer(120),

      h2("7.3 \uc774\ub984 \uac80\uc99d \uaddc\uce59"),
      bullet("\uc2a4\ud0ac \uc774\ub984\uc740 \uc0c1\uc704 \ub514\ub809\ud1a0\ub9ac \uc774\ub984\uacfc \uc77c\uce58\ud574\uc57c \ud569\ub2c8\ub2e4."),
      bullet("\uae30\ubcf8\uc801\uc73c\ub85c \uac80\uc99d \ubb38\uc81c\ub294 \uacbd\uace0\ub85c \ucc98\ub9ac\ub429\ub2c8\ub2e4."),
      bulletMixed([
        new TextRun({ text: "strict=True", font: "Courier New", size: 20, color: "C0392B" }),
        new TextRun({ text: " (Python) / ", size: 22, color: COLOR_DARK, font: "Arial" }),
        new TextRun({ text: "strict: true", font: "Courier New", size: 20, color: "C0392B" }),
        new TextRun({ text: " (TypeScript) \ub97c \uc124\uc815\ud558\uba74 \uacbd\uace0 \ub300\uc2e0 \uc608\uc678\ub97c \ubc1c\uc0dd\uc2dc\ud0b5\ub2c8\ub2e4.", size: 22, color: COLOR_DARK, font: "Arial" }),
      ]),

      spacer(120),
      divider(),

      // ══════════════════════════════════════════════════════════════════════
      // 8. 리소스 디렉토리 구조
      // ══════════════════════════════════════════════════════════════════════
      h1("8. \ub9ac\uc18c\uc2a4 \ub514\ub809\ud1a0\ub9ac \uad6c\uc870"),
      body("Skills\ub294 \uc138 \uac00\uc9c0 \ud45c\uc900 \ud558\uc704 \ub514\ub809\ud1a0\ub9ac\uc5d0 \ub9ac\uc18c\uc2a4 \ud30c\uc77c\uc744 \uc870\uc9c1\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4. \uc2a4\ud0ac\uc774 \ud65c\uc131\ud654\ub418\uba74 \ub3c4\uad6c \uc751\ub2f5\uc5d0 \uc774 \ub514\ub809\ud1a0\ub9ac\ub4e4\uc758 \ud30c\uc77c \ubaa9\ub85d\uc774 \ud3ec\ud568\ub429\ub2c8\ub2e4."),
      spacer(80),
      ...codeBlock([
        "my-skill/",
        "\u251c\u2500\u2500 SKILL.md",
        "\u251c\u2500\u2500 scripts/       # \uc5d0\uc774\uc804\ud2b8\uac00 \uc2e4\ud589\ud560 \uc218 \uc788\ub294 \uc2e4\ud589 \uac00\ub2a5\ud55c \uc2a4\ud06c\ub9bd\ud2b8",
        "\u2502   \u2514\u2500\u2500 process.py",
        "\u251c\u2500\u2500 references/    # \ucc38\uc870 \ubb38\uc11c \ubc0f \uac00\uc774\ub4dc",
        "\u2502   \u2514\u2500\u2500 API.md",
        "\u2514\u2500\u2500 assets/        # \uc815\uc801 \ud30c\uc77c (\ud15c\ud50c\ub9bf, \ucf58\ud53c\uadf8, \ub370\uc774\ud130)",
        "    \u2514\u2500\u2500 template.json",
      ]),

      spacer(120),
      divider(),

      // ══════════════════════════════════════════════════════════════════════
      // 9. 설정 파라미터
      // ══════════════════════════════════════════════════════════════════════
      h1("9. \uc124\uc815 \ud30c\ub77c\ubbf8\ud130 (Configuration)"),
      body("AgentSkills \uc0dd\uc131\uc790\ub294 \ub2e4\uc74c \ud30c\ub77c\ubbf8\ud130\ub97c \uc9c0\uc6d0\ud569\ub2c8\ub2e4."),
      spacer(80),

      h2("9.1 Python \ud30c\ub77c\ubbf8\ud130"),
      spacer(60),
      makeTable(
        ["\ud30c\ub77c\ubbf8\ud130", "\ud0c0\uc785", "\uae30\ubcf8\uac12", "\uc124\uba85"],
        [
          ["skills", "SkillSources", "\ud544\uc218", "\uc2a4\ud0ac \uc18c\uc2a4 (\uacbd\ub85c, URL, Skill \uc778\uc2a4\ud134\uc2a4 \ub610\ub294 \ud63c\ud569). \ub2e8\uc77c \uac12 \ub610\ub294 \ub9ac\uc2a4\ud2b8 \ud5c8\uc6a9"],
          ["state_key", "str", "\"agent_skills\"", "agent.state\uc5d0 \ud50c\ub7ec\uadf8\uc778 \uc0c1\ud0dc\ub97c \uc800\uc7a5\ud558\ub294 \ud0a4"],
          ["max_resource_files", "int", "20", "\uc2a4\ud0ac \ud65c\uc131\ud654 \uc751\ub2f5\uc5d0 \ub098\uc5f4\ub418\ub294 \ub9ac\uc18c\uc2a4 \ud30c\uc77c \ucd5c\ub300 \uac1c\uc218"],
          ["strict", "bool", "False", "True\uc774\uba74 \uacbd\uace0 \ub300\uc2e0 \uac80\uc99d \ubb38\uc81c\uc5d0\uc11c \uc608\uc678 \ubc1c\uc0dd"],
        ],
        [2000, 1800, 1800, 3760]
      ),
      spacer(120),

      h2("9.2 TypeScript \ud30c\ub77c\ubbf8\ud130"),
      spacer(60),
      makeTable(
        ["\ud30c\ub77c\ubbf8\ud130", "\ud0c0\uc785", "\uae30\ubcf8\uac12", "\uc124\uba85"],
        [
          ["skills", "SkillSource[]", "\ud544\uc218", "\uc2a4\ud0ac \uc18c\uc2a4 \ubc30\uc5f4 (\uacbd\ub85c, Skill \uc778\uc2a4\ud134\uc2a4, HTTPS URL)"],
          ["stateKey", "string", "'agent_skills'", "agent.appState\uc5d0 \ud50c\ub7ec\uadf8\uc778 \uc0c1\ud0dc\ub97c \uc800\uc7a5\ud558\ub294 \ud0a4"],
          ["maxResourceFiles", "number", "20", "\uc2a4\ud0ac \ud65c\uc131\ud654 \uc751\ub2f5\uc5d0 \ub098\uc5f4\ub418\ub294 \ub9ac\uc18c\uc2a4 \ud30c\uc77c \ucd5c\ub300 \uac1c\uc218"],
          ["strict", "boolean", "false", "true\uc774\uba74 \uacbd\uace0 \ub300\uc2e0 \uac80\uc99d \ubb38\uc81c\uc5d0\uc11c \uc608\uc678 \ubc1c\uc0dd"],
        ],
        [2000, 1800, 1800, 3760]
      ),
      spacer(80),
      body("\ud65c\uc131\ud654\ub41c Skills\ub294 \uc124\uc815\ub41c state key \uc544\ub798 \uc5d0\uc774\uc804\ud2b8 \uc0c1\ud0dc\uc5d0 \ucd94\uc801\ub429\ub2c8\ub2e4. \uc774\ub294 \ub3d9\uc77c \uc138\uc158 \ub0b4 \ud638\ucd9c \uac04\uc5d0 \ud65c\uc131\ud654\ub41c Skills\uac00 \uc9c0\uc18d\ub418\uba70 \uc138\uc158 \uad00\ub9ac\ub97c \uc704\ud574 \uc9c1\ub82c\ud654\ud560 \uc218 \uc788\uc74c\uc744 \uc758\ubbf8\ud569\ub2c8\ub2e4."),

      spacer(120),
      divider(),

      // ══════════════════════════════════════════════════════════════════════
      // 10. 다른 접근 방식과 비교
      // ══════════════════════════════════════════════════════════════════════
      h1("10. \ub2e4\ub978 \uc811\uadfc \ubc29\uc2dd\uacfc \ube44\uad50"),
      body("Skills\ub294 \uc5d0\uc774\uc804\ud2b8\uac00 \uc5ec\ub7ec \uc804\ubb38 \ub3c4\uba54\uc778\uc744 \ub2e4\ub8e8\uc5b4\uc57c \ud558\uc9c0\ub9cc \ubaa8\ub4e0 \uc9c0\uc2dc\uc0ac\ud56d\uc744 \ud55c\ubc88\uc5d0 \ub85c\ub4dc\ud560 \ud544\uc694\uac00 \uc5c6\uc744 \ub54c \uac00\uc7a5 \uc801\ud569\ud569\ub2c8\ub2e4."),
      spacer(80),
      makeTable(
        ["\uc811\uadfc \ubc29\uc2dd", "\uac00\uc7a5 \uc801\ud569\ud55c \uc0c1\ud669", "\ud2b8\ub808\uc774\ub4dc\uc624\ud504"],
        [
          ["System Prompt", "\uc791\uace0 \ud56d\uc0c1 \uad00\ub828\uc131 \uc788\ub294 \uc9c0\uc2dc\uc0ac\ud56d", "\ub9ce\uc740 \uae30\ub2a5\uc73c\ub85c \uc778\ud574 \ub2e4\ub8e8\uae30 \uc5b4\ub824\uc6cc\uc9d8"],
          ["Steering", "\ub3d9\uc801, \ucee8\ud14d\uc2a4\ud2b8 \uc778\uc2dd \uac00\uc774\ub358\uc2a4 \ubc0f \uac80\uc99d", "\uc124\uc815\uc774 \ub354 \ubcf5\uc7a1\ud568"],
          ["Skills", "\ubaa8\ub4c8\ud615, \ub3c4\uba54\uc778 \ud2b9\ud654 \uc9c0\uc2dc\uc0ac\ud56d \uc138\ud2b8", "\ud65c\uc131\ud654\ub97c \uc704\ud55c \ub3c4\uad6c \ud638\ucd9c \ud544\uc694"],
          ["Multi-agent", "\uadfc\ubcf8\uc801\uc73c\ub85c \ub2e4\ub978 \uc5ed\ud560 \ub610\ub294 \ubaa8\ub378", "\ub192\uc740 \ubcf5\uc7a1\uc131\uacfc \uc9c0\uc5f0 \uc2dc\uac04"],
        ],
        [2400, 3480, 3480]
      ),
      spacer(80),
      body("\ud2b9\uc815 \uc2dc\uc810\uc5d0 \uc62c\ubc14\ub978 \uc9c0\uc2dc\uc0ac\ud56d\uc744 \ub85c\ub4dc\ud558\uc5ec \ub2e4\uc591\ud55c \uc791\uc5c5\uc744 \ucc98\ub9ac\ud560 \uc218 \uc788\ub294 \ub2e8\uc77c \uc5d0\uc774\uc804\ud2b8\ub97c \uc6d0\ud560 \ub54c, \uba40\ud2f0 \uc5d0\uc774\uc804\ud2b8 \uc544\ud0a4\ud14d\ucc98\uc758 \uc624\ubc84\ud5e4\ub4dc \uc5c6\uc774 Skills\ub97c \uc0ac\uc6a9\ud558\uc138\uc694."),

      spacer(120),
      divider(),

      // ══════════════════════════════════════════════════════════════════════
      // 11. 관련 주제
      // ══════════════════════════════════════════════════════════════════════
      h1("11. \uad00\ub828 \uc8fc\uc81c"),
      spacer(60),
      makeTable(
        ["\uc8fc\uc81c", "\uc124\uba85", "URL"],
        [
          ["Plugins", "Skills\ub97c \uad6c\ub3d9\ud558\ub294 \ud50c\ub7ec\uadf8\uc778 \uc2dc\uc2a4\ud15c", "strandsagents.com/docs/.../plugins/"],
          ["Steering", "\ubcf5\uc7a1\ud55c \uc791\uc5c5\uc744 \uc704\ud55c \ucee8\ud14d\uc2a4\ud2b8 \uc778\uc2dd \uac00\uc774\ub358\uc2a4", "strandsagents.com/docs/.../steering/"],
          ["Agent State", "\ud65c\uc131\ud654\ub41c Skills\uac00 \uc9c0\uc18d\ub418\ub294 \ubc29\uc2dd", "strandsagents.com/docs/.../state/"],
          ["Session Management", "\uc138\uc158 \uac04 Skills \uc9c0\uc18d", "strandsagents.com/docs/.../session-management/"],
          ["Agent Skills Spec", "Skills\uac00 \uae30\ubc18\uc73c\ub85c \ud558\ub294 \uc624\ud508 \uc2a4\ud399", "agentskills.io/specification"],
        ],
        [2200, 3680, 3480]
      ),

      spacer(200),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 0 },
        children: [new TextRun({ text: "\u2014 \ub9c8\uce68 \u2014", size: 20, color: COLOR_GRAY, font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 0 },
        children: [
          new ExternalHyperlink({
            link: "https://strandsagents.com/docs/user-guide/concepts/plugins/skills/",
            children: [new TextRun({ text: "\uc6d0\ubb38 \ubcf4\uae30: strandsagents.com/docs/user-guide/concepts/plugins/skills/", size: 18, color: COLOR_PRIMARY, underline: {}, font: "Arial" })]
          })
        ]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("artifacts/strands_agents_skills_guide.docx", buffer);
  console.log("Done: artifacts/strands_agents_skills_guide.docx");
});

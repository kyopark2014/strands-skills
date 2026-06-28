
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, ExternalHyperlink,
  LevelFormat, TableOfContents, PageBreak
} = require('docx');
const fs = require('fs');

// Color palette
const COLOR_PRIMARY = "1F4E79";
const COLOR_SECONDARY = "2E75B6";
const COLOR_ACCENT = "4472C4";
const COLOR_LIGHT_BG = "DEEAF1";
const COLOR_HEADER_BG = "1F4E79";
const COLOR_ROW_ALT = "EBF3FB";
const COLOR_CODE_BG = "F2F2F2";
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

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24, color: COLOR_ACCENT, font: "Arial" })]
  });
}

function body(text, options = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, size: 22, color: COLOR_TEXT, font: "Arial", ...options })]
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
    children: [new TextRun({ text, size: 22, color: COLOR_TEXT, font: "Arial" })]
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
    children: [new TextRun({ text, size: 22, color: COLOR_TEXT, font: "Arial" })]
  });
}

function codeBlock(lines) {
  return lines.map((line, i) =>
    new Paragraph({
      spacing: { before: i === 0 ? 100 : 0, after: i === lines.length - 1 ? 100 : 0 },
      shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
      indent: { left: 360 },
      children: [new TextRun({ text: line, font: "Courier New", size: 18, color: "333333" })]
    })
  );
}

function inlineCode(text) {
  return new TextRun({ text, font: "Courier New", size: 20, color: "C7254E", highlight: "yellow" });
}

function spacer(before = 120) {
  return new Paragraph({ spacing: { before, after: 0 }, children: [new TextRun("")] });
}

function sectionDivider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_SECONDARY, space: 1 } },
    children: [new TextRun("")]
  });
}

function makeHeaderTable(cells) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [6500, 2860],
    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
            margins: { top: 200, bottom: 200, left: 300, right: 200 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Strands Agents", bold: true, size: 48, color: COLOR_WHITE, font: "Arial" })]
              }),
              new Paragraph({
                children: [new TextRun({ text: "AgentSkills 플러그인 구현 가이드", size: 26, color: "BDD7EE", font: "Arial" })]
              }),
            ]
          }),
          new TableCell({
            borders: noBorders,
            shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
            margins: { top: 200, bottom: 200, left: 200, right: 300 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: "기술 문서", size: 22, color: "BDD7EE", font: "Arial" })]
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: "v1.0", size: 22, color: COLOR_WHITE, font: "Arial", bold: true })]
              }),
            ]
          }),
        ]
      })
    ]
  });
}

// Info box (callout)
function infoBox(title, lines, bgColor = "EBF3FB", borderColor = COLOR_SECONDARY) {
  const rows = [];
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
  lines.forEach((line, i) => {
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
    rows
  });
}

// Standard data table
function dataTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const tableRows = [];

  // Header row
  tableRows.push(new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: h, bold: true, size: 20, color: COLOR_WHITE, font: "Arial" })]
      })]
    }))
  }));

  // Data rows
  rows.forEach((row, ri) => {
    tableRows.push(new TableRow({
      children: row.map((cell, ci) => new TableCell({
        borders,
        width: { size: colWidths[ci], type: WidthType.DXA },
        shading: { fill: ri % 2 === 0 ? COLOR_WHITE : COLOR_ROW_ALT, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 140, right: 140 },
        children: [new Paragraph({
          children: [new TextRun({ text: cell, size: 20, color: COLOR_TEXT, font: "Arial" })]
        })]
      }))
    }));
  });

  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: tableRows
  });
}

// Phase table (3-phase workflow)
function phaseTable() {
  const phases = [
    { num: "1", name: "Discovery\n(발견)", desc: "플러그인 초기화 시 스킬 메타데이터(이름, 설명)를 읽어 XML 블록으로 에이전트 시스템 프롬프트에 주입합니다. 에이전트는 전체 지침을 로드하지 않고도 사용 가능한 스킬을 확인할 수 있습니다.", color: "D5E8F0" },
    { num: "2", name: "Activation\n(활성화)", desc: "에이전트가 스킬이 필요하다고 판단하면 스킬 이름과 함께 skills 도구를 호출합니다. 도구는 완전한 지침, 메타데이터, 사용 가능한 리소스 파일 목록을 반환합니다.", color: "D5E8F0" },
    { num: "3", name: "Execution\n(실행)", desc: "에이전트가 로드된 지침을 따릅니다. 스킬에 리소스 파일(스크립트, 참조 문서, 에셋)이 포함된 경우, 에이전트는 제공된 도구를 통해 해당 파일에 접근할 수 있습니다.", color: "D5E8F0" },
  ];

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [900, 1800, 6660],
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ borders, width: { size: 900, type: WidthType.DXA }, shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 140 }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "단계", bold: true, size: 20, color: COLOR_WHITE, font: "Arial" })] })] }),
          new TableCell({ borders, width: { size: 1800, type: WidthType.DXA }, shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 140 }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "단계명", bold: true, size: 20, color: COLOR_WHITE, font: "Arial" })] })] }),
          new TableCell({ borders, width: { size: 6660, type: WidthType.DXA }, shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 140, right: 140 }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "설명", bold: true, size: 20, color: COLOR_WHITE, font: "Arial" })] })] }),
        ]
      }),
      ...phases.map((p, i) => new TableRow({
        children: [
          new TableCell({ borders, width: { size: 900, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? COLOR_WHITE : COLOR_ROW_ALT, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 140, right: 140 }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: p.num, bold: true, size: 28, color: COLOR_PRIMARY, font: "Arial" })] })] }),
          new TableCell({ borders, width: { size: 1800, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? COLOR_WHITE : COLOR_ROW_ALT, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 140, right: 140 }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: p.name, bold: true, size: 21, color: COLOR_SECONDARY, font: "Arial" })] })] }),
          new TableCell({ borders, width: { size: 6660, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? COLOR_WHITE : COLOR_ROW_ALT, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 140, right: 140 }, children: [new Paragraph({ children: [new TextRun({ text: p.desc, size: 20, color: COLOR_TEXT, font: "Arial" })] })] }),
        ]
      }))
    ]
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
        ]
      },
      {
        reference: "numbers",
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        ]
      }
    ]
  },
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22, color: COLOR_TEXT } }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, color: COLOR_PRIMARY, font: "Arial" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, color: COLOR_SECONDARY, font: "Arial" },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: COLOR_ACCENT, font: "Arial" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 }
      },
    ]
  },
  sections: [
    // ─── Cover Page ───────────────────────────────────────────────────────────
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        spacer(1800),
        makeHeaderTable([]),
        spacer(400),
        sectionDivider(),
        spacer(200),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Strands Agents — AgentSkills 플러그인", bold: true, size: 40, color: COLOR_PRIMARY, font: "Arial" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: "구현 및 활용 가이드", size: 30, color: COLOR_GRAY, font: "Arial" })]
        }),
        sectionDivider(),
        spacer(300),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "이 문서는 Strands Agents의 AgentSkills 플러그인 공식 문서를 기반으로", size: 22, color: COLOR_GRAY, font: "Arial" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 60, after: 60 },
          children: [new TextRun({ text: "스킬 시스템의 개념, 구현 방법, 활용 패턴을 정리한 기술 참조 문서입니다.", size: 22, color: COLOR_GRAY, font: "Arial" })]
        }),
        spacer(600),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "참조: ", size: 20, color: COLOR_GRAY, font: "Arial" }), new TextRun({ text: "https://strandsagents.com/docs/user-guide/concepts/plugins/skills/", size: 20, color: COLOR_SECONDARY, font: "Arial" })]
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ]
    },
    // ─── Main Content ─────────────────────────────────────────────────────────
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_SECONDARY, space: 1 } },
              children: [
                new TextRun({ text: "Strands Agents — AgentSkills 플러그인 구현 가이드", size: 18, color: COLOR_GRAY, font: "Arial" }),
              ]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_SECONDARY, space: 1 } },
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "Page ", size: 18, color: COLOR_GRAY, font: "Arial" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: COLOR_GRAY, font: "Arial" }),
                new TextRun({ text: " / ", size: 18, color: COLOR_GRAY, font: "Arial" }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: COLOR_GRAY, font: "Arial" }),
              ]
            })
          ]
        })
      },
      children: [
        // ── 목차 ──
        new TableOfContents("목  차", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════════════════════════════════════
        // 1. 개요
        // ══════════════════════════════════════════════════════════════════════
        heading1("1. 개요 (Overview)"),
        sectionDivider(),

        heading2("1.1 Skills란 무엇인가?"),
        body("AgentSkills는 Strands Agents 프레임워크의 플러그인으로, 에이전트에게 필요할 때만 전문화된 지침을 제공하는 모듈식 스킬 패키지 시스템입니다. 시스템 프롬프트에 모든 지침을 미리 로드하는 대신, 에이전트가 관련성이 있을 때만 스킬을 발견하고 활성화합니다."),
        spacer(100),
        body("이 플러그인은 Agent Skills 공개 사양(agentskills.io/specification)을 따르며, 점진적 공개(Progressive Disclosure) 방식을 사용합니다:"),
        bullet("경량 메타데이터(이름, 설명)만 시스템 프롬프트에 주입"),
        bullet("에이전트가 도구 호출을 통해 스킬을 활성화할 때 전체 지침 로드"),
        bullet("컨텍스트 윈도우를 효율적으로 유지하면서 깊은 전문 지식 제공"),

        spacer(160),
        heading2("1.2 기존 방식의 문제점"),
        body("에이전트가 복잡한 작업을 처리할수록 시스템 프롬프트가 비대해집니다. 예를 들어 PDF 처리, 데이터 분석, 코드 리뷰, 이메일 작성을 모두 처리하는 단일 에이전트는 모든 기능에 대한 지침이 담긴 거대한 프롬프트를 갖게 됩니다."),
        spacer(80),
        dataTable(
          ["문제", "설명"],
          [
            ["컨텍스트 윈도우 비대화", "대형 프롬프트는 추론과 대화에 사용될 토큰을 소비"],
            ["지침 혼란", "하나의 프롬프트에 수십 개의 무관한 지침이 뒤섞여 모델이 따르기 어려움"],
            ["유지보수 부담", "단일 거대 프롬프트는 업데이트, 버전 관리, 팀 공유가 어려움"],
          ],
          [3000, 6360]
        ),
        spacer(160),
        body("Skills는 지침을 독립적인 패키지로 분리하여 이 문제를 해결합니다. 에이전트는 사용 가능한 스킬 목록을 보고, 필요할 때만 전체 지침을 로드합니다."),

        spacer(200),
        // ══════════════════════════════════════════════════════════════════════
        // 2. 동작 원리
        // ══════════════════════════════════════════════════════════════════════
        heading1("2. 동작 원리 (How Skills Work)"),
        sectionDivider(),

        heading2("2.1 3단계 동작 흐름"),
        body("AgentSkills 플러그인은 세 단계로 동작합니다:"),
        spacer(100),
        phaseTable(),
        spacer(160),

        heading2("2.2 시스템 프롬프트 주입 형식"),
        body("플러그인이 시스템 프롬프트에 주입하는 XML 블록의 형식은 다음과 같습니다:"),
        spacer(80),
        ...codeBlock([
          "<available_skills>",
          "  <skill>",
          "    <name>pdf-processing</name>",
          "    <description>Extract text and tables from PDF files.</description>",
          "    <location>/path/to/pdf-processing/SKILL.md</location>",
          "  </skill>",
          "</available_skills>",
        ]),
        spacer(100),
        infoBox("💡 참고", [
          "이 XML 블록은 각 호출 전에 갱신되므로, set_available_skills()를 통한 스킬 변경이 즉시 반영됩니다.",
          "활성화된 스킬은 에이전트 상태(agent state)에 추적되어 세션 간 지속성을 제공합니다.",
        ]),

        spacer(200),
        // ══════════════════════════════════════════════════════════════════════
        // 3. 사용법
        // ══════════════════════════════════════════════════════════════════════
        heading1("3. 사용법 (Usage)"),
        sectionDivider(),

        heading2("3.1 스킬 소스 유형"),
        body("AgentSkills 플러그인은 다양한 형태의 스킬 소스를 지원합니다:"),
        spacer(80),
        dataTable(
          ["소스 유형", "설명", "예시"],
          [
            ["파일시스템 경로", "단일 스킬 디렉토리 경로", '"./skills/pdf-processing"'],
            ["부모 디렉토리", "SKILL.md를 포함한 모든 하위 디렉토리 로드", '"./skills/"'],
            ["HTTPS URL", "원격 스킬 소스", '"https://example.com/skill"'],
            ["Skill 인스턴스", "코드로 직접 생성한 스킬 객체", 'Skill(name="...", ...)'],
          ],
          [2200, 3500, 3660]
        ),

        spacer(160),
        heading2("3.2 Python 기본 사용 예시"),
        ...codeBlock([
          "from strands import Agent, AgentSkills, Skill",
          "",
          "# 단일 스킬 디렉토리",
          'plugin = AgentSkills(skills="./skills/pdf-processing")',
          "",
          "# 부모 디렉토리 (모든 하위 스킬 자동 로드)",
          'plugin = AgentSkills(skills="./skills/")',
          "",
          "# 혼합 소스",
          "plugin = AgentSkills(skills=[",
          '    "./skills/pdf-processing",   # 단일 스킬 디렉토리',
          '    "./skills/",                 # 부모 디렉토리',
          "    Skill(                       # 프로그래밍 방식 스킬",
          '        name="custom-greeting",',
          '        description="Generate custom greetings",',
          '        instructions="Always greet the user by name with enthusiasm.",',
          "    ),",
          "])",
          "",
          "agent = Agent(plugins=[plugin])",
        ]),

        spacer(160),
        heading2("3.3 TypeScript 기본 사용 예시"),
        ...codeBlock([
          "import { Agent } from '@strands-agents/sdk'",
          "import { AgentSkills, Skill } from '@strands-agents/sdk/vended-plugins/skills'",
          "",
          "// 혼합 소스",
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

        spacer(160),
        heading2("3.4 리소스 접근을 위한 도구 제공"),
        body("AgentSkills 플러그인은 스킬 발견과 활성화만 처리합니다. 파일 읽기나 스크립트 실행을 위한 도구는 별도로 제공해야 합니다. 이는 플러그인이 스킬의 위치나 리소스 접근 방식에 대한 가정을 하지 않도록 의도적으로 설계된 것입니다."),
        spacer(80),
        infoBox("🔧 Python — 파일시스템 기반 스킬 도구 설정", [
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
        infoBox("🔧 TypeScript — 파일시스템 기반 스킬 도구 설정", [
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
        body("환경에 따라 다른 도구를 사용할 수도 있습니다:"),
        bullet("원격 리소스가 있는 스킬: HTTP 요청 도구"),
        bullet("샌드박스 환경에서 스크립트 실행: 코드 인터프리터 도구"),
        bullet("스킬의 리소스 접근 패턴과 보안 요구사항에 맞는 도구 선택"),

        spacer(200),
        // ══════════════════════════════════════════════════════════════════════
        // 4. 프로그래밍 방식 스킬 생성
        // ══════════════════════════════════════════════════════════════════════
        heading1("4. 프로그래밍 방식 스킬 생성"),
        sectionDivider(),

        heading2("4.1 Skill 클래스 활용 (Python)"),
        body("파일시스템 디렉토리 없이 코드로 직접 스킬을 생성할 수 있습니다:"),
        spacer(80),
        ...codeBlock([
          "from strands import Skill",
          "",
          "# 직접 생성",
          "skill = Skill(",
          '    name="code-review",',
          '    description="Review code for best practices and bugs",',
          '    instructions="Review the provided code. Check for...",',
          ")",
          "",
          "# SKILL.md 내용으로부터 파싱",
          'skill = Skill.from_content("""',
          "---",
          "name: code-review",
          "description: Review code for best practices and bugs",
          "---",
          "Review the provided code. Check for...",
          '""")',
          "",
          "# 특정 디렉토리에서 로드",
          'skill = Skill.from_file("./skills/code-review")',
          "",
          "# 부모 디렉토리에서 모든 스킬 로드",
          'skills = Skill.from_directory("./skills/")',
        ]),

        spacer(160),
        heading2("4.2 Skill 클래스 활용 (TypeScript)"),
        ...codeBlock([
          "import { Skill } from '@strands-agents/sdk/vended-plugins/skills'",
          "",
          "// 직접 생성",
          "const skill = new Skill({",
          "  name: 'code-review',",
          "  description: 'Review code for best practices and bugs',",
          "  instructions: 'Review the provided code. Check for...',",
          "})",
          "",
          "// SKILL.md 내용으로부터 파싱",
          "const parsed = Skill.fromContent(",
          "  '---\\nname: code-review\\ndescription: Review code\\n---\\nInstructions...'",
          ")",
          "",
          "// 특정 디렉토리에서 로드",
          "const loaded = Skill.fromFile('./skills/code-review')",
          "",
          "// 부모 디렉토리에서 모든 스킬 로드",
          "const skills = Skill.fromDirectory('./skills/')",
        ]),

        spacer(200),
        // ══════════════════════════════════════════════════════════════════════
        // 5. 런타임 스킬 관리
        // ══════════════════════════════════════════════════════════════════════
        heading1("5. 런타임 스킬 관리"),
        sectionDivider(),

        body("플러그인 생성 후에도 스킬을 추가, 교체, 조회할 수 있습니다. 변경 사항은 플러그인이 각 호출 전에 시스템 프롬프트 XML을 갱신하므로 다음 에이전트 호출 시 즉시 반영됩니다."),
        spacer(100),

        heading2("5.1 Python 런타임 관리"),
        ...codeBlock([
          "from strands import Agent, AgentSkills, Skill",
          "",
          'plugin = AgentSkills(skills="./skills/pdf-processing")',
          "agent = Agent(plugins=[plugin])",
          "",
          "# 사용 가능한 스킬 조회",
          "for skill in plugin.get_available_skills():",
          '    print(f"{skill.name}: {skill.description}")',
          "",
          "# 런타임에 새 스킬 추가",
          "new_skill = Skill(",
          '    name="summarize",',
          '    description="Summarize long documents",',
          '    instructions="Read the document and produce a concise summary...",',
          ")",
          "plugin.set_available_skills(",
          "    plugin.get_available_skills() + [new_skill]",
          ")",
          "",
          "# 모든 스킬 교체",
          'plugin.set_available_skills(["./skills/new-set/"])',
          "",
          "# 에이전트가 활성화한 스킬 확인",
          "activated = plugin.get_activated_skills(agent)",
          'print(f"Activated skills: {activated}")',
        ]),

        spacer(160),
        heading2("5.2 TypeScript 런타임 관리"),
        ...codeBlock([
          "const plugin = new AgentSkills({ skills: ['./skills/pdf-processing'] })",
          "const agent = new Agent({ model, plugins: [plugin] })",
          "",
          "// 사용 가능한 스킬 조회",
          "const available = await plugin.getAvailableSkills()",
          "for (const skill of available) {",
          "  console.log(`${skill.name}: ${skill.description}`)",
          "}",
          "",
          "// 런타임에 새 스킬 추가",
          "const newSkill = new Skill({",
          "  name: 'summarize',",
          "  description: 'Summarize long documents',",
          "  instructions: 'Read the document and produce a concise summary...',",
          "})",
          "plugin.setAvailableSkills([...available, newSkill])",
          "",
          "// 모든 스킬 교체",
          "plugin.setAvailableSkills(['./skills/new-set/'])",
          "",
          "// 에이전트가 활성화한 스킬 확인",
          "const activated = plugin.getActivatedSkills(agent)",
          "console.log(`Activated skills: ${activated}`)",
        ]),

        spacer(200),
        // ══════════════════════════════════════════════════════════════════════
        // 6. SKILL.md 형식
        // ══════════════════════════════════════════════════════════════════════
        heading1("6. SKILL.md 파일 형식"),
        sectionDivider(),

        body("스킬은 Agent Skills 사양을 따릅니다. 스킬은 YAML 프론트매터와 마크다운 지침이 포함된 SKILL.md 파일을 가진 디렉토리입니다."),
        spacer(100),

        heading2("6.1 SKILL.md 예시"),
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

        spacer(160),
        heading2("6.2 프론트매터 필드 참조"),
        dataTable(
          ["필드", "필수 여부", "설명"],
          [
            ["name", "필수", "고유 식별자. 소문자 영숫자와 하이픈, 1~64자. 부모 디렉토리명과 일치해야 함"],
            ["description", "필수", "스킬의 기능 설명. 이 텍스트가 시스템 프롬프트에 표시됨"],
            ["allowed-tools", "선택", "스킬이 사용하는 도구 이름의 공백 구분 목록 (현재 정보 제공용)"],
            ["metadata", "선택", "사용자 정의 데이터를 위한 추가 키-값 쌍"],
            ["license", "선택", "라이선스 식별자 (예: Apache-2.0)"],
            ["compatibility", "선택", "호환성 정보 문자열"],
          ],
          [2000, 1400, 5960]
        ),
        spacer(100),
        infoBox("⚠️ allowed-tools 동작 방식", [
          "allowed-tools 필드는 현재 정보 제공 목적으로만 사용됩니다.",
          "스킬이 활성화되면 나열된 도구 이름이 에이전트에게 반환되는 지침에 포함되지만,",
          "런타임에서 도구 접근이 강제되거나 제한되지는 않습니다.",
          "이 필드는 Agent Skills 사양에서 아직 실험적 단계입니다.",
        ], "FFF8E1"),
        spacer(100),
        infoBox("⚠️ 이름 유효성 검사", [
          "스킬 이름은 부모 디렉토리 이름과 일치해야 합니다.",
          "기본적으로 유효성 검사 문제는 오류 대신 경고를 생성합니다.",
          "strict=True (Python) 또는 strict: true (TypeScript)를 전달하면 예외가 발생합니다.",
        ], "FFF8E1"),

        spacer(200),
        // ══════════════════════════════════════════════════════════════════════
        // 7. 리소스 디렉토리 구조
        // ══════════════════════════════════════════════════════════════════════
        heading1("7. 리소스 디렉토리 구조"),
        sectionDivider(),

        body("스킬은 세 가지 표준 하위 디렉토리에 리소스 파일을 포함할 수 있습니다. 에이전트가 스킬을 활성화하면 도구 응답에 이 디렉토리들에서 발견된 모든 리소스 파일 목록이 포함됩니다."),
        spacer(100),
        ...codeBlock([
          "my-skill/",
          "├── SKILL.md",
          "├── scripts/       # 에이전트가 실행할 수 있는 스크립트",
          "│   └── process.py",
          "├── references/    # 참조 문서 및 가이드",
          "│   └── API.md",
          "└── assets/        # 정적 파일 (템플릿, 설정, 데이터)",
          "    └── template.json",
        ]),
        spacer(100),
        dataTable(
          ["디렉토리", "용도", "예시 파일"],
          [
            ["scripts/", "에이전트가 실행할 수 있는 스크립트", "extract.py, process.sh"],
            ["references/", "참조 문서 및 가이드", "API.md, README.md"],
            ["assets/", "정적 파일 (템플릿, 설정, 데이터)", "template.json, config.yaml"],
          ],
          [2200, 4000, 3160]
        ),

        spacer(200),
        // ══════════════════════════════════════════════════════════════════════
        // 8. 설정 파라미터
        // ══════════════════════════════════════════════════════════════════════
        heading1("8. 설정 파라미터 (Configuration)"),
        sectionDivider(),

        heading2("8.1 Python AgentSkills 파라미터"),
        dataTable(
          ["파라미터", "타입", "기본값", "설명"],
          [
            ["skills", "SkillSources", "필수", "하나 이상의 스킬 소스 (경로, HTTPS URL, Skill 인스턴스 또는 혼합). 단일 값 또는 리스트 허용"],
            ["state_key", "str", '"agent_skills"', "에이전트 상태(agent.state)에 플러그인 상태를 저장하는 키"],
            ["max_resource_files", "int", "20", "스킬 활성화 응답에 나열되는 최대 리소스 파일 수"],
            ["strict", "bool", "False", "True이면 유효성 검사 문제 시 경고 대신 예외 발생"],
          ],
          [2000, 1600, 1600, 4160]
        ),

        spacer(160),
        heading2("8.2 TypeScript AgentSkills 파라미터"),
        dataTable(
          ["파라미터", "타입", "기본값", "설명"],
          [
            ["skills", "SkillSource[]", "필수", "스킬 소스 배열 (경로, Skill 인스턴스, HTTPS URL)"],
            ["stateKey", "string", '"agent_skills"', "에이전트 앱 상태(agent.appState)에 플러그인 상태를 저장하는 키"],
            ["maxResourceFiles", "number", "20", "스킬 활성화 응답에 나열되는 최대 리소스 파일 수"],
            ["strict", "boolean", "false", "true이면 유효성 검사 문제 시 경고 대신 예외 발생"],
          ],
          [2000, 1600, 1600, 4160]
        ),

        spacer(160),
        infoBox("💡 세션 지속성", [
          "활성화된 스킬은 설정된 state_key 아래 에이전트 상태에 추적됩니다.",
          "이는 활성화된 스킬이 동일 세션 내 호출 간에 지속되며,",
          "세션 관리(Session Management)를 위해 직렬화될 수 있음을 의미합니다.",
        ]),

        spacer(200),
        // ══════════════════════════════════════════════════════════════════════
        // 9. 다른 접근 방식과의 비교
        // ══════════════════════════════════════════════════════════════════════
        heading1("9. 다른 접근 방식과의 비교"),
        sectionDivider(),

        body("Skills는 에이전트가 여러 전문 도메인을 처리해야 하지만 모든 지침을 한 번에 로드할 필요가 없을 때 가장 효과적입니다."),
        spacer(100),
        dataTable(
          ["접근 방식", "최적 사용 사례", "트레이드오프"],
          [
            ["시스템 프롬프트", "소규모, 항상 관련 있는 지침", "많은 기능이 있을 때 다루기 어려워짐"],
            ["Steering", "동적, 컨텍스트 인식 가이던스 및 검증", "설정이 더 복잡함"],
            ["Skills", "모듈식, 도메인별 지침 세트", "활성화를 위한 도구 호출 필요"],
            ["Multi-agent", "근본적으로 다른 역할 또는 모델", "더 높은 복잡성과 지연 시간"],
          ],
          [2200, 3500, 3660]
        ),
        spacer(100),
        body("Skills는 멀티 에이전트 아키텍처의 오버헤드 없이 적시에 올바른 지침을 로드하여 광범위한 작업을 처리할 수 있는 단일 에이전트를 원할 때 사용하세요."),

        spacer(200),
        // ══════════════════════════════════════════════════════════════════════
        // 10. 관련 주제
        // ══════════════════════════════════════════════════════════════════════
        heading1("10. 관련 주제 및 참고 자료"),
        sectionDivider(),

        dataTable(
          ["주제", "설명", "링크"],
          [
            ["Plugins", "Skills를 구동하는 플러그인 시스템", "https://strandsagents.com/docs/user-guide/concepts/plugins/"],
            ["Steering", "복잡한 작업을 위한 컨텍스트 인식 가이던스", "https://strandsagents.com/docs/user-guide/concepts/plugins/steering/"],
            ["Agent State", "활성화된 스킬이 지속되는 방식", "https://strandsagents.com/docs/user-guide/concepts/agents/state/"],
            ["Session Management", "세션 간 스킬 지속", "https://strandsagents.com/docs/user-guide/concepts/agents/session-management/"],
            ["Agent Skills Spec", "Skills가 기반하는 공개 사양", "https://agentskills.io/specification"],
          ],
          [2200, 3500, 3660]
        ),

        spacer(300),
        sectionDivider(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: "본 문서는 Strands Agents 공식 문서를 기반으로 작성되었습니다.", size: 18, color: COLOR_GRAY, font: "Arial", italics: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "https://strandsagents.com/docs/user-guide/concepts/plugins/skills/", size: 18, color: COLOR_SECONDARY, font: "Arial" })]
        }),
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("artifacts/strands_agentskills_guide.docx", buffer);
  console.log("✅ 문서 생성 완료: artifacts/strands_agentskills_guide.docx");
});

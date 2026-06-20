import type { AccessLevel, Material, MaterialStatus } from "@/lib/portal-types";

export const materialTypeOrder = [
  "Лекция",
  "Презентация",
  "Методичка",
  "Таблица",
  "Задание",
  "Фото",
  "Другое",
];

export function typeShort(type: string) {
  const map: Record<string, string> = {
    Презентация: "ПРЗ",
    Лекция: "ЛЕК",
    Методичка: "МЕТ",
    Таблица: "ТАБ",
    Задание: "ЗАД",
    Фото: "ФОТ",
    Другое: "ДРГ",
  };
  return map[type] ?? "МАТ";
}

export function typeTint(type: string): [string, string] {
  const map: Record<string, [string, string]> = {
    Презентация: ["#efe3d4", "#a8744a"],
    Лекция: ["#e2eae0", "#3a4a3f"],
    Методичка: ["#e9e2d3", "#7d6a4a"],
    Таблица: ["#e3e6ec", "#46566b"],
    Задание: ["#f0e4e0", "#9c5a4a"],
    Фото: ["#e8e4ec", "#6b5a7d"],
  };
  return map[type] ?? ["#ece5d6", "#6b6457"];
}

export function statusMeta(status: MaterialStatus): [string, string, string] {
  const map: Record<MaterialStatus, [string, string, string]> = {
    published: ["Опубликовано", "#e2ece2", "#3a6a44"],
    draft: ["Черновик", "#f4e7d6", "#a8744a"],
    hidden: ["Скрыто", "#eae6df", "#8c8678"],
  };
  return map[status];
}

// Показывается ли материал в публичных списках/поиске.
// open/students/request — да; link — нет (только по прямой ссылке); hidden/owner — нет.
export function isListedPublic(access: AccessLevel): boolean {
  return access === "open" || access === "students" || access === "request";
}

// Доступен ли сам файл/контент без запроса.
// open/students/link — да; request — нет (нужно запросить); hidden/owner — нет.
export function hasFullAccess(access: AccessLevel): boolean {
  return access === "open" || access === "students" || access === "link";
}

// Доступен ли материал по прямой ссылке (страница открывается).
// Всё, кроме скрытого и «только владелец».
export function isAccessibleByLink(access: AccessLevel): boolean {
  return access !== "hidden" && access !== "owner";
}

export function isOpenMaterial(material: Material) {
  return material.status === "published" && isListedPublic(material.access);
}

export function splitByGroup(materials: Material[], discipline: string | null) {
  if (!discipline) return [];
  const list = materials.filter((item) => item.discipline === discipline);
  return materialTypeOrder
    .map((type) => ({ type, items: list.filter((item) => item.mtype === type) }))
    .filter((group) => group.items.length > 0);
}

export function parseMarkdown(md: string): string {
  if (!md) return "";
  
  // Escape HTML tags to avoid HTML injection but let markdown-created tags pass through safely
  let escaped = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Split into lines for line-by-line processing
  const lines = escaped.split(/\r?\n/);
  const result: string[] = [];
  let imgBlockCount = 0;
  let inMathBlock = false;
  const mathBlockLines: string[] = [];

  let inList = false;
  let listType: "ul" | "ol" | null = null;
  let inTable = false;
  let tableRows: string[][] = [];
  let tableAlignments: Array<"left" | "center" | "right" | "none"> = [];
  let inBlockquote = false;
  let blockquoteLines: string[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = "";

  const closeList = () => {
    if (inList && listType) {
      result.push(`</${listType}>`);
      inList = false;
      listType = null;
    }
  };

  const closeTable = () => {
    if (inTable) {
      if (tableRows.length > 0) {
        let html = '<table class="markdown-table">';
        // First row is the header
        const headerCells = tableRows[0];
        html += '<thead><tr>';
        for (let i = 0; i < headerCells.length; i++) {
          const align = tableAlignments[i] || "none";
          const alignStyle = align !== "none" ? ` style="text-align: ${align};"` : '';
          html += `<th${alignStyle}>${inlineMarkup(headerCells[i])}</th>`;
        }
        html += '</tr></thead>';
        
        // Other rows are body
        if (tableRows.length > 1) {
          html += '<tbody>';
          for (let r = 1; r < tableRows.length; r++) {
            html += '<tr>';
            const cells = tableRows[r];
            // Render up to header cell count
            for (let i = 0; i < headerCells.length; i++) {
              const cellVal = cells[i] !== undefined ? cells[i] : "";
              const align = tableAlignments[i] || "none";
              const alignStyle = align !== "none" ? ` style="text-align: ${align};"` : '';
              html += `<td${alignStyle}>${inlineMarkup(cellVal)}</td>`;
            }
            html += '</tr>';
          }
          html += '</tbody>';
        }
        html += '</table>';
        result.push(html);
      }
      inTable = false;
      tableRows = [];
      tableAlignments = [];
    }
  };

  const closeBlockquote = () => {
    if (inBlockquote) {
      const parsedContent = parseMarkdown(blockquoteLines.join("\n"));
      result.push(`<blockquote class="markdown-blockquote">${parsedContent}</blockquote>`);
      inBlockquote = false;
      blockquoteLines = [];
    }
  };

  const closeCodeBlock = () => {
    if (inCodeBlock) {
      const codeText = codeBlockLines.join("\n");
      if (codeBlockLang === "mermaid") {
        result.push(`<pre class="mermaid">${codeText}</pre>`);
      } else {
        const langClass = codeBlockLang ? ` class="language-${codeBlockLang}"` : '';
        result.push(`<pre class="markdown-pre"><code${langClass}>${codeText}</code></pre>`);
      }
      inCodeBlock = false;
      codeBlockLines = [];
      codeBlockLang = "";
    }
  };

  function inlineMarkup(text: string): string {
    let t = text.trim();

    // Protect math from other inline processing
    const mathSlots: string[] = [];
    t = t.replace(/\$\$([^$]+)\$\$/g, (_, m) => {
      const i = mathSlots.length; mathSlots.push(`$$${m}$$`); return `\x01${i}\x01`;
    });
    t = t.replace(/\$([^$\n]+)\$/g, (_, m) => {
      const i = mathSlots.length; mathSlots.push(`$${m}$`); return `\x01${i}\x01`;
    });

    // Aligned Images: ![alt|left/right/center](url) or ![alt](url)
    t = t.replace(/!\[([^\]|]+)(?:\|(left|right|center))?\]\(([^)]+)\)/g, (match, alt, align, url) => {
      const alignClass = align ? ` align-${align}` : ' align-center';
      return `<img src="${url}" alt="${alt}" class="markdown-img${alignClass}" />`;
    });

    // Inline code: `code`
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold & Italic
    t = t.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    t = t.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    t = t.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Links: [label](url)
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="markdown-link">$1</a>');

    // Restore math slots
    t = t.replace(/\x01(\d+)\x01/g, (_, i) => mathSlots[+i]);

    return t;
  }

  for (let i = 0; i < lines.length; i++) {
    const origLine = lines[i];
    const line = origLine.trim();

    // 0. Math block: $$ ... $$
    if (line === "$$") {
      if (!inMathBlock) {
        closeList(); closeTable(); closeBlockquote();
        inMathBlock = true;
        mathBlockLines.length = 0;
      } else {
        result.push(`<div class="katex-block">$$${mathBlockLines.join("\n")}$$</div>`);
        inMathBlock = false;
        mathBlockLines.length = 0;
      }
      continue;
    }
    if (inMathBlock) { mathBlockLines.push(origLine); continue; }

    // Inline $$...$$ on its own line (single-line block formula)
    if (/^\$\$[^$].+[^$]\$\$$/.test(line)) {
      closeList(); closeTable(); closeBlockquote();
      result.push(`<div class="katex-block">${origLine.trim()}</div>`);
      continue;
    }

    // 1. Code Block boundary
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        closeCodeBlock();
      } else {
        closeList();
        closeTable();
        closeBlockquote();
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(origLine); // keep original spacing inside code blocks
      continue;
    }

    // 2. Blockquote
    // To allow html entity matching, check if line starts with &gt;
    if (line.startsWith("&gt;") || line.startsWith(">")) {
      closeList();
      closeTable();
      inBlockquote = true;
      // Strip > or &gt; and optional space
      let content = "";
      if (line.startsWith("&gt;")) {
        content = origLine.replace(/^\s*&gt;\s?/, "");
      } else {
        content = origLine.replace(/^\s*>\s?/, "");
      }
      blockquoteLines.push(content);
      continue;
    } else if (inBlockquote && line !== "") {
      // Lazy blockquote continuation (non-empty line without > is also blockquote)
      blockquoteLines.push(origLine);
      continue;
    } else if (inBlockquote && line === "") {
      closeBlockquote();
      continue;
    }

    // 3. Horizontal Rule
    if (line === "---" || line === "***" || line === "___") {
      closeList();
      closeTable();
      result.push('<hr class="markdown-hr" />');
      continue;
    }

    // 4. Video embeds: @[youtube](ID) or @[vimeo](ID)
    if (line.startsWith("@[")) {
      closeList();
      closeTable();
      closeBlockquote();
      const ytMatch = line.match(/^@\[youtube\]\(([A-Za-z0-9_-]+)\)$/);
      const viMatch = line.match(/^@\[vimeo\]\(([0-9]+)\)$/);
      if (ytMatch) {
        result.push(
          `<div class="markdown-video-wrap"><iframe class="markdown-video" src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
        );
      } else if (viMatch) {
        result.push(
          `<div class="markdown-video-wrap"><iframe class="markdown-video" src="https://player.vimeo.com/video/${viMatch[1]}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`
        );
      }
      continue;
    }

    // 5. Headers
    if (line.startsWith("#")) {
      closeList();
      closeTable();
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        result.push(`<h${level} class="markdown-h${level}">${inlineMarkup(text)}</h${level}>`);
        continue;
      }
    }

    // 5. Tables
    // Must start with |
    if (line.startsWith("|")) {
      closeList();
      if (!inTable) {
        inTable = true;
        tableRows = [];
        tableAlignments = [];
      }
      
      // Parse table line
      // Split by | but remove the outer ones
      let cells = origLine.split("|");
      // If the line starts and ends with | (common markdown table), cells will have empty strings at index 0 and length-1
      if (cells[0] === "") cells.shift();
      if (cells[cells.length - 1] === "") cells.pop();
      cells = cells.map(c => c.trim());

      // Check if it's separator row, e.g. :---, :---:, ---: or ---
      const isSeparator = cells.every(c => /^\s*:?-+:?\s*$/.test(c));
      if (isSeparator && tableRows.length === 1) {
        // Parse alignments
        tableAlignments = cells.map(c => {
          const left = c.startsWith(":");
          const right = c.endsWith(":");
          if (left && right) return "center";
          if (right) return "right";
          if (left) return "left";
          return "left"; // default align
        });
      } else if (!isSeparator) {
        tableRows.push(cells);
      }
      continue;
    } else {
      closeTable();
    }

    // 6. Lists
    // Unordered: starts with - , * , + 
    // Ordered: starts with digit. 
    const ulMatch = line.match(/^([\-*+])\s+(.*)$/);
    const olMatch = line.match(/^(\d+)\.\s+(.*)$/);

    if (ulMatch || olMatch) {
      const type = ulMatch ? "ul" : "ol";
      const content = ulMatch ? ulMatch[2] : olMatch![2];

      if (inList && listType !== type) {
        closeList();
      }

      if (!inList) {
        inList = true;
        listType = type;
        result.push(`<${type} class="markdown-${type}">`);
      }

      result.push(`<li>${inlineMarkup(content)}</li>`);
      continue;
    } else if (inList && line === "") {
      closeList();
      continue;
    } else if (inList && !ulMatch && !olMatch) {
      closeList();
    }

    // 7. Standalone image block: ![alt|align|width](url) on its own line
    //    Модификаторы (через |): выравнивание (left/right/center) и/или ширина (60% или 400px/400)
    const imgBlockMatch = origLine.trim().match(/^!\[([^\]|]*?)((?:\|[^\]|]+)*)\]\(([^)]+)\)$/);
    if (imgBlockMatch) {
      closeList();
      closeTable();
      closeBlockquote();
      const alt = imgBlockMatch[1];
      const mods = imgBlockMatch[2].split("|").map((s) => s.trim()).filter(Boolean);
      let align = "center";
      let width = "";
      for (const m of mods) {
        if (m === "left" || m === "right" || m === "center") align = m;
        else if (/^\d+%$/.test(m)) width = m;
        else if (/^\d+px$/.test(m)) width = m;
        else if (/^\d+$/.test(m)) width = `${m}px`;
      }
      const src = imgBlockMatch[3];
      const caption = alt.trim();
      const idx = imgBlockCount++;
      const imgStyle = width ? ` style="width:${width};max-width:100%"` : "";
      result.push(
        `<figure class="markdown-figure align-${align}" data-img-idx="${idx}">` +
        `<img src="${src}" alt="${caption}" class="markdown-img"${imgStyle} />` +
        (caption ? `<figcaption class="markdown-figcaption">${caption}</figcaption>` : "") +
        `</figure>`
      );

      // Старый визуальный редактор сохранял подпись ещё и отдельным абзацем:
      // ![Подпись](image.jpg)\n\nПодпись. Не показываем такой служебный дубль.
      if (caption) {
        const nextLine = lines[i + 1]?.trim();
        const lineAfterBlank = lines[i + 2]?.trim();
        if (nextLine === caption) i += 1;
        else if (nextLine === "" && lineAfterBlank === caption) i += 2;
      }
      continue;
    }

    // 8. Regular paragraph / empty lines
    if (line === "") {
      result.push("");
    } else {
      result.push(`<p>${inlineMarkup(origLine)}</p>`);
    }
  }

  // Close any open blocks at the end
  closeList();
  closeTable();
  closeBlockquote();
  closeCodeBlock();

  // Combine paragraph lines that shouldn't be split (adjacent <p> rows)
  const finalResult: string[] = [];
  let currentParagraph: string[] = [];

  for (let i = 0; i < result.length; i++) {
    const item = result[i];
    if (item.startsWith("<p>") && item.endsWith("</p>")) {
      const content = item.slice(3, -4);
      currentParagraph.push(content);
    } else {
      if (currentParagraph.length > 0) {
        finalResult.push(`<p>${currentParagraph.join("<br />")}</p>`);
        currentParagraph = [];
      }
      if (item !== "") {
        finalResult.push(item);
      }
    }
  }
  if (currentParagraph.length > 0) {
    finalResult.push(`<p>${currentParagraph.join("<br />")}</p>`);
  }

  return finalResult.join("\n");
}

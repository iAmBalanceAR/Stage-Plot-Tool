import { toBlob, toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { downloadBlob, getInputListTable, getSafeFileName } from "@/lib/project";
import type { StageProject } from "@/types/stage";

const PAGE_WIDTH = 792;
const PAGE_HEIGHT = 612;
const MARGIN = 32;
const ACCENT: [number, number, number] = [13, 148, 136];
const ACCENT_DEEP: [number, number, number] = [15, 118, 110];
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [186, 198, 210];
const HEADER_FILL: [number, number, number] = [15, 23, 42];
const ZEBRA: [number, number, number] = [240, 253, 250];
const WHITE: [number, number, number] = [255, 255, 255];
const PAPER: [number, number, number] = [248, 250, 252];

const prepareStageImage = async (element: HTMLElement) => {
  const previousWidth = element.style.width;
  const previousMinWidth = element.style.minWidth;
  element.style.width = "1200px";
  element.style.minWidth = "1200px";

  try {
    await document.fonts.ready;
    return await toPng(element, {
      backgroundColor: "#f8fafc",
      cacheBust: true,
      pixelRatio: 2,
      filter: (node) =>
        !(node instanceof HTMLElement && node.classList.contains("export-ignore")),
    });
  } finally {
    element.style.width = previousWidth;
    element.style.minWidth = previousMinWidth;
  }
};

const paintPaper = (pdf: jsPDF) => {
  pdf.setFillColor(...PAPER);
  pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");
};

const addDocumentHeader = (
  pdf: jsPDF,
  title: string,
  subtitle: string,
  pageLabel: string,
) => {
  pdf.setFillColor(...INK);
  pdf.rect(0, 0, PAGE_WIDTH, 78, "F");
  pdf.setFillColor(...ACCENT);
  pdf.rect(0, 0, PAGE_WIDTH, 6, "F");
  pdf.setFillColor(...ACCENT_DEEP);
  pdf.circle(MARGIN + 10, 42, 11, "F");
  pdf.setTextColor(...WHITE);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text("SC", MARGIN + 10, 44.5, { align: "center" });
  pdf.setFontSize(20);
  pdf.text(title || "Stage plot", MARGIN + 28, 36);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(186, 198, 210);
  pdf.text(subtitle || "Technical advance packet", MARGIN + 28, 54);
  pdf.setFillColor(...ACCENT);
  pdf.roundedRect(PAGE_WIDTH - MARGIN - 118, 28, 118, 22, 11, 11, "F");
  pdf.setTextColor(...WHITE);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text(pageLabel.toUpperCase(), PAGE_WIDTH - MARGIN - 59, 42, { align: "center" });
};

const addFooter = (pdf: jsPDF, project: StageProject, pageNumber: number, pageCount: number) => {
  pdf.setFillColor(...INK);
  pdf.rect(0, PAGE_HEIGHT - 26, PAGE_WIDTH, 26, "F");
  pdf.setFillColor(...ACCENT);
  pdf.rect(0, PAGE_HEIGHT - 26, PAGE_WIDTH, 3, "F");
  pdf.setTextColor(203, 213, 225);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.text(
    `StageCraft  ·  ${new Date(project.updatedAt).toLocaleDateString()}  ·  Audience at stage front`,
    MARGIN,
    PAGE_HEIGHT - 11,
  );
  pdf.text(
    [project.contact.name, project.contact.role, project.contact.email, project.contact.phone]
      .filter(Boolean)
      .join("  ·  ") || "No production contact listed",
    PAGE_WIDTH / 2,
    PAGE_HEIGHT - 11,
    { align: "center", maxWidth: 280 },
  );
  pdf.setFont("helvetica", "bold");
  pdf.text(`${pageNumber} / ${pageCount}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 11, {
    align: "right",
  });
};

const measureRowHeight = (pdf: jsPDF, row: string[], widths: number[], minHeight = 24) => {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  const lineCounts = row.map((cell, index) => {
    const lines = pdf.splitTextToSize(cell || "—", widths[index] - 14) as string[];
    return Math.max(1, lines.length);
  });
  return Math.max(minHeight, Math.max(...lineCounts) * 11 + 12);
};

const drawTable = (
  pdf: jsPDF,
  headers: string[],
  rows: string[][],
  widths: number[],
  startY: number,
  onNewPage: () => number,
  options?: { channelColumn?: boolean; badgeColumn?: number },
) => {
  let y = startY;
  const tableWidth = widths.reduce((sum, width) => sum + width, 0);
  const headerHeight = 26;

  const drawHeader = () => {
    pdf.setFillColor(...HEADER_FILL);
    pdf.roundedRect(MARGIN, y, tableWidth, headerHeight, 6, 6, "F");
    pdf.setFillColor(...HEADER_FILL);
    pdf.rect(MARGIN, y + 12, tableWidth, headerHeight - 12, "F");
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.7);
    pdf.line(MARGIN, y, MARGIN, y + headerHeight);
    pdf.line(MARGIN + tableWidth, y, MARGIN + tableWidth, y + headerHeight);
    let x = MARGIN;
    pdf.setTextColor(...WHITE);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.4);
    headers.forEach((header, index) => {
      const align = index === 0 || header === "48V" ? "center" : "left";
      pdf.text(header.toUpperCase(), align === "center" ? x + widths[index] / 2 : x + 8, y + 16, {
        align,
        maxWidth: widths[index] - 12,
      });
      if (index < headers.length - 1) {
        pdf.setDrawColor(51, 65, 85);
        pdf.setLineWidth(0.4);
        pdf.line(x + widths[index], y + 6, x + widths[index], y + headerHeight - 6);
      }
      x += widths[index];
    });
    y += headerHeight;
  };

  drawHeader();

  rows.forEach((row, rowIndex) => {
    const rowHeight = measureRowHeight(pdf, row, widths);
    if (y + rowHeight > PAGE_HEIGHT - 42) {
      y = onNewPage();
      drawHeader();
    }

    let x = MARGIN;
    const isZebra = rowIndex % 2 === 1;
    const isLastRow = rowIndex === rows.length - 1;
    pdf.setFillColor(...(isZebra ? ZEBRA : WHITE));
    if (isLastRow) {
      pdf.roundedRect(MARGIN, y, tableWidth, rowHeight, 6, 6, "F");
      pdf.rect(MARGIN, y, tableWidth, 8, "F");
    } else {
      pdf.rect(MARGIN, y, tableWidth, rowHeight, "F");
    }
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.35);
    pdf.line(MARGIN, y + rowHeight, MARGIN + tableWidth, y + rowHeight);
    pdf.setLineWidth(0.7);
    pdf.line(MARGIN, y, MARGIN, y + rowHeight);
    pdf.line(MARGIN + tableWidth, y, MARGIN + tableWidth, y + rowHeight);

    row.forEach((cell, index) => {
      pdf.setDrawColor(...LINE);
      if (index > 0) pdf.line(x, y, x, y + rowHeight);
      const value = cell || "—";
      const lines = pdf.splitTextToSize(value, widths[index] - 14) as string[];
      const textY = y + 9 + ((rowHeight - 12 - lines.length * 11) / 2 || 0);

      if (options?.channelColumn && index === 0 && value !== "—") {
        pdf.setFillColor(...ACCENT_DEEP);
        pdf.circle(x + widths[index] / 2, y + rowHeight / 2, 8, "F");
        pdf.setTextColor(...WHITE);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.text(value, x + widths[index] / 2, y + rowHeight / 2 + 2.6, { align: "center" });
      } else if (options?.badgeColumn === index && (value === "Yes" || value === "No")) {
        const isYes = value === "Yes";
        pdf.setFillColor(...(isYes ? ([204, 251, 241] as [number, number, number]) : ([241, 245, 249] as [number, number, number])));
        pdf.roundedRect(x + widths[index] / 2 - 16, y + rowHeight / 2 - 8, 32, 16, 8, 8, "F");
        pdf.setTextColor(...(isYes ? ACCENT_DEEP : MUTED));
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7.5);
        pdf.text(value, x + widths[index] / 2, y + rowHeight / 2 + 2.4, { align: "center" });
      } else {
        pdf.setTextColor(...INK);
        pdf.setFont("helvetica", index === 1 ? "bold" : "normal");
        pdf.setFontSize(8);
        const align = index === 0 ? "center" : "left";
        pdf.text(lines, align === "center" ? x + widths[index] / 2 : x + 8, Math.max(y + 15, textY + 6), {
          align,
        });
      }
      x += widths[index];
    });

    y += rowHeight;
  });

  return y;
};

const drawNoteCards = (
  pdf: jsPDF,
  sections: string[][],
  startY: number,
  onNewPage: () => number,
) => {
  let y = startY;
  const width = PAGE_WIDTH - MARGIN * 2;

  sections.forEach(([label, value]) => {
    const lines = pdf.splitTextToSize(value, width - 28) as string[];
    const height = Math.max(44, lines.length * 11 + 28);
    if (y + height > PAGE_HEIGHT - 42) y = onNewPage();
    pdf.setFillColor(...WHITE);
    pdf.setDrawColor(...LINE);
    pdf.setLineWidth(0.7);
    pdf.roundedRect(MARGIN, y, width, height, 7, 7, "FD");
    pdf.setFillColor(...ACCENT);
    pdf.rect(MARGIN, y + 8, 4, height - 16, "F");
    pdf.setTextColor(...ACCENT_DEEP);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text(label.toUpperCase(), MARGIN + 16, y + 18);
    pdf.setTextColor(...INK);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(lines, MARGIN + 16, y + 32);
    y += height + 10;
  });

  return y;
};

export const exportStageAsPng = async (project: StageProject) => {
  const element = document.getElementById("stage-export");
  if (!element) throw new Error("Stage preview is unavailable.");

  const previousWidth = element.style.width;
  const previousMinWidth = element.style.minWidth;
  element.style.width = "1200px";
  element.style.minWidth = "1200px";
  await document.fonts.ready;
  const blob = await toBlob(element, {
    backgroundColor: "#f8fafc",
    cacheBust: true,
    pixelRatio: 2,
    filter: (node) =>
      !(node instanceof HTMLElement && node.classList.contains("export-ignore")),
  }).finally(() => {
    element.style.width = previousWidth;
    element.style.minWidth = previousMinWidth;
  });
  if (!blob) throw new Error("The PNG image could not be created.");
  downloadBlob(blob, getSafeFileName(project, "png"));
};

export const exportTechnicalPacket = async (project: StageProject) => {
  const element = document.getElementById("stage-export");
  if (!element) throw new Error("Stage preview is unavailable.");

  const stageImage = await prepareStageImage(element);
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "letter",
    compress: true,
  });
  const subtitle = [
    project.eventName,
    project.venue,
    project.eventDate
      ? new Date(`${project.eventDate}T12:00:00`).toLocaleDateString()
      : "",
  ]
    .filter(Boolean)
    .join("  ·  ");
  const title = project.actName || project.name;
  const pageSlots: Array<(pageNumber: number, pageCount: number) => void> = [];

  const beginPage = (label: string, pageSubtitle = subtitle) => {
    if (pageSlots.length) pdf.addPage("letter", "landscape");
    paintPaper(pdf);
    addDocumentHeader(pdf, title, pageSubtitle || "Technical advance packet", label);
    const index = pageSlots.length;
    pageSlots.push((pageNumber, pageCount) => addFooter(pdf, project, pageNumber, pageCount));
    pdf.setPage(index + 1);
    return 94;
  };

  let cursorY = beginPage("Stage plot");
  const imageProperties = pdf.getImageProperties(stageImage);
  const frameX = MARGIN;
  const frameY = cursorY;
  const frameW = PAGE_WIDTH - MARGIN * 2;
  const frameH = 430;
  pdf.setFillColor(...WHITE);
  pdf.setDrawColor(...LINE);
  pdf.setLineWidth(1);
  pdf.roundedRect(frameX, frameY, frameW, frameH, 10, 10, "FD");
  const maxImageWidth = frameW - 24;
  const maxImageHeight = frameH - 36;
  const imageScale = Math.min(
    maxImageWidth / imageProperties.width,
    maxImageHeight / imageProperties.height,
  );
  const imageWidth = imageProperties.width * imageScale;
  const imageHeight = imageProperties.height * imageScale;
  pdf.addImage(
    stageImage,
    "PNG",
    frameX + (frameW - imageWidth) / 2,
    frameY + 12,
    imageWidth,
    imageHeight,
    undefined,
    "FAST",
  );
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...MUTED);
  pdf.text(
    `${project.stage.width} × ${project.stage.depth} ${project.stage.unit}   ·   Unmarked objects are band-provided`,
    PAGE_WIDTH / 2,
    frameY + frameH - 12,
    { align: "center" },
  );

  cursorY = beginPage(
    "Input list",
    `${project.inputs.length} channel${project.inputs.length === 1 ? "" : "s"}  ·  Patch in listed order unless agreed otherwise`,
  );
  const { headers, rows } = getInputListTable(project);
  drawTable(
    pdf,
    headers,
    rows.length ? rows : [["—", "No inputs specified", "", "", "", "", "", ""]],
    [42, 108, 118, 78, 46, 92, 52, 184],
    cursorY,
    () => beginPage("Input list · continued", subtitle),
    { channelColumn: true, badgeColumn: 4 },
  );

  cursorY = beginPage(
    "Monitors & notes",
    `${project.monitorMixes.length} monitor mix${project.monitorMixes.length === 1 ? "" : "es"}`,
  );
  cursorY = drawTable(
    pdf,
    ["Mix", "Type", "Performer / position", "Requirements"],
    project.monitorMixes.length
      ? project.monitorMixes.map((mix) => [
          mix.name,
          mix.type.toUpperCase(),
          mix.owner,
          mix.requirements,
        ])
      : [["—", "—", "No monitor mixes specified", ""]],
    [100, 80, 170, 370],
    cursorY,
    () => beginPage("Monitors · continued", subtitle),
  );

  const noteSections = [
    ["General", project.notes.general],
    ["Power", project.notes.power],
    ["Backline & staging", project.notes.backline],
    ["Schedule", project.notes.schedule],
    ["Wireless", project.notes.wireless],
  ].filter(([, value]) => value.trim());

  if (noteSections.length) {
    cursorY += 16;
    if (cursorY > PAGE_HEIGHT - 90) cursorY = beginPage("Production notes", subtitle);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...INK);
    pdf.text("PRODUCTION NOTES", MARGIN, cursorY);
    cursorY += 10;
    drawNoteCards(pdf, noteSections, cursorY, () => beginPage("Notes · continued", subtitle));
  }

  const pageCount = pageSlots.length;
  pageSlots.forEach((draw, index) => {
    pdf.setPage(index + 1);
    draw(index + 1, pageCount);
  });

  pdf.save(getSafeFileName(project, "pdf"));
};

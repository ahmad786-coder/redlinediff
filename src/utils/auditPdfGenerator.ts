import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { DiffHunk, DocumentMeta, RedlineSummary } from '../types';

interface GenerateReportOptions {
  docA: DocumentMeta;
  docB: DocumentMeta;
  hunks: DiffHunk[];
  summary: RedlineSummary;
}

function wrapText(text: string, maxCharsPerLine: number = 75): string[] {
  if (!text) return [];
  const lines: string[] = [];
  const rawParagraphs = text.replace(/\r\n/g, '\n').split('\n');

  for (const para of rawParagraphs) {
    if (para.length <= maxCharsPerLine) {
      lines.push(para);
    } else {
      const words = para.split(/\s+/);
      let currentLine = '';
      for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
          currentLine = (currentLine + ' ' + word).trim();
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
    }
  }

  return lines;
}

export async function generateAuditPdfReport({
  docA,
  docB,
  hunks,
  summary,
}: GenerateReportOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  const slateDark = rgb(0.06, 0.09, 0.16);
  const slateMuted = rgb(0.4, 0.47, 0.53);
  const slateLight = rgb(0.89, 0.91, 0.94);
  const emeraldGreen = rgb(0.02, 0.59, 0.41);
  const crimsonRed = rgb(0.86, 0.15, 0.15);
  const amberOrange = rgb(0.85, 0.47, 0.02);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  const ensureSpace = (requiredHeight: number) => {
    if (currentY - requiredHeight < 55) {
      drawFooter(currentPage);
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - margin - 20;
      drawHeaderRunning(currentPage);
    }
  };

  const drawFooter = (page: typeof currentPage) => {
    page.drawLine({
      start: { x: margin, y: 35 },
      end: { x: pageWidth - margin, y: 35 },
      thickness: 0.5,
      color: slateLight,
    });
    page.drawText('RedlineDiff — 100% Local Confidential Audit Report — Private & Zero-Cloud', {
      x: margin,
      y: 22,
      size: 8,
      font: fontRegular,
      color: slateMuted,
    });
  };

  const drawHeaderRunning = (page: typeof currentPage) => {
    page.drawText('REDLINEDIFF CONTRACT AUDIT REPORT (CONTINUED)', {
      x: margin,
      y: pageHeight - 35,
      size: 8,
      font: fontBold,
      color: slateMuted,
    });
    page.drawLine({
      start: { x: margin, y: pageHeight - 42 },
      end: { x: pageWidth - margin, y: pageHeight - 42 },
      thickness: 0.5,
      color: slateLight,
    });
  };

  // 1. Report Title & Header
  currentPage.drawText('REDLINEDIFF — LEGAL CONTRACT & CLAUSE AUDIT', {
    x: margin,
    y: currentY,
    size: 15,
    font: fontBold,
    color: slateDark,
  });
  currentY -= 16;

  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  currentPage.drawText(`Generated on: ${timestamp} | Deterministic Myers Diff & Security Scan`, {
    x: margin,
    y: currentY,
    size: 9,
    font: fontRegular,
    color: slateMuted,
  });
  currentY -= 18;

  currentPage.drawLine({
    start: { x: margin, y: currentY },
    end: { x: pageWidth - margin, y: currentY },
    thickness: 1.5,
    color: slateDark,
  });
  currentY -= 20;

  // 2. Document Metadata Box
  currentPage.drawRectangle({
    x: margin,
    y: currentY - 55,
    width: contentWidth,
    height: 55,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: slateLight,
    borderWidth: 1,
  });

  currentPage.drawText('DOCUMENT A (ORIGINAL):', {
    x: margin + 12,
    y: currentY - 18,
    size: 8,
    font: fontBold,
    color: slateMuted,
  });
  currentPage.drawText(`${docA.name} (${docA.wordCount.toLocaleString()} words${docA.pageCount ? `, ${docA.pageCount} pgs` : ''})`, {
    x: margin + 12,
    y: currentY - 32,
    size: 9.5,
    font: fontRegular,
    color: slateDark,
  });

  const col2X = margin + contentWidth / 2 + 10;
  currentPage.drawText('DOCUMENT B (REVISED):', {
    x: col2X,
    y: currentY - 18,
    size: 8,
    font: fontBold,
    color: slateMuted,
  });
  currentPage.drawText(`${docB.name} (${docB.wordCount.toLocaleString()} words${docB.pageCount ? `, ${docB.pageCount} pgs` : ''})`, {
    x: col2X,
    y: currentY - 32,
    size: 9.5,
    font: fontRegular,
    color: slateDark,
  });

  currentY -= 75;

  // 3. Telemetry & Executive Summary Stats
  ensureSpace(70);
  currentPage.drawText('EXECUTIVE AUDIT SUMMARY', {
    x: margin,
    y: currentY,
    size: 11,
    font: fontBold,
    color: slateDark,
  });
  currentY -= 16;

  const cardWidth = (contentWidth - 30) / 4;
  const cardHeight = 44;

  const metrics = [
    { label: 'TOTAL CHANGES', value: `${summary.totalChanges}`, color: slateDark },
    { label: 'SIMILARITY', value: `${summary.similarityScore}%`, color: slateDark },
    { label: 'HIGH-RISK ALERTS', value: `${summary.criticalRiskCount + summary.highRiskCount}`, color: amberOrange },
    { label: 'WORDS DEL / ADD', value: `-${summary.wordsDeleted} / +${summary.wordsAdded}`, color: emeraldGreen },
  ];

  metrics.forEach((m, idx) => {
    const cardX = margin + idx * (cardWidth + 10);
    currentPage.drawRectangle({
      x: cardX,
      y: currentY - cardHeight,
      width: cardWidth,
      height: cardHeight,
      color: rgb(0.98, 0.98, 0.99),
      borderColor: slateLight,
      borderWidth: 1,
    });

    currentPage.drawText(m.label, {
      x: cardX + 8,
      y: currentY - 14,
      size: 7,
      font: fontBold,
      color: slateMuted,
    });

    currentPage.drawText(m.value, {
      x: cardX + 8,
      y: currentY - 34,
      size: 13,
      font: fontBold,
      color: m.color,
    });
  });

  currentY -= cardHeight + 25;

  // 4. Itemized Change Log
  ensureSpace(40);
  currentPage.drawText('ITEMIZED CLAUSE REVISION LOG', {
    x: margin,
    y: currentY,
    size: 11,
    font: fontBold,
    color: slateDark,
  });
  currentY -= 8;

  currentPage.drawLine({
    start: { x: margin, y: currentY },
    end: { x: pageWidth - margin, y: currentY },
    thickness: 1,
    color: slateLight,
  });
  currentY -= 16;

  const changedHunks = hunks.filter((h) => h.type !== 'UNCHANGED');

  if (changedHunks.length === 0) {
    ensureSpace(30);
    currentPage.drawText('No differences found. Document A and Document B are identical.', {
      x: margin,
      y: currentY,
      size: 10,
      font: fontRegular,
      color: emeraldGreen,
    });
    currentY -= 30;
  } else {
    for (const hunk of changedHunks) {
      const riskColor =
        hunk.severity === 'CRITICAL'
          ? crimsonRed
          : hunk.severity === 'HIGH'
          ? amberOrange
          : slateMuted;

      const riskBadge =
        hunk.severity === 'CRITICAL'
          ? '[CRITICAL - FINANCIAL SHIFT]'
          : hunk.severity === 'HIGH'
          ? '[HIGH - LEGAL RISK]'
          : '[STANDARD EDIT]';

      const removedLines = hunk.removedValue ? wrapText(hunk.removedValue, 70) : [];
      const addedLines = hunk.addedValue ? wrapText(hunk.addedValue, 70) : [];
      const reasonLines = hunk.riskReasons.map((r) => wrapText(r, 70)).flat();

      const estimatedHeight =
        24 +
        removedLines.length * 13 +
        addedLines.length * 13 +
        reasonLines.length * 11 +
        20;

      ensureSpace(estimatedHeight);

      currentPage.drawText(`Change #${hunk.id}: ${hunk.type}`, {
        x: margin,
        y: currentY,
        size: 9.5,
        font: fontBold,
        color: slateDark,
      });

      currentPage.drawText(riskBadge, {
        x: margin + 140,
        y: currentY,
        size: 8.5,
        font: fontBold,
        color: riskColor,
      });
      currentY -= 14;

      for (const reason of reasonLines) {
        currentPage.drawText(`• ${reason}`, {
          x: margin + 8,
          y: currentY,
          size: 8,
          font: fontRegular,
          color: slateMuted,
        });
        currentY -= 11;
      }

      if (removedLines.length > 0) {
        currentY -= 2;
        currentPage.drawText('[-] Removed Original:', {
          x: margin + 8,
          y: currentY,
          size: 8,
          font: fontBold,
          color: crimsonRed,
        });
        currentY -= 11;

        for (const line of removedLines) {
          currentPage.drawText(line, {
            x: margin + 16,
            y: currentY,
            size: 8.5,
            font: fontMono,
            color: crimsonRed,
          });
          currentY -= 12;
        }
      }

      if (addedLines.length > 0) {
        currentY -= 2;
        currentPage.drawText('[+] Added Revision:', {
          x: margin + 8,
          y: currentY,
          size: 8,
          font: fontBold,
          color: emeraldGreen,
        });
        currentY -= 11;

        for (const line of addedLines) {
          currentPage.drawText(line, {
            x: margin + 16,
            y: currentY,
            size: 8.5,
            font: fontMono,
            color: emeraldGreen,
          });
          currentY -= 12;
        }
      }

      currentY -= 6;
      currentPage.drawLine({
        start: { x: margin, y: currentY },
        end: { x: pageWidth - margin, y: currentY },
        thickness: 0.5,
        color: rgb(0.92, 0.94, 0.96),
      });
      currentY -= 14;
    }
  }

  drawFooter(currentPage);

  return await pdfDoc.save();
}

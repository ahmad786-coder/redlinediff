import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import type { DocumentMeta } from '../types';

try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch (e) {
  console.warn('PDF Worker fallback resolution:', e);
}

export function normalizeText(text: string, ignoreFormattingNoise: boolean = false): string {
  if (!text) return '';
  let normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  if (ignoreFormattingNoise) {
    normalized = normalized
      .split('\n')
      .map((line) => line.trim().replace(/[ \t]+/g, ' '))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  return normalized;
}

export function calculateWordCount(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function parseDocxFile(file: File): Promise<{ text: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return { text: result.value || '' };
}

export async function parsePdfFile(file: File): Promise<{ text: string; pageCount: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    let lastY: number | null = null;
    let pageString = '';

    for (const item of textContent.items as any[]) {
      if ('str' in item) {
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
          pageString += '\n';
        } else if (pageString.length > 0 && !pageString.endsWith(' ') && !pageString.endsWith('\n')) {
          pageString += ' ';
        }
        pageString += item.str;
        lastY = item.transform[5];
      }
    }
    pageTexts.push(pageString.trim());
  }

  return {
    text: pageTexts.join('\n\n--- Page Break ---\n\n'),
    pageCount: numPages,
  };
}

export async function parseDocumentFile(file: File): Promise<DocumentMeta> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  let extractedText = '';
  let pageCount: number | undefined = undefined;
  let fileType: DocumentMeta['type'] = 'raw';

  if (ext === 'docx') {
    fileType = 'docx';
    const parsed = await parseDocxFile(file);
    extractedText = parsed.text;
  } else if (ext === 'pdf') {
    fileType = 'pdf';
    const parsed = await parsePdfFile(file);
    extractedText = parsed.text;
    pageCount = parsed.pageCount;
  } else if (ext === 'md') {
    fileType = 'md';
    extractedText = await file.text();
  } else if (ext === 'txt') {
    fileType = 'txt';
    extractedText = await file.text();
  } else {
    fileType = 'txt';
    extractedText = await file.text();
  }

  return {
    name: file.name,
    type: fileType,
    wordCount: calculateWordCount(extractedText),
    charCount: extractedText.length,
    pageCount,
    rawText: extractedText,
  };
}

export interface PdfDoc {
  fileName: string;
  numPages: number;
  pages: string[]; // index 0 is PDF page 1
  scanned: boolean;
}

/**
 * Reads a PDF fully in the browser. The file never leaves the device;
 * only the selected text of relevant pages is sent to the API routes.
 */
export async function readPdf(file: File, onProgress?: (done: number, total: number) => void): Promise<PdfDoc> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    let text = "";
    for (const item of tc.items as Array<{ str?: string; hasEOL?: boolean }>) {
      if (typeof item.str !== "string") continue;
      text += item.str + (item.hasEOL ? "\n" : " ");
    }
    pages.push(text.replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").trim());
    page.cleanup();
    if (onProgress && (i % 5 === 0 || i === doc.numPages)) onProgress(i, doc.numPages);
  }
  await doc.destroy();

  const totalChars = pages.reduce((s, p) => s + p.length, 0);
  const scanned = totalChars / Math.max(pages.length, 1) < 60;
  return { fileName: file.name, numPages: pages.length, pages, scanned };
}

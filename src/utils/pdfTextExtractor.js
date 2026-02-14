/**
 * Extract text from a PDF file (browser). Uses first pages up to maxChars.
 * @param {File} file - PDF file
 * @param {number} maxChars - Maximum characters to extract (default 5000)
 * @returns {Promise<string>}
 */
export async function extractTextFromPdf(file, maxChars = 5000) {
  const pdfjsLib = await import('pdfjs-dist');
  const pdfjs = pdfjsLib.default ?? pdfjsLib;

  if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5/build/pdf.worker.min.mjs';
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  let text = '';

  for (let i = 1; i <= numPages && text.length < maxChars; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str).filter(Boolean);
    text += strings.join(' ') + '\n';
    if (text.length >= maxChars) break;
  }

  return text.slice(0, maxChars);
}

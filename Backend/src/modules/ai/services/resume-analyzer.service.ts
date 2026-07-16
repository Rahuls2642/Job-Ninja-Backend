import { Injectable } from "@nestjs/common";
import * as pdf from "pdf-parse";
import * as mammoth from "mammoth";

@Injectable()
export class ResumeAnalyzerService {
  /**
   * Downloads a resume from its URL and extracts its raw text content.
   * Supports PDF and DOCX files.
   */
  async extractText(fileUrl: string, mimeType: string): Promise<string> {
    try {
      console.log(`[ResumeAnalyzerService] Downloading file from: ${fileUrl}`);
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file. Status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (mimeType === "application/pdf") {
        console.log("[ResumeAnalyzerService] Parsing PDF file...");
        const uint8Array = new Uint8Array(buffer);
        const parser = new pdf.PDFParse(uint8Array);
        const parsed = await parser.getText();
        return parsed.text || "";
      } else if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimeType === "application/docx" ||
        fileUrl.endsWith(".docx")
      ) {
        console.log("[ResumeAnalyzerService] Parsing DOCX file...");
        const parsed = await mammoth.extractRawText({ buffer });
        return parsed.value || "";
      } else {
        console.warn(`[ResumeAnalyzerService] Unsupported mimeType: ${mimeType}. Returning raw buffer as string.`);
        return buffer.toString("utf8");
      }
    } catch (error) {
      console.error("[ResumeAnalyzerService] Error extracting resume text:", error);
      // Return a descriptive string so that the LLM still knows it's a resume file
      return `[Resume Content Extraction Failed. MimeType: ${mimeType}]`;
    }
  }
}

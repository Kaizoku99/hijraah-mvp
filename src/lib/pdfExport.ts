
import { jsPDF } from "jspdf";

interface SopData {
    content: string;
    language: "en" | "ar";
    title: string;
    createdAt: Date;
}

export async function generateSopPdf(data: SopData): Promise<Blob> {
    const doc = new jsPDF();

    // Setup fonts
    if (data.language === "ar") {
        try {
            // Fetch Noto Sans Arabic font from Google Fonts CDN (via GitHub Raw or similar reliable source that allows CORS)
            // Using a raw git CDN which usually allows CORS
            const response = await fetch("https://github.com/google/fonts/raw/main/ofl/notosansarabic/NotoSansArabic-Regular.ttf");

            if (response.ok) {
                const fontBuffer = await response.arrayBuffer();
                const fontFileName = "NotoSansArabic-Regular.ttf";
                const base64Font = arrayBufferToBase64(fontBuffer);

                doc.addFileToVFS(fontFileName, base64Font);
                doc.addFont(fontFileName, "NotoSansArabic", "normal");
                doc.setFont("NotoSansArabic");
                doc.setR2L(true);
            } else {
                console.warn("Failed to fetch Arabic font, status:", response.status);
            }
        } catch (e) {
            console.warn("Could not load Arabic font, falling back to default", e);
        }
    }

    const isRtl = data.language === "ar";
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxLineWidth = pageWidth - (margin * 2);

    // Title
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);

    let title = data.title;
    if (isRtl) {
        // @ts-ignore - processArabic exists in newer jspdf versions but might not be in types yet
        if (doc.processArabic) {
            // @ts-ignore
            title = doc.processArabic(title);
        }
    }

    doc.text(title, pageWidth / 2, 20, { align: "center" });

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const dateStr = data.createdAt.toLocaleDateString(isRtl ? "ar-EG" : "en-US");
    doc.text(dateStr, pageWidth / 2, 28, { align: "center" });

    // Content
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    // Split text to fit width
    let content = data.content;
    if (isRtl) {
        // @ts-ignore
        if (doc.processArabic) {
            // @ts-ignore
            content = doc.processArabic(content);
        }
    }

    const splitText = doc.splitTextToSize(content, maxLineWidth);

    const x = isRtl ? pageWidth - margin : margin;
    doc.text(splitText, x, 40, { align: isRtl ? "right" : "left" });

    return doc.output("blob");
}

export function downloadPdf(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

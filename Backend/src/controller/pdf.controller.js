import { PDFDocument, rgb } from 'pdf-lib';
import crypto from 'crypto';
import AuditLog from '../models/audit.model.js';

// Helper: Calculate SHA-256 Hash
const calculateHash = (buffer) => {
    return crypto.createHash('sha256').update(buffer).digest('hex');
};

export const processPDF = async (req, res) => {
    try {
        if (!req.file || !req.body.fields) {
            return res.status(400).send("Missing PDF or Fields data");
        }

        const originalPdfBuffer = req.file.buffer;

        const fields = JSON.parse(req.body.fields);
        const pdfId = req.body.pdfId || "unknown_doc_" + Date.now();

        // Hash Original PDF
        const originalHash = calculateHash(originalPdfBuffer);
        console.log(`[AUDIT] Original Hash: ${originalHash}`);

        // Load PDF
        const pdfDoc = await PDFDocument.load(originalPdfBuffer);
        const pages = pdfDoc.getPages();

        // Process Fields (Burn-In Logic)
        for (const field of fields) {
            const page = pages[field.page - 1];
            if (!page) continue;

            const { width: pageWidth, height: pageHeight } = page.getSize();

            // Coordinate Math
            const x = (field.x / 100) * pageWidth;
            const boxWidth = (field.width / 100) * pageWidth;
            const boxHeight = (field.height / 100) * pageHeight;

            // Y-Flip
            const yRaw = (field.y / 100) * pageHeight;
            const y = pageHeight - yRaw - boxHeight;

            if (field.type === 'TEXT' || field.type === 'DATE') {
                page.drawText(field.value || '', {
                    x: x + 2,
                    y: y + (boxHeight / 2) - 4,
                    size: 10,
                    color: rgb(0, 0, 0),
                });
            }
            else if (field.type === 'RADIO') {
                if (field.value) {
                    page.drawText('X', {
                        x: x + (boxWidth / 3),
                        y: y + (boxHeight / 4),
                        size: 14,
                        color: rgb(0, 0, 0),
                    });
                }
            }
            else if ((field.type === 'SIGNATURE' || field.type === 'IMAGE') && field.value) {
                const base64Data = field.value.split(',')[1];
                if (base64Data) {
                    const imageBytes = Buffer.from(base64Data, 'base64');
                    let embeddedImage;
                    try {
                        if (field.value.includes('image/png')) embeddedImage = await pdfDoc.embedPng(imageBytes);
                        else embeddedImage = await pdfDoc.embedJpg(imageBytes);

                        const imgDims = embeddedImage.scale(1);
                        const imgRatio = imgDims.width / imgDims.height;
                        const boxRatio = boxWidth / boxHeight;
                        let drawWidth = boxWidth, drawHeight = boxHeight;

                        if (imgRatio > boxRatio) drawHeight = boxWidth / imgRatio;
                        else drawWidth = boxHeight * imgRatio;

                        page.drawImage(embeddedImage, {
                            x: x + (boxWidth - drawWidth) / 2,
                            y: y + (boxHeight - drawHeight) / 2,
                            width: drawWidth,
                            height: drawHeight,
                        });
                    } catch (e) { console.error(e); }
                }
            }
        }

        // Save Modified PDF
        const pdfBytes = await pdfDoc.save();

        // Hash Final PDF
        const finalHash = calculateHash(Buffer.from(pdfBytes));
        console.log(`[AUDIT] Final Hash: ${finalHash}`);

        // Store Audit Trail in DB
        await AuditLog.create({
            pdfId: pdfId,
            originalHash: originalHash,
            finalHash: finalHash,
            timestamp: new Date()
        });
        console.log("[DB] Audit Log Saved");

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=signed_document.pdf');
        res.send(Buffer.from(pdfBytes));

    } catch (err) {
        console.error("Error processing PDF:", err);
        res.status(500).send("Server Error");
    }
};
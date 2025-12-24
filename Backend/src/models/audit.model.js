import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
    pdfId: {
        type: String,
        required: true
    },
    originalHash: {
        type: String,
        required: true
    },
    finalHash: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    action: {
        type: String,
        default: "PDF_SIGNED"
    }
});

export default mongoose.model('AuditLog', AuditLogSchema);
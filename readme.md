# ✍️ Signature Injection Engine

A full-stack MERN prototype that allows users to place signature fields on a PDF with **pixel-perfect precision**. It bridges the gap between the Browser's coordinate system (Top-Left) and the PDF coordinate system (Bottom-Left), ensuring signatures appear exactly where placed, regardless of screen size (Mobile/Desktop).

Includes a **Security Audit Trail** that hashes documents using SHA-256 and stores the history in MongoDB.

---

### 🚀 Deliverables

-   **Live Frontend:** []
-   **Live Backend:** []

---

## 🛠 Tech Stack

-   **Frontend:** React.js, Vite, Tailwind CSS, `react-pdf`, Axios.
-   **Backend:** Node.js, Express, `pdf-lib` (PDF manipulation), `multer` (File handling).
-   **Database:** MongoDB (Audit logging with Mongoose).
-   **Security:** SHA-256 Hashing (Native Crypto module).

---

## ✨ Key Features

### 1. 📱 Flawless Responsiveness

The editor solves the "Drifting Signature" problem. Instead of storing fixed pixels, the frontend calculates coordinates as **percentages** of the PDF container.

-   **Result:** You can place a signature on a 27-inch monitor, open the same link on an iPhone, and the signature remains anchored to the correct paragraph.

### 2. 🔄 The "Coordinate Flip" Engine

Browsers render from Top-Left. PDFs render from Bottom-Left. The backend implements a conversion engine:

This ensures the signature is not pasted upside-down or at the wrong vertical position.

### 3. 🛡️ Security & Audit Trail

For legal validity, every transaction is recorded in MongoDB:

1. **Before Signing**: SHA-256 Hash of original PDF is calculated.

2. **After Signing**: SHA-256 Hash of the final PDF is calculated.

3. **Storage**: Both hashes + Timestamp are saved to the AuditLog collection.

### 🏃‍♂️ Local Setup Guide

**Prerequisites**

-   Node.js

-   MongoDB Connection String (Atlas or Local)

**1. Clone the Repository**

```bash
git clone https://github.com/chamollamohit/sign-pdf-engine
cd boloforms-assignment
```

**2. Backend Setup**

```bash
cd backend
npm install

# Create a .env file
"PORT = 5000"
"MONGO_URI = your_mongodb_connection_string"
"FRONTEND_URL = http://localhost:5173"

# Run Server
npm run dev
```

Output should say: Burn-In Engine running on port 5000

**3. Frontend Setup**
Open a new terminal:

```bash
cd frontend
npm install

# Run Client
npm run dev
```

Open http://localhost:5173 in your browser.

### 📝 API Endpoints

`POST /sign-pdf`
Receives the PDF and coordinate data, returns the signed PDF binary.

**Payload (Multipart/Form-Data):**

-   `pdf`: (File) The original PDF document.

-   `pdfId`: (String) Unique ID for the audit trail.

-   `fields`: (JSON String) Array of field objects:

```json
[
    {
        "type": "SIGNATURE",
        "page": 1,
        "x": 45.5, // Percentage
        "y": 20.1, // Percentage
        "width": 15, // Percentage
        "height": 5, // Percentage
        "value": "data:image/png;base64,..."
    }
]
```

### 🤝 Assumptions Made

1. **Single File Workflow**: The user uploads one PDF, signs it, and downloads it immediately.

2. **Field Types**: The assignment asked for Text, Signature, Image, Date, and Radio. All are implemented.

3. **Storage**: The actual PDF files are processed in memory (RAM) and returned directly to the user to maintain privacy/speed; only the Hashes are stored in the database.

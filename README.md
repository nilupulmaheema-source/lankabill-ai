# LankaBill AI - High-Speed Sri Lankan Invoice & Receipt Scanner PWA

A mobile-first, high-speed Progressive Web App (PWA) tailored specifically for Sri Lankan retail businesses (pharmacies, hardware stores, grocery distributors, and building material yards).

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Google Gen AI SDK (`@google/genai`)** with model **`gemini-2.5-flash`**, and **Supabase (PostgreSQL)** with offline fallback.

---

## 🌟 Key Features

### 1. Tailored for Sri Lankan Retail & Hardware Stores
- **Multilingual OCR:** Accurately extracts English, Sinhala Unicode (e.g., සිමෙන්ති, බට, ඇණ, තහඩු, කම්බි), and Singlish (weli cube, kambi 10mm, s-lon, boralu).
- **Localized Packaging Normalization:** Automatically standardizes local units like `pkt`, `nos`, `cube` (sand/soil), `kg`, `bundle`, `mtr`, `roll` (barbed wire), `btl`, and `box`.
- **Anti-Hallucination Guardrails:** If handwriting or numbers are illegible, returns `null` instead of guessing.

### 2. High-Speed Mobile Capture (< 5s Target)
- Direct camera trigger with `<input type="file" accept="image/*" capture="environment">`.
- **Client-Side Image Compression:** Compresses camera snaps down to max 1600px and 0.85 JPEG on HTML5 Canvas in ~100ms, shrinking 5MB-10MB mobile photos to under 400KB for rapid 4G uploading.
- **Animated Laser Skeleton:** Live elapsed timer and step-by-step progress indicator.
- **1-Click Sri Lankan Benchmark Samples:** Test instantly with sample bills (Nawala Hardware, Western Pharma GRN, or Math Discrepancy chit) without needing a physical invoice in hand.

### 3. Side-by-Side Review & Arithmetic Integrity UX
- **Interactive Pan-and-Zoom Viewer:** Mouse drag / touch drag, zoom in/out (+/-), 90° clockwise rotation (for sideways receipts), and fit-to-screen.
- **Live Arithmetic Integrity Check:**
  - Auto-calculates `Calculated Total = Sum(Qty * Unit Price)`.
  - Compares against `Grand Total` on the bill.
  - If discrepancy > Rs. 1.00: Highlights mismatch in yellow, flags affected line items, and provides a 1-click **"Auto-Balance Total"** button.
- **Inline Editable Grid:** Edit descriptions, quantities, unit prices, or add/delete line items on the fly.

### 4. Ledger & Records History
- Search and filter by vendor, invoice number, item name, retail category, or verification status (`Approved`, `Flagged`, `Pending Verification`).
- **Export to CSV / Excel:** One-click download formatted for Sri Lankan bookkeeping and accounting.
- **Sync to Google Sheets:** 1-click copy formatted TSV directly to clipboard to paste into Google Spreadsheets with all Sinhala Unicode text preserved.
- **Detail Modal:** View original bill scan, complete line items table, and timestamp audit trail.

### 5. Supabase Database & Offline-First Resiliency
- SQL schema in `supabase/schema.sql` for PostgreSQL tables: `invoices`, `invoice_items`, `audit_logs` with RLS and Realtime replication enabled.
- Automatic fallback to browser `localStorage` when offline or before Supabase keys are configured, so counter staff never lose data.
- Built-in In-App Settings modal to configure `GEMINI_API_KEY` and Supabase keys directly in the browser.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v20 / v22)
- npm or pnpm

### Installation
```bash
# Clone or navigate to the project directory
cd "AI Automation 0$ "

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser (or on your mobile phone on the same Wi-Fi network).

---

## ⚙️ Environment Variables (Optional)

Create a `.env.local` file in the root folder:

```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase (Optional)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

> **Tip:** You can also configure your Gemini and Supabase keys directly in the app by clicking the **Settings** gear icon in the top right!

---

## 📊 Database Schema (Supabase)

To set up Supabase, navigate to the **SQL Editor** in your Supabase dashboard and execute the script in `supabase/schema.sql`:

```sql
-- See supabase/schema.sql for the full script
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_name VARCHAR(255) NOT NULL DEFAULT 'Unknown Vendor',
    invoice_number VARCHAR(100) NOT NULL DEFAULT 'N/A',
    invoice_date DATE DEFAULT CURRENT_DATE,
    category VARCHAR(50) DEFAULT 'General' CHECK (category IN ('Pharmacy', 'Hardware', 'General', 'Utilities')),
    grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    calculated_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    discrepancy NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pending Verification' CHECK (status IN ('Pending Verification', 'Approved', 'Flagged')),
    confidence_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📱 PWA Installation
- **On Android (Chrome):** Tap the 3 dots menu &rarr; **"Add to Home Screen"** or **"Install app"**.
- **On iOS (Safari):** Tap Share &rarr; **"Add to Home Screen"**.

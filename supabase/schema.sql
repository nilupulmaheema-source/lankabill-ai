-- Supabase Database Schema for LankaBill Scanner PWA
-- Run this in your Supabase SQL Editor (https://app.supabase.com)

-- 1. Create Invoices Table
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
    image_url TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unit VARCHAR(30) DEFAULT 'nos',
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    performed_by VARCHAR(100) DEFAULT 'Staff Counter',
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_category ON invoices(category);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_name ON invoices(vendor_name);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- 5. Enable Real-Time on Invoices
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;

-- 6. Row Level Security (RLS) - Public / Anonymous access for retail counter
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on invoices" ON invoices FOR SELECT USING (true);
CREATE POLICY "Allow public insert on invoices" ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on invoices" ON invoices FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on invoices" ON invoices FOR DELETE USING (true);

CREATE POLICY "Allow public read on invoice_items" ON invoice_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on invoice_items" ON invoice_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on invoice_items" ON invoice_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on invoice_items" ON invoice_items FOR DELETE USING (true);

CREATE POLICY "Allow public read on audit_logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on audit_logs" ON audit_logs FOR INSERT WITH CHECK (true);

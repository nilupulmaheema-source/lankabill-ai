import { InvoiceExtraction } from '../types/invoice';

export interface SampleBill {
  id: string;
  title: string;
  category: 'Pharmacy' | 'Hardware' | 'General';
  description: string;
  imageUrl: string;
  hasDiscrepancy?: boolean;
  data: InvoiceExtraction;
}

export const SAMPLE_BILLS: SampleBill[] = [
  {
    id: 'sample-hardware-1',
    title: 'Nawala Builders & Hardware (සිමෙන්ති / බට)',
    category: 'Hardware',
    description: 'Bilingual Hardware chit with Sinhala Unicode (සිමෙන්ති, බට) & Singlish (Weli cube, Kambi).',
    imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850" style="background:#fdfcf7; font-family:sans-serif; color:#1e293b;">
        <rect width="600" height="850" fill="#fdfcf7"/>
        <rect x="20" y="20" width="560" height="810" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="6 6"/>
        <text x="300" y="70" font-size="24" font-weight="bold" text-anchor="middle" fill="#0f172a">NAWALA BUILDERS &amp; HARDWARE</text>
        <text x="300" y="95" font-size="13" text-anchor="middle" fill="#64748b">No. 142/B, Nawala Road, Rajagiriya | Tel: 011-2874921</text>
        <text x="300" y="115" font-size="12" font-weight="bold" text-anchor="middle" fill="#0369a1">SUPPLIER DELIVERY CHIT / CASH INVOICE</text>
        <line x1="40" y1="130" x2="560" y2="130" stroke="#0f172a" stroke-width="1.5"/>
        <text x="45" y="155" font-size="13"><b>Bill To:</b> City Hardware Retail</text>
        <text x="45" y="175" font-size="13"><b>Inv No:</b> NBH-2026-891</text>
        <text x="400" y="155" font-size="13"><b>Date:</b> 2026-11-04</text>
        <text x="400" y="175" font-size="13"><b>Vehicle:</b> WP-CAB-4412</text>
        <line x1="40" y1="195" x2="560" y2="195" stroke="#94a3b8" stroke-width="1"/>
        <rect x="40" y="200" width="520" height="30" fill="#f1f5f9"/>
        <text x="50" y="220" font-size="12" font-weight="bold">#</text>
        <text x="80" y="220" font-size="12" font-weight="bold">DESCRIPTION / විස්තරය</text>
        <text x="330" y="220" font-size="12" font-weight="bold">QTY / UNIT</text>
        <text x="430" y="220" font-size="12" font-weight="bold">PRICE (LKR)</text>
        <text x="505" y="220" font-size="12" font-weight="bold">TOTAL</text>
        <line x1="40" y1="230" x2="560" y2="230" stroke="#cbd5e1" stroke-width="1"/>
        
        <text x="50" y="260" font-size="12">01</text>
        <text x="80" y="260" font-size="12">Tokyo Super Cement (සිමෙන්ති 50kg)</text>
        <text x="330" y="260" font-size="12">20 bag</text>
        <text x="430" y="260" font-size="12">2,450.00</text>
        <text x="505" y="260" font-size="12">49,000.00</text>

        <text x="50" y="295" font-size="12">02</text>
        <text x="80" y="295" font-size="12">1/2" S-Lon PVC බට Type 400</text>
        <text x="330" y="295" font-size="12">15 nos</text>
        <text x="430" y="295" font-size="12">680.00</text>
        <text x="505" y="295" font-size="12">10,200.00</text>

        <text x="50" y="330" font-size="12">03</text>
        <text x="80" y="330" font-size="12">Weli Cube (River Sand Grade 1)</text>
        <text x="330" y="330" font-size="12">2 cube</text>
        <text x="430" y="330" font-size="12">18,500.00</text>
        <text x="505" y="330" font-size="12">37,000.00</text>

        <text x="50" y="365" font-size="12">04</text>
        <text x="80" y="365" font-size="12">Kambi 10mm Tor Steel (යකඩ කම්බි)</text>
        <text x="330" y="365" font-size="12">10 bundle</text>
        <text x="430" y="365" font-size="12">3,200.00</text>
        <text x="505" y="365" font-size="12">32,000.00</text>

        <text x="50" y="400" font-size="12">05</text>
        <text x="80" y="400" font-size="12">Wire Nails 2" (ඇණ)</text>
        <text x="330" y="400" font-size="12">5 kg</text>
        <text x="430" y="400" font-size="12">480.00</text>
        <text x="505" y="400" font-size="12">2,400.00</text>

        <line x1="40" y1="440" x2="560" y2="440" stroke="#cbd5e1" stroke-width="1"/>
        <rect x="310" y="460" width="250" height="70" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
        <text x="325" y="485" font-size="13" font-weight="bold">SUB TOTAL:</text>
        <text x="480" y="485" font-size="13" text-anchor="end">130,600.00</text>
        <text x="325" y="515" font-size="15" font-weight="bold" fill="#0f172a">GRAND TOTAL (LKR):</text>
        <text x="550" y="515" font-size="16" font-weight="bold" fill="#059669" text-anchor="end">Rs. 130,600.00</text>

        <text x="50" y="600" font-size="11" fill="#64748b">Goods received in good condition.</text>
        <line x1="50" y1="670" x2="200" y2="670" stroke="#94a3b8" stroke-width="1"/>
        <text x="50" y="690" font-size="11" fill="#64748b">Driver Signature</text>

        <line x1="380" y1="670" x2="530" y2="670" stroke="#94a3b8" stroke-width="1"/>
        <text x="380" y="690" font-size="11" fill="#64748b">Store Keeper Stamp &amp; Sign</text>
        <circle cx="455" cy="650" r="30" fill="none" stroke="#2563eb" stroke-width="2" opacity="0.6"/>
        <text x="455" y="655" font-size="10" font-weight="bold" text-anchor="middle" fill="#2563eb" opacity="0.7">RECEIVED</text>
      </svg>
    `),
    data: {
      vendor_name: 'Nawala Builders & Hardware',
      invoice_number: 'NBH-2026-891',
      invoice_date: '2026-11-04',
      category: 'Hardware',
      items: [
        { name: 'Tokyo Super Cement (සිමෙන්ති 50kg)', quantity: 20, unit: 'bag', unit_price: 2450.00, total: 49000.00 },
        { name: '1/2" S-Lon PVC බට Type 400', quantity: 15, unit: 'nos', unit_price: 680.00, total: 10200.00 },
        { name: 'Weli Cube (River Sand Grade 1)', quantity: 2, unit: 'cube', unit_price: 18500.00, total: 37000.00 },
        { name: 'Kambi 10mm Tor Steel (යකඩ කම්බි)', quantity: 10, unit: 'bundle', unit_price: 3200.00, total: 32000.00 },
        { name: 'Wire Nails 2" (ඇණ)', quantity: 5, unit: 'kg', unit_price: 480.00, total: 2400.00 },
      ],
      grand_total: 130600.00,
      confidence_notes: 'High confidence. Sinhala Unicode terms (සිමෙන්ති, බට, ඇණ) and Singlish cube units extracted accurately.'
    }
  },
  {
    id: 'sample-pharma-2',
    title: 'Western Pharmaceuticals Dist. (GRN)',
    category: 'Pharmacy',
    description: 'Pharmaceutical Delivery Note with batch numbers, blister strips, and unit pricing.',
    imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850" style="background:#ffffff; font-family:sans-serif; color:#0f172a;">
        <rect width="600" height="850" fill="#ffffff"/>
        <rect x="25" y="25" width="550" height="800" fill="none" stroke="#e2e8f0" stroke-width="2"/>
        <rect x="25" y="25" width="550" height="15" fill="#0d9488"/>
        <text x="45" y="75" font-size="22" font-weight="bold" fill="#0f766e">WESTERN PHARMACEUTICAL DISTRIBUTORS (PVT) LTD</text>
        <text x="45" y="98" font-size="12" fill="#475569">45 Galle Road, Colombo 03 | NMRA Reg: WD-4029 | Tel: 011-2559100</text>
        <text x="45" y="125" font-size="14" font-weight="bold" fill="#1e293b">GOODS RECEIVED NOTE (GRN) / TAX INVOICE</text>
        <line x1="45" y1="135" x2="555" y2="135" stroke="#cbd5e1" stroke-width="1"/>
        <text x="45" y="160" font-size="12"><b>Customer:</b> Royal Care Pharmacy</text>
        <text x="45" y="180" font-size="12"><b>Invoice No:</b> WP-INV-99420</text>
        <text x="380" y="160" font-size="12"><b>Date:</b> 2026-11-05</text>
        <text x="380" y="180" font-size="12"><b>Payment Terms:</b> 30 Days Credit</text>
        <rect x="45" y="200" width="510" height="28" fill="#f0fdfa"/>
        <text x="55" y="218" font-size="11" font-weight="bold" fill="#0f766e">ITEM DESCRIPTION</text>
        <text x="280" y="218" font-size="11" font-weight="bold" fill="#0f766e">BATCH</text>
        <text x="345" y="218" font-size="11" font-weight="bold" fill="#0f766e">QTY / UNIT</text>
        <text x="425" y="218" font-size="11" font-weight="bold" fill="#0f766e">PRICE (LKR)</text>
        <text x="500" y="218" font-size="11" font-weight="bold" fill="#0f766e">TOTAL</text>
        <line x1="45" y1="230" x2="555" y2="230" stroke="#0d9488" stroke-width="1"/>

        <text x="55" y="255" font-size="12">Panadol 500mg Tablets (100s box)</text>
        <text x="280" y="255" font-size="11" fill="#64748b">B#GS881</text>
        <text x="345" y="255" font-size="12">50 box</text>
        <text x="425" y="255" font-size="12">420.00</text>
        <text x="500" y="255" font-size="12">21,000.00</text>

        <text x="55" y="290" font-size="12">Amoxicillin 250mg Capsules (10x10)</text>
        <text x="280" y="290" font-size="11" fill="#64748b">B#AM201</text>
        <text x="345" y="290" font-size="12">30 pkt</text>
        <text x="425" y="290" font-size="12">950.00</text>
        <text x="500" y="290" font-size="12">28,500.00</text>

        <text x="55" y="325" font-size="12">Cetirizine 10mg Tablets (Alu-Alu)</text>
        <text x="280" y="325" font-size="11" fill="#64748b">B#CT994</text>
        <text x="345" y="325" font-size="12">40 box</text>
        <text x="425" y="325" font-size="12">380.00</text>
        <text x="500" y="325" font-size="12">15,200.00</text>

        <text x="55" y="360" font-size="12">Betadine Antiseptic Solution 60ml</text>
        <text x="280" y="360" font-size="11" fill="#64748b">B#BT440</text>
        <text x="345" y="360" font-size="12">24 btl</text>
        <text x="425" y="360" font-size="12">550.00</text>
        <text x="500" y="360" font-size="12">13,200.00</text>

        <line x1="45" y1="390" x2="555" y2="390" stroke="#cbd5e1" stroke-width="1"/>
        <rect x="330" y="410" width="225" height="60" fill="#f8fafc" stroke="#0d9488" stroke-width="1.5"/>
        <text x="345" y="445" font-size="14" font-weight="bold">NET AMOUNT (LKR):</text>
        <text x="540" y="445" font-size="15" font-weight="bold" fill="#0f766e" text-anchor="end">Rs. 77,900.00</text>

        <text x="55" y="530" font-size="11" fill="#64748b">Verified by Pharmacist: SLMC-8944</text>
        <rect x="55" y="550" width="160" height="50" fill="#ecfdf5" stroke="#10b981" stroke-width="1" rx="4"/>
        <text x="135" y="580" font-size="12" font-weight="bold" fill="#047857" text-anchor="middle">PASSED QA INSPECTION</text>
      </svg>
    `),
    data: {
      vendor_name: 'Western Pharmaceuticals Dist. (Pvt) Ltd',
      invoice_number: 'WP-INV-99420',
      invoice_date: '2026-11-05',
      category: 'Pharmacy',
      items: [
        { name: 'Panadol 500mg Tablets (100s box)', quantity: 50, unit: 'box', unit_price: 420.00, total: 21000.00 },
        { name: 'Amoxicillin 250mg Capsules (10x10)', quantity: 30, unit: 'pkt', unit_price: 950.00, total: 28500.00 },
        { name: 'Cetirizine 10mg Tablets (Alu-Alu)', quantity: 40, unit: 'box', unit_price: 380.00, total: 15200.00 },
        { name: 'Betadine Antiseptic Solution 60ml', quantity: 24, unit: 'btl', unit_price: 550.00, total: 13200.00 },
      ],
      grand_total: 77900.00,
      confidence_notes: 'Extracted with high confidence. Batch numbers identified and packaging units normalized (box, pkt, btl).'
    }
  },
  {
    id: 'sample-discrepancy-3',
    title: 'Lanka Agri & Hardware Chit [DISCREPANCY ALERT]',
    category: 'Hardware',
    hasDiscrepancy: true,
    description: 'Includes a deliberate calculation mismatch on the supplier chit (Difference: Rs. 1,500) to test arithmetic integrity checks.',
    imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850" style="background:#fffbeb; font-family:sans-serif; color:#78350f;">
        <rect width="600" height="850" fill="#fffbeb"/>
        <rect x="25" y="25" width="550" height="800" fill="none" stroke="#fde68a" stroke-width="2"/>
        <text x="300" y="70" font-size="22" font-weight="bold" text-anchor="middle" fill="#92400e">LANKA AGRI &amp; HARDWARE SUPPLIERS</text>
        <text x="300" y="95" font-size="12" text-anchor="middle" fill="#b45309">Main Street, Kurunegala | Tel: 037-2281902</text>
        <text x="300" y="118" font-size="13" font-weight="bold" text-anchor="middle" fill="#d97706">HANDWRITTEN CASH CHIT / RECEIPT</text>
        <line x1="45" y1="130" x2="555" y2="130" stroke="#f59e0b" stroke-width="1"/>
        <text x="45" y="160" font-size="13"><b>Shop:</b> Gamage Stores</text>
        <text x="45" y="180" font-size="13"><b>Chit No:</b> LAH-7721</text>
        <text x="400" y="160" font-size="13"><b>Date:</b> 2026-11-06</text>
        
        <rect x="45" y="200" width="510" height="28" fill="#fef3c7"/>
        <text x="55" y="218" font-size="11" font-weight="bold">ITEM</text>
        <text x="320" y="218" font-size="11" font-weight="bold">QTY</text>
        <text x="410" y="218" font-size="11" font-weight="bold">RATE (RS)</text>
        <text x="490" y="218" font-size="11" font-weight="bold">TOTAL</text>
        <line x1="45" y1="230" x2="555" y2="230" stroke="#f59e0b" stroke-width="1"/>

        <text x="55" y="260" font-size="12">GI Barbed Wire 12 Gauge (කම්බි රෝල)</text>
        <text x="320" y="260" font-size="12">4 roll</text>
        <text x="410" y="260" font-size="12">7,500.00</text>
        <text x="490" y="260" font-size="12">30,000.00</text>

        <!-- Deliberate supplier math error on chit: 10 * 850 = 8500, but handwritten as 10,000 -->
        <text x="55" y="300" font-size="12" fill="#b91c1c">Zinc Corrugated Sheet 8ft (තහඩු)</text>
        <text x="320" y="300" font-size="12">10 nos</text>
        <text x="410" y="300" font-size="12">850.00</text>
        <text x="490" y="300" font-size="12" fill="#b91c1c" font-weight="bold">10,000.00 *</text>

        <text x="55" y="340" font-size="12">Water Hose 1/2" Heavy Duty</text>
        <text x="320" y="340" font-size="12">2 roll</text>
        <text x="410" y="340" font-size="12">4,200.00</text>
        <text x="490" y="340" font-size="12">8,400.00</text>

        <line x1="45" y1="380" x2="555" y2="380" stroke="#f59e0b" stroke-width="1"/>
        <rect x="300" y="400" width="255" height="55" fill="#fef9c3" stroke="#eab308" stroke-width="1.5"/>
        <text x="315" y="435" font-size="14" font-weight="bold">WRITTEN GRAND TOTAL:</text>
        <text x="540" y="435" font-size="15" font-weight="bold" fill="#b45309" text-anchor="end">Rs. 48,400.00</text>

        <rect x="45" y="480" width="510" height="50" fill="#fee2e2" stroke="#ef4444" stroke-width="1" rx="4"/>
        <text x="60" y="505" font-size="11" font-weight="bold" fill="#991b1b">⚠️ SUPPLIER ARITHMETIC ERROR ON BILL</text>
        <text x="60" y="522" font-size="11" fill="#7f1d1d">Line 2 says 10 x Rs. 850 = Rs. 10,000 (should be Rs. 8,500). True sum is Rs. 46,900.</text>
      </svg>
    `),
    data: {
      vendor_name: 'Lanka Agri & Hardware Suppliers',
      invoice_number: 'LAH-7721',
      invoice_date: '2026-11-06',
      category: 'Hardware',
      items: [
        { name: 'GI Barbed Wire 12 Gauge (කම්බි රෝල)', quantity: 4, unit: 'roll', unit_price: 7500.00, total: 30000.00 },
        { name: 'Zinc Corrugated Sheet 8ft (තහඩු)', quantity: 10, unit: 'nos', unit_price: 850.00, total: 10000.00, isFlagged: true, flagReason: 'Math discrepancy: 10 x 850 = 8,500, bill states 10,000' },
        { name: 'Water Hose 1/2" Heavy Duty', quantity: 2, unit: 'roll', unit_price: 4200.00, total: 8400.00 },
      ],
      grand_total: 48400.00,
      confidence_notes: 'Arithmetic discrepancy detected between line calculation (10 x 850 = 8500) and handwritten line total (10,000).'
    }
  }
];

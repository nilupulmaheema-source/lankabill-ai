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
    description: 'Pharmaceutical Delivery Note / GRN with product codes, batch numbers, expiry dates, retail MRP, and trade discount.',
    imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850" style="background:#ffffff; font-family:sans-serif; color:#0f172a;">
        <rect width="600" height="850" fill="#ffffff"/>
        <rect x="25" y="25" width="550" height="800" fill="none" stroke="#e2e8f0" stroke-width="2"/>
        <rect x="25" y="25" width="550" height="15" fill="#0d9488"/>
        <text x="45" y="75" font-size="20" font-weight="bold" fill="#0f766e">WESTERN PHARMACEUTICAL DISTRIBUTORS (PVT) LTD</text>
        <text x="45" y="96" font-size="11" fill="#475569">45 Galle Road, Colombo 03 | NMRA Reg: WD-4029 | Tel: 011-2559100</text>
        <text x="45" y="120" font-size="13" font-weight="bold" fill="#1e293b">PHARMA GOODS RECEIVED NOTE (GRN) / TAX INVOICE</text>
        <line x1="45" y1="130" x2="555" y2="130" stroke="#cbd5e1" stroke-width="1"/>
        <text x="45" y="152" font-size="11"><b>Customer:</b> Royal Care Pharmacy</text>
        <text x="45" y="170" font-size="11"><b>Invoice No:</b> WP-INV-99420</text>
        <text x="360" y="152" font-size="11"><b>Date:</b> 2026-11-05</text>
        <text x="360" y="170" font-size="11"><b>Payment Terms:</b> 30 Days Credit</text>
        
        <rect x="35" y="188" width="530" height="26" fill="#f0fdfa"/>
        <text x="42" y="205" font-size="10" font-weight="bold" fill="#0f766e">CODE</text>
        <text x="95" y="205" font-size="10" font-weight="bold" fill="#0f766e">ITEM DESCRIPTION</text>
        <text x="260" y="205" font-size="10" font-weight="bold" fill="#0f766e">BATCH / EXP</text>
        <text x="345" y="205" font-size="10" font-weight="bold" fill="#0f766e">QTY</text>
        <text x="390" y="205" font-size="10" font-weight="bold" fill="#0f766e">W/SALE</text>
        <text x="450" y="205" font-size="10" font-weight="bold" fill="#0f766e">MRP</text>
        <text x="495" y="205" font-size="10" font-weight="bold" fill="#0f766e">DISC%</text>
        <text x="535" y="205" font-size="10" font-weight="bold" fill="#0f766e">TOTAL</text>
        <line x1="35" y1="216" x2="565" y2="216" stroke="#0d9488" stroke-width="1"/>

        <text x="42" y="242" font-size="11" font-family="monospace">MED-101</text>
        <text x="95" y="242" font-size="11">Panadol 500mg Tab (100s)</text>
        <text x="260" y="242" font-size="10" fill="#64748b">GS881 (04/28)</text>
        <text x="345" y="242" font-size="11">50 box</text>
        <text x="390" y="242" font-size="11">420.00</text>
        <text x="450" y="242" font-size="10" fill="#64748b">450.00</text>
        <text x="500" y="242" font-size="11">0%</text>
        <text x="560" y="242" font-size="11" text-anchor="end">21,000.00</text>

        <text x="42" y="278" font-size="11" font-family="monospace">MED-205</text>
        <text x="95" y="278" font-size="11">Amoxicillin 250mg Cap (10x10)</text>
        <text x="260" y="278" font-size="10" fill="#64748b">AM201 (11/27)</text>
        <text x="345" y="278" font-size="11">30 pkt</text>
        <text x="390" y="278" font-size="11">1,000.00</text>
        <text x="450" y="278" font-size="10" fill="#64748b">1,200.00</text>
        <text x="500" y="278" font-size="11" fill="#0d9488">5%</text>
        <text x="560" y="278" font-size="11" text-anchor="end">28,500.00</text>

        <text x="42" y="314" font-size="11" font-family="monospace">MED-318</text>
        <text x="95" y="314" font-size="11">Cetirizine 10mg Tab (Alu-Alu)</text>
        <text x="260" y="314" font-size="10" fill="#64748b">CT994 (09/27)</text>
        <text x="345" y="314" font-size="11">40 box</text>
        <text x="390" y="314" font-size="11">400.00</text>
        <text x="450" y="314" font-size="10" fill="#64748b">450.00</text>
        <text x="500" y="314" font-size="11" fill="#0d9488">5%</text>
        <text x="560" y="314" font-size="11" text-anchor="end">15,200.00</text>

        <text x="42" y="350" font-size="11" font-family="monospace">MED-442</text>
        <text x="95" y="350" font-size="11">Betadine Antiseptic Sol. 60ml</text>
        <text x="260" y="350" font-size="10" fill="#64748b">BT440 (02/28)</text>
        <text x="345" y="350" font-size="11">24 btl</text>
        <text x="390" y="350" font-size="11">550.00</text>
        <text x="450" y="350" font-size="10" fill="#64748b">620.00</text>
        <text x="500" y="350" font-size="11">0%</text>
        <text x="560" y="350" font-size="11" text-anchor="end">13,200.00</text>

        <line x1="35" y1="380" x2="565" y2="380" stroke="#cbd5e1" stroke-width="1"/>
        <rect x="330" y="400" width="235" height="60" fill="#f8fafc" stroke="#0d9488" stroke-width="1.5"/>
        <text x="345" y="435" font-size="13" font-weight="bold">NET AMOUNT (LKR):</text>
        <text x="550" y="435" font-size="15" font-weight="bold" fill="#0f766e" text-anchor="end">Rs. 77,900.00</text>

        <text x="45" y="520" font-size="11" fill="#64748b">Verified by Pharmacist: SLMC-8944</text>
        <rect x="45" y="540" width="160" height="45" fill="#ecfdf5" stroke="#10b981" stroke-width="1" rx="4"/>
        <text x="125" y="567" font-size="11" font-weight="bold" fill="#047857" text-anchor="middle">PASSED QA INSPECTION</text>
      </svg>
    `),
    data: {
      vendor_name: 'Western Pharmaceuticals Dist. (Pvt) Ltd',
      invoice_number: 'WP-INV-99420',
      invoice_date: '2026-11-05',
      category: 'Pharmacy',
      items: [
        {
          name: 'Panadol 500mg Tablets (100s box)',
          product_code: 'MED-101',
          batch_no: 'GS881',
          expiry_date: '2028-04',
          quantity: 50,
          unit: 'box',
          unit_price: 420.00,
          retail_price: 450.00,
          discount_percent: 0,
          total: 21000.00
        },
        {
          name: 'Amoxicillin 250mg Capsules (10x10)',
          product_code: 'MED-205',
          batch_no: 'AM201',
          expiry_date: '2027-11',
          quantity: 30,
          unit: 'pkt',
          unit_price: 1000.00,
          retail_price: 1200.00,
          discount_percent: 5,
          total: 28500.00
        },
        {
          name: 'Cetirizine 10mg Tablets (Alu-Alu)',
          product_code: 'MED-318',
          batch_no: 'CT994',
          expiry_date: '2027-09',
          quantity: 40,
          unit: 'box',
          unit_price: 400.00,
          retail_price: 450.00,
          discount_percent: 5,
          total: 15200.00
        },
        {
          name: 'Betadine Antiseptic Solution 60ml',
          product_code: 'MED-442',
          batch_no: 'BT440',
          expiry_date: '2028-02',
          quantity: 24,
          unit: 'btl',
          unit_price: 550.00,
          retail_price: 620.00,
          discount_percent: 0,
          total: 13200.00
        },
      ],
      grand_total: 77900.00,
      confidence_notes: 'Extracted with high confidence. Product codes (MED-101..), batch numbers, expiry dates, trade discount %, and canonical units normalized (box, pkt, btl).'
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
  },
  {
    id: 'sample-torn-4',
    title: 'Piliyandala Yard Chit [TORN PAPER / NULL GUARD]',
    category: 'Hardware',
    description: 'Damaged paper with a physically torn price on line 2. Tests zero-hallucination null guardrails.',
    imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850" style="background:#fef2f2; font-family:sans-serif; color:#450a0a;">
        <rect width="600" height="850" fill="#fef2f2"/>
        <rect x="25" y="25" width="550" height="800" fill="none" stroke="#fca5a5" stroke-width="2"/>
        <text x="300" y="70" font-size="22" font-weight="bold" text-anchor="middle" fill="#991b1b">PILIYANDALA BUILDING MATERIALS YARD</text>
        <text x="300" y="95" font-size="12" text-anchor="middle" fill="#b91c1c">Bypass Road, Piliyandala | Tel: 011-2618991</text>
        <line x1="45" y1="130" x2="555" y2="130" stroke="#ef4444" stroke-width="1"/>
        <text x="45" y="160" font-size="13"><b>Chit No:</b> PBY-4402</text>
        <text x="400" y="160" font-size="13"><b>Date:</b> 2026-11-07</text>
        
        <rect x="45" y="195" width="510" height="28" fill="#fee2e2"/>
        <text x="55" y="213" font-size="11" font-weight="bold">ITEM</text>
        <text x="320" y="213" font-size="11" font-weight="bold">QTY</text>
        <text x="410" y="213" font-size="11" font-weight="bold">PRICE</text>
        <text x="490" y="213" font-size="11" font-weight="bold">TOTAL</text>

        <text x="55" y="250" font-size="12">1. River Sand Grade 1 (වැලි කියුබ්)</text>
        <text x="320" y="250" font-size="12">3 cube</text>
        <text x="410" y="250" font-size="12">19,000.00</text>
        <text x="490" y="250" font-size="12">57,000.00</text>

        <!-- Physically torn section illustration -->
        <path d="M 45 280 Q 200 275 350 285 L 555 285 L 555 330 L 380 330 Q 300 340 45 330 Z" fill="#fee2e2" stroke="#dc2626" stroke-dasharray="4 4" opacity="0.6"/>
        <text x="55" y="305" font-size="12">2. Metal 3/4" (ගල් කියුබ්)</text>
        <text x="320" y="305" font-size="12">2 cube</text>
        <text x="410" y="305" font-size="12" fill="#ef4444"><i>[TORN OFF]</i></text>
        <text x="490" y="305" font-size="12" fill="#ef4444"><i>[ILLEGIBLE]</i></text>

        <line x1="45" y1="360" x2="555" y2="360" stroke="#f87171" stroke-width="1"/>
        <text x="300" y="400" font-size="14" font-weight="bold">PARTIAL VISIBLE TOTAL:</text>
        <text x="540" y="400" font-size="15" font-weight="bold" fill="#991b1b" text-anchor="end">Rs. 89,000.00</text>
      </svg>
    `),
    data: {
      vendor_name: 'Piliyandala Building Materials Yard',
      invoice_number: 'PBY-4402',
      invoice_date: '2026-11-07',
      category: 'Hardware',
      items: [
        { name: 'River Sand Grade 1 (වැලි කියුබ්)', quantity: 3, unit: 'cube', unit_price: 19000.00, total: 57000.00 },
        { name: 'Metal 3/4" (ගල් කියුබ්)', quantity: 2, unit: 'cube', unit_price: null, total: null, is_illegible: true, isFlagged: true, flagReason: 'Torn paper: price and total torn off' },
      ],
      grand_total: 89000.00,
      confidence_notes: 'Anti-hallucination guardrail active. Line 2 price torn on physical chit; returned null instead of guessing.'
    }
  },
  {
    id: 'sample-tax-discount-5',
    title: 'Union Chemists & Super Care [DISCOUNT & TAX]',
    category: 'Pharmacy',
    description: 'Retail pharmacy invoice featuring 5% trade discount, subtotal, and SSCL/VAT breakdown.',
    imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850" style="background:#ffffff; font-family:sans-serif; color:#1e293b;">
        <rect width="600" height="850" fill="#ffffff"/>
        <rect x="25" y="25" width="550" height="800" fill="none" stroke="#e2e8f0" stroke-width="2"/>
        <text x="45" y="70" font-size="20" font-weight="bold" fill="#0369a1">UNION CHEMISTS (PVT) LTD</text>
        <text x="45" y="92" font-size="12" fill="#64748b">Union Place, Colombo 02 | VAT Reg: 109283749-7000</text>
        <line x1="45" y1="110" x2="555" y2="110" stroke="#cbd5e1" stroke-width="1"/>
        <text x="45" y="135" font-size="12"><b>Inv No:</b> UC-2026-9931</text>
        <text x="400" y="135" font-size="12"><b>Date:</b> 2026-11-08</text>

        <rect x="45" y="150" width="510" height="26" fill="#f0f9ff"/>
        <text x="55" y="167" font-size="11" font-weight="bold" fill="#0369a1">DESCRIPTION</text>
        <text x="320" y="167" font-size="11" font-weight="bold" fill="#0369a1">QTY</text>
        <text x="410" y="167" font-size="11" font-weight="bold" fill="#0369a1">PRICE</text>
        <text x="495" y="167" font-size="11" font-weight="bold" fill="#0369a1">TOTAL</text>

        <text x="55" y="195" font-size="12">Augmentin 625mg (14s tab pack)</text>
        <text x="320" y="195" font-size="12">4 pkt</text>
        <text x="410" y="195" font-size="12">2,850.00</text>
        <text x="495" y="195" font-size="12">11,400.00</text>

        <text x="55" y="225" font-size="12">Surgical Face Masks 3-Ply</text>
        <text x="320" y="225" font-size="12">5 box</text>
        <text x="410" y="225" font-size="12">720.00</text>
        <text x="495" y="225" font-size="12">3,600.00</text>

        <line x1="45" y1="260" x2="555" y2="260" stroke="#cbd5e1" stroke-width="1"/>
        <text x="340" y="285" font-size="12">Subtotal:</text>
        <text x="535" y="285" font-size="12" text-anchor="end">15,000.00</text>

        <text x="340" y="310" font-size="12" fill="#059669">Trade Discount (5%):</text>
        <text x="535" y="310" font-size="12" fill="#059669" text-anchor="end">-750.00</text>

        <text x="340" y="335" font-size="12">SSCL / VAT:</text>
        <text x="535" y="335" font-size="12" text-anchor="end">375.00</text>

        <line x1="330" y1="345" x2="545" y2="345" stroke="#94a3b8" stroke-width="1"/>
        <text x="340" y="370" font-size="14" font-weight="bold">NET TOTAL (LKR):</text>
        <text x="535" y="370" font-size="15" font-weight="bold" fill="#0284c7" text-anchor="end">Rs. 14,625.00</text>
      </svg>
    `),
    data: {
      vendor_name: 'Union Chemists (Pvt) Ltd',
      invoice_number: 'UC-2026-9931',
      invoice_date: '2026-11-08',
      category: 'Pharmacy',
      items: [
        {
          name: 'Augmentin 625mg (14s tab pack)',
          product_code: 'AUG-625',
          batch_no: 'BN4091',
          expiry_date: '2027-06',
          quantity: 4,
          unit: 'pkt',
          unit_price: 2850.00,
          retail_price: 3200.00,
          total: 11400.00
        },
        {
          name: 'Surgical Face Masks 3-Ply',
          product_code: 'MSK-03',
          batch_no: 'MK882',
          expiry_date: '2028-12',
          quantity: 5,
          unit: 'box',
          unit_price: 720.00,
          retail_price: 850.00,
          total: 3600.00
        },
      ],
      subtotal: 15000.00,
      discount: 750.00,
      tax: 375.00,
      grand_total: 14625.00,
      confidence_notes: 'Extracted with subtotal (15,000), 5% trade discount (-750), and tax (375). Arithmetic perfectly verified.'
    }
  },
  {
    id: 'sample-pharma-distributor-8pct',
    title: 'Pharma Distributor Invoice (8% Trade Disc & FOC Bonus)',
    category: 'Pharmacy',
    description: 'Specialty cardiovascular & antibiotic distributor invoice with 8% trade discount, FOC bonus stock, and Rs. 1.33M Grand Total.',
    imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="950" viewBox="0 0 600 950" style="background:#ffffff; font-family:monospace; color:#0f172a;">
        <rect width="600" height="950" fill="#ffffff"/>
        <rect x="20" y="20" width="560" height="910" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
        <text x="300" y="60" font-size="18" font-weight="bold" text-anchor="middle" fill="#0f766e">SRI LANKA PHARMACEUTICAL DISTRIBUTORS (PVT) LTD</text>
        <text x="300" y="80" font-size="11" text-anchor="middle" fill="#64748b">Colombo 10 | NMRA Distributor Licence: W-0941 | Tel: 011-2691234</text>
        <line x1="30" y1="95" x2="570" y2="95" stroke="#0f766e" stroke-width="2"/>
        <text x="35" y="120" font-size="11"><b>Invoice No:</b> DIS-2026-8812</text>
        <text x="35" y="140" font-size="11"><b>Customer:</b> City Care Pharmacy</text>
        <text x="380" y="120" font-size="11"><b>Date:</b> 2026-11-13</text>
        <text x="380" y="140" font-size="11"><b>Terms:</b> Trade Disc 8% Allowed</text>
        
        <rect x="30" y="160" width="540" height="24" fill="#f0fdfa"/>
        <text x="35" y="176" font-size="10" font-weight="bold">CODE</text>
        <text x="85" y="176" font-size="10" font-weight="bold">DESCRIPTION</text>
        <text x="270" y="176" font-size="10" font-weight="bold">QTY</text>
        <text x="330" y="176" font-size="10" font-weight="bold">BONUS</text>
        <text x="390" y="176" font-size="10" font-weight="bold">W/SALE</text>
        <text x="470" y="176" font-size="10" font-weight="bold">DISC%</text>
        <text x="560" y="176" font-size="10" font-weight="bold" text-anchor="end">NET TOTAL</text>
        <line x1="30" y1="188" x2="570" y2="188" stroke="#cbd5e1" stroke-width="1"/>

        <text x="35" y="210" font-size="10">P-001</text>
        <text x="85" y="210" font-size="10">Algic 100mg (3x10s)</text>
        <text x="270" y="210" font-size="10">30.00</text>
        <text x="330" y="210" font-size="10">-</text>
        <text x="390" y="210" font-size="10">549.14</text>
        <text x="470" y="210" font-size="10">8%</text>
        <text x="560" y="210" font-size="10" text-anchor="end">15,156.26</text>

        <text x="35" y="235" font-size="10">P-014</text>
        <text x="85" y="235" font-size="10">Pulmofirst 62.5mg (1x10s)</text>
        <text x="270" y="235" font-size="10">10.00</text>
        <text x="330" y="235" font-size="10">-</text>
        <text x="390" y="235" font-size="10">3,395.65</text>
        <text x="470" y="235" font-size="10">8%</text>
        <text x="560" y="235" font-size="10" text-anchor="end">31,239.98</text>

        <text x="35" y="260" font-size="10">P-021</text>
        <text x="85" y="260" font-size="10">Atorem 10mg (10x10s)</text>
        <text x="270" y="260" font-size="10">50.00</text>
        <text x="330" y="260" font-size="10">25.00</text>
        <text x="390" y="260" font-size="10">869.57</text>
        <text x="470" y="260" font-size="10">8%</text>
        <text x="560" y="260" font-size="10" text-anchor="end">40,000.22</text>

        <text x="35" y="285" font-size="10">P-026</text>
        <text x="85" y="285" font-size="10">Triam Injection</text>
        <text x="270" y="285" font-size="10">300.00</text>
        <text x="330" y="285" font-size="10">-</text>
        <text x="390" y="285" font-size="10">834.81</text>
        <text x="470" y="285" font-size="10">8%</text>
        <text x="560" y="285" font-size="10" text-anchor="end">230,407.56</text>

        <text x="35" y="310" font-size="10">P-036</text>
        <text x="85" y="310" font-size="10">Tolval tablets 15mg (1x4s)</text>
        <text x="270" y="310" font-size="10">50.00</text>
        <text x="330" y="310" font-size="10">-</text>
        <text x="390" y="310" font-size="10">1,190.13</text>
        <text x="470" y="310" font-size="10">8%</text>
        <text x="560" y="310" font-size="10" text-anchor="end">54,745.98</text>

        <text x="35" y="335" font-size="10">P-005</text>
        <text x="85" y="335" font-size="10">Cosamide 100mg (1x10s)</text>
        <text x="270" y="335" font-size="10">200.00</text>
        <text x="330" y="330" font-size="10">-</text>
        <text x="390" y="335" font-size="10">858.13</text>
        <text x="470" y="335" font-size="10">8%</text>
        <text x="560" y="335" font-size="10" text-anchor="end">157,895.92</text>

        <text x="35" y="360" font-size="10">P-006</text>
        <text x="85" y="360" font-size="10">Epnone 25mg (3x10s)</text>
        <text x="270" y="360" font-size="10">300.00</text>
        <text x="330" y="360" font-size="10">-</text>
        <text x="390" y="360" font-size="10">2,321.74</text>
        <text x="470" y="360" font-size="10">8%</text>
        <text x="560" y="360" font-size="10" text-anchor="end">640,800.24</text>

        <text x="35" y="385" font-size="10">P-007</text>
        <text x="85" y="385" font-size="10">Epnone 50mg (3x10s)</text>
        <text x="270" y="385" font-size="10">50.00</text>
        <text x="330" y="385" font-size="10">18.00</text>
        <text x="390" y="385" font-size="10">3,638.35</text>
        <text x="470" y="385" font-size="10">8%</text>
        <text x="560" y="385" font-size="10" text-anchor="end">167,364.10</text>

        <line x1="30" y1="410" x2="570" y2="410" stroke="#cbd5e1" stroke-width="1"/>
        <text x="350" y="440" font-size="11">Gross Subtotal:</text>
        <text x="560" y="440" font-size="11" text-anchor="end">Rs. 1,453,924.20</text>
        <text x="350" y="465" font-size="11" fill="#0d9488">Less Trade Disc (8.00%):</text>
        <text x="560" y="465" font-size="11" fill="#0d9488" text-anchor="end">- Rs. 116,313.94</text>
        <line x1="340" y1="480" x2="570" y2="480" stroke="#0f766e" stroke-width="1.5"/>
        <text x="350" y="505" font-size="13" font-weight="bold">NET INVOICE TOTAL:</text>
        <text x="560" y="505" font-size="14" font-weight="bold" fill="#0f766e" text-anchor="end">Rs. 1,337,610.26</text>
      </svg>
    `),
    data: {
      vendor_name: 'Sri Lanka Pharmaceutical Distributors (Pvt) Ltd',
      invoice_number: 'DIS-2026-8812',
      invoice_date: '2026-11-13',
      category: 'Pharmacy',
      items: [
        {
          name: 'Algic 100mg (3x10s)',
          product_code: 'P-001',
          quantity: 30,
          unit: 'box',
          unit_price: 549.14,
          discount_percent: 8,
          total: 15156.26,
        },
        {
          name: 'Pulmofirst 62.5mg (1x10s)',
          product_code: 'P-014',
          quantity: 10,
          unit: 'box',
          unit_price: 3395.65,
          discount_percent: 8,
          total: 31239.98,
        },
        {
          name: 'Atorem 10mg (10x10s)',
          product_code: 'P-021',
          quantity: 50,
          free_quantity: 25,
          unit: 'box',
          unit_price: 869.57,
          discount_percent: 8,
          total: 40000.22,
        },
        {
          name: 'Triam Injection',
          product_code: 'P-026',
          quantity: 300,
          unit: 'amp',
          unit_price: 834.81,
          discount_percent: 8,
          total: 230407.56,
        },
        {
          name: 'Tolval tablets 15mg (1x4s)',
          product_code: 'P-036',
          quantity: 50,
          unit: 'box',
          unit_price: 1190.13,
          discount_percent: 8,
          total: 54745.98,
        },
        {
          name: 'Cosamide 100mg (1x10s)',
          product_code: 'P-005',
          quantity: 200,
          unit: 'box',
          unit_price: 858.13,
          discount_percent: 8,
          total: 157895.92,
        },
        {
          name: 'Epnone 25mg (3x10s)',
          product_code: 'P-006',
          quantity: 300,
          unit: 'box',
          unit_price: 2321.74,
          discount_percent: 8,
          total: 640800.24,
        },
        {
          name: 'Epnone 50mg (3x10s)',
          product_code: 'P-007',
          quantity: 50,
          free_quantity: 18,
          unit: 'box',
          unit_price: 3638.35,
          discount_percent: 8,
          total: 167364.10,
        },
      ],
      subtotal: 1453924.20,
      discount: 116313.94,
      grand_total: 1337610.26,
      confidence_notes: '100% verified. 8 pharmaceutical line items with 8% trade discount, FOC bonus stock (25 Atorem, 18 Epnone), and exact net arithmetic match (Rs. 1,337,610.26).'
    }
  }
];

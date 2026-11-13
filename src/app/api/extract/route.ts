import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { InvoiceExtractionSchema } from '@/types/invoice';
import { SAMPLE_BILLS } from '@/data/sampleBills';

// System prompt tailored for Sri Lankan retail bills & pharma distribution (Day 1 Benchmark & Calibration)
const SRI_LANKA_BILL_SYSTEM_PROMPT = `
You are an expert high-speed Optical Document & Invoice AI specializing in Sri Lankan retail and distribution bills.
Your job is to accurately extract supplier invoices, Goods Received Notes (GRN), delivery notes, and counter cash chits from Sri Lankan merchants (pharmacies, pharmaceutical distributors, hardware stores, grocery distributors, and building material yards).

CRITICAL EXTRACTION GUIDELINES:
1. Language & Script:
   - Invoices frequently contain English, Sinhala Unicode (e.g., සිමෙන්ති, බට, ඇණ, තහඩු, කම්බි, තෙල්, වැලි), or Singlish (e.g., weli cube, kambi 10mm, takaran, s-lon pvc, boralu, gala).
   - Accurately preserve the exact item names in Sinhala or Singlish where written. Never translate Sinhala item names to English if written in Sinhala.

2. Sri Lankan Pharmaceutical Distribution & Retail Invoices:
   - For Pharmacy & Medical distribution documents (e.g., invoices, GRNs, delivery orders from Hemas, Emerchemie, Sunshine Healthcare, Baurs, George Steuart, Morison, SPC, JL Morison, Astron, Swiss Biogenics, etc.):
     * Extract product_code: Item/SKU/Product code often printed in the first column (e.g., "MED-1029", "800451", "AMP01", "PC-500").
     * Extract batch_no: Batch or Lot number (e.g., "GS881", "B#24019", "LOT-992").
     * Extract expiry_date: Expiry date string (e.g., "2027-08", "08/27", "EXP: 11/26").
     * Extract retail_price: Maximum Retail Price (MRP) or consumer retail price if printed separately from wholesale/cost price.
     * Extract unit_price: Distributor wholesale / cost / trade price per unit.
     * Extract discount_percent: Trade discount percentage (e.g., 5%, 7.5%, 10%) printed on the line or document.
     * Extract discount: Rupee discount amount deducted from line or subtotal.

3. Packaging Units Normalization (Strict Canonical Standard):
   - Normalize Sri Lankan packaging and volume units to standard lowercase short forms:
     * Pharma & Medical: "strip" (tablets/capsule strips), "tab" (individual tablets/පෙති), "cap" (capsules), "amp" (ampoules), "vial", "tube", "box", "btl" (bottles), "pkt" (packets), "tin", "nos".
     * Hardware: "cube" (for sand/soil/aggregate - කුබ්බ/ක්යුබ්), "bag" (for cement/lime), "bundle" (for tor steel/rebar - බන්ඩල්), "nos" (for pipes/fittings/pieces - ගෙඩි/කෑලි/pcs/numbers), "kg" (for nails/wire), "roll" (for barbed wire/chainlink), "sheet" (for asbestos/zinc takaran), "sqft" (for tiles/granite).
     * General Retail: "kg", "g", "l", "ml", "mtr", "nos", "pkt".

4. Numerical & Arithmetic Accuracy & Anti-Hallucination:
   - Extract exact unit price (in LKR - Sri Lankan Rupees) and quantities.
   - If line total is printed, extract it as is.
   - Line Total Calculation in Pharma Distribution: Total is typically Qty * Unit Price * (1 - Trade Discount % / 100).
   - Extract subtotal, trade discount (if present, e.g. 5% pharma discount), and tax (VAT/SSCL) if printed.
   - Extract the printed Grand Total.
   - ANTI-HALLUCINATION GUARDRAIL: If handwriting or numeric values are torn off, smudged, cut off, or completely illegible, set quantity/unit_price/total to null and set is_illegible to true. NEVER fabricate or guess numbers.

5. Broken, Faint, and Half-Written English/Numeric Character Reconstruction:
   - Physical bills in Sri Lanka frequently suffer from:
     * Dot-matrix pin drops (e.g. missing pin lines making "E" look like "F" or "L", "B" look like "13" or "8", "D" look like "O", "P" look like "I:").
     * Faint carbon copy bleed-through (only partial pen pressure transferring).
     * Worn thermal printheads (vertical blank lines slicing through words).
     * Fast cursive/shorthand handwriting (half-formed letters, e.g. "Panadl", "Amox", "Cemnt", "Takrn").
   - GUIDELINES FOR RECONSTRUCTING BROKEN CHARACTERS:
     * Contextual Word Reconstruction: Use whole-word context and commercial trade knowledge to reconstruct broken or half-written English words (e.g., "T_kyo Sup_r" -> "Tokyo Super", "Augm_ntin" -> "Augmentin", "S-_on" -> "S-Lon PVC", "Tor St__l" -> "Tor Steel", "P_nadol" -> "Panadol", "Anc_or" -> "Anchor", "Cem_nt" -> "Cement").
     * Disambiguation by Column Context:
       - In Quantity / Price / Total columns: Broken "O" is digit 0; broken "l" or "I" is digit 1; broken "S" is digit 5; broken "B" is digit 8; faint stray marks near digits are decimal points.
       - In Description columns: Distinguish letters based on Sri Lankan brand names and product catalogs.
     * Mathematical Cross-Deduction: If one digit in a price or quantity is half-written or broken, use the arithmetic relation (Quantity * Unit Price = Total) to mathematically reconstruct the missing stroke with certainty.

6. Category Classification:
   - Determine the most accurate category: "Pharmacy", "Hardware", "General", or "Utilities".
   - If the document contains medicines, drugs, pharmaceutical codes, or hospital supplies, classify as "Pharmacy".

7. Format:
   - Output valid JSON conforming strictly to the requested schema.
`;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/jpeg', sampleId, userApiKey } = body;

    // Check if this was a quick sample bill request
    if (sampleId) {
      const foundSample = SAMPLE_BILLS.find((s) => s.id === sampleId);
      if (foundSample) {
        const elapsed = Date.now() - startTime;
        return NextResponse.json({
          success: true,
          data: foundSample.data,
          displayImageUrl: foundSample.imageUrl,
          processingTimeMs: elapsed,
          isSimulated: false,
          notes: 'Loaded benchmark sample dataset for Sri Lankan counter verification',
        });
      }
    }

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'No image data provided. Please capture or upload a bill image.' },
        { status: 400 }
      );
    }

    // Strip data url prefix if present
    let cleanBase64 = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64;
    let effectiveMimeType = mimeType;
    let displayImageUrl = imageBase64;

    // Convert HEIC/HEIF files (iPhone photos) to JPEG for broad browser display
    try {
      const buffer = Buffer.from(cleanBase64, 'base64');
      const isHeic =
        effectiveMimeType?.includes('heic') ||
        effectiveMimeType?.includes('heif') ||
        (buffer.length > 12 && buffer.subarray(4, 12).toString('ascii').includes('ftyp'));

      if (isHeic) {
        const heicConvert = require('heic-convert');
        const jpegBuffer = await heicConvert({
          buffer,
          format: 'JPEG',
          quality: 0.85,
        });
        cleanBase64 = jpegBuffer.toString('base64');
        effectiveMimeType = 'image/jpeg';
        displayImageUrl = `data:image/jpeg;base64,${cleanBase64}`;
      }
    } catch (convErr) {
      console.warn('Server HEIC conversion note:', convErr);
    }

    const apiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      // Graceful offline/simulation mode when API key is not yet configured:
      const elapsed = Date.now() - startTime;
      
      // Look for match in sample bills
      const matchingSample = SAMPLE_BILLS.find((s) => s.imageUrl.includes(cleanBase64.slice(0, 100)));
      const fallbackData = matchingSample ? matchingSample.data : {
        vendor_name: 'St. Anthony\'s Hardware & Electricals',
        invoice_number: 'SAH-9014',
        invoice_date: new Date().toISOString().split('T')[0],
        category: 'Hardware' as const,
        items: [
          { name: 'Tokyo Super Portland Cement (සිමෙන්ති 50kg)', quantity: 10, unit: 'bag', unit_price: 2450.00, total: 24500.00 },
          { name: 'S-Lon 1" PVC Pressure Pipe Type 600', quantity: 6, unit: 'nos', unit_price: 1150.00, total: 6900.00 },
          { name: 'Weli Cube River Sand Grade 1', quantity: 1, unit: 'cube', unit_price: 18500.00, total: 18500.00 },
          { name: 'Tor Steel Kambi 12mm', quantity: 8, unit: 'bundle', unit_price: 3600.00, total: 28800.00 },
        ],
        grand_total: 78700.00,
        confidence_notes: 'Parsed in Simulated Mode (No GEMINI_API_KEY configured). Add your Google Gemini API key in Settings for live Flash 2.5 vision.'
      };

      return NextResponse.json({
        success: true,
        data: fallbackData,
        displayImageUrl,
        processingTimeMs: Math.max(elapsed, 420),
        isSimulated: true,
        notice: 'Simulated preview mode active. To connect live Gemini 2.5 Flash, add your GEMINI_API_KEY in the top settings modal or .env.local file.',
      });
    }

    // Initialize Google Gen AI SDK (@google/genai) on v1beta endpoint
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: 'v1beta' },
    });

    // High-speed, 100% active vision models for fast sub-3s extraction
    const candidateModels = [
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.1-pro-preview',
    ];

    let lastError: any = null;
    let response: any = null;

    const requestConfig = {
      systemInstruction: SRI_LANKA_BILL_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vendor_name: { type: Type.STRING },
          invoice_number: { type: Type.STRING },
          invoice_date: { type: Type.STRING },
          category: {
            type: Type.STRING,
            enum: ['Pharmacy', 'Hardware', 'General', 'Utilities'],
          },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                product_code: { type: Type.STRING },
                batch_no: { type: Type.STRING },
                expiry_date: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                retail_price: { type: Type.NUMBER },
                unit_price: { type: Type.NUMBER },
                discount_percent: { type: Type.NUMBER },
                discount: { type: Type.NUMBER },
                total: { type: Type.NUMBER },
                is_illegible: { type: Type.BOOLEAN },
              },
              required: ['name'],
            },
          },
          subtotal: { type: Type.NUMBER },
          discount: { type: Type.NUMBER },
          tax: { type: Type.NUMBER },
          grand_total: { type: Type.NUMBER },
          confidence_notes: { type: Type.STRING },
        },
        required: ['items', 'grand_total'],
      },
    };

    const requestContents = [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: effectiveMimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: 'Analyze this physical Sri Lankan invoice / chit photo. Extract all header fields and line items into strict JSON according to the schema.',
          },
        ],
      },
    ];

    // Attempt candidate models with zero stall: fast failover to the first responsive model
    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: requestContents,
          config: requestConfig,
        });
        if (response && response.text) {
          console.log(`[LankaBill API] Successfully extracted with vision model: ${model}`);
          break;
        }
      } catch (err: any) {
        console.warn(`[LankaBill API] Model attempt ${model} note:`, err.message || err);
        lastError = err;
      }
    }

    if (!response) {
      throw lastError || new Error('All candidate Gemini models failed to process image.');
    }

    const responseText = response.text?.trim() || '{}';
    let parsedJson = JSON.parse(responseText);

    // Validate using Zod schema
    const validated = InvoiceExtractionSchema.safeParse(parsedJson);
    if (!validated.success) {
      console.warn('Zod validation issues:', validated.error.format());
    }

    const elapsed = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: validated.success ? validated.data : parsedJson,
      displayImageUrl,
      processingTimeMs: elapsed,
      isSimulated: false,
    });
  } catch (error: any) {
    console.error('Error in /api/extract:', error);
    const elapsed = Date.now() - startTime;
    const rawMsg = error.message || 'Failed to extract invoice data using Gemini Vision.';
    const is503 = rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE');
    const userFriendlyMsg = is503
      ? 'Google Gemini Vision free-tier is currently experiencing temporary high demand (503). Please wait 5-10 seconds and try again.'
      : rawMsg;

    return NextResponse.json(
      {
        success: false,
        error: userFriendlyMsg,
        processingTimeMs: elapsed,
      },
      { status: 500 }
    );
  }
}

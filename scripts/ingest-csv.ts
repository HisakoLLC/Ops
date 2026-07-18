import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Papa from 'papaparse';

// Load .env.local before importing modules that initialize clients with process.env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const filePathArg = process.argv[2];
  if (!filePathArg) {
    console.error('Error: Please provide a CSV file path as the first argument.');
    console.error('Usage: npm run ingest:csv <path/to/leads.csv>');
    process.exit(1);
  }

  const absolutePath = path.resolve(process.cwd(), filePathArg);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File not found at path: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`[CSV Ingest] Reading CSV file: ${absolutePath}`);
  const csvContent = fs.readFileSync(absolutePath, 'utf-8');

  // Parse CSV with papaparse
  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (parseResult.errors && parseResult.errors.length > 0) {
    console.warn(`[CSV Ingest] Warnings/Errors during CSV parsing:`, parseResult.errors);
  }

  const rows = parseResult.data as Record<string, any>[];
  console.log(`[CSV Ingest] Parsed ${rows.length} rows. Initiating database insertion & Inngest events...`);

  // Dynamically import processor to guarantee env vars are loaded before Supabase client initialization
  const { processLeads } = await import('@/lib/ingest/processor');

  const summary = await processLeads(rows);

  console.log('\n========================================');
  console.log('       CSV INGESTION COMPLETED          ');
  console.log('========================================');
  console.log(`Received:           ${summary.received}`);
  console.log(`Inserted:           ${summary.inserted}`);
  console.log(`Duplicates Skipped: ${summary.duplicates_skipped}`);
  console.log('========================================\n');
}

main().catch((err) => {
  console.error('[CSV Ingest Fatal Error]:', err);
  process.exit(1);
});

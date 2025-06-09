const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('📊 Starting Excel to JSON extraction...');

try {
  // Read the Excel file
  const workbook = XLSX.readFile('script/data/Secteurs-Services-Lits.xlsx');
  const sheetName = workbook.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
  console.log(`📋 Sheet name: ${sheetName}`);
  console.log(`📝 Total rows: ${data.length}`);
  
  // Helper maps to avoid duplicates and count beds
  const secteursMap = {};
  const servicesMap = {};
  const servicesBedCount = {};
  const beds = [];

  data.forEach((row, index) => {
    try {
      // Extract data from row - using correct column names with underscores
      const secteurId = row['ID_SECTEUR'];
      const secteurName = row['NAME_SECTEUR'];
      const serviceId = row['ID_SERVICE'];
      const serviceName = row['NAME_SERVICE'];
      const bedId = row['BED'];
      
      // Skip if essential data is missing
      if (!secteurId || !serviceId || !bedId) {
        console.log(`⚠️  Skipping row ${index + 1}: Missing essential data`);
        return;
      }

      // Sector
      if (!secteursMap[secteurId]) {
        secteursMap[secteurId] = {
          ID_SECTEUR: secteurId,
          LIB_SECTEUR: secteurName,
          ABR_SECTEUR: (secteurName || '').replace(/\s+/g, '').substring(0, 3).toUpperCase()
        };
      }

      // Count beds per service
      if (!servicesBedCount[serviceId]) {
        servicesBedCount[serviceId] = 0;
      }
      servicesBedCount[serviceId]++;

      // Service (we'll update capacity later)
      if (!servicesMap[serviceId]) {
        servicesMap[serviceId] = {
          ID_SERVICE: serviceId,
          LIB_SERVICE: serviceName,
          ID_SECTEUR: secteurId,
          CAPA_ARCHI: 0,    // Will be calculated
          CAPA_REELLE: 0,   // Will be calculated
          ROR: true         // Set to true for all services
        };
      }

      // Bed
      beds.push({
        ID_LIT: bedId,
        ID_SERVICE: serviceId,
        ID_STATUT: 1, // 1 = Libre (default status)
        MAJ_STATUT: new Date().toISOString(),
        ACTIF: true
      });
    } catch (error) {
      console.error(`❌ Error processing row ${index + 1}:`, error.message);
    }
  });

  // Update service capacities based on bed count
  Object.keys(servicesMap).forEach(serviceId => {
    const bedCount = servicesBedCount[serviceId] || 0;
    servicesMap[serviceId].CAPA_ARCHI = bedCount;
    // CAPA_REELLE equals CAPA_ARCHI since all beds are active
    servicesMap[serviceId].CAPA_REELLE = bedCount;
  });

  // Convert maps to arrays
  const secteurs = Object.values(secteursMap);
  const services = Object.values(servicesMap);

  // Create output directory
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write JSON files
  fs.writeFileSync(path.join(outputDir, 'secteurs.json'), JSON.stringify(secteurs, null, 2));
  fs.writeFileSync(path.join(outputDir, 'services.json'), JSON.stringify(services, null, 2));
  fs.writeFileSync(path.join(outputDir, 'beds.json'), JSON.stringify(beds, null, 2));

  // Display summary
  console.log('\n✅ Extraction completed successfully!');
  console.log('📁 Files created in script/output/');
  console.log(`📊 Summary:`);
  console.log(`   - Secteurs: ${secteurs.length}`);
  console.log(`   - Services: ${services.length}`);
  console.log(`   - Beds: ${beds.length}`);
  
  // Show sample data
  if (secteurs.length > 0) console.log('\n📋 Sample Secteur:', secteurs[0]);
  if (services.length > 0) console.log('📋 Sample Service:', services[0]);
  if (beds.length > 0) console.log('📋 Sample Bed:', beds[0]);

} catch (error) {
  console.error('💥 Error reading Excel file:', error.message);
  console.error('Make sure the file "script/data/Secteurs-Services-Lits.xlsx" exists');
  process.exit(1);
} 
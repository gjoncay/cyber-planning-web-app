import * as xlsx from 'xlsx';

try {
  const workbook = xlsx.readFile('enterprise-attack-v19.1.xlsx');
  console.log("Sheets:", workbook.SheetNames);
  
  if (workbook.SheetNames.includes('relationships')) {
    const relSheet = workbook.Sheets['relationships'];
    const relData = xlsx.utils.sheet_to_json(relSheet);
    if (relData.length > 0) {
      console.log("\nRelationships columns:", Object.keys(relData[0]));
      console.log("Sample relationships:", relData.slice(0, 3));
    }
  }

  if (workbook.SheetNames.includes('software')) {
    const softSheet = workbook.Sheets['software'];
    const softData = xlsx.utils.sheet_to_json(softSheet);
    if (softData.length > 0) {
      console.log("\nSoftware columns:", Object.keys(softData[0]));
      console.log("Sample software:", softData.slice(0, 3));
    }
  }
} catch (e) {
  console.error("Error:", e);
}

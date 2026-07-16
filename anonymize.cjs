const fs = require('fs');
const path = require('path');

// Seeded pseudo-random generator to ensure deterministic and reproducible outputs
function createSeededRandom(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const rawDumpPath = path.join(__dirname, 'database', 'vendors_db_dump.json');
if (!fs.existsSync(rawDumpPath)) {
  console.error(`Error: Raw dump not found at ${rawDumpPath}`);
  process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(rawDumpPath, 'utf8'));

// Lists of words to generate unique, realistic pharma company names
const prefixes = [
  "Astra", "Bio", "Nova", "Apex", "Zenith", "Syn", "Helix", "Sina", "Arya", "Alborz", "Pars", 
  "Delta", "Alpha", "Omega", "Cure", "Heal", "Pharma", "Chem", "Nexus", "Vortex", "Horizon", 
  "Global", "Inter", "Quantum", "Vector", "Meridian", "Solis", "Luna", "Elysian", "Summit", 
  "Prime", "Veritas", "Pioneer", "Acme", "Summit", "Crown", "Core", "Spectrum", "Matrix", "Kian"
];

const middles = [
  "Pharma", "Chem", "Biotech", "Synthesis", "Labs", "Organics", "Therapeutics", "Medicines", 
  "Formulations", "Reagents", "Synthetics", "Chemicals", "Active", "Ingredients", "Sciences", 
  "Solutions", "Advanced", "Molecular", "Biomedical", "Fine"
];

const suffixes = [
  "Co.", "Ltd.", "Inc.", "Pvt. Ltd.", "Group", "Industries", "Corporation", "S.A."
];

const uniqueVendorNames = Array.from(new Set(rawData.map(r => r.name))).sort();
const vendorMap = {};

// Deterministically generate synthetic company names
uniqueVendorNames.forEach((origName, index) => {
  const rand = createSeededRandom(origName);
  
  // Pick elements using our pseudo-random generator
  const p = prefixes[Math.floor(rand() * prefixes.length)];
  const m = middles[Math.floor(rand() * middles.length)];
  const s = suffixes[Math.floor(rand() * suffixes.length)];
  
  // To avoid duplicate names, append index if needed, but with 40 * 20 * 8 = 6400 possibilities, we're likely unique.
  let fakeName = `${p} ${m} ${s}`;
  let fakeNameEn = `${p} ${m} ${s}`;
  
  // Add some localization based on country or original name cues
  if (origName.toLowerCase().includes("china") || origName.toLowerCase().includes("tianjin") || origName.toLowerCase().includes("wuhan")) {
    fakeName = `${p} (${origName.includes("Tianjin") ? "Tianjin" : "Beijing"}) Biotech ${s}`;
    fakeNameEn = fakeName;
  } else if (origName.toLowerCase().includes("india") || origName.toLowerCase().includes("pvt") || origName.toLowerCase().includes("gujarat")) {
    fakeName = `${p} Organics Pvt. Ltd.`;
    fakeNameEn = fakeName;
  } else if (origName.toLowerCase().includes("دارو") || origName.toLowerCase().includes("شیمی")) {
    fakeName = origName.includes("شیمی") ? `صنایع شیمیایی ${p}` : `داروسازی ${p}`;
    fakeNameEn = `${p} Pharmaceutical Co.`;
  }

  vendorMap[origName] = {
    name: fakeName,
    nameEn: fakeNameEn
  };
});

// Deterministically map CAS numbers
const uniqueCAS = Array.from(new Set(rawData.map(r => r.cas).filter(Boolean))).sort();
const casMap = {};
uniqueCAS.forEach((origCas, index) => {
  const rand = createSeededRandom(origCas);
  // Generate valid CAS shape: [2 to 6 digits]-[2 digits]-[1 check digit]
  const part1 = Math.floor(10000 + rand() * 89999); // 5 digits
  const part2 = Math.floor(10 + rand() * 89);     // 2 digits
  const part3 = Math.floor(rand() * 10);          // 1 digit
  casMap[origCas] = `${part1}-${part2}-${part3}`;
});

// Deterministically map IRC codes
const uniqueIRC = Array.from(new Set(rawData.map(r => r.irc).filter(Boolean))).sort();
const ircMap = {};
uniqueIRC.forEach((origIrc, index) => {
  const rand = createSeededRandom(origIrc);
  // Generate 16 digit number
  let fakeIrc = "";
  for (let i = 0; i < 16; i++) {
    fakeIrc += Math.floor(rand() * 10).toString();
  }
  ircMap[origIrc] = fakeIrc;
});

// Process records
const syntheticData = rawData.map(record => {
  const fakeVendor = vendorMap[record.name] || { name: record.name, nameEn: record.nameEn };
  const rand = createSeededRandom(record.name);
  
  // Fake address and phone/emails
  const zip = Math.floor(100000 + rand() * 899990);
  const city = ["Mumbai", "Shanghai", "Tehran", "Gujarat", "Hebei", "Esfahan", "Frankfurt", "Seoul"][Math.floor(rand() * 8)];
  const country = record.country && record.country !== "نامشخص" ? record.country : "نامشخص";
  const email = `contact@${fakeVendor.nameEn.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
  const phone = `+${Math.floor(10 + rand() * 90)} ${Math.floor(100 + rand() * 900)} ${Math.floor(1000 + rand() * 9000)}`;
  
  const fakeContact = `Plot No. ${Math.floor(10 + rand() * 900)}, Phase-${Math.floor(1 + rand() * 4)} G.I.D.C., ${city}, ${country}/ Phone: ${phone}/ Email: ${email}/ ZIP: ${zip}`;

  // Build the synthetic record matching exact schema shape
  return {
    id: record.id,
    category: record.category || "foreign",
    material: record.material,
    materialEn: record.materialEn,
    cas: record.cas ? (casMap[record.cas] || record.cas) : null,
    irc: record.irc ? (ircMap[record.irc] || record.irc) : null,
    name: fakeVendor.name,
    nameEn: fakeVendor.nameEn,
    country: country,
    grade: record.grade,
    status: record.status,
    scores: record.scores,
    lastAudit: record.lastAudit || "1404/01/01",
    rejectionReasons: record.rejectionReasons ? record.rejectionReasons.map(r => {
      // Generalize rejection reasons slightly to hide trace info
      return r.replace(/Delta|Finochem|Tianjin|Mody/gi, "The Manufacturer");
    }) : null,
    contactInfo: fakeContact
  };
});

// Save flat synthetic dump to database/synthetic_vendors_dump.json
const flatSyntheticPath = path.join(__dirname, 'database', 'synthetic_vendors_dump.json');
fs.writeFileSync(flatSyntheticPath, JSON.stringify(syntheticData, null, 2), 'utf8');
console.log(`✅ Saved 217 synthetic flat records to: ${flatSyntheticPath}`);


// --- Transform flat list to the relational format expected by relationalDb/vendors.json ---
// Structure defined in relational format:
// {
//   "_relational_v2": true,
//   "vendors": { id: { id, name, nameEn, country, registrationDate, status, grade } },
//   "materials": { id: { id, name, nameEn, cas, irc } },
//   "vendor_materials": { id: { id, vendorId, materialId, category, isSample } },
//   "evaluations": { id: { id, vendorId, materialId, period, commercialScore, qaScore, planningScore, financeScore, totalScore, grade, scores, rawScores, rejectionReasons } },
//   "audit_logs": [],
//   "risk_assessments": {},
//   "analysis_records": {},
//   "contacts": { vendorId: contactInfo }
// }

const relational = {
  "_relational_v2": true,
  "vendors": {},
  "materials": {},
  "vendor_materials": {},
  "evaluations": {},
  "audit_logs": [],
  "risk_assessments": {},
  "analysis_records": {},
  "contacts": {}
};

// Map items to build a proper relational structure
syntheticData.forEach((item, index) => {
  // 1. Extract Vendor (use Name or ID as base to avoid duplicate vendors)
  // Let's group by name to generate unique vendor records
  const vendorId = "vnd-" + item.nameEn.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20) + "-" + item.id;
  
  if (!relational.vendors[vendorId]) {
    relational.vendors[vendorId] = {
      id: vendorId,
      name: item.name,
      nameEn: item.nameEn,
      country: item.country,
      registrationDate: item.lastAudit || "1404/01/01",
      status: item.status || "approved",
      grade: item.grade || "C"
    };
    relational.contacts[vendorId] = item.contactInfo;
    
    // Seed some risk assessments and lab records deterministically
    const rand = createSeededRandom(item.name);
    relational.risk_assessments[vendorId] = {
      overallRisk: item.grade === "A" ? "low" : item.grade === "B" ? "medium" : "high",
      transportRisk: rand() > 0.5 ? "low" : "medium",
      financialRisk: rand() > 0.6 ? "medium" : "low",
      regulatoryRisk: item.status === "approved" ? "low" : "medium",
      notes: "ارزیابی خودکار سیستم بر اساس سابقه تامین"
    };

    relational.analysis_records[vendorId] = [
      {
        batchNumber: `B-${Math.floor(100 + rand() * 800)}`,
        parameter: "Assay (سنجش خلوص)",
        standard: "98.0% - 102.0%",
        result: `${(98.5 + rand() * 3).toFixed(1)}%`,
        status: item.grade === "black list" ? "failed" : "passed",
        date: item.lastAudit || "1404/01/01"
      }
    ];
  }

  // 2. Extract Material
  const materialId = "mat-" + item.materialEn.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 25);
  if (!relational.materials[materialId]) {
    relational.materials[materialId] = {
      id: materialId,
      name: item.material,
      nameEn: item.materialEn,
      cas: item.cas || "N/A",
      irc: item.irc || "N/A"
    };
  }

  // 3. Create Vendor-Material Link
  const linkId = `link-${vendorId}-${materialId}`;
  relational.vendor_materials[linkId] = {
    id: linkId,
    vendorId: vendorId,
    materialId: materialId,
    category: item.category || "api",
    isSample: item.status === "new"
  };

  // 4. Create Evaluation
  if (item.scores) {
    const evalId = `eval-${vendorId}-${materialId}`;
    const scores = item.scores;
    const total = Number(scores.commercial * 0.2 + scores.qa * 0.4 + scores.planning * 0.1 + scores.finance * 0.3).toFixed(1);
    
    relational.evaluations[evalId] = {
      id: evalId,
      vendorId: vendorId,
      materialId: materialId,
      period: "۱۴۰۴-آذرماه",
      commercialScore: scores.commercial,
      qaScore: scores.qa,
      planningScore: scores.planning,
      financeScore: scores.finance,
      totalScore: Number(total),
      grade: item.grade || "C",
      scores: scores,
      rawScores: scores,
      rejectionReasons: item.rejectionReasons
    };
  }
});

// Seed some synthetic Audit Logs
relational.audit_logs = [
  {
    id: "log-1",
    vendorId: Object.keys(relational.vendors)[0],
    user: "admin@qms.com",
    action: "ثبت اولیه تأمین‌کنندگان در بانک اطلاعاتی هکسا",
    details: "بارگذاری ۲۱۷ رکورد تراکنشی تایید شده",
    createdAt: new Date("2026-07-15T10:00:00.000Z").toISOString()
  },
  {
    id: "log-2",
    vendorId: Object.keys(relational.vendors)[1],
    user: "qa@qms.com",
    action: "انجام ارزیابی ریسک و ثبت نتایج آزمایشگاهی مواد اولیه",
    details: "تایید آزمایشگاهی نمونه‌های بارگذاری شده سنتز سنتتیک",
    createdAt: new Date("2026-07-15T12:30:00.000Z").toISOString()
  }
];

const relationalPath = path.join(__dirname, 'database', 'vendors.json');
fs.writeFileSync(relationalPath, JSON.stringify(relational, null, 2), 'utf8');
console.log(`✅ Successfully generated relational synthetic data in: ${relationalPath}`);

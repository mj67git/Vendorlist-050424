import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import { INITIAL_VENDORS_DB } from "./src/db_foreign_only.js";
import { PrismaClient } from "@prisma/client";
import { 
  vendorSchema,
  vendorProfileSchema,
  vendorContactSchema,
  vendorScoreSchema,
  vendorLogsSchema,
  vendorAnalysisSchema,
  vendorRiskSchema
} from "./src/utils/validation.js";

const dbPath = path.join(process.cwd(), "database", "vendors.json");

interface RelationalModel {
  vendors: Record<string, {
    id: string;
    name: string;
    nameEn: string;
    country: string;
    contactInfo: string;
    registrationDate: string;
    status: string;
    grade: string | null;
  }>;
  materials: Record<string, {
    id: string;
    name: string;
    nameEn: string;
    cas: string;
    irc: string;
  }>;
  vendor_materials: Record<string, {
    id: string;
    vendorId: string;
    materialId: string;
    isSample: boolean;
    category: string;
  }>;
  evaluations: Record<string, {
    id: string;
    vendorId: string;
    materialId: string;
    period: string;
    commercialScore: number;
    qaScore: number;
    planningScore: number;
    financeScore: number;
    totalScore: number;
    grade: string;
    scores?: any; // client convenience
    rawScores?: any; // client convenience
    rejectionReasons?: any; // client convenience
  }>;
  audit_logs: Array<{
    id: string;
    vendorId: string | null;
    user: string;
    action: string;
    details: string;
    createdAt: string;
  }>;
  // Extra fields for companion forms / analytical attachments
  risk_assessments: Record<string, any>;
  analysis_records: Record<string, any[]>;
  contacts: Record<string, any>; // legacy backwards compatibility support
}

let relationalDb: RelationalModel = {
  vendors: {},
  materials: {},
  vendor_materials: {},
  evaluations: {},
  audit_logs: [],
  risk_assessments: {},
  analysis_records: {},
  contacts: {}
};

const CALCULATION_WEIGHTS = {
  commercial: 0.2,
  qa: 0.4,
  planning: 0.1,
  finance: 0.3
};

const GRADE_TIERS = [
  { min: 80, grade: "A", status: "approved" },
  { min: 60, grade: "B", status: "approved" },
  { min: 40, grade: "C", status: "conditional" },
  { min: 0, grade: "black list", status: "rejected" }
];

function recalculateVendorGradeAndStatus(id: string) {
  const v = relationalDb.vendors[id];
  if (!v) return;

  const link = Object.values(relationalDb.vendor_materials).find(vm => vm.vendorId === id);
  const isSample = link ? link.isSample : false;

  // Let's preserve sample specific statuses
  if (isSample) {
    if (v.status === 'rejected' || v.grade === 'rejected' || v.grade === 'black list') {
      relationalDb.vendors[id].status = 'rejected';
      relationalDb.vendors[id].grade = 'black list';
    }
    return;
  }

  // Preserve explicit rejects / black list
  if (v.status === 'rejected' || v.grade === 'rejected' || v.grade === 'black list') {
    relationalDb.vendors[id].status = 'rejected';
    relationalDb.vendors[id].grade = 'black list';
    return;
  }

  const evalData = link ? Object.values(relationalDb.evaluations).find(ev => ev.vendorId === id && ev.materialId === link.materialId) : null;
  if (!evalData || !evalData.scores) return;

  const scores = evalData.scores;
  const isFullyScored = scores.commercial > 0 && scores.qa > 0 && scores.planning > 0 && scores.finance > 0;
  if (isFullyScored) {
    const overall = 
      ((scores.commercial || 0) * CALCULATION_WEIGHTS.commercial) +
      ((scores.qa || 0) * CALCULATION_WEIGHTS.qa) +
      ((scores.planning || 0) * CALCULATION_WEIGHTS.planning) +
      ((scores.finance || 0) * CALCULATION_WEIGHTS.finance);
    const rounded = Math.round(overall);

    let calcGrade = v.grade;
    let calcStatus = v.status;

    for (const tier of GRADE_TIERS) {
      if (rounded >= tier.min) {
        calcGrade = tier.grade;
        calcStatus = tier.status;
        break;
      }
    }

    relationalDb.vendors[id].grade = calcGrade;
    relationalDb.vendors[id].status = calcStatus;
    evalData.grade = calcGrade === 'rejected' ? 'black list' : (calcGrade || "C");
    evalData.totalScore = rounded;
  }
}

function parseDateSafely(dateStr: any): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? new Date() : dateStr;
  }
  
  try {
    let str = String(dateStr).trim();
    let d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d;
    }

    const pDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    for (let i = 0; i < 10; i++) {
      str = str.replace(pDigits[i], String(i));
    }
    const aDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    for (let i = 0; i < 10; i++) {
      str = str.replace(aDigits[i], String(i));
    }

    str = str.replace(/،/g, ',');

    d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d;
    }

    return new Date();
  } catch (err) {
    return new Date();
  }
}

function generateMaterialId(cas: string | undefined, irc: string | undefined, materialName: string | undefined, materialEn: string | undefined): string {
  const isCasEmpty = !cas || cas === "N/A" || cas === "NA" || cas === "-";
  const isIrcEmpty = !irc || irc === "N/A" || irc === "NA" || irc === "-";
  
  const combinedName = `${materialName || ''}_${materialEn || ''}`.trim();

  if (isCasEmpty && isIrcEmpty && combinedName !== '_') {
    const cleanName = Buffer.from(combinedName).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
    return `mat_NA_NA_${cleanName.substring(0, 25)}`.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  const baseId = `mat_${cas || 'NA'}_${irc || 'NA'}`;
  return baseId.replace(/[^a-zA-Z0-9_]/g, '_');
}

function partitionVendor(v: any) {
  if (!v || !v.id) return;
  const {
    id,
    scores, rawScores, rejectionReasons,
    contactInfo, lastAudit,
    activityLogs,
    analysisRecords,
    riskAssessment,
    category, material, materialEn, cas, irc, name, nameEn, country, grade, status, registrationDate, isSample,
    materialId: explicitMaterialId
  } = v;

  // 1. Map Vendor (Only Profile Details)
  relationalDb.vendors[id] = {
    id,
    name: name || "Unknown",
    nameEn: nameEn || "Unknown",
    country: country || "نامشخص",
    contactInfo: contactInfo || "",
    registrationDate: registrationDate || new Date().toISOString().split('T')[0],
    status: status || "new",
    grade: grade === 'rejected' ? 'black list' : (grade || null)
  };

  // 2. Map Material (Unique catalogue representation to prevent repetitive codes)
  let materialId = explicitMaterialId;
  if (materialId && relationalDb.materials[materialId]) {
    // Already defined in the master list, keep it as is
  } else {
    materialId = generateMaterialId(cas, irc, material, materialEn);
    if (!relationalDb.materials[materialId]) {
      relationalDb.materials[materialId] = {
        id: materialId,
        name: material || "نامشخص",
        nameEn: materialEn || "Unknown",
        cas: cas || "N/A",
        irc: irc || "N/A"
      };
    }
  }

  // 3. Map VendorMaterial relationship link (isSample & category)
  // Clean up any old links for this vendor that point to a different material
  for (const k of Object.keys(relationalDb.vendor_materials)) {
    if (relationalDb.vendor_materials[k].vendorId === id && relationalDb.vendor_materials[k].materialId !== materialId) {
      delete relationalDb.vendor_materials[k];
    }
  }

  const linkId = `link_${id}_${materialId}`;
  relationalDb.vendor_materials[linkId] = {
    id: linkId,
    vendorId: id,
    materialId: materialId,
    isSample: isSample ?? false,
    category: category || "foreign"
  };

  // 4. Map Periodic Evaluations to proper relational table structure
  const evalId = `eval_${id}_${materialId}`;
  const scoreObj = scores || { commercial: 0, qa: 0, planning: 0, finance: 0 };
  const overall = 
    ((scoreObj.commercial || 0) * CALCULATION_WEIGHTS.commercial) +
    ((scoreObj.qa || 0) * CALCULATION_WEIGHTS.qa) +
    ((scoreObj.planning || 0) * CALCULATION_WEIGHTS.planning) +
    ((scoreObj.finance || 0) * CALCULATION_WEIGHTS.finance);
  const rounded = Math.round(overall);

  relationalDb.evaluations[evalId] = {
    id: evalId,
    vendorId: id,
    materialId: materialId,
    period: "۱۴۰۵-Q1",
    commercialScore: scoreObj.commercial || 0,
    qaScore: scoreObj.qa || 0,
    planningScore: scoreObj.planning || 0,
    financeScore: scoreObj.finance || 0,
    totalScore: rounded,
    grade: grade === 'rejected' ? 'black list' : (grade || "C"),
    scores: scoreObj,
    rawScores: rawScores || null,
    rejectionReasons: rejectionReasons || null
  };

  // 5. Map Audit Log trails
  if (Array.isArray(activityLogs)) {
    activityLogs.forEach((log: any) => {
      const exists = relationalDb.audit_logs.some(al => al.id === log.id);
      if (!exists) {
        relationalDb.audit_logs.push({
          id: log.id || `log_${Math.random().toString(36).substr(2, 9)}`,
          vendorId: id,
          user: log.user || "کاربر سیستم",
          action: "بروزرسانی اطلاعات",
          details: log.action || "ارزیابی یا ویرایش تأمین‌کننده",
          createdAt: log.date || new Date().toISOString()
        });
      }
    });
  }

  // Backup store for extra attachments and forms
  relationalDb.contacts[id] = {
    contactInfo: contactInfo || '',
    lastAudit: lastAudit || ''
  };
  relationalDb.analysis_records[id] = analysisRecords || [];
  relationalDb.risk_assessments[id] = riskAssessment || null;

  recalculateVendorGradeAndStatus(id);
}

function reconstructVendor(id: string) {
  const baseVendor = relationalDb.vendors[id];
  if (!baseVendor) return null;

  const link = Object.values(relationalDb.vendor_materials).find(vm => vm.vendorId === id);
  const material = link ? relationalDb.materials[link.materialId] : null;
  const evalData = link ? (Object.values(relationalDb.evaluations).find(ev => ev.vendorId === id && ev.materialId === link.materialId) || null) : null;

  // Rebuild Audit Logs back to ActivityLogs array structure used by frontend
  const activityLogs = relationalDb.audit_logs
    .filter(al => al.vendorId === id)
    .map(al => ({
      id: al.id,
      action: al.details || al.action,
      date: al.createdAt,
      user: al.user
    }));

  const analysisRecords = relationalDb.analysis_records[id] || [];
  const riskAssessment = relationalDb.risk_assessments[id] || null;

  return {
    id: baseVendor.id,
    name: baseVendor.name,
    nameEn: baseVendor.nameEn,
    country: baseVendor.country,
    contactInfo: baseVendor.contactInfo || (relationalDb.contacts[id]?.contactInfo || ""),
    registrationDate: baseVendor.registrationDate,
    status: baseVendor.status,
    grade: baseVendor.grade === 'rejected' ? 'black list' : baseVendor.grade,

    materialId: link ? link.materialId : null,
    material: material ? material.name : "نامشخص",
    materialEn: material ? material.nameEn : "Unknown",
    cas: material ? material.cas : "N/A",
    irc: material ? material.irc : "N/A",

    isSample: link ? link.isSample : false,
    category: link ? link.category : "foreign",

    scores: evalData ? evalData.scores : null,
    rawScores: evalData ? evalData.rawScores : null,
    rejectionReasons: evalData ? evalData.rejectionReasons : null,

    activityLogs,
    analysisRecords,
    riskAssessment,
    lastAudit: relationalDb.contacts[id]?.lastAudit || ""
  };
}

function getAllVendorsFlat() {
  return Object.keys(relationalDb.vendors).map(reconstructVendor).filter(Boolean);
}

let _prismaInstance: PrismaClient | null = null;
function getPrismaClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  if (!_prismaInstance) {
    try {
      _prismaInstance = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });
      console.log("[Prisma] Lazily initialized PrismaClient for PostgreSQL.");
    } catch (err: any) {
      console.error("[Prisma] Failed to instantiate PrismaClient:", err.message);
      _prismaInstance = null;
    }
  }
  return _prismaInstance;
}

async function getVendorsList(): Promise<any[]> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return getAllVendorsFlat();
  }
  try {
    const vendors = await prisma.vendor.findMany();
    const vendorMaterials = await prisma.vendorMaterial.findMany();
    const materials = await prisma.material.findMany();
    const evaluations = await prisma.evaluation.findMany();
    const auditLogs = await prisma.auditLog.findMany();

    const materialsMap = new Map<string, any>(materials.map(m => [m.id, m]));
    const evaluationsMap = new Map<string, any>(evaluations.map(ev => [ev.vendorId, ev]));
    
    const logsByVendor = new Map<string, any[]>();
    auditLogs.forEach(log => {
      if (log.vendorId) {
        const existing = logsByVendor.get(log.vendorId) || [];
        existing.push({
          id: log.id,
          action: log.details || log.action,
          date: log.createdAt.toISOString(),
          user: log.user
        });
        logsByVendor.set(log.vendorId, existing);
      }
    });

    const result: any[] = [];
    for (const v of vendors) {
      const link = vendorMaterials.find(vm => vm.vendorId === v.id);
      const materialObj = link ? materialsMap.get(link.materialId) : null;
      const evalObj = evaluationsMap.get(v.id);

      let scoreObj = null;
      let rawScoresObj = null;
      let rejectionReasonsObj = null;

      if (evalObj) {
        try { scoreObj = evalObj.scores ? JSON.parse(evalObj.scores) : null; } catch {}
        try { rawScoresObj = evalObj.rawScores ? JSON.parse(evalObj.rawScores) : null; } catch {}
        try { rejectionReasonsObj = evalObj.rejectionReasons ? JSON.parse(evalObj.rejectionReasons) : null; } catch {}
        
        if (!scoreObj) {
          scoreObj = {
            commercial: evalObj.commercialScore,
            qa: evalObj.qaScore,
            planning: evalObj.planningScore,
            finance: evalObj.financeScore
          };
        }
      }

      let riskObj = null;
      try { riskObj = v.riskAssessment ? JSON.parse(v.riskAssessment) : null; } catch {}

      let analysisArr: any[] = [];
      try { analysisArr = v.analysisRecords ? JSON.parse(v.analysisRecords) : []; } catch {}

      result.push({
        id: v.id,
        name: v.name,
        nameEn: v.nameEn,
        country: v.country,
        contactInfo: v.contactInfo || "",
        registrationDate: v.registrationDate || "",
        status: v.status,
        grade: v.grade,
        material: materialObj ? materialObj.name : "نامشخص",
        materialEn: materialObj ? materialObj.nameEn : "Unknown",
        cas: materialObj ? materialObj.cas : "N/A",
        irc: materialObj ? materialObj.irc : "N/A",
        isSample: link ? link.isSample : false,
        category: link ? link.category : "foreign",
        scores: scoreObj,
        rawScores: rawScoresObj,
        rejectionReasons: rejectionReasonsObj,
        activityLogs: logsByVendor.get(v.id) || [],
        analysisRecords: analysisArr,
        riskAssessment: riskObj,
        lastAudit: ""
      });
    }
    return result;
  } catch (err: any) {
    console.warn("[Prisma] Failed to query PostgreSQL, falling back to local file:", err.message);
    return getAllVendorsFlat();
  }
}

async function getVendorById(id: string): Promise<any> {
  const list = await getVendorsList();
  return list.find(v => v.id === id) || null;
}

async function saveVendorToDb(v: any): Promise<boolean> {
  const prisma = getPrismaClient();
  if (!prisma) {
    partitionVendor(v);
    saveDb();
    return true;
  }
  try {
    const {
      id, name, nameEn, country, contactInfo, registrationDate, status, grade,
      isSample, category,
      scores, rawScores, rejectionReasons,
      activityLogs, analysisRecords, riskAssessment,
      materialId: explicitMaterialId
    } = v;

    let materialId = explicitMaterialId;
    let material = v.material;
    let materialEn = v.materialEn;
    let cas = v.cas;
    let irc = v.irc;

    if (materialId && relationalDb.materials[materialId]) {
      const mat = relationalDb.materials[materialId];
      material = mat.name;
      materialEn = mat.nameEn;
      cas = mat.cas;
      irc = mat.irc;
    } else {
      materialId = generateMaterialId(cas, irc, material, materialEn);
    }

    const riskText = riskAssessment ? JSON.stringify(riskAssessment) : null;
    const analysisText = analysisRecords ? JSON.stringify(analysisRecords) : null;
    const scoreText = scores ? JSON.stringify(scores) : null;
    const rawScoreText = rawScores ? JSON.stringify(rawScores) : null;
    const rejectText = rejectionReasons ? JSON.stringify(rejectionReasons) : null;

    const scoreObj = scores || { commercial: 0, qa: 0, planning: 0, finance: 0 };
    const overall = 
      ((scoreObj.commercial || 0) * CALCULATION_WEIGHTS.commercial) +
      ((scoreObj.qa || 0) * CALCULATION_WEIGHTS.qa) +
      ((scoreObj.planning || 0) * CALCULATION_WEIGHTS.planning) +
      ((scoreObj.finance || 0) * CALCULATION_WEIGHTS.finance);
    const roundedTotal = Math.round(overall);

    await prisma.vendor.upsert({
      where: { id },
      update: {
        name: name || "Unknown",
        nameEn: nameEn || "Unknown",
        country: country || "نامشخص",
        contactInfo: contactInfo || null,
        registrationDate: registrationDate || new Date().toISOString().split('T')[0],
        status: status || "new",
        grade: grade || null,
        riskAssessment: riskText,
        analysisRecords: analysisText,
      },
      create: {
        id,
        name: name || "Unknown",
        nameEn: nameEn || "Unknown",
        country: country || "نامشخص",
        contactInfo: contactInfo || null,
        registrationDate: registrationDate || new Date().toISOString().split('T')[0],
        status: status || "new",
        grade: grade || null,
        riskAssessment: riskText,
        analysisRecords: analysisText,
      },
    });

    await prisma.material.upsert({
      where: { id: materialId },
      update: {
        name: material || "نامشخص",
        nameEn: materialEn || "Unknown",
        cas: cas || "N/A",
        irc: irc || "N/A",
      },
      create: {
        id: materialId,
        name: material || "نامشخص",
        nameEn: materialEn || "Unknown",
        cas: cas || "N/A",
        irc: irc || "N/A",
      },
    });

    // Delete any old links for this vendor that point to a different material
    await prisma.vendorMaterial.deleteMany({
      where: {
        vendorId: id,
        materialId: { not: materialId }
      }
    });

    const linkId = `link_${id}_${materialId}`;
    await prisma.vendorMaterial.upsert({
      where: { id: linkId },
      update: {
        isSample: isSample ?? false,
        category: category || "foreign",
      },
      create: {
        id: linkId,
        vendorId: id,
        materialId: materialId,
        isSample: isSample ?? false,
        category: category || "foreign",
      },
    });

    const evalId = `eval_${id}_${materialId}`;
    await prisma.evaluation.upsert({
      where: { id: evalId },
      update: {
        period: "۱۴۰۵-Q1",
        commercialScore: scoreObj.commercial || 0,
        qaScore: scoreObj.qa || 0,
        planningScore: scoreObj.planning || 0,
        financeScore: scoreObj.finance || 0,
        totalScore: roundedTotal,
        grade: grade || "C",
        scores: scoreText,
        rawScores: rawScoreText,
        rejectionReasons: rejectText,
      },
      create: {
        id: evalId,
        vendorId: id,
        materialId: materialId,
        period: "۱۴۰۵-Q1",
        commercialScore: scoreObj.commercial || 0,
        qaScore: scoreObj.qa || 0,
        planningScore: scoreObj.planning || 0,
        financeScore: scoreObj.finance || 0,
        totalScore: roundedTotal,
        grade: grade || "C",
        scores: scoreText,
        rawScores: rawScoreText,
        rejectionReasons: rejectText,
      },
    });

    if (activityLogs && Array.isArray(activityLogs)) {
      await prisma.auditLog.deleteMany({
        where: { vendorId: id }
      });

      for (const log of activityLogs) {
        await prisma.auditLog.create({
          data: {
            id: log.id || `log_${Math.random().toString(36).substr(2, 9)}`,
            vendorId: id,
            user: log.user || "کاربر سیستم",
            action: log.details || log.action || "بروزرسانی اطلاعات",
            details: log.action || "ارزیابی یا ویرایش تأمین‌کننده",
            createdAt: log.date ? parseDateSafely(log.date) : new Date(),
          }
        });
      }
    }

    return true;
  } catch (err: any) {
    console.warn("[Prisma] Failed to save to PostgreSQL, falling back to local memory:", err.message);
    partitionVendor(v);
    saveDb();
    return true;
  }
}

async function deleteVendorFromDb(id: string): Promise<boolean> {
  const prisma = getPrismaClient();
  if (!prisma) {
    if (relationalDb.vendors[id]) {
      delete relationalDb.vendors[id];
      const link = Object.values(relationalDb.vendor_materials).find(vm => vm.vendorId === id);
      if (link) {
        delete relationalDb.vendor_materials[link.id];
        const evalId = `eval_${id}_${link.materialId}`;
        delete relationalDb.evaluations[evalId];
      }
      delete relationalDb.contacts[id];
      delete relationalDb.analysis_records[id];
      delete relationalDb.risk_assessments[id];
      relationalDb.audit_logs = relationalDb.audit_logs.filter(al => al.vendorId !== id);
      saveDb();
      return true;
    }
    return false;
  }
  try {
    await prisma.auditLog.deleteMany({ where: { vendorId: id } });
    await prisma.evaluation.deleteMany({ where: { vendorId: id } });
    await prisma.vendorMaterial.deleteMany({ where: { vendorId: id } });
    await prisma.vendor.delete({ where: { id } });
    return true;
  } catch (err: any) {
    console.warn("[Prisma] Failed to delete from PostgreSQL, falling back to local database:", err.message);
    if (relationalDb.vendors[id]) {
      delete relationalDb.vendors[id];
      const link = Object.values(relationalDb.vendor_materials).find(vm => vm.vendorId === id);
      if (link) {
        delete relationalDb.vendor_materials[link.id];
        const evalId = `eval_${id}_${link.materialId}`;
        delete relationalDb.evaluations[evalId];
      }
      delete relationalDb.contacts[id];
      delete relationalDb.analysis_records[id];
      delete relationalDb.risk_assessments[id];
      relationalDb.audit_logs = relationalDb.audit_logs.filter(al => al.vendorId !== id);
      saveDb();
      return true;
    }
    return false;
  }
}

// Load relational DB version v2 from file (with support for migrating legacy v1 and flat db schemas)
try {
  if (fs.existsSync(dbPath)) {
    const rawData = fs.readFileSync(dbPath, "utf-8");
    const parsed = JSON.parse(rawData);
    if (parsed && parsed._relational_v2) {
      relationalDb = {
        vendors: parsed.vendors || {},
        materials: parsed.materials || {},
        vendor_materials: parsed.vendor_materials || {},
        evaluations: parsed.evaluations || {},
        audit_logs: parsed.audit_logs || [],
        risk_assessments: parsed.risk_assessments || {},
        analysis_records: parsed.analysis_records || {},
        contacts: parsed.contacts || {}
      };
      console.log(`[RelationalDB] Loaded strictly normalized strict-5-entity relational database.`);
    } else if (parsed && parsed._relational) {
      console.log(`[RelationalDB] Migrating old relational model v1 to new normalized 5-entity model.`);
      // Transform old structures to new structures by reconstructing and re-partitioning
      const tempVendors = parsed.vendors || {};
      Object.keys(tempVendors).forEach(vid => {
        // Prepare temporary flat object representing old vendor
        const ev = parsed.evaluations?.[vid] || {};
        const co = parsed.contacts?.[vid] || {};
        const logs = parsed.activity_logs?.[vid] || [];
        const analysis = parsed.analysis_records?.[vid] || [];
        const risk = parsed.risk_assessments?.[vid] || null;
        const vBase = tempVendors[vid];

        partitionVendor({
          ...vBase,
          ...ev,
          ...co,
          activityLogs: logs,
          analysisRecords: analysis,
          riskAssessment: risk
        });
      });
      saveDb();
    } else if (Array.isArray(parsed)) {
      console.log(`[RelationalDB] Converting legacy flat raw list database format.`);
      parsed.forEach(partitionVendor);
      saveDb();
    }
  } else {
    console.log(`[RelationalDB] Bootstrapping clean databases.`);
    INITIAL_VENDORS_DB.forEach(partitionVendor);
    saveDb();
  }
} catch (err: any) {
  console.warn("[RelationalDB] Fallback in-memory loaded:", err.message);
  INITIAL_VENDORS_DB.forEach(partitionVendor);
}

function saveDb() {
  try {
    const dirPath = path.dirname(dbPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const dataToWrite = {
      _relational_v2: true,
      vendors: relationalDb.vendors,
      materials: relationalDb.materials,
      vendor_materials: relationalDb.vendor_materials,
      evaluations: relationalDb.evaluations,
      audit_logs: relationalDb.audit_logs,
      risk_assessments: relationalDb.risk_assessments,
      analysis_records: relationalDb.analysis_records,
      contacts: relationalDb.contacts
    };
    fs.writeFileSync(dbPath, JSON.stringify(dataToWrite, null, 2), "utf-8");
  } catch (err: any) {
    console.warn("[RelationalDB] Failed writing database changes to disk:", err.message);
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "internal-regulatory-compliance-secret-key-321";

const usersDbPath = path.join(process.cwd(), "database", "users.json");
let USERS_DB: Record<string, any> = {
  admin: { username: "admin", password: "123456", role: "admin", name: "مدیر سیستم" },
  commercial: { username: "commercial", password: "123", role: "commercial", name: "واحد بازرگانی" },
  qa: { username: "qa", password: "123", role: "qa", name: "واحد کیفیت" },
  planning: { username: "planning", password: "123", role: "planning", name: "واحد برنامه‌ریزی و انبار" },
  finance: { username: "finance", password: "123", role: "finance", name: "واحد مالی" },
};

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

function loadUsersDb() {
  try {
    if (fs.existsSync(usersDbPath)) {
      const data = fs.readFileSync(usersDbPath, "utf-8");
      USERS_DB = JSON.parse(data);
    }
    
    // Migrate plain-text passwords to hashed passwords and initialize mustChangePassword flags
    let modified = false;
    for (const key of Object.keys(USERS_DB)) {
      const user = USERS_DB[key];
      
      // If password is still a plain text string, hash it
      if (typeof user.password === "string") {
        const salt = generateSalt();
        const hash = hashPassword(user.password, salt);
        user.password = { hash, salt };
        
        // Plain text defaults must change password on first login
        if (user.mustChangePassword === undefined) {
          user.mustChangePassword = true;
        }
        modified = true;
      }
      
      // Ensure mustChangePassword flag is explicitly set if missing
      if (user.mustChangePassword === undefined) {
        user.mustChangePassword = true;
        modified = true;
      }
    }
    
    if (modified) {
      saveUsersDb();
    }
  } catch (err: any) {
    console.warn("[UsersDB] Failed loading or migrating users db:", err.message);
  }
}

function saveUsersDb() {
  try {
    const dir = path.dirname(usersDbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(usersDbPath, JSON.stringify(USERS_DB, null, 2), "utf-8");
  } catch (err: any) {
    console.warn("[UsersDB] Failed to save users db to disk:", err.message);
  }
}

// Initialize users database on startup
loadUsersDb();

function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access Denied: Security token is missing or not provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Access Denied: Session integrity verification failed" });
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // --- API Routes ---

  // Health check - Returns simple status of the server
  app.get("/api/health", async (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date() 
    });
  });

  // User Login (Authenticates users securely without clear-text hardcoding in client bundle)
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required credentials" });
    }

    const matchedUser = USERS_DB[username.toLowerCase()];
    if (!matchedUser) {
      return res.status(401).json({ error: "Incorrect username or password. Please try again." });
    }

    let isPasswordCorrect = false;
    if (typeof matchedUser.password === "string") {
      isPasswordCorrect = (matchedUser.password === password);
    } else if (matchedUser.password && typeof matchedUser.password === "object") {
      const { hash, salt } = matchedUser.password;
      isPasswordCorrect = (hashPassword(password, salt) === hash);
    }

    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Incorrect username or password. Please try again." });
    }

    // Sign the JWT securely
    const token = jwt.sign(
      { username: matchedUser.username, role: matchedUser.role, name: matchedUser.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const mustChangePassword = matchedUser.mustChangePassword !== false;

    res.json({
      success: true,
      token,
      user: {
        username: matchedUser.username,
        role: matchedUser.role,
        name: matchedUser.name,
        mustChangePassword
      }
    });
  });

  // Change Password endpoint for security compliance
  app.post("/api/auth/change-password", requireAuth, (req: any, res) => {
    const { currentPassword, newPassword } = req.body;
    const username = req.user.username;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "وارد کردن کلمه عبور فعلی و جدید الزامی است" });
    }

    if (newPassword === "123" || newPassword === "123456") {
      return res.status(400).json({ error: "کلمه عبور جدید نمی‌تواند رمز پیش‌فرض باشد" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "کلمه عبور جدید باید حداقل ۶ کاراکتر باشد" });
    }

    const matchedUser = USERS_DB[username.toLowerCase()];
    if (!matchedUser) {
      return res.status(404).json({ error: "کاربر یافت نشد" });
    }

    let isCurrentPasswordCorrect = false;
    if (typeof matchedUser.password === "string") {
      isCurrentPasswordCorrect = (matchedUser.password === currentPassword);
    } else if (matchedUser.password && typeof matchedUser.password === "object") {
      const { hash, salt } = matchedUser.password;
      isCurrentPasswordCorrect = (hashPassword(currentPassword, salt) === hash);
    }

    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({ error: "کلمه عبور فعلی وارد شده نادرست است" });
    }

    // Change the password, hash and salt it, and persist
    const newSalt = generateSalt();
    USERS_DB[username.toLowerCase()].password = {
      hash: hashPassword(newPassword, newSalt),
      salt: newSalt
    };
    USERS_DB[username.toLowerCase()].mustChangePassword = false;
    saveUsersDb();

    console.log(`[Security] Password successfully updated and hashed for user: ${username}`);
    res.json({ 
      success: true, 
      message: "کلمه عبور با موفقیت تغییر یافت",
      user: {
        username: matchedUser.username,
        role: matchedUser.role,
        name: matchedUser.name,
        mustChangePassword: false
      }
    });
  });

  // Fetch / verify logged in user's profile state
  app.get("/api/auth/me", requireAuth, (req: any, res) => {
    const username = req.user.username;
    const matchedUser = USERS_DB[username.toLowerCase()];
    const mustChangePassword = matchedUser ? matchedUser.mustChangePassword !== false : false;

    res.json({ 
      success: true, 
      user: {
        username: req.user.username,
        role: req.user.role,
        name: req.user.name,
        mustChangePassword
      }
    });
  });

  // Dynamic configuration endpoint for scoring weights & mapping criteria
  app.get("/api/config/evaluation", (req, res) => {
    res.json({
      weights: CALCULATION_WEIGHTS,
      tiers: GRADE_TIERS
    });
  });

  // Get all materials from Master List
  app.get("/api/materials", async (req, res) => {
    try {
      const prisma = getPrismaClient();
      if (prisma) {
        const list = await prisma.material.findMany();
        const enriched = list.map(m => {
          const local = relationalDb.materials[m.id] || {};
          return {
            ...local,
            id: m.id,
            name: m.name,
            nameEn: m.nameEn,
            cas: m.cas,
            irc: m.irc
          };
        });
        return res.json(enriched);
      } else {
        return res.json(Object.values(relationalDb.materials));
      }
    } catch (err: any) {
      console.error("Failed to fetch materials:", err);
      return res.json(Object.values(relationalDb.materials));
    }
  });

  // Create or Update single material in Master List
  app.post("/api/materials", requireAuth, async (req, res) => {
    try {
      const m = req.body;
      if (!m.name || !m.nameEn) {
        return res.status(400).json({ error: "نام فارسی و انگلیسی ماده الزامی است." });
      }
      
      const id = m.id || `mat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      m.id = id;
      
      relationalDb.materials[id] = m;
      saveDb();

      const prisma = getPrismaClient();
      if (prisma) {
        await prisma.material.upsert({
          where: { id },
          update: {
            name: m.name,
            nameEn: m.nameEn,
            cas: m.cas || "N/A",
            irc: m.irc || "N/A"
          },
          create: {
            id,
            name: m.name,
            nameEn: m.nameEn,
            cas: m.cas || "N/A",
            irc: m.irc || "N/A"
          }
        });
      }
      
      res.json({ success: true, material: m });
    } catch (err: any) {
      console.error("Failed to save material:", err);
      res.status(500).json({ error: "Failed to save material" });
    }
  });

  // Delete a material (only if not used in vendor_materials)
  app.delete("/api/materials/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      const isLinkedLocal = Object.values(relationalDb.vendor_materials).some(vm => vm.materialId === id);
      
      const prisma = getPrismaClient();
      let isLinkedPrisma = false;
      if (prisma) {
        const count = await prisma.vendorMaterial.count({
          where: { materialId: id }
        });
        isLinkedPrisma = count > 0;
      }
      
      if (isLinkedLocal || isLinkedPrisma) {
        return res.status(400).json({ error: "این ماده به منابع تأمین متصل است و نمی‌توان آن را حذف کرد." });
      }
      
      delete relationalDb.materials[id];
      saveDb();
      
      if (prisma) {
        await prisma.material.delete({
          where: { id }
        });
      }
      
      res.json({ success: true });
    } catch (err: any) {
      console.error("Failed to delete material:", err);
      res.status(500).json({ error: "Failed to delete material" });
    }
  });

  // Get all vendors (Unified Database)
  app.get("/api/vendors", async (req, res) => {
    try {
      const list = await getVendorsList();
      res.json(list);
    } catch (error: any) {
      console.error("Failed to fetch vendors:", error);
      res.status(500).json({ error: "Failed to fetch vendors" });
    }
  });

  // Create or Update single vendor (Unified Database)
  app.post("/api/vendors", requireAuth, async (req, res) => {
    try {
      const validationResult = vendorSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Validation failed", details: validationResult.error.issues });
      }
      
      const v = validationResult.data;
      
      // Fix material ID generation to prevent replacing when cas/irc are empty
      if (!v.cas && !v.irc && v.material) {
        // Append a hashed or normalized material name if cas and irc are missing
        const matNameClean = v.material.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_');
        v.id = v.id || `vend_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
      }
      
      await saveVendorToDb(v);
      const updated = await getVendorById(v.id);
      console.log(`[UnifiedDB] Saved monolithic vendor payload: ${v.id}`);
      res.json({ success: true, vendor: updated });
    } catch (error: any) {
      console.error("Failed to save vendor:", error);
      res.status(500).json({ error: "Failed to save vendor" });
    }
  });

  // Update vendor profile (Unified Database)
  app.patch("/api/vendors/:id/profile", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const current = await getVendorById(id);
      if (!current) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      const validationResult = vendorProfileSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Validation failed", details: validationResult.error.issues });
      }
      const p = validationResult.data;
      const updatedVendor = {
        ...current,
        ...p
      };
      await saveVendorToDb(updatedVendor);
      const result = await getVendorById(id);
      console.log(`[UnifiedDB] Saved fine-grained profile details for vendor: ${id}`);
      res.json({ success: true, part: "profile", vendor: result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update vendor contact details (Unified Database)
  app.patch("/api/vendors/:id/contact", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const current = await getVendorById(id);
      if (!current) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      const validationResult = vendorContactSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Validation failed", details: validationResult.error.issues });
      }
      const c = validationResult.data;
      const updatedVendor = {
        ...current,
        contactInfo: c.contactInfo ?? current.contactInfo,
        lastAudit: c.lastAudit ?? current.lastAudit
      };
      await saveVendorToDb(updatedVendor);
      const result = await getVendorById(id);
      console.log(`[UnifiedDB] Saved fine-grained contact details for vendor: ${id}`);
      res.json({ success: true, part: "contact", vendor: result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update vendor scores & evaluations (Unified Database)
  app.patch("/api/vendors/:id/scores", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const current = await getVendorById(id);
      if (!current) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      const validationResult = vendorScoreSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Validation failed", details: validationResult.error.issues });
      }
      const s = validationResult.data;

      const updatedVendor = {
        ...current,
        scores: s.scores ?? current.scores,
        rawScores: s.rawScores ?? current.rawScores,
        rejectionReasons: s.rejectionReasons ?? current.rejectionReasons
      };

      // Calculate grade automatically based on newly patched scores
      if (updatedVendor.scores) {
        const scoreObj = updatedVendor.scores;
        const overall = 
          ((scoreObj.commercial || 0) * CALCULATION_WEIGHTS.commercial) +
          ((scoreObj.qa || 0) * CALCULATION_WEIGHTS.qa) +
          ((scoreObj.planning || 0) * CALCULATION_WEIGHTS.planning) +
          ((scoreObj.finance || 0) * CALCULATION_WEIGHTS.finance);
        const rounded = Math.round(overall);

        let calcGrade = updatedVendor.grade;
        let calcStatus = updatedVendor.status;

        if (updatedVendor.isSample) {
          if (updatedVendor.status === 'rejected' || updatedVendor.grade === 'rejected' || updatedVendor.grade === 'black list') {
            updatedVendor.status = 'rejected';
            updatedVendor.grade = 'rejected';
          }
        } else {
          for (const tier of GRADE_TIERS) {
            if (rounded >= tier.min) {
              calcGrade = tier.grade === 'black list' ? 'rejected' : tier.grade;
              calcStatus = tier.status;
              break;
            }
          }
          updatedVendor.grade = calcGrade;
          updatedVendor.status = calcStatus;
        }
      }

      await saveVendorToDb(updatedVendor);
      const result = await getVendorById(id);
      console.log(`[UnifiedDB] Saved fine-grained scores details & updated business calculations for vendor: ${id}`);
      res.json({ success: true, part: "scores", vendor: result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update vendor activity logs (Unified Database)
  app.patch("/api/vendors/:id/logs", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const current = await getVendorById(id);
      if (!current) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      const validationResult = vendorLogsSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Validation failed", details: validationResult.error.issues });
      }
      const l = validationResult.data;
      const updatedVendor = {
        ...current,
        activityLogs: l.activityLogs ?? current.activityLogs
      };
      await saveVendorToDb(updatedVendor);
      const result = await getVendorById(id);
      console.log(`[UnifiedDB] Append/Saved audit log events for vendor: ${id}`);
      res.json({ success: true, part: "logs", vendor: result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update vendor analysis records & logs (Unified Database)
  app.patch("/api/vendors/:id/analysis", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const current = await getVendorById(id);
      if (!current) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      const validationResult = vendorAnalysisSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Validation failed", details: validationResult.error.issues });
      }
      const a = validationResult.data;
      const updatedVendor = {
        ...current,
        analysisRecords: a.analysisRecords ?? current.analysisRecords,
        activityLogs: a.activityLogs ?? current.activityLogs
      };
      await saveVendorToDb(updatedVendor);
      const result = await getVendorById(id);
      console.log(`[UnifiedDB] Saved fine-grained analysis record for vendor: ${id}`);
      res.json({ success: true, part: "analysis", vendor: result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update vendor risk assessment (Unified Database)
  app.patch("/api/vendors/:id/risk", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const current = await getVendorById(id);
      if (!current) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      const validationResult = vendorRiskSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Validation failed", details: validationResult.error.issues });
      }
      const r = validationResult.data;
      const updatedVendor = {
        ...current,
        riskAssessment: r.riskAssessment ?? current.riskAssessment
      };
      await saveVendorToDb(updatedVendor);
      const result = await getVendorById(id);
      console.log(`[UnifiedDB] Saved fine-grained risk assessment parameters for vendor: ${id}`);
      res.json({ success: true, part: "risk", vendor: result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete vendor (Unified Database)
  app.delete("/api/vendors/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await deleteVendorFromDb(id);
      if (success) {
        console.log(`[UnifiedDB] Deleted vendor relational files: ${id}`);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Vendor not found" });
      }
    } catch (error: any) {
      console.error("Failed to delete vendor:", error);
      res.status(500).json({ error: "Failed to delete vendor" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

const appPromise = startServer();

if (!process.env.VERCEL) {
  appPromise.then(app => {
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  });
}

export default async function handler(req: express.Request, res: express.Response) {
  const app = await appPromise;
  return app(req, res);
}

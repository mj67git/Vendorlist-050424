export type Category = 'foreign' | 'domestic' | 'veterinary' | 'packaging' | 'sample' | 'blacklist';
export type Status = 'approved' | 'conditional' | 'rejected' | 'new';
export type Grade = 'A' | 'B' | 'C' | 'black list' | 'rejected' | null | string;

export type Role = 'admin' | 'lab' | 'commercial' | 'qa' | 'planning' | 'finance';
export interface User {
  username: string;
  role: Role;
  name: string;
  mustChangePassword?: boolean;
}

export interface AnalysisRecord {
  id: string;
  date: string;
  qcCode: string;
  decision: 'Pass' | 'Reject' | 'Approved Conditional';
  deviationReason: 'None' | 'NCR' | 'Deviation' | 'OOS' | 'CAPA' | 'OOT' | 'Complaint' | 'Other';
  comments: string;
  recordedBy: string;
}

export interface Scores {
  commercial: number;
  qa: number;
  planning: number;
  finance: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  date: string;
  user: string;
}

export interface RiskAssessmentData {
  materialCriticality: number; // 1-5
  detectability: number; // 1-5
  probability: number; // 1-5
  sps: number;
  riskScore: number;
  sri: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  date: string;
  evaluator: string;
}

export interface Vendor {
  id: string;
  category: Category;
  material: string;
  materialEn: string;
  cas: string;
  irc: string;
  ircReceivedDate?: string;
  ircExpiryDate?: string;
  name: string;
  nameEn: string;
  country: string;
  grade: Grade;
  status: Status;
  scores: Scores | null;
  rawScores?: Record<string, Record<string, number>>;
  lastAudit: string | null;
  rejectionReasons: string[] | null;
  contactInfo?: string;
  registrationDate?: string;
  isSample?: boolean;
  activityLogs?: ActivityLog[];
  riskAssessment?: RiskAssessmentData | null;
  analysisRecords?: AnalysisRecord[];
  materialId?: string | null;
}

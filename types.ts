export interface PatientData {
  fullName: string;
  startDate: string;
  endDate: string;
  surgeryDate: string;
  diagnosis: string;
  doctorName: string;
  headOfDeptName: string;
  gender: 'male' | 'female';
}

export interface DiaryEntry {
  date: string; // ISO string
  isWeekend: boolean;
  isSurgeryDay: boolean;
  dayType: 'regular' | 'surgery_morning' | 'surgery_evening' | 'weekend';
  
  // Vitals (generated or randomized in frontend)
  time: string;
  respiratoryRate: number; // ЧД
  heartRate: number; // Pulse
  bloodPressure: string; // АД (e.g., "120/80")
  temperature: number;
  
  // AI Generated Content
  complaints: string;
  objectiveStatus: string; // General status
  localStatus: string;
  recommendations: string;
  
  // Logic flags
  isHeadOfDeptInspection: boolean; // Mon/Fri
  isDischarge: boolean;
}

export interface GenerationResponse {
  entries: DiaryEntry[];
}
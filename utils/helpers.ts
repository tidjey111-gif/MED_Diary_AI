import { DiaryEntry } from '../types';

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const getDatesInRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const curr = new Date(startDate);
  const end = new Date(endDate);

  while (curr <= end) {
    dates.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

// Random integer inclusive
export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper to get a random element from an array
const getRandomElement = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};


// Generate realistic vitals variation
export const generateVitals = () => {
  const systolicValues = [120, 125, 130];
  const diastolicValues = [80, 85, 90];

  const sys = getRandomElement(systolicValues);
  const dia = getRandomElement(diastolicValues);
  
  const hr = getRandomInt(60, 78);
  const rr = getRandomInt(16, 18);
  
  return {
    bloodPressure: `${sys}/${dia}`,
    heartRate: hr,
    respiratoryRate: rr,
    temperature: 36.0 + (getRandomInt(2, 8) / 10), // 36.2 - 36.8
  };
};

export const isWeekend = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

export const isMondayOrFriday = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 1 || day === 5; // 1 Mon, 5 Fri
};

export const formatTime = (hour: number, minuteVariation: number = 30): string => {
  const h = hour;
  const m = getRandomInt(0, minuteVariation);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};
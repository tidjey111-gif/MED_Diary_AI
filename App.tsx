import React, { useState, useEffect } from 'react';
import PatientForm from './components/PatientForm';
import ActionPanel from './components/ActionPanel';
import { PatientData, DiaryEntry } from './types';
import { generateDiaryText } from './services/geminiService';
import { generateDocx } from './services/docxGenerator';
import { getDatesInRange, generateVitals, formatTime, isWeekend, isMondayOrFriday } from './utils/helpers';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState<PatientData>({
    fullName: '',
    startDate: '',
    endDate: '',
    surgeryDate: '',
    diagnosis: '',
    doctorName: '',
    headOfDeptName: '',
    gender: 'female'
  });

  useEffect(() => {
    const savedData = localStorage.getItem('medDiaryPatientData');
    if (savedData) {
      try { setPatientData(JSON.parse(savedData)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('medDiaryPatientData', JSON.stringify(patientData));
  }, [patientData]);

  const handleGenerate = async () => {
    if (!patientData.fullName || !patientData.startDate || !patientData.endDate || !patientData.diagnosis) {
      alert("Пожалуйста, заполните основные поля.");
      return;
    }

    setLoading(true);
    try {
      const generatedTemplates = await generateDiaryText(patientData);
      const { preOp, postOpStandard, postOpFinal, dischargeDay } = generatedTemplates;
      
      const dateRange = getDatesInRange(patientData.startDate, patientData.endDate);
      const diaryEntries: DiaryEntry[] = [];

      const endDateObj = new Date(patientData.endDate);
      const preDischargeDateObj = new Date(endDateObj);
      preDischargeDateObj.setDate(endDateObj.getDate() - 1); 
      const preDischargeDateStr = preDischargeDateObj.toISOString().split('T')[0];

      dateRange.forEach((dateStr) => {
        if(isWeekend(dateStr)) {
            diaryEntries.push({
                date: dateStr, isWeekend: true, dayType: 'weekend', time: '', heartRate: 0, bloodPressure: '', temperature: 0, complaints: '', objectiveStatus: '', localStatus: '', recommendations: '', isSurgeryDay: false, isHeadOfDeptInspection: false, isDischarge: false, respiratoryRate: 0
            });
            return;
        }

        const isSurgery = dateStr === patientData.surgeryDate;
        const isDischarge = dateStr === patientData.endDate;
        const isBeforeSurgery = dateStr < patientData.surgeryDate;
        const isMonOrFri = isMondayOrFriday(dateStr);
        
        const dayVitals = generateVitals();
        let template: any = {};
        
        if (isBeforeSurgery) {
            template = preOp;
        } else if (isDischarge) {
            template = dischargeDay;
        } else if (dateStr === preDischargeDateStr) {
            template = postOpFinal;
        } else {
            template = postOpStandard;
        }
        
        const baseEntry: Partial<DiaryEntry> = {
          date: dateStr, 
          isWeekend: false, 
          isSurgeryDay: isSurgery, 
          isHeadOfDeptInspection: isMonOrFri, 
          isDischarge: isDischarge,
          respiratoryRate: dayVitals.respiratoryRate, 
          heartRate: dayVitals.heartRate, 
          bloodPressure: dayVitals.bloodPressure,
          temperature: parseFloat(dayVitals.temperature.toFixed(1)),
          complaints: template.complaints,
          objectiveStatus: template.objectiveStatus,
          localStatus: template.localStatus,
          recommendations: template.recommendations
        };

        if (isSurgery) {
          diaryEntries.push({
            ...baseEntry, 
            time: formatTime(8), 
            dayType: 'surgery_morning',
            complaints: preOp.complaints,
            objectiveStatus: preOp.objectiveStatus,
            localStatus: preOp.localStatus,
            recommendations: "Подготовка к операции. Премедикация."
          } as DiaryEntry);

          const ev = generateVitals();
          diaryEntries.push({
              ...baseEntry, 
              time: "18:00", 
              dayType: 'surgery_evening', 
              respiratoryRate: ev.respiratoryRate,
              heartRate: ev.heartRate, 
              bloodPressure: ev.bloodPressure,
              temperature: parseFloat((ev.temperature + 0.5).toFixed(1)), // чуть выше вечером
              complaints: "На боли в области раны, слабость.", 
              objectiveStatus: postOpStandard.objectiveStatus,
              localStatus: "Повязка сухая. Гемостаз стабильный.", 
              recommendations: postOpStandard.recommendations,
              isHeadOfDeptInspection: false
          } as DiaryEntry);
        } else {
            diaryEntries.push({ ...baseEntry, time: formatTime(9), dayType: 'regular' } as DiaryEntry);
        }
      });
      
      await generateDocx(patientData, diaryEntries);
    } catch (error) {
      alert("Ошибка генерации. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#1d1d1f] font-sans flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-8">
        <header className="mb-8 border-b pb-4">
            <h1 className="text-3xl font-bold text-[#2E74B5] tracking-tight">MedDiary GenAI</h1>
            <p className="text-sm text-slate-500">Генератор врачебных дневников по стандартам РФ</p>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-3">
            <PatientForm data={patientData} onChange={setPatientData} />
          </div>
          <div className="md:col-span-1">
             <ActionPanel onSubmit={handleGenerate} loading={loading} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
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

  // Load from local storage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('medDiaryPatientData');
    if (savedData) {
      try {
        setPatientData(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('medDiaryPatientData', JSON.stringify(patientData));
  }, [patientData]);

  const handleGenerate = async () => {
    // 1. Basic Validation
    if (!patientData.fullName || !patientData.startDate || !patientData.endDate || !patientData.diagnosis) {
      alert("Пожалуйста, заполните основные поля (ФИО, Даты, Диагноз).");
      return;
    }

    // 2. Date Logic Validation
    const start = new Date(patientData.startDate);
    const end = new Date(patientData.endDate);
    const surgery = patientData.surgeryDate ? new Date(patientData.surgeryDate) : null;

    if (start > end) {
      alert("Ошибка: Дата поступления не может быть позже даты выписки.");
      return;
    }

    if (surgery) {
      if (surgery < start || surgery > end) {
        alert("Ошибка: Дата операции должна находиться в интервале между поступлением и выпиской.");
        return;
      }
    } else {
        alert("Пожалуйста, укажите дату операции.");
        return;
    }

    setLoading(true);
    try {
      const generatedTemplates = await generateDiaryText(patientData);
      if (!generatedTemplates) {
        throw new Error("AI не вернул данные.");
      }
      
      const { preOp, postOpStandard, postOpFinal } = generatedTemplates;
      
      const dateRange = getDatesInRange(patientData.startDate, patientData.endDate);
      const diaryEntries: DiaryEntry[] = [];

      const endDateObj = new Date(patientData.endDate);
      const preDischargeDateObj = new Date(endDateObj);
      preDischargeDateObj.setDate(endDateObj.getDate() - 1); 
      
      const preDischargeDateStr = preDischargeDateObj.toISOString().split('T')[0];

      dateRange.forEach((dateStr) => {
        const isWeekEndDay = isWeekend(dateStr);
        if(isWeekEndDay) {
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
        } else {
            if (dateStr >= preDischargeDateStr) {
                template = postOpFinal;
            } else {
                template = postOpStandard;
            }
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
          objectiveStatus: template.objectiveStatus || "Общее состояние удовлетворительное. Сознание ясное.",
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
            recommendations: "Подготовка к операции. Премедикация по назначению анестезиолога.",
          } as DiaryEntry);

          const eveningVitals = generateVitals();
          diaryEntries.push({
              ...baseEntry, 
              time: "18:00", 
              dayType: 'surgery_evening', 
              respiratoryRate: eveningVitals.respiratoryRate,
              heartRate: eveningVitals.heartRate, 
              bloodPressure: eveningVitals.bloodPressure,
              temperature: parseFloat(eveningVitals.temperature.toFixed(1)),
              complaints: "На боли в области послеоперационной раны, слабость.", 
              objectiveStatus: postOpStandard.objectiveStatus,
              localStatus: "Повязка сухая, чистая. Отек умеренный. Кровотечения нет.", 
              recommendations: postOpStandard.recommendations,
              isHeadOfDeptInspection: false
          } as DiaryEntry);
        } else {
            diaryEntries.push({ ...baseEntry, time: formatTime(9), dayType: 'regular' } as DiaryEntry);
        }
      });
      
      await generateDocx(patientData, diaryEntries);
      
    } catch (error) {
      console.error(error);
      alert("Ошибка: " + (error instanceof Error ? error.message : "Неизвестная ошибка"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f] font-sans flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <header className="mb-4">
            <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">MedDiary GenAI</h1>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          <div className="md:col-span-3">
            <PatientForm 
                data={patientData} 
                onChange={setPatientData} 
            />
          </div>
          <div className="md:col-span-1 sticky top-6">
             <ActionPanel
                onSubmit={handleGenerate}
                loading={loading}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
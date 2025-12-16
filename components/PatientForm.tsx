import React from 'react';
import { PatientData } from '../types';

interface Props {
  data: PatientData;
  onChange: (data: PatientData) => void;
}

const InputField: React.FC<{ 
    label: string; 
    name: string; 
    value: string; 
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void; 
    type?: string; 
    placeholder?: string;
    className?: string;
    rows?: number;
    options?: {value: string, label: string}[];
}> = ({ label, name, value, onChange, type = "text", placeholder, className, rows, options }) => {
    
    // Стиль полей ввода: серый фон, без границ, мягкое скругление
    const baseClasses = "w-full bg-[#F2F2F7] border-0 rounded-lg px-3 py-2.5 text-[14px] text-[#1d1d1f] placeholder-[#86868b] focus:ring-2 focus:ring-[#0071e3]/30 transition-all duration-200 outline-none";

    return (
        <div className={className}>
            <label className="block text-[12px] font-semibold text-[#86868b] mb-1.5 pl-1">
                {label}
            </label>
            {options ? (
                <div className="relative">
                    <select
                        name={name}
                        value={value}
                        onChange={onChange}
                        className={`${baseClasses} appearance-none cursor-pointer`}
                    >
                        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
            ) : rows ? (
                <textarea
                    name={name}
                    value={value}
                    onChange={onChange}
                    rows={rows}
                    placeholder={placeholder}
                    className={`${baseClasses} resize-none leading-relaxed`}
                />
            ) : (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={baseClasses}
                />
            )}
        </div>
    );
};

const PatientForm: React.FC<Props> = ({ data, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  return (
    <div className="space-y-4">
      
      {/* Basic Info Row */}
      <div className="grid grid-cols-12 gap-3">
          <InputField 
            label="Ф.И.О. Пациента" 
            name="fullName" 
            value={data.fullName} 
            onChange={handleChange} 
            placeholder="Иванов Иван Иванович"
            className="col-span-9"
          />
          <InputField 
            label="Пол" 
            name="gender" 
            value={data.gender} 
            onChange={handleChange} 
            className="col-span-3"
            options={[
                { value: 'male', label: 'Муж' },
                { value: 'female', label: 'Жен' }
            ]}
          />
      </div>

      {/* Dates Row */}
      <div className="grid grid-cols-3 gap-3">
        <InputField 
            label="Поступление" 
            name="startDate" 
            value={data.startDate} 
            onChange={handleChange} 
            type="date"
            className="col-span-1"
        />
        <InputField 
            label="Операция" 
            name="surgeryDate" 
            value={data.surgeryDate} 
            onChange={handleChange} 
            type="date"
            className="col-span-1"
        />
        <InputField 
            label="Выписка" 
            name="endDate" 
            value={data.endDate} 
            onChange={handleChange} 
            type="date"
            className="col-span-1"
        />
      </div>

      {/* Diagnosis */}
      <div>
        <InputField 
            label="Клинический диагноз" 
            name="diagnosis" 
            value={data.diagnosis} 
            onChange={handleChange} 
            rows={3}
            placeholder="Введите основной диагноз..."
            className="w-full"
        />
      </div>

      {/* Doctors Row */}
      <div className="grid grid-cols-2 gap-3">
        <InputField 
            label="Лечащий врач" 
            name="doctorName" 
            value={data.doctorName} 
            onChange={handleChange} 
            placeholder="Фамилия И.О."
            className="col-span-1"
        />
        <InputField 
            label="Зав. отделением" 
            name="headOfDeptName" 
            value={data.headOfDeptName} 
            onChange={handleChange} 
            placeholder="Фамилия И.О."
            className="col-span-1"
        />
      </div>
    </div>
  );
};

export default PatientForm;
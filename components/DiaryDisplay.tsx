import React from 'react';
import { BookText } from 'lucide-react';

interface Props {
  content: string;
  loading: boolean;
}

const DiaryDisplay: React.FC<Props> = ({ content, loading }) => {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <BookText className="w-7 h-7 text-blue-600" />
        Результат Генерации
      </h2>
      <div className="flex-grow bg-slate-50 p-4 rounded-lg border border-slate-200 min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-500">
              <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Генерация текста...</span>
            </div>
          </div>
        ) : (
          <textarea
            readOnly
            value={content || "Здесь появится сгенерированный текст дневника..."}
            className="w-full h-full bg-transparent border-none focus:ring-0 resize-none text-sm text-slate-800 whitespace-pre-wrap"
            placeholder="Здесь появится сгенерированный текст дневника..."
          />
        )}
      </div>
    </div>
  );
};

export default DiaryDisplay;

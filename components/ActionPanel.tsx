import React from 'react';

interface Props {
  onSubmit: () => void;
  loading: boolean;
}

const ActionPanel: React.FC<Props> = ({ onSubmit, loading }) => {
  return (
    <div className="bg-[#F2F2F7] p-4 rounded-xl flex flex-col items-center">
        <button
          onClick={onSubmit}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-[14px] transition-all duration-200 flex items-center justify-center
            ${loading 
              ? 'bg-[#d1d1d6] text-[#86868b] cursor-not-allowed' 
              : 'bg-[#0071e3] hover:bg-[#0077ED] text-white active:scale-[0.98]'
            }`}
        >
          {loading ? (
            <span>Создание...</span>
          ) : (
            <span>Скачать дневник</span>
          )}
        </button>
    </div>
  );
};

export default ActionPanel;
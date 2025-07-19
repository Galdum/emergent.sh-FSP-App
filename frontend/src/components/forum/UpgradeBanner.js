import React from 'react';
import { Crown, ArrowRight } from 'lucide-react';

const UpgradeBanner = ({ onUpgrade }) => {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white bg-opacity-20 p-2 rounded-full">
            <Crown size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">
              Upgrade la Premium pentru acces complet
            </h3>
            <p className="text-sm text-purple-100">
              Deblochează forumul exclusiv și toate funcționalitățile avansate
            </p>
          </div>
        </div>
        
        <button
          onClick={onUpgrade}
          className="flex items-center space-x-2 bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors font-semibold"
        >
          <span>Upgrade acum</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default UpgradeBanner;
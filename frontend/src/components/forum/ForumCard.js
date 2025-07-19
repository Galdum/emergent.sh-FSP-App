import React from 'react';
import { MessageSquare, Users, Clock, TrendingUp } from 'lucide-react';

const ForumCard = ({ forum, onNavigate }) => {
  const formatDate = (date) => {
    if (!date) return 'Niciodată';
    return new Date(date).toLocaleDateString('ro-RO');
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onNavigate(`/premium/${forum.slug}`)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {forum.title}
          </h3>
          <p className="text-gray-600 mb-4 line-clamp-2">
            {forum.description}
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <MessageSquare size={16} />
              <span>{forum.thread_count || 0} discuții</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Clock size={16} />
              <span>Ultima activitate: {formatDate(forum.recent_activity)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center bg-orange-50 rounded-lg p-3 ml-4">
          <TrendingUp className="text-orange-500 mb-1" size={20} />
          <span className="text-sm font-medium text-gray-700">
            {forum.thread_count > 0 ? 'Activ' : 'Nou'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForumCard;
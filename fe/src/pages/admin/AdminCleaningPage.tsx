import React from 'react';
import { CleaningManagementView } from '../../components/cleaning/CleaningManagementView';
import { ClipboardCheck } from 'lucide-react';

export const AdminCleaningPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="text-orange-500 w-7 h-7" /> Cleaning Checklist Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Configure daily cleaning tasks and track historical completion logs for gym cleaners</p>
        </div>
      </div>

      <CleaningManagementView />
    </div>
  );
};

export default AdminCleaningPage;

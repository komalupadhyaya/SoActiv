import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { BulkUploadResult } from '../../hooks/useEnquiry';

interface UploadResultsReportProps {
  isOpen: boolean;
  onClose: () => void;
  result: BulkUploadResult;
}

export const UploadResultsReport: React.FC<UploadResultsReportProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  const [showSuccessful, setShowSuccessful] = useState(false);
  const [showFailed, setShowFailed] = useState(true);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Results" size="xl">
      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Entries</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {result.summary.total}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
            <p className="text-xs text-green-600 dark:text-green-400">Successful</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-300">
              {result.summary.successful}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4">
            <p className="text-xs text-red-600 dark:text-red-400">Failed</p>
            <p className="text-2xl font-bold text-red-900 dark:text-red-300">
              {result.summary.failed}
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">Duplicates</p>
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
              {result.summary.duplicates}
            </p>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Success Rate
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {result.summary.total > 0
                ? Math.round((result.summary.successful / result.summary.total) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  result.summary.total > 0
                    ? (result.summary.successful / result.summary.total) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Successful Entries */}
        {result.details.successful.length > 0 && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowSuccessful(!showSuccessful)}
              className="w-full flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-900 dark:text-green-300">
                  Successful Entries ({result.details.successful.length})
                </span>
              </div>
              {showSuccessful ? (
                <ChevronUp size={20} className="text-green-600 dark:text-green-400" />
              ) : (
                <ChevronDown size={20} className="text-green-600 dark:text-green-400" />
              )}
            </button>

            {showSuccessful && (
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                        Row
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                        Email
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                        Phone
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {result.details.successful.map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {entry.row}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {entry.name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                          {entry.email || '—'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                          {entry.phone}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Failed Entries */}
        {result.details.failed.length > 0 && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowFailed(!showFailed)}
              className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <XCircle size={20} className="text-red-600 dark:text-red-400" />
                <span className="font-medium text-red-900 dark:text-red-300">
                  Failed Entries ({result.details.failed.length})
                </span>
              </div>
              {showFailed ? (
                <ChevronUp size={20} className="text-red-600 dark:text-red-400" />
              ) : (
                <ChevronDown size={20} className="text-red-600 dark:text-red-400" />
              )}
            </button>

            {showFailed && (
              <div className="max-h-96 overflow-y-auto">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {result.details.failed.map((entry, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <AlertTriangle size={16} className="text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                              Row {entry.row}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                              {entry.reason}
                            </span>
                          </div>

                          {/* Data Preview */}
                          <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            <span className="font-medium">
                              {entry.data.name || 'No name'}
                            </span>
                            {entry.data.email && (
                              <span className="text-gray-500 dark:text-gray-400 ml-2">
                                ({entry.data.email})
                              </span>
                            )}
                          </div>

                          {/* Error Messages */}
                          <ul className="space-y-1">
                            {entry.errors.map((error, errorIndex) => (
                              <li
                                key={errorIndex}
                                className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1"
                              >
                                <span className="mt-0.5">•</span>
                                <span>{error}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};


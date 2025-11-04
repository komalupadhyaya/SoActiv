import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface UploadResult {
  success: boolean;
  message: string;
  summary: {
    total: number;
    successful: number;
    failed: number;
    duplicates: number;
  };
  details: {
    successful: Array<{
      row: number;
      fullName: string;
      email: string;
      [key: string]: any;
    }>;
    failed: Array<{
      row: number;
      data: any;
      reason: string;
      errors: string[];
    }>;
  };
}

interface UploadResultsReportProps {
  isOpen: boolean;
  onClose: () => void;
  result: UploadResult | null;
  type: 'client' | 'staff';
}

export const UploadResultsReport: React.FC<UploadResultsReportProps> = ({
  isOpen,
  onClose,
  result,
  type,
}) => {
  const [showSuccessful, setShowSuccessful] = useState(false);
  const [showFailed, setShowFailed] = useState(true);

  if (!result) return null;

  const successRate = result.summary.total > 0
    ? ((result.summary.successful / result.summary.total) * 100).toFixed(1)
    : '0';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bulk Upload Results - ${type === 'client' ? 'Clients' : 'Staff'}`}
      size="xl"
    >
      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">
              Total Entries
            </p>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-2">
              {result.summary.total}
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">
              Successful
            </p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-2">
              {result.summary.successful}
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase">
              Failed
            </p>
            <p className="text-3xl font-bold text-red-700 dark:text-red-300 mt-2">
              {result.summary.failed}
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <p className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase">
              Duplicates
            </p>
            <p className="text-3xl font-bold text-orange-700 dark:text-orange-300 mt-2">
              {result.summary.duplicates}
            </p>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Success Rate
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {successRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                Number(successRate) >= 80
                  ? 'bg-green-500'
                  : Number(successRate) >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>

        {/* Successful Entries */}
        {result.details.successful.length > 0 && (
          <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowSuccessful(!showSuccessful)}
              className="w-full flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-900 dark:text-green-100">
                  Successful Entries ({result.details.successful.length})
                </span>
              </div>
              {showSuccessful ? (
                <ChevronUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-green-600 dark:text-green-400" />
              )}
            </button>

            {showSuccessful && (
              <div className="p-4 bg-white dark:bg-gray-800 max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Row
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Email
                      </th>
                      {type === 'staff' && (
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Position
                        </th>
                      )}
                      {type === 'client' && (
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Phone
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {result.details.successful.map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                          {entry.row}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                          {entry.fullName}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                          {entry.email}
                        </td>
                        {type === 'staff' && (
                          <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                            {(entry as any).position}
                          </td>
                        )}
                        {type === 'client' && (
                          <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                            {(entry as any).contactNumber}
                          </td>
                        )}
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
          <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowFailed(!showFailed)}
              className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="font-medium text-red-900 dark:text-red-100">
                  Failed Entries ({result.details.failed.length})
                </span>
              </div>
              {showFailed ? (
                <ChevronUp className="h-5 w-5 text-red-600 dark:text-red-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </button>

            {showFailed && (
              <div className="p-4 bg-white dark:bg-gray-800 max-h-96 overflow-y-auto space-y-4">
                {result.details.failed.map((entry, index) => (
                  <div
                    key={index}
                    className="border dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Row {entry.row}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            entry.reason === 'Duplicate email' || entry.reason === 'Duplicate phone'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                              : entry.reason === 'Validation failed'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}
                        >
                          {entry.reason}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Errors:
                          </p>
                          <ul className="list-disc list-inside space-y-1">
                            {entry.errors.map((error, errorIndex) => (
                              <li
                                key={errorIndex}
                                className="text-xs text-red-600 dark:text-red-400"
                              >
                                {error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {entry.data && Object.keys(entry.data).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
                            View original data
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                            {JSON.stringify(entry.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};


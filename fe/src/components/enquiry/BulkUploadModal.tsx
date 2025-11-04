import React, { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, Download } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { BulkUploadResult } from '../../hooks/useEnquiry';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<BulkUploadResult | null>;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'csv' && fileExtension !== 'xml') {
      alert('Please select a CSV or XML file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
    setShowResults(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const result = await onUpload(selectedFile);
      if (result) {
        setUploadResult(result);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setShowResults(false);
    onClose();
  };

  const downloadSampleCSV = () => {
    const csvContent = `name,phone,email,source,status,comments,interests,budget,followUpDate
John Doe,+1234567890,john@example.com,website,new,Interested in premium membership,Weight training,500-1000,2025-12-01
Jane Smith,+1987654321,jane@example.com,referral,contacted,Follow up next week,Yoga and cardio,300-500,2025-12-05`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enquiries_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadSampleXML = () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<enquiries>
  <enquiry>
    <name>John Doe</name>
    <phone>+1234567890</phone>
    <email>john@example.com</email>
    <source>website</source>
    <status>new</status>
    <comments>Interested in premium membership</comments>
    <interests>Weight training</interests>
    <budget>500-1000</budget>
    <followUpDate>2025-12-01</followUpDate>
  </enquiry>
  <enquiry>
    <name>Jane Smith</name>
    <phone>+1987654321</phone>
    <email>jane@example.com</email>
    <source>referral</source>
    <status>contacted</status>
    <comments>Follow up next week</comments>
    <interests>Yoga and cardio</interests>
    <budget>300-500</budget>
    <followUpDate>2025-12-05</followUpDate>
  </enquiry>
</enquiries>`;

    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enquiries_sample.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Upload Enquiries" size="lg">
      <div className="p-6 space-y-6">
        {!showResults ? (
          <>
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Upload Instructions
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
                <li>Upload a CSV or XML file containing enquiry data</li>
                <li>Maximum file size: 10MB</li>
                <li>Required fields: name, phone, source</li>
                <li>Optional fields: email, status, comments, interests, budget, followUpDate</li>
                <li>Valid sources: website, social-media, referral, walk-in, advertisement, other</li>
                <li>Valid statuses: new, contacted, interested, converted, lost</li>
                <li>Duplicate emails will be automatically skipped</li>
              </ul>
            </div>

            {/* Sample Download */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadSampleCSV}
                className="flex-1"
              >
                <Download size={16} className="mr-2" />
                Download CSV Sample
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadSampleXML}
                className="flex-1"
              >
                <Download size={16} className="mr-2" />
                Download XML Sample
              </Button>
            </div>

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-orange-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xml"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <FileText size={48} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X size={16} className="mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <Upload size={48} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Drag and drop your file here
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      or click to browse
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select File
                  </Button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                isLoading={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </>
        ) : (
          uploadResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {uploadResult.summary.total}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                  <p className="text-xs text-green-600 dark:text-green-400">Successful</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                    {uploadResult.summary.successful}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4">
                  <p className="text-xs text-red-600 dark:text-red-400">Failed</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-300">
                    {uploadResult.summary.failed}
                  </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Duplicates</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                    {uploadResult.summary.duplicates}
                  </p>
                </div>
              </div>

              {/* View results button moved to top */}
              <Button variant="primary" onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          )
        )}
      </div>
    </Modal>
  );
};


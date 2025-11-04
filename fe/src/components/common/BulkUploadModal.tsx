import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<any>;
  type: 'client' | 'staff';
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  type,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<any>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

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
    setUploadSummary(null);
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
      setUploadSummary(result.summary);
      
      // If upload was successful, we'll show summary briefly then close
      if (result.success && result.summary.failed === 0) {
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadSummary(null);
    setIsDragging(false);
    setIsUploading(false);
    onClose();
  };

  const downloadSampleCSV = () => {
    let csvContent = '';
    
    if (type === 'client') {
      csvContent = `fullName,email,contactNumber,gender,startDate,endDate,packagePrice,plan,timing,status,hasPersonalTraining,personalTrainingDurationWeeks,personalTrainingPrice,dateOfBirth,address,emergencyContactName,emergencyContactNumber,emergencyContactRelation
John Doe,john.doe@example.com,+1234567890,male,2025-01-01,2025-12-31,5000,premium,Morning (6AM-10AM),active,true,12,3000,1990-05-15,123 Main St,Jane Doe,+1234567891,spouse
Sarah Smith,sarah.smith@example.com,+1987654321,female,2025-01-15,2025-07-15,3000,basic,Evening (5PM-9PM),active,false,,,1995-08-20,456 Oak Ave,Mike Smith,+1987654322,sibling`;
    } else {
      csvContent = `fullName,position,email,contactNumber,joiningDate,salary,status,notificationSMS,notificationEmail,notificationPush,notificationWhatsApp
John Trainer,Personal Trainer,john.trainer@example.com,+1234567890,2024-01-15,45000,active,true,true,true,true
Sarah Manager,Gym Manager,sarah.manager@example.com,+1987654321,2023-06-01,55000,active,true,true,true,true
Mike Receptionist,Receptionist,mike.reception@example.com,+1122334455,2024-03-10,30000,active,true,true,false,true`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample_${type}s.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadSampleXML = () => {
    let xmlContent = '';
    
    if (type === 'client') {
      xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<clients>
  <client>
    <fullName>John Doe</fullName>
    <email>john.doe@example.com</email>
    <contactNumber>+1234567890</contactNumber>
    <gender>male</gender>
    <startDate>2025-01-01</startDate>
    <endDate>2025-12-31</endDate>
    <packagePrice>5000</packagePrice>
    <plan>premium</plan>
    <timing>Morning (6AM-10AM)</timing>
    <status>active</status>
    <hasPersonalTraining>true</hasPersonalTraining>
    <personalTrainingDurationWeeks>12</personalTrainingDurationWeeks>
    <personalTrainingPrice>3000</personalTrainingPrice>
    <dateOfBirth>1990-05-15</dateOfBirth>
    <address>123 Main St</address>
    <emergencyContactName>Jane Doe</emergencyContactName>
    <emergencyContactNumber>+1234567891</emergencyContactNumber>
    <emergencyContactRelation>spouse</emergencyContactRelation>
  </client>
</clients>`;
    } else {
      xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<staff>
  <staff>
    <fullName>John Trainer</fullName>
    <position>Personal Trainer</position>
    <email>john.trainer@example.com</email>
    <contactNumber>+1234567890</contactNumber>
    <joiningDate>2024-01-15</joiningDate>
    <salary>45000</salary>
    <status>active</status>
    <notificationSMS>true</notificationSMS>
    <notificationEmail>true</notificationEmail>
    <notificationPush>true</notificationPush>
    <notificationWhatsApp>true</notificationWhatsApp>
  </staff>
</staff>`;
    }

    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample_${type}s.xml`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Bulk Upload ${type === 'client' ? 'Clients' : 'Staff'}`} size="lg">
      <div className="p-6 space-y-6">
        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Drag and drop your CSV or XML file here, or
          </p>
          <label className="cursor-pointer">
            <span className="text-blue-600 dark:text-blue-400 hover:underline">
              browse to upload
            </span>
            <input
              type="file"
              className="hidden"
              accept=".csv,.xml"
              onChange={handleFileInputChange}
              disabled={isUploading}
            />
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Maximum file size: 10MB
          </p>
        </div>

        {/* Selected File */}
        {selectedFile && !uploadSummary && (
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={isUploading}
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Upload Summary */}
        {uploadSummary && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <CheckCircle size={20} />
              <span className="font-medium">Upload Complete!</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {uploadSummary.total}
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Successful</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {uploadSummary.successful}
                </p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Failed</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {uploadSummary.failed}
                </p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Duplicates</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {uploadSummary.duplicates}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sample Downloads */}
        <div className="border-t dark:border-gray-700 pt-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Download Sample Files:
          </p>
          <div className="flex space-x-3">
            <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
              <Download size={16} className="mr-2" />
              CSV Sample
            </Button>
            <Button variant="outline" size="sm" onClick={downloadSampleXML}>
              <Download size={16} className="mr-2" />
              XML Sample
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-2">Required Fields for {type === 'client' ? 'Clients' : 'Staff'}:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                {type === 'client' ? (
                  <>
                    <li>fullName, email, contactNumber, gender</li>
                    <li>startDate, endDate, packagePrice, plan, timing</li>
                    <li>Email and phone must be unique</li>
                  </>
                ) : (
                  <>
                    <li>fullName, position, email, contactNumber</li>
                    <li>joiningDate, salary</li>
                    <li>Email and phone must be unique</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="min-w-[100px]"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};


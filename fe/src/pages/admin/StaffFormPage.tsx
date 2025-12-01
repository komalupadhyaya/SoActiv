import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StaffRegistrationForm } from '../../components/forms/newStaffForm';
import { useStaff } from '../../hooks/useStaff';

export const StaffFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { staff, createStaff, updateStaff, loading } = useStaff();
  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!id;

  // Load staff data if editing
  useEffect(() => {
    if (isEditMode && staff.length > 0) {
      const staffMember = staff.find((s) => s._id === id);
      if (staffMember) {
        setInitialData(staffMember);
      }
    }
  }, [id, staff, isEditMode]);

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    let result;

    if (isEditMode && id) {
      // Update existing staff
      result = await updateStaff(id, formData);
    } else {
      // Create new staff
      result = await createStaff(formData);
    }

    setIsLoading(false);

    if (result.success) {
      // Navigate back to staff list
      navigate('/admin/staff');
    }

    return result;
  };

  const handleCancel = () => {
    navigate('/admin/staff');
  };

  if (loading && isEditMode && !initialData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Staff
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isEditMode
              ? 'Update staff member information and details'
              : 'Register a new staff member and set up their profile'}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Staff Information
          </h2>
        </CardHeader>
        <CardContent>
          <StaffRegistrationForm
            onClose={handleCancel}
            onSubmit={handleSubmit}
            initialData={isEditMode ? initialData : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
};


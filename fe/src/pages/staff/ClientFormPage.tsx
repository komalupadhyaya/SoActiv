import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ClientRegistrationForm } from '../../components/forms/ClientRegistrationForm';
import { useClient } from '../../hooks/useClient';

export const ClientFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { clients, createClient, updateClient, loading } = useClient();
  const [initialData, setInitialData] = useState<any>(null);

  const isEditMode = !!id;

  // Load client data if editing
  useEffect(() => {
    if (isEditMode && clients.length > 0) {
      const client = clients.find((c) => c._id === id);
      if (client) {
        setInitialData(client);
      }
    }
  }, [id, clients, isEditMode]);

  const handleSubmit = async (formData: any) => {
    let result;

    if (isEditMode && id) {
      result = await updateClient(id, formData);
    } else {
      result = await createClient(formData);
    }

    if (result.success) {
      navigate('/staff/members');
    }

    return result;
  };

  const handleCancel = () => {
    navigate('/staff/members');
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
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Members
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Member' : 'Add New Member'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isEditMode
              ? 'Update member information and membership details'
              : 'Register a new gym member and set up their membership'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Member Information
          </h2>
        </CardHeader>
        <CardContent>
          <ClientRegistrationForm
            onClose={handleCancel}
            onSubmit={handleSubmit}
            initialData={isEditMode ? initialData : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientFormPage;

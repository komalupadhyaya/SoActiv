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
      // Update existing client
      result = await updateClient(id, formData);
    } else {
      // Create new client
      result = await createClient(formData);
    }

    if (result.success) {
      // Navigate back to client list
      navigate('/admin/clients');
    }
    // Error toast is handled in useClient hook

    return result;
  };

  const handleCancel = () => {
    navigate('/admin/clients');
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
          Back to Clients
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Client' : 'Add New Client'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isEditMode
              ? 'Update client information and membership details'
              : 'Register a new client and set up their membership'}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Client Information
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


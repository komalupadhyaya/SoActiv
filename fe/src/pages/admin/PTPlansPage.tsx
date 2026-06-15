import React, { useEffect, useState } from 'react';
import { usePT, PTPlan } from '../../hooks/usePT';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Plus, Edit, Archive, CheckCircle } from 'lucide-react';
import { PTPlanFormModal } from '../../components/pt/PTPlanFormModal';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export const PTPlansPage: React.FC = () => {
    const { plans, loading, fetchPlans, createPlan, updatePlan, togglePlanStatus } = usePT();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<PTPlan | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const { addToast } = useToast();

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    const handleCreateClick = () => {
        if (user?.gymFeatures?.pt === false) {
            addToast('Personal Training features have been disabled by platform administration.', 'error');
            return;
        }
        setSelectedPlan(undefined);
        setIsModalOpen(true);
    };

    const handleEditClick = (plan: PTPlan) => {
        if (user?.gymFeatures?.pt === false) {
            addToast('Personal Training features have been disabled by platform administration.', 'error');
            return;
        }
        setSelectedPlan(plan);
        setIsModalOpen(true);
    };

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        let success = false;
        if (selectedPlan) {
            success = await updatePlan(selectedPlan._id, data);
        } else {
            success = await createPlan(data);
        }
        setIsSubmitting(false);
        if (success) {
            setIsModalOpen(false);
        }
    };

    const handleToggleStatus = async (id: string) => {
        if (user?.gymFeatures?.pt === false) {
            addToast('Personal Training features have been disabled by platform administration.', 'error');
            return;
        }
        await togglePlanStatus(id);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PT Plans</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage Personal Training packages and pricing</p>
                </div>
                <Button onClick={handleCreateClick}>
                    <Plus size={16} className="mr-2" />
                    Create Plan
                </Button>
            </div>

            {loading && plans.length === 0 ? (
                <div className="text-center py-10">Loading plans...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <Card key={plan._id} className={`border ${plan.isActive ? 'border-gray-200 dark:border-gray-700' : 'border-red-200 dark:border-red-900/50 opacity-75'}`}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                    <Badge className={plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                        {plan.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Sessions</span>
                                        <span className="font-medium dark:text-gray-200">{plan.totalSessions}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Validity</span>
                                        <span className="font-medium dark:text-gray-200">{plan.validityDays} Days</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Price</span>
                                        <span className="font-bold text-lg text-orange-600 dark:text-orange-400">₹{plan.price}</span>
                                    </div>
                                    {plan.description && (
                                        <p className="text-xs text-gray-400 mt-2 line-clamp-2">{plan.description}</p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditClick(plan)}>
                                        <Edit size={14} className="mr-1" /> Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className={plan.isActive ? "text-red-500 hover:bg-red-50" : "text-green-500 hover:bg-green-50"}
                                        onClick={() => handleToggleStatus(plan._id)}
                                    >
                                        {plan.isActive ? <Archive size={14} /> : <CheckCircle size={14} />}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {plans.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg dashed border-2 border-gray-200">
                            <p className="text-gray-500">No PT plans found. Create one to get started.</p>
                        </div>
                    )}
                </div>
            )}

            <PTPlanFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={selectedPlan}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

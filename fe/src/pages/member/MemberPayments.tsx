import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useClient } from '../../hooks/useClient';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { CreditCard, Award, Printer, ShieldAlert } from 'lucide-react';

export const MemberPayments: React.FC = () => {
    const { user } = useAuth();
    const { clients, fetchClients, loading: loadingClient } = useClient();
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    // Find current member's client record
    const memberClient = clients.find(
        (c) =>
            c.email?.toLowerCase() === user?.email?.toLowerCase() ||
            c.userId === user?.id ||
            c.userId === user?._id
    );

    // Dynamic list of transactions based on client registration data
    const invoicesList = useMemo(() => {
        if (!memberClient) return [];
        const items = [];
        const baseTxnId = `TXN-SOAC-${memberClient._id?.substring(0, 6).toUpperCase() || 'E8A9'}`;

        // 1. Membership Invoice
        items.push({
            id: `${baseTxnId}-01`,
            date: memberClient.startDate ? new Date(memberClient.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN'),
            description: `${memberClient.plan ? memberClient.plan.charAt(0).toUpperCase() + memberClient.plan.slice(1) : 'Premium'} Membership Plan`,
            amount: memberClient.packagePrice || 5000,
            status: 'Paid',
            type: 'Membership Registration'
        });

        // 2. Personal Training Invoice (if active)
        if (memberClient.hasPersonalTraining && memberClient.personalTrainingPrice) {
            items.push({
                id: `${baseTxnId}-02`,
                date: memberClient.startDate ? new Date(memberClient.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN'),
                description: `Personal Trainer Package (${memberClient.personalTrainingDurationWeeks || 12} Weeks)`,
                amount: memberClient.personalTrainingPrice,
                status: 'Paid',
                type: 'Personal Training Service'
            });
        }
        return items;
    }, [memberClient]);

    return (
        <div className="space-y-6 py-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment & Billing History</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        View your subscription payments, access official invoices, and manage pending dues.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 px-4 py-2.5 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600">
                        <CreditCard className="w-4.5 h-4.5" />
                    </div>
                    <div>
                        <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold uppercase tracking-wider">Account Status</p>
                        <p className="text-sm font-bold text-green-800 dark:text-green-300">₹0.00 Outstanding Dues</p>
                    </div>
                </div>
            </div>

            {loadingClient ? (
                <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
            ) : !memberClient ? (
                <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                        <p className="font-semibold text-gray-700 dark:text-gray-300">No Membership Profile Active</p>
                        <p className="text-sm text-gray-500 mt-1">Please reach out to front desk or gym support to complete your onboarding details.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                            <CreditCard className="w-5 h-5 mr-2 text-orange-500" />
                            Previous Transactions
                        </h2>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {invoicesList.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">No previous payments found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                                            <th className="py-3 px-4">Date</th>
                                            <th className="py-3 px-4">Transaction ID</th>
                                            <th className="py-3 px-4">Description</th>
                                            <th className="py-3 px-4 text-right">Amount</th>
                                            <th className="py-3 px-4 text-center">Status</th>
                                            <th className="py-3 px-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoicesList.map((inv) => (
                                            <tr key={inv.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">{inv.date}</td>
                                                <td className="py-4 px-4 text-gray-500 dark:text-gray-400 font-mono text-xs">{inv.id}</td>
                                                <td className="py-4 px-4 text-gray-700 dark:text-gray-300">{inv.description}</td>
                                                <td className="py-4 px-4 text-right text-gray-900 dark:text-white font-semibold">₹{inv.amount.toLocaleString('en-IN')}.00</td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <button
                                                        onClick={() => setSelectedInvoice(inv)}
                                                        className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 hover:underline transition-all"
                                                    >
                                                        View Invoice
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Beautiful Premium Invoice Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 transform transition-all">
                        {/* Header Box */}
                        <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">SoActiv Gym Receipt</h3>
                                <p className="text-xs opacity-90 mt-1">Invoice ID: {selectedInvoice.id}</p>
                            </div>
                            <div className="text-right">
                                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {selectedInvoice.status}
                                </span>
                            </div>
                        </div>

                        {/* Invoice Contents */}
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start text-sm">
                                <div>
                                    <h4 className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Gym Address</h4>
                                    <p className="text-gray-900 dark:text-white mt-1.5 font-semibold">SoActiv Headquarters</p>
                                    <p className="text-gray-500 dark:text-gray-400">102 Active Ring Road, Sector 4</p>
                                    <p className="text-gray-500 dark:text-gray-400">Bangalore, KA, India</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">GSTIN: 29AAAAA1111A1Z1</p>
                                </div>
                                <div className="text-right">
                                    <h4 className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Billed To</h4>
                                    <p className="text-gray-900 dark:text-white mt-1.5 font-semibold">{user?.name}</p>
                                    <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                                    <p className="text-gray-500 dark:text-gray-400">{memberClient?.contactNumber || '--'}</p>
                                </div>
                            </div>

                            {/* Details Table */}
                            <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-300 font-semibold border-b border-gray-100 dark:border-gray-700">
                                            <th className="py-3 px-4">Item Details</th>
                                            <th className="py-3 px-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-gray-50 dark:border-gray-800/50 text-gray-700 dark:text-gray-300">
                                            <td className="py-4 px-4">
                                                <p className="font-semibold text-gray-900 dark:text-white">{selectedInvoice.description}</p>
                                                <p className="text-xs text-gray-400 mt-1">{selectedInvoice.type}</p>
                                            </td>
                                            <td className="py-4 px-4 text-right font-semibold text-gray-900 dark:text-white">
                                                ₹{(selectedInvoice.amount * 0.82).toFixed(2)}
                                            </td>
                                        </tr>
                                        <tr className="text-gray-500 dark:text-gray-400 text-xs">
                                            <td className="py-2 px-4 text-right font-medium">CGST (9%)</td>
                                            <td className="py-2 px-4 text-right">₹{(selectedInvoice.amount * 0.09).toFixed(2)}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs">
                                            <td className="py-2 px-4 text-right font-medium">SGST (9%)</td>
                                            <td className="py-2 px-4 text-right">₹{(selectedInvoice.amount * 0.09).toFixed(2)}</td>
                                        </tr>
                                        <tr className="bg-orange-50/50 dark:bg-orange-950/20 text-gray-900 dark:text-white font-bold text-base">
                                            <td className="py-4 px-4 text-right">Grand Total (Inclusive of GST)</td>
                                            <td className="py-4 px-4 text-right text-orange-600 dark:text-orange-400">
                                                ₹{selectedInvoice.amount.toLocaleString('en-IN')}.00
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-between items-center text-xs text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <p>Transaction Reference: <span className="font-mono text-gray-600 dark:text-gray-300 font-semibold">{selectedInvoice.id}</span></p>
                                <p>Date: {selectedInvoice.date}</p>
                            </div>
                        </div>

                        {/* Footer Controls */}
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg text-sm font-semibold transition-all"
                            >
                                Print Receipt
                            </button>
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

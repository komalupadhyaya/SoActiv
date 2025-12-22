import { NavLink } from 'react-router-dom';
import {
    Shield,
    LayoutDashboard,
    Building2,
    Users,
    CreditCard,
    LogOut,
    Inbox,
    X
} from 'lucide-react';

interface SuperAdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
    user: any;
}

export function SuperAdminSidebar({ isOpen, onClose, onLogout, user }: SuperAdminSidebarProps) {
    return (
        <>
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-40 h-screen transition-transform duration-300 ease-in-out bg-gradient-to-b from-indigo-900 to-purple-900 w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'
                    }`}
            >
                <div className="h-full flex flex-col px-3 py-4">
                    {/* Header / Logo */}
                    <div className="flex items-center justify-between mb-8 px-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-lg">Super Admin</h2>
                                <p className="text-indigo-200 text-xs">Platform Control</p>
                            </div>
                        </div>
                        {/* Mobile Close Button */}
                        <button
                            onClick={onClose}
                            className="xl:hidden text-white/70 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="mb-6 px-3 py-3 bg-white/10 rounded-lg">
                        <p className="text-white font-medium text-sm truncate">{user?.name || 'Super Admin'}</p>
                        <p className="text-indigo-200 text-xs truncate">{user?.email}</p>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-2 flex-1 overflow-y-auto">
                        <NavLink
                            to="/super-admin/dashboard"
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 text-white hover:bg-white/10 rounded-lg transition-colors ${isActive ? 'bg-white/20' : ''
                                }`
                            }
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            <span className="font-medium">Dashboard</span>
                        </NavLink>

                        <NavLink
                            to="/super-admin/gyms"
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 text-white hover:bg-white/10 rounded-lg transition-colors ${isActive ? 'bg-white/20' : ''
                                }`
                            }
                        >
                            <Building2 className="w-5 h-5" />
                            <span className="font-medium">Gyms</span>
                        </NavLink>

                        <NavLink
                            to="/super-admin/admins"
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 text-white hover:bg-white/10 rounded-lg transition-colors ${isActive ? 'bg-white/20' : ''
                                }`
                            }
                        >
                            <Users className="w-5 h-5" />
                            <span className="font-medium">Admins</span>
                        </NavLink>

                        <NavLink
                            to="/super-admin/plans"
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 text-white hover:bg-white/10 rounded-lg transition-colors ${isActive ? 'bg-white/20' : ''
                                }`
                            }
                        >
                            <CreditCard className="w-5 h-5" />
                            <span className="font-medium">Plans</span>
                        </NavLink>

                        <NavLink
                            to="/super-admin/contacts"
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 text-white hover:bg-white/10 rounded-lg transition-colors ${isActive ? 'bg-white/20' : ''
                                }`
                            }
                        >
                            <Inbox className="w-5 h-5" />
                            <span className="font-medium">Support Inbox</span>
                        </NavLink>
                    </nav>

                    {/* Logout */}
                    <div className="mt-auto pt-4 border-t border-white/10">
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-white hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

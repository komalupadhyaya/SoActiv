import { NavLink } from 'react-router-dom';
import {
    Shield,
    LayoutDashboard,
    Building2,
    Users,
    CreditCard,
    LogOut,
    Inbox,
    Megaphone,
    X,
    Menu,
    ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';

interface SuperAdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
    user: any;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export function SuperAdminSidebar({
    isOpen,
    onClose,
    onLogout,
    user,
    isCollapsed = false,
    onToggleCollapse,
}: SuperAdminSidebarProps) {
    const navItems = [
        { name: 'Dashboard', to: '/super-admin/dashboard', icon: LayoutDashboard },
        { name: 'Gyms', to: '/super-admin/gyms', icon: Building2 },
        { name: 'Admins', to: '/super-admin/admins', icon: Users },
        { name: 'Plans', to: '/super-admin/plans', icon: CreditCard },
        { name: 'Support Inbox', to: '/super-admin/contacts', icon: Inbox },
        { name: 'Announcements', to: '/super-admin/announcements', icon: Megaphone },
    ];

    return (
        <>
            {/* Sidebar */}
            <aside
                className={clsx(
                    'fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out bg-gradient-to-b from-indigo-900 to-purple-900',
                    isOpen
                        ? 'w-64 translate-x-0'
                        : isCollapsed
                        ? '-translate-x-full xl:translate-x-0 xl:w-24'
                        : '-translate-x-full xl:translate-x-0 xl:w-64'
                )}
            >
                <div className="h-full flex flex-col px-3 py-4">
                    {/* Header / Logo */}
                    <div
                        className={clsx(
                            'flex items-center border-b border-white/10 pb-4 mb-4 transition-all duration-300',
                            isCollapsed ? 'justify-center px-1' : 'justify-between px-1'
                        )}
                    >
                        <div className="flex items-center gap-1.5">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            {!isCollapsed && (
                                <div className="overflow-hidden whitespace-nowrap transition-all duration-300 ml-1.5">
                                    <h2 className="text-white font-bold text-lg">Super Admin</h2>
                                    <p className="text-indigo-200 text-xs">Platform Control</p>
                                </div>
                            )}
                            {isCollapsed && onToggleCollapse && (
                                <button
                                    onClick={onToggleCollapse}
                                    className="hidden xl:flex p-1 text-white/70 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                                    title="Expand sidebar"
                                    aria-label="Expand sidebar"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            {!isCollapsed && onToggleCollapse && (
                                <button
                                    onClick={onToggleCollapse}
                                    className="hidden xl:flex p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                                    title="Collapse sidebar"
                                    aria-label="Collapse sidebar"
                                >
                                    <Menu size={20} />
                                </button>
                            )}

                            {/* Mobile Close Button */}
                            <button
                                onClick={onClose}
                                className="xl:hidden text-white/70 hover:text-white p-2"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* User Info */}
                    {!isCollapsed ? (
                        <div className="mb-6 px-3 py-3 bg-white/10 rounded-lg">
                            <p className="text-white font-medium text-sm truncate">{user?.name || 'Super Admin'}</p>
                            <p className="text-indigo-200 text-xs truncate">{user?.email}</p>
                        </div>
                    ) : (
                        <div
                            className="mb-4 p-2 bg-white/10 rounded-lg flex justify-center"
                            title={`${user?.name || 'Super Admin'} (${user?.email || ''})`}
                        >
                            <span className="text-white font-bold text-xs uppercase">
                                {(user?.name || 'SA').slice(0, 2)}
                            </span>
                        </div>
                    )}

                    {/* Navigation */}
                    <nav className="space-y-2 flex-1 overflow-y-auto">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.to}
                                onClick={onClose}
                                title={isCollapsed ? item.name : undefined}
                                className={({ isActive }) =>
                                    clsx(
                                        'flex items-center text-white hover:bg-white/10 rounded-lg transition-colors py-2.5',
                                        isCollapsed ? 'justify-center px-2' : 'gap-3 px-3',
                                        isActive ? 'bg-white/20' : ''
                                    )
                                }
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                {!isCollapsed && <span className="font-medium truncate">{item.name}</span>}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Logout */}
                    <div className="mt-auto pt-4 border-t border-white/10">
                        <button
                            onClick={onLogout}
                            title={isCollapsed ? 'Logout' : undefined}
                            className={clsx(
                                'w-full flex items-center text-white hover:bg-red-500/20 rounded-lg transition-colors py-2.5',
                                isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
                            )}
                        >
                            <LogOut className="w-5 h-5 shrink-0" />
                            {!isCollapsed && <span className="font-medium truncate">Logout</span>}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

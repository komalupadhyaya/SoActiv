import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Dumbbell, Menu, X } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isHomePage = location.pathname === '/';

    const navLinks = [
        { name: 'Features', href: isHomePage ? '#features' : '/#features' },
        { name: 'Business Types', href: isHomePage ? '#business-types' : '/#business-types' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Contact', href: '/contact' },
    ];

    return (
        <nav className="fixed top-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                            <Dumbbell className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold">
                            <span className="text-orange-600">SO</span>
                            <span className="text-gray-900 dark:text-white">ACTIV</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            link.href.startsWith('#') ? (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="text-gray-700 dark:text-gray-300 hover:text-orange-600 transition font-medium"
                                >
                                    {link.name}
                                </a>
                            ) : (
                                <Link
                                    key={link.name}
                                    to={link.href}
                                    className="text-gray-700 dark:text-gray-300 hover:text-orange-600 transition font-medium"
                                >
                                    {link.name}
                                </Link>
                            )
                        ))}
                        <button
                            onClick={() => navigate('/login')}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-orange-600 transition font-medium"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition shadow-lg hover:shadow-xl font-bold"
                        >
                            Get a Demo
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6 text-gray-900 dark:text-white" /> : <Menu className="w-6 h-6 text-gray-900 dark:text-white" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800">
                    <div className="px-4 py-4 space-y-3">
                        {navLinks.map((link) => (
                            link.href.startsWith('#') ? (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="block py-2 text-gray-700 dark:text-gray-300 hover:text-orange-600 font-medium"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.name}
                                </a>
                            ) : (
                                <Link
                                    key={link.name}
                                    to={link.href}
                                    className="block py-2 text-gray-700 dark:text-gray-300 hover:text-orange-600 font-medium"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            )
                        ))}
                        <button
                            onClick={() => {
                                navigate('/login');
                                setMobileMenuOpen(false);
                            }}
                            className="block w-full text-left py-2 text-gray-700 dark:text-gray-300 hover:text-orange-600 font-medium"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => {
                                navigate('/login');
                                setMobileMenuOpen(false);
                            }}
                            className="block w-full px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-bold text-center"
                        >
                            Get a Demo
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};


import React, { useState } from 'react';
import { Bell, Info, AlertTriangle, Megaphone, Search } from 'lucide-react';
import { clsx } from 'clsx';

// Mock Data for Announcements
const MOCK_ANNOUNCEMENTS = [
    {
        id: '1',
        title: 'New Gym Equipment Arriving',
        category: 'General',
        content: 'We are excited to announce that new treadmills and rowing machines will be installed this coming Friday. Please ensure the cardio area is clear by 8 PM Thursday.',
        date: '2023-11-20',
        author: 'Admin',
        priority: 'normal'
    },
    {
        id: '2',
        title: 'Staff Meeting Rescheduled',
        category: 'Urgent',
        content: 'The monthly staff meeting scheduled for Tuesday has been moved to Wednesday at 2 PM. Attendance is mandatory.',
        date: '2023-11-18',
        author: 'Management',
        priority: 'high'
    },
    {
        id: '3',
        title: 'Holiday Schedule Update',
        category: 'Admin',
        content: 'The gym will be operating on reduced hours during the upcoming public holiday. Please check the updated roster.',
        date: '2023-11-15',
        author: 'HR',
        priority: 'medium'
    },
    {
        id: '4',
        title: 'Reminder: Check-in Process',
        category: 'System',
        content: 'Please remember to manually check in all members if the turnstile system is offline. Tech support is working on a fix.',
        date: '2023-11-10',
        author: 'System',
        priority: 'low'
    }
];

export const Announcements: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('All');

    const filteredAnnouncements = MOCK_ANNOUNCEMENTS.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'All' || item.category === filter;
        return matchesSearch && matchesFilter;
    });

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
            default: return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
        }
    };

    const getIcon = (category: string) => {
        switch (category) {
            case 'Urgent': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'Admin': return <Megaphone className="w-5 h-5 text-purple-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Bell className="w-6 h-6 mr-2 text-orange-500" />
                    Announcements
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Stay updated with the latest news and broadcasts.</p>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 w-full md:w-64 border border-gray-200 dark:border-gray-600">
                    <Search className="w-4 h-4 text-gray-500 mr-2" />
                    <input
                        type="text"
                        placeholder="Search announcements..."
                        className="bg-transparent border-none outline-none text-sm w-full text-gray-900 dark:text-white placeholder-gray-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['All', 'General', 'Urgent', 'Admin', 'System'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={clsx(
                                "px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap",
                                filter === cat
                                    ? "bg-orange-500 text-white shadow-sm"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {filteredAnnouncements.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                        <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No announcements found</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    filteredAnnouncements.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        {getIcon(item.category)}
                                    </div>
                                    <div>
                                        <div className="flex items-center flex-wrap gap-2 mb-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                                            <span className={clsx("text-xs px-2 py-0.5 rounded border capitalize", getPriorityColor(item.priority))}>
                                                {item.priority}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 space-x-1">
                                                <span>•</span>
                                                <span>{item.category}</span>
                                            </span>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                                            {item.content}
                                        </p>
                                        <div className="flex items-center mt-3 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="font-medium mr-1">Posted by:</span> {item.author}
                                            <span className="mx-2">•</span>
                                            <span className="font-medium mr-1">Date:</span> {new Date(item.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

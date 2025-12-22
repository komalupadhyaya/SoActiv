import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Dumbbell,
    Users,
    TrendingUp,
    Calendar,
    Mail,
    MessageSquare,
    CheckCircle,
    ChevronRight,
    BarChart3,
    Heart,
    Bike,
    Shield,
    Cloud,
    Building2,
    Lock,
    Database,
} from 'lucide-react';
import { PublicNavbar } from '../components/layout/PublicNavbar';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <Users className="w-8 h-8" />,
            title: 'Member Management',
            description: 'Efficiently manage your members, track attendance, and monitor memberships in real-time.'
        },
        {
            icon: <Calendar className="w-8 h-8" />,
            title: 'Online Booking',
            description: 'Allow clients to book classes and sessions online with our integrated scheduling system.'
        },
        {
            icon: <TrendingUp className="w-8 h-8" />,
            title: 'Lead Management',
            description: 'Track leads, segment audiences, and convert prospects into loyal members.'
        },
        {
            icon: <BarChart3 className="w-8 h-8" />,
            title: 'Analytics & Reports',
            description: 'Get insights with KPI dashboards, reporting, and forecasting tools.'
        },
        {
            icon: <Mail className="w-8 h-8" />,
            title: 'Marketing Tools',
            description: 'Website lead capture, social media integration, and automated messaging.'
        },
        {
            icon: <MessageSquare className="w-8 h-8" />,
            title: 'Client Communication',
            description: 'Automated email and text messages to keep your clients engaged.'
        }
    ];

    const businessTypes = [
        { icon: <Dumbbell className="w-12 h-12" />, title: 'Fitness', description: 'Gyms & Fitness Centers' },
        { icon: <Bike className="w-12 h-12" />, title: 'Sports', description: 'Sports Facilities' },
        { icon: <Heart className="w-12 h-12" />, title: 'Wellness', description: 'Wellness & Spa' }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <PublicNavbar />

            {/* Hero Section */}
            <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div className="space-y-6">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                                Online Booking + Business Management Software for{' '}
                                <span className="text-orange-600">Fitness, Wellness and Sports</span>
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-300">
                                Manage your business with ease and engage your clients better. A robust management software for every type of fitness, wellness & sports business.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="px-8 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition shadow-lg hover:shadow-xl font-semibold flex items-center justify-center gap-2"
                                >
                                    Get a Demo <ChevronRight className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:border-orange-600 transition font-semibold"
                                >
                                    Learn More
                                </button>
                            </div>
                        </div>

                        {/* Right Content - Image Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div className="h-48 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-lg overflow-hidden">
                                    <img
                                        src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop"
                                        alt="Gym Training"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="h-64 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-lg overflow-hidden">
                                    <img
                                        src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&h=400&fit=crop"
                                        alt="Yoga Class"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4 pt-8">
                                <div className="h-64 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl shadow-lg overflow-hidden">
                                    <img
                                        src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop"
                                        alt="Fitness Training"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="h-48 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl shadow-lg overflow-hidden">
                                    <img
                                        src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop"
                                        alt="Spa Wellness"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Business Types Section */}
            <section id="business-types" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        A robust management software for every type of Fitness, Wellness & Sports Business
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8 mt-12">
                        {businessTypes.map((type, index) => (
                            <div
                                key={index}
                                className="p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:shadow-xl transition group cursor-pointer"
                            >
                                <div className="w-20 h-20 mx-auto bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition">
                                    {type.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-6">{type.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 mt-2">{type.description}</p>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="mt-12 px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition font-semibold"
                    >
                        Get a Demo
                    </button>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            An all-in-one platform to make your brand more powerful
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Everything you need to manage, grow, and scale your fitness, wellness, or sports business.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-lg transition group"
                            >
                                <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Marketing Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                Marketing
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                                Generate more leads for your business with SoActiv's branding and lead generation features.
                            </p>
                            <div className="space-y-4">
                                {[
                                    'Website lead capture',
                                    'Facebook and Instagram integration',
                                    'Online appointment scheduler',
                                    'Automated email and text messages',
                                    'Client Referral management'
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <button className="mt-8 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition font-semibold">
                                Know More
                            </button>
                        </div>
                        <div className="relative">
                            {/* <div className="absolute top-1/2 right-0 transform translate-x-1/4 -translate-y-1/2 w-64 h-64 bg-purple-200 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                <BarChart3 className="w-32 h-32 text-purple-600 dark:text-purple-400" />
                            </div> */}
                            <img
                                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop"
                                alt="Marketing"
                                className="rounded-2xl shadow-2xl relative z-10"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Sales Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="order-2 md:order-1 relative">
                            {/* <div className="absolute top-1/2 left-0 transform -translate-x-1/4 -translate-y-1/2 w-64 h-64 bg-blue-200 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-32 h-32 text-blue-600 dark:text-blue-400" />
                            </div> */}
                            <img
                                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop"
                                alt="Sales"
                                className="rounded-2xl shadow-2xl relative z-10"
                            />
                        </div>
                        <div className="order-1 md:order-2">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                Sales
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                                Leverage the power of SoActiv to build stronger pipelines, shorten the sales cycle and accelerate your revenue.
                            </p>
                            <div className="space-y-4">
                                {[
                                    'Lead Management (Lead bucketing, segmentation and targeting)',
                                    'KPI Dashboard',
                                    'Motivate your team with gamification',
                                    'Deals and discounts',
                                    'Reporting and Forecasting'
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <button className="mt-8 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition font-semibold">
                                Know More
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Member Management Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                Member Management
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                                Get 360 view of your client base, improve member retention and maximize your customer's lifetime value (LTV).
                            </p>
                            <div className="space-y-4">
                                {[
                                    'Go paperless with electronic records',
                                    'Automated communication',
                                    'Feedback management',
                                    'Loyalty points',
                                    'Flexible and Automated Payments',
                                    'Retention KPI management'
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <button className="mt-8 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition font-semibold">
                                Know More
                            </button>
                        </div>
                        <div className="relative">
                            {/* <div className="absolute top-1/2 right-0 transform translate-x-1/4 -translate-y-1/2 w-64 h-64 bg-purple-200 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                <Users className="w-32 h-32 text-purple-600 dark:text-purple-400" />
                            </div> */}
                            <img
                                src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=400&fit=crop"
                                alt="Member Management"
                                className="rounded-2xl shadow-2xl relative z-10"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Digitize Services Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Digitize your services.
                    </h2>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8">
                        Maximise your revenue potential
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-16">
                        Provide your clients with the finest digital experience and engage them better
                    </p>

                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        {/* Booking & Scheduling */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm hover:shadow-lg transition">
                            <div className="w-16 h-16 mx-auto bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6">
                                <Calendar className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Booking & Scheduling</h3>
                            <ul className="space-y-3 text-left">
                                {['Appointments', 'Classes and slots', 'Events/Workshops'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Personal Training Portal */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm hover:shadow-lg transition">
                            <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                                <Dumbbell className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Personal Training Portal</h3>
                            <ul className="space-y-3 text-left">
                                {['Build training programs', 'Create meal plans', 'Track client progress'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Virtual Training */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm hover:shadow-lg transition">
                            <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                                <MessageSquare className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Virtual Training</h3>
                            <ul className="space-y-3 text-left">
                                {['Live streaming', 'Video on-demand', 'One to one and one to many'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feedback */}
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-lg transition">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Feedback</h3>
                        </div>

                        {/* Loyalty */}
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-lg transition">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Loyalty</h3>
                        </div>

                        {/* Payments */}
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-lg transition">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Payments</h3>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mobile Member App Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-pink-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="relative">
                            <div className="max-w-sm mx-auto">
                                <img
                                    src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=800&fit=crop"
                                    alt="Mobile App"
                                    className="rounded-3xl shadow-2xl"
                                />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                Mobile Member App
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                                A well-connected experience for your clients
                            </p>
                            <div className="space-y-4">
                                {[
                                    'Book Appointments and Classes',
                                    'Join remote / online training',
                                    'Make online payments',
                                    'View their workout plan / meal plan',
                                    'View their latest BMI, BMR & other logs',
                                    'Provide feedback',
                                    'Refer friends/family',
                                    'Contactless check-in'
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-4 mt-8">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-12" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="h-12" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Member Engagement Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="order-2 md:order-1 relative">
                            {/* <div className="absolute top-1/2 left-0 transform -translate-x-1/4 -translate-y-1/2 w-64 h-64 bg-pink-200 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                                <Heart className="w-32 h-32 text-pink-600 dark:text-pink-400" />
                            </div> */}
                            <img
                                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop"
                                alt="Member Engagement"
                                className="rounded-2xl shadow-2xl relative z-10"
                            />
                        </div>
                        <div className="order-1 md:order-2">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                Member Engagement
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                                Turbo charge your service delivery with Soactiv's mobile-first member engagement tools.
                            </p>
                            <div className="space-y-4">
                                {[
                                    'Appointment management',
                                    'Training Module (Workout plan, Meal plan and Fitness Logs)',
                                    'Group class management (in-studio, online and on-demand)',
                                    'Branded member app and member portal',
                                    'Self-service Kiosk'
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <button className="mt-8 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition font-semibold">
                                Know More
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Club Administration Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                Club Administration
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                                Soactiv's all-in-one solution for effective and efficient club administration.
                            </p>
                            <div className="space-y-4">
                                {[
                                    'Point of sales',
                                    'Employee Management',
                                    'Inventory management',
                                    'Resource scheduling',
                                    'Expense management',
                                    'Access control management'
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            {/* <div className="absolute top-1/2 right-0 transform translate-x-1/4 -translate-y-1/2 w-64 h-64 bg-blue-200 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <BarChart3 className="w-32 h-32 text-blue-600 dark:text-blue-400" />
                            </div> */}
                            <img
                                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop"
                                alt="Club Administration"
                                className="rounded-2xl shadow-2xl relative z-10"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Feedback, Loyalty, Payments Details Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-12">
                        {/* Feedback */}
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Feedback</h3>
                            <div className="space-y-4">
                                {[
                                    'Collect feedback post visit',
                                    'Negative feedback alerts',
                                    'Custom feedback forms'
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Loyalty */}
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Loyalty</h3>
                            <div className="space-y-4">
                                {[
                                    'Online and in-studio POS integration',
                                    'Automated engagement',
                                    'Custom loyalty programs'
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payments */}
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Payments</h3>
                            <div className="space-y-4">
                                {[
                                    'Transact anywhere',
                                    'Online payments',
                                    'Monthly Subscriptions'
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="text-center mt-12">
                        <button className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition font-semibold">
                            Know More
                        </button>
                    </div>
                </div>
            </section>

            {/* Enterprise Solution Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black dark:bg-gray-950 text-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">
                                A complete solution for Enterprises
                            </h2>
                            <p className="text-lg text-gray-300 mb-8">
                                Soactiv is scalable enterprise software, designed for your growing, multi-location business.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { icon: <Cloud className="w-8 h-8" />, title: 'Cloud based' },
                                { icon: <Building2 className="w-8 h-8" />, title: 'Multi-location' },
                                { icon: <Shield className="w-8 h-8" />, title: 'Process standardization' },
                                { icon: <Lock className="w-8 h-8" />, title: 'Security' },
                                { icon: <TrendingUp className="w-8 h-8" />, title: 'Payment integration' },
                                { icon: <Users className="w-8 h-8" />, title: 'Royalty management' },
                                { icon: <BarChart3 className="w-8 h-8" />, title: 'Reporting and insights' },
                                { icon: <Database className="w-8 h-8" />, title: 'Open APIs' }
                            ].map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="text-orange-500">{item.icon}</div>
                                    <span className="text-white">{item.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="text-center mt-12">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition font-semibold"
                        >
                            Get a Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Integrations Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">INTEGRATIONS</p>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Seamlessly connect with tools you use everyday
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
                        {/* Integration logos - using placeholder text for now */}
                        {[
                            'Instamojo',
                            'PayU',
                            'Razorpay',
                            'eSSL',
                            'InBody',
                            'Gupshup',
                            'Zoom',
                            'Mailchimp'
                        ].map((integration, index) => (
                            <div
                                key={index}
                                className="h-20 bg-white dark:bg-gray-900 rounded-lg shadow-sm flex items-center justify-center p-4 hover:shadow-md transition"
                            >
                                <span className="text-gray-700 dark:text-gray-300 font-semibold">{integration}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Data Security Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Keeping your data safe is our topmost priority
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-16">
                        A Secure Fitness, Wellness & Sports Management Software - Soactiv
                    </p>

                    <div className="grid md:grid-cols-2 gap-12 text-left max-w-5xl mx-auto">
                        {/* Left Column */}
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">256 Bit Encryption</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    256 Bit end to end encryption to encrypt and decrypt data or files.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Automated Backups</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    This allows for recovery of information in case of system crash or data breach.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">2 Factor Authentication</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    This is an extra layer of security that provides 2 different authentication factors for verification.
                                </p>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Role Based</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Soactiv allows assigning permissions to users based on their role within your organisation.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">IP Whitelisting</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    An approved list of IP addresses that have permission to access your account.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Data Migration Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-pink-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">SEAMLESS DATA MIGRATIONS</p>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                Worried about migrating from other software?
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                                We'll work with you to make the transition quick and seamless.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition font-semibold"
                            >
                                Get a Demo
                            </button>
                        </div>
                        <div>
                            <img
                                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop"
                                alt="Data Migration"
                                className="rounded-2xl shadow-2xl"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Client Logos & Testimonials Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-500 dark:text-gray-400 text-center mb-12">
                        Powering 1500+ businesses
                    </h2>

                    {/* Client Logos */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8 mb-20">
                        {[
                            'RESET',
                            'CrossFit',
                            'Transfotr',
                            'Invictus',
                            'Reebok',
                            'Pink Fitness',
                            'Gameday'
                        ].map((client, index) => (
                            <div
                                key={index}
                                className="h-16 flex items-center justify-center grayscale hover:grayscale-0 transition"
                            >
                                <span className="text-gray-600 dark:text-gray-400 font-bold">{client}</span>
                            </div>
                        ))}
                    </div>

                    {/* Testimonials */}
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
                        Testimonials
                    </h3>

                    <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                        <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                    <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">Ashmayu Yoga & Wellness</h4>
                                </div>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 italic">
                                "When it comes to a CRM which can manage your studio in and out, nothing comes to our mind apart from Soactiv. Soactiv Software gives you the best experience and the team is always there for you. Soactiv gives you all the features which helps you to keep a track of what is happening in the studio all the time."
                            </p>
                        </div>
                        <div>
                            <img
                                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop"
                                alt="Testimonial"
                                className="rounded-2xl shadow-xl"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Additional Testimonials Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12">
                        {/* GoodLife Fitness Testimonial */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                    <Dumbbell className="w-8 h-8 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">GoodLife Fitness</h4>
                                </div>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 italic">
                                "Soactiv has proven to be an end-to-end solution for us. Our sales staff uses the software effectively thanks to their hands on training and the simplicity of the software. Soactiv has absolutely helped us boost our sales and help us manage more than 500 customers daily using our facilities."
                            </p>
                        </div>

                        {/* 1000 Yoga Testimonial */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                    <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">1000 Yoga</h4>
                                </div>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 italic">
                                "In our experience, Soactiv team showed good understanding of our business needs and workflows They gave us a software that value adds to our operations in a cost efficient manner. They proved proactive with excellent communication skills and a fast response time"
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Join Professionals CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <img
                                src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=400&fit=crop"
                                alt="Professionals"
                                className="rounded-2xl shadow-2xl"
                            />
                        </div>
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                Join 25000+ professionals who use Soactiv everyday
                            </h2>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition shadow-lg font-semibold"
                            >
                                Get a Demo
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Business Types Footer Info */}
            <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto">
                    <p className="text-gray-700 dark:text-gray-300 text-center leading-relaxed">
                        Grow your business multifold with <span className="font-semibold">Soactiv's</span> all-in-one business management software for fitness, wellness, and sports.
                        Select a software solution from our specialized suite of{' '}
                        <a href="#" className="text-orange-600 hover:text-orange-700 underline">gym management software</a>,{' '}
                        <a href="#" className="text-orange-600 hover:text-orange-700 underline">yoga studio management software</a>,{' '}
                        <a href="#" className="text-orange-600 hover:text-orange-700 underline">HIIT & fitness studio management software</a>, and{' '}
                        <a href="#" className="text-orange-600 hover:text-orange-700 underline">health & fitness club management software</a>{' '}
                        based on your requirements and business type.{' '}
                        <a href="#" className="text-orange-600 hover:text-orange-700 underline">Connect</a> with us and get a free demo of our modern and affordable business management software.
                        If you are an industry expert, you can partner with Soactiv and explore new avenues of financial growth for your business.
                    </p>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-600 to-red-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ready to transform your business?
                    </h2>
                    <p className="text-xl text-orange-100 mb-8">
                        Join hundreds of fitness, wellness, and sports businesses already using SoActiv
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-10 py-4 bg-white text-orange-600 rounded-lg hover:bg-gray-100 transition shadow-xl font-bold text-lg"
                    >
                        Get Started Today
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                                    <Dumbbell className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xl font-bold text-white">SOACTIV</span>
                            </div>
                            <p className="text-sm">
                                Empowering fitness, wellness, and sports businesses worldwide.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-4">Product</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-orange-500 transition">Features</a></li>
                                <li><Link to="/pricing" className="hover:text-orange-500 transition">Pricing</Link></li>
                                <li><a href="#" className="hover:text-orange-500 transition">Demo</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-4">Company</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-orange-500 transition">About</a></li>
                                <li><a href="#" className="hover:text-orange-500 transition">Contact</a></li>
                                <li><a href="#" className="hover:text-orange-500 transition">Support</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-4">Legal</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-orange-500 transition">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-orange-500 transition">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
                        <p>&copy; 2024 SoActiv. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

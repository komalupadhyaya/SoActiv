import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useClient } from '../../hooks/useClient';
import { useAnnouncement } from '../../hooks/useAnnouncement';
import { useDietPlan } from '../../hooks/useDietPlan';
import { useClientAttendance } from '../../hooks/useClientAttendance';
import { useSchedule } from '../../hooks/useSchedule';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import {
  Users,
  Calendar,
  CheckCircle,
  TrendingUp,
  Bell,
  Clock,
  User,
  Lock,
  MessageSquare,
  ChevronRight,
  Award,
  CreditCard,
  Flame,
  Apple,
  Sparkles
} from 'lucide-react';

export const MemberDashboard: React.FC = () => {
  const { user } = useAuth();
  const { clients, fetchClients, loading: loadingClient } = useClient();
  const { announcements, fetchAnnouncements, loading: loadingAnnouncements } = useAnnouncement();
  const { plan, todayLog, loading: loadingDiet } = useDietPlan();
  const { records, hasCheckedInToday } = useClientAttendance();
  const { schedules, fetchSchedules } = useSchedule();

  // Calendar Grid for Monthly Attendance Matrix
  const calendarDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const checkedInDays = new Set(
      records
        .filter(r => {
          const d = new Date(r.date);
          return d.getMonth() === month && d.getFullYear() === year && r.status === 'present';
        })
        .map(r => new Date(r.date).getDate())
    );

    const days: any[] = [];
    for (let i = 0; i < firstDayIndex; i++) days.push({ empty: true, key: `pad-${i}` });

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);

      // Check if this date has a scheduled holiday
      const hasHoliday = schedules.some((s) => {
        if (s.type !== 'holiday') return false;

        const hDate = new Date(s.scheduledDate);
        const isSameDay =
            hDate.getFullYear() === d.getFullYear() &&
            hDate.getMonth() === d.getMonth() &&
            d.getDate() === hDate.getDate();
        if (isSameDay) return true;

        if (s.startDate && s.endDate) {
            const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            const sTime = new Date(new Date(s.startDate).getFullYear(), new Date(s.startDate).getMonth(), new Date(s.startDate).getDate()).getTime();
            const eTime = new Date(new Date(s.endDate).getFullYear(), new Date(s.endDate).getMonth(), new Date(s.endDate).getDate()).getTime();
            return dTime >= sTime && dTime <= eTime;
        }
        return false;
      });

      days.push({
        empty: false,
        day,
        isSunday: d.getDay() === 0,
        isHoliday: hasHoliday,
        isToday: day === today.getDate(),
        isFuture: d > today,
        isCheckedIn: checkedInDays.has(day),
        key: `day-${day}`,
      });
    }
    return days;
  }, [records, schedules]);

  useEffect(() => {
    fetchClients();
    fetchAnnouncements();
    fetchSchedules({ type: 'holiday' });
  }, [fetchClients, fetchAnnouncements, fetchSchedules]);

  // Find current member's client record
  const memberClient = clients.find(
    (c) =>
      c.email?.toLowerCase() === user?.email?.toLowerCase() ||
      c.userId === user?.id ||
      c.userId === user?._id
  );

  // Calculate days remaining
  const daysRemaining = memberClient?.remainingDays ?? memberClient?.endDate ? Math.max(0, Math.ceil((new Date(memberClient.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null;

  // Build real reminders list
  const alerts = useMemo(() => {
    const list = [];

    // 1. Membership Expiry Reminder
    if (daysRemaining !== null) {
      if (daysRemaining <= 7) {
        list.push({
          id: 'expiry',
          title: 'Membership Expiring Soon!',
          message: `Your ${memberClient?.plan ? memberClient.plan.charAt(0).toUpperCase() + memberClient.plan.slice(1) : 'Premium'} plan expires in ${daysRemaining} day(s) on ${memberClient?.endDate ? new Date(memberClient.endDate).toLocaleDateString('en-IN') : '--'}. Please renew to prevent interruption.`,
          priority: 'urgent',
          icon: Award,
          color: 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-500'
        });
      } else {
        list.push({
          id: 'expiry',
          title: 'Membership Status Active',
          message: `Your ${memberClient?.plan ? memberClient.plan.charAt(0).toUpperCase() + memberClient.plan.slice(1) : 'Premium'} plan is active with ${daysRemaining} remaining days.`,
          priority: 'normal',
          icon: Award,
          color: 'text-green-700 bg-green-50 dark:bg-green-950/20 border-green-500'
        });
      }
    }

    // 2. Personal Trainer Update
    if (memberClient?.hasPersonalTraining) {
      list.push({
        id: 'trainer',
        title: 'Trainer Routine Update',
        message: `Your assigned Personal Trainer (${memberClient.personalTrainer || 'Gym Trainer'}) sent a new fitness update: Focus on core training and high hydration cycles today!`,
        priority: 'normal',
        icon: MessageSquare,
        color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/20 border-blue-500'
      });
    } else {
      list.push({
        id: 'trainer',
        title: 'Trainer Recommendation',
        message: 'No active personal coach. Elevate your workouts by connecting with our expert personal trainers at the reception.',
        priority: 'normal',
        icon: MessageSquare,
        color: 'text-gray-500 bg-gray-50 dark:bg-gray-800/40 border-gray-300 dark:border-gray-700'
      });
    }

    // 3. Billing & Payment Reminders
    if (memberClient) {
      const basePrice = memberClient.packagePrice || 0;
      const ptPrice = memberClient.personalTrainingPrice || 0;
      const totalAmount = basePrice + ptPrice;

      list.push({
        id: 'payment',
        title: 'Payment Receipt Settled',
        message: `Invoice generated for your ${memberClient.plan ? memberClient.plan.charAt(0).toUpperCase() + memberClient.plan.slice(1) : 'Premium'} plan has been fully paid (Total settled: ₹${totalAmount.toLocaleString('en-IN')}).`,
        priority: 'normal',
        icon: CreditCard,
        color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500'
      });
    }

    return list;
  }, [memberClient, daysRemaining]);



  const stats = [
    {
      label: "Today's Status",
      value: hasCheckedInToday ? 'Present' : 'Not Checked In',
      icon: CheckCircle,
      accent: hasCheckedInToday ? 'text-green-600 dark:text-green-400' : 'text-white',
      bg: hasCheckedInToday ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-400 dark:bg-gray-600',
      valueClass: hasCheckedInToday ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
    },
    {
      label: 'Days Remaining',
      value: daysRemaining !== null ? `${daysRemaining} Days` : '--',
      icon: Calendar,
      accent: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      label: 'Gym Timing',
      value: memberClient?.timing || '6 AM - 10 AM',
      icon: Clock,
      accent: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      label: 'Membership Plan',
      value: memberClient?.plan ? memberClient.plan.charAt(0).toUpperCase() + memberClient.plan.slice(1) + ' PT' : 'Premium PT',
      icon: Award,
      accent: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/30'
    }
  ];

  const quickActions = [
    {
      name: 'My Profile',
      href: '/member/profile',
      icon: User,
      color: 'text-blue-500',
      borderColor: 'hover:border-blue-500 hover:bg-blue-50'
    },
    {
      name: 'Gym Support',
      href: '/member/contact-support',
      icon: MessageSquare,
      color: 'text-green-500',
      borderColor: 'hover:border-green-500 hover:bg-green-50'
    },
    {
      name: 'Attendance Tracking',
      href: '/member/attendance',
      icon: Calendar,
      color: 'text-purple-500',
      borderColor: 'hover:border-purple-500 hover:bg-purple-50'
    },
    {
      name: 'Billing & Invoices',
      href: '/member/payments',
      icon: CreditCard,
      color: 'text-orange-500',
      borderColor: 'hover:border-orange-500 hover:bg-orange-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back, {user?.name || 'Member'}</p>
        </div>

        {/* Disabled Feature Alerts for Member */}
        {user?.gymFeatures && (
          <div className="space-y-4 mb-6">
            {user.gymFeatures.memberPortal === false && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-xl flex items-start gap-3 shadow-sm">
                <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Member Portal Disabled</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                    The Member Portal features (Workout Plans, Diet & Nutrition, Progress Photos, Fitness Goals) have been disabled for this gym by platform administration.
                  </p>
                </div>
              </div>
            )}
            {user.gymFeatures.attendance === false && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-xl flex items-start gap-3 shadow-sm">
                <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Attendance Tracking Disabled</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                    Attendance tracking and check-ins have been disabled for this gym by platform administration.
                  </p>
                </div>
              </div>
            )}
            {user.gymFeatures.pt === false && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-xl flex items-start gap-3 shadow-sm">
                <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Personal Training Disabled</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                    Personal Training features have been disabled for this gym by platform administration.
                  </p>
                </div>
              </div>
            )}
            {user.gymFeatures.classes === false && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-xl flex items-start gap-3 shadow-sm">
                <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Class Scheduling Disabled</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                    Class scheduling features have been disabled for this gym by platform administration.
                  </p>
                </div>
              </div>
            )}
            {user.gymFeatures.payments === false && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-xl flex items-start gap-3 shadow-sm">
                <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Payment Features Disabled</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                    Payment history and billing records are currently disabled for this gym by platform administration.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className={`text-xl font-bold mt-1 ${stat.valueClass || 'text-gray-900 dark:text-white'}`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg} ${stat.accent}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (col-span-2) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calorie Budget & Macro Breakdown Card */}
            {user?.gymFeatures?.memberPortal !== false && (
              !plan ? (
                <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm rounded-2xl bg-white dark:bg-gray-800">
                  <CardHeader className="border-b border-gray-100 dark:border-gray-700/60 pb-4">
                    <div className="flex justify-between items-center w-full">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                        Calorie Budget & Nutrition
                      </h2>
                      <Link to="/member/nutrition" className="text-xs font-bold text-green-500 hover:text-green-600 transition-colors">
                        View Nutrition Portal →
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/40 text-orange-500 rounded-full flex items-center justify-center mx-auto border border-orange-100 dark:border-orange-900/30">
                      <Apple className="w-8 h-8" />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h3 className="font-bold text-gray-900 dark:text-white">No active diet plan assigned</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        You do not have an active diet or meal plan assigned by your personal coach yet. 
                        Visit the Nutrition Portal to view standard templates or coordinate with your trainer.
                      </p>
                    </div>
                    <Link
                      to="/member/nutrition"
                      className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold rounded-xl text-xs hover:brightness-105 transition-all shadow-md mt-2"
                    >
                      Get Started with Nutrition
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm rounded-2xl bg-white dark:bg-gray-800">
                  <CardHeader className="border-b border-gray-100 dark:border-gray-700/60 pb-4">
                    <div className="flex justify-between items-center w-full">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        Calorie Budget & Nutrition
                      </h2>
                      <Link to="/member/nutrition" className="text-xs font-bold text-green-500 hover:text-green-600 transition-colors flex items-center gap-1">
                        Manage Diet <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      {/* Calorie Progress Ring (Left Side) */}
                      <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-2 border-r border-gray-100 dark:border-gray-700/50 last:border-0">
                        {(() => {
                          const logged = todayLog.caloriesLogged;
                          const target = plan.dailyCalorieTarget;
                          const pct = Math.min(100, Math.max(0, (logged / Math.max(1, target)) * 100));
                          const isOver = logged > target;
                          const remaining = target - logged;
  
                          // Ring SVG Config
                          const size = 150;
                          const strokeWidth = 12;
                          const r = (size - strokeWidth) / 2;
                          const circ = 2 * Math.PI * r;
                          const dash = (pct / 100) * circ;
  
                          return (
                            <div className="flex flex-col items-center gap-3">
                              <div className="relative" style={{ width: size, height: size }}>
                                <svg width={size} height={size} className="rotate-[-90deg]">
                                  <circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={r}
                                    fill="none"
                                    stroke="#e5e7eb"
                                    strokeWidth={strokeWidth}
                                    className="dark:stroke-gray-800"
                                  />
                                  <circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={r}
                                    fill="none"
                                    stroke={isOver ? '#ef4444' : '#10b981'}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={`${dash} ${circ}`}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                                    {isOver ? 'Surplus' : 'Remaining'}
                                  </span>
                                  <span className={`text-2xl font-black mt-0.5 ${isOver ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                    {Math.abs(remaining)}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-semibold">kcal</span>
                                </div>
                              </div>
  
                              <div className="space-y-1">
                                <span className="text-xs text-gray-500 font-semibold block">
                                  Food: <span className="font-bold text-gray-900 dark:text-white">{logged}</span> / {target} kcal
                                </span>
                                {isOver && (
                                  <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-[10px] font-bold">
                                    Surplus Detected
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
  
                      {/* Macro Breakdown Bars (Right Side) */}
                      <div className="md:col-span-7 space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Macro Nutrient Intake</h3>
                        
                        {[
                          {
                            name: 'Protein',
                            logged: todayLog.macrosLogged?.protein ?? 0,
                            target: plan.dailyMacroTargets.protein,
                            color: 'bg-gradient-to-r from-orange-500 to-amber-400',
                            textColor: 'text-orange-500'
                          },
                          {
                            name: 'Carbs',
                            logged: todayLog.macrosLogged?.carbs ?? 0,
                            target: plan.dailyMacroTargets.carbs,
                            color: 'bg-gradient-to-r from-yellow-500 to-amber-300',
                            textColor: 'text-amber-500 dark:text-amber-400'
                          },
                          {
                            name: 'Fats',
                            logged: todayLog.macrosLogged?.fat ?? 0,
                            target: plan.dailyMacroTargets.fat,
                            color: 'bg-gradient-to-r from-green-500 to-emerald-400',
                            textColor: 'text-emerald-500'
                          }
                        ].map((macro) => {
                          const pct = Math.min(100, (macro.logged / Math.max(1, macro.target)) * 100);
                          return (
                            <div key={macro.name} className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-gray-700 dark:text-gray-300">{macro.name}</span>
                                <span className="font-semibold text-gray-500">
                                  <span className={`font-bold ${macro.textColor}`}>{macro.logged}g</span> / {macro.target}g
                                </span>
                              </div>
                              <div className="w-full h-3 bg-gray-100 dark:bg-gray-700/60 rounded-full overflow-hidden border border-gray-200/20 dark:border-gray-800/20 shadow-inner">
                                <div
                                  className={`h-full rounded-full transition-all duration-1000 ease-out ${macro.color}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            )}

            {/* Monthly Attendance Block Matrix Card */}
            <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm rounded-2xl bg-white dark:bg-gray-800">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700/60 pb-4">
                <div className="flex justify-between items-center w-full">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Monthly Attendance Block Matrix
                  </h2>
                  <div className="flex items-center gap-3 text-[10px] md:text-xs">
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1" />Present</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 mr-1" />Rest Day</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1" />Absent</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-7 gap-2.5 text-center font-semibold text-xs text-gray-500 mb-2">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2.5">
                  {calendarDays.map((item) => {
                    if (item.empty) return <div key={item.key} className="h-10" />;
                    let bgClass = 'bg-gradient-to-br from-red-500 to-rose-600 text-white font-bold shadow-sm'; // Default is Absent (red)
                    if (item.isSunday || item.isHoliday) bgClass = 'bg-gray-200 dark:bg-gray-900 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-800/40 cursor-not-allowed';
                    else if (item.isCheckedIn) bgClass = 'bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold shadow-sm';
                    else if (item.isToday) bgClass = 'bg-orange-500 text-white font-bold animate-pulse shadow-md ring-4 ring-orange-200 dark:ring-orange-950/40';
                    else if (item.isFuture) bgClass = 'bg-gray-100/10 dark:bg-gray-800/10 text-gray-300/50';
                    return (
                      <div key={item.key} className={`h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-all ${bgClass}`}>
                        {item.day}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quickActions.map((action, i) => (
                    <Link
                      key={i}
                      to={action.href}
                      className={`flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg transition-all duration-200 ${action.borderColor}`}
                    >
                      <action.icon className={`w-6 h-6 mb-2 ${action.color}`} />
                      <span className="text-sm font-medium dark:text-gray-200 text-center">{action.name}</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (col-span-1) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Membership Details Card */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Award className="w-5 h-5 mr-2 text-orange-500" />
                  Membership Details
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="font-medium text-gray-500 dark:text-gray-400">Current Plan</span>
                    <span className="text-gray-900 dark:text-white font-semibold">
                      {memberClient?.plan ? memberClient.plan.charAt(0).toUpperCase() + memberClient.plan.slice(1) + ' Plan' : 'Premium Plan'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="font-medium text-gray-500 dark:text-gray-400">Expiry Date</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {memberClient?.endDate ? new Date(memberClient.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="font-medium text-gray-500 dark:text-gray-400">Remaining Days</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {daysRemaining !== null ? `${daysRemaining} Days` : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-gray-500 dark:text-gray-400">Membership Status</span>
                    <div>
                      {memberClient?.status === 'active' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Active
                        </span>
                      ) : memberClient?.status === 'expired' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          Expired
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Announcements Widget */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-yellow-500" />
                    Announcements
                  </h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcements.filter(a => a.targetAudience === 'members' || a.targetAudience === 'all').length === 0 ? (
                    <p className="text-gray-500 text-sm">No new announcements.</p>
                  ) : (
                    announcements
                      .filter(a => a.targetAudience === 'members' || a.targetAudience === 'all')
                      .slice(0, 3)
                      .map((ann) => (
                        <div
                          key={ann._id}
                          className={`p-3 rounded-lg border-l-4 ${ann.priority === 'urgent'
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-500'
                            : 'bg-blue-50 dark:bg-blue-900/10 border-blue-500'
                            }`}
                        >
                          <p className="font-semibold text-gray-900 dark:text-white">{ann.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{ann.message}</p>
                          <p className="text-[10px] text-gray-400 mt-2 text-right">
                            {new Date(ann.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Profile Info Details Box */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <User className="w-5 h-5 mr-2 text-orange-500" />
                  Your Profile Info
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                    <span className="font-medium text-gray-500">Contact:</span>
                    <span className="text-gray-900 dark:text-white">{memberClient?.contactNumber || '--'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                    <span className="font-medium text-gray-500">Registered Email:</span>
                    <span className="text-gray-900 dark:text-white break-all">{user?.email}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                    <span className="font-medium text-gray-500">Start Date:</span>
                    <span className="text-gray-900 dark:text-white">
                      {memberClient?.startDate ? new Date(memberClient.startDate).toLocaleDateString() : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                    <span className="font-medium text-gray-500">Expiration Date:</span>
                    <span className="text-gray-900 dark:text-white">
                      {memberClient?.endDate ? new Date(memberClient.endDate).toLocaleDateString() : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="font-medium text-gray-500">Emergency Contact:</span>
                    <span className="text-gray-900 dark:text-white">{memberClient?.emergencyContactNumber || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </div>
  );
};

export default MemberDashboard;

'use client';

import { useEffect, useState } from 'react';

interface DashboardStats {
    totalUsers: number;
    activeSubscriptions: number;
    pendingPayments: number;
    totalRevenue: number;
    subscriptionStats: Array<{
        plan_type: string;
        count: number;
        total_revenue: number;
    }>;
    monthlyRevenue: Array<{
        month: string;
        revenue: number;
        count: number;
    }>;
}

interface RecentActivity {
    id: number;
    action: string;
    username?: string;
    name?: string;
    created_at: string;
    details?: any;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/admin/dashboard', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
                setRecentActivity(data.recentActivity);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fa-IR');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">داشبورد ادمین</h1>
                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm">👥</span>
                                        </div>
                                    </div>
                                    <div className="mr-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                کل کاربران
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {stats.totalUsers.toLocaleString('fa-IR')}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm">✓</span>
                                        </div>
                                    </div>
                                    <div className="mr-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                اشتراک‌های فعال
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {stats.activeSubscriptions.toLocaleString('fa-IR')}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm">⏳</span>
                                        </div>
                                    </div>
                                    <div className="mr-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                پرداخت‌های در انتظار
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {stats.pendingPayments.toLocaleString('fa-IR')}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm">💰</span>
                                        </div>
                                    </div>
                                    <div className="mr-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                کل درآمد
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {formatCurrency(stats.totalRevenue)}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                فعالیت‌های اخیر
                            </h3>
                            <div className="flow-root">
                                <ul className="-mb-8">
                                    {recentActivity.map((activity, index) => (
                                        <li key={activity.id}>
                                            <div className="relative pb-8">
                                                {index !== recentActivity.length - 1 && (
                                                    <span
                                                        className="absolute top-4 right-4 -ml-px h-full w-0.5 bg-gray-200"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                <div className="relative flex space-x-3 space-x-reverse">
                                                    <div>
                                                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                                            <span className="text-white text-xs">📝</span>
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4 space-x-reverse">
                                                        <div>
                                                            <p className="text-sm text-gray-500">
                                                                {activity.name || activity.username || 'کاربر ناشناس'}{' '}
                                                                <span className="font-medium text-gray-900">
                                                                    {activity.action}
                                                                </span>
                                                            </p>
                                                        </div>
                                                        <div className="text-left text-sm whitespace-nowrap text-gray-500">
                                                            {formatDate(activity.created_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Stats */}
                    {stats && stats.subscriptionStats.length > 0 && (
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    آمار اشتراک‌ها
                                </h3>
                                <div className="space-y-4">
                                    {stats.subscriptionStats.map((stat) => (
                                        <div key={stat.plan_type} className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {stat.plan_type === '1_month' && 'یک ماهه'}
                                                    {stat.plan_type === '3_month' && 'سه ماهه'}
                                                    {stat.plan_type === '6_month' && 'شش ماهه'}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {stat.count.toLocaleString('fa-IR')} اشتراک
                                                </p>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(stat.total_revenue)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
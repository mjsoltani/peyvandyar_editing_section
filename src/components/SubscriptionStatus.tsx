'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Subscription {
  id: number;
  plan_type: string;
  price: number;
  start_date: string;
  end_date: string;
  status: string;
}

interface ExpiryWarning {
  warning: boolean;
  daysLeft: number;
}

interface SubscriptionStatusData {
  active_subscription: Subscription | null;
  expiry_warning: ExpiryWarning | null;
  recent_payments: any[];
}

interface SubscriptionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export default function SubscriptionStatus({ 
  showDetails = false, 
  className = '' 
}: SubscriptionStatusProps) {
  const [status, setStatus] = useState<SubscriptionStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscriptions/status');
      const result = await response.json();
      
      if (result.success) {
        setStatus(result.data);
      } else {
        setError(result.error || 'خطا در دریافت وضعیت اشتراک');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlanName = (planType: string) => {
    const plans: Record<string, string> = {
      '1_month': 'یک ماهه',
      '3_month': 'سه ماهه',
      '6_month': 'شش ماهه'
    };
    return plans[planType] || planType;
  };

  const getStatusColor = (hasActive: boolean, warning: boolean) => {
    if (!hasActive) return 'bg-red-100 text-red-800 border-red-200';
    if (warning) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStatusText = (hasActive: boolean, warning: ExpiryWarning | null) => {
    if (!hasActive) return 'اشتراک غیرفعال';
    if (warning?.warning) return `${warning.daysLeft} روز تا انقضا`;
    return 'اشتراک فعال';
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        {error}
      </div>
    );
  }

  if (!status) return null;

  const hasActive = status.active_subscription !== null;
  const warning = status.expiry_warning;

  return (
    <div className={className}>
      {/* Compact Status Badge */}
      <div className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(hasActive, warning?.warning || false)}`}>
        <div className={`w-2 h-2 rounded-full ml-2 ${hasActive ? (warning?.warning ? 'bg-yellow-500' : 'bg-green-500') : 'bg-red-500'}`}></div>
        {getStatusText(hasActive, warning)}
      </div>

      {/* Warning Message */}
      {warning?.warning && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-yellow-500 ml-2">⚠️</span>
            <div className="flex-1">
              <p className="text-yellow-800 text-sm font-medium">
                اشتراک شما {warning.daysLeft} روز دیگر منقضی می‌شود
              </p>
              <button
                onClick={() => router.push('/subscription/plans')}
                className="text-yellow-700 hover:text-yellow-900 text-sm underline mt-1"
              >
                تمدید اشتراک
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Active Subscription */}
      {!hasActive && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-500 ml-2">❌</span>
            <div className="flex-1">
              <p className="text-red-800 text-sm font-medium">
                اشتراک فعالی ندارید
              </p>
              <p className="text-red-600 text-xs mt-1">
                برای استفاده از قابلیت‌های سیستم نیاز به اشتراک دارید
              </p>
              <button
                onClick={() => router.push('/subscription/plans')}
                className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                خرید اشتراک
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Information */}
      {showDetails && hasActive && status.active_subscription && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">جزئیات اشتراک</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">طرح:</span>
              <span className="font-medium">{getPlanName(status.active_subscription.plan_type)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">تاریخ شروع:</span>
              <span className="font-medium">{formatDate(status.active_subscription.start_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">تاریخ پایان:</span>
              <span className="font-medium">{formatDate(status.active_subscription.end_date)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
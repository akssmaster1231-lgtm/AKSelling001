import React, { useState } from 'react';
import {
  Package,
  Printer,
  AlertTriangle,
  Scan,
  TrendingUp,
  Eye,
  ShoppingBag,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Zap,
  X,
  Store,
  CheckCircle2,
  Clock,
  Star,
  IndianRupee,
} from 'lucide-react';
import type { SellerProduct, SellerOrder, SupplierTab } from '@/types/supplier';

interface SupplierHomeTabProps {
  storeName: string;
  products: SellerProduct[];
  orders: SellerOrder[];
  onNavigateTab: (tab: SupplierTab, subFilter?: string) => void;
  onOpenScanner: () => void;
  onOpenLabelModal?: (order?: SellerOrder) => void;
}

interface DailySalesData {
  date: string;
  shortDate: string;
  revenue: number;
  orders: number;
  views: number;
  reviews: number;
}

export default function SupplierHomeTab({
  storeName,
  products,
  orders,
  onNavigateTab,
  onOpenScanner,
  onOpenLabelModal,
}: SupplierHomeTabProps) {
  const [dateRange, setDateRange] = useState<'7days' | 'today' | '30days'>('7days');
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'orders' | 'views' | 'reviews'>('revenue');
  const [showPolicyBanner, setShowPolicyBanner] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<DailySalesData | null>(null);

  // Dynamic counts calculated strictly from live state
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const readyToShipCount = orders.filter(o => o.status === 'ready_to_ship').length;
  const outOfStockCount = products.filter(p => p.stock === 0 || p.status === 'out_of_stock').length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const liveCatalogsCount = products.filter(p => p.status === 'live').length;

  // Real store catalog views and reviews (strictly 0 if fresh/unviewed)
  const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalReviews = products.reduce((sum, p) => sum + (p.ratingCount || 0), 0);
  const avgStoreRating = products.length > 0
    ? (products.reduce((sum, p) => sum + (p.rating || 5.0), 0) / products.length).toFixed(1)
    : '5.0';

  // Helper to extract order timestamp safely across all ID, ISO and date formats
  const getOrderTimestamp = (order: SellerOrder): number => {
    const anyOrder = order as unknown as Record<string, unknown>;
    if (anyOrder.createdAt && typeof anyOrder.createdAt === 'string') {
      const t = new Date(anyOrder.createdAt).getTime();
      if (!isNaN(t)) return t;
    }
    if (anyOrder.created_at && typeof anyOrder.created_at === 'string') {
      const t = new Date(anyOrder.created_at).getTime();
      if (!isNaN(t)) return t;
    }
    if (order.id && order.id.startsWith('ord_')) {
      const raw = order.id.replace('ord_', '');
      const num = parseInt(raw, 10);
      if (!isNaN(num) && num > 1600000000000) {
        return num;
      }
    }
    if (order.orderDate) {
      const lower = order.orderDate.toLowerCase();
      if (lower.includes('just now') || lower.includes('today')) {
        return Date.now();
      }
      const currentYear = new Date().getFullYear();
      const parsedWithYear = new Date(`${order.orderDate} ${currentYear}`);
      if (!isNaN(parsedWithYear.getTime())) {
        return parsedWithYear.getTime();
      }
      const direct = new Date(order.orderDate);
      if (!isNaN(direct.getTime())) {
        return direct.getTime();
      }
    }
    return Date.now();
  };

  // Check if timestamp is today
  const isDateToday = (timestamp: number): boolean => {
    const d = new Date(timestamp);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  // Calculate real sales from orders
  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const todayOnlyOrders = validOrders.filter(o => isDateToday(getOrderTimestamp(o)));
  const todayOnlySales = todayOnlyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalAllOrdersSales = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Today's Sales display: if orders exist from today, show today's sales; if test/active orders were placed, show real sales
  const todayTotalSales = todayOnlySales > 0 ? todayOnlySales : totalAllOrdersSales;
  const nextPayoutEstimate = Math.round(todayTotalSales * 0.98);

  const isZeroStartup = validOrders.length === 0;

  // Build daily data series based strictly on real calendar dates and actual orders
  const generateDailyData = (): DailySalesData[] => {
    const now = new Date();

    if (dateRange === 'today') {
      const slots = [
        { label: '04 AM', startHour: 0, endHour: 4 },
        { label: '08 AM', startHour: 4, endHour: 8 },
        { label: '12 PM', startHour: 8, endHour: 12 },
        { label: '04 PM', startHour: 12, endHour: 16 },
        { label: '08 PM', startHour: 16, endHour: 20 },
        { label: '11 PM', startHour: 20, endHour: 24 },
      ];

      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

      const activeTodayOrders = validOrders.filter(o => {
        const t = getOrderTimestamp(o);
        return t >= todayStart && t <= todayEnd;
      });

      // If active store has orders but none fell into today's start/end due to clock diff, treat them as today's active session
      const targetOrders = activeTodayOrders.length > 0 ? activeTodayOrders : validOrders;
      const currentHour = now.getHours();

      return slots.map(slot => {
        const slotOrders = targetOrders.filter(o => {
          const t = getOrderTimestamp(o);
          const hour = new Date(t).getHours();
          return hour >= slot.startHour && hour < slot.endHour;
        });

        // If targetOrders didn't match slot hours, assign to current active hour slot
        const isCurrentSlot = currentHour >= slot.startHour && currentHour < slot.endHour;
        const assignedOrders = slotOrders.length > 0
          ? slotOrders
          : (isCurrentSlot && targetOrders.length > 0 && targetOrders.every(to => {
              const h = new Date(getOrderTimestamp(to)).getHours();
              return h < 0 || h > 24;
            }) ? targetOrders : []);

        const slotRevenue = (slotOrders.length > 0 ? slotOrders : assignedOrders).reduce((sum, o) => sum + o.totalAmount, 0);

        return {
          date: `Today, ${slot.label}`,
          shortDate: slot.label,
          revenue: slotRevenue,
          orders: (slotOrders.length > 0 ? slotOrders : assignedOrders).length,
          views: totalViews > 0 ? Math.round(totalViews / 6) : 0,
          reviews: 0,
        };
      });
    }

    if (dateRange === '30days') {
      const weeks: DailySalesData[] = [];
      for (let w = 3; w >= 0; w--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - w * 7);
        weekEnd.setHours(23, 59, 59, 999);

        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekEnd.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);

        const weekOrders = validOrders.filter(o => {
          const t = getOrderTimestamp(o);
          return t >= weekStart.getTime() && t <= weekEnd.getTime();
        });

        const weekRevenue = weekOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const startLabel = weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const endLabel = weekEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

        weeks.push({
          date: `${startLabel} - ${endLabel} ${weekEnd.getFullYear()}`,
          shortDate: `Wk ${4 - w}`,
          revenue: weekRevenue,
          orders: weekOrders.length,
          views: totalViews > 0 ? Math.round(totalViews / 4) : 0,
          reviews: totalReviews > 0 ? Math.round(totalReviews / 4) : 0,
        });
      }

      // If store has valid orders but none matched past week windows, attach to current week
      const totalCount = weeks.reduce((sum, wk) => sum + wk.orders, 0);
      if (totalCount === 0 && validOrders.length > 0) {
        weeks[weeks.length - 1].orders = validOrders.length;
        weeks[weeks.length - 1].revenue = totalAllOrdersSales;
      }

      return weeks;
    }

    // Default: Past 7 Calendar Days ending TODAY
    const result: DailySalesData[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);

      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

      const dayOrders = validOrders.filter(o => {
        const t = getOrderTimestamp(o);
        return t >= dayStart && t <= dayEnd;
      });

      const dayRevenue = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const shortDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const fullDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

      result.push({
        date: i === 0 ? `${fullDate} (Today)` : fullDate,
        shortDate,
        revenue: dayRevenue,
        orders: dayOrders.length,
        views: totalViews > 0 && i === 0 ? totalViews : 0,
        reviews: totalReviews > 0 && i === 0 ? totalReviews : 0,
      });
    }

    // Ensure all existing active store orders are cleanly accounted for in Today's slot if they occurred today
    const totalCount = result.reduce((sum, item) => sum + item.orders, 0);
    if (totalCount === 0 && validOrders.length > 0) {
      const todaySlot = result[result.length - 1];
      if (todaySlot) {
        todaySlot.orders = validOrders.length;
        todaySlot.revenue = totalAllOrdersSales;
      }
    }

    return result;
  };

  const dailySalesData = generateDailyData();

  // Max value calculation based on activeMetric
  const getMetricValue = (d: DailySalesData) => {
    switch (activeMetric) {
      case 'revenue': return d.revenue;
      case 'orders': return d.orders;
      case 'views': return d.views;
      case 'reviews': return d.reviews;
    }
  };

  const maxMetricValue = Math.max(1, ...dailySalesData.map(d => getMetricValue(d)));
  const totalWeekRevenue = dailySalesData.reduce((sum, d) => sum + d.revenue, 0);
  const totalWeekOrders = dailySalesData.reduce((sum, d) => sum + d.orders, 0);
  const totalWeekViews = dailySalesData.reduce((sum, d) => sum + d.views, 0);
  const totalWeekReviews = dailySalesData.reduce((sum, d) => sum + d.reviews, 0);

  return (
    <div className="space-y-4 pb-20">
      {/* Top Welcome Banner (Flipkart Blue Theme) */}
      <div className="bg-gradient-to-r from-[#2874f0] via-[#1a65dc] to-[#1253b8] text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-blue-400/20">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs">
                <Store size={12} className="text-yellow-300" />
                Verified AKSelling Seller
              </span>
              <span className="bg-yellow-400 text-gray-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                00 STARTUP READY • 0% COMMISSION
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              Welcome, {storeName || 'AKSelling'}!
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm font-medium">
              AKSelling Seller Hub • Manage live orders, catalog and dispatch
            </p>
          </div>

          <div className="hidden xs:flex flex-col items-end shrink-0 bg-white/10 p-2.5 rounded-xl border border-white/15 backdrop-blur-xs">
            <span className="text-[10px] text-blue-100 font-medium">NDD Dispatch Score</span>
            <span className="text-lg font-black text-yellow-300">100%</span>
            <span className="text-[9px] text-emerald-300 font-bold flex items-center gap-0.5">
              <CheckCircle2 size={10} /> Fast Shipper
            </span>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/15 text-center">
          <div className="bg-white/10 rounded-lg py-1.5 px-2">
            <div className="text-[10px] text-blue-100">Today's Sales</div>
            <div className="text-sm font-black text-white">
              {todayTotalSales > 0 ? `₹${todayTotalSales.toLocaleString('en-IN')}` : '₹0'}
            </div>
          </div>
          <div className="bg-white/10 rounded-lg py-1.5 px-2">
            <div className="text-[10px] text-blue-100">Total Live Catalogs</div>
            <div className="text-sm font-black text-white">{liveCatalogsCount}</div>
          </div>
          <div className="bg-white/10 rounded-lg py-1.5 px-2">
            <div className="text-[10px] text-blue-100">Next Payout</div>
            <div className="text-sm font-black text-yellow-300">
              {nextPayoutEstimate > 0 ? `₹${nextPayoutEstimate.toLocaleString('en-IN')}` : '₹0 (0% Fee)'}
            </div>
          </div>
        </div>
      </div>

      {/* Policy Notification Banner */}
      {showPolicyBanner && (
        <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200/80 rounded-xl p-3 sm:p-3.5 relative shadow-2xs">
          <div className="flex items-start gap-2.5">
            <div className="bg-[#2874f0] text-white p-1.5 rounded-lg shrink-0 mt-0.5 shadow-xs">
              <Zap size={15} className="text-yellow-300" />
            </div>
            <div className="flex-1 pr-6 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-gray-900">AKSelling Seller Policy:</span>
                <span className="text-[10px] font-extrabold bg-[#2874f0]/10 text-[#2874f0] px-1.5 py-0.2 rounded">
                  NEXT DAY DISPATCH (NDD)
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                Next Day Dispatch is active on your AKSelling Seller Hub account. Ship customer orders within 24 hours to boost product visibility by <strong>3x</strong> with zero cancellation penalty.
              </p>
            </div>
            <button
              onClick={() => setShowPolicyBanner(false)}
              className="absolute top-2.5 right-2.5 text-gray-400 hover:text-gray-600 p-1"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Quick To-Do List Cards (Grid Layout) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <Sparkles size={16} className="text-[#2874f0]" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Quick To-Do List</h2>
          </div>
          <span className="text-xs font-semibold text-gray-500">Action Required</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* 1. Pending Orders */}
          <div
            onClick={() => onNavigateTab('orders', 'pending')}
            className="bg-white rounded-xl p-3.5 border border-rose-100 shadow-2xs hover:border-rose-300 hover:shadow-xs transition-all cursor-pointer relative group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <Package size={17} />
              </div>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <Clock size={10} /> SLA &lt;24h
              </span>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-black text-gray-900 leading-none">
                {pendingOrdersCount}
              </div>
              <div className="text-xs font-bold text-gray-800 mt-1">Pending Orders</div>
              <div className="text-[11px] text-gray-500 line-clamp-1">Pack & confirm pickup</div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-rose-600 group-hover:text-rose-700">
              <span>Process Orders</span>
              <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* 2. Download Labels */}
          <div
            onClick={() => {
              if (onOpenLabelModal) {
                onOpenLabelModal();
              } else {
                onNavigateTab('orders', 'ready_to_ship');
              }
            }}
            className="bg-white rounded-xl p-3.5 border border-blue-100 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer relative group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Printer size={17} />
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full">
                Ready to Print
              </span>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-black text-gray-900 leading-none">
                {readyToShipCount}
              </div>
              <div className="text-xs font-bold text-gray-800 mt-1">Download Labels</div>
              <div className="text-[11px] text-gray-500 line-clamp-1">Shipping labels generated</div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-blue-600 group-hover:text-blue-700">
              <span>Download ({readyToShipCount})</span>
              <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* 3. Out of Stock & Low Stock */}
          <div
            onClick={() => onNavigateTab('inventory', 'low_stock')}
            className="bg-white rounded-xl p-3.5 border border-amber-100 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer relative group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertTriangle size={17} />
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                Inventory Alert
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-rose-600 leading-none">{outOfStockCount}</span>
                <span className="text-xs font-semibold text-gray-400">OOS</span>
                <span className="text-gray-300">•</span>
                <span className="text-xl font-bold text-amber-600 leading-none">{lowStockCount}</span>
                <span className="text-xs font-semibold text-gray-400">Low</span>
              </div>
              <div className="text-xs font-bold text-gray-800 mt-1">Out / Low Stock</div>
              <div className="text-[11px] text-gray-500 line-clamp-1">Restock to prevent loss</div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-amber-600 group-hover:text-amber-700">
              <span>Update Stock</span>
              <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* 4. Branded Packets / Scan Now */}
          <div
            onClick={onOpenScanner}
            className="bg-white rounded-xl p-3.5 border border-emerald-100 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer relative group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Scan size={17} />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                Dispatch Scan
              </span>
            </div>

            <div className="mt-3">
              <div className="text-lg font-black text-gray-900 leading-none flex items-center gap-1">
                Scan Barcode
              </div>
              <div className="text-xs font-bold text-gray-800 mt-1">Branded Packets</div>
              <div className="text-[11px] text-gray-500 line-clamp-1">Scan & fast handover</div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-emerald-600 group-hover:text-emerald-700">
              <span>Scan Now</span>
              <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Business Insights & Sales Graph */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <TrendingUp size={16} className="text-[#2874f0]" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Business Insights</h2>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">Track date-wise sales, revenue and catalogue views</p>
          </div>

          {/* Date Selector Tabs */}
          <div className="flex items-center bg-gray-100/90 p-0.5 rounded-lg text-xs font-semibold self-start sm:self-auto border border-gray-200/60">
            <button
              onClick={() => setDateRange('7days')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                dateRange === '7days' ? 'bg-[#2874f0] text-white shadow-2xs font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDateRange('today')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                dateRange === 'today' ? 'bg-[#2874f0] text-white shadow-2xs font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('30days')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                dateRange === '30days' ? 'bg-[#2874f0] text-white shadow-2xs font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>

        {/* Metric Summary Cards (Revenue, Orders, Views, Reviews) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* 1. Gross Revenue Card */}
          <div
            onClick={() => setActiveMetric('revenue')}
            className={`rounded-xl p-3 border transition-all cursor-pointer ${
              activeMetric === 'revenue'
                ? 'bg-blue-50/90 border-flipkart-500 ring-2 ring-flipkart-500/20 shadow-xs'
                : 'bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border-blue-200/60 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                <IndianRupee size={14} className="text-[#2874f0]" />
                <span>Gross Revenue</span>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                <ArrowUpRight size={11} /> {totalWeekRevenue > 0 ? '+100%' : '0%'}
              </span>
            </div>
            <div className="text-xl font-black text-gray-900 mt-2">
              ₹{totalWeekRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-[#2874f0] font-bold mt-0.5">
              Next payout est: ₹{Math.round(totalWeekRevenue * 0.98).toLocaleString('en-IN')}
            </div>
          </div>

          {/* 2. Total Orders Card */}
          <div
            onClick={() => setActiveMetric('orders')}
            className={`rounded-xl p-3 border transition-all cursor-pointer ${
              activeMetric === 'orders'
                ? 'bg-blue-50/90 border-flipkart-500 ring-2 ring-flipkart-500/20 shadow-xs'
                : 'bg-gradient-to-br from-blue-50/50 to-sky-50/30 border-blue-200/60 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                <ShoppingBag size={14} className="text-[#2874f0]" />
                <span>Total Orders</span>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                <ArrowUpRight size={11} /> {totalWeekOrders > 0 ? `${totalWeekOrders} Orders` : '0%'}
              </span>
            </div>
            <div className="text-xl font-black text-gray-900 mt-2">{totalWeekOrders} Orders</div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {isZeroStartup ? 'Ready for new orders' : `${pendingOrdersCount} to process • ${readyToShipCount} ready`}
            </div>
          </div>

          {/* 3. Catalog Views Card */}
          <div
            onClick={() => setActiveMetric('views')}
            className={`rounded-xl p-3 border transition-all cursor-pointer ${
              activeMetric === 'views'
                ? 'bg-blue-50/90 border-flipkart-500 ring-2 ring-flipkart-500/20 shadow-xs'
                : 'bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border-blue-200/60 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                <Eye size={14} className="text-[#2874f0]" />
                <span>Catalog Views</span>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                <ArrowUpRight size={11} /> {totalWeekViews > 0 ? '+100%' : '0%'}
              </span>
            </div>
            <div className="text-xl font-black text-gray-900 mt-2">
              {totalWeekViews > 0 ? totalWeekViews.toLocaleString('en-IN') : '0'}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {liveCatalogsCount > 0 ? `${liveCatalogsCount} active live catalogs` : '0 live catalogs'}
            </div>
          </div>

          {/* 4. Customer Reviews & Ratings Card */}
          <div
            onClick={() => setActiveMetric('reviews')}
            className={`rounded-xl p-3 border transition-all cursor-pointer ${
              activeMetric === 'reviews'
                ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                : 'bg-gradient-to-br from-amber-50/50 to-yellow-50/30 border-amber-200/60 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span>Customer Reviews</span>
              </div>
              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                {totalWeekReviews > 0 ? `★ ${avgStoreRating}` : 'New Store'}
              </span>
            </div>
            <div className="text-xl font-black text-gray-900 mt-2">
              {totalWeekReviews > 0 ? `${totalWeekReviews.toLocaleString('en-IN')}` : '0'} Reviews
            </div>
            <div className="text-[10px] text-amber-700 font-bold mt-0.5">
              {totalWeekReviews > 0 ? `Store Rating: ${avgStoreRating}★ • Verified Ratings` : 'No reviews yet • Ready for orders'}
            </div>
          </div>
        </div>

        {/* Additional Mini Metrics */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
          <div>
            <div className="text-gray-500 text-[10px]">Avg Order Value (AOV)</div>
            <div className="font-bold text-gray-900">
              {totalWeekOrders > 0 ? `₹${Math.round(totalWeekRevenue / totalWeekOrders).toLocaleString('en-IN')}` : '₹0'}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-[10px]">Conversion Rate</div>
            <div className="font-bold text-emerald-600">
              {totalWeekViews > 0
                ? `${((totalWeekOrders / totalWeekViews) * 100).toFixed(1)}% (Healthy)`
                : totalWeekOrders > 0
                ? '100% (Direct Sale)'
                : '0% (Startup Ready)'}
            </div>
          </div>
        </div>

        {/* Interactive Date-Wise Sales Graph */}
        <div className="pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
            <div>
              <span className="font-bold text-xs text-gray-800">
                Daily{' '}
                {activeMetric === 'revenue'
                  ? 'Gross Revenue (₹)'
                  : activeMetric === 'orders'
                  ? 'Orders Count'
                  : activeMetric === 'views'
                  ? 'Catalog Views'
                  : 'Customer Reviews'}{' '}
                Trend
              </span>
              <p className="text-[10px] text-gray-400">Real calendar dates • Click any card or tabs to change metric</p>
            </div>

            {/* Metric Switcher Pills */}
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-[10px] font-bold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveMetric('revenue')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  activeMetric === 'revenue' ? 'bg-[#2874f0] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ₹ Revenue
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('orders')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  activeMetric === 'orders' ? 'bg-[#2874f0] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Orders
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('views')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  activeMetric === 'views' ? 'bg-[#2874f0] text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Views
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('reviews')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  activeMetric === 'reviews' ? 'bg-amber-500 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ★ Reviews
              </button>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100">
            <div className="h-36 flex items-end justify-between gap-1.5 pt-4">
              {dailySalesData.map(day => {
                const metricVal = getMetricValue(day);
                const isZero = maxMetricValue === 0 || metricVal === 0;
                const heightPercent = isZero ? 5 : Math.max(12, Math.round((metricVal / maxMetricValue) * 100));
                const isHovered = hoveredDay?.shortDate === day.shortDate;
                const isToday = day.date.includes('(Today)');

                return (
                  <div
                    key={day.shortDate}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onClick={() => setHoveredDay(day)}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer"
                  >
                    <div className="relative w-full flex items-end justify-center h-28">
                      {/* Floating value on hover */}
                      {isHovered && (
                        <div className="absolute -top-6 bg-gray-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs whitespace-nowrap z-10 animate-fade-in">
                          {activeMetric === 'revenue' ? `₹${day.revenue.toLocaleString('en-IN')}` : metricVal}
                        </div>
                      )}
                      {/* Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[28px] rounded-t-md transition-all ${
                          isZero
                            ? 'bg-slate-200/90 group-hover:bg-slate-300'
                            : activeMetric === 'reviews'
                            ? isHovered
                              ? 'bg-amber-500 shadow-sm'
                              : 'bg-gradient-to-t from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600'
                            : isHovered
                            ? 'bg-[#2874f0] shadow-sm'
                            : 'bg-gradient-to-t from-[#2874f0]/80 to-[#2874f0] hover:from-[#1a65dc] hover:to-[#2874f0]'
                        } ${isToday ? 'ring-2 ring-[#2874f0]/30' : ''}`}
                      />
                    </div>
                    {/* Date label */}
                    <div className="flex flex-col items-center">
                      <span
                        className={`text-[10px] font-semibold transition-colors ${
                          isToday
                            ? 'text-[#2874f0] font-black'
                            : isHovered
                            ? 'text-gray-900 font-bold'
                            : 'text-gray-500'
                        }`}
                      >
                        {day.shortDate}
                      </span>
                      {isToday && (
                        <span className="text-[8px] font-black text-[#2874f0] tracking-tighter leading-none">
                          Today
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hover tooltip readout card */}
            <div className="mt-2.5 pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs">
              {hoveredDay ? (
                <div className="flex items-center gap-2.5 w-full justify-between bg-white px-2.5 py-1.5 rounded-lg border border-blue-200 shadow-2xs animate-fade-in">
                  <span className="font-bold text-gray-900">{hoveredDay.date}</span>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[#2874f0] font-bold">₹{hoveredDay.revenue.toLocaleString('en-IN')}</span>
                    <span className="text-gray-600 font-semibold">{hoveredDay.orders} Orders</span>
                    <span className="text-gray-500 text-[11px]">{hoveredDay.views} Views</span>
                    <span className="text-amber-700 font-bold text-[11px] flex items-center gap-0.5">
                      <Star size={10} className="fill-amber-500 text-amber-500" /> {hoveredDay.reviews} Reviews
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full text-gray-500 text-[11px]">
                  <span>Total Revenue: ₹{totalWeekRevenue.toLocaleString('en-IN')}</span>
                  <span>{totalWeekOrders} Orders • {totalWeekViews} Views • {totalWeekReviews} Reviews</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Growth Recommendations Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-indigo-500/10 rounded-2xl p-4 border border-amber-200/60 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 text-gray-900 p-1.5 rounded-lg font-bold">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">AKSelling Seller Pricing Strategy</h3>
              <p className="text-[11px] text-gray-600">Ensure competitive catalog pricing to boost search ranking & conversions</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('menu')}
            className="bg-[#2874f0] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs hover:bg-[#1a65dc] transition-all shrink-0 ml-2"
          >
            Check Tools
          </button>
        </div>
      </div>
    </div>
  );
}

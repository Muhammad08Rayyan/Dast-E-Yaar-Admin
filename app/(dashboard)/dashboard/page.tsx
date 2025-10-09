"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCog,
  FileText,
  ShoppingCart,
  TrendingUp,
  MapPin,
  Package,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface DashboardStats {
  users: number;
  doctors: {
    total: number;
    active: number;
    inactive: number;
    activeRate: string;
  };
  prescriptions: number;
  orders: {
    total: number;
    pending: number;
    processing: number;
    fulfilled: number;
    active: number;
    fulfillmentRate: string;
  };
  patients: number;
  products: number;
  districts: number;
  teams: number;
  activeTeams: number;
  activeKAMs: number;
}

interface Activity {
  id: string;
  type: string;
  prescriptionNumber: string;
  patient: {
    name: string;
    mrn: string;
  };
  doctor: {
    name: string;
    specialization: string;
  };
  status: string;
  medicationCount: number;
  createdAt: string;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  shopifyOrderId: string | null;
  patient: {
    name: string;
    mrn: string;
    phone: string;
  };
  status: string;
  totalAmount: number;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    doctors: {
      total: 0,
      active: 0,
      inactive: 0,
      activeRate: "0",
    },
    prescriptions: 0,
    orders: {
      total: 0,
      pending: 0,
      processing: 0,
      fulfilled: 0,
      active: 0,
      fulfillmentRate: "0",
    },
    patients: 0,
    products: 0,
    districts: 0,
    teams: 0,
    activeTeams: 0,
    activeKAMs: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  useEffect(() => {
    const initDashboard = async () => {
      await fetchDashboardData();
      // Auto-sync orders in the background after initial load, then every 10 seconds
      const now = Date.now();
      setLastSyncTime(now);
      syncActiveOrders();

      // Set up interval for syncing every 10 seconds
      const syncInterval = setInterval(() => {
        syncActiveOrders();
      }, 10000);

      return () => clearInterval(syncInterval);
    };
    initDashboard();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      // Fetch all dashboard data in parallel
      const [statsRes, activitiesRes, ordersRes] = await Promise.all([
        fetch("/api/dashboard/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/dashboard/activities", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/dashboard/recent-orders", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Check for authentication errors
      if (statsRes.status === 401 || activitiesRes.status === 401 || ordersRes.status === 401) {
        router.push("/login");
        return;
      }

      const [statsData, activitiesData, ordersData] = await Promise.all([
        statsRes.json(),
        activitiesRes.json(),
        ordersRes.json(),
      ]);

      if (statsData.success) {
        setStats(statsData.data);
      }
      if (activitiesData.success) {
        setActivities(activitiesData.data);
      }
      if (ordersData.success) {
        setRecentOrders(ordersData.data);
      }
    } catch (error: any) {
      console.error("Dashboard fetch error:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const syncActiveOrders = async () => {
    // Skip if already syncing
    if (syncing) return;

    try {
      setSyncing(true);
      const token = localStorage.getItem("token");

      // Get all active (non-fulfilled/non-cancelled) orders to sync
      const ordersResponse = await fetch("/api/orders?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const ordersData = await ordersResponse.json();

      if (ordersData.success && ordersData.data.orders) {
        // Filter to only sync non-fulfilled and non-cancelled orders
        const activeOrders = ordersData.data.orders.filter(
          (o: any) => o.order_status !== 'fulfilled' && o.order_status !== 'cancelled'
        );

        if (activeOrders.length > 0) {
          const orderIds = activeOrders.map((o: any) => o._id);

          await fetch("/api/orders/bulk-sync", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ order_ids: orderIds }),
          });

          // Refresh dashboard data to show updated stats (without triggering another sync)
          const now = Date.now();
          setLastSyncTime(now);
          await fetchDashboardData();
        }
      }
    } catch (error) {
      console.error("Failed to sync orders:", error);
      // Silently fail - don't disrupt user experience
    } finally {
      setSyncing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchDashboardData();
    await syncActiveOrders();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      fulfilled: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      processing: { color: "bg-orange-100 text-orange-800", icon: Activity },
      shipped: { color: "bg-purple-100 text-purple-800", icon: Package },
      cancelled: { color: "bg-red-100 text-red-800", icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const mainStatCards = [
    {
      title: "Total Patients",
      value: stats.patients,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/patients",
    },
    {
      title: "Total Doctors",
      value: stats.doctors.total,
      icon: UserCog,
      color: "text-green-600",
      bgColor: "bg-green-50",
      link: "/doctors",
    },
    {
      title: "Prescriptions",
      value: stats.prescriptions,
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      link: "/prescriptions",
    },
    {
      title: "Total Orders",
      value: stats.orders.total,
      icon: ShoppingCart,
      color: "text-[#D32F2F]",
      bgColor: "bg-red-50",
      subtitle: `${stats.orders.pending} pending`,
      link: "/orders",
    },
  ];

  const secondaryStatCards = [
    {
      title: "Active Teams",
      value: stats.activeTeams,
      icon: UsersRound,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      link: "/teams",
    },
    {
      title: "Active KAMs",
      value: stats.activeKAMs,
      icon: UserCog,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      link: "/users",
    },
    {
      title: "Total Products",
      value: stats.products,
      icon: Package,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      link: "/products",
    },
    {
      title: "Districts",
      value: stats.districts,
      icon: MapPin,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      link: "/districts",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D32F2F] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black">Super Admin Dashboard</h1>
          <p className="text-black mt-1">
            Welcome back! Here&apos;s your complete system overview.
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={syncing} variant="outline" className="text-black">
          <Activity className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {mainStatCards.map((stat) => (
          <Card
            key={stat.title}
            className={stat.link ? "cursor-pointer hover:shadow-lg transition-shadow" : ""}
            onClick={() => stat.link && router.push(stat.link)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-black mt-2">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {secondaryStatCards.map((stat) => (
          <Card
            key={stat.title}
            className={stat.link ? "cursor-pointer hover:shadow-lg transition-shadow" : ""}
            onClick={() => stat.link && router.push(stat.link)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-black mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-black">Order Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Pending Orders</span>
                <span className="text-2xl font-bold text-orange-600">{stats.orders.pending}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.orders.total > 0 ? (stats.orders.pending / stats.orders.total) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Processing Orders</span>
                <span className="text-2xl font-bold text-blue-600">{stats.orders.processing}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.orders.total > 0 ? (stats.orders.processing / stats.orders.total) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Fulfilled Orders</span>
                <span className="text-2xl font-bold text-green-600">{stats.orders.fulfilled}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.orders.total > 0 ? (stats.orders.fulfilled / stats.orders.total) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Fulfillment Rate</span>
                <span className="text-2xl font-bold text-blue-600">{stats.orders.fulfillmentRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${stats.orders.fulfillmentRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities and Orders */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Prescriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-black">Recent Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-black text-sm">
                        {activity.prescriptionNumber}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Patient: {activity.patient.name} ({activity.patient.mrn})
                      </p>
                      <p className="text-sm text-gray-600">
                        Doctor: {activity.doctor.name}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No recent prescriptions</p>
              )}
              {activities.length > 5 && (
                <Button
                  variant="outline"
                  className="w-full text-black"
                  onClick={() => router.push("/prescriptions")}
                >
                  View All Prescriptions
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-black">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-black text-sm">{order.orderNumber}</p>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Patient: {order.patient.name} ({order.patient.mrn})
                      </p>
                      <p className="text-sm font-semibold text-[#D32F2F] mt-2">
                        PKR {order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No recent orders</p>
              )}
              {recentOrders.length > 5 && (
                <Button
                  variant="outline"
                  className="w-full text-black"
                  onClick={() => router.push("/orders")}
                >
                  View All Orders
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-black">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => router.push("/doctors/new")}
              className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105"
            >
              <UserCog className="h-5 w-5 mx-auto mb-1" />
              <p className="font-medium text-sm">Add Doctor</p>
            </button>
            <button
              onClick={() => router.push("/patients/new")}
              className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all transform hover:scale-105"
            >
              <Users className="h-5 w-5 mx-auto mb-1" />
              <p className="font-medium text-sm">Add Patient</p>
            </button>
            <button
              onClick={() => router.push("/products")}
              className="px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all transform hover:scale-105"
            >
              <Package className="h-5 w-5 mx-auto mb-1" />
              <p className="font-medium text-sm">Manage Products</p>
            </button>
            <button
              onClick={() => router.push("/districts")}
              className="px-4 py-3 bg-gradient-to-r from-[#D32F2F] to-[#B71C1C] hover:from-[#B71C1C] hover:to-[#D32F2F] text-white rounded-lg transition-all transform hover:scale-105"
            >
              <MapPin className="h-5 w-5 mx-auto mb-1" />
              <p className="font-medium text-sm">Manage Districts</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

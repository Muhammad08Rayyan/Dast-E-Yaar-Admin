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
  TrendingDown,
  RefreshCw,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPrescriptions: 0,
    totalOrders: 0,
    pendingOrders: 0,
    fulfilledOrders: 0,
  });
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    // TODO: Fetch real stats from API
    // For now, using placeholder data
    setStats({
      totalUsers: 12,
      totalDoctors: 45,
      totalPrescriptions: 1234,
      totalOrders: 987,
      pendingOrders: 23,
      fulfilledOrders: 964,
    });
  }, []);

  const handleSyncProducts = async () => {
    setSyncing(true);
    setSyncMessage('');
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      console.log('Token preview:', token?.substring(0, 20) + '...');
      
      const response = await fetch('/api/products/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setSyncMessage(`✓ ${data.message}. Added: ${data.data.addedCount}, Updated: ${data.data.updatedCount}`);
      } else {
        const errorMsg = data.error?.message || data.message || 'Failed to sync products';
        setSyncMessage(`✗ ${errorMsg}`);
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      setSyncMessage(`✗ Failed to sync products: ${error.message || 'Network error'}`);
    } finally {
      setSyncing(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+12%",
      trending: "up",
    },
    {
      title: "Total Doctors",
      value: stats.totalDoctors,
      icon: UserCog,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+8%",
      trending: "up",
    },
    {
      title: "Prescriptions",
      value: stats.totalPrescriptions,
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+23%",
      trending: "up",
    },
    {
      title: "Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-[#D32F2F]",
      bgColor: "bg-red-50",
      change: "+15%",
      trending: "up",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black">Dashboard</h1>
          <p className="text-black mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <Button onClick={handleSyncProducts} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Shopify Products'}
        </Button>
      </div>

      {/* Sync Message */}
      {syncMessage && (
        <div className={`p-4 rounded-md ${syncMessage.startsWith('✓') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-sm ${syncMessage.startsWith('✓') ? 'text-green-900' : 'text-red-900'}`}>
            {syncMessage}
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">{stat.title}</p>
                  <p className="text-3xl font-bold text-black mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2 text-sm">
                    {stat.trending === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span
                      className={stat.trending === "up" ? "text-green-600" : "text-red-600"}
                    >
                      {stat.change}
                    </span>
                    <span className="text-black ml-1">from last month</span>
                  </div>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Status */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-black">Pending Orders</span>
                <span className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full"
                  style={{
                    width: `${(stats.pendingOrders / stats.totalOrders) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-black">Fulfilled Orders</span>
                <span className="text-2xl font-bold text-green-600">{stats.fulfilledOrders}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${(stats.fulfilledOrders / stats.totalOrders) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <p className="font-medium text-black">Add New Doctor</p>
                <p className="text-sm text-black">Create a new doctor account</p>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <p className="font-medium text-black">Manage Products</p>
                <p className="text-sm text-black">Update product catalog</p>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <p className="font-medium text-black">View Reports</p>
                <p className="text-sm text-black">Generate analytics reports</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-black">
            <p>Recent activity will be displayed here</p>
            <p className="text-sm mt-2">Coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


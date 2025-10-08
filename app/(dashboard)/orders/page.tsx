"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Eye, Package, TrendingUp } from "lucide-react";

interface Order {
  _id: string;
  shopify_order_number: string;
  patient_info: {
    mrn: string;
    name: string;
    phone: string;
    address?: string;
  };
  doctor_info: {
    doctor_id: string;
    name: string;
    district_id: {
      _id: string;
      name: string;
      code: string;
    };
  };
  order_status: string;
  financial_status: string;
  fulfillment_status: string;
  total_amount: number;
  currency: string;
  created_at: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [financialStatus, setFinancialStatus] = useState("");
  const [fulfillmentStatus, setFulfillmentStatus] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    fulfilled: 0,
    cancelled: 0,
  });

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, orderStatus, financialStatus, fulfillmentStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append("search", search);
      if (orderStatus) params.append("order_status", orderStatus);
      if (financialStatus) params.append("financial_status", financialStatus);
      if (fulfillmentStatus) params.append("fulfillment_status", fulfillmentStatus);

      const response = await fetch(`/api/orders?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.data.orders);
        setPagination(data.data.pagination);

        // Calculate stats
        const allOrders = data.data.orders;
        setStats({
          total: data.data.pagination.total,
          pending: allOrders.filter((o: Order) => o.order_status === "pending").length,
          processing: allOrders.filter((o: Order) => o.order_status === "processing").length,
          fulfilled: allOrders.filter((o: Order) => o.order_status === "fulfilled").length,
          cancelled: allOrders.filter((o: Order) => o.order_status === "cancelled").length,
        });

        // Sync orders with Shopify in the background
        if (data.data.orders.length > 0) {
          syncOrdersInBackground(data.data.orders);
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const syncOrdersInBackground = async (ordersToSync: Order[]) => {
    try {
      const token = localStorage.getItem("token");
      
      // Only sync active orders (not fulfilled or cancelled)
      const activeOrders = ordersToSync.filter(
        (o) => o.order_status !== "fulfilled" && o.order_status !== "cancelled"
      );

      if (activeOrders.length === 0) {
        return; // No orders to sync
      }

      const orderIds = activeOrders.map((o) => o._id);

      const response = await fetch("/api/orders/bulk-sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order_ids: orderIds }),
      });

      const data = await response.json();

      if (data.success && data.data.orders) {
        // Merge synced orders with existing fulfilled/cancelled orders
        const syncedOrdersMap = new Map(data.data.orders.map((o: Order) => [o._id, o]));
        const updatedOrders = ordersToSync.map((o) => syncedOrdersMap.get(o._id) || o) as Order[];
        
        setOrders(updatedOrders);

        // Recalculate stats with synced data
        setStats((prevStats) => ({
          ...prevStats,
          pending: updatedOrders.filter((o: Order) => o.order_status === "pending").length,
          processing: updatedOrders.filter((o: Order) => o.order_status === "processing").length,
          fulfilled: updatedOrders.filter((o: Order) => o.order_status === "fulfilled").length,
          cancelled: updatedOrders.filter((o: Order) => o.order_status === "cancelled").length,
        }));
      }
    } catch (error) {
      console.error("Error syncing orders:", error);
      // Silently fail - user still sees cached data
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      fulfilled: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      paid: "bg-green-100 text-green-800",
      refunded: "bg-red-100 text-red-800",
      unfulfilled: "bg-gray-100 text-black",
      partial: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-black";
  };

  const formatDate = (obj: any, keys: string[]) => {
    for (const key of keys) {
      const value = obj?.[key];
      if (!value) continue;
      const dt = new Date(value);
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      }
    }
    // Fallback: derive from ObjectId timestamp if possible
    const id = obj?._id;
    if (typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)) {
      const ts = parseInt(id.substring(0, 8), 16) * 1000;
      const dt = new Date(ts);
      return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return 'N/A';
  };

  return (
    <div className="space-y-6 text-black">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-black">Orders</h1>
        <p className="text-black mt-1">
          Manage and track all orders. Click on any order to view details and sync with Shopify.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Total Orders</p>
                <p className="text-3xl font-bold text-black mt-2">{stats.total}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Processing</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.processing}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Fulfilled</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.fulfilled}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-full">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Cancelled</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.cancelled}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-full">
                <Package className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-black">Filter Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex gap-2 text-black">
                <Input
                  placeholder="Search by MRN, patient name, order number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
            >
              <option value="">All Order Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
              value={fulfillmentStatus}
              onChange={(e) => setFulfillmentStatus(e.target.value)}
            >
              <option value="">All Fulfillment</option>
              <option value="unfulfilled">Unfulfilled</option>
              <option value="partial">Partial</option>
              <option value="fulfilled">Fulfilled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-black">Orders List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#D32F2F] border-r-transparent"></div>
              <p className="mt-2 text-black">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-black">
              <Package className="h-12 w-12 mx-auto mb-4 text-black" />
              <p>No orders found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                    <TableHead className="text-black">Order #</TableHead>
                    <TableHead className="text-black">Patient</TableHead>
                    <TableHead className="text-black">MRN</TableHead>
                    <TableHead className="text-black">Doctor</TableHead>
                    <TableHead className="text-black">District</TableHead>
                    <TableHead className="text-black">Amount</TableHead>
                    <TableHead className="text-black">Status</TableHead>
                    <TableHead className="text-black">Fulfillment</TableHead>
                    <TableHead className="text-black">Date</TableHead>
                    <TableHead className="text-black">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">
                          {order.shopify_order_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-black">{order.patient_info.name}</p>
                            <p className="text-sm text-black">{order.patient_info.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>{order.patient_info.mrn}</TableCell>
                        <TableCell>{order.doctor_info.name}</TableCell>
                        <TableCell>
                          {order.doctor_info.district_id?.name || "N/A"}
                        </TableCell>
                        <TableCell>
                          {order.currency} {order.total_amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.order_status)}>
                            {order.order_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.fulfillment_status)}>
                            {order.fulfillment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(order, ['created_at', 'createdAt', 'shopify_created_at', 'shopifyCreatedAt'])}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/orders/${order._id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-black">
                  Showing {orders.length} of {pagination.total} orders
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page - 1 })
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.pages}
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page + 1 })
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


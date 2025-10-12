"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Search, Eye, FileText, AlertCircle } from "lucide-react";

interface Prescription {
  _id: string;
  mrn: string;
  patient_id: {
    _id: string;
    name: string;
    phone: string;
    age?: number;
    gender?: string;
    city?: string;
  };
  doctor_id: {
    _id: string;
    name: string;
    email: string;
    specialty: string;
  };
  district_id: {
    _id: string;
    name: string;
    code: string;
  };
  diagnosis?: string;
  priority: string;
  order_status: string;
  created_at: string;
}

export default function PrescriptionsPage() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    fulfilled: 0,
    urgent: 0,
  });

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append("search", search);
      if (orderStatus) params.append("order_status", orderStatus);

      const response = await fetch(`/api/prescriptions?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPrescriptions(data.data.prescriptions);
        setPagination(data.data.pagination);

        const allPrescriptions = data.data.prescriptions;
        setStats({
          total: data.data.pagination.total,
          pending: allPrescriptions.filter((p: Prescription) => p.order_status === "pending").length,
          fulfilled: allPrescriptions.filter((p: Prescription) => p.order_status === "fulfilled").length,
          urgent: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, orderStatus, search]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchPrescriptions();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      fulfilled: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      urgent: "bg-orange-100 text-orange-800",
      emergency: "bg-red-100 text-red-800",
      normal: "bg-gray-100 text-black",
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
      <div>
        <h1 className="text-3xl font-bold text-black">Prescriptions</h1>
        <p className="text-black mt-1">View and manage all prescriptions</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Total</p>
                <p className="text-3xl font-bold text-black mt-2">{stats.total}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
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
                <FileText className="h-6 w-6 text-yellow-600" />
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
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Urgent</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.urgent}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-black">Filter Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by MRN, patient name..."
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
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-black">Prescriptions List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#D32F2F] border-r-transparent"></div>
              <p className="mt-2 text-black">Loading prescriptions...</p>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="text-center py-8 text-black">
              <FileText className="h-12 w-12 mx-auto mb-4 text-black" />
              <p>No prescriptions found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                    <TableHead className="text-black">MRN</TableHead>
                    <TableHead className="text-black">Patient</TableHead>
                    <TableHead className="text-black">Doctor</TableHead>
                    <TableHead className="text-black">District</TableHead>
                    <TableHead className="text-black">Status</TableHead>
                    <TableHead className="text-black">Date</TableHead>
                    <TableHead className="text-black">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prescriptions.map((prescription) => (
                      <TableRow key={prescription._id}>
                        <TableCell className="font-mono">{prescription.mrn}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-black">{prescription.patient_id.name}</p>
                            <p className="text-sm text-black">{prescription.patient_id.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-black">{prescription.doctor_id.name}</p>
                            <p className="text-xs text-black">{prescription.doctor_id.specialty}</p>
                          </div>
                        </TableCell>
                        <TableCell>{prescription.district_id.name}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(prescription.order_status)}>
                            {prescription.order_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(prescription, ['created_at', 'createdAt'])}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/prescriptions/${prescription._id}`)}
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

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-black">
                  Showing {prescriptions.length} of {pagination.total} prescriptions
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
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


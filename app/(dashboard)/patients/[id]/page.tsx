"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Package,
  UserCog,
} from "lucide-react";

interface Patient {
  _id: string;
  mrn: string;
  name: string;
  phone: string;
  age?: number;
  gender?: string;
  city?: string;
  address?: string;
  created_by: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    specialty: string;
    district_id?: {
      name: string;
      code: string;
    };
  };
  created_at: string;
  updated_at: string;
}

interface Prescription {
  _id: string;
  prescription_text: string;
  diagnosis?: string;
  priority: string;
  order_status: string;
  doctor_id: {
    name: string;
    email: string;
    specialty: string;
  };
  district_id: {
    name: string;
    code: string;
  };
  created_at: string;
}

interface Order {
  _id: string;
  shopify_order_number: string;
  order_status: string;
  fulfillment_status: string;
  total_amount: number;
  currency: string;
  doctor_info: {
    name: string;
    district_id?: {
      name: string;
    };
  };
  created_at: string;
}

interface PatientData {
  patient: Patient;
  prescriptions: Prescription[];
  orders: Order[];
  stats: {
    totalPrescriptions: number;
    totalOrders: number;
  };
}

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatient();
  }, [params.id]);

  const fetchPatient = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/patients/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching patient:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      fulfilled: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      unfulfilled: "bg-gray-100 text-black",
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-4 border-[#D32F2F] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-black">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 mx-auto mb-4 text-black" />
        <h2 className="text-2xl font-bold text-black mb-2">Patient Not Found</h2>
        <p className="text-black mb-4">The patient you're looking for doesn't exist.</p>
        <Button onClick={() => router.push("/patients")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patients
        </Button>
      </div>
    );
  }

  const { patient, prescriptions, orders, stats } = data;

  return (
    <div className="space-y-6 text-black">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/patients")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-black">{patient.name}</h1>
            <p className="text-black mt-1">MRN: {patient.mrn}</p>
          </div>
        </div>
        {patient.gender && (
          <Badge className={
            patient.gender === "male"
              ? "bg-blue-100 text-blue-800"
              : patient.gender === "female"
              ? "bg-pink-100 text-pink-800"
              : "bg-gray-100 text-black"
          }>
            {patient.gender}
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Total Prescriptions</p>
                <p className="text-3xl font-bold text-black mt-2">{stats.totalPrescriptions}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-full">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Total Orders</p>
                <p className="text-3xl font-bold text-black mt-2">{stats.totalOrders}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-full">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-black">Full Name</p>
              <p className="text-lg font-semibold">{patient.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">MRN</p>
              <p className="text-lg font-mono">{patient.mrn}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">Phone</p>
              <p className="text-lg flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {patient.phone}
              </p>
            </div>
            {patient.age && (
              <div>
                <p className="text-sm font-medium text-black">Age</p>
                <p className="text-lg">{patient.age} years</p>
              </div>
            )}
            {patient.city && (
              <div>
                <p className="text-sm font-medium text-black">City</p>
                <p className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {patient.city}
                </p>
              </div>
            )}
            {patient.address && (
              <div>
                <p className="text-sm font-medium text-black">Address</p>
                <p className="text-lg">{patient.address}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-black">Registered On</p>
              <p className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(patient, ['created_at', 'createdAt'])}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Doctor Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Registered By
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-black">Doctor Name</p>
              <p className="text-lg font-semibold">{patient.created_by.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">Email</p>
              <p className="text-lg">{patient.created_by.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">Phone</p>
              <p className="text-lg flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {patient.created_by.phone}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">Specialty</p>
              <p className="text-lg">{patient.created_by.specialty}</p>
            </div>
            {patient.created_by.district_id && (
              <div>
                <p className="text-sm font-medium text-black">District</p>
                <p className="text-lg">
                  {patient.created_by.district_id.name} ({patient.created_by.district_id.code})
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Prescriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <div className="text-center py-8 text-black">
              <FileText className="h-12 w-12 mx-auto mb-4 text-black" />
              <p>No prescriptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptions.map((prescription) => (
                    <TableRow key={prescription._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{prescription.doctor_id.name}</p>
                          <p className="text-xs text-black">{prescription.doctor_id.specialty}</p>
                        </div>
                      </TableCell>
                      <TableCell>{prescription.district_id.name}</TableCell>
                      <TableCell>{prescription.diagnosis || "N/A"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(prescription.priority)}>
                          {prescription.priority}
                        </Badge>
                      </TableCell>
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
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-black">
              <Package className="h-12 w-12 mx-auto mb-4 text-black" />
              <p>No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Order Status</TableHead>
                    <TableHead>Fulfillment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">
                        {order.shopify_order_number}
                      </TableCell>
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
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


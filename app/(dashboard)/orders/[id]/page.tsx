"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, User, MapPin, Phone, DollarSign, FileText } from "lucide-react";

interface Order {
  _id: string;
  shopify_order_id: string;
  shopify_order_number: string;
  patient_info: {
    mrn: string;
    name: string;
    phone: string;
    address?: string;
  };
  doctor_info: {
    doctor_id: {
      _id: string;
      name: string;
      email: string;
      phone: string;
      specialty: string;
    };
    name: string;
    district_id: {
      _id: string;
      name: string;
      code: string;
    };
  };
  prescription_id: {
    _id: string;
    prescription_text: string;
    diagnosis?: string;
    priority: string;
    patient_id: {
      name: string;
      mrn: string;
      phone: string;
      age?: number;
      gender?: string;
      city?: string;
    };
    doctor_id: {
      name: string;
      email: string;
      specialty: string;
    };
  };
  order_status: string;
  financial_status: string;
  fulfillment_status: string;
  tracking_number?: string;
  tracking_url?: string;
  total_amount: number;
  currency: string;
  shopify_created_at?: string;
  created_at: string;
  updated_at: string;
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/orders/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setOrder(data.data.order);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
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
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-4 border-[#D32F2F] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-black">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto mb-4 text-black" />
        <h2 className="text-2xl font-bold text-black mb-2">Order Not Found</h2>
        <p className="text-black mb-4">The order you're looking for doesn't exist.</p>
        <Button onClick={() => router.push("/orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-black">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-black">
              Order {order.shopify_order_number}
            </h1>
            <p className="text-black mt-1">
              Created on {formatDate(order, ['created_at', 'createdAt', 'shopify_created_at', 'shopifyCreatedAt'])}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className={getStatusColor(order.order_status)}>
            {order.order_status}
          </Badge>
          <Badge className={getStatusColor(order.financial_status)}>
            {order.financial_status}
          </Badge>
          <Badge className={getStatusColor(order.fulfillment_status)}>
            {order.fulfillment_status}
          </Badge>
        </div>
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
              <p className="text-sm font-medium text-black">Name</p>
              <p className="text-lg font-semibold">{order.patient_info.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">MRN</p>
              <p className="text-lg">{order.patient_info.mrn}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">Phone</p>
              <p className="text-lg flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {order.patient_info.phone}
              </p>
            </div>
            {order.prescription_id?.patient_id?.city && (
              <div>
                <p className="text-sm font-medium text-black">City</p>
                <p className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {order.prescription_id.patient_id.city}
                </p>
              </div>
            )}
            {order.prescription_id?.patient_id?.age && (
              <div>
                <p className="text-sm font-medium text-black">Age / Gender</p>
                <p className="text-lg">
                  {order.prescription_id.patient_id.age} years
                  {order.prescription_id.patient_id.gender && 
                    ` / ${order.prescription_id.patient_id.gender}`
                  }
                </p>
              </div>
            )}
            {order.patient_info.address && (
              <div>
                <p className="text-sm font-medium text-black">Address</p>
                <p className="text-lg">{order.patient_info.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doctor & District Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Doctor & District
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-black">Doctor Name</p>
              <p className="text-lg font-semibold">{order.doctor_info.name}</p>
            </div>
            {order.doctor_info.doctor_id && (
              <>
                <div>
                  <p className="text-sm font-medium text-black">Email</p>
                  <p className="text-lg">{order.doctor_info.doctor_id.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-black">Phone</p>
                  <p className="text-lg flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {order.doctor_info.doctor_id.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-black">Specialty</p>
                  <p className="text-lg">{order.doctor_info.doctor_id.specialty}</p>
                </div>
              </>
            )}
            <div>
              <p className="text-sm font-medium text-black">District</p>
              <p className="text-lg font-semibold">
                {order.doctor_info.district_id?.name || "N/A"}
                {order.doctor_info.district_id?.code && 
                  ` (${order.doctor_info.district_id.code})`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-black">Shopify Order ID</p>
                <p className="text-lg font-mono">{order.shopify_order_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-black">Order Number</p>
                <p className="text-lg font-semibold">{order.shopify_order_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-black">Total Amount</p>
                <p className="text-2xl font-bold text-green-600 flex items-center gap-2">
                  <DollarSign className="h-6 w-6" />
                  {order.currency} {order.total_amount.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-black">Order Status</p>
                <Badge className={`${getStatusColor(order.order_status)} text-base px-3 py-1`}>
                  {order.order_status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-black">Financial Status</p>
                <Badge className={`${getStatusColor(order.financial_status)} text-base px-3 py-1`}>
                  {order.financial_status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-black">Fulfillment Status</p>
                <Badge className={`${getStatusColor(order.fulfillment_status)} text-base px-3 py-1`}>
                  {order.fulfillment_status}
                </Badge>
              </div>
            </div>
          </div>

          {(order.tracking_number || order.tracking_url) && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Tracking Information</h4>
              {order.tracking_number && (
                <p className="text-sm text-blue-800">
                  Tracking Number: <span className="font-mono">{order.tracking_number}</span>
                </p>
              )}
              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Track Package →
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prescription Information */}
      {order.prescription_id && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Prescription Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.prescription_id.diagnosis && (
              <div>
                <p className="text-sm font-medium text-black">Diagnosis</p>
                <p className="text-lg">{order.prescription_id.diagnosis}</p>
              </div>
            )}
            <div>
            <p className="text-sm font-medium text-black">Prescription</p>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                <p className="whitespace-pre-wrap">{order.prescription_id.prescription_text}</p>
              </div>
            </div>
            <div>
                <p className="text-sm font-medium text-black">Priority</p>
              <Badge className={
                order.prescription_id.priority === "urgent" 
                  ? "bg-orange-100 text-orange-800"
                  : order.prescription_id.priority === "emergency"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-black"
              }>
                {order.prescription_id.priority}
              </Badge>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(`/prescriptions/${order.prescription_id._id}`)}
            >
              View Full Prescription
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  );
}


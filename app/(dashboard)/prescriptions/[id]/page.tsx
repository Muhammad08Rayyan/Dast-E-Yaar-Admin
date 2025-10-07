"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, User, Phone, MapPin, Package } from "lucide-react";

interface Prescription {
  _id: string;
  mrn: string;
  patient_id: {
    _id: string;
    name: string;
    mrn: string;
    phone: string;
    age?: number;
    gender?: string;
    city?: string;
    address?: string;
  };
  doctor_id: {
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
  district_id: {
    _id: string;
    name: string;
    code: string;
  };
  prescription_text: string;
  prescription_files: string[];
  duration_days: number;
  priority: string;
  selected_product?: {
    name: string;
    sku: string;
    price: number;
    quantity: number;
  };
  diagnosis?: string;
  notes?: string;
  shopify_order_id?: string;
  order_status: string;
  created_at: string;
  updated_at: string;
}

interface Order {
  _id: string;
  shopify_order_number: string;
  order_status: string;
  financial_status: string;
  fulfillment_status: string;
  tracking_number?: string;
  tracking_url?: string;
  total_amount: number;
  currency: string;
  created_at: string;
}

export default function PrescriptionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescription();
  }, [params.id]);

  const fetchPrescription = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/prescriptions/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPrescription(data.data.prescription);
        setOrder(data.data.order);
      }
    } catch (error) {
      console.error("Error fetching prescription:", error);
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
      urgent: "bg-orange-100 text-orange-800",
      emergency: "bg-red-100 text-red-800",
      normal: "bg-gray-100 text-black",
      unfulfilled: "bg-gray-100 text-black",
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
          <p className="text-black">Loading prescription...</p>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 mx-auto mb-4 text-black" />
        <h2 className="text-2xl font-bold text-black mb-2">Prescription Not Found</h2>
        <Button onClick={() => router.push("/prescriptions")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Prescriptions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-black">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/prescriptions")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-black">Prescription Details</h1>
            <p className="text-black mt-1">MRN: {prescription.mrn}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className={getStatusColor(prescription.priority)}>
            {prescription.priority}
          </Badge>
          <Badge className={getStatusColor(prescription.order_status)}>
            {prescription.order_status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
              <p className="text-lg font-semibold">{prescription.patient_id.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">MRN</p>
              <p className="text-lg font-mono">{prescription.patient_id.mrn}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">Phone</p>
              <p className="text-lg flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {prescription.patient_id.phone}
              </p>
            </div>
            {prescription.patient_id.age && (
              <div>
                <p className="text-sm font-medium text-black">Age / Gender</p>
                <p className="text-lg">
                  {prescription.patient_id.age} years
                  {prescription.patient_id.gender && ` / ${prescription.patient_id.gender}`}
                </p>
              </div>
            )}
            {prescription.patient_id.city && (
              <div>
                <p className="text-sm font-medium text-black">City</p>
                <p className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {prescription.patient_id.city}
                </p>
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => router.push(`/patients/${prescription.patient_id._id}`)}
            >
              View Patient Profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Doctor Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-black">Name</p>
              <p className="text-lg font-semibold">{prescription.doctor_id.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">Email</p>
              <p className="text-lg">{prescription.doctor_id.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">Phone</p>
              <p className="text-lg flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {prescription.doctor_id.phone}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">Specialty</p>
              <p className="text-lg">{prescription.doctor_id.specialty}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">District</p>
              <p className="text-lg font-semibold">
                {prescription.district_id.name} ({prescription.district_id.code})
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(`/doctors/${prescription.doctor_id._id}`)}
            >
              View Doctor Profile
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Prescription Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {prescription.diagnosis && (
            <div>
              <p className="text-sm font-medium text-black">Diagnosis</p>
              <p className="text-lg">{prescription.diagnosis}</p>
            </div>
          )}
          
          <div>
            <p className="text-sm font-medium text-black">Prescription</p>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
              <p className="whitespace-pre-wrap text-lg">{prescription.prescription_text}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-black">Duration</p>
              <p className="text-lg font-semibold">{prescription.duration_days} days</p>
            </div>
            <div>
              <p className="text-sm font-medium text-black">Priority</p>
              <Badge className={`${getStatusColor(prescription.priority)} text-base px-3 py-1`}>
                {prescription.priority}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-black">Status</p>
              <Badge className={`${getStatusColor(prescription.order_status)} text-base px-3 py-1`}>
                {prescription.order_status}
              </Badge>
            </div>
          </div>

          {prescription.notes && (
            <div>
              <p className="text-sm font-medium text-black">Additional Notes</p>
              <div className="mt-2 p-4 bg-blue-50 rounded-lg">
                <p className="whitespace-pre-wrap">{prescription.notes}</p>
              </div>
            </div>
          )}

          {prescription.prescription_files && prescription.prescription_files.length > 0 && (
            <div>
              <p className="text-sm font-medium text-black mb-2">Prescription Files</p>
              <div className="space-y-2">
                {prescription.prescription_files.map((file, index) => (
                  <a
                    key={index}
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <FileText className="h-5 w-5 text-black" />
                    <span className="text-blue-600 hover:underline">View File {index + 1}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {prescription.selected_product && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-black">Product Name</p>
                <p className="text-lg font-semibold">{prescription.selected_product.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-black">SKU</p>
                <p className="text-lg font-mono">{prescription.selected_product.sku}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-black">Quantity</p>
                <p className="text-lg">{prescription.selected_product.quantity}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-black">Price per Unit</p>
                <p className="text-lg font-semibold">
                  PKR {prescription.selected_product.price.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {order && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-black">Order Number</p>
                <p className="text-lg font-semibold">{order.shopify_order_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-black">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  {order.currency} {order.total_amount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-black">Order Status</p>
                <Badge className={`${getStatusColor(order.order_status)} text-base px-3 py-1`}>
                  {order.order_status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-black">Fulfillment Status</p>
                <Badge className={`${getStatusColor(order.fulfillment_status)} text-base px-3 py-1`}>
                  {order.fulfillment_status}
                </Badge>
              </div>
            </div>

            {order.tracking_number && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Tracking Information</h4>
                <p className="text-sm text-blue-800">
                  Tracking Number: <span className="font-mono">{order.tracking_number}</span>
                </p>
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

            <Button
              variant="outline"
              onClick={() => router.push(`/orders/${order._id}`)}
            >
              View Full Order Details
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Building, Activity, FileText, ShoppingBag } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

interface Doctor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  pmdc_number: string;
  specialty: string;
  team_id?: { _id: string; name: string };
  district_id: { _id: string; name: string; code: string };
  kam_id: { _id: string; name: string; email: string } | null;
  status: string;
  created_at: string;
}

interface Stats {
  total_prescriptions: number;
  total_orders: number;
  prescriptions_by_status: any[];
  orders_by_status: any[];
}

interface Prescription {
  _id: string;
  mrn: string;
  patient_id: { name: string; mrn: string };
  order_status: string;
  createdAt: string;
}

export default function DoctorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPrescriptions, setRecentPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCurrentUserRole(data.data.role || '');
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  }, []);

  const fetchDoctorDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/doctors/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setDoctor(data.data.doctor);
      }
    } catch (error) {
      console.error('Error fetching doctor:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchDoctorStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/doctors/${params.id}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data.stats);
        setRecentPrescriptions(data.data.recent_prescriptions);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [params.id]);

  useEffect(() => {
    fetchCurrentUser();
    fetchDoctorDetails();
    fetchDoctorStats();
  }, [fetchCurrentUser, fetchDoctorDetails, fetchDoctorStats]);

  const getPrescriptionStatusCount = (status: string) => {
    if (!stats) return 0;
    const item = stats.prescriptions_by_status.find((s: any) => s._id === status);
    return item ? item.count : 0;
  };

  const getOrderStatusCount = (status: string) => {
    if (!stats) return 0;
    const item = stats.orders_by_status.find((s: any) => s._id === status);
    return item ? item.count : 0;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-black">Loading doctor details...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="p-8 text-center">
        <p className="text-black">Doctor not found</p>
        <Button onClick={() => router.push('/doctors')} className="mt-4">
          Back to Doctors
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/doctors')}
            className="text-black"
          >
            <ArrowLeft className="h-4 w-4 mr-2 text-black" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-black">{doctor.name}</h1>
            <p className="text-black">{doctor.specialty}</p>
          </div>
        </div>
        <Badge variant={doctor.status === 'active' ? 'success' : 'default'}>
          {doctor.status}
        </Badge>
      </div>

      {/* Doctor Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-black">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-black" />
              <div>
                <p className="text-sm text-black">Email</p>
                <p className="font-medium text-black">{doctor.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-black" />
              <div>
                <p className="text-sm text-black">Phone</p>
                <p className="font-medium text-black">{doctor.phone}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-black" />
              <div>
                <p className="text-sm text-black">PMDC Number</p>
                <p className="font-medium text-black">{doctor.pmdc_number}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-black">Assignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-black">Team</p>
              <p className="font-medium text-black">
                {doctor.team_id?.name || 'Not assigned'}
              </p>
            </div>
            <div>
              <p className="text-sm text-black">District</p>
              <p className="font-medium text-black">
                {doctor.district_id.name} ({doctor.district_id.code})
              </p>
            </div>
            <div>
              <p className="text-sm text-black">Assigned KAM</p>
              {doctor.kam_id ? (
                <div>
                  <p className="font-medium text-black">{doctor.kam_id.name}</p>
                  <p className="text-sm text-black">{doctor.kam_id.email}</p>
                </div>
              ) : (
                <p className="text-black">Not assigned</p>
              )}
            </div>
            <div>
              <p className="text-sm text-black">Joined Date</p>
              <p className="font-medium text-black">
                {new Date(doctor.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      {stats && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-black">Performance Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-black">Total Prescriptions</p>
                    <p className="text-2xl font-bold text-black">{stats.total_prescriptions}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-black">Total Orders</p>
                    <p className="text-2xl font-bold text-black">{stats.total_orders}</p>
                  </div>
                  <ShoppingBag className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-black">Pending</p>
                    <p className="text-2xl font-bold text-black">
                      {getPrescriptionStatusCount('pending')}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-black">Fulfilled</p>
                    <p className="text-2xl font-bold text-black">
                      {getOrderStatusCount('fulfilled')}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recent Prescriptions - Only show for super_admin */}
      {currentUserRole === 'super_admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-black">Recent Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPrescriptions.length === 0 ? (
              <p className="text-black text-center py-8">No prescriptions yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-black">MRN</TableHead>
                    <TableHead className="text-black">Patient Name</TableHead>
                    <TableHead className="text-black">Status</TableHead>
                    <TableHead className="text-black">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPrescriptions.map((prescription) => (
                    <TableRow key={prescription._id}>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm text-black">
                          {prescription.patient_id.mrn}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium text-black">
                        {prescription.patient_id.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            prescription.order_status === 'fulfilled'
                              ? 'success'
                              : prescription.order_status === 'processing'
                              ? 'info'
                              : prescription.order_status === 'cancelled'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {prescription.order_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-black">
                        {new Date(prescription.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


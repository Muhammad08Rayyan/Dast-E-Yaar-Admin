'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Doctor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  pmdc_number: string;
  specialty: string;
  district_id: { _id: string; name: string; code: string };
  kam_id: { _id: string; name: string; email: string } | null;
  status: string;
  created_at: string;
}

interface District {
  _id: string;
  name: string;
  code: string;
}

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    pmdc_number: '',
    specialty: '',
    district_id: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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

  const fetchDistricts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/districts?status=active&limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setDistricts(data.data.districts || []);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (specialtyFilter) params.append('specialty', specialtyFilter);
      params.append('limit', '100'); // Get more doctors

      console.log('Fetching doctors with params:', params.toString());
      const response = await fetch(`/api/doctors?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Doctors API response status:', response.status);
      const data = await response.json();
      console.log('Doctors API response data:', data);
      
      if (data.success) {
        console.log('Setting doctors:', data.data.doctors?.length || 0, 'doctors');
        setDoctors(data.data.doctors || []);
      } else {
        console.error('Failed to fetch doctors:', data);
        alert(`Failed to load doctors: ${data.error?.message || data.message || 'Unknown error'}`);
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      alert(`Error loading doctors: ${error}`);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [search, specialtyFilter]);

  useEffect(() => {
    fetchCurrentUser();
    fetchDistricts();
    fetchDoctors();
  }, [fetchCurrentUser, fetchDistricts, fetchDoctors]);

  const handleCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      pmdc_number: '',
      specialty: '',
      district_id: '',
    });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const handleEdit = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setFormData({
      name: doctor.name,
      email: doctor.email,
      password: '',
      phone: doctor.phone,
      pmdc_number: doctor.pmdc_number,
      specialty: doctor.specialty,
      district_id: doctor.district_id._id,
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const handleDelete = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (isCreateOpen && !formData.password) errors.password = 'Password is required';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (!formData.pmdc_number.trim()) errors.pmdc_number = 'PMDC number is required';
    if (!formData.specialty.trim()) errors.specialty = 'Specialty is required';
    if (!formData.district_id) errors.district_id = 'District is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const url = isEditOpen ? `/api/doctors/${selectedDoctor?._id}` : '/api/doctors';
      const method = isEditOpen ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setIsCreateOpen(false);
        setIsEditOpen(false);
        fetchDoctors();
      } else {
        alert(data.error?.message || 'Failed to save doctor');
      }
    } catch (error) {
      console.error('Error saving doctor:', error);
      alert('Failed to save doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedDoctor) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/doctors/${selectedDoctor._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setIsDeleteOpen(false);
        fetchDoctors();
      } else {
        alert(data.error?.message || 'Failed to delete doctor');
      }
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert('Failed to delete doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (doctor: Doctor) => {
    const newStatus = doctor.status === 'active' ? 'inactive' : 'active';
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/doctors/${doctor._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        fetchDoctors();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Doctor Management</h1>
          <p className="text-black">
            {currentUserRole === 'kam' ? 'View doctors in your district' : 'Manage doctors and their assignments'}
          </p>
        </div>
        {currentUserRole === 'super_admin' && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Doctor
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black" />
              <Input
                placeholder="Search doctors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)}>
              <option value="">All Specialties</option>
              <option value="General Physician">General Physician</option>
              <option value="Cardiologist">Cardiologist</option>
              <option value="Pediatrician">Pediatrician</option>
              <option value="Dermatologist">Dermatologist</option>
              <option value="Gynecologist">Gynecologist</option>
              <option value="Orthopedic">Orthopedic</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Doctors Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-black">Loading doctors...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-black">No doctors found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black">Name</TableHead>
                  <TableHead className="text-black">Email</TableHead>
                  <TableHead className="text-black">Phone</TableHead>
                  <TableHead className="text-black">PMDC</TableHead>
                  <TableHead className="text-black">Specialty</TableHead>
                  <TableHead className="text-black">Status</TableHead>
                  <TableHead className="text-black">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((doctor) => (
                  <TableRow key={doctor._id}>
                    <TableCell className="font-medium text-black">{doctor.name}</TableCell>
                    <TableCell className="text-black">{doctor.email}</TableCell>
                    <TableCell className="text-black">{doctor.phone}</TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs text-black">
                        {doctor.pmdc_number}
                      </code>
                    </TableCell>
                    <TableCell className="text-black">{doctor.specialty}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleStatus(doctor)}
                        className="cursor-pointer"
                      >
                        <Badge variant={doctor.status === 'active' ? 'success' : 'default'}>
                          {doctor.status}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/doctors/${doctor._id}`)}
                        >
                          <Eye className="h-4 w-4 text-black" />
                        </Button>
                        {currentUserRole === 'super_admin' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(doctor)}
                            >
                              <Edit className="h-4 w-4 text-black" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(doctor)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={() => {
        setIsCreateOpen(false);
        setIsEditOpen(false);
      }}>
        <DialogContent onClose={() => {
          setIsCreateOpen(false);
          setIsEditOpen(false);
        }} className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-black">{isEditOpen ? 'Edit Doctor' : 'Create New Doctor'}</DialogTitle>
              <DialogDescription>
                {isEditOpen ? 'Update doctor information' : 'Add a new doctor to the system'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Dr. John Doe"
                  />
                  {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <Label required>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="doctor@example.com"
                  />
                  {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+92-300-1234567"
                  />
                  {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
                </div>

                <div>
                  <Label required={isCreateOpen}>Password {isEditOpen && '(leave blank to keep current)'}</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required>PMDC Number</Label>
                  <Input
                    value={formData.pmdc_number}
                    onChange={(e) => setFormData({ ...formData, pmdc_number: e.target.value })}
                    placeholder="12345-A"
                  />
                  {formErrors.pmdc_number && <p className="text-red-500 text-sm mt-1">{formErrors.pmdc_number}</p>}
                </div>

                <div>
                  <Label required>Specialty</Label>
                  <Select
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  >
                    <option value="">Select Specialty</option>
                    <option value="General Physician">General Physician</option>
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Pediatrician">Pediatrician</option>
                    <option value="Dermatologist">Dermatologist</option>
                    <option value="Gynecologist">Gynecologist</option>
                    <option value="Orthopedic">Orthopedic</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Psychiatrist">Psychiatrist</option>
                  </Select>
                  {formErrors.specialty && <p className="text-red-500 text-sm mt-1">{formErrors.specialty}</p>}
                </div>
              </div>

              <div>
                <Label required>District</Label>
                <Select
                  value={formData.district_id}
                  onChange={(e) => setFormData({ ...formData, district_id: e.target.value })}
                >
                  <option value="">Select District</option>
                  {districts.map((district) => (
                    <option key={district._id} value={district._id}>
                      {district.name} ({district.code})
                    </option>
                  ))}
                </Select>
                {formErrors.district_id && <p className="text-red-500 text-sm mt-1">{formErrors.district_id}</p>}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  setIsEditOpen(false);
                }}
                disabled={submitting}
                className="text-black"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : isEditOpen ? 'Update Doctor' : 'Create Doctor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent onClose={() => setIsDeleteOpen(false)}>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedDoctor?.name}</strong>? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete Doctor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


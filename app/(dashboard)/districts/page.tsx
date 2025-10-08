'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
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

interface District {
  _id: string;
  name: string;
  code: string;
  kam_id: { _id: string; name: string; email: string } | null;
  status: string;
  created_at: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function DistrictsPage() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [kams, setKams] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    kam_id: '',
    status: 'active',
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
        setCurrentUser(data.data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  }, []);

  const fetchDistricts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '100'); // Get more districts

      const response = await fetch(`/api/districts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setDistricts(data.data.districts || []);
      } else {
        console.error('Failed to fetch districts:', data);
        setDistricts([]);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
      setDistricts([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const fetchKAMs = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users?role=kam&limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setKams(data.data.users);
      }
    } catch (error) {
      console.error('Error fetching KAMs:', error);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
    fetchDistricts();
    fetchKAMs();
  }, [fetchCurrentUser, fetchDistricts, fetchKAMs]);

  const handleCreate = () => {
    setFormData({
      name: '',
      code: '',
      kam_id: '',
      status: 'active',
    });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const handleEdit = (district: District) => {
    setSelectedDistrict(district);
    setFormData({
      name: district.name,
      code: district.code,
      kam_id: district.kam_id?._id || '',
      status: district.status,
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const handleDelete = (district: District) => {
    setSelectedDistrict(district);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.code.trim()) errors.code = 'Code is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const url = isEditOpen ? `/api/districts/${selectedDistrict?._id}` : '/api/districts';
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
        fetchDistricts();
      } else {
        alert(data.error?.message || 'Failed to save district');
      }
    } catch (error) {
      console.error('Error saving district:', error);
      alert('Failed to save district');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedDistrict) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/districts/${selectedDistrict._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setIsDeleteOpen(false);
        fetchDistricts();
      } else {
        alert(data.error?.message || 'Failed to delete district');
      }
    } catch (error) {
      console.error('Error deleting district:', error);
      alert('Failed to delete district');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (district: District) => {
    const newStatus = district.status === 'active' ? 'inactive' : 'active';
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/districts/${district._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        fetchDistricts();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const isSuperAdmin = currentUser?.role === 'super_admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">District Management</h1>
          <p className="text-black">Manage districts and team assignments</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add District
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
                placeholder="Search by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Districts Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-black">Loading districts...</p>
            </div>
          ) : districts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-black">No districts found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black">District Name</TableHead>
                  <TableHead className="text-black">Code</TableHead>
                  <TableHead className="text-black">Assigned KAM</TableHead>
                  <TableHead className="text-black">Status</TableHead>
                  {isSuperAdmin && <TableHead className="text-black">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {districts.map((district) => (
                  <TableRow key={district._id}>
                    <TableCell className="font-medium text-black">{district.name}</TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm text-black">
                        {district.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      {district.kam_id ? (
                        <div>
                          <div className="font-medium text-black">{district.kam_id.name}</div>
                          <div className="text-sm text-black">{district.kam_id.email}</div>
                        </div>
                      ) : (
                        <span className="text-black text-sm">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isSuperAdmin ? (
                        <button
                          onClick={() => toggleStatus(district)}
                          className="cursor-pointer"
                        >
                          <Badge variant={district.status === 'active' ? 'success' : 'default'}>
                            {district.status}
                          </Badge>
                        </button>
                      ) : (
                        <Badge variant={district.status === 'active' ? 'success' : 'default'}>
                          {district.status}
                        </Badge>
                      )}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(district)}
                          >
                            <Edit className="h-4 w-4 text-black" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(district)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
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
        }}>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-black">{isEditOpen ? 'Edit District' : 'Create New District'}</DialogTitle>
              <DialogDescription>
                {isEditOpen ? 'Update district information' : 'Add a new district to the system'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 p-6">
              <div>
                <Label required>District Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Gulberg, DHA, Model Town"
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <Label required>District Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., LHE-GLB"
                />
                {formErrors.code && <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>}
              </div>

              <div>
                <Label>Assigned KAM</Label>
                <Select
                  value={formData.kam_id}
                  onChange={(e) => setFormData({ ...formData, kam_id: e.target.value })}
                >
                  <option value="">No KAM Assigned</option>
                  {kams.map((kam) => (
                    <option key={kam._id} value={kam._id}>
                      {kam.name} ({kam.email})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label required>Status</Label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
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
                {submitting ? 'Saving...' : isEditOpen ? 'Update District' : 'Create District'}
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
              Are you sure you want to delete <strong>{selectedDistrict?.name}</strong>? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={submitting}
              className="text-black"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete District'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


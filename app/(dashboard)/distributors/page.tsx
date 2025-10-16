'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface Distributor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}

export default function DistributorsPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchDistributors = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '100');

      const response = await fetch(`/api/distributors?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setDistributors(data.data.distributors || []);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchDistributors();
  }, [fetchDistributors]);

  const handleCreate = () => {
    setFormData({ name: '', email: '', password: '', phone: '' });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const handleEdit = (distributor: Distributor) => {
    setSelectedDistributor(distributor);
    setFormData({
      name: distributor.name,
      email: distributor.email,
      password: '',
      phone: distributor.phone,
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const handleDelete = (distributor: Distributor) => {
    setSelectedDistributor(distributor);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (!isEditOpen && !formData.password) errors.password = 'Password is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const url = isEditOpen ? `/api/distributors/${selectedDistributor?._id}` : '/api/distributors';
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
        fetchDistributors();
        setIsCreateOpen(false);
        setIsEditOpen(false);
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch (error) {
      alert('Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedDistributor) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/distributors/${selectedDistributor._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        fetchDistributors();
        setIsDeleteOpen(false);
      } else {
        alert(data.message || 'Delete failed');
      }
    } catch (error) {
      alert('Delete failed');
    }
  };

  const toggleStatus = async (distributor: Distributor) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = distributor.status === 'active' ? 'inactive' : 'active';

      const response = await fetch(`/api/distributors/${distributor._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        fetchDistributors();
      }
    } catch (error) {
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Distributors</h1>
          <p className="text-black mt-1">Manage distributor accounts and assignments</p>
        </div>
        <Button onClick={handleCreate} className="bg-[#D32F2F] hover:bg-[#B71C1C]">
          <Plus className="h-4 w-4 mr-2" />
          Add Distributor
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
              <Input
                placeholder="Search distributors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-black">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distributors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-black">
                      No distributors found
                    </TableCell>
                  </TableRow>
                ) : (
                  distributors.map((distributor) => (
                    <TableRow key={distributor._id}>
                      <TableCell className="font-medium">{distributor.name}</TableCell>
                      <TableCell>{distributor.email}</TableCell>
                      <TableCell>{distributor.phone}</TableCell>
                      <TableCell>
                        <Badge
                          variant={distributor.status === 'active' ? 'success' : 'warning'}
                          className="cursor-pointer"
                          onClick={() => toggleStatus(distributor)}
                        >
                          {distributor.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(distributor.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(distributor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(distributor)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditOpen ? 'Edit Distributor' : 'Create Distributor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password {isEditOpen && '(leave blank to keep current)'}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateOpen(false);
              setIsEditOpen(false);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-[#D32F2F] hover:bg-[#B71C1C]">
              {submitting ? 'Saving...' : isEditOpen ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Distributor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedDistributor?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

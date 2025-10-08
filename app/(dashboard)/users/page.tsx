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

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  assigned_district: { _id: string; name: string; code: string } | null;
  created_at: string;
}

interface District {
  _id: string;
  name: string;
  code: string;
}

export default function KAMsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    assigned_district: '',
    status: 'active',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('role', 'kam');
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '100'); // Get more users

      const response = await fetch(`/api/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users || []);
      } else {
        console.error('Failed to fetch users:', data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching KAMs:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const fetchDistricts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/districts?status=active&limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setDistricts(data.data.districts);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchDistricts();
  }, [fetchUsers, fetchDistricts]);

  const handleCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      assigned_district: '',
      status: 'active',
    });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      assigned_district: user.assigned_district?._id || '',
      status: user.status,
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (isCreateOpen && !formData.password) errors.password = 'Password is required';
    if (!formData.assigned_district) errors.assigned_district = 'District is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const url = isEditOpen ? `/api/users/${selectedUser?._id}` : '/api/users';
      const method = isEditOpen ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, role: 'kam' }),
      });

      const data = await response.json();
      if (data.success) {
        setIsCreateOpen(false);
        setIsEditOpen(false);
        fetchUsers();
      } else {
        alert(data.error?.message || 'Failed to save KAM');
      }
    } catch (error) {
      console.error('Error saving KAM:', error);
      alert('Failed to save KAM');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setIsDeleteOpen(false);
        fetchUsers();
      } else {
        alert(data.error?.message || 'Failed to delete KAM');
      }
    } catch (error) {
      console.error('Error deleting KAM:', error);
      alert('Failed to delete KAM');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${user._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        fetchUsers();
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
          <h1 className="text-2xl font-bold text-black">Key Account Managers</h1>
          <p className="text-black">Manage KAMs and their district assignments</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add KAM
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black" />
              <Input
                placeholder="Search by name or email..."
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

      {/* KAMs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-black">Loading KAMs...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-black">No KAMs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black">Name</TableHead>
                  <TableHead className="text-black">Email</TableHead>
                  <TableHead className="text-black">Assigned District</TableHead>
                  <TableHead className="text-black">Status</TableHead>
                  <TableHead className="text-black">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium text-black">{user.name}</TableCell>
                    <TableCell className="text-black">{user.email}</TableCell>
                    <TableCell>
                      {user.assigned_district ? (
                        <div>
                          <div className="font-medium text-black">{user.assigned_district.name}</div>
                          <div className="text-sm text-black">{user.assigned_district.code}</div>
                        </div>
                      ) : (
                        <span className="text-black">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleStatus(user)}
                        className="cursor-pointer"
                      >
                        <Badge variant={user.status === 'active' ? 'success' : 'default'}>
                          {user.status}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4 text-black" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
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
        }}>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-black">{isEditOpen ? 'Edit KAM' : 'Create New KAM'}</DialogTitle>
              <DialogDescription>
                {isEditOpen ? 'Update KAM information' : 'Add a new Key Account Manager'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 p-6">
              <div>
                <Label required>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <Label required>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
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

              <div>
                <Label required>Assigned District</Label>
                <Select
                  value={formData.assigned_district}
                  onChange={(e) => setFormData({ ...formData, assigned_district: e.target.value })}
                >
                  <option value="">Select District</option>
                  {districts.map((district) => (
                    <option key={district._id} value={district._id}>
                      {district.name} ({district.code})
                    </option>
                  ))}
                </Select>
                {formErrors.assigned_district && <p className="text-red-500 text-sm mt-1">{formErrors.assigned_district}</p>}
                <p className="text-xs text-black mt-1">Each KAM is assigned to one district</p>
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
                {submitting ? 'Saving...' : isEditOpen ? 'Update KAM' : 'Create KAM'}
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
              Are you sure you want to delete <strong>{selectedUser?.name}</strong>? 
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
              {submitting ? 'Deleting...' : 'Delete KAM'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

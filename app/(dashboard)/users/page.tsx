'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
// import { Badge } from '@/components/ui/badge';
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
  team_id: { _id: string; name: string } | null;
  district_id: { _id: string; name: string; code: string } | null;
  created_at: string;
}

interface District {
  _id: string;
  name: string;
  code: string;
}

interface Team {
  _id: string;
  name: string;
  district_id: { _id: string; name: string };
}

export default function KAMsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
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
    team_id: '',
    district_id: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('role', 'kam');
      if (search) params.append('search', search);
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
  }, [search]);

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

  const fetchTeams = useCallback(async (districtId?: string) => {
    try {
      const token = localStorage.getItem('token');
      const url = districtId 
        ? `/api/teams/by-district/${districtId}`
        : '/api/teams?status=active&limit=100';
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTeams(data.data.teams);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
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
      team_id: '',
      district_id: '',
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
      team_id: user.team_id?._id || '',
      district_id: user.district_id?._id || '',
    });
    setFormErrors({});
    // Fetch teams for the selected district
    if (user.district_id?._id) {
      fetchTeams(user.district_id._id);
    }
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
    if (!formData.district_id) errors.district_id = 'District is required';
    if (!formData.team_id) errors.team_id = 'Team is required';
    
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

  // const toggleStatus = async (user: User) => {
  //   const newStatus = user.status === 'active' ? 'inactive' : 'active';
  //   try {
  //     const token = localStorage.getItem('token');
  //     const response = await fetch(`/api/users/${user._id}/status`, {
  //       method: 'PATCH',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({ status: newStatus }),
  //     });

  //     const data = await response.json();
  //     if (data.success) {
  //       fetchUsers();
  //     }
  //   } catch (error) {
  //     console.error('Error toggling status:', error);
  //   }
  // };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Key Account Managers</h1>
          <p className="text-black">Manage KAMs and their team & district assignments</p>
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
                  <TableHead className="text-black">Team</TableHead>
                  <TableHead className="text-black">District</TableHead>
                  <TableHead className="text-black">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium text-black">{user.name}</TableCell>
                    <TableCell className="text-black">{user.email}</TableCell>
                    <TableCell>
                      {user.team_id ? (
                        <span className="font-medium text-black">{user.team_id.name}</span>
                      ) : (
                        <span className="text-gray-500 italic">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.district_id ? (
                        <div>
                          <div className="font-medium text-black">{user.district_id.name}</div>
                          <div className="text-sm text-gray-600">{user.district_id.code}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">Not assigned</span>
                      )}
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
                <Label required>District</Label>
                <Select
                  value={formData.district_id}
                  onChange={(e) => {
                    const districtId = e.target.value;
                    setFormData({ ...formData, district_id: districtId, team_id: '' });
                    if (districtId) {
                      fetchTeams(districtId);
                    } else {
                      setTeams([]);
                    }
                  }}
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

              <div>
                <Label required>Team</Label>
                <Select
                  value={formData.team_id}
                  onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                  disabled={!formData.district_id}
                >
                  <option value="">Select Team</option>
                  {teams.map((team) => (
                    <option key={team._id} value={team._id}>
                      {team.name}
                    </option>
                  ))}
                </Select>
                {formErrors.team_id && <p className="text-red-500 text-sm mt-1">{formErrors.team_id}</p>}
                <p className="text-xs text-gray-600 mt-1">Each KAM is assigned to one team. Select district first.</p>
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

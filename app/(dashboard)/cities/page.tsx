'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Building2, User } from 'lucide-react';
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
import { Select } from '@/components/ui/select';

interface City {
  _id: string;
  name: string;
  distributor_channel: 'pillbox' | 'other';
  distributor_id?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    distributor_channel: 'pillbox' as 'pillbox' | 'other',
    distributor_name: '',
    distributor_email: '',
    distributor_phone: '',
    distributor_password: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchCities = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '100');

      const response = await fetch(`/api/cities?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCities(data.data.cities || []);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const handleCreate = () => {
    setFormData({
      name: '',
      distributor_channel: 'pillbox',
      distributor_name: '',
      distributor_email: '',
      distributor_phone: '',
      distributor_password: '',
    });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const handleEdit = (city: City) => {
    setSelectedCity(city);
    setFormData({
      name: city.name,
      distributor_channel: city.distributor_channel,
      distributor_name: city.distributor_id?.name || '',
      distributor_email: city.distributor_id?.email || '',
      distributor_phone: city.distributor_id?.phone || '',
      distributor_password: '',
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const handleDelete = (city: City) => {
    setSelectedCity(city);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'City name is required';
    }

    if (formData.distributor_channel === 'other') {
      if (!formData.distributor_name.trim()) {
        errors.distributor_name = 'Distributor name is required';
      }
      if (!formData.distributor_email.trim()) {
        errors.distributor_email = 'Distributor email is required';
      }
      if (!formData.distributor_phone.trim()) {
        errors.distributor_phone = 'Distributor phone is required';
      }
      if (!selectedCity && !formData.distributor_password.trim()) {
        errors.distributor_password = 'Distributor password is required';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitCreate = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload: any = {
        name: formData.name,
        distributor_channel: formData.distributor_channel,
      };

      if (formData.distributor_channel === 'other') {
        payload.distributor_name = formData.distributor_name;
        payload.distributor_email = formData.distributor_email;
        payload.distributor_phone = formData.distributor_phone;
        payload.distributor_password = formData.distributor_password;
      }

      console.log('Sending payload:', payload);
      const response = await fetch('/api/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setIsCreateOpen(false);
        fetchCities();
      } else {
        console.error('Create city error:', data);
        setFormErrors({ submit: data.error?.message || 'Failed to create city' });
      }
    } catch (error) {
      console.error('Create city exception:', error);
      setFormErrors({ submit: 'Failed to create city' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!validateForm() || !selectedCity) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/cities/${selectedCity._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: formData.name }),
      });

      const data = await response.json();
      if (data.success) {
        setIsEditOpen(false);
        fetchCities();
      } else {
        setFormErrors({ submit: data.error?.message || 'Failed to update city' });
      }
    } catch (error) {
      setFormErrors({ submit: 'Failed to update city' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedCity) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/cities/${selectedCity._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setIsDeleteOpen(false);
        fetchCities();
      } else {
        alert(data.error?.message || 'Failed to delete city');
      }
    } catch (error) {
      alert('Failed to delete city');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cities</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage cities and their distributor channels
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add City
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search cities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cities Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="py-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#D32F2F] border-t-transparent"></div>
            </div>
          ) : cities.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No cities found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Get started by creating a new city.
              </p>
              <Button onClick={handleCreate} className="mt-6">
                <Plus className="mr-2 h-4 w-4" />
                Add City
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City Name</TableHead>
                  <TableHead>Distributor Channel</TableHead>
                  <TableHead>Distributor</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cities.map((city) => (
                  <TableRow key={city._id}>
                    <TableCell className="font-medium text-black">{city.name}</TableCell>
                    <TableCell>
                      <Badge variant={city.distributor_channel === 'pillbox' ? 'default' : 'info'}>
                        {city.distributor_channel === 'pillbox' ? 'PillBox (Shopify)' : 'Other'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {city.distributor_id ? (
                        <div className="text-sm">
                          <div className="font-medium text-black">{city.distributor_id.name}</div>
                          <div className="text-black">{city.distributor_id.email}</div>
                        </div>
                      ) : (
                        <span className="text-black">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(city)}
                          className="text-black hover:text-black"
                        >
                          <Edit className="h-4 w-4 text-black" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(city)}
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

      {/* Create City Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-black">Add New City</DialogTitle>
            <DialogDescription>
              Create a new city and assign its distributor channel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-6">
            {/* City Name */}
            <div className="space-y-2">
              <Label htmlFor="name">City Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter city name"
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>

            {/* Distributor Channel */}
            <div className="space-y-2">
              <Label htmlFor="channel">Distributor Channel *</Label>
              <Select
                id="channel"
                value={formData.distributor_channel}
                onChange={(e) =>
                  setFormData({ ...formData, distributor_channel: e.target.value as 'pillbox' | 'other' })
                }
              >
                <option value="pillbox">PillBox (Shopify)</option>
                <option value="other">Other</option>
              </Select>
            </div>

            {/* Distributor Details (only if "Other" is selected) */}
            {formData.distributor_channel === 'other' && (
              <>
                <div className="rounded-lg border bg-gray-50 p-4">
                  <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="h-4 w-4" />
                    Distributor Information
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="distributor_name">Distributor Name *</Label>
                      <Input
                        id="distributor_name"
                        value={formData.distributor_name}
                        onChange={(e) =>
                          setFormData({ ...formData, distributor_name: e.target.value })
                        }
                        placeholder="Enter distributor name"
                      />
                      {formErrors.distributor_name && (
                        <p className="text-sm text-red-500">{formErrors.distributor_name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="distributor_email">Email *</Label>
                      <Input
                        id="distributor_email"
                        type="email"
                        value={formData.distributor_email}
                        onChange={(e) =>
                          setFormData({ ...formData, distributor_email: e.target.value })
                        }
                        placeholder="Enter email"
                      />
                      {formErrors.distributor_email && (
                        <p className="text-sm text-red-500">{formErrors.distributor_email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="distributor_phone">Phone Number *</Label>
                      <Input
                        id="distributor_phone"
                        value={formData.distributor_phone}
                        onChange={(e) =>
                          setFormData({ ...formData, distributor_phone: e.target.value })
                        }
                        placeholder="Enter phone number"
                      />
                      {formErrors.distributor_phone && (
                        <p className="text-sm text-red-500">{formErrors.distributor_phone}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="distributor_password">Password *</Label>
                      <Input
                        id="distributor_password"
                        type="password"
                        value={formData.distributor_password}
                        onChange={(e) =>
                          setFormData({ ...formData, distributor_password: e.target.value })
                        }
                        placeholder="Enter password"
                      />
                      {formErrors.distributor_password && (
                        <p className="text-sm text-red-500">{formErrors.distributor_password}</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {formErrors.submit && (
              <p className="text-sm text-red-500">{formErrors.submit}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="border-black text-black hover:bg-black hover:text-white">
              Cancel
            </Button>
            <Button onClick={handleSubmitCreate} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create City'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit City Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-black">Edit City</DialogTitle>
            <DialogDescription>
              Update city name. Distributor channel cannot be changed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="edit_name">City Name *</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter city name"
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>

            {formErrors.submit && (
              <p className="text-sm text-red-500">{formErrors.submit}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="border-black text-black hover:bg-black hover:text-white">
              Cancel
            </Button>
            <Button onClick={handleSubmitEdit} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update City'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete City Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-black">Delete City</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCity?.name}?
              {selectedCity?.distributor_id && (
                <span className="block mt-2 text-amber-600">
                  This will also delete the associated distributor account.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="border-black text-black hover:bg-black hover:text-white">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmitDelete}
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

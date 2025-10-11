'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface City {
  _id: string;
  name: string;
  distributor_channel: 'pillbox' | 'local';
  distributor_id?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
}

interface Distributor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
}

export default function DistrictCitiesPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [district, setDistrict] = useState<any>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isAddCityOpen, setIsAddCityOpen] = useState(false);
  const [isEditCityOpen, setIsEditCityOpen] = useState(false);
  const [isDeleteCityOpen, setIsDeleteCityOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  // Form states
  const [cityForm, setCityForm] = useState({
    name: '',
    distributor_channel: 'pillbox' as 'pillbox' | 'local',
    distributor_id: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchDistrictCities = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/districts/${params.id}/cities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setDistrict({
          _id: data.data.districtId,
          name: data.data.districtName,
        });
        setCities(data.data.cities || []);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchDistributors = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/distributors?status=active&limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setDistributors(data.data.distributors || []);
      }
    } catch (error) {
      console.error('Error fetching distributors:', error);
    }
  }, []);

  useEffect(() => {
    fetchDistrictCities();
    fetchDistributors();
  }, [fetchDistrictCities, fetchDistributors]);

  const handleAddCity = () => {
    setCityForm({ name: '', distributor_channel: 'pillbox', distributor_id: '' });
    setFormErrors({});
    setIsAddCityOpen(true);
  };

  const handleEditCity = (city: City) => {
    setSelectedCity(city);
    setCityForm({
      name: city.name,
      distributor_channel: city.distributor_channel,
      distributor_id: city.distributor_id?._id || '',
    });
    setFormErrors({});
    setIsEditCityOpen(true);
  };

  const handleDeleteCity = (city: City) => {
    setSelectedCity(city);
    setIsDeleteCityOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!cityForm.name.trim()) errors.name = 'City name is required';
    if (cityForm.distributor_channel === 'local' && !cityForm.distributor_id) {
      errors.distributor_id = 'Distributor is required for local channel';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const url = isEditCityOpen
        ? `/api/districts/${params.id}/cities/${selectedCity?._id}`
        : `/api/districts/${params.id}/cities`;
      const method = isEditCityOpen ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cityForm),
      });

      const data = await response.json();
      if (data.success) {
        fetchDistrictCities();
        setIsAddCityOpen(false);
        setIsEditCityOpen(false);
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedCity) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/districts/${params.id}/cities/${selectedCity._id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchDistrictCities();
        setIsDeleteCityOpen(false);
      } else {
        alert(data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting city:', error);
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/districts')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Districts
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-black">
              {district?.name} - Cities
            </h1>
            <p className="text-black mt-1">
              Manage cities and distributor assignments
            </p>
          </div>
        </div>
        <Button
          onClick={handleAddCity}
          className="bg-[#D32F2F] hover:bg-[#B71C1C]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add City
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-8 text-black">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City Name</TableHead>
                  <TableHead>Distribution Channel</TableHead>
                  <TableHead>Distributor</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-black">
                      No cities added yet
                    </TableCell>
                  </TableRow>
                ) : (
                  cities.map((city) => (
                    <TableRow key={city._id}>
                      <TableCell className="font-medium">{city.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            city.distributor_channel === 'pillbox'
                              ? 'info'
                              : 'success'
                          }
                        >
                          {city.distributor_channel === 'pillbox'
                            ? 'PillBox (Shopify)'
                            : 'Local Distributor'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {city.distributor_channel === 'local' &&
                        city.distributor_id ? (
                          <div>
                            <div className="font-medium">
                              {city.distributor_id.name}
                            </div>
                            <div className="text-sm text-black">
                              {city.distributor_id.email}
                            </div>
                            <div className="text-sm text-black">
                              {city.distributor_id.phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-black">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCity(city)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCity(city)}
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

      {/* Add/Edit City Dialog */}
      <Dialog
        open={isAddCityOpen || isEditCityOpen}
        onOpenChange={(open) => {
          setIsAddCityOpen(false);
          setIsEditCityOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditCityOpen ? 'Edit City' : 'Add City'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cityName">City Name</Label>
              <Input
                id="cityName"
                value={cityForm.name}
                onChange={(e) =>
                  setCityForm({ ...cityForm, name: e.target.value })
                }
                placeholder="e.g., Lahore, Karachi"
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="channel">Distribution Channel</Label>
              <select
                id="channel"
                value={cityForm.distributor_channel}
                onChange={(e) =>
                  setCityForm({
                    ...cityForm,
                    distributor_channel: e.target.value as 'pillbox' | 'local',
                    distributor_id:
                      e.target.value === 'pillbox' ? '' : cityForm.distributor_id,
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="pillbox">PillBox (Shopify)</option>
                <option value="local">Local Distributor</option>
              </select>
            </div>

            {cityForm.distributor_channel === 'local' && (
              <div>
                <Label htmlFor="distributor">Select Distributor</Label>
                <select
                  id="distributor"
                  value={cityForm.distributor_id}
                  onChange={(e) =>
                    setCityForm({ ...cityForm, distributor_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">-- Select Distributor --</option>
                  {distributors.map((dist) => (
                    <option key={dist._id} value={dist._id}>
                      {dist.name} ({dist.email})
                    </option>
                  ))}
                </select>
                {formErrors.distributor_id && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.distributor_id}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddCityOpen(false);
                setIsEditCityOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#D32F2F] hover:bg-[#B71C1C]"
            >
              {submitting ? 'Saving...' : isEditCityOpen ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteCityOpen} onOpenChange={setIsDeleteCityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete City</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCity?.name}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteCityOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

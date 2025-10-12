'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Users, TrendingUp, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Team {
  _id: string;
  name: string;
  description: string;
  district_id: { _id: string; name: string; code: string };
  kam?: { _id: string; name: string; email: string } | null;
  status: string;
  stats?: {
    doctors: number;
    prescriptions: number;
  };
  created_at: string;
}

interface District {
  _id: string;
  name: string;
  code: string;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  description?: string;
  isAssigned: boolean;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Product management states
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [savingProducts, setSavingProducts] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
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
        setCurrentUser(data.data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (districtFilter) params.append('district_id', districtFilter);
      params.append('limit', '100');

      const response = await fetch(`/api/teams?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTeams(data.data.teams || []);
      } else {
        console.error('Failed to fetch teams:', data);
        setTeams([]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [search, districtFilter]);

  const fetchDistricts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/districts?limit=100', {
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

  const fetchTeamProducts = useCallback(async (teamId: string) => {
    setLoadingProducts(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teams/${teamId}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.data.products || []);
        const assigned = data.data.products
          .filter((p: Product) => p.isAssigned)
          .map((p: Product) => p._id);
        setSelectedProductIds(assigned);
      }
    } catch (error) {
      console.error('Error fetching team products:', error);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
    fetchDistricts();
  }, [fetchCurrentUser, fetchDistricts]);

  useEffect(() => {
    if (currentUser) {
      fetchTeams();
    }
  }, [currentUser, fetchTeams]);

  const handleCreateTeam = async () => {
    // Validate form
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Team name is required';
    if (!formData.district_id) errors.district_id = 'District is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setIsCreateOpen(false);
        setFormData({ name: '', description: '', district_id: '' });
        setFormErrors({});
        fetchTeams();
        alert('Team created successfully!');
      } else {
        alert(data.message || 'Failed to create team');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      alert('An error occurred while creating the team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam) return;

    // Validate form
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Team name is required';
    if (!formData.district_id) errors.district_id = 'District is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teams/${selectedTeam._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setIsEditOpen(false);
        setSelectedTeam(null);
        setFormData({ name: '', description: '', district_id: '' });
        setFormErrors({});
        fetchTeams();
        alert('Team updated successfully!');
      } else {
        alert(data.message || 'Failed to update team');
      }
    } catch (error) {
      console.error('Error updating team:', error);
      alert('An error occurred while updating the team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teams/${selectedTeam._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setIsDeleteOpen(false);
        setSelectedTeam(null);
        fetchTeams();
        alert('Team deactivated successfully!');
      } else {
        alert(data.message || 'Failed to deactivate team');
      }
    } catch (error) {
      console.error('Error deactivating team:', error);
      alert('An error occurred while deactivating the team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveProducts = async () => {
    if (!selectedTeam) return;

    setSavingProducts(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teams/${selectedTeam._id}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds: selectedProductIds }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Products assigned successfully!');
        setIsProductsOpen(false);
        setProductSearch('');
      } else {
        alert(data.error?.message || 'Failed to assign products');
      }
    } catch (error) {
      console.error('Error assigning products:', error);
      alert('An error occurred while assigning products');
    } finally {
      setSavingProducts(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleAllProducts = () => {
    const filteredProducts = products.filter((p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
    );

    const allSelected = filteredProducts.every((p) =>
      selectedProductIds.includes(p._id)
    );

    if (allSelected) {
      // Deselect all filtered products
      setSelectedProductIds((prev) =>
        prev.filter((id) => !filteredProducts.find((p) => p._id === id))
      );
    } else {
      // Select all filtered products
      const newIds = filteredProducts.map((p) => p._id);
      setSelectedProductIds((prev) => [...new Set([...prev, ...newIds])]);
    }
  };

  const openEditDialog = (team: Team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      description: team.description || '',
      district_id: team.district_id._id,
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const openProductsDialog = (team: Team) => {
    setSelectedTeam(team);
    setProductSearch('');
    fetchTeamProducts(team._id);
    setIsProductsOpen(true);
  };

  const handleDelete = async (team: Team) => {
    if (!confirm(`Are you sure you want to delete team "${team.name}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teams/${team._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        fetchTeams();
      } else {
        alert(data.error?.message || 'Failed to delete team');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Failed to delete team');
    }
  };

  const openDeleteDialog = (team: Team) => {
    setSelectedTeam(team);
    setIsDeleteOpen(true);
  };

  const openCreateDialog = () => {
    setFormData({ name: '', description: '', district_id: '' });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D32F2F] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black">Team Management</h1>
          <p className="text-black mt-1">
            Manage teams and assign products to teams
          </p>
        </div>
        {currentUser?.role === 'super_admin' && (
          <Button
            onClick={openCreateDialog}
            className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black" />
              <Input
                placeholder="Search teams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
            >
              <option value="">All Districts</option>
              {districts.map((district) => (
                <option key={district._id} value={district._id}>
                  {district.name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Card key={team._id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-black mb-1">{team.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{team.description || 'No description'}</p>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {team.district_id.name}
                  </div>
                </div>
                {currentUser?.role === 'super_admin' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(team)}
                      title="Edit team"
                    >
                      <Edit className="h-3 w-3 text-black" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(team)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete team"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                {team.kam && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">Account Key Manager</p>
                    <p className="text-sm text-black">{team.kam.name}</p>
                    <p className="text-xs text-gray-500">{team.kam.email}</p>
                  </div>
                )}
                {!team.kam && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">Account Key Manager</p>
                    <p className="text-sm text-gray-500 italic">No KAM assigned</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-2xl font-bold text-black">
                        {team.stats?.doctors || 0}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Doctors</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-2xl font-bold text-black">
                        {team.stats?.prescriptions || 0}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Prescriptions</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    team.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {team.status.charAt(0).toUpperCase() + team.status.slice(1)}
                </span>
                {currentUser?.role === 'super_admin' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openProductsDialog(team)}
                    className="text-[#D32F2F] hover:bg-[#D32F2F] hover:text-white"
                  >
                    <Package className="h-3 w-3 mr-1" />
                    Manage Products
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {teams.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No teams found</p>
          </CardContent>
        </Card>
      )}

      {/* Create Team Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent onClose={() => setIsCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle className="text-black">Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team within a district. KAM will be assigned separately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div>
              <Label required>Team Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Team Alpha"
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Primary sales team for cardiovascular products"
              />
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
              {formErrors.district_id && (
                <p className="text-red-500 text-sm mt-1">{formErrors.district_id}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={submitting}
              className="text-black"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTeam}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent onClose={() => setIsEditOpen(false)}>
          <DialogHeader>
            <DialogTitle className="text-black">Edit Team</DialogTitle>
            <DialogDescription>
              Update team information. KAM is assigned separately via Users page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div>
              <Label required>Team Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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
              {formErrors.district_id && (
                <p className="text-red-500 text-sm mt-1">{formErrors.district_id}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={submitting}
              className="text-black"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTeam}
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent onClose={() => setIsDeleteOpen(false)}>
          <DialogHeader>
            <DialogTitle className="text-black">Deactivate Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate this team? This action will deactivate the team but preserve its data.
            </DialogDescription>
          </DialogHeader>
          {selectedTeam && (
            <div className="p-6">
              <p className="font-medium text-black">{selectedTeam.name}</p>
              <p className="text-sm text-gray-600">{selectedTeam.district_id.name}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={submitting}
              className="text-black"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteTeam}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {submitting ? 'Deactivating...' : 'Deactivate Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Products Dialog */}
      <Dialog open={isProductsOpen} onOpenChange={setIsProductsOpen}>
        <DialogContent onClose={() => setIsProductsOpen(false)} className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-black">Manage Team Products</DialogTitle>
            <DialogDescription>
              Assign products to <span className="font-semibold text-black">{selectedTeam?.name}</span>. Doctors in this team will only see selected products.
            </DialogDescription>
          </DialogHeader>

          {loadingProducts ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D32F2F] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Select All */}
              <div className="flex items-center justify-between py-2 border-b">
                <Label className="text-sm font-medium text-black">
                  {selectedProductIds.length} of {products.length} products selected
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllProducts}
                  className="text-black"
                >
                  {filteredProducts.every((p) => selectedProductIds.includes(p._id))
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              </div>

              {/* Products List */}
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedProductIds.includes(product._id)
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => toggleProductSelection(product._id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(product._id)}
                      onChange={() => toggleProductSelection(product._id)}
                      className="h-4 w-4 rounded border-gray-300 text-[#D32F2F] focus:ring-[#D32F2F]"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-black">{product.name}</p>
                      <div className="flex gap-3 text-xs text-gray-500 mt-1">
                        <span>SKU: {product.sku}</span>
                        <span>Rs. {product.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No products found
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsProductsOpen(false)}
              disabled={savingProducts}
              className="text-black"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProducts}
              disabled={savingProducts || loadingProducts}
              className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
            >
              {savingProducts ? 'Saving...' : 'Save Products'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

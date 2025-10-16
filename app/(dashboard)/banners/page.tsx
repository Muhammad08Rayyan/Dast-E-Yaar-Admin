"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Search, Image as ImageIcon, Plus, Edit, Trash2 } from "lucide-react";
import Image from "next/image";

interface Banner {
  _id: string;
  title: string;
  description?: string;
  image_url: string;
  cloudinary_id: string;
  order: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 0,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchBanners = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/banners', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setBanners(data.data.banners);
      }
    } catch (error) {

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleCreate = () => {
    setFormData({
      title: '',
      description: '',
      order: banners.length,
      is_active: true,
    });
    setFormErrors({});
    setImagePreview(null);
    setImageFile(null);
    setIsCreateOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    setSelectedBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      order: banner.order,
      is_active: banner.is_active,
    });
    setFormErrors({});
    setImagePreview(banner.image_url);
    setImageFile(null);
    setIsEditOpen(true);
  };

  const handleDelete = (banner: Banner) => {
    setSelectedBanner(banner);
    setIsDeleteOpen(true);
  };

  const handleView = (banner: Banner) => {
    setSelectedBanner(banner);
    setIsViewOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFormErrors({ ...formErrors, image: 'Please select an image file' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors({ ...formErrors, image: 'Image size must be less than 5MB' });
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Clear image error
      setFormErrors(prev => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { image, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!imageFile && !isEditOpen) errors.image = 'Image is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const url = isEditOpen ? `/api/banners/${selectedBanner?._id}` : '/api/banners';
      const method = isEditOpen ? 'PUT' : 'POST';

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('order', formData.order.toString());
      formDataToSend.append('is_active', formData.is_active.toString());

      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();
      if (data.success) {
        setIsCreateOpen(false);
        setIsEditOpen(false);
        fetchBanners();
      } else {
        alert(data.error?.message || 'Failed to save banner');
      }
    } catch (error) {

      alert('Failed to save banner');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedBanner) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/banners/${selectedBanner._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setIsDeleteOpen(false);
        fetchBanners();
      } else {
        alert(data.error?.message || 'Failed to delete banner');
      }
    } catch (error) {

      alert('Failed to delete banner');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('title', banner.title);
      formDataToSend.append('is_active', (!banner.is_active).toString());

      const response = await fetch(`/api/banners/${banner._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();
      if (data.success) {
        fetchBanners();
      }
    } catch (error) {

    }
  };

  const filteredBanners = banners.filter(banner =>
    banner.title.toLowerCase().includes(search.toLowerCase()) ||
    (banner.description && banner.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black">Banners</h1>
          <p className="text-black mt-1">
            Manage promotional banners displayed in the mobile app
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Banner
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black" />
            <Input
              placeholder="Search banners by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Banners Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-black mx-auto mb-4" />
                <p className="text-black">Loading banners...</p>
              </div>
            </div>
          ) : filteredBanners.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-black mx-auto mb-4" />
                <p className="text-black font-medium">No banners found</p>
                <p className="text-black text-sm mt-1">
                  {search ? 'Try adjusting your search' : 'Create your first banner to get started'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-black">Preview</TableHead>
                    <TableHead className="text-black">Title</TableHead>
                    <TableHead className="text-black">Description</TableHead>
                    <TableHead className="text-black">Order</TableHead>
                    <TableHead className="text-black">Status</TableHead>
                    <TableHead className="text-black">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBanners.map((banner) => (
                    <TableRow key={banner._id}>
                      <TableCell>
                        <div
                          className="relative w-24 h-16 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleView(banner)}
                        >
                          <Image
                            src={banner.image_url}
                            alt={banner.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-black">{banner.title}</p>
                      </TableCell>
                      <TableCell className="text-black text-sm max-w-xs truncate">
                        {banner.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="text-black">
                          {banner.order}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleActive(banner)}
                          className="cursor-pointer"
                        >
                          <Badge variant={banner.is_active ? 'success' : 'default'}>
                            {banner.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(banner)}
                            title="Edit Banner"
                          >
                            <Edit className="h-4 w-4 text-black" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(banner)}
                            title="Delete Banner"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
        }} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-black">{isEditOpen ? 'Edit Banner' : 'Create New Banner'}</DialogTitle>
              <DialogDescription>
                {isEditOpen ? 'Update banner information' : 'Add a new banner to the mobile app'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 p-6">
              {/* Image Upload */}
              <div>
                <Label required={!isEditOpen}>Banner Image</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-black
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      cursor-pointer"
                  />
                  <p className="text-sm text-black mt-1">
                    Recommended: 1200x450px (8:3 aspect ratio), Max 5MB
                  </p>
                  {formErrors.image && <p className="text-red-500 text-sm mt-1">{formErrors.image}</p>}
                </div>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-4 relative w-full aspect-video rounded overflow-hidden border">
                    <Image
                      src={imagePreview}
                      alt="Banner preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <Label required>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Banner title"
                />
                {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>

              {/* Order and Active Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                  <p className="text-sm text-black mt-1">
                    Lower numbers appear first
                  </p>
                </div>

                <div>
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-black">Active</span>
                  </div>
                </div>
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
                {submitting ? 'Saving...' : isEditOpen ? 'Update Banner' : 'Create Banner'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent onClose={() => setIsDeleteOpen(false)}>
          <DialogHeader>
            <DialogTitle className="text-black">Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedBanner?.title}</strong>?
              This action cannot be undone and the image will be permanently removed from storage.
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
              {submitting ? 'Deleting...' : 'Delete Banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Banner Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent onClose={() => setIsViewOpen(false)} className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedBanner?.title}</DialogTitle>
            {selectedBanner?.description && (
              <DialogDescription>{selectedBanner.description}</DialogDescription>
            )}
          </DialogHeader>

          {selectedBanner && (
            <div className="space-y-4">
              <div className="relative w-full aspect-video rounded overflow-hidden">
                <Image
                  src={selectedBanner.image_url}
                  alt={selectedBanner.title}
                  fill
                  className="object-contain bg-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-black font-medium">Order:</p>
                  <p className="text-black">{selectedBanner.order}</p>
                </div>
                <div>
                  <p className="text-black font-medium">Status:</p>
                  <Badge variant={selectedBanner.is_active ? 'success' : 'default'}>
                    {selectedBanner.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsViewOpen(false)} className="text-black">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

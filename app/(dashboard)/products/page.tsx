"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Search, Package, Plus, Edit, Trash2 } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  description?: string;
  status: string;
  shopify_product_id?: string;
  shopify_variant_id?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    description: '',
    shopify_product_id: '',
    shopify_variant_id: '',
    status: 'active',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '100'); // Get all products

      const response = await fetch(`/api/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.data.products);
      }
    } catch (error) {

    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCreate = () => {
    setFormData({
      name: '',
      sku: '',
      price: '',
      description: '',
      shopify_product_id: '',
      shopify_variant_id: '',
      status: 'active',
    });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      description: product.description || '',
      shopify_product_id: product.shopify_product_id || '',
      shopify_variant_id: product.shopify_variant_id || '',
      status: product.status,
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.sku.trim()) errors.sku = 'SKU is required';
    if (!formData.price || parseFloat(formData.price) <= 0) errors.price = 'Valid price is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const url = isEditOpen ? `/api/products/${selectedProduct?._id}` : '/api/products';
      const method = isEditOpen ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsCreateOpen(false);
        setIsEditOpen(false);
        fetchProducts();
      } else {
        alert(data.error?.message || 'Failed to save product');
      }
    } catch (error) {

      alert('Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/products/${selectedProduct._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setIsDeleteOpen(false);
        fetchProducts();
      } else {
        alert(data.error?.message || 'Failed to delete product');
      }
    } catch (error) {

      alert('Failed to delete product');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black">Products</h1>
          <p className="text-black mt-1">
            Manage products in the system. All active products are available to all doctors.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black" />
            <Input
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Package className="h-12 w-12 text-black mx-auto mb-4" />
                <p className="text-black">Loading products...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Package className="h-12 w-12 text-black mx-auto mb-4" />
                <p className="text-black font-medium">No products found</p>
                <p className="text-black text-sm mt-1">
                  {search ? 'Try adjusting your search' : 'Products will appear here after sync'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-black">Product Name</TableHead>
                    <TableHead className="text-black">SKU</TableHead>
                    <TableHead className="text-black">Description</TableHead>
                    <TableHead className="text-black">Price</TableHead>
                    <TableHead className="text-black">Status</TableHead>
                    <TableHead className="text-black">Shopify Product ID</TableHead>
                    <TableHead className="text-black">Shopify Variant ID</TableHead>
                    <TableHead className="text-black">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <p className="font-medium text-black">{product.name}</p>
                      </TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs text-black">
                          {product.sku}
                        </code>
                      </TableCell>
                      <TableCell className="text-black text-sm max-w-xs">
                        {product.description || '-'}
                      </TableCell>
                      <TableCell className="text-black font-medium">
                        Rs. {product.price.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.status === 'active' ? 'success' : 'default'}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs text-black">
                          {product.shopify_product_id || '-'}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs text-black">
                          {product.shopify_variant_id || '-'}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4 text-black" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product)}
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
        }} className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{isEditOpen ? 'Edit Product' : 'Create New Product'}</DialogTitle>
              <DialogDescription>
                {isEditOpen ? 'Update product information' : 'Add a new product to the system'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required>Product Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="CardioMax 10mg"
                  />
                  {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <Label required>SKU</Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    placeholder="CARDIO-001"
                  />
                  {formErrors.sku && <p className="text-red-500 text-sm mt-1">{formErrors.sku}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required>Price (Rs.)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="150.00"
                  />
                  {formErrors.price && <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>}
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Shopify Product ID</Label>
                  <Input
                    value={formData.shopify_product_id}
                    onChange={(e) => setFormData({ ...formData, shopify_product_id: e.target.value })}
                    placeholder="8735268176108"
                  />
                </div>

                <div>
                  <Label>Shopify Variant ID</Label>
                  <Input
                    value={formData.shopify_variant_id}
                    onChange={(e) => setFormData({ ...formData, shopify_variant_id: e.target.value })}
                    placeholder="45960026620140"
                  />
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
                {submitting ? 'Saving...' : isEditOpen ? 'Update Product' : 'Create Product'}
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
              Are you sure you want to delete <strong>{selectedProduct?.name}</strong>? 
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
              {submitting ? 'Deleting...' : 'Delete Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Package } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  status: string;
  shopify_product_id: string;
}

interface DistrictProduct {
  _id: string;
  product_id: string;
  status: 'active' | 'inactive';
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [districtProducts, setDistrictProducts] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  const fetchProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '3000'); // Get all products

      const response = await fetch(`/api/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchDistrictProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/district-products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('District products response:', data);
      
      if (data.success) {
        const map = new Map<string, boolean>();
        data.data.districtProducts.forEach((dp: DistrictProduct) => {
          console.log('Setting product:', dp.product_id, 'to', dp.status === 'active');
          map.set(dp.product_id, dp.status === 'active');
        });
        console.log('Final district products map:', map);
        setDistrictProducts(map);
      }
    } catch (error) {
      console.error('Error fetching district products:', error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchDistrictProducts();
  }, [fetchDistrictProducts]);

  const toggleProduct = async (productId: string) => {
    setToggling(prev => new Set(prev).add(productId));
    
    try {
      const token = localStorage.getItem('token');
      const isCurrentlyActive = districtProducts.get(productId) || false;
      
      const response = await fetch('/api/district-products/toggle', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          status: !isCurrentlyActive ? 'active' : 'inactive',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setDistrictProducts(prev => {
          const newMap = new Map(prev);
          newMap.set(productId, !isCurrentlyActive);
          return newMap;
        });
      } else {
        alert(`Failed to update product: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error toggling product:', error);
      alert('Failed to update product availability');
    } finally {
      setToggling(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-900 mt-1">
          Enable or disable products for your district. Doctors will only see enabled products.
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-900">Loading products...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-900 font-medium">No products found</p>
                <p className="text-gray-900 text-sm mt-1">
                  {search ? 'Try adjusting your search' : 'Products will appear here after sync'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-900">Product Name</TableHead>
                    <TableHead className="text-gray-900">SKU</TableHead>
                    <TableHead className="text-gray-900">Price</TableHead>
                    <TableHead className="text-gray-900">Status</TableHead>
                    <TableHead className="text-gray-900">Available in District</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const isEnabled = districtProducts.get(product._id) || false;
                    const isToggling = toggling.has(product._id);
                    
                    return (
                      <TableRow key={product._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-900">
                            {product.sku}
                          </code>
                        </TableCell>
                        <TableCell className="text-gray-900">
                          Rs. {product.price.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.status === 'active' ? 'success' : 'default'}>
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => toggleProduct(product._id)}
                            disabled={isToggling}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              isEnabled ? 'bg-green-600' : 'bg-gray-300'
                            } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                isEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="ml-3 text-sm text-gray-900">
                            {isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Package className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">How it works</h3>
              <p className="text-sm text-gray-900 mt-1">
                Enable products that you want doctors in your district to be able to prescribe. 
                Only enabled products will be visible to doctors in the mobile app when creating prescriptions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


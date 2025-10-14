'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  DollarSign,
  FileText,
  ShoppingCart,
  Users,
  TrendingUp,
  Calendar,
} from 'lucide-react';

interface SalesReport {
  summary: {
    totalRevenue: number;
    totalPrescriptions: number;
    totalOrders: number;
    activePatients: number;
    averageOrderValue: number;
    fulfillmentRate: number;
  };
  team?: {
    _id: string;
    name: string;
    district: { name: string };
    kam: { name: string };
  } | null;
  doctors: {
    doctor: { _id: string; name: string };
    prescriptions: number;
    orders: number;
    revenue: number;
    patients: number;
  }[];
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

interface TeamPerformance {
  teams: {
    team: {
      _id: string;
      name: string;
    };
    stats: {
      doctors: number;
      prescriptions: number;
      orders: number;
      revenue: number;
      fulfillmentRate: number;
    };
  }[];
  totals: {
    doctors: number;
    prescriptions: number;
    orders: number;
    revenue: number;
  };
}

interface Team {
  _id: string;
  name: string;
}

interface District {
  _id: string;
  name: string;
}

export default function ReportsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  // Filter states
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [reportType, setReportType] = useState<'sales' | 'team'>('sales');

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
      const response = await fetch('/api/teams?limit=100&status=active', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTeams(data.data.teams || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, []);

  const fetchDistricts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/districts?limit=100&status=active', {
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

  const fetchSalesReport = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (selectedTeam) params.append('teamId', selectedTeam);
      if (selectedDistrict) params.append('districtId', selectedDistrict);

      const response = await fetch(`/api/reports/sales?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSalesReport(data.data);
      }
    } catch (error) {
      console.error('Error fetching sales report:', error);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, selectedTeam, selectedDistrict]);

  const fetchTeamPerformance = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/reports/team-performance?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTeamPerformance(data.data);
      }
    } catch (error) {
      console.error('Error fetching team performance:', error);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchCurrentUser();
    fetchTeams();
    fetchDistricts();
  }, [fetchCurrentUser, fetchTeams, fetchDistricts]);

  useEffect(() => {
    if (currentUser) {
      if (reportType === 'sales') {
        fetchSalesReport();
      } else if (currentUser.role === 'super_admin') {
        fetchTeamPerformance();
      }
    }
  }, [currentUser, reportType, fetchSalesReport, fetchTeamPerformance]);

  const applyFilters = () => {
    setLoading(true);
    if (reportType === 'sales') {
      fetchSalesReport();
    } else {
      fetchTeamPerformance();
    }
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedTeam('');
    setSelectedDistrict('');
  };

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D32F2F] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black">Reports & Analytics</h1>
          <p className="text-black mt-1">
            {currentUser?.role === 'kam'
              ? 'Your team performance metrics and sales data'
              : 'Comprehensive insights and performance metrics'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          {currentUser?.role === 'kam' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  onClick={applyFilters}
                  className="w-full md:w-1/2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="reportType">Report Type</Label>
                <Select
                  id="reportType"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as 'sales' | 'team')}
                >
                  <option value="sales">Sales Report</option>
                  <option value="team">Team Performance</option>
                </Select>
              </div>
              {reportType === 'sales' && (
                <>
                  <div className="md:col-span-2">
                    <Label htmlFor="team">Team</Label>
                    <Select
                      id="team"
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                    >
                      <option value="">All Teams</option>
                      {teams.map((team) => (
                        <option key={team._id} value={team._id}>
                          {team.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="district">District</Label>
                    <Select
                      id="district"
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                    >
                      <option value="">All Districts</option>
                      {districts.map((district) => (
                        <option key={district._id} value={district._id}>
                          {district.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </>
              )}
              <div className="md:col-span-2 flex gap-2 items-end">
                <Button
                  onClick={applyFilters}
                  className="flex-1 bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
                >
                  Apply Filters
                </Button>
                <Button onClick={clearFilters} variant="outline" className="flex-1">
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales Report View */}
      {reportType === 'sales' && salesReport && (
        <>
          {/* Team Info (for KAM or filtered view) */}
          {salesReport.team && (
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Team</p>
                    <p className="text-lg font-bold text-black">{salesReport.team.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">District</p>
                    <p className="text-lg font-bold text-black">{salesReport.team.district.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Key Manager</p>
                    <p className="text-lg font-bold text-black">{salesReport.team.kam.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-black mt-2">
                      {formatCurrency(salesReport.summary.totalRevenue)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Prescriptions</p>
                    <p className="text-3xl font-bold text-black mt-2">
                      {salesReport.summary.totalPrescriptions}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-3xl font-bold text-black mt-2">
                      {salesReport.summary.totalOrders}
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-full">
                    <ShoppingCart className="h-6 w-6 text-[#D32F2F]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Active Patients</p>
                    <p className="text-3xl font-bold text-black mt-2">
                      {salesReport.summary.activePatients}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                    <p className="text-3xl font-bold text-black mt-2">
                      {formatCurrency(salesReport.summary.averageOrderValue)}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Fulfillment Rate</p>
                    <p className="text-3xl font-bold text-black mt-2">
                      {salesReport.summary.fulfillmentRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-teal-50 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-teal-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Doctor Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black">Doctor Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Doctor</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Prescriptions</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Orders</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Patients</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReport.doctors.map((doc, index) => (
                      <tr key={doc.doctor._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="bg-[#D32F2F] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium text-black">{doc.doctor.name}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-black">{doc.prescriptions}</td>
                        <td className="text-right py-3 px-4 text-black">{doc.orders}</td>
                        <td className="text-right py-3 px-4 text-black">{doc.patients}</td>
                        <td className="text-right py-3 px-4 font-semibold text-green-600">
                          {formatCurrency(doc.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {salesReport.doctors.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No doctor data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Team Performance Report View */}
      {reportType === 'team' && teamPerformance && currentUser?.role === 'super_admin' && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-gray-600">Total Teams</p>
                <p className="text-3xl font-bold text-black mt-2">{teamPerformance.teams.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-gray-600">Total Doctors</p>
                <p className="text-3xl font-bold text-black mt-2">{teamPerformance.totals.doctors}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-gray-600">Total Prescriptions</p>
                <p className="text-3xl font-bold text-black mt-2">{teamPerformance.totals.prescriptions}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-black mt-2">
                  {formatCurrency(teamPerformance.totals.revenue)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Team Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black">Team Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Team</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Doctors</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Prescriptions</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Orders</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Revenue</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Fulfillment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamPerformance.teams.map((teamData, index) => (
                      <tr key={teamData.team._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="bg-[#D32F2F] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium text-black">{teamData.team.name}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-black">{teamData.stats.doctors}</td>
                        <td className="text-right py-3 px-4 text-black">{teamData.stats.prescriptions}</td>
                        <td className="text-right py-3 px-4 text-black">{teamData.stats.orders}</td>
                        <td className="text-right py-3 px-4 font-semibold text-green-600">
                          {formatCurrency(teamData.stats.revenue)}
                        </td>
                        <td className="text-right py-3 px-4 text-black">{teamData.stats.fulfillmentRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {teamPerformance.teams.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No team data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Eye, Users, UserPlus } from "lucide-react";

interface Patient {
  _id: string;
  mrn: string;
  name: string;
  phone: string;
  age?: number;
  gender?: string;
  city?: string;
  address?: string;
  created_by: {
    _id: string;
    name: string;
    email: string;
    specialty: string;
  };
  created_at: string;
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const [stats, setStats] = useState({
    total: 0,
    male: 0,
    female: 0,
  });

  useEffect(() => {
    fetchPatients();
  }, [pagination.page, gender, city]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append("search", search);
      if (gender) params.append("gender", gender);
      if (city) params.append("city", city);

      const response = await fetch(`/api/patients?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPatients(data.data.patients);
        setPagination(data.data.pagination);

        // Calculate stats
        const allPatients = data.data.patients;
        setStats({
          total: data.data.pagination.total,
          male: allPatients.filter((p: Patient) => p.gender === "male").length,
          female: allPatients.filter((p: Patient) => p.gender === "female").length,
        });
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchPatients();
  };

  return (
    <div className="space-y-6 text-black">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-black">Patients</h1>
        <p className="text-black mt-1">View and manage all patient records</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Total Patients</p>
                <p className="text-3xl font-bold text-black mt-2">{stats.total}</p>
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
              <div>
                <p className="text-sm font-medium text-black">Male</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.male}</p>
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
              <div>
                <p className="text-sm font-medium text-black">Female</p>
                <p className="text-3xl font-bold text-pink-600 mt-2">{stats.female}</p>
              </div>
              <div className="bg-pink-50 p-3 rounded-full">
                <Users className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-black">Filter Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name, MRN, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            <Input
              placeholder="Filter by city..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-black">Patients List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#D32F2F] border-r-transparent"></div>
              <p className="mt-2 text-black">Loading patients...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8 text-black">
              <Users className="h-12 w-12 mx-auto mb-4 text-black" />
              <p>No patients found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                    <TableHead className="text-black">MRN</TableHead>
                    <TableHead className="text-black">Name</TableHead>
                    <TableHead className="text-black">Phone</TableHead>
                    <TableHead className="text-black">Age</TableHead>
                    <TableHead className="text-black">Gender</TableHead>
                    <TableHead className="text-black">City</TableHead>
                    <TableHead className="text-black">Doctor</TableHead>
                    <TableHead className="text-black">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((patient) => (
                      <TableRow key={patient._id}>
                        <TableCell className="font-medium font-mono">
                          {patient.mrn}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{patient.name}</p>
                        </TableCell>
                        <TableCell>{patient.phone}</TableCell>
                        <TableCell>{patient.age || "N/A"}</TableCell>
                        <TableCell>
                          {patient.gender ? (
                            <Badge className={
                              patient.gender === "male"
                                ? "bg-blue-100 text-blue-800"
                                : patient.gender === "female"
                                ? "bg-pink-100 text-pink-800"
                                : "bg-gray-100 text-black"
                            }>
                              {patient.gender}
                            </Badge>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>{patient.city || "N/A"}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-black">{patient.created_by.name}</p>
                            <p className="text-xs text-black">{patient.created_by.specialty}</p>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/patients/${patient._id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-black">
                  Showing {patients.length} of {pagination.total} patients
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page - 1 })
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.pages}
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page + 1 })
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


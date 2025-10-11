"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  Users,
  UserCog,
  MapPin,
  Package,
  FileText,
  ShoppingCart,
  UsersRound,
  BarChart3,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";

interface SidebarProps {
  userRole: "super_admin" | "kam";
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["super_admin"] },
    { name: "Districts", href: "/districts", icon: MapPin, roles: ["super_admin"] },
    { name: "Cities", href: "/cities", icon: Building2, roles: ["super_admin"] },
    { name: "Teams", href: "/teams", icon: UsersRound, roles: ["super_admin"] },
    { name: "KAMs", href: "/users", icon: Users, roles: ["super_admin"] },
    { name: "Doctors", href: "/doctors", icon: UserCog, roles: ["super_admin", "kam"] },
    { name: "Patients", href: "/patients", icon: Users, roles: ["super_admin"] },
    { name: "Prescriptions", href: "/prescriptions", icon: FileText, roles: ["super_admin"] },
    { name: "Orders", href: "/orders", icon: ShoppingCart, roles: ["super_admin"] },
    { name: "Products", href: "/products", icon: Package, roles: ["super_admin"] },
    { name: "Reports", href: "/reports", icon: BarChart3, roles: ["super_admin", "kam"] },
  ];

  const filteredNavigation = navigation.filter((item) => item.roles.includes(userRole));

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800 px-4">
        <div className="flex items-center space-x-3">
          <Image 
            src="/logo.png" 
            alt="Dast-e-Yaar Logo" 
            width={48}
            height={48}
            className="h-12 w-auto object-contain"
          />
          <div>
            <h1 className="text-white text-lg font-bold">Dast-e-Yaar</h1>
            <p className="text-gray-400 text-xs">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-[#D32F2F] text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Settings & Logout */}
      <div className="border-t border-gray-800 p-2 space-y-1">
        {/* Settings - Commented for now */}
        {/* {userRole === "super_admin" && (
          <Link
            href="/settings"
            className="group flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Settings className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-white" />
            Settings
          </Link>
        )} */}
        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }}
          className="w-full group flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-white" />
          Logout
        </button>
      </div>
    </div>
  );
}


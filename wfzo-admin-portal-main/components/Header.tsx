"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { rolesApi } from "@/lib/api/memberApi";
import { enquiryApi } from "@/lib/api/enquiryApi";
import { Enquiry } from "@/lib/types/api";
import StatusBadge from "@/components/StatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [currentRole, setCurrentRole] = useState<string>("");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [rolesList, setRolesList] = useState<any[]>([]);



  useEffect(() => {
    // Fetch roles from API only if user is authenticated
    const fetchRoles = async () => {
      if (!user?.token) {
        return; // Skip if no token
      }
      
      try {
        const roles = await rolesApi.getRoles();
        setRolesList(roles);
      } catch (error) {
        console.error('Failed to fetch roles:', error);
        // If unauthorized, redirect to login
        if ((error as any)?.status === 401) {
          logout();
          router.push('/login');
        }
      }
    };
    fetchRoles();
  }, [user?.token]);

  useEffect(() => {
    if (user?.token) {
      try {
        const payload = JSON.parse(atob(user.token.split('.')[1]));
        const roles = payload.roles || [];
        setUserRoles(roles);
        
        // Get stored role or use first role
        const storedRole = localStorage.getItem('wfzo_current_role');
        if (storedRole && roles.includes(storedRole)) {
          setCurrentRole(storedRole);
        } else if (roles.length > 0) {
          setCurrentRole(roles[0]);
          localStorage.setItem('wfzo_current_role', roles[0]);
        }
      } catch (error) {
        console.error('Failed to parse token:', error);
      }
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('wfzo_current_role');
    router.push("/login");
  };

  const handleRoleChange = (role: string) => {
    setCurrentRole(role);
    setShowRoleDropdown(false);
    // Store selected role
    localStorage.setItem('wfzo_current_role', role);
    // Refresh the page to apply new role permissions
    window.location.reload();
  };

  const getRoleName = (roleCode: string) => {
    const role = rolesList.find(r => r.code === roleCode);
    return role ? role.name : roleCode;
  };

  const hasAccess = (requiredRole: string) => {
    return userRoles.includes(requiredRole) || userRoles.includes('ADMIN');
  };

  interface MenuItem {
    name: string;
    path?: string;
    onClick?: () => void;
    requiredRole?: string | null;
  }

  const menuItems: MenuItem[] = [
    {
      name: 'Home',
      path: '/dashboard',
      requiredRole: null, // Available to all
    },
    {
      name: 'Analytics',
      path: '/analytics/user-analytics',
      requiredRole: 'ADMIN',
    },
    {
      name: 'Members',
      path: '/members',
      requiredRole: null, // Available to all
    },
    {
      name: 'Users',
      path: '/users',
      requiredRole: 'ADMIN',
    },
    {
      name: 'Events',
      path: '/events',
      requiredRole: 'ADMIN',
    },
    {
      name: 'Webinars',
      path: '/webinars',
      requiredRole: 'ADMIN',
    },
    {
      name: 'News & Publications',
      path: '/news-publication',
      requiredRole: 'ADMIN',
    },
    {
      name: 'Enquiries',
      path: '/enquiries',
      requiredRole: 'ADMIN',
    },
    {
      name: 'Requests',
      path: '/requests',
      requiredRole: 'ADMIN',
    },
    {
      name: 'Company Page',
      path: '/company-page',
      requiredRole: 'ADMIN',
    },
  ];

  const visibleMenuItems = menuItems.filter(item => 
    !item.requiredRole || hasAccess(item.requiredRole)
  );

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Desktop Navigation Menu */}
            <nav className="hidden lg:flex items-center gap-1 ml-4">
              {visibleMenuItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    if (item.path) {
                      router.push(item.path);
                    } else if (item.onClick) {
                      item.onClick();
                    }
                  }}
                  className={`px-3 xl:px-4 py-2 rounded-lg font-medium transition duration-200 text-sm xl:text-base ${
                    pathname === item.path
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Role Switcher */}
            {userRoles.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="px-3 xl:px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition duration-200 flex items-center gap-2"
                >
                  <span className="text-xs xl:text-sm">{getRoleName(currentRole || userRoles[0])}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showRoleDropdown && (
                  <div className="absolute right-0 mt-2 w-56 xl:w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {userRoles.map((role) => (
                      <button
                        key={role}
                        onClick={() => handleRoleChange(role)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition ${
                          currentRole === role ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {getRoleName(role)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* User Info */}
            <div className="text-right">
              <p className="text-xs xl:text-sm font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-600">
                {currentRole ? getRoleName(currentRole) : user.email}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 xl:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition duration-200 text-sm xl:text-base"
            >
              Logout
            </button>
          </div>

          {/* Mobile User Avatar */}
          <div className="lg:hidden">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary text-white flex items-center justify-center text-xs sm:text-sm font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-200 mt-3">
            <div className="px-2 pt-3 pb-3 space-y-1">
              {visibleMenuItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    if (item.path) {
                      router.push(item.path);
                    } else if (item.onClick) {
                      item.onClick();
                    }
                    setShowMobileMenu(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                    pathname === item.path
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <div className="pt-3 pb-3 border-t border-gray-200">
              <div className="px-4 space-y-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-800">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-xs font-medium text-gray-500">{user?.email}</div>
                  </div>
                </div>

                {/* Mobile Role Selector */}
                {userRoles.length > 1 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                    >
                      <span className="font-medium">{getRoleName(currentRole)}</span>
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {showRoleDropdown && (
                      <div className="mt-2 w-full rounded-lg shadow-lg bg-white border border-gray-200">
                        <div className="py-1">
                          {userRoles.map((role) => (
                            <button
                              key={role}
                              onClick={() => handleRoleChange(role)}
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                currentRole === role
                                  ? 'bg-primary text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {getRoleName(role)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    handleLogout();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}

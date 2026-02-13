"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { internalUsersApi, rolesApi } from "@/lib/api/memberApi";
import ProtectedLayout from "@/components/ProtectedLayout";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function UsersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    roles: [] as string[],
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check if user has admin role
    const userRoles = getUserRoles();
    if (!userRoles.includes("ADMIN")) {
      router.push("/dashboard");
      return;
    }
    
    fetchData();
  }, []);

  const getUserRoles = () => {
    if (!user) return [];
    const token = user.token;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.roles || [];
    } catch {
      return [];
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [usersData, rolesData] = await Promise.all([
        internalUsersApi.getAllUsers(),
        rolesApi.getRoles(),
      ]);
      // Handle paginated response
      const users = (usersData as any)?.items || usersData || [];
      setUsers(Array.isArray(users) ? users : []);
      setRoles(rolesData);
    } catch (err) {
      setError("Failed to load users. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError("");
  };

  const handleRoleToggle = (roleCode: string) => {
    const newRoles = formData.roles.includes(roleCode)
      ? formData.roles.filter((r) => r !== roleCode)
      : [...formData.roles, roleCode];
    setFormData({ ...formData, roles: newRoles });
    setFormError("");
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setFormError("First name is required");
      return false;
    }
    if (!formData.lastName.trim()) {
      setFormError("Last name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setFormError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFormError("Invalid email format");
      return false;
    }
    if (formData.roles.length === 0) {
      setFormError("At least one role must be selected");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setFormError("");
      await internalUsersApi.createUser(formData);
      
      // Reset form and close modal
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        roles: [],
      });
      setShowCreateModal(false);
      
      // Refresh users list
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || "Failed to create user. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleNames = (roleCodes: string[]) => {
    return roleCodes
      .map((code) => roles.find((r) => r.code === code)?.name || code)
      .join(", ");
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <LoadingSpinner text="Loading users..." />
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-primary">User Management</h2>
            <p className="text-gray-600 mt-1">Manage internal users and their roles</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-secondary text-white font-semibold px-6 py-3 rounded-lg transition duration-200"
          >
            + Create User
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id || user._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.map((roleCode: string) => (
                          <span
                            key={roleCode}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {roles.find((r) => r.code === roleCode)?.name || roleCode}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'active' || user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.status === 'active' || user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">Create New User</h3>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormError("");
                      setFormData({
                        firstName: "",
                        lastName: "",
                        email: "",
                        roles: [],
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      placeholder="Enter first name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Assign Roles <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {roles.map((role) => (
                      <div
                        key={role.code}
                        className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition"
                      >
                        <input
                          type="checkbox"
                          id={`role-${role.code}`}
                          checked={formData.roles.includes(role.code)}
                          onChange={() => handleRoleToggle(role.code)}
                          className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <label
                          htmlFor={`role-${role.code}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium text-gray-900">{role.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {role.description}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {role.privilegeCount} privileges
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormError("");
                      setFormData({
                        firstName: "",
                        lastName: "",
                        email: "",
                        roles: [],
                      });
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-primary hover:bg-secondary text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}

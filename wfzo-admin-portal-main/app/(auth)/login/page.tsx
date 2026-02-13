"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authApi, ApiError } from "@/lib/api/memberApi";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const useMockAuth = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Mock authentication for testing
      if (useMockAuth) {
        // Allow any email/password for testing
        // You can use: test@gmail.com / password123
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        
        login({
          id: "mock-user-id-123",
          email: email,
          firstName: "Test",
          lastName: "User",
          role: "Admin",
          token: "mock-jwt-token-for-testing",
        });

        router.push("/dashboard");
        return;
      }

      // Real API authentication
      const response = await authApi.login({ email, password });
      
      // Parse JWT token to extract minimal user info
      const tokenParts = response.token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      
      // Store token first so fetchApi can use it
      const tempUser = {
        id: payload.sub,
        email: payload.email || email,
        firstName: email.split('@')[0],
        lastName: "User",
        role: "Admin" as const,
        roles: payload.roles || [],
        token: response.token,
      };
      login(tempUser);
      
      // Fetch full user profile using the token
      const userProfile = await authApi.getCurrentUser();
      
      // Update with full profile
      login({
        id: userProfile.id,
        email: userProfile.email,
        firstName: userProfile.firstName || email.split('@')[0],
        lastName: userProfile.lastName || "User",
        displayName: userProfile.displayName,
        role: "Admin",
        roles: payload.roles || [],
        token: response.token,
      });

      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof ApiError) {
        setError(`${err.message} (Status: ${err.status})`);
      } else if (err instanceof Error) {
        setError(`Error: ${err.message}`);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md">
        {/* Logo placeholder */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-2xl sm:text-3xl font-bold">WFZO</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-primary text-center mb-2">
          WFZO Admin Portal
        </h1>
        <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
          Member Onboarding Management
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-secondary text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

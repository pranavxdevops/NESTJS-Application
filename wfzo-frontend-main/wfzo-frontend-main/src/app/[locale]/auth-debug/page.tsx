'use client';

import { getAuthProvider } from '@/lib/auth/authClient';

export default function AuthDebugPage() {
  const provider = getAuthProvider();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold mb-2">Current Provider:</h2>
        <p className="text-xl">{provider}</p>
      </div>

      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold mb-2">Environment Variables:</h2>
        <pre className="text-sm">
          {JSON.stringify({
            NEXT_PUBLIC_AUTH_PROVIDER: process.env.NEXT_PUBLIC_AUTH_PROVIDER,
            NEXT_PUBLIC_AZURE_CLIENT_ID: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID?.substring(0, 10) + '...',
            NEXT_PUBLIC_ENTRA_CLIENT_ID: process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID?.substring(0, 10) + '...',
            NEXT_PUBLIC_AZURE_TENANT_ID: process.env.NEXT_PUBLIC_AZURE_TENANT_ID?.substring(0, 10) + '...',
          }, null, 2)}
        </pre>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Instructions:</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>If provider shows &quot;keycloak&quot; but you want Entra, check your .env file</li>
          <li>Make sure NEXT_PUBLIC_AUTH_PROVIDER=entra</li>
          <li>Restart the dev server after changing .env</li>
          <li>Check browser console for additional logs</li>
        </ul>
      </div>
    </div>
  );
}

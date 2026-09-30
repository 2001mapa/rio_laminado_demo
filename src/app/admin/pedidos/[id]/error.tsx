'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("PAGE CRASHED WITH ERROR:", error);
  }, [error]);

  return (
    <div className="p-8 bg-red-50 text-red-900 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">¡Algo salió mal al renderizar el pedido!</h2>
      <pre className="bg-white p-4 overflow-auto rounded shadow text-sm">
        {error.message}
        <br/>
        {error.stack}
      </pre>
    </div>
  );
}

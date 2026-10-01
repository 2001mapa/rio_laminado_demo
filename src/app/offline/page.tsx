"use client";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-rio-background text-rio-ink p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-rio-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
        </svg>
        <h1 className="text-2xl font-serif font-bold mb-2">Estás sin conexión</h1>
        <p className="text-sm text-gray-600 mb-6">
          Esta página requiere conexión a internet para cargar los datos más recientes. 
          En este momento, la aplicación B2B de RIO no puede conectarse al servidor.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-rio-primary text-white font-semibold py-2 px-6 rounded-md hover:bg-rio-primary-dark transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

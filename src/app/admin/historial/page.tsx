'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getAuditEvents } from '@/app/actions/audit';
import { ChevronDown, ChevronUp, Search, Calendar, Filter, ChevronLeft, ChevronRight, Activity, FileJson } from 'lucide-react';
import { classNames } from '@/lib/utils';

export default function HistorialPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [date, setDate] = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    const res = await getAuditEvents({ page, search, type, date });
    if (res.success) {
      setEvents(res.events);
      setTotalPages(res.totalPages || 1);
    }
    setIsLoading(false);
  }, [page, search, type, date]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold text-rio-ink flex items-center gap-2">
          <Activity className="w-6 h-6 text-rio-gold" />
          Historial de Actividad
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-rio-border p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-rio-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por SKU, N° Pedido, Actor o Entidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-rio-background border border-rio-border rounded-lg text-sm focus:outline-none focus:border-rio-gold focus:ring-1 focus:ring-rio-gold"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-rio-muted w-4 h-4" />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="pl-9 pr-8 py-2 bg-rio-background border border-rio-border rounded-lg text-sm focus:outline-none focus:border-rio-gold appearance-none min-w-[160px]"
            >
              <option value="">Cualquier Acción</option>
              <option value="CREATE">Creación</option>
              <option value="UPDATE">Actualización</option>
              <option value="DELETE">Eliminación</option>
              <option value="UPLOAD_PHOTO">Subida de Foto</option>
              <option value="LOGIN">Inicio de Sesión</option>
            </select>
          </div>
          
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-rio-muted w-4 h-4" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-9 pr-4 py-2 bg-rio-background border border-rio-border rounded-lg text-sm focus:outline-none focus:border-rio-gold min-w-[160px]"
            />
          </div>
          
          <button type="submit" className="bg-rio-ink text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-rio-ink/90 transition-colors">
            Filtrar
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-rio-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-rio-background/50 border-b border-rio-border">
                <th className="px-4 py-3 text-xs font-bold text-rio-muted uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-xs font-bold text-rio-muted uppercase tracking-wider">Actor</th>
                <th className="px-4 py-3 text-xs font-bold text-rio-muted uppercase tracking-wider">Acción</th>
                <th className="px-4 py-3 text-xs font-bold text-rio-muted uppercase tracking-wider">Objetivo</th>
                <th className="px-4 py-3 text-xs font-bold text-rio-muted uppercase tracking-wider">Resultado</th>
                <th className="px-4 py-3 text-xs font-bold text-rio-muted uppercase tracking-wider text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rio-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-rio-muted">
                    <div className="w-6 h-6 border-2 border-rio-gold border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Cargando historial...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-rio-muted">
                    No se encontraron eventos con estos filtros.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <React.Fragment key={ev.id}>
                    <tr className={classNames("hover:bg-rio-background/30 transition-colors", expandedId === ev.id ? 'bg-rio-background/30' : '')}>
                      <td className="px-4 py-3 text-sm text-rio-ink whitespace-nowrap">
                        <div className="font-medium">{new Date(ev.createdAt).toLocaleDateString('es-ES')}</div>
                        <div className="text-xs text-rio-muted">{new Date(ev.createdAt).toLocaleTimeString('es-ES')}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-rio-ink">{ev.actorName}</div>
                        <div className="text-xs text-rio-muted capitalize">{ev.actorRole}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-rio-ink/5 text-rio-ink">
                          {ev.action}
                        </span>
                        {ev.origin && ev.origin !== 'manual' && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-rio-gold-light/30 text-rio-gold-dark">
                            {ev.origin}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-rio-ink">
                        <div className="font-medium">{ev.entityType}</div>
                        <div className="text-xs text-rio-muted font-mono truncate max-w-[150px]" title={ev.entityId}>
                          {ev.sku || ev.orderNumber || ev.entityId}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={classNames(
                          "inline-flex items-center px-2 py-1 rounded-full text-xs font-bold",
                          ev.result === 'success' ? 'bg-rio-success/10 text-rio-success' : 
                          ev.result === 'error' ? 'bg-rio-danger/10 text-rio-danger' : 
                          'bg-rio-warning/10 text-rio-warning'
                        )}>
                          {ev.result === 'success' ? 'Éxito' : ev.result === 'error' ? 'Error' : ev.result}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {(ev.changes || ev.batch) && (
                          <button
                            onClick={() => toggleExpand(ev.id)}
                            className="p-1.5 text-rio-muted hover:text-rio-ink hover:bg-rio-background rounded transition-colors inline-flex"
                          >
                            {expandedId === ev.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === ev.id && (ev.changes || ev.batch) && (
                      <tr className="bg-rio-background/30 border-b border-rio-border">
                        <td colSpan={6} className="p-4 text-sm">
                          <div className="bg-white border border-rio-border rounded-lg p-4 max-w-full overflow-x-auto shadow-inner">
                            <h4 className="font-bold text-rio-ink mb-2 flex items-center gap-2">
                              <FileJson className="w-4 h-4 text-rio-gold" />
                              Detalles adicionales
                            </h4>
                            {ev.batch && (
                              <div className="mb-4">
                                <div className="text-xs font-bold text-rio-muted uppercase mb-1">Información de Lote</div>
                                <div className="bg-rio-background p-2 rounded text-xs">
                                  <div><span className="font-medium">Archivo:</span> {ev.batch.filename || 'N/A'}</div>
                                  <div><span className="font-medium">Estado:</span> {ev.batch.status}</div>
                                  {ev.batch.stats && (
                                    <pre className="mt-1 text-[10px] text-rio-ink font-mono bg-white p-2 border border-rio-border rounded overflow-x-auto">
                                      {JSON.stringify(ev.batch.stats, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            )}
                            {ev.changes && (
                              <div>
                                <div className="text-xs font-bold text-rio-muted uppercase mb-1">Cambios / Payload</div>
                                <pre className="text-[11px] text-rio-ink font-mono bg-rio-background p-3 border border-rio-border rounded overflow-x-auto">
                                  {JSON.stringify(ev.changes, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!isLoading && totalPages > 1 && (
          <div className="p-4 border-t border-rio-border flex items-center justify-between bg-white">
            <span className="text-sm text-rio-muted">
              Página <span className="font-bold text-rio-ink">{page}</span> de <span className="font-bold text-rio-ink">{totalPages}</span>
            </span>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1 rounded text-rio-muted hover:text-rio-ink hover:bg-rio-background disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1 rounded text-rio-muted hover:text-rio-ink hover:bg-rio-background disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

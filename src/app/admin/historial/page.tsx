'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getAuditEvents } from '@/app/actions/audit';
import { ChevronDown, ChevronUp, Search, Calendar, Filter, ChevronLeft, ChevronRight, Activity, FileJson } from 'lucide-react';
import { classNames } from '@/lib/utils';


const ACTION_MAP: Record<string, string> = {
  CREATE_PRODUCT: 'Creó Producto',
  UPDATE_PRODUCT: 'Actualizó Producto',
  DELETE_PRODUCT: 'Eliminó Producto',
  UPDATE_ORDER: 'Actualizó Pedido',
  STATUS_CHANGE: 'Cambio de Estado',
  CREATE_ORDER: 'Creó Pedido',
  UPLOAD_PHOTO: 'Subió Fotografía',
  BULK_UPLOAD: 'Importación Masiva',
  UPDATE_INVENTORY: 'Actualizó Inventario',
  CREATE_CUSTOMER: 'Creó Cliente',
  UPDATE_CUSTOMER: 'Actualizó Cliente',
  CREATE_SELLER: 'Creó Vendedor',
  UPDATE_SELLER: 'Actualizó Vendedor'
};

const ENTITY_MAP: Record<string, string> = {
  PRODUCT: 'Producto',
  ORDER: 'Pedido',
  INVOICE: 'Remisión',
  CUSTOMER: 'Cliente',
  SELLER: 'Vendedor',
  PHOTO: 'Fotografía'
};

const ORIGIN_MAP: Record<string, string> = {
  admin_dashboard: 'Panel Admin',
  ADMIN_DASHBOARD: 'Panel Admin',
  vendedor_app: 'App Vendedor',
  cliente_app: 'App Cliente',
  system: 'Sistema',
  migration_script: 'Migración Histórica',
  MIGRATION_SCRIPT: 'Migración Histórica',
  manual: 'Manual'
};


// Helper to render object diffs in a friendly way
function ChangesViewer({ changes }: { changes: any }) {
  if (!changes || typeof changes !== 'object') return <pre className="text-[11px] font-mono">{JSON.stringify(changes, null, 2)}</pre>;

  if (changes.action && changes.previousStatus && changes.nextStatus) {
    return (
      <div className="bg-white p-3 border border-rio-border rounded-lg space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-rio-danger bg-rio-danger/10 px-2 py-0.5 rounded text-sm font-bold whitespace-nowrap">De {changes.previousStatus}</span>
          <span className="text-rio-muted">→</span>
          <span className="text-rio-success bg-rio-success/10 px-2 py-0.5 rounded text-sm font-bold whitespace-nowrap">a {changes.nextStatus}</span>
        </div>
        {changes.reason && (
          <div className="text-sm text-rio-muted italic mt-1">
            Motivo: {changes.reason}
          </div>
        )}
      </div>
    );
  }

  if (changes.before && changes.after) {
    const keys = Array.from(new Set([...Object.keys(changes.before), ...Object.keys(changes.after)]));
    const differences = keys.filter(k => JSON.stringify(changes.before[k]) !== JSON.stringify(changes.after[k]));
    
    if (differences.length === 0) return <div className="text-sm text-rio-muted italic">Sin cambios detectados (solo guardado).</div>;

    return (
      <div className="space-y-2">
        <p className="text-xs text-rio-muted">Se detectaron modificaciones en los siguientes campos:</p>
        <ul className="space-y-1">
          {differences.map(k => (
            <li key={k} className="text-sm flex flex-col md:flex-row md:items-center gap-1 md:gap-3 bg-white p-2 rounded border border-rio-border">
              <span className="font-bold text-rio-ink min-w-[120px] capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-rio-danger bg-rio-danger/10 px-2 py-0.5 rounded truncate max-w-[200px]" title={String(changes.before[k])}>
                  {changes.before[k] === null ? 'vacío' : String(changes.before[k])}
                </span>
                <span className="text-rio-muted">→</span>
                <span className="text-rio-success bg-rio-success/10 px-2 py-0.5 rounded truncate max-w-[200px]" title={String(changes.after[k])}>
                  {changes.after[k] === null ? 'vacío' : String(changes.after[k])}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

    const PAYLOAD_KEYS: Record<string, string> = {
    totalProcessed: 'Total Procesados',
    newProducts: 'Nuevos Creados',
    updatedProducts: 'Actualizados',
    warnings: 'Advertencias',
    type: 'Tipo de Foto',
    filename: 'Nombre de Archivo',
    publicUrl: 'URL del Archivo',
    error: 'Detalle del Error'
  };

  return (
    <ul className="space-y-1 bg-white p-3 border border-rio-border rounded-lg">
      {Object.entries(changes).map(([key, value]) => {
        if (key === 'publicUrl' && typeof value === 'string') {
          return (
            <li key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm border-b border-rio-border/50 last:border-0 pb-2 last:pb-0 pt-1 first:pt-0">
              <span className="font-bold text-rio-muted min-w-[140px] uppercase text-[11px] tracking-wider">
                {PAYLOAD_KEYS[key] || key}
              </span>
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-rio-gold-dark font-bold hover:underline truncate max-w-sm">
                Ver archivo adjunto
              </a>
            </li>
          );
        }
        return (
          <li key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm border-b border-rio-border/50 last:border-0 pb-2 last:pb-0 pt-1 first:pt-0">
            <span className="font-bold text-rio-muted min-w-[140px] uppercase text-[11px] tracking-wider">
              {PAYLOAD_KEYS[key] || key.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            <span className="text-rio-ink font-medium break-all">
              {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

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
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-rio-ink flex items-center gap-2">
          <Activity className="w-6 h-6 text-rio-gold" />
          Historial de Actividad
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-rio-border p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-rio-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por SKU, N° Pedido, Actor o Entidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-rio-background border border-rio-border rounded-xl text-sm focus:outline-none focus:border-rio-gold focus:ring-1 focus:ring-rio-gold"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-rio-muted w-4 h-4" />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-rio-background border border-rio-border rounded-xl text-sm focus:outline-none focus:border-rio-gold appearance-none md:min-w-[160px]"
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
              className="w-full pl-9 pr-4 py-2.5 bg-rio-background border border-rio-border rounded-xl text-sm focus:outline-none focus:border-rio-gold md:min-w-[160px]"
            />
          </div>
          
          <button type="submit" className="bg-rio-ink text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-rio-ink/90 transition-colors">
            Filtrar
          </button>
        </form>
      </div>

      <div className="md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-rio-border overflow-hidden">
        <div className="space-y-3 md:hidden">
          {isLoading ? <div className="rounded-2xl border border-rio-border bg-white p-8 text-center text-sm text-rio-muted">Cargando historial...</div> : events.length === 0 ? <div className="rounded-2xl border border-dashed border-rio-border bg-white p-8 text-center text-sm text-rio-muted">No se encontraron eventos con estos filtros.</div> : events.map((ev) => (
            <article key={ev.id} className="rounded-2xl border border-rio-border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-rio-ink">{ACTION_MAP[ev.action] || ev.action}</p>
                  <p className="mt-1 text-xs text-rio-muted">{new Date(ev.createdAt).toLocaleString('es-CO')}</p>
                </div>
                <span className={classNames('shrink-0 rounded-md px-2 py-1 text-xs font-bold', ev.result === 'success' ? 'bg-rio-success/10 text-rio-success' : ev.result === 'error' ? 'bg-rio-danger/10 text-rio-danger' : 'bg-rio-warning/10 text-rio-warning')}>
                  {ev.result === 'success' ? 'Éxito' : ev.result === 'error' ? 'Error' : ev.result}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-rio-border pt-3 text-xs">
                <div className="min-w-0"><p className="font-bold uppercase tracking-wide text-rio-muted">Actor</p><p className="mt-1 truncate text-rio-ink">{ev.actorName || ev.actorId || 'Desconocido'}</p></div>
                <div className="min-w-0"><p className="font-bold uppercase tracking-wide text-rio-muted">Objetivo</p><p className="mt-1 text-rio-ink">{ENTITY_MAP[ev.entityType] || ev.entityType}</p><p className="truncate font-mono text-rio-muted">{ev.sku || ev.orderNumber || ev.entityId}</p></div>
              </div>
              {ev.origin && ev.origin !== 'manual' && <p className="mt-2 text-xs text-rio-gold-dark">Origen: {ORIGIN_MAP[ev.origin] || ev.origin}</p>}
              {(ev.changes || ev.batch) && <div className="mt-3 border-t border-rio-border pt-3">
                <button onClick={() => toggleExpand(ev.id)} aria-expanded={expandedId === ev.id} className="flex min-h-10 w-full items-center justify-between text-sm font-semibold text-rio-gold-dark">
                  Ver detalles {expandedId === ev.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedId === ev.id && <div className="space-y-3 pt-2">
                  {ev.batch && <div className="rounded-xl border border-rio-border bg-rio-background p-3 text-xs"><p className="font-bold">Información de lote</p><p>Archivo: {ev.batch.filename || 'N/A'}</p><p>Estado: {ev.batch.status}</p>{ev.batch.stats && <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all font-mono">{JSON.stringify(ev.batch.stats, null, 2)}</pre>}</div>}
                  {ev.changes && <ChangesViewer changes={ev.changes} />}
                </div>}
              </div>}
            </article>
          ))}
        </div>
        <div className="hidden md:block overflow-x-auto">
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
                        <div className="font-medium text-rio-ink">{ev.actorName?.includes('Admin/Eliminado') || ev.actorName?.includes('ID Histórico') ? (ev.actorId && ev.actorId !== 'system' ? `Administrador histórico · ID ${ev.actorId.substring(0, 8)}` : 'Administrador histórico') : (ev.actorName || ev.actorId || 'Desconocido')}</div>
                        <div className="text-xs text-rio-muted capitalize">{ev.actorRole}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-rio-ink/5 text-rio-ink">
                          {ACTION_MAP[ev.action] || ev.action}
                        </span>
                        {ev.origin && ev.origin !== 'manual' && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-rio-gold-light/30 text-rio-gold-dark">
                            {ORIGIN_MAP[ev.origin] || ev.origin}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-rio-ink">
                        <div className="font-medium">{ENTITY_MAP[ev.entityType] || ev.entityType}</div>
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
                                <ChangesViewer changes={ev.changes} />
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

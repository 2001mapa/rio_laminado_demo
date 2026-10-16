import type { Instrumentation } from 'next';
import { monitoringArea, safeMonitoringRoute, sendDiscordAlert } from './lib/discord-monitoring';

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const path = context.routePath.replace(/^\/app/, '').replace(/\/(?:page|route)$/, '');
  if (path.startsWith('/api/monitoring')) return;
  const area = monitoringArea(path);
  const digest = typeof error === 'object' && error !== null && 'digest' in error
    ? String(error.digest) : undefined;
  await sendDiscordAlert('server_error', area, {
    operation: context.routeType,
    route: safeMonitoringRoute(path, area),
    method: request.method,
    error,
    digest,
  });
};

import type { Instrumentation } from 'next';
import { monitoringArea, sendDiscordAlert } from './lib/discord-monitoring';

export const onRequestError: Instrumentation.onRequestError = async (error, _request, context) => {
  if (context.routePath.startsWith('/api/monitoring')) return;
  const name = error instanceof Error && /^[a-zA-Z]{1,40}$/.test(error.name) ? error.name : undefined;
  await sendDiscordAlert('server_error', monitoringArea(context.routePath), name);
};

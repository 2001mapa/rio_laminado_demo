'use client';
import { ErrorBoundary } from 'react-error-boundary';
import OriginalPage from './page.original';

function fallbackRender({ error, resetErrorBoundary }: any) {
  return (
    <div role="alert" style={{ color: 'red', background: 'black', padding: '20px' }}>
      <h1>MIGUEL ERROR CAPTURED:</h1>
      <pre>{error.message}</pre>
      <pre>{error.stack}</pre>
    </div>
  );
}

export default function Wrapper(props: any) {
  return (
    <ErrorBoundary fallbackRender={fallbackRender}>
      <OriginalPage {...props} />
    </ErrorBoundary>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

interface State { hasError: boolean; message?: string }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'ui-sans-serif, system-ui' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Something went wrong.</h1>
            <p style={{ marginTop: '0.75rem', color: '#444' }}>{this.state.message}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', background:'#2563eb', color:'#fff', padding:'0.6rem 1.2rem', borderRadius: '0.5rem' }}>
              Reload
            </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
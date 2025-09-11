/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

interface Props {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const NetworkErrorBanner: React.FC<Props> = ({ message, onRetry, onDismiss }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white shadow-lg flex items-center justify-between px-4 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-semibold">Network Error:</span>
        <span className="opacity-90">{message}</span>
      </div>
      <div className="flex items-center gap-2">
        {onRetry && (
          <button onClick={onRetry} className="bg-white/20 hover:bg-white/30 rounded px-2 py-1 text-xs font-medium transition-colors">Retry</button>
        )}
        {onDismiss && (
          <button onClick={onDismiss} className="bg-white/10 hover:bg-white/20 rounded px-2 py-1 text-xs">Dismiss</button>
        )}
      </div>
    </div>
  );
};

export default NetworkErrorBanner;

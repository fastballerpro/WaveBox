import { Component, type ReactNode } from 'react';
import { useT } from '@/lib/i18n';

interface State {
  err: Error | null;
}

function Fallback({ err, reset }: { err: Error; reset: () => void }) {
  const t = useT();
  return (
    <div className="p-8 max-w-2xl mx-auto text-text">
      <h1 className="text-xl font-semibold mb-3 text-accent">{t('error.title')}</h1>
      <pre className="text-xs whitespace-pre-wrap break-words glass glass-specular p-4 overflow-auto max-h-72">
        {String(err.stack || err.message || err)}
      </pre>
      <button onClick={reset} className="btn btn-primary mt-4">
        {t('error.reload')}
      </button>
    </div>
  );
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', err, info);
  }

  reset = () => this.setState({ err: null });

  render() {
    if (!this.state.err) return this.props.children;
    return <Fallback err={this.state.err} reset={this.reset} />;
  }
}

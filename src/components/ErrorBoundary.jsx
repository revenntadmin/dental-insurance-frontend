import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { has_error: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { has_error: true, error };
  }

  componentDidCatch(error) {
    // Only send minimal info — never bodies / PHI
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error?.message);
  }

  reset = () => this.setState({ has_error: false, error: null });

  render() {
    if (!this.state.has_error) return this.props.children;
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="max-w-md text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold">Something went wrong.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;ve been notified. You can try reloading the page or report a problem.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={() => window.location.reload()}>Reload</Button>
            <a href="mailto:support@clearclaim.io">
              <Button variant="outline">Report a problem</Button>
            </a>
          </div>
        </div>
      </div>
    );
  }
}

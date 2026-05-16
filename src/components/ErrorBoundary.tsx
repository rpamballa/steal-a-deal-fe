import React from 'react';

type Props = {children: React.ReactNode};
type State = {hasError: boolean};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {hasError: false};

  static getDerivedStateFromError(): State {
    return {hasError: true};
  }

  componentDidCatch(error: unknown) {
    // Surfaced for diagnostics; never shown raw to the user.
    console.error('Unhandled UI error:', error);
  }

  handleReload = () => {
    this.setState({hasError: false});
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return (
      <div className="error-boundary" role="alert">
        <div className="error-boundary-card">
          <p className="brand-kicker">Steal A Deal</p>
          <h1>Something went wrong</h1>
          <p>
            We hit an unexpected problem on this page. Your data is safe — please
            reload to continue.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={this.handleReload}>
            Reload the page
          </button>
        </div>
      </div>
    );
  }
}

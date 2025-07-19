import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, ErrorBoundaryState> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can log error info here if needed
    // console.error(error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: 40, color: 'red', fontSize: 20}}>
          <b>Something went wrong.</b>
          <div style={{marginTop: 20}}>{this.state.error?.toString()}</div>
          <div style={{marginTop: 10}}>Check the browser console for more details.</div>
        </div>
      );
    }
    return this.props.children;
  }
} 
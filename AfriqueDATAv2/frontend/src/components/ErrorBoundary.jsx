import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
          <div className="text-center" style={{ maxWidth: 500 }}>
            <h1 className="text-danger mb-3">Erreur</h1>
            <p className="text-muted mb-3">{String(this.state.error?.message || this.state.error)}</p>
            <p className="small text-muted">
              Vérifiez que les variables d'environnement (REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY) sont configurées sur Vercel.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Recharger
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

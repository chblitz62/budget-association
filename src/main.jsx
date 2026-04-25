import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BudgetProvider } from './contexts/BudgetContext.jsx'
import './index.css' // Si ce fichier n'existe pas, vous pouvez supprimer cette ligne

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#1a1a2e', color: '#e2e2e2', minHeight: '100vh' }}>
          <h2 style={{ color: '#ff6b6b' }}>Erreur React — détails :</h2>
          <pre style={{ color: '#ffd93d', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error?.message}
          </pre>
          <pre style={{ color: '#aaa', fontSize: 11 }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BudgetProvider>
        <App />
      </BudgetProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App.jsx";
import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("🚨 Error in component:", error);
    console.error("🚨 Error info:", errorInfo);
    console.error("🚨 Error stack:", error.stack);
    
    // Log additional details for debugging
    console.error("🚨 Component stack:", errorInfo.componentStack);
    console.error("🚨 Error boundary triggered by:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
          <h2>Something went wrong. Please refresh the page.</h2>
          <button onClick={() => window.location.reload()} style={{
            padding: '10px 20px',
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Clear any existing content in the root element
document.getElementById('root').innerHTML = '';

// Create root and render app with error boundary
const root = createRoot(document.getElementById("root"));

try {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error("Failed to render the app:", error);
  document.getElementById('root').innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h2>Failed to load the application</h2>
      <p>${error.message}</p>
      <button onclick="window.location.reload()" style="
        padding: 10px 20px;
        background: #4f46e5;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
      ">
        Try Again
      </button>
    </div>
  `;
}

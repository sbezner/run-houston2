import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AdminDashboard } from './pages/AdminDashboard/AdminDashboard';

// Admin App Component (Admin + Monitoring only)
function App() {
  return (
    <Router>
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        margin: 0,
        padding: 0
      }}>
        {/* Navigation */}
        <nav style={{ 
          backgroundColor: '#fff', 
          padding: '1rem 2rem', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          width: '100%'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#007AFF' }}>
            🔧 Run Houston Admin
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link to="/admin" style={{ color: '#5F6368', textDecoration: 'none', fontWeight: '500' }}>Admin</Link>
          </div>
        </nav>

        {/* Main Content */}
        <main style={{ flex: 1, width: '100%' }}>
          <Routes>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/" element={<AdminDashboard />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer style={{ 
          backgroundColor: '#333', 
          color: 'white', 
          textAlign: 'center', 
          padding: '2rem',
          marginTop: 'auto',
          width: '100%'
        }}>
          <p>© 2025 Run Houston Admin. Manage your race platform.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;

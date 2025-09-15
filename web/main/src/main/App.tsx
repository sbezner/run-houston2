import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { MarketingHome } from '../pages/MarketingHome';
import { RacesPage } from '../pages/RacesPage';
import { AboutPage } from '../pages/AboutPage';
import { ClubsPage } from '../pages/ClubsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { ReportDetail } from '../pages/ReportDetail';

// Main App Component (Public-facing)
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
          justifyContent: 'flex-start',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          width: '100%'
        }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link to="/" style={{ color: '#5F6368', textDecoration: 'none', fontWeight: '500' }}>Home</Link>
            <Link to="/races" style={{ color: '#5F6368', textDecoration: 'none', fontWeight: '500' }}>Races</Link>
            <Link to="/race_reports" style={{ color: '#5F6368', textDecoration: 'none', fontWeight: '500' }}>Race Reports</Link>
            <Link to="/clubs" style={{ color: '#5F6368', textDecoration: 'none', fontWeight: '500' }}>Clubs</Link>
            <Link to="/about" style={{ color: '#5F6368', textDecoration: 'none', fontWeight: '500' }}>About</Link>
          </div>
        </nav>

        {/* Main Content */}
        <main style={{ flex: 1, width: '100%' }}>
          <Routes>
            <Route path="/" element={<MarketingHome />} />
            <Route path="/races" element={<RacesPage />} />
            <Route path="/race_reports" element={<ReportsPage />} />
            <Route path="/race_reports/:id" element={<ReportDetail />} />
            <Route path="/clubs" element={<ClubsPage />} />
            <Route path="/about" element={<AboutPage />} />
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
          <p>© 2025 Run Houston. Discover your next race adventure!</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;

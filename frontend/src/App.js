import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import DQPage from './pages/DQPage';
import MaturityPage from './pages/MaturityPage';
import PolicyPage from './pages/PolicyPage';
import CasePage from './pages/CasePage';
import './App.css';

function App() {
  const [page, setPage] = useState('home');
  const [dqScore, setDqScore] = useState(null);
  const sessionId = 'session_' + Date.now();

  const navigate = (p) => {
    setPage(p);
    window.scrollTo(0, 0);
  };

  return (
    <div className="app-root">
      {page === 'home' && <HomePage onNavigate={navigate} />}
      {page === 'dq' && <DQPage onNavigate={navigate} sessionId={sessionId} />}
      {page === 'maturity' && <MaturityPage onNavigate={navigate} sessionId={sessionId} dqScore={dqScore} />}
      {page === 'policy' && <PolicyPage onNavigate={navigate} />}
      {page === 'case' && <CasePage onNavigate={navigate} />}
    </div>
  );
}

export default App;

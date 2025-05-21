import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CandidateForm from './components/CandidateForm';
import './App.css';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Router>
      <div className="app">
        <nav>
          <h1>Fraud Candidate Checker</h1>
          {session && (
            <div className="nav-links">
              <Link to="/">Dashboard</Link>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </nav>
        <main>
          <Routes>
            <Route path="/" element={session ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
            <Route 
              path="/add-candidate" 
              element={session ? <CandidateForm /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/edit-candidate/:id" 
              element={session ? <CandidateForm editMode={true} /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

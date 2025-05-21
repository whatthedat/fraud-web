import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    
    getUser();
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('fraud_candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCandidates(data || []);
      setFilteredCandidates(data || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCandidates(candidates);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = candidates.filter(candidate => 
      candidate.name.toLowerCase().includes(searchLower) ||
      candidate.email.toLowerCase().includes(searchLower) ||
      (candidate.phone && candidate.phone.includes(searchTerm))
    );
    
    setFilteredCandidates(filtered);
  }, [searchTerm, candidates]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Fraud Candidate Database</h1>
          <Link to="/add-candidate" className="add-button">
            + Add New Candidate
          </Link>
        </div>
        
        <div className="search-container">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="clear-search"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="candidates-list">
        {filteredCandidates.length === 0 ? (
          <p>No fraud candidates found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Added By</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td>{candidate.name}</td>
                  <td>{candidate.email}</td>
                  <td>{candidate.phone}</td>
                  <td>{candidate.added_by}</td>
                  <td>{new Date(candidate.created_at).toLocaleDateString()}</td>
                  <td className="actions">
                    <div className="action-buttons">
                      {candidate.resume_url && (
                        <button 
                          onClick={() => window.open(candidate.resume_url, '_blank', 'noopener,noreferrer')}
                          className="view-resume"
                          title="View Resume"
                        >
                          📄
                        </button>
                      )}
                      {currentUser?.email === candidate.added_by && (
                        <Link 
                          to={`/edit-candidate/${candidate.id}`}
                          className="edit-link"
                          title="Edit Candidate"
                        >
                          ✏️
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

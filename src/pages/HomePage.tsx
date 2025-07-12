import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

interface Club {
  id: number;
  name: string;
  description: string;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const HomePage: React.FC<{ token: string }> = ({ token }) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const history = useHistory();

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await axios.get(`${API_URL}/clubs/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClubs(res.data as Club[]);
      } catch (err) {
        setClubs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, [token]);

  return (
    <div>
      <h2>Your Clubs</h2>
      {loading ? (
        <div>Loading...</div>
      ) : clubs.length === 0 ? (
        <div>No clubs found.</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
          {clubs.map(club => (
            <div
              key={club.id}
              className="club-box"
              style={{
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(80,128,127,0.10)',
                padding: '1.5rem',
                minWidth: '220px',
                cursor: 'pointer',
                transition: 'transform 0.15s',
                border: '2px solid #f2d694',
                flex: '1 0 220px',
                maxWidth: '300px',
                textAlign: 'center',
                fontWeight: 500
              }}
              onClick={() => history.push(`/clubs/${club.id}`)}
            >
              <div style={{ fontSize: '1.3rem', color: '#50807f', marginBottom: '0.5rem' }}>{club.name}</div>
              <div style={{ color: '#874e2c', fontSize: '1rem' }}>{club.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
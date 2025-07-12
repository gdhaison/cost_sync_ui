import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import HomePage from './pages/HomePage';
import ClubDetailPage from './pages/ClubDetailPage';
import Header from './components/Header';
import './App.css';

const App: React.FC = () => {
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) setTokenState(savedToken);
    setLoading(false);
  }, []);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
  };

  const handleLogout = () => {
    setTokenState(null);
    localStorage.removeItem('token');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <div className="app-container">
        <Header onLogout={handleLogout} />
        <div className="card">
          <Switch>
            <Route path="/login">
              {token ? <Redirect to="/" /> : <LoginForm onLoginSuccess={setToken} />}
            </Route>
            <Route path="/clubs/:clubId">
              {token ? <ClubDetailPage token={token} /> : <Redirect to="/login" />}
            </Route>
            <Route path="/">
              {token ? <HomePage token={token} /> : <Redirect to="/login" />}
            </Route>
          </Switch>
        </div>
      </div>
    </Router>
  );
};

export default App;

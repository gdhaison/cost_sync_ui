import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import LoginForm from './components/LoginForm';
import HomePage from './pages/HomePage';
import ClubDetailPage from './pages/ClubDetailPage';
import RegisterPage from './pages/RegisterPage';
import Header from './components/Header';
import './App.css';

const App: React.FC = () => {
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function isTokenValid(token: string | null): boolean {
    if (!token) return false;
    try {
      const decoded: any = jwtDecode(token);
      if (!decoded.exp) return false;
      const now = Date.now() / 1000;
      return decoded.exp > now;
    } catch {
      return false;
    }
  }

  useEffect(() => {
  const setVh = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  setVh();
  window.addEventListener('resize', setVh);
  return () => window.removeEventListener('resize', setVh);
}, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken && isTokenValid(savedToken)) {
      setTokenState(savedToken);
    } else {
      setTokenState(null);
      localStorage.removeItem('token');
    }
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
            <Route path="/register">
              <RegisterPage />
            </Route>
            <Route path="/clubs/:clubId">
              {token && isTokenValid(token) ? <ClubDetailPage token={token} /> : <Redirect to="/login" />}
            </Route>
            <Route path="/">
              {token && isTokenValid(token) ? <HomePage token={token} /> : <Redirect to="/login" />}
            </Route>
          </Switch>
        </div>
      </div>
    </Router>
  );
};

export default App;

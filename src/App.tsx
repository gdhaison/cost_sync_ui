import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <Router>
        <Switch>
          <Route path="/" exact>
            <div className="card">
              <LoginPage />
            </div>
          </Route>
        </Switch>
      </Router>
    </div>
  );
};

export default App;
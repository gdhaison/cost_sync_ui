import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import logo from '../assets/logo.png';
import './Header.css';

interface HeaderProps {
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const history = useHistory();
  return (
    <header className="main-header">
      <nav className="navbar">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Cost Sync Logo" />
        </Link>
        <Link to="/" className="navbar-home">Home</Link>
        <div className="navbar-right">
          <div className="dropdown">
            <button className="dropdown-btn" aria-label="Account options">
              <>{FiIcons.FiSettings?.({ size: 26 })}</>
            </button>
            <div className="dropdown-content">
              <button onClick={() => history.push('/account')}>Account Detail</button>
              <button onClick={onLogout}>Logout</button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;

import React, { useState } from 'react';
import { login } from '../api/auth';
import { LoginCredentials } from '../types/auth';
import { Link } from 'react-router-dom';

interface LoginFormProps {
  onLoginSuccess?: (token: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const credentials: LoginCredentials = {
            login_id: email,
            login_id_type: 'email',
            password,
        };

        try {
            const res = await login(credentials);
            onLoginSuccess?.(res.access_token);
        } catch (err) {
            setError('Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Email:</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Password:</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <button type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
            </button>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <span>Don't have an account? </span>
                <Link to="/register">Register</Link>
            </div>
        </form>
    );
};

export default LoginForm;

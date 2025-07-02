import axios from 'axios';
import { LoginCredentials, LoginResponse } from '../types/auth';

const API_URL = process.env.BASE_URL || 'http://localhost:5000';

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await axios.post(`${API_URL}/login`, {
        login_id: credentials.login_id,
        password: credentials.password,
    });
    return response.data as LoginResponse;
};
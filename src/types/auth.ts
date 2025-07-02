export interface LoginCredentials {
  login_id: string;
  login_id_type: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  // Add other fields from the response as needed
}
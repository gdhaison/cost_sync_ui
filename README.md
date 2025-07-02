# Cost Sync UI

This project is a React application for the Cost Sync API, implementing user authentication functionality.

## Project Structure

```
cost_sync_ui
├── public
│   └── index.html          # Main HTML file for the application
├── src
│   ├── api
│   │   └── auth.ts        # API calls related to authentication
│   ├── components
│   │   └── LoginForm.tsx   # Login form component
│   ├── pages
│   │   └── LoginPage.tsx    # Login page component
│   ├── App.tsx             # Main application component
│   ├── index.tsx           # Entry point for the React application
│   └── types
│       └── auth.ts         # TypeScript interfaces for authentication
├── package.json             # npm configuration file
├── tsconfig.json            # TypeScript configuration file
└── README.md                # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd cost_sync_ui
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Run the application:**
   ```
   npm start
   ```

4. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`.

## Usage

- Navigate to the login page to authenticate users.
- The application communicates with the Cost Sync API for user login functionality.

## API Endpoints

- **Login:** `POST /login`
  - Requires `login_id` (email) and `password`.
  - On success, returns an access token for further authenticated requests.
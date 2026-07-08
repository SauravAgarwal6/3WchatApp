import React, { useState } from 'react';
import axios from 'axios';

export default function Auth({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const { data } = await axios.post(`https://threewchatapp-api.onrender.com${endpoint}`, { username, password });
      
      // Store token for future authenticated requests
      localStorage.setItem('chat_token', data.token);
      onLogin(data.user.username);
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed. Please try again.");
    }
  };

  const handleGuest = () => {
    const guestName = `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
    onLogin(guestName);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isRegister ? "Create Account" : "Welcome Back"}</h2>
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn">
            {isRegister ? "Register" : "Sign In"}
          </button>
        </form>
        
        <button className="btn-toggle" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Already have an account? Login" : "Need an account? Register"}
        </button>
        
        <div style={{ margin: '15px 0', color: 'var(--text-muted)' }}>OR</div>
        
        <button onClick={handleGuest} className="btn btn-secondary">
          Skip as Guest
        </button>
      </div>
    </div>
  );
}
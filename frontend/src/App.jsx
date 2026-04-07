import React, { useState, useEffect } from 'react'
import HomePage from './pages/HomePage'
import Dashboard from './pages/Dashboard'
import AuthPage from './pages/AuthPage'

const API_BASE = import.meta.env.MODE === 'development' ? 'http://localhost:5000/api' : '/api';

function App() {
  const [trips, setTrips] = useState([]);
  const [activeTripId, setActiveTripId] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');

  // Fetch all trips using token
  useEffect(() => {
    if (token) {
      fetchTrips();
    }
  }, [token]);

  const fetchTrips = async () => {
    try {
      const res = await fetch(`${API_BASE}/trips`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) handleLogout(); // Invalid token catch
        return;
      }
      
      const data = await res.json();
      
      const formattedTrips = data.map(t => ({
        id: t._id,
        title: t.title,
        friends: t.members ? t.members.map(m => ({ id: m._id, name: m.nameInTrip })) : [],
        transactions: [] 
      }));
      setTrips(formattedTrips);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginSuccess = (newToken, newName) => {
    setToken(newToken);
    setUserName(newName || '');
    localStorage.setItem('token', newToken);
    if (newName) localStorage.setItem('userName', newName);
  };

  const handleLogout = () => {
    setToken(null);
    setUserName('');
    setTrips([]);
    setActiveTripId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
  };

  const handleCreateTrip = async (tripData) => {
    if (!token) return;
    try {
      // 1. Create Trip in DB
      const res = await fetch(`${API_BASE}/trips`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: tripData.title })
      });
      const newBackendTrip = await res.json();
      
      // 2. Add friends individually as members in DB
      for (const name of tripData.friends) {
        await fetch(`${API_BASE}/trips/${newBackendTrip._id}/members`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name })
        });
      }
      
      // Refresh the trips list so it appears in the sidebar natively and correctly mapped
      await fetchTrips();
      setActiveTripId(newBackendTrip._id);
    } catch (err) {
       console.error("Error creating trip:", err);
    }
  };

  const activeTrip = trips.find(t => t.id === activeTripId);

  if (!token) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {!activeTripId ? (
        <HomePage 
          onComplete={handleCreateTrip} 
          trips={trips}
          setActiveTripId={setActiveTripId}
          userName={userName}
          onLogout={handleLogout}
        />
      ) : (
        <Dashboard 
          trips={trips} 
          activeTrip={activeTrip} 
          setActiveTripId={setActiveTripId}
          setTrips={setTrips}
          token={token}
          userName={userName}
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}

export default App

import React, { useState } from 'react';
import { Compass, Users, User, ClipboardList, ArrowLeft, Map, Menu, X, Map as MapIcon } from 'lucide-react';

function HomePage({ onComplete, trips = [], setActiveTripId, userName, onLogout }) {
  const [step, setStep] = useState(1);
  const [tripTitle, setTripTitle] = useState('');
  const [numFriends, setNumFriends] = useState('');
  const [friendNames, setFriendNames] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (!tripTitle.trim()) {
      alert("Please enter a trip title.");
      return;
    }
    const count = parseInt(numFriends, 10);
    if (!isNaN(count) && count > 0) {
      setFriendNames(Array(count).fill(''));
      setStep(2);
    } else {
      alert("Please enter a valid number of friends.");
    }
  };

  const handleNameChange = (index, value) => {
    const newNames = [...friendNames];
    newNames[index] = value;
    setFriendNames(newNames);
  };

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    if (friendNames.some(name => name.trim() === '')) {
      alert("Please fill in all friend names.");
      return;
    }
    setLoading(true);
    await onComplete({
      title: tripTitle,
      friends: friendNames
    });
    setLoading(false);
  };

  return (
    <div className="homepage">
      {/* Sliding Sidebar */}
      <div 
        className={`overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      <div className={`sidebar-slider ${isSidebarOpen ? 'open' : ''}`}>
        <div className="slider-header">
          <span style={{ fontWeight: '700', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Compass size={24} /> Dashboard
          </span>
          <button 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {trips.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No trips yet. Create one!
            </div>
          ) : (
             trips.map(trip => (
              <div 
                key={trip.id} 
                className="trip-nav-item"
                onClick={() => setActiveTripId(trip.id)}
              >
                <MapIcon size={20} className="trip-icon" />
                <span>{trip.title}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <header className="header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}
            title="Open Dashboard Sidebar"
          >
            <Menu size={28} />
          </button>
          <div className="logo-container">
            <Compass size={28} strokeWidth={2.5} />
            <span className="logo-text">TripHub</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {userName && <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Hello, {userName}</span>}
          <button className="login-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main className="main-content">
        {step === 1 && (
          <div className="step-card">
            <ClipboardList className="clipboard-icon" size={32} />
            <div className="card-header">
              <h2 className="card-title">Step 1: Start your Trip Crew!</h2>
              <p className="card-subtitle">Give your trip a name and tell us the crew size.</p>
            </div>
            <form onSubmit={handleNextStep1}>
              <div className="input-group">
                <label className="friend-label" style={{marginBottom: '6px', display: 'block', fontSize: '0.9rem'}}>Trip Title</label>
                <div className="input-wrapper" style={{marginBottom: '1.25rem'}}>
                  <Map className="input-icon" />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Goa Beach Trip" 
                    value={tripTitle}
                    onChange={(e) => setTripTitle(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="friend-label" style={{marginBottom: '6px', display: 'block', fontSize: '0.9rem'}}>How many friends are joining?</label>
                <div className="input-wrapper">
                  <Users className="input-icon" />
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 4" 
                    value={numFriends}
                    onChange={(e) => setNumFriends(e.target.value)}
                    min="1"
                    max="20"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="primary-btn mt-4">
                Next: Add Names.
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="step-card">
            <ClipboardList className="clipboard-icon" size={32} />
            <button 
              type="button" 
              onClick={() => setStep(1)}
              style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}
              title="Go back"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="card-header">
              <h2 className="card-title">Step 2: Enter Friend Names</h2>
              <p className="card-subtitle">
                [{friendNames.length || '0'}] friends registered! Provide their names below.
              </p>
            </div>
            
            <form onSubmit={handleCompleteRegistration}>
              <div className="names-grid">
                {friendNames.map((name, index) => (
                  <div key={index} className="friend-input-container">
                    <span className="friend-label">Friend {index + 1} Name</span>
                    <div className="friend-input-wrapper">
                      <User className="input-icon" size={18} />
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => handleNameChange(index, e.target.value)}
                        placeholder={`Name ${index + 1}`}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                type="submit" 
                className="primary-btn" 
                disabled={friendNames.length === 0 || loading}
              >
                {loading ? 'Starting Trip...' : 'Complete Registration'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default HomePage;
import React, { useState, useEffect } from 'react';
import { Compass, User, Banknote, ListPlus, Map as MapIcon, Pencil, Trash2, BarChart3, X } from 'lucide-react';

const API_BASE = import.meta.env.MODE === 'development' ? 'http://localhost:5000/api' : '/api';

function Dashboard({ trips, activeTrip, setActiveTripId, setTrips, token, userName, onLogout }) {
  const [expenseName, setExpenseName] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  const [contributorIds, setContributorIds] = useState([]);
  const [editingTxId, setEditingTxId] = useState(null);
  
  const [summaryTripId, setSummaryTripId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  const isAllChecked = activeTrip?.friends?.length > 0 && contributorIds.length === activeTrip.friends.length;

  const handleToggleAll = () => {
    if (isAllChecked) {
      setContributorIds([]);
    } else {
      setContributorIds(activeTrip.friends.map(f => f.id));
    }
  };

  const fetchTransactions = async () => {
    if (!activeTrip || !token) return;
    try {
      const res = await fetch(`${API_BASE}/trips/${activeTrip.id}/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      const formatted = data.map(tx => ({
        id: tx._id,
        expenseName: tx.description,
        amount: tx.amount,
        payerId: tx.payer?._id,
        payer: tx.payer?.nameInTrip || 'Unknown',
        contributorIds: tx.contributors.map(c => c.memberId?._id),
        contributors: tx.contributors.map(c => c.memberId?.nameInTrip || 'Unknown')
      }));
      setTransactions(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    resetForm();
    fetchTransactions();
  }, [activeTrip?.id]);

  const resetForm = () => {
    setExpenseName('');
    setAmount('');
    setPayerId('');
    setContributorIds([]);
    setEditingTxId(null);
  };

  const handleToggleContributor = (fid) => {
    if (contributorIds.includes(fid)) {
      setContributorIds(contributorIds.filter(c => c !== fid));
    } else {
      setContributorIds([...contributorIds, fid]);
    }
  };

  const handleEditTransaction = (tx) => {
    setExpenseName(tx.expenseName);
    setAmount(tx.amount.toString());
    setPayerId(tx.payerId);
    setContributorIds(tx.contributorIds);
    setEditingTxId(tx.id);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddOrUpdateTransaction = async (e) => {
    e.preventDefault();
    if (!expenseName || !amount || !payerId || contributorIds.length === 0) {
      alert("Please fill all transaction fields.");
      return;
    }

    try {
      const url = editingTxId 
        ? `${API_BASE}/trips/${activeTrip.id}/transactions/${editingTxId}`
        : `${API_BASE}/trips/${activeTrip.id}/transactions`;
        
      const method = editingTxId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          description: expenseName,
          amount: parseFloat(amount),
          payerId: payerId,
          contributorMemberIds: contributorIds
        })
      });
      
      if (res.ok) {
        await fetchTransactions(); // Refresh from DB
        resetForm();
      } else {
        const errData = await res.json();
        alert("Error saving: " + errData.message);
      }
    } catch (err) {
       console.error(err);
    }
  };

  const handleDeleteTransaction = async (txId) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      const res = await fetch(`${API_BASE}/trips/${activeTrip.id}/transactions/${txId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchTransactions(); // Refresh UI
      } else {
        alert("Failed to delete");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTrip = async () => {
    if (!window.confirm(`Are you sure you want to completely delete "${activeTrip.title}" and all its records?`)) return;
    try {
      const res = await fetch(`${API_BASE}/trips/${activeTrip.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Find if there's another trip to fallback to, otherwise null
        const remainingTrips = trips.filter(t => t.id !== activeTrip.id);
        setActiveTripId(remainingTrips.length > 0 ? remainingTrips[0].id : null);
        window.location.reload(); // Hard reload to fully clean state via App.jsx fetchTrips
      } else {
        const errData = await res.json();
        alert("Failed to delete trip: " + errData.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchSummary = async () => {
      if (!summaryTripId || !token) return;
      try {
        const res = await fetch(`${API_BASE}/trips/${summaryTripId}/settlement`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setSummaryData(data);
      } catch (err) {
        console.error("Failed to fetch settlement data:", err);
      }
    };
    fetchSummary();
  }, [summaryTripId, token]);


  return (
    <div className="dashboard-layout">
      {summaryTripId && (
        <>
          <div className="overlay open" onClick={() => setSummaryTripId(null)}></div>
          <div className="summary-modal">
            <div className="modal-header">
              <h3>{summaryData?.title || 'Loading'} - Verified Settlement Summary</h3>
              <button className="close-btn" onClick={() => setSummaryTripId(null)}><X size={20}/></button>
            </div>
            <div className="modal-content table-responsive">
              {summaryData ? (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Friend</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Net Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryData.net_positions.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '1rem 0.5rem' }}>{row.name}</td>
                          <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold', color: row.net > 0 ? '#10b981' : row.net < 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                            {row.net > 0 ? `Send: ₹${Math.abs(row.net).toFixed(0)}` : row.net < 0 ? `Take: ₹${Math.abs(row.net).toFixed(0)}` : `Settled: ₹0`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <h4 style={{marginTop: '2rem'}}>Direct Payment Paths (Simplification Algorithm):</h4>
                  <ul style={{textAlign: 'left'}}>
                    {summaryData.payment_paths.map((p, idx) => (
                      <li key={idx} style={{padding: '0.5rem 0'}}>💸 <strong>{p.from}</strong> must pay <strong>{p.to}</strong> an amount of ₹{p.amount}</li>
                    ))}
                    {summaryData.payment_paths.length === 0 && <p>No debts found! Everyone is settled.</p>}
                  </ul>
                </>
              ) : (
                <p>Loading API Settlement Math...</p>
              )}
              
              <div style={{ textAlign: 'right', marginTop: '1.5rem' }}>
                <button className="login-btn" onClick={() => setSummaryTripId(null)}>Close</button>
              </div>
            </div>
          </div>
        </>
      )}

      <header className="dashboard-header">
        <div className="logo-container">
          <Compass size={28} strokeWidth={2.5} />
          <span className="logo-text">TripHub</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {userName && <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Hello, {userName}</span>}
          <button className="login-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="dashboard-main">
        <aside className="sidebar">
          {trips.map(trip => (
            <div 
              key={trip.id} 
              className={`trip-nav-item ${activeTrip?.id === trip.id ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }} onClick={() => setActiveTripId(trip.id)}>
                <MapIcon size={20} className="trip-icon" />
                <span>{trip.title}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setSummaryTripId(trip.id); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}
                title="View Summary"
              >
                <BarChart3 size={20} />
              </button>
            </div>
          ))}
          <div className="trip-nav-item create-new" onClick={() => setActiveTripId(null)} style={{justifyContent: 'flex-start'}}>
            <span>+ Create New Trip</span>
          </div>
        </aside>

        {activeTrip ? (
          <section className="workspace">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 className="workspace-title">{activeTrip.title}</h1>
              <button 
                onClick={handleDeleteTrip}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                title="Delete Entire Trip"
              >
                <Trash2 size={20} />
                <span style={{ fontWeight: 600 }}>Delete Trip</span>
              </button>
            </div>

            <div className="card transaction-card" style={{ marginBottom: '2rem' }}>
              <h2 className="card-heading">{editingTxId ? "Edit Transaction" : "Add New Transaction"}</h2>
              <form onSubmit={handleAddOrUpdateTransaction}>
                 <div className="form-row">
                   <div className="form-group flex-2">
                     <label>What's the expense for?</label>
                     <div className="input-with-icon">
                       <ListPlus size={18} />
                       <input 
                         type="text" 
                         value={expenseName} 
                         onChange={(e) => setExpenseName(e.target.value)} 
                         placeholder="e.g. Airport Taxi" 
                         required 
                       />
                     </div>
                   </div>
                   <div className="form-group flex-1">
                     <label>How much money?</label>
                     <div className="input-with-icon">
                       <Banknote size={18} />
                       <input 
                         type="number" 
                         value={amount} 
                         onChange={(e) => setAmount(e.target.value)} 
                         placeholder="₹4500" 
                         min="1" 
                         required 
                       />
                     </div>
                   </div>
                 </div>

                 <div className="form-group mt-3">
                   <label>Who sent the money?</label>
                   <div className="input-with-icon">
                     <User size={18} />
                     <select className="custom-select" value={payerId} onChange={(e) => setPayerId(e.target.value)} required>
                       <option value="" disabled>Select a person</option>
                       {activeTrip.friends.map(friend => (
                         <option key={friend.id} value={friend.id}>{friend.name}</option>
                       ))}
                     </select>
                   </div>
                 </div>

                 <div className="form-group mt-3">
                   <label>Who are the contributors?</label>
                   <div className="checkbox-group">
                     <label key="all" className="custom-checkbox">
                       <input 
                         type="checkbox" 
                         checked={isAllChecked}
                         onChange={handleToggleAll}
                       />
                       <span className="checkmark"></span>
                       All
                     </label>
                     {activeTrip.friends.map(friend => (
                       <label key={friend.id} className="custom-checkbox">
                         <input 
                           type="checkbox" 
                           checked={contributorIds.includes(friend.id)}
                           onChange={() => handleToggleContributor(friend.id)}
                         />
                         <span className="checkmark"></span>
                         {friend.name}
                       </label>
                     ))}
                   </div>
                 </div>

                 <div style={{ display: 'flex', gap: '1rem' }} className="mt-4">
                   <button type="submit" className="primary-btn">
                     {editingTxId ? "Update Transaction" : "Add Transaction to DB"}
                   </button>
                   {editingTxId && (
                     <button type="button" className="login-btn" onClick={resetForm} style={{ width: '100%' }}>
                       Cancel Edit
                     </button>
                   )}
                 </div>
              </form>
            </div>

            <div className="card records-card">
               <h3 className="card-heading">{activeTrip.title} DB Records</h3>
               
               {transactions.length === 0 ? (
                 <p style={{ color: 'var(--text-muted)' }}>No database transactions yet. Start adding DB expenses above!</p>
               ) : (
                 <div className="table-responsive">
                   <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                     <thead>
                       <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                         <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Description</th>
                         <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Amount</th>
                         <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Paid By</th>
                         <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Contributors</th>
                         <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                       </tr>
                     </thead>
                     <tbody>
                       {transactions.map((tx) => (
                         <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                           <td style={{ padding: '1rem 0.5rem', fontWeight: 500 }}>{tx.expenseName}</td>
                           <td style={{ padding: '1rem 0.5rem' }}>₹{tx.amount}</td>
                           <td style={{ padding: '1rem 0.5rem' }}>{tx.payer}</td>
                           <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>{tx.contributors.join(', ')}</td>
                           <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                             <button 
                               onClick={() => handleEditTransaction(tx)}
                               style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', marginRight: '1rem' }}
                               title="Edit"
                             >
                               <Pencil size={18} />
                             </button>
                             <button 
                               onClick={() => handleDeleteTransaction(tx.id)}
                               style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}
                               title="Delete"
                             >
                               <Trash2 size={18} />
                             </button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}

               <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                 <button 
                   onClick={() => setSummaryTripId(activeTrip.id)}
                   className="primary-btn"
                   style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', padding: '0.8rem 1.5rem' }}
                 >
                   <BarChart3 size={20} />
                   View Settlement Summary
                 </button>
               </div>
            </div>

          </section>
        ) : (
           <section className="workspace" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
             <h2>Please select or create a trip</h2>
           </section>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

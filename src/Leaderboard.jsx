import React, { useState, useEffect } from 'react';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const BACKEND_URL = 'https://leaderboard-backend-qpmb.onrender.com';
  const REFRESH_INTERVAL = 30000; // 30 seconds

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/leaderboard`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      setLeaderboard(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Unable to load leaderboard. Please refresh the page.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and set up interval
  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Format elapsed time (milliseconds) to MM:SS.ms format
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(ms % 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  // Filter leaderboard based on search query
  const filteredLeaderboard = leaderboard.filter(entry => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${entry.firstName} ${entry.lastInitial}`.toLowerCase();
    const troop = entry.troopNumber.toString();
    return (
      fullName.includes(searchLower) ||
      troop.includes(searchLower)
    );
  });

  // Highlight the first search result (user's entry)
  const highlightedIndex = searchQuery ? 0 : -1;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Conference Game Leaderboard</h1>
        <div style={styles.lastUpdated}>
          {lastUpdated && (
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by name or troop number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {loading && <div style={styles.loadingMessage}>Loading leaderboard...</div>}

      {error && <div style={styles.errorMessage}>{error}</div>}

      {!loading && !error && (
        <div>
          {searchQuery && filteredLeaderboard.length === 0 && (
            <div style={styles.noResultsMessage}>
              No players found matching "{searchQuery}"
            </div>
          )}

          {filteredLeaderboard.length > 0 && (
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  <th style={{ ...styles.th, width: '10%' }}>Rank</th>
                  <th style={{ ...styles.th, width: '35%' }}>Name</th>
                  <th style={{ ...styles.th, width: '30%' }}>Troop #</th>
                  <th style={{ ...styles.th, width: '25%' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.map((entry, index) => (
                  <tr
                    key={entry.rank}
                    style={{
                      ...styles.row,
                      ...(searchQuery && index === highlightedIndex
                        ? styles.highlightedRow
                        : {}),
                    }}
                  >
                    <td style={styles.td}>{entry.rank}</td>
                    <td style={styles.td}>
                      {entry.firstName} {entry.lastInitial}
                    </td>
                    <td style={styles.td}>{entry.troopNumber}</td>
                    <td style={styles.td}>
                      {formatTime(entry.elapsedTimeInMilliseconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!searchQuery && leaderboard.length > 0 && (
            <div style={styles.totalCount}>
              Total players: {leaderboard.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#fafafa',
    minHeight: '100vh',
  },
  header: {
    marginBottom: '32px',
    textAlign: 'center',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  lastUpdated: {
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
  },
  searchContainer: {
    marginBottom: '24px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    ':focus': {
      outline: 'none',
      borderColor: '#0066cc',
      boxShadow: '0 0 0 3px rgba(0, 102, 204, 0.1)',
    },
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  headerRow: {
    backgroundColor: '#f5f5f5',
    borderBottom: '2px solid #e0e0e0',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
  },
  row: {
    borderBottom: '1px solid #e8e8e8',
    transition: 'background-color 0.2s ease',
  },
  highlightedRow: {
    backgroundColor: '#fff3cd',
    fontWeight: '500',
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#1a1a1a',
  },
  loadingMessage: {
    textAlign: 'center',
    padding: '40px 20px',
    fontSize: '16px',
    color: '#666',
  },
  errorMessage: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '16px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  noResultsMessage: {
    textAlign: 'center',
    padding: '40px 20px',
    fontSize: '16px',
    color: '#999',
  },
  totalCount: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#666',
  },
};

export default Leaderboard;

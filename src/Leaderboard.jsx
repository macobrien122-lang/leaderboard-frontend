import React, { useState, useEffect, useCallback } from 'react';

const BACKEND = 'https://leaderboard-backend-qpmb.onrender.com';
const REFRESH_INTERVAL = 30000; // 30 seconds

// Tab definitions. `match` is a keyword test so it works even if the
// game data says "Cadets" vs "Cadettes" or has minor spelling differences.
const TABS = [
  { key: 'daisy',   label: '🌼 Daisies',                 cls: 'tab-daisy',   match: g => /dais/i.test(g) },
  { key: 'brownie', label: '🍪 Brownies',                cls: 'tab-brownie', match: g => /brownie/i.test(g) },
  { key: 'junior',  label: '⭐ Juniors / Cadettes',      cls: 'tab-junior',  match: g => /junior|cadet/i.test(g) },
  { key: 'senior',  label: '🌟 Seniors / Ambassadors',   cls: 'tab-senior',  match: g => /senior|ambassador/i.test(g) },
];

function fmt(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const msp = Math.floor(ms % 1000);
  return `${m}:${String(sec).padStart(2, '0')}.${String(msp).padStart(3, '0')}`;
}

export default function Leaderboard() {
  const [allData, setAllData] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [search, setSearch] = useState('');
  const [pinned, setPinned] = useState(null);
  const [lastUpd, setLastUpd] = useState('Connecting to leaderboard…');

  // Load pinned entry from localStorage on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('gsPin'));
      if (saved) setPinned(saved);
    } catch (e) {}
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch(`${BACKEND}/api/leaderboard`);
      if (!r.ok) throw new Error();
      const data = await r.json();
      setAllData(data);
      const now = new Date();
      setLastUpd('Last updated ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      setLastUpd('Reconnecting…');
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  const pinEntry = (entry) => {
    setPinned(entry);
    try { localStorage.setItem('gsPin', JSON.stringify(entry)); } catch (e) {}
  };

  const unpin = () => {
    setPinned(null);
    try { localStorage.removeItem('gsPin'); } catch (e) {}
  };

  // Search filter across all groups
  const q = search.toLowerCase();
  const filtered = q
    ? allData.filter(e => {
        const name = `${e.firstName} ${e.lastInitial}`.toLowerCase();
        return name.includes(q) || (e.troopNumber || '').toString().includes(q);
      })
    : allData;

  // Individual entries for the current tab
  const tab = TABS[currentTab];
  const indiv = filtered.filter(e => tab.match(e.group || ''));

  // Troop rankings: best (lowest) time per troop within this group
  const troopMap = {};
  filtered.filter(e => tab.match(e.group || '')).forEach(e => {
    const t = e.troopNumber;
    if (!troopMap[t] || e.elapsedTimeInMilliseconds < troopMap[t].best) {
      troopMap[t] = { troopNumber: t, best: e.elapsedTimeInMilliseconds };
    }
  });
  const troops = Object.values(troopMap)
    .sort((a, b) => a.best - b.best)
    .map((t, i) => ({ ...t, rank: i + 1 }));

  // Live-refresh the pinned entry's rank/time from latest data
  const livePinned = pinned
    ? (allData.find(e =>
        e.firstName === pinned.firstName &&
        e.lastInitial === pinned.lastInitial &&
        e.troopNumber === pinned.troopNumber
      ) || pinned)
    : null;

  const rankBubble = (r) => {
    const cls = r === 1 ? 'r1' : r === 2 ? 'r2' : r === 3 ? 'r3' : 'rn';
    const lbl = r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : r;
    return <div className={`rank-bubble ${cls}`}>{lbl}</div>;
  };

  return (
    <div className="app">
      <style>{CSS}</style>

      {/* 1. Header */}
      <div className="header">
        <div className="header-inner">
          <img src="/evans-logo-square.png" alt="Evans Distribution Systems" className="header-logo" />
          <div className="header-titles">
            <div className="header-main">Evans Fulfillment Challenge ⚡</div>
            <div className="header-sub">Girl Scouts Conference Leaderboard</div>
          </div>
        </div>
      </div>

      {/* 2. Live ribbon */}
      <div className="gs-ribbon">
        <div className="live-pill"><span className="live-dot"></span>🟢 LIVE</div>
        <div className="refresh-text">Refreshes every 30s</div>
      </div>

      {/* 3. Search */}
      <div className="search-wrap">
        <div className="search-inner">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Find your name or troop number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 4. Pinned card */}
      <div className="pinned-section">
        {!livePinned ? (
          <div className="no-pinned">
            <div className="no-pinned-icon">📌</div>
            <div className="no-pinned-text">Pin your score right here!</div>
            <div className="no-pinned-hint">Search your name, then tap your row to pin it</div>
          </div>
        ) : (
          <div className="pinned-card">
            <button className="unpin-btn" onClick={unpin} title="Unpin">✕</button>
            <span className="pinned-sparkle1">✨</span>
            <span className="pinned-sparkle2">⭐</span>
            <div className="pinned-label-row">
              <div className="pinned-badge">⭐ MY SCORE</div>
              <div className="pinned-label-text">pinned to your device</div>
            </div>
            <div className="pinned-content">
              <div className="pinned-trophy">🏆</div>
              <div className="pinned-info">
                <div className="pinned-name">#{livePinned.rank} — {livePinned.firstName} {livePinned.lastInitial}</div>
                <div className="pinned-troop">Troop {livePinned.troopNumber}</div>
              </div>
              <div className="pinned-time-box">
                <div className="pinned-time-val">{fmt(livePinned.elapsedTimeInMilliseconds)}</div>
                <div className="pinned-time-lbl">Your Time</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Tabs */}
      <div className="tabs-wrap">
        {TABS.map((t, i) => (
          <button
            key={t.key}
            className={`tab-btn ${t.cls} ${i === currentTab ? 'active' : ''}`}
            onClick={() => setCurrentTab(i)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="last-upd">{lastUpd}</div>

      {/* 6. Individual + Troop rankings */}
      <div className="section-wrap">
        <div className="section-card">
          <div className="section-header">🏅 Individual Rankings</div>
          {indiv.length ? (
            indiv.slice(0, 25).map((e, idx) => (
              <div key={idx} className="lb-row" onClick={() => pinEntry(e)}>
                {rankBubble(e.rank)}
                <div className="row-info">
                  <div className="row-name">{e.firstName} {e.lastInitial}</div>
                  <div className="row-troop">Troop {e.troopNumber}</div>
                </div>
                <div className="row-time">{fmt(e.elapsedTimeInMilliseconds)}</div>
                <span className="pin-hint">📌</span>
              </div>
            ))
          ) : (
            <div className="empty"><div className="empty-icon">🌟</div>No scores yet — be the first!</div>
          )}
        </div>

        <div className="section-card" style={{ marginTop: 12 }}>
          <div className="section-header">👭 Troop Rankings</div>
          {troops.length ? (
            troops.slice(0, 15).map((t, idx) => (
              <div key={idx} className="lb-row" style={{ cursor: 'default' }}>
                {rankBubble(t.rank)}
                <div className="row-info">
                  <div className="row-name">Troop {t.troopNumber}</div>
                  <div className="row-troop">Best time in group</div>
                </div>
                <div className="row-time">{fmt(t.best)}</div>
              </div>
            ))
          ) : (
            <div className="empty"><div className="empty-icon">👭</div>No troop scores yet</div>
          )}
        </div>
      </div>

      {/* 7. Company blurb */}
      <div className="company-section">
        <div className="company-card">
          <div className="company-top">
            <img src="/evans-logo-square.png" alt="Evans logo" className="company-logo" />
            <div className="company-top-text">
              <div className="company-top-label">Presenting Sponsor</div>
              <div className="company-top-name">Evans Distribution Systems</div>
            </div>
          </div>
          <div className="company-body">
            <p className="company-blurb">
              Evans Distribution Systems is a privately owned third-party logistics (3PL)
              provider based in Melvindale, Michigan. <b>Click below</b> to learn more about Evans.
            </p>
            <a className="company-link" href="https://www.evansdist.com" target="_blank" rel="noopener noreferrer">
              Visit evansdist.com →
            </a>
          </div>
        </div>
      </div>

      {/* 8. Upload button */}
      <div className="upload-section">
        <button className="upload-btn">📸 Upload your selfie!</button>
      </div>

      {/* 9. Photo gallery (placeholder — wired up in next step) */}
      <div className="photo-section">
        <div className="photo-hdr">
          <span>📷 Conference Photo Board</span>
          <span className="photo-pending">Pending approval</span>
        </div>
        <div className="photo-grid">
          {[0,1,2,3].map(i => (
            <div key={i} className="photo-ph">
              <span className="photo-ph-icon">🖼️</span>
              <span>Awaiting photos</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --eb:#1B5E9B;--eb-dark:#154d80;--ey:#F5B800;
  --gs:#00843D;--gs-mid:#00A84F;--gs-dark:#005C2A;
  --pink:#FF6B9D;--purple:#9B59B6;--teal:#00BCD4;
  --daisy:#3498DB;--brownie:#8B5E3C;--junior:#8E44AD;--senior:#E84393;
  --bg:#FFF5FB;--card:#FFFFFF;--border:#F0E6F0;
  --text-primary:#2D1B69;--text-secondary:#6B4E8A;--text-muted:#B39DCC;
}
.app{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);min-height:100vh;padding-bottom:2.5rem;position:relative;z-index:1;max-width:520px;margin:0 auto}
.app::before{content:'';position:fixed;top:0;left:0;right:0;height:100%;background-image:radial-gradient(circle,#FF6B9D22 2px,transparent 2px),radial-gradient(circle,#F5B80022 2px,transparent 2px),radial-gradient(circle,#00843D22 2px,transparent 2px);background-size:40px 40px,60px 60px,50px 50px;background-position:0 0,20px 20px,10px 30px;pointer-events:none;z-index:0}
.header{background:linear-gradient(135deg,var(--eb) 0%,#2471C8 100%);padding:14px 16px 16px;box-shadow:0 3px 12px rgba(27,94,155,0.35);position:relative;z-index:1}
.header-inner{display:flex;align-items:center;gap:12px}
.header-logo{width:44px;height:44px;object-fit:contain;background:white;border-radius:8px;padding:3px;flex-shrink:0}
.header-titles{color:white}
.header-main{font-size:18px;font-weight:800;line-height:1.2;letter-spacing:-0.3px}
.header-sub{font-size:11px;opacity:0.75;margin-top:3px;font-style:italic}
.gs-ribbon{background:linear-gradient(90deg,var(--gs-dark) 0%,var(--gs-mid) 100%);padding:8px 16px;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1}
.live-pill{background:rgba(255,255,255,0.2);color:white;font-size:10px;font-weight:800;padding:5px 12px;border-radius:20px;letter-spacing:1px;display:flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,0.3)}
.live-dot{width:7px;height:7px;background:#7FE8A2;border-radius:50%;animation:pulse 1.4s infinite;box-shadow:0 0 6px #7FE8A2}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.8)}}
.refresh-text{color:rgba(255,255,255,0.75);font-size:11px}
.search-wrap{padding:14px 16px 0;position:relative;z-index:1}
.search-inner{display:flex;align-items:center;gap:10px;background:white;border:2.5px solid #F0D0F0;border-radius:28px;padding:11px 18px;box-shadow:0 4px 14px rgba(155,89,182,0.1);transition:border-color 0.2s,box-shadow 0.2s}
.search-inner:focus-within{border-color:var(--pink);box-shadow:0 4px 18px rgba(255,107,157,0.2)}
.search-icon{font-size:17px;flex-shrink:0}
.search-inner input{border:none;background:none;outline:none;font-size:14px;color:var(--text-primary);width:100%;font-weight:500}
.search-inner input::placeholder{color:var(--text-muted)}
.pinned-section{margin:12px 16px 0;position:relative;z-index:1}
.pinned-card{background:linear-gradient(135deg,#6B35A8 0%,#9B59B6 60%,#C8479B 100%);border-radius:18px;padding:14px 16px;position:relative;overflow:hidden;border:3px solid var(--ey);box-shadow:0 6px 20px rgba(107,53,168,0.35)}
.pinned-sparkle1{position:absolute;top:8px;right:40px;font-size:18px;opacity:0.5;animation:spin 4s linear infinite}
.pinned-sparkle2{position:absolute;bottom:8px;right:14px;font-size:14px;opacity:0.4;animation:spin 6s linear infinite reverse}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.pinned-label-row{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.pinned-badge{background:var(--ey);color:#7B4F00;font-size:10px;font-weight:900;padding:4px 12px;border-radius:20px;letter-spacing:0.5px}
.pinned-label-text{color:rgba(255,255,255,0.65);font-size:11px}
.pinned-content{display:flex;align-items:center;gap:12px}
.pinned-trophy{background:var(--ey);width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;box-shadow:0 3px 10px rgba(0,0,0,0.2)}
.pinned-info{flex:1}
.pinned-name{color:white;font-size:15px;font-weight:800;line-height:1.2}
.pinned-troop{color:rgba(255,255,255,0.6);font-size:12px;margin-top:3px}
.pinned-time-box{background:rgba(0,0,0,0.2);border-radius:12px;padding:8px 14px;text-align:center;border:1.5px solid rgba(255,255,255,0.2)}
.pinned-time-val{color:var(--ey);font-size:18px;font-weight:900;font-variant-numeric:tabular-nums;letter-spacing:-0.5px}
.pinned-time-lbl{color:rgba(255,255,255,0.55);font-size:9px;margin-top:2px;letter-spacing:0.6px;text-transform:uppercase;font-weight:700}
.unpin-btn{position:absolute;top:10px;right:10px;background:rgba(255,255,255,0.15);border:none;color:rgba(255,255,255,0.8);width:26px;height:26px;border-radius:50%;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.15s}
.unpin-btn:hover{background:rgba(255,255,255,0.3)}
.no-pinned{border:2.5px dashed #E8D0F0;border-radius:18px;padding:18px 16px;text-align:center;background:white}
.no-pinned-icon{font-size:28px;margin-bottom:6px}
.no-pinned-text{font-size:14px;color:var(--text-primary);font-weight:700}
.no-pinned-hint{font-size:12px;color:var(--text-muted);margin-top:5px}
.tabs-wrap{padding:14px 16px 0;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;position:relative;z-index:1}
.tabs-wrap::-webkit-scrollbar{display:none}
.tab-btn{padding:8px 16px;border-radius:24px;font-size:12px;font-weight:700;border:2px solid;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all 0.2s;background:white;box-shadow:0 2px 6px rgba(0,0,0,0.06)}
.tab-btn.active{box-shadow:0 3px 10px rgba(0,0,0,0.15)}
.tab-daisy{border-color:var(--daisy);color:var(--daisy)}
.tab-daisy.active{background:var(--daisy);color:white}
.tab-brownie{border-color:var(--brownie);color:var(--brownie)}
.tab-brownie.active{background:var(--brownie);color:white}
.tab-junior{border-color:var(--junior);color:var(--junior)}
.tab-junior.active{background:var(--junior);color:white}
.tab-senior{border-color:var(--senior);color:var(--senior)}
.tab-senior.active{background:var(--senior);color:white}
.section-wrap{padding:12px 16px 0;position:relative;z-index:1}
.section-card{background:white;border-radius:18px;overflow:hidden;border:2px solid var(--border);box-shadow:0 4px 16px rgba(155,89,182,0.08)}
.section-header{padding:12px 16px;font-size:13px;font-weight:800;display:flex;align-items:center;gap:7px;border-bottom:2px solid #FAF0FF;color:var(--text-primary);background:linear-gradient(90deg,#FAF0FF,white)}
.lb-row{display:flex;align-items:center;padding:12px 16px;border-bottom:1.5px solid #FAF5FF;gap:11px;cursor:pointer;transition:background 0.12s;-webkit-tap-highlight-color:rgba(0,0,0,0.04)}
.lb-row:last-child{border-bottom:none}
.lb-row:hover{background:#FDF5FF}
.lb-row:active{background:#F5E6FF}
.rank-bubble{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;flex-shrink:0}
.r1{background:linear-gradient(135deg,#FFE566,#F5B800);color:#7B4F00;box-shadow:0 2px 8px rgba(245,184,0,0.4)}
.r2{background:linear-gradient(135deg,#F0F0F0,#C8C8C8);color:#555}
.r3{background:linear-gradient(135deg,#FDDBC7,#E8A87C);color:#7B3D1A}
.rn{background:#F5F0FF;color:#B39DCC;font-size:11px;font-weight:700}
.row-info{flex:1;min-width:0}
.row-name{font-size:14px;color:var(--text-primary);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row-troop{font-size:11px;color:var(--text-muted);margin-top:2px}
.row-time{font-size:13px;color:var(--text-primary);font-weight:800;font-variant-numeric:tabular-nums;flex-shrink:0}
.pin-hint{font-size:16px;flex-shrink:0;margin-left:4px;opacity:0.25;transition:opacity 0.15s}
.lb-row:hover .pin-hint{opacity:0.7}
.lb-row:active .pin-hint{opacity:1}
.last-upd{text-align:center;font-size:10px;color:var(--text-muted);padding:10px 16px 0;position:relative;z-index:1}
.empty{padding:28px;text-align:center;font-size:13px;color:var(--text-muted)}
.empty-icon{font-size:32px;margin-bottom:8px}
.company-section{margin:14px 16px 0;position:relative;z-index:1}
.company-card{background:white;border-radius:18px;border:2px solid #D6EAF8;overflow:hidden;box-shadow:0 4px 14px rgba(27,94,155,0.08)}
.company-top{background:linear-gradient(135deg,var(--eb) 0%,#2471C8 100%);padding:14px 16px;display:flex;align-items:center;gap:12px}
.company-logo{width:38px;height:38px;object-fit:contain;background:white;border-radius:6px;padding:2px;flex-shrink:0}
.company-top-text{color:white}
.company-top-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;opacity:0.7;margin-bottom:3px}
.company-top-name{font-size:15px;font-weight:800;line-height:1.2}
.company-body{padding:14px 16px 16px}
.company-blurb{font-size:13px;color:var(--text-secondary);line-height:1.65;margin-bottom:14px}
.company-link{display:inline-flex;align-items:center;gap:7px;background:var(--eb);color:white;font-size:13px;font-weight:700;padding:10px 20px;border-radius:24px;text-decoration:none;box-shadow:0 3px 10px rgba(27,94,155,0.3);transition:background 0.15s,box-shadow 0.15s}
.company-link:hover{background:var(--eb-dark);box-shadow:0 4px 14px rgba(27,94,155,0.4)}
.upload-section{margin:14px 16px 0;position:relative;z-index:1}
.upload-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;background:linear-gradient(135deg,var(--pink) 0%,#C8479B 100%);color:white;border:none;border-radius:28px;padding:15px;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 5px 18px rgba(255,107,157,0.4);transition:transform 0.15s,box-shadow 0.15s;letter-spacing:0.2px}
.upload-btn:hover{transform:translateY(-2px);box-shadow:0 7px 22px rgba(255,107,157,0.5)}
.upload-btn:active{transform:translateY(0)}
.photo-section{margin:12px 16px 0;background:white;border-radius:18px;overflow:hidden;border:2px solid #C6F6D5;box-shadow:0 4px 14px rgba(0,132,61,0.08);position:relative;z-index:1}
.photo-hdr{background:linear-gradient(90deg,var(--gs-dark),var(--gs-mid));color:white;padding:12px 16px;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:space-between}
.photo-pending{background:rgba(0,0,0,0.2);font-size:10px;padding:3px 10px;border-radius:10px;font-weight:600}
.photo-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px}
.photo-ph{background:linear-gradient(135deg,#F0FFF4,#E6FFED);aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;color:#68D391;font-size:12px;font-weight:600;border-radius:10px}
.photo-ph-icon{font-size:30px}
`;

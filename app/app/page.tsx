export default function Home() {
  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-mark">A</div>
            <div>
              <p className="brand-name">Axion</p>
              <p className="brand-subtitle">SaaS Edge</p>
            </div>
          </div>
          <p className="brand-note">Premium analytics for modern teams.</p>
        </div>

        <nav className="nav-menu" aria-label="Primary">
          <button className="nav-item active">
            <span className="nav-icon">📊</span>
            Dashboard
          </button>
          <button className="nav-item">
            <span className="nav-icon">📈</span>
            Analytics
          </button>
          <button className="nav-item">
            <span className="nav-icon">📁</span>
            Projects
          </button>
          <button className="nav-item">
            <span className="nav-icon">💬</span>
            Messages
          </button>
          <button className="nav-item">
            <span className="nav-icon">🗓️</span>
            Bookings
          </button>
          <button className="nav-item">
            <span className="nav-icon">⚙️</span>
            Settings
          </button>
        </nav>

        <button className="nav-item logout">
          <span className="nav-icon">🚪</span>
          Logout
        </button>
      </aside>

      <section className="dashboard-main">
        <header className="topbar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input type="search" placeholder="Search reports, projects or users" aria-label="Search" />
          </div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Notifications">🔔</button>
            <button className="icon-button" aria-label="Toggle theme">🌓</button>
            <div className="profile-chip">
              <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80" alt="User avatar" />
              <div>
                <p>Jamie</p>
                <small>Admin</small>
              </div>
            </div>
          </div>
        </header>

        <div className="hero-row">
          <div className="hero-copy">
            <p className="eyebrow">Overview</p>
            <h1>Modern SaaS analytics designed for growth.</h1>
            <p className="hero-description">Track key metrics, collaborate with teams, and make faster decisions with a high-performance dashboard experience.</p>
          </div>
          <div className="hero-actions">
            <button className="primary-button">New Report</button>
            <button className="secondary-button">View Insights</button>
          </div>
        </div>

        <div className="stat-grid">
          <article className="stat-card">
            <div className="card-top">
              <span className="card-icon">💼</span>
              <span className="badge success">+12.4%</span>
            </div>
            <h2>3.8K</h2>
            <p>Active Clients</p>
          </article>

          <article className="stat-card">
            <div className="card-top">
              <span className="card-icon">💰</span>
              <span className="badge success">+9.1%</span>
            </div>
            <h2>$124.8K</h2>
            <p>MRR</p>
          </article>

          <article className="stat-card">
            <div className="card-top">
              <span className="card-icon">⚡</span>
              <span className="badge warning">+4.8%</span>
            </div>
            <h2>92%</h2>
            <p>Retention</p>
          </article>

          <article className="stat-card">
            <div className="card-top">
              <span className="card-icon">📬</span>
              <span className="badge neutral">New</span>
            </div>
            <h2>18</h2>
            <p>Unread Messages</p>
          </article>
        </div>

        <div className="grid-layout">
          <section className="analytics-panel glass-card">
            <div className="panel-header">
              <div>
                <p className="panel-label">Revenue analytics</p>
                <h2>$54.2K</h2>
              </div>
              <button className="icon-button small">⏱️</button>
            </div>
            <div className="chart-legend">
              <span className="legend-dot sales"></span>
              <span>Sales</span>
              <span className="legend-dot visitors"></span>
              <span>Visitors</span>
            </div>
            <div className="chart-grid">
              <div className="chart-line"></div>
              <div className="chart-line secondary"></div>
            </div>
          </section>

          <aside className="activity-panel glass-card">
            <div className="panel-header">
              <p className="panel-label">Recent activity</p>
              <button className="text-button">See all</button>
            </div>
            <ul className="activity-list">
              <li>
                <div className="activity-icon success">✓</div>
                <div>
                  <p>Payment confirmed</p>
                  <small>Invoice #1921 for Acme Co.</small>
                </div>
                <span>2m ago</span>
              </li>
              <li>
                <div className="activity-icon warning">!</div>
                <div>
                  <p>New booking</p>
                  <small>Meeting room request approved.</small>
                </div>
                <span>14m ago</span>
              </li>
              <li>
                <div className="activity-icon neutral">•</div>
                <div>
                  <p>Project launch</p>
                  <small>Marketing campaign is live.</small>
                </div>
                <span>1h ago</span>
              </li>
            </ul>
          </aside>

          <section className="table-panel glass-card">
            <div className="panel-header">
              <p className="panel-label">User activity</p>
              <button className="text-button">Export</button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Activity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="user-cell">
                      <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80" alt="Mia" />
                      <div>
                        <p>Mia Chen</p>
                        <small>Product Lead</small>
                      </div>
                    </td>
                    <td>Design</td>
                    <td><span className="status-badge active">Online</span></td>
                    <td>3m ago</td>
                  </tr>
                  <tr>
                    <td className="user-cell">
                      <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" alt="Noah" />
                      <div>
                        <p>Noah Patel</p>
                        <small>Growth Analyst</small>
                      </div>
                    </td>
                    <td>Growth</td>
                    <td><span className="status-badge pending">Idle</span></td>
                    <td>16m ago</td>
                  </tr>
                  <tr>
                    <td className="user-cell">
                      <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80" alt="Lina" />
                      <div>
                        <p>Lina Park</p>
                        <small>Support</small>
                      </div>
                    </td>
                    <td>Customer</td>
                    <td><span className="status-badge offline">Offline</span></td>
                    <td>52m ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="actions-panel glass-card">
            <div className="panel-header">
              <p className="panel-label">Quick actions</p>
              <button className="text-button">Manage</button>
            </div>
            <div className="action-grid">
              <button className="action-button">Create invoice</button>
              <button className="action-button">Schedule demo</button>
              <button className="action-button">Launch campaign</button>
              <button className="action-button">Review metrics</button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

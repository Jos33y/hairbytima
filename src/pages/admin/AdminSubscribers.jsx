// ==========================================================================
// Admin Subscribers Page - View Newsletter Subscribers
// ==========================================================================

import { useState, useEffect } from 'react';
import { 
  Search, 
  Download,
  Mail,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { AdminLayout } from '@components/admin';
import { useAuthStore } from '@store/authStore';
import styles from '@styles/module/AdminSubscribers.module.css';
 
const AdminSubscribers = () => {
  const { getAuthHeaders } = useAuthStore();
  
  const [subscribers, setSubscribers] = useState([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, active: 0, unsubscribed: 0, thisWeek: 0 });
  const [sourceStats, setSourceStats] = useState({ homepage: 0, footer: 0, checkout: 0 });

  // Fetch subscribers
  const fetchSubscribers = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/subscribers', {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscribers');
      }
      
      const data = await response.json();
      setSubscribers(data.subscribers || []);
      setFilteredSubscribers(data.subscribers || []);
      setStats(data.stats || { total: 0, active: 0, unsubscribed: 0, thisWeek: 0 });
      setSourceStats(data.sourceStats || { homepage: 0, footer: 0, checkout: 0 });
    } catch (err) {
      console.error('Fetch subscribers error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  // Filter subscribers
  useEffect(() => {
    let result = subscribers;

    if (statusFilter !== 'all') {
      result = result.filter(s => 
        statusFilter === 'active' ? s.isActive : !s.isActive
      );
    }

    if (sourceFilter !== 'all') {
      result = result.filter(s => s.source === sourceFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => s.email?.toLowerCase().includes(query));
    }

    setFilteredSubscribers(result);
  }, [subscribers, statusFilter, sourceFilter, searchQuery]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleExportCSV = () => {
    const activeSubscribers = subscribers.filter(s => s.isActive);
    const csvContent = [
      ['Email', 'Source', 'Subscribed Date'],
      ...activeSubscribers.map(s => [s.email, s.source, formatDate(s.createdAt)])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Subscribers" isLoading={isLoading}>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>Newsletter Subscribers</h1>
            <p className={styles.subtitle}>
              {stats.active} active subscribers
            </p>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={styles.exportBtn}
              onClick={handleExportCSV}
            >
              <Download size={18} strokeWidth={1.5} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Users size={20} strokeWidth={1.5} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.active}</span>
              <span className={styles.statLabel}>Active Subscribers</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <TrendingUp size={20} strokeWidth={1.5} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>+{stats.thisWeek}</span>
              <span className={styles.statLabel}>This Week</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <XCircle size={20} strokeWidth={1.5} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.unsubscribed}</span>
              <span className={styles.statLabel}>Unsubscribed</span>
            </div>
          </div>
        </div>

        {/* Source Breakdown */}
        <div className={styles.sourceBreakdown}>
          <h3 className={styles.sourceTitle}>Subscription Sources</h3>
          <div className={styles.sourceList}>
            <button 
              className={`${styles.sourceItem} ${sourceFilter === 'all' ? styles.active : ''}`}
              onClick={() => setSourceFilter('all')}
            >
              <span className={styles.sourceName}>All Sources</span>
              <span className={styles.sourceCount}>{stats.total}</span>
            </button>
            <button 
              className={`${styles.sourceItem} ${sourceFilter === 'homepage' ? styles.active : ''}`}
              onClick={() => setSourceFilter('homepage')}
            >
              <span className={styles.sourceName}>Homepage</span>
              <span className={styles.sourceCount}>{sourceStats.homepage}</span>
            </button>
            <button 
              className={`${styles.sourceItem} ${sourceFilter === 'footer' ? styles.active : ''}`}
              onClick={() => setSourceFilter('footer')}
            >
              <span className={styles.sourceName}>Footer</span>
              <span className={styles.sourceCount}>{sourceStats.footer}</span>
            </button>
            <button 
              className={`${styles.sourceItem} ${sourceFilter === 'checkout' ? styles.active : ''}`}
              onClick={() => setSourceFilter('checkout')}
            >
              <span className={styles.sourceName}>Checkout</span>
              <span className={styles.sourceCount}>{sourceStats.checkout}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <Search size={18} strokeWidth={1.5} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
        </div>

        {/* Subscribers Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Source</th>
                <th>Status</th>
                <th>Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className={styles.skeletonRow}>
                    <td><div className={styles.skeletonCell} /></td>
                    <td><div className={styles.skeletonCell} /></td>
                    <td><div className={styles.skeletonCell} /></td>
                    <td><div className={styles.skeletonCell} /></td>
                  </tr>
                ))
              ) : filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyCell}>
                    <div className={styles.empty}>
                      <Mail size={32} strokeWidth={1} />
                      <p>No subscribers found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map(subscriber => (
                  <tr key={subscriber.id}>
                    <td>
                      <span className={styles.email}>{subscriber.email}</span>
                    </td>
                    <td>
                      <span className={`${styles.sourceBadge} ${styles[subscriber.source] || ''}`}>
                        {subscriber.source}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${subscriber.isActive ? styles.active : styles.inactive}`}>
                        {subscriber.isActive ? (
                          <>
                            <CheckCircle size={12} strokeWidth={1.5} />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle size={12} strokeWidth={1.5} />
                            Unsubscribed
                          </>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className={styles.date}>
                        <Calendar size={12} strokeWidth={1.5} />
                        {formatDate(subscriber.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Results count */}
        {!isLoading && filteredSubscribers.length > 0 && (
          <div className={styles.resultsCount}>
            Showing {filteredSubscribers.length} of {subscribers.length} subscribers
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSubscribers;
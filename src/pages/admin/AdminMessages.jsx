// ==========================================================================
// Admin Messages Page - View Contact Form Submissions
// ==========================================================================

import { useState, useEffect } from 'react';
import { 
  Search, 
  Mail,
  Eye,
  X,
  Check,
  CheckCircle,
  Clock,
  MessageSquare
} from 'lucide-react';
import { AdminLayout } from '@components/admin';
import { useAuthStore } from '@store/authStore';
import styles from '@styles/module/AdminMessages.module.css';

const AdminMessages = () => {
  const { getAuthHeaders } = useAuthStore();
  
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Fetch messages
  const fetchMessages = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/messages', {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
      setFilteredMessages(data.messages || []);
    } catch (err) {
      console.error('Fetch messages error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Filter messages
  useEffect(() => {
    let result = messages;

    if (statusFilter !== 'all') {
      result = result.filter(m => m.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.name?.toLowerCase().includes(query) ||
        m.email?.toLowerCase().includes(query) ||
        m.subject?.toLowerCase().includes(query) ||
        m.message?.toLowerCase().includes(query)
      );
    }

    setFilteredMessages(result);
  }, [messages, statusFilter, searchQuery]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleOpenMessage = async (message) => {
    setSelectedMessage(message);
    setAdminNotes(message.adminNotes || '');
    
    // Mark as read if unread
    if (message.status === 'unread') {
      await handleUpdateStatus(message.id, 'read');
    }
  };

  const handleCloseMessage = () => {
    setSelectedMessage(null);
    setAdminNotes('');
  };

  const handleUpdateStatus = async (messageId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/messages?id=${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, status: newStatus } : m
        ));
        
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedMessage) return;
    
    setIsSavingNotes(true);
    
    try {
      const response = await fetch(`/api/admin/messages?id=${selectedMessage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ admin_notes: adminNotes }),
      });

      if (response.ok) {
        setMessages(prev => prev.map(m => 
          m.id === selectedMessage.id ? { ...m, adminNotes: adminNotes } : m
        ));
        setSelectedMessage(prev => ({ ...prev, adminNotes: adminNotes }));
      }
    } catch (err) {
      console.error('Save notes error:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const stats = {
    total: messages.length,
    unread: messages.filter(m => m.status === 'unread').length,
    read: messages.filter(m => m.status === 'read').length,
    resolved: messages.filter(m => m.status === 'resolved').length,
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'unread': return <Mail size={14} strokeWidth={1.5} />;
      case 'read': return <Eye size={14} strokeWidth={1.5} />;
      case 'resolved': return <CheckCircle size={14} strokeWidth={1.5} />;
      default: return null;
    }
  };

  return (
    <AdminLayout title="Messages" isLoading={isLoading}>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>Messages</h1>
            <p className={styles.subtitle}>
              {stats.total} messages
              {stats.unread > 0 && (
                <span className={styles.unreadBadge}>
                  {stats.unread} unread
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <button 
            className={`${styles.statItem} ${statusFilter === 'all' ? styles.active : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>All</span>
          </button>
          <button 
            className={`${styles.statItem} ${statusFilter === 'unread' ? styles.active : ''}`}
            onClick={() => setStatusFilter('unread')}
          >
            <span className={`${styles.statValue} ${styles.unread}`}>{stats.unread}</span>
            <span className={styles.statLabel}>Unread</span>
          </button>
          <button 
            className={`${styles.statItem} ${statusFilter === 'read' ? styles.active : ''}`}
            onClick={() => setStatusFilter('read')}
          >
            <span className={styles.statValue}>{stats.read}</span>
            <span className={styles.statLabel}>Read</span>
          </button>
          <button 
            className={`${styles.statItem} ${statusFilter === 'resolved' ? styles.active : ''}`}
            onClick={() => setStatusFilter('resolved')}
          >
            <span className={`${styles.statValue} ${styles.resolved}`}>{stats.resolved}</span>
            <span className={styles.statLabel}>Resolved</span>
          </button>
        </div>

        {/* Search */}
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <Search size={18} strokeWidth={1.5} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Messages List */}
        <div className={styles.messagesList}>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.messageSkeleton}>
                <div className={styles.skeletonAvatar} />
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonTitle} />
                  <div className={styles.skeletonText} />
                </div>
              </div>
            ))
          ) : filteredMessages.length === 0 ? (
            <div className={styles.empty}>
              <MessageSquare size={48} strokeWidth={1} />
              <p>No messages found</p>
            </div>
          ) : (
            filteredMessages.map(message => (
              <div 
                key={message.id} 
                className={`${styles.messageCard} ${message.status === 'unread' ? styles.unreadCard : ''}`}
                onClick={() => handleOpenMessage(message)}
              >
                <div className={styles.messageHeader}>
                  <div className={styles.senderInfo}>
                    <span className={styles.senderName}>{message.name}</span>
                    <span className={styles.senderEmail}>{message.email}</span>
                  </div>
                  <div className={styles.messageMeta}>
                    <span className={`${styles.statusBadge} ${styles[message.status]}`}>
                      {getStatusIcon(message.status)}
                      {message.status}
                    </span>
                    <span className={styles.messageDate}>
                      <Clock size={12} strokeWidth={1.5} />
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                </div>
                <h3 className={styles.messageSubject}>{message.subject}</h3>
                <p className={styles.messagePreview}>
                  {message.message?.substring(0, 150)}
                  {message.message?.length > 150 ? '...' : ''}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Message Detail Modal */}
        {selectedMessage && (
          <>
            <div className={styles.modalBackdrop} onClick={handleCloseMessage} />
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <div className={styles.modalHeaderInfo}>
                  <h2 className={styles.modalTitle}>{selectedMessage.subject}</h2>
                  <span className={`${styles.statusBadge} ${styles[selectedMessage.status]}`}>
                    {getStatusIcon(selectedMessage.status)}
                    {selectedMessage.status}
                  </span>
                </div>
                <button className={styles.modalClose} onClick={handleCloseMessage}>
                  <X size={24} strokeWidth={1.5} />
                </button>
              </div>

              <div className={styles.modalBody}>
                {/* Sender Info */}
                <div className={styles.senderDetails}>
                  <div className={styles.senderAvatar}>
                    {selectedMessage.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className={styles.senderText}>
                    <span className={styles.senderDetailName}>{selectedMessage.name}</span>
                    <a href={`mailto:${selectedMessage.email}`} className={styles.senderDetailEmail}>
                      {selectedMessage.email}
                    </a>
                  </div>
                  <span className={styles.messageDateTime}>
                    {new Date(selectedMessage.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Message Content */}
                <div className={styles.messageContent}>
                  {selectedMessage.message}
                </div>

                {/* Admin Notes */}
                <div className={styles.notesSection}>
                  <label className={styles.notesLabel}>Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className={styles.notesTextarea}
                    placeholder="Add internal notes about this message..."
                    rows={3}
                  />
                  <button 
                    className={styles.saveNotesBtn}
                    onClick={handleSaveNotes}
                    disabled={adminNotes === selectedMessage.adminNotes || isSavingNotes}
                  >
                    <Check size={16} strokeWidth={1.5} />
                    {isSavingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>

                {/* Actions */}
                <div className={styles.modalActions}>
                  <a 
                    href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                    className={styles.replyBtn}
                  >
                    <Mail size={16} strokeWidth={1.5} />
                    Reply via Email
                  </a>
                  
                  {selectedMessage.status !== 'resolved' && (
                    <button 
                      className={styles.resolveBtn}
                      onClick={() => handleUpdateStatus(selectedMessage.id, 'resolved')}
                    >
                      <CheckCircle size={16} strokeWidth={1.5} />
                      Mark as Resolved
                    </button>
                  )}
                  
                  {selectedMessage.status === 'resolved' && (
                    <button 
                      className={styles.unresolveBtn}
                      onClick={() => handleUpdateStatus(selectedMessage.id, 'read')}
                    >
                      <Clock size={16} strokeWidth={1.5} />
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout> 
  );
};

export default AdminMessages;
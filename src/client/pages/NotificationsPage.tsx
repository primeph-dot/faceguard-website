import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle, X, Clock } from 'lucide-react';
import { supabase } from '../supabaseClient';

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [viewImageSrc, setViewImageSrc] = useState<string | null>(null);

  // Helper to normalize image srcs (same logic as HistoryPage)
  const getImageSrc = (d: any) => {
    if (!d?.image) return '';
    const img = String(d.image).trim();
    if (img.startsWith('data:') || img.startsWith('http')) return img;
    const base64Candidate = img.replace(/\s+/g, '');
    const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
    if (base64Regex.test(base64Candidate) && base64Candidate.length > 100) {
      return `data:image/jpeg;base64,${base64Candidate}`;
    }
    return img;
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('detections')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(25);
      if (!error && data) setNotifications(data);
      setLoading(false);
    };
    fetchNotifications();

    // Subscribe to realtime INSERTs on detections
    let channel: any = null;
    let legacySub: any = null;

    if ((supabase as any).channel) {
      try {
        channel = (supabase as any)
          .channel('realtime-detections-notifications')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'detections' },
            (payload: any) => {
              const inserted = payload?.new ?? payload?.record ?? payload;
              if (inserted) setNotifications(prev => [inserted, ...prev].slice(0, 50));
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Supabase channel subscribe failed', err);
      }
    }

    if (!channel) {
      try {
        // @ts-ignore
        legacySub = (supabase as any)
          .from('detections')
          .on('INSERT', (payload: any) => {
            const inserted = payload?.new ?? payload;
            if (inserted) setNotifications(prev => [inserted, ...prev].slice(0, 50));
          })
          // @ts-ignore
          .subscribe();
      } catch (err) {
        console.warn('Legacy realtime subscribe failed', err);
      }
    }

    return () => {
      try {
        if (channel) {
          (supabase as any).removeChannel?.(channel);
          if (typeof channel.unsubscribe === 'function') channel.unsubscribe();
        }
      } catch (e) {}
      try {
        if (legacySub) {
          // @ts-ignore
          legacySub.unsubscribe?.();
          // @ts-ignore
          supabase.removeSubscription?.(legacySub);
        }
      } catch (e) {}
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewImageSrc(null);
    };
    if (viewImageSrc) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewImageSrc]);

  const timeAgo = (ts?: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    const sec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    return `${days}d ago`;
  };

  const toggleRead = async (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    // Best-effort: persist a simple acknowledged flag if the column exists
    try {
      await supabase.from('detections').update({ acknowledged: true }).eq('id', id);
    } catch (e) {
      // ignore errors if column doesn't exist
    }
  };

  const markAllRead = async () => {
    const ids = notifications.map(n => n.id).filter(Boolean) as string[];
    setReadIds(new Set(ids));
    try {
      await supabase.from('detections').update({ acknowledged: true }).in('id', ids);
    } catch (e) {}
  };

  return (
    <div style={{ background: '#f7f8fa', minHeight: '100vh', padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Bell size={22} />
          <div style={{ fontWeight: 600, fontSize: 20 }}>Recent Notifications</div>
          <div style={{ color: '#6b7280' }}>{notifications.length} total</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={markAllRead} style={{ background: '#2563eb', color: '#fff', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
            Mark all read
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#6b7280' }}>Loading...</div>
        ) : notifications.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: 18, textAlign: 'center', padding: 48 }}>
            <Bell size={48} color="#cbd5e1" style={{ display: 'block', margin: '0 auto 12px auto' }} />
            No notifications yet
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notifications.map(n => (
              <li key={n.id || Math.random()} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, borderRadius: 8, background: readIds.has(n.id) ? '#f8fafc' : '#ffffff', border: '1px solid #f3f4f6' }}>
                <div style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                  {n.image ? (
                    <img
                      src={getImageSrc(n)}
                      alt="thumb"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => setViewImageSrc(getImageSrc(n))}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/placeholder-face.png';
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
                      <Clock size={24} color="#9ca3af" />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontWeight: 600 }}>{n.name || (n.type === 'unknown' ? 'Unknown face' : 'Detection')}</div>
                    <div style={{ color: '#6b7280', fontSize: 13 }}>{n.type ? n.type : ''}</div>
                    <div style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: 13 }}>{timeAgo(n.timestamp)}</div>
                  </div>
                  {n.message && <div style={{ color: '#6b7280', marginTop: 6 }}>{n.message}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => toggleRead(n.id)} title={readIds.has(n.id) ? 'Mark unread' : 'Mark read'} style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>
                    <CheckCircle size={16} color={readIds.has(n.id) ? '#10b981' : '#9ca3af'} />
                  </button>
                  <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} title="Dismiss" style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>
                    <X size={16} color="#ef4444" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Image viewer modal */}
      {viewImageSrc && (
        <div onClick={() => setViewImageSrc(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <img src={viewImageSrc} alt="view" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 12 }} />
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
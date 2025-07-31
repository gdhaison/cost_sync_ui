import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format, addDays, isSameDay, isAfter, startOfDay, parse } from 'date-fns';

interface Meeting {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  recurrence?: string;
  days_of_week?: string;
  day_of_month?: number;
  created_at?: string;
  club_id?: number;
  club_name?: string;
}

interface Club {
  id: number;
  name: string;
  description: string;
  meetings: Meeting[];
  created_at?: string;
}

const API_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';

const HomePage: React.FC<{ token: string; userId: number }> = ({ token, userId }) => {
  const [meetingsByDay, setMeetingsByDay] = useState<{ [date: string]: Meeting[] }>({});
  const [loading, setLoading] = useState(true);
  const [joinedMeetings, setJoinedMeetings] = useState<{ [key: string]: boolean }>({});
  const [showNoti, setShowNoti] = useState<string | null>(null);
  const [guests, setGuests] = useState<{ [key: string]: number }>({});
  const [userMeetingIds, setUserMeetingIds] = useState<{ [key: string]: number }>({});
  const [pendingGuestKey, setPendingGuestKey] = useState<string | null>(null);
  const [pendingGuestCount, setPendingGuestCount] = useState<number>(0);
  const [guestTimer, setGuestTimer] = useState<NodeJS.Timeout | null>(null);
  const [showGuestConfirm, setShowGuestConfirm] = useState(false);
  const [meetingCounts, setMeetingCounts] = useState<{ [key: string]: { users: number; guests: number } }>({});

  useEffect(() => {
    const fetchClubsMeetings = async () => {
      try {
        const res = await axios.get(`${API_URL}/my-clubs-meetings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data as { clubs: Club[] };
        const clubs: Club[] = data.clubs || [];
        const now = startOfDay(new Date());
        let allOccurrences: Array<{ meeting: Meeting; start: Date; club_name: string }> = [];
        clubs.forEach(club => {
          club.meetings.forEach(m => {
            const [startHour, startMinute] = m.start_time.split(":").map(Number);
            if (!m.recurrence) {
              // One-time meeting
              const start = m.created_at ? new Date(m.created_at) : now;
              start.setHours(startHour, startMinute, 0, 0);
              if (isAfter(start, now) || isSameDay(start, now)) {
                allOccurrences.push({ meeting: { ...m, club_name: club.name }, start, club_name: club.name });
              }
            } else if (m.recurrence === 'weekly' && m.days_of_week) {
              // Weekly recurrence
              const days = m.days_of_week.split(/,| /).map(d => d.trim()).filter(Boolean);
              let current = new Date(now);
              for (let i = 0; i < 7; i++) { // next 7 days
                days.forEach(dayName => {
                  const dayIndex = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].indexOf(dayName);
                  if (dayIndex === -1) return;
                  if (current.getDay() === dayIndex) {
                    const start = new Date(current);
                    start.setHours(startHour, startMinute, 0, 0);
                    if (isAfter(start, now) || isSameDay(start, now)) {
                      allOccurrences.push({ meeting: { ...m, club_name: club.name }, start, club_name: club.name });
                    }
                  }
                });
                current.setDate(current.getDate() + 1);
              }
            } else if (m.recurrence === 'daily') {
              let current = new Date(now);
              for (let i = 0; i < 7; i++) { // next 7 days
                const start = new Date(current);
                start.setHours(startHour, startMinute, 0, 0);
                if (isAfter(start, now) || isSameDay(start, now)) {
                  allOccurrences.push({ meeting: { ...m, club_name: club.name }, start, club_name: club.name });
                }
                current.setDate(current.getDate() + 1);
              }
            }
            // Add monthly logic if needed
          });
        });
        // Group by day
        let grouped: { [date: string]: Meeting[] } = {};
        for (let i = 0; i < 6; i++) {
          const day = addDays(now, i);
          const dayStr = format(day, 'yyyy-MM-dd');
          grouped[dayStr] = [];
        }
        allOccurrences.forEach(({ meeting, start }) => {
          const dayStr = format(start, 'yyyy-MM-dd');
          if (grouped[dayStr]) {
            grouped[dayStr].push({ ...meeting, start_time: format(start, 'PPPp') });
          }
        });
        setMeetingsByDay(grouped);
        // Fetch join counts for all meetings in the next 6 days
        Object.entries(grouped).forEach(([date, meetings]) => {
          meetings.forEach(async (meeting) => {
            const parsed = parse(meeting.start_time, 'PPPp', new Date());
            const pad = (n: number) => n.toString().padStart(2, '0');
            const localDate = `${parsed.getFullYear()}-${pad(parsed.getMonth()+1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:00`;
            try {
              const res = await axios.get(`${API_URL}/user_meetings/count?meeting_date=${localDate}`,
                 {
                    headers: { Authorization: `Bearer ${token}` }
                 }
              );
              const data = res.data as { meeting_date: string; player_joined: number };
              setMeetingCounts(prev => ({
                ...prev,
                [meeting.id + '-' + localDate]: {
                  users: data.player_joined || 0,
                  guests: 0 // Not returned anymore
                }
              }));
            } catch {}
          });
        });
      } catch (err) {
        setMeetingsByDay({});
      } finally {
        setLoading(false);
      }
    };

    const fetchUserMeetings = async () => {
      try {
        const res = await axios.get(`${API_URL}/user_meetings/?user_id=${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userMeetings = res.data as Array<{ id: number; meeting_key: string; guest: number }>;
        let joined: { [key: string]: boolean } = {};
        let ids: { [key: string]: number } = {};
        let guestCounts: { [key: string]: number } = {};
        userMeetings.forEach(um => {
          joined[um.meeting_key] = true;
          ids[um.meeting_key] = um.id;
          guestCounts[um.meeting_key] = um.guest || 0;
        });
        setJoinedMeetings(joined);
        setUserMeetingIds(ids);
        setGuests(guestCounts);
      } catch (err) {
        // ignore
      }
    };

    fetchClubsMeetings();
    fetchUserMeetings();
  }, [token, userId]);

  const getMeetingKeyAndDate = (meeting: Meeting, startTimeStr: string) => {
    // Parse startTimeStr and format as local time (not UTC)
    const parsed = parse(startTimeStr, 'PPPp', new Date());
    const pad = (n: number) => n.toString().padStart(2, '0');
    const meeting_date = `${parsed.getFullYear()}-${pad(parsed.getMonth()+1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:00`;
    const meeting_key = `${userId}-${meeting.id}-${meeting_date}`;
    return { meeting_date, meeting_key };
  };

  const handleImIn = async (meeting: Meeting, startDateStr: string) => {
    try {
      const { meeting_date, meeting_key } = getMeetingKeyAndDate(meeting, startDateStr);
      const res = await axios.post(`${API_URL}/user_meetings/`, {
        user_id: userId,
        meeting_id: meeting.id,
        meeting_date,
        meeting_key
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data as { id: number };
      setJoinedMeetings(prev => ({ ...prev, [meeting_key]: true }));
      setUserMeetingIds(prev => ({ ...prev, [meeting_key]: data.id }));
      setShowNoti('You have joined this meeting!');
      setTimeout(() => setShowNoti(null), 2000);
    } catch (err) {
      setShowNoti('Failed to join meeting.');
      setTimeout(() => setShowNoti(null), 2000);
    }
  };

  const handleImOut = async (meeting: Meeting, startDateStr: string) => {
    const { meeting_date, meeting_key } = getMeetingKeyAndDate(meeting, startDateStr);
    const userMeetingId = userMeetingIds[meeting_key];
    if (!userMeetingId) {
      setShowNoti('Meeting not found for removal.');
      setTimeout(() => setShowNoti(null), 2000);
      return;
    }
    try {
      await axios.delete(`${API_URL}/user_meetings/${userMeetingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJoinedMeetings(prev => ({ ...prev, [meeting_key]: false }));
      setGuests(prev => ({ ...prev, [meeting_key]: 0 }));
      setShowNoti('You have left this meeting.');
      setTimeout(() => setShowNoti(null), 2000);
    } catch (err) {
      setShowNoti('Failed to leave meeting.');
      setTimeout(() => setShowNoti(null), 2000);
    }
  };

  const handleGuestChange = (meetingKey: string, delta: number) => {
    setGuests(prev => {
      const current = prev[meetingKey] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [meetingKey]: next };
    });
    setPendingGuestKey(meetingKey);
    setPendingGuestCount(prev => {
      const current = guests[meetingKey] || 0;
      return Math.max(0, current + delta);
    });
    if (guestTimer) clearTimeout(guestTimer);
    const timer = setTimeout(() => {
      setShowGuestConfirm(true);
    }, 1500);
    setGuestTimer(timer);
  };

  const handleConfirmGuest = async () => {
    if (!pendingGuestKey) return;
    const userMeetingId = userMeetingIds[pendingGuestKey];
    if (!userMeetingId) {
      setShowNoti('Meeting not found for guest update.');
      setShowGuestConfirm(false);
      return;
    }
    try {
      await axios.put(`${API_URL}/user_meetings/${userMeetingId}`, {
        guest: pendingGuestCount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowNoti(`Confirmed: You will bring ${pendingGuestCount} guest(s).`);
    } catch (err) {
      setShowNoti('Failed to update guest count.');
    } finally {
      setShowGuestConfirm(false);
      setTimeout(() => setShowNoti(null), 2000);
    }
  };

  const handleCancelGuest = () => {
    setShowGuestConfirm(false);
  };

  return (
    <div>
      {showNoti && (
        <div style={{ position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)', background: '#43cea2', color: '#fff', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 600, zIndex: 9999, boxShadow: '0 2px 12px rgba(80,128,127,0.18)' }}>
          {showNoti}
        </div>
      )}
      {showGuestConfirm && (
        <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', background: '#43cea2', color: '#fff', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 600, zIndex: 9999, boxShadow: '0 2px 12px rgba(80,128,127,0.18)' }}>
          Confirm bringing {pendingGuestCount} guest(s)?
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button style={{ background: '#fff', color: '#43cea2', border: 'none', borderRadius: '8px', padding: '0.5rem 1.2rem', fontWeight: 600, cursor: 'pointer' }} onClick={handleConfirmGuest}>Yes</button>
            <button style={{ background: '#fff', color: '#874e2c', border: 'none', borderRadius: '8px', padding: '0.5rem 1.2rem', fontWeight: 600, cursor: 'pointer' }} onClick={handleCancelGuest}>Cancel</button>
          </div>
        </div>
      )}
      <h2>Your Upcoming Meetings</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        Object.entries(meetingsByDay)
          .filter(([_, meetings]) => meetings.length > 0)
          .map(([date, meetings]) => (
            <div key={date} className="day-box" style={{ marginBottom: '2rem', background: '#f7f7f7', borderRadius: '16px', boxShadow: '0 2px 12px rgba(80,128,127,0.10)', padding: '1.2rem' }}>
              <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#50807f', marginBottom: '0.7rem' }}>{format(new Date(date), 'EEEE, MMMM d, yyyy')}</div>
              {meetings.map((meeting, idx) => {
                // Use local time for meeting_key and meeting_date
                const pad = (n: number) => n.toString().padStart(2, '0');
                const parsedDate = parse(meeting.start_time, 'PPPp', new Date());
                const localDate = `${parsedDate.getFullYear()}-${pad(parsedDate.getMonth()+1)}-${pad(parsedDate.getDate())}T${pad(parsedDate.getHours())}:${pad(parsedDate.getMinutes())}:00`;
                const meetingKey = `${userId}-${meeting.id}-${localDate}`;
                const countKey = meeting.id + '-' + localDate;
                const isJoined = joinedMeetings[meetingKey] === true;
                const counts = meetingCounts[countKey] || { users: 0, guests: 0 };
                return (
                  <div key={meetingKey} className="meeting-card" style={{ border: '1px solid #eee', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', background: '#fff' }}>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{meeting.title}</div>
                    <div style={{ color: '#50807f', fontSize: '0.95rem', marginBottom: '0.3rem' }}>{meeting.start_time}</div>
                    <div style={{ color: '#874e2c', fontSize: '0.95rem', marginBottom: '0.3rem' }}>{meeting.description}</div>
                    <div style={{ fontSize: '0.9rem', color: '#888' }}>Club: {meeting.club_name}</div>
                    <div style={{ fontSize: '0.9rem', color: '#50807f', marginBottom: '0.3rem' }}>
                      <strong>Guests:</strong> {counts.guests}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#50807f', marginBottom: '0.3rem' }}>
                      <strong>Players Joined:</strong> {counts.users}
                    </div>
                    {!isJoined ? (
                      <button
                        style={{ background: '#50807f', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.2rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.7rem' }}
                        onClick={() => handleImIn(meeting, meeting.start_time)}
                      >
                        ✓ I'm In
                      </button>
                    ) : (
                      <>
                        <button
                          style={{ background: '#eee', color: '#50807f', border: 'none', borderRadius: '8px', padding: '0.5rem 1.2rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.7rem', marginRight: '1rem' }}
                          onClick={() => handleImOut(meeting, meeting.start_time)}
                        >
                          ✗ I'm Out
                        </button>
                        <div style={{ marginTop: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                          <span style={{ fontWeight: 500, color: '#50807f' }}>Bringing guests:</span>
                          <button style={{ background: '#eee', border: 'none', borderRadius: '50%', width: '2rem', height: '2rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleGuestChange(meetingKey, -1)}>-</button>
                          <span style={{ minWidth: '2rem', textAlign: 'center', fontWeight: 600 }}>{guests[meetingKey] || 0}</span>
                          <button style={{ background: '#eee', border: 'none', borderRadius: '50%', width: '2rem', height: '2rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleGuestChange(meetingKey, 1)}>+</button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))
      )}
    </div>
  );
};

export default HomePage;
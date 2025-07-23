import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { parse, startOfWeek, getDay, format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import '../components/ClubDetailPage.css'; // 👈 đảm bảo đã import CSS

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface Club {
  id: number;
  name: string;
  description: string;
}

interface Meeting {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  club_id: number;
  recurrence?: string;
  days_of_week?: string;
  day_of_month?: number;
}

interface MeetingEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  description?: string;
}

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const ClubDetailPage: React.FC<{ token: string }> = ({ token }) => {
  const { clubId } = useParams<{ clubId: string }>();
  const [club, setClub] = useState<Club | null>(null);
  const [events, setEvents] = useState<MeetingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<MeetingEvent | null>(null);

  useEffect(() => {
    const fetchClub = async () => {
      try {
        const res = await axios.get<Club>(`${API_URL}/clubs/${clubId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClub(res.data);
      } catch {
        setClub(null);
      } finally {
        setLoading(false);
      }
    };
    fetchClub();
  }, [clubId, token]);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await axios.get<Meeting[]>(`${API_URL}/clubs/${clubId}/meetings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 3); // show 3 months ahead
        let eventList: MeetingEvent[] = [];
        res.data.forEach((m) => {
          const [startHour, startMinute] = m.start_time.split(":").map(Number);
          const [endHour, endMinute] = m.end_time.split(":").map(Number);
          const baseStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMinute);
          const baseEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, endMinute);
          if (!m.recurrence) {
            eventList.push({
              id: m.id,
              title: m.title,
              start: baseStart,
              end: baseEnd,
              description: m.description
            });
          } else if (m.recurrence === 'weekly' && m.days_of_week) {
            // Repeat on specified days_of_week (comma or space separated)
            const days = m.days_of_week.split(/,| /).map(d => d.trim()).filter(Boolean);
            let current = new Date(now);
            while (current <= endDate) {
              days.forEach(dayName => {
                const dayIndex = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].indexOf(dayName);
                if (dayIndex === -1) return;
                // Find next occurrence of this weekday
                let next = new Date(current);
                next.setDate(next.getDate() + ((dayIndex + 7 - next.getDay()) % 7));
                if (next > endDate) return;
                const eventStart = new Date(next.getFullYear(), next.getMonth(), next.getDate(), startHour, startMinute);
                const eventEnd = new Date(next.getFullYear(), next.getMonth(), next.getDate(), endHour, endMinute);
                eventList.push({
                  id: m.id,
                  title: m.title,
                  start: eventStart,
                  end: eventEnd,
                  description: m.description
                });
              });
              current.setDate(current.getDate() + 7);
            }
          } else if (m.recurrence === 'daily') {
            let current = new Date(now);
            while (current <= endDate) {
              const eventStart = new Date(current.getFullYear(), current.getMonth(), current.getDate(), startHour, startMinute);
              const eventEnd = new Date(current.getFullYear(), current.getMonth(), current.getDate(), endHour, endMinute);
              eventList.push({
                id: m.id,
                title: m.title,
                start: eventStart,
                end: eventEnd,
                description: m.description
              });
              current.setDate(current.getDate() + 1);
            }
          } else if (m.recurrence === 'monthly' && m.day_of_month) {
            let current = new Date(now);
            while (current <= endDate) {
              const eventStart = new Date(current.getFullYear(), current.getMonth(), m.day_of_month, startHour, startMinute);
              const eventEnd = new Date(current.getFullYear(), current.getMonth(), m.day_of_month, endHour, endMinute);
              if (eventStart > endDate) break;
              eventList.push({
                id: m.id,
                title: m.title,
                start: eventStart,
                end: eventEnd,
                description: m.description
              });
              current.setMonth(current.getMonth() + 1);
            }
          }
        });
        setEvents(eventList);
      } catch {
        setEvents([]);
      }
    };
    fetchMeetings();
  }, [clubId, token]);

  const handleRegister = () => {
    if (selectedEvent) {
      alert(`Bạn đã đăng ký sự kiện "${selectedEvent.title}" thành công!`);
      setSelectedEvent(null);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!club) return <div>Club not found.</div>;

  return (
    <>
      <div className="club-detail-wrapper">
        <div className="club-info">
          <h2>{club.name}</h2>
          <p>{club.description}</p>
          <p><strong>Club ID:</strong> {club.id}</p>
        </div>

        <div className="calendar-wrapper">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            defaultView="week"
            style={{ height: 600 }}
            scrollToTime={new Date(new Date().setHours(18, 0, 0))}
            onSelectEvent={(event: MeetingEvent) => setSelectedEvent(event)}
          />
        </div>
      </div>

      {selectedEvent && (
        <div className="event-detail-overlay">
          <div className="event-detail-box">
            <h3>{selectedEvent.title}</h3>
            <p><strong>Start:</strong> {selectedEvent.start.toLocaleString()}</p>
            <p><strong>End:</strong> {selectedEvent.end.toLocaleString()}</p>
            <p><strong>Description:</strong> {selectedEvent.description}</p>
            <div className="buttons">
              <button className="register-btn" onClick={handleRegister}>Join</button>
              <button onClick={() => setSelectedEvent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClubDetailPage;

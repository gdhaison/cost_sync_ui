import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { parse, startOfWeek, getDay, format } from 'date-fns';
import { enUS } from 'date-fns/locale';

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
  start_time: string; // ISO format string
  end_time: string;   // ISO format string
  club_id: number
}

interface MeetingEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  description?: string;
}

const locales = {
  'en-US': enUS,
};

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

  useEffect(() => {
    const fetchClub = async () => {
      try {
        const res = await axios.get<Club>(`${API_URL}/clubs/${clubId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClub(res.data);
      } catch (err) {
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
        const res = await axios.get<Meeting[]>(`${API_URL}/meetings/`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const meetings = res.data;
        const clubMeetings = meetings.filter((m) => m.club_id === Number(clubId));

        const eventList: MeetingEvent[] = clubMeetings.map((m) => ({
          id: m.id,
          title: m.title,
          start: new Date(m.start_time),
          end: new Date(m.end_time || m.start_time),
          description: m.description
        }));

        setEvents(eventList);
      } catch (err) {
        setEvents([]);
      }
    };
    fetchMeetings();
  }, [clubId, token]);

  if (loading) return <div>Loading...</div>;
  if (!club) return <div>Club not found.</div>;

  return (
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
    />
  </div>
</div>
  );
};

export default ClubDetailPage;

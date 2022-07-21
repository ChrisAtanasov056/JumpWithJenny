// src/components/Schedule/Schedule.js
import React from 'react';
import './Schedule.css';

const Schedule = () => {
  // Time slots from 14:00 to 21:00
  const times = [
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00',
  ];

  // Days of the week
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <section id="schedule" className="schedule-section">
      <h2>Weekly Schedule</h2>
      <table className="schedule-table">
        <thead>
          <tr>
            <th>Time</th>
            {days.map((day) => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {times.map((time) => (
            <tr key={time}>
              <td>{time}</td>
              {days.map((day) => (
                <td key={`${time}-${day}`} className="schedule-cell">
                  {/* Placeholder for schedule cell content */}
                  {/* You can add className for booked/available as needed */}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default Schedule;

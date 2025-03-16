import React from 'react';
import './Schedule.scss';

const Schedule = () => {
  // Days of the week
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Example data for available workout times
  const scheduleData = {
    Monday: { '14:00': 'available', '18:00': 'booked' },
    Tuesday: { },
    Wednesday: { '16:00': 'booked', '20:00': 'available' },
    Thursday: { },
    Friday: { '14:00': 'available'},
  };

  // All possible times (for table structure)
  const times = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

  return (
    <section id="schedule" className="schedule-section">
      <div className="schedule-container">
        <h2>Weekly Schedule</h2>

        {/* Desktop Table */}
        <div className="desktop-schedule">
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
                  {days.map((day) => {
                    const status = scheduleData[day]?.[time];
                    return (
                      <td
                        key={`${day}-${time}`}
                        className={`schedule-cell ${status || 'empty'}`}
                      >
                        {status === 'available' && 'Available'}
                        {status === 'booked' && 'Booked'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List */}
        <div className="mobile-schedule">
          {days.map((day) => {
            // Check if the day has any available or booked workouts
            const hasWorkouts = Object.keys(scheduleData[day] || {}).length > 0;

            // Only render the day if it has workouts
            return hasWorkouts ? (
              <div key={day} className="day-column">
                <div className="day-header">{day}</div>
                {Object.entries(scheduleData[day]).map(([time, status]) => (
                  <div
                    key={`${day}-${time}`}
                    className={`time-slot ${status}`}
                  >
                    <span className="time">{time}</span>
                    <span className="status">{status}</span>
                  </div>
                ))}
              </div>
            ) : null;
          })}
        </div>
      </div>
    </section>
  );
};

export default Schedule;
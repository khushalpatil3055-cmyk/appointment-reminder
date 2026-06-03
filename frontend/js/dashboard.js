
// Config 
const BACKEND_URL = 'https://appointment-reminder-kpl0.onrender.com';

//  On page load
document.addEventListener('DOMContentLoaded', () => {
  loadAppointments();
  // Auto-refresh every 30 seconds
  setInterval(loadAppointments, 30000);
});

//  Load & Render Appointments 
async function loadAppointments() {
  const tbody = document.getElementById('tableBody');

  try {
    const res  = await fetch(`${BACKEND_URL}/appointments`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Failed to fetch');

    const appointments = data.appointments || [];

    //  Update stat cards 
    const now      = new Date();
    const upcoming = appointments.filter(a => new Date(a.appointment_time) > now);
    const reminded = appointments.filter(a => a.reminder_sent);

    document.getElementById('statTotal').textContent    = appointments.length;
    document.getElementById('statUpcoming').textContent = upcoming.length;
    document.getElementById('statReminded').textContent = reminded.length;
    document.getElementById('tableCount').textContent   =
      `${appointments.length} appointment${appointments.length !== 1 ? 's' : ''}`;

    //  Empty state 
    if (appointments.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="5">
          <div class="state-box">
            <div class="icon">📅</div>
            <p>No appointments yet.
              <a href="index.html" style="color:var(--accent)">Book the first one →</a>
            </p>
          </div>
        </td></tr>`;
      return;
    }

    //  Sort newest first & render rows 
    appointments
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .forEach(appt => {
        tbody.innerHTML += buildRow(appt);
      });

    // Clear old rows first then re-render
    tbody.innerHTML = appointments
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(buildRow)
      .join('');

  } catch (err) {
    console.error('Dashboard error:', err);
    tbody.innerHTML = `
      <tr><td colspan="5">
        <div class="state-box">
          <div class="icon">⚠️</div>
          <p style="color:var(--error)">
            Cannot connect to backend.<br>
            Make sure the Python server is running on port 5000.
          </p>
        </div>
      </td></tr>`;

    document.getElementById('statTotal').textContent    = '—';
    document.getElementById('statUpcoming').textContent = '—';
    document.getElementById('statReminded').textContent = '—';
  }
}

//  Build a table row 
function buildRow(appt) {
  const status = getStatus(appt);
  return `
    <tr>
      <td class="name-cell">${escHtml(appt.customer_name)}</td>
      <td class="phone-cell">${escHtml(appt.phone_number)}</td>
      <td style="color:var(--muted);font-size:0.82rem">${formatDate(appt.created_at)}</td>
      <td style="font-weight:500">${formatDate(appt.appointment_time)}</td>
      <td><span class="badge ${status.cls}">${status.label}</span></td>
    </tr>`;
}

//  Status badge logic 
function getStatus(appt) {
  const now     = new Date();
  const apptTime = new Date(appt.appointment_time);
  const diffMins = (apptTime - now) / 60000;

  if (appt.reminder_sent)  return { label: 'Reminded', cls: 'badge-reminded' };
  if (diffMins < 0)        return { label: 'Past',     cls: 'badge-past'     };
  if (diffMins <= 60)      return { label: 'Due Soon', cls: 'badge-soon'     };
  return                          { label: 'Upcoming', cls: 'badge-upcoming' };
}

//  Helpers 
function formatDate(isoString) {
  return new Date(isoString).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

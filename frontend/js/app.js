

// Config
const BACKEND_URL = 'http://localhost:5000';

// On page load 
document.addEventListener('DOMContentLoaded', () => {

  // Set minimum datetime to right now
  const dtInput = document.getElementById('datetime');
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  dtInput.min = now.toISOString().slice(0, 16);

  // Attach form submit handler
  document.getElementById('appointmentForm')
    .addEventListener('submit', handleSubmit);
});

//  Form Submit Handler 
async function handleSubmit(e) {
  e.preventDefault();

  const btn = document.getElementById('submitBtn');
  btn.classList.add('loading');
  btn.disabled = true;

  // Read form values
  const customer_name     = document.getElementById('name').value.trim();
  const phone_number      = document.getElementById('phone').value.trim();
  const appointment_time  = document.getElementById('datetime').value;

  // Basic phone validation
  if (!phone_number.startsWith('+')) {
    showToast('✗ Phone must include country code (e.g. +91...)', 'error');
    btn.classList.remove('loading');
    btn.disabled = false;
    return;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name,
        phone_number,
        appointment_time: new Date(appointment_time).toISOString()
      })
    });

    const data = await response.json();

    if (response.ok) {
      showToast('✓ Appointment booked! Confirmation sent via WhatsApp.', 'success');
      e.target.reset();
    } else {
      showToast(`✗ Error: ${data.error || 'Something went wrong'}`, 'error');
    }

  } catch (err) {
    showToast('✗ Cannot connect to server. Is the backend running?', 'error');
    console.error('Submit error:', err);
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

// Toast Helper 
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `show ${type}`;
  setTimeout(() => { toast.className = ''; }, 4000);
}

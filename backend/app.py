

from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from twilio.rest import Client as TwilioClient
from dotenv import load_dotenv
from datetime import datetime, timezone
import os
import threading
import time

# ── Load environment variables from .env ──
load_dotenv()

# ── Flask app setup ──
app = Flask(__name__)
CORS(app)  # Allow requests from frontend (localhost)

# ── Supabase client ──
SUPABASE_URL  = os.getenv("SUPABASE_URL")
SUPABASE_KEY  = os.getenv("SUPABASE_SECRET_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Twilio client ──
TWILIO_SID         = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN  = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM        = os.getenv("TWILIO_FROM_NUMBER")   # e.g. whatsapp:+14155238886
twilio_client      = TwilioClient(TWILIO_SID, TWILIO_AUTH_TOKEN)


#  HELPER — Send WhatsApp / SMS message

def send_message(to_number: str, message: str):
    """
    Sends a WhatsApp message via Twilio.
    Falls back to SMS if WhatsApp prefix is not set.
    """
    try:
        from_number = TWILIO_FROM
        to_formatted = f"whatsapp:{to_number}" if not to_number.startswith("whatsapp:") else to_number

        msg = twilio_client.messages.create(
            body=message,
            from_=from_number,
            to=to_formatted
        )
        print(f"[Twilio] Message sent. SID: {msg.sid}")
        return True, msg.sid

    except Exception as e:
        print(f"[Twilio] ERROR sending message: {e}")
        return False, str(e)


#  ROUTE 1 — POST /appointments
#  Save a new appointment + send confirmation

@app.route("/appointments", methods=["POST"])
def create_appointment():
    data = request.get_json()

    # ── Validate required fields ──
    required = ["customer_name", "phone_number", "appointment_time"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Missing field: {field}"}), 400

    customer_name    = data["customer_name"].strip()
    phone_number     = data["phone_number"].strip()
    appointment_time = data["appointment_time"]  # ISO string from frontend

    # ── Save to Supabase ──
    try:
        result = supabase.table("appointments").insert({
            "customer_name":    customer_name,
            "phone_number":     phone_number,
            "appointment_time": appointment_time,
            "reminder_sent":    False
        }).execute()

        appointment = result.data[0]

    except Exception as e:
        print(f"[Supabase] Insert error: {e}")
        return jsonify({"error": "Failed to save appointment"}), 500

    # ── Send WhatsApp confirmation ──
    appt_dt = datetime.fromisoformat(appointment_time.replace("Z", "+00:00"))
    formatted_time = appt_dt.strftime("%A, %d %B %Y at %I:%M %p")

    confirmation_msg = (
        f"Hello {customer_name}! ✅\n\n"
        f"Your appointment has been confirmed.\n"
        f"📅 Date & Time: {formatted_time}\n\n"
        f"We will send you a reminder 1 hour before. "
        f"Reply STOP to opt out."
    )

    sent, result_info = send_message(phone_number, confirmation_msg)

    return jsonify({
        "success": True,
        "message": "Appointment booked successfully",
        "appointment": appointment,
        "whatsapp_sent": sent
    }), 201


#  ROUTE 2 — GET /appointments
#  Fetch all appointments for the dashboard

@app.route("/appointments", methods=["GET"])
def get_appointments():
    try:
        result = supabase.table("appointments") \
            .select("*") \
            .order("created_at", desc=True) \
            .execute()

        return jsonify({
            "success": True,
            "appointments": result.data
        }), 200

    except Exception as e:
        print(f"[Supabase] Fetch error: {e}")
        return jsonify({"error": "Failed to fetch appointments"}), 500



#  BONUS — Background reminder checker
#  Runs every 60 seconds in a separate thread
#  Sends reminder if appointment is within 1 hour

def reminder_checker():
    print("[Reminder] Background checker started...")

    while True:
        try:
            now = datetime.now(timezone.utc)

            # Fetch appointments where reminder NOT yet sent
            result = supabase.table("appointments") \
                .select("*") \
                .eq("reminder_sent", False) \
                .execute()

            appointments = result.data or []

            for appt in appointments:
                appt_time = datetime.fromisoformat(
                    appt["appointment_time"].replace("Z", "+00:00")
                )
                minutes_until = (appt_time - now).total_seconds() / 60

                # Send reminder if between 0 and 60 minutes away
                if 0 < minutes_until <= 60:
                    print(f"[Reminder] Sending reminder to {appt['customer_name']}")

                    formatted_time = appt_time.strftime("%I:%M %p")
                    reminder_msg = (
                        f"⏰ Reminder: Hi {appt['customer_name']}!\n\n"
                        f"Your appointment is in less than 1 hour.\n"
                        f"🕐 Time: {formatted_time}\n\n"
                        f"See you soon!"
                    )

                    sent, _ = send_message(appt["phone_number"], reminder_msg)

                    if sent:
                        # Mark reminder_sent = True in database
                        supabase.table("appointments") \
                            .update({"reminder_sent": True}) \
                            .eq("id", appt["id"]) \
                            .execute()

                        print(f"[Reminder] ✓ Reminder sent & marked for {appt['customer_name']}")

        except Exception as e:
            print(f"[Reminder] ERROR: {e}")

        # Wait 60 seconds before checking again
        time.sleep(60)



#  START SERVER

if __name__ == "__main__":
    # Start reminder checker in background thread
    reminder_thread = threading.Thread(target=reminder_checker, daemon=True)
    reminder_thread.start()

    print("=" * 45)
    print("  Appointment Reminder Backend Running")
    print("  http://localhost:5000")
    print("=" * 45)

    app.run(debug=True, port=5000, use_reloader=False)




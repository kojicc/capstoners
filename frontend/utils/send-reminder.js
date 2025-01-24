import axios from './axiosInstance';

export default async function handler(req, res) {
  try {
    // Call the Django backend API to send reminder emails
    const response = await axios.get(`send-reminder-emails/`);

    res.status(200).json({ message: 'Email reminders triggered successfully' });
  } catch (error) {
    console.error('Error triggering email reminders:', error);
    res.status(500).json({ error: 'Failed to trigger email reminders' });
  }
}

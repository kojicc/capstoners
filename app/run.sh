#!/bin/sh

# Navigate to the backend/capBackend directory
cd capBackend

# Run database migrations
python3 manage.py migrate

# Start the Gunicorn server
gunicorn capBackend.wsgi:application --log-file -
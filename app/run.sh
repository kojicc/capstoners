#!/bin/sh

# Navigate to the backend/capBackend directory
cd backend

cd capBackend

# Run database migrations
# python3 backend/capBackend/manage.py migrate

# Start the Gunicorn server
gunicorn capBackend.wsgi:application --log-file -
release: cd backend/capBackend && python3 manage.py migrate
web: cd backend/capBackend && gunicorn capBackend.wsgi:application --log-file -
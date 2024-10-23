release: cd backend && python3 manage.py migrate
web: cd backend && gunicorn capBackend.wsgi:application --log-file -
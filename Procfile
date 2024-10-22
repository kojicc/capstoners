# web: gunicorn capBackend.wsgi --log-file -
# frontend: npm run build --prefix frontend && npm start --prefix frontend
web: gunicorn capBackend.wsgi --log-file - & npm run build --prefix frontend && npm start --prefix frontend

# """
# ASGI config for capBackend project.

# It exposes the ASGI callable as a module-level variable named ``application``.

# For more information on this file, see
# https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
# """

# import os

# from django.core.asgi import get_asgi_application

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'capBackend.settings')

# application = get_asgi_application()


# asgi.py

import os
from django.core.asgi import get_asgi_application
import channels.routing
import channels.auth
import reservations.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'capBackend.settings')

application = get_asgi_application()

application = channels.routing.ProtocolTypeRouter({
    "http": application,
    "websocket": channels.auth.AuthMiddlewareStack(
        channels.routing.URLRouter(
            reservations.routing.websocket_urlpatterns
        )
    ),
})
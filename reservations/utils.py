# # reservations/utils.py

# from .models import Notification
# from django.contrib.auth.models import User

# def create_user_notification(user: User, notification_type: str, message: str):
#     Notification.objects.create(user=user, type=notification_type, message=message)

# def create_admin_notification(notification_type: str, message: str):
#     admins = User.objects.filter(is_staff=True)
#     for admin in admins:
#         Notification.objects.create(user=admin, type=notification_type, message=message)


from .models import Notification

def send_notification(recipient, message):
    Notification.objects.create(recipient=recipient, message=message)

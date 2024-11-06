from django.db import models
from django.utils import timezone
from django.conf import settings

class PageView(models.Model):
    url = models.CharField(max_length=200)
    user_ip = models.GenericIPAddressField()
    timestamp = models.DateTimeField(default=timezone.now)

class NewUser(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    signup_date = models.DateTimeField(auto_now_add=True)

class CompletedOrder(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reservation_id = models.CharField(max_length=200)
    reservation_date = models.DateTimeField(auto_now_add=True)
    completed_date = models.DateTimeField(auto_now_add=True)
    # satisfaction_rate = models.DecimalField(max_digits=5, decimal_places=2, default=100.0)

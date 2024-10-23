import uuid
from django.db import models
from products.models import Product
from django.utils import timezone
from django.utils.dateparse import parse_datetime
import datetime
from django.conf import settings


# Create your models here.


class ClassSchedule(models.Model):
    class_section = models.CharField(max_length=100, primary_key=True)
    class_name = models.CharField(max_length=100)
    class_days = models.JSONField(default=dict)  # Updated to allow multiple times per day
    class_instructor = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.class_section} - {self.class_name}"


class Reservation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, to_field='username')
    user_class_section = models.ForeignKey(ClassSchedule, on_delete=models.CASCADE, to_field='class_section', null=True, blank=True)
    reservation_id = models.CharField(primary_key=True, max_length=100, unique=True, editable=False)
    reserved_date = models.DateTimeField(default=timezone.now)
    reservation_day = models.CharField(max_length=100)
    reservation_date = models.DateTimeField()
    reservation_date_end = models.DateTimeField()
    reservation_purpose = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=80, default='PENDING')
    is_group = models.BooleanField(default=False)
    group_members = models.JSONField(default=list, blank=True, null=True)  # Ensure this is present
    subject = models.CharField(max_length=200, blank=True, null=True)
    
    def add_group_member(self, member):
        members = self.group_members
        if member not in members:
            members.append(member)
            self.group_members = members
            self.save()

    def remove_group_member(self, member):
        members = self.group_members
        if member in members:
            members.remove(member)
            self.group_members = members
            self.save()    

    def save(self, *args, **kwargs):
        if not self.reservation_id:
            self.reservation_id = f'{self.user.username}_{timezone.now().strftime("%Y%m%d_%H%M%S")}_{uuid.uuid4().hex[:8]}'
        super().save(*args, **kwargs)


class ReservationItem(models.Model):
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, to_field='productId')
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f'{self.quantity} of {self.product.productId} in Reservation {self.reservation.reservation_id}'


class Cart(models.Model):
    id = models.AutoField(primary_key=True)  # Auto-incremented primary key
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, to_field='username')  # Use `to_field` to specify `username`
    product = models.ForeignKey(Product, on_delete=models.CASCADE, to_field='productId')  # Use `to_field` to specify `productId`
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f'{self.user.username}\'s cart'


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, to_field='username')
    message = models.TextField()
    read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Notification for {self.user.username} - {self.timestamp}'
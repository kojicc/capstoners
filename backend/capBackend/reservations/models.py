import uuid
from django.db import models
from products.models import Product
from django.utils import timezone
from django.utils.dateparse import parse_datetime
import datetime
from django.conf import settings
from django.core.mail import send_mail
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
    same_day_reservation = models.BooleanField(default=False)
    user_class_section = models.CharField(max_length=100)
    reservation_id = models.CharField(primary_key=True, max_length=100, unique=True, editable=False)
    reserved_date = models.DateTimeField()
    reservation_day = models.CharField(max_length=100)
    reservation_date = models.TimeField()
    reservation_date_end = models.TimeField()
    reservation_purpose = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=80, default='PENDING')
    is_group = models.BooleanField(default=False)
    group_members = models.JSONField(default=list, blank=True, null=True)  # Ensure this is present
    subject = models.CharField(max_length=200, blank=True, null=True)
    reservation_made_at = models.DateTimeField(auto_now_add=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    # status_updated_at = models.DateTimeField(auto_now=True)
    
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
            # self.reservation_id = f'{self.user.username}_{timezone.now().strftime("%Y%m%d_%H%M%S")}_{uuid.uuid4().hex[:8]}'
            self.reservation_id = f'{uuid.uuid4().hex[:8]}'
        super().save(*args, **kwargs)

    
class ReservationItem(models.Model):
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, to_field='productId')
    quantity = models.PositiveIntegerField()

    @property
    def return_info(self):
        try:
            return self.return_info_rel
        except ReturnedItem.DoesNotExist:
            return None
    
    def __str__(self):
        return f'{self.quantity} of {self.product.productId} in Reservation {self.reservation.reservation_id}'
    

class PaymentProof(models.Model):
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='payment_proofs')
    image = models.ImageField(upload_to='payment_proofs/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Payment proof for {self.reservation.reservation_id}"


class ReturnedItem(models.Model):
    reservation_item = models.OneToOneField(ReservationItem, on_delete=models.CASCADE, related_name='return_info_rel')
    quantity_returned = models.PositiveIntegerField(default=0)
    quantity_damaged = models.PositiveIntegerField(default=0)

    @property
    def quantity_missing(self):
        return max(0, self.reservation_item.quantity - self.quantity_returned)

    def __str__(self):
        return f"Returned: {self.quantity_returned} | Damaged: {self.quantity_damaged} | Missing: {self.quantity_missing}"


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
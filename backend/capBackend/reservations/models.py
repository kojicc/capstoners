import uuid
from django.db import models
from django.conf import settings
from products.models import Product
from django.utils import timezone
from django.utils.dateparse import parse_datetime
import datetime


# Create your models here.
class Reservation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, to_field='username')
    reservation_id = models.CharField(primary_key=True, max_length=100, unique=True, editable=False)
    reservation_date = models.DateTimeField()
    reservation_date_end = models.DateTimeField(blank=True)
    reservation_purpose = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=80, default='PENDING')

    def save(self, *args, **kwargs):
        # Generate reservation_id if not provided
        if not self.reservation_id:
            self.reservation_id = f'{self.user.username}_{timezone.now().strftime("%Y-%m-%d %H:%M")}_{uuid.uuid4().hex[:8]}'

        # Set the reservation date if not provided
        if not self.reservation_date_end:
            # self.reservation_date_end = self.reservation_date.date().strftime("%m-%d-%Y-%H:%M") + timezone.timedelta(hours=24)
            self.reservation_date_end =  datetime.datetime.strptime(self.reservation_date, "%Y-%m-%d %H:%M")+ timezone.timedelta(hours=24)
            ""
            print(self.reservation_date_end)

        # Set a default purpose if none is provided
        if not self.reservation_purpose:
            self.reservation_purpose = 'Lab Assessment Borrowing Purpose'

        super().save(*args, **kwargs)

    def __str__(self):
        return f'Reservation {self.reservation_id} by {self.user.username}'


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
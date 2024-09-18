# models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

# Custom User model extending AbstractUser
class User(AbstractUser):
    first_name = models.CharField(max_length=255)  # Pangalan ng user
    last_name = models.CharField(max_length=255)   # Apelyido ng user
    email = models.CharField(max_length=255, unique=True)  # Email ng user, dapat unique
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=255)   # Password ng user
    role = models.CharField(max_length=50, choices=[('admin', 'Admin'), ('guest', 'Guest'), ('student', 'Student')], default='guest')  # Role ng user, base role is student

   

    USERNAME_FIELD = 'username'

    REQUIRED_FIELDS = []  # Walang additional fields na required para makagawa ng user

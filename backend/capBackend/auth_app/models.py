# models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from reservations.models import ClassSchedule
import uuid

# Custom User model extending AbstractUser
class User(AbstractUser):
    first_name = models.CharField(max_length=255)  # Pangalan ng user
    last_name = models.CharField(max_length=255)   # Apelyido ng user
    email = models.CharField(max_length=255, unique=True)  # Email ng user, dapat unique
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=255)   # Password ng user
    role = models.CharField(max_length=50, choices=[('admin', 'Admin'), ('guest', 'Guest'), ('student', 'Student')], default='guest')  # Role ng user, base role is student
    class_section = models.CharField(max_length=255, null=True)  # Section ng user, pwedeng wala
    locked_out = models.BooleanField(default=False)  # Boolean field para malaman kung locked
    is_active = models.BooleanField(default=False, null=False)  # Boolean field para malaman kung active
    verification_token = models.UUIDField(default=uuid.uuid4, editable=False, null=True, blank=True)  # Add verification token
    reset_code = models.CharField(max_length=6, null=True, blank=True)  # Reset code for password reset
    isAdmin = models.BooleanField(default=False)  # Boolean field para malaman kung admin
    isStudent = models.BooleanField(default=False)  # Boolean field para malaman kung student
    

   

    USERNAME_FIELD = 'username'

    REQUIRED_FIELDS = []  # Walang additional fields na required para makagawa ng user

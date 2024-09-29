# serializers.py
from rest_framework import serializers
from .models import User
from django.contrib.auth.hashers import make_password

# Serializer para sa User model
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id','first_name','last_name','email','username','role','password','date_joined']  # Mga field ng User model

        extra_kwargs = {
            'password': {'write_only': True}  # Ang password field ay para lang sa write, hindi ipapakita sa mga response
        }

    # Function para sa pag-create ng user base sa validated_data
    def create(self, validated_data):
        password = validated_data.pop('password', None)  # Alisin ang password mula sa validated_data

        instance = self.Meta.model(**validated_data)  # Gumawa ng instance ng User model gamit ang validated_data
        if password is not None:
            instance.set_password(password)  # I-set ang password gamit ang set_password method ng User model
        instance.save()  # I-save ang instance ng User model
        return instance
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)  # Hash the password before saving
        instance.save()
        return instance

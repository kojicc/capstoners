from rest_framework import serializers
from .models import PageView, NewUser, CompletedOrder

class PageViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageView
        fields = '__all__'

class NewUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewUser
        fields = '__all__'

class CompletedOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompletedOrder
        fields = '__all__'

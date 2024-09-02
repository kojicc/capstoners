from rest_framework import serializers
from .models import Product, Category

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['name', 'description', 'price', 'category', 'quantity', 'image','productId','reserved','broken_damaged']

class ProductImageonlySerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        # fields = ['image','productId']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

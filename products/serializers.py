from rest_framework import serializers
from .models import Product, Category, ProductType

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['name', 'description', 'price', 'category', 'quantity', 'image','productId','reserved','broken_damaged','type']

class ProductTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductType
        fields = '__all__'

class ProductImageonlySerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        # fields = ['image','productId']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

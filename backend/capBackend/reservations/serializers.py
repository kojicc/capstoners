from rest_framework import serializers
from .models import Reservation
from .models import Cart, ReservationItem, Notification, ClassSchedule
from  products.serializers import ProductImageonlySerializer

class ClassScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassSchedule
        fields = '__all__'
        

class ReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        # fields = [ 'user', 'reservation_id', 'reservation_date', 'status',
        # 'reservation_date_end','reservation_purpose ']
        fields = '__all__'
        # read_only_fields = ['reservation_id', 'reservation_date']
        read_only_fields = ['reservation_id']

class ReservationItemSerializer(serializers.ModelSerializer):
    product = ProductImageonlySerializer()

    class Meta:
        model = ReservationItem
        fields = ['reservation', 'product', 'quantity','product_id']

class CartSerializer(serializers.ModelSerializer):
    product = ProductImageonlySerializer()

    class Meta:
        model = Cart
        fields = ['user', 'quantity', 'product']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


# class AddToCartSerializer(serializers.Serializer):
#     username = serializers.CharField()
#     productIds = serializers.ListField(child=serializers.CharField())
#     quantities = serializers.ListField(child=serializers.IntegerField())

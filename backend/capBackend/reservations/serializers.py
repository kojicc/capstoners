from rest_framework import serializers
from .models import Reservation, ReturnedItem
from products.serializers import ProductImageSerializer
from .models import Cart, ReservationItem, Notification, ClassSchedule, PaymentProof
from  products.serializers import ProductImageonlySerializer

class ClassScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassSchedule
        fields = '__all__'
        

class PaymentProofSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentProof
        fields = ['id', 'image', 'uploaded_at', 'verified']
        
        
class ReservationSerializer(serializers.ModelSerializer):
    payment_proofs = PaymentProofSerializer(many=True, read_only=True)
    
    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = ['reservation_id']
        



class ReturnedItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReturnedItem
        fields = ['quantity_returned', 'quantity_damaged']

class ReservationItemSerializer(serializers.ModelSerializer):
    product = ProductImageSerializer()
    return_info = ReturnedItemSerializer(read_only=True, required=False)
    returned_quantity = serializers.SerializerMethodField()
    damaged_quantity = serializers.SerializerMethodField()

    class Meta:
        model = ReservationItem
        fields = ['id', 'reservation', 'product', 'quantity', 'return_info', 'returned_quantity', 'damaged_quantity']

    def get_returned_quantity(self, obj):
        try:
            return obj.return_info.quantity_returned
        except AttributeError:
            return 0

    def get_damaged_quantity(self, obj):
        try:
            return obj.return_info.quantity_damaged
        except AttributeError:
            return 0

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

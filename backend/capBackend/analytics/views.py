from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from products.serializers import ProductImageSerializer
from products.models import Product
from products.models import Category
from .models import PageView, NewUser, CompletedOrder
from .serializers import PageViewSerializer, NewUserSerializer, CompletedOrderSerializer
from auth_app.models import User
from reservations.models import Reservation
from django.db.models import Sum
from rest_framework.permissions import IsAuthenticated


# class PageViewViewSet(viewsets.ModelViewSet):
#     queryset = PageView.objects.all()
#     serializer_class = PageViewSerializer

#     def create(self, request, *args, **kwargs):
#         response = super().create(request, *args, **kwargs)
#         return Response({"message": "Page view recorded"}, status=response.status_code)

# class NewUserViewSet(viewsets.ModelViewSet):
#     queryset = NewUser.objects.all()
#     serializer_class = NewUserSerializer

#     def create(self, request, *args, **kwargs):
#         response = super().create(request, *args, **kwargs)
#         return Response({"message": "New user recorded"}, status=response.status_code)

# class CompletedOrderViewSet(viewsets.ModelViewSet):
#     queryset = CompletedOrder.objects.all()
#     serializer_class = CompletedOrderSerializer

#     def create(self, request, *args, **kwargs):
#         response = super().create(request, *args, **kwargs)
#         return Response({"message": "Completed order recorded"}, status=response.status_code)


# class ReservedProductsAPIView(APIView):
#     def get(self, request):
#         reserved_products = Product.objects.values('category__name').annotate(total_reserved=Sum('reserved'))
#         return Response(reserved_products)
    

# class BrokenDamagedProductsAPIView(APIView):
#     def get(self, request):
#         broken_damaged_products = Product.objects.values('category__name').annotate(total_broken_damaged=Sum('broken_damaged'))
#         return Response(broken_damaged_products)

class getMostReservedProducts(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reserved_products = Product.objects.values('productId', 'name').annotate(total_reserved=Sum('reserved')).order_by('-reserved')[:5]

        return Response(reserved_products)

class getTotalPendingOrders(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        total_pending_orders = Reservation.objects.filter(status='PENDING').count()
        return Response({"total_pending_orders": total_pending_orders})

class getTotalUsers(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        total_users = User.objects.count()
        return Response({"total_users": total_users})

class TotalStocksPerCategoryAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        categories = Product.objects.values('category__name').distinct()
        data = []
        total_in_stock = 0
        total_reserved = 0
        total_broken_damaged = 0

        for category in categories:
            category_name = category['category__name']
            products = Product.objects.filter(category__name=category_name)
            category_in_stock = sum(p.quantity for p in products)
            category_reserved = sum(p.reserved for p in products)
            category_broken_damaged = sum(p.broken_damaged for p in products)

            total_in_stock += category_in_stock
            total_reserved += category_reserved
            total_broken_damaged += category_broken_damaged

            data.append({
                'category': category_name,
                'in_stock': category_in_stock,
                'reserved': category_reserved,
                'broken_damaged': category_broken_damaged,
                'total': category_in_stock + category_reserved + category_broken_damaged,
            })

        return Response({
            'categories': data,
            'totals': {
                'in_stock': total_in_stock,
                'reserved': total_reserved,
                'broken_damaged': total_broken_damaged,
                'total': total_in_stock + total_reserved + total_broken_damaged,
            }
        })
    



class getCompletedOrdersEachMonth(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        completed_orders = Reservation.objects.filter(status='COMPLETED')
        completed_orders_by_month = {}

        # Populate the dictionary with order counts by month
        for order in completed_orders:
            month = order.reservation_date_end.strftime("%B")
            if month in completed_orders_by_month:
                completed_orders_by_month[month] += 1
            else:
                completed_orders_by_month[month] = 1
        
        # Define the order of months
        months_order = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]

        # Sort the dictionary by the order of months and filter out months with 0 count
        sorted_completed_orders_by_month = {
            month: completed_orders_by_month.get(month, 0)
            for month in months_order
            if completed_orders_by_month.get(month, 0) > 0
        }

        total_completed_orders = sum(sorted_completed_orders_by_month.values())

        return Response(
          {  "sorted":sorted_completed_orders_by_month,
            "total":total_completed_orders,}
        )
     

class getTotalNewUsersEachMonth(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        new_users = User.objects.all()
        new_users_by_month = {}
        for user in new_users:
            month = user.date_joined.strftime("%B")
            if month in new_users_by_month:
                new_users_by_month[month] += 1
            else:
                new_users_by_month[month] = 1
        return Response(new_users_by_month)

class getTotalPageViews(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        # urls = request.data.get('urls')
        # total_page_views = PageView.objects.filter(url=urls).count()
        total_page_views = PageView.objects.count()
        return Response({"total_page_views": total_page_views})
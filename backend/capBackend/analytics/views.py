from datetime import timedelta
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
from django.utils import timezone
import pandas as pd
from io import BytesIO
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import PageView, NewUser, CompletedOrder
from auth_app.models import User
from reservations.models import Reservation
from products.models import Product
from .serializers import PageViewSerializer, NewUserSerializer, CompletedOrderSerializer
from reservations.serializers import ReservationSerializer
from auth_app.serializers import UserSerializer

class ExportDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        username = request.query_params.get('username', None)

        # Filter data based on the date range if provided
        if start_date and end_date:
            page_views = PageView.objects.filter(timestamp__range=[start_date, end_date])
            completed_orders = Reservation.objects.filter(status='COMPLETED', reservation_date_end__range=[start_date, end_date])
            reservations = Reservation.objects.filter(reservation_date__range=[start_date, end_date])
        else:
            page_views = PageView.objects.all()
            completed_orders = Reservation.objects.filter(status='COMPLETED')
            reservations = Reservation.objects.all()

        users = User.objects.filter(username=username) if username else User.objects.all()
        products = Product.objects.all()

        # Serialize data
        page_view_data = PageViewSerializer(page_views, many=True).data
        completed_order_data = ReservationSerializer(completed_orders, many=True).data
        reservation_data = ReservationSerializer(reservations, many=True).data
        user_data = UserSerializer(users, many=True).data

        # Convert serialized data to DataFrames
        page_view_df = pd.DataFrame(page_view_data)
        completed_order_df = pd.DataFrame(completed_order_data)
        reservation_df = pd.DataFrame(reservation_data)
        product_df = pd.DataFrame(list(products.values()))
        user_df = pd.DataFrame(user_data)

        # Ensure timezone-unaware datetimes
        for df in [page_view_df, completed_order_df, reservation_df, product_df, user_df]:
            for col in df.select_dtypes(include=['datetime64[ns, UTC]', 'datetime64[ns]']).columns:
                df[col] = df[col].dt.tz_localize(None)

        # Calculate most reserved products statistics
        now = timezone.now()
        period = request.query_params.get('period', 'all')

        if period == 'daily':
            most_reserved = Product.objects.annotate(total_reserved=Sum('reserved')).order_by('-total_reserved')[:5]
        elif period == 'weekly':
            most_reserved = Product.objects.annotate(total_reserved=Sum('reserved')).order_by('-total_reserved')[:5]
        elif period == 'monthly':
            most_reserved = Product.objects.annotate(total_reserved=Sum('reserved')).order_by('-total_reserved')[:5]
        elif period == 'annually':
            most_reserved = Product.objects.annotate(total_reserved=Sum('reserved')).order_by('-total_reserved')[:5]
        else:
            most_reserved_daily = Product.objects.annotate(total_reserved=Sum('reserved')).order_by('-total_reserved')[:5]
            most_reserved_weekly = Product.objects.annotate(total_reserved=Sum('reserved')).order_by('-total_reserved')[:5]
            most_reserved_monthly = Product.objects.annotate(total_reserved=Sum('reserved')).order_by('-total_reserved')[:5]
            most_reserved_annually = Product.objects.annotate(total_reserved=Sum('reserved')).order_by('-total_reserved')[:5]

        # Convert these stats to DataFrames
        if period == 'all':
            most_reserved_df_daily = pd.DataFrame(list(most_reserved_daily.values('name')))
            most_reserved_df_weekly = pd.DataFrame(list(most_reserved_weekly.values('name')))
            most_reserved_df_monthly = pd.DataFrame(list(most_reserved_monthly.values('name')))
            most_reserved_df_annually = pd.DataFrame(list(most_reserved_annually.values('name')))
        else:
            most_reserved_df = pd.DataFrame(list(most_reserved.values('name')))

        # Add stats to `product_df`
        if period == 'all':
            product_df['Most Reserved Daily'] = [most_reserved_df_daily['name'].tolist() if not most_reserved_df_daily.empty else None] * len(product_df)
            product_df['Most Reserved Weekly'] = [most_reserved_df_weekly['name'].tolist() if not most_reserved_df_weekly.empty else None] * len(product_df)
            product_df['Most Reserved Monthly'] = [most_reserved_df_monthly['name'].tolist() if not most_reserved_df_monthly.empty else None] * len(product_df)
            product_df['Most Reserved Annually'] = [most_reserved_df_annually['name'].tolist() if not most_reserved_df_annually.empty else None] * len(product_df)
        else:
            product_df['Most Reserved'] = [most_reserved_df['name'].tolist() if not most_reserved_df.empty else None] * len(product_df)

        # Create an Excel writer and add DataFrames to different sheets
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            page_view_df.to_excel(writer, sheet_name='PageViews', index=False)
            completed_order_df.to_excel(writer, sheet_name='CompletedOrders', index=False)
            reservation_df.to_excel(writer, sheet_name='Reservations', index=False)
            product_df.to_excel(writer, sheet_name='Products', index=False)
            user_df.to_excel(writer, sheet_name='Users', index=False)

        output.seek(0)

        response = HttpResponse(output, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename=data.xlsx'

        return response












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
    

class RecordPageView(APIView):

    def get(self, request):
        url = request.path
        user_ip = request.META.get('REMOTE_ADDR')
        timestamp = timezone.now()

        # Create a new PageView entry
        PageView.objects.create(url=url, user_ip=user_ip, timestamp=timestamp)

        return Response({"message": "Page view recorded"})

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
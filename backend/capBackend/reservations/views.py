from tokenize import TokenError
import uuid
from django.utils import timezone
import logging
from rest_framework import generics, status
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ClassSchedule, Reservation
from .serializers import ClassScheduleSerializer, ReservationItemSerializer, ReservationSerializer, NotificationSerializer, CartSerializer
# from .serializers import AddToCartSerializer
from auth_app.models import User
from products.models import Product
from reservations.models import Cart, ReservationItem, Notification
from rest_framework.permissions import IsAuthenticated
import traceback
from .models import Reservation, ReservationItem
from rest_framework.response import Response
from rest_framework import status
from .models import Notification, Reservation
from django.db import transaction
import pytz
import jwt
from django.conf import settings
logger = logging.getLogger(__name__)
from django.http import JsonResponse
from django.utils.dateparse import parse_datetime
import datetime
import re
import pandas as pd
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
import io
from rest_framework.parsers import MultiPartParser
from datetime import datetime
from django.core.mail import send_mail
import json
from django.utils.timezone import now, timedelta
# pangview ng total reservations


class ReservationImportExportView(APIView):
    def get(self, request):
        # Extract the username and reserved_date from query parameters
        username = request.query_params.get('username', None)
        date_str = request.query_params.get('reserved_date', None)  # Date in YYYY-MM-DD or YYYY-MM format from frontend

        print(f"Received username: {username}")
        print(f"Received reserved_date: {date_str}")

        # Fetch reservations based on username, or fetch all reservations if username is not provided
        reservations = Reservation.objects.all()

        if username:
            reservations = reservations.filter(user__username=username)
        
        # Filter by reserved_date if provided
        if date_str:
            try:
                if len(date_str) == 7:  # 'YYYY-MM' format
                    year, month = map(int, date_str.split('-'))
                    start_date = datetime(year, month, 1)
                    # Use 'last day of month' trick to get the end date
                    end_date = datetime(year, month + 1, 1) if month < 12 else datetime(year + 1, 1, 1)
                    print(f"Filtering by month: Start Date: {start_date}, End Date: {end_date}")
                    reservations = reservations.filter(reserved_date__range=[start_date, end_date])
                else:
                    reserved_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                    print(f"Filtering by exact date: {reserved_date}")
                    reservations = reservations.filter(reserved_date__date=reserved_date)
            except ValueError as e:
                print(f"Date format error: {e}")
                return Response({'error': 'Invalid date format, should be YYYY-MM-DD or YYYY-MM'}, status=400)

        # Serialize the reservations data
        serializer = ReservationSerializer(reservations, many=True)
        data = serializer.data

        # Add simplified reservation items to the serialized data
        for reservation in data:
            reservation_items = ReservationItem.objects.filter(reservation__reservation_id=reservation['reservation_id'])
            # Simplify items to just product ID and quantity
            simplified_items = [{"product_id": item.product.productId, "quantity": item.quantity} for item in reservation_items]
            reservation['items'] = simplified_items

        print(f"Serialized data: {data}")

        # Convert data to DataFrame
        df = pd.DataFrame(data)

        # Create an in-memory output file for the HTTP response
        output = io.BytesIO()
        df.to_excel(output, index=False, engine='openpyxl')
        output.seek(0)

        # Create the HTTP response with the Excel file
        response = HttpResponse(output, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="reservations_{username if username else "all"}.xlsx"'

        return response

    def post(self, request):
        # Check if a file is uploaded
        if 'file' not in request.FILES:
            return JsonResponse({'error': 'No file uploaded'}, status=400)

        # Load the uploaded file into a DataFrame
        file = request.FILES['file']
        df = pd.read_excel(file)

        # Iterate through the DataFrame and create reservations
        for _, row in df.iterrows():
            user = User.objects.filter(username=row['user']).first()
            if user:
                # Fetch the ClassSchedule instance based on the value in the DataFrame
                user_class_section = ClassSchedule.objects.filter(class_section=row['user_class_section']).first()

                reservation_data = {
                    'user': user,
                    'user_class_section': user_class_section,
                    'reservation_id': row['reservation_id'],
                    'reserved_date': row.get('reserved_date', timezone.now()),  # Use current time if not provided
                    'reservation_day': row['reservation_day'],
                    'reservation_date': row['reservation_date'],
                    'reservation_date_end': row['reservation_date_end'],
                    'reservation_purpose': row['reservation_purpose'],
                    'status': row['status'],
                    'is_group': row.get('is_group', False),  # Default to False if not provided
                    'group_members': row.get('group_members', []),  # Default to empty list if not provided
                    'subject': row.get('subject', None)  # Default to None if not provided
                }
                reservation, created = Reservation.objects.update_or_create(
                    reservation_id=row['reservation_id'], defaults=reservation_data)

                # Handle reservation items (check if 'items' column exists)
                items_data = row.get('items', '[]')  # Get the 'items' field or default to an empty list as a string
                print(f"Raw Items data: {items_data}")

                # Check if items_data is a string and try to convert it to a list
                if isinstance(items_data, str):
                    try:
                        # Replace single quotes with double quotes to convert to valid JSON format
                        items_data = items_data.replace("'", '"')
                        items_data = json.loads(items_data)
                    except json.JSONDecodeError:
                        return JsonResponse({
                            'error': 'Invalid items JSON format',
                            'raw_items_data': items_data,  # Include the raw data in the response for debugging
                        }, status=400)

                print(f"Parsed Items data: {items_data}")

                # Ensure items_data is a list after parsing
                if isinstance(items_data, list):
                    for item in items_data:
                        # Check if product_id is available
                        product_id = item.get('product_id')
                        if not product_id and 'product' in item:
                            product_data = item.get('product')
                            product_id = product_data.get('productId')  # Get productId from the nested 'product' dict

                        # Fetch the product based on productId
                        product = Product.objects.filter(productId=product_id).first()

                        if product:
                            ReservationItem.objects.update_or_create(
                                reservation=reservation,
                                product=product,
                                defaults={'quantity': item.get('quantity', 1)}  # Default quantity to 1 if not provided
                            )
                        else:
                            # Handle case where product does not exist
                            return JsonResponse({'error': f"Product with ID {product_id} not found"}, status=400)
                else:
                    # Handle the case when 'items' is not a list or not present
                    return JsonResponse({'error': 'Invalid items data'}, status=400)

        return JsonResponse({'message': 'Reservations imported successfully'})

class ReservationCartAPIView(APIView):
    # permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get the username from the request
            username = request.query_params.get('username')

            # Get the user object
            user = get_object_or_404(User, username=username)

            # Get all items in the cart for the user
            cart_items = Cart.objects.filter(user_id=user)

            # Serialize the cart items
            cart_items_data = CartSerializer(cart_items, many=True).data

            return Response({
                'cart_items': cart_items_data,
                'message': 'Cart items retrieved successfully'
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({
                'message': f'An error occurred: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            # Get the data from the request
            username = request.data.get('username')
            product_ids = request.data.get('productId')
            quantities = request.data.get('quantity')

            # Check if product_ids and quantities are not None
            if product_ids is None or quantities is None:
                return Response({
                    'message': 'Product IDs or quantities are missing'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Convert to lists if they are not already lists
            if not isinstance(product_ids, list):
                product_ids = [product_ids]
            if not isinstance(quantities, list):
                quantities = [quantities]

            # Validate that the lengths of product_ids and quantities match
            if len(product_ids) != len(quantities):
                return Response({
                    'message': 'Mismatch between product IDs and quantities'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get the user object
            user = get_object_or_404(User, username=username)

            # Iterate through product IDs and quantities to add each product to the cart
            for i in range(len(product_ids)):
                product_id = product_ids[i]
                quantity = quantities[i]

                # Check if the quantity requested is available
                product = get_object_or_404(Product, productId=product_id)
                if quantity > product.quantity:
                    return Response({
                        'message': f'Not enough stock available for product {product_id}'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Check if the product is already in the cart
                cart_item = Cart.objects.filter(user=user, product=product).first()
                if cart_item:
                    # Check if the total quantity in the cart exceeds the available stock
                    if cart_item.quantity + quantity > product.quantity:
                        return Response({
                            'message': f'Adding {quantity} of product {product_id} exceeds available stock'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    else:
                        # Update the quantity in the cart
                        cart_item.quantity += quantity
                        cart_item.save()
                else:
                    # Add the product to the cart
                    Cart.objects.create(user=user, product=product, quantity=quantity)

            return Response({
                'message': 'Products added to cart successfully'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'message': f'An error occurred: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        try:
            # Get the data from the request
            username = request.data.get('username')
            product_ids = request.data.get('productIds')

            # Get the user object
            user = get_object_or_404(User, username=username)

            # Check if product_ids is not None
            if product_ids is None:
                return Response({
                    'message': 'Product IDs are missing'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Convert to list if it is not already a list
            if not isinstance(product_ids, list):
                product_ids = [product_ids]

            # Get the cart items to delete
            cart_items = Cart.objects.filter(user=user, product__productId__in=product_ids)

            # Delete the cart items
            cart_items.delete()

            return Response({
                'message': 'Products removed from cart successfully'
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)

        except Cart.DoesNotExist:
            return Response({
                'message': 'Cart items not found'
            }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({
                'message': f'An error occurred: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        try:
            # Get the data from the request
            username = request.data.get('username')
            product_ids = request.data.get('productIds')
            quantities = request.data.get('quantities')

            # Check if product_ids and quantities are not None
            if product_ids is None or quantities is None:
                return Response({
                    'message': 'Product IDs or quantities are missing'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Convert to lists if they are not already lists
            if not isinstance(product_ids, list):
                product_ids = [product_ids]
            if not isinstance(quantities, list):
                quantities = [quantities]

            # Validate that the lengths of product_ids and quantities match
            if len(product_ids) != len(quantities):
                return Response({
                    'message': 'Mismatch between product IDs and quantities'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get the user object
            user = get_object_or_404(User, username=username)

            # Iterate through product IDs and quantities to update each product in the cart
            for i in range(len(product_ids)):
                product_id = product_ids[i]
                quantity = quantities[i]

                # Check if the quantity requested is available
                product = get_object_or_404(Product, productId=product_id)
                if quantity > product.quantity:
                    return Response({
                        'message': f'Not enough stock available for product {product_id}'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Update the quantity in the cart
                cart_item = get_object_or_404(Cart, user=user, product=product)
                cart_item.quantity = quantity
                cart_item.save()

            return Response({
                'message': 'Cart updated successfully'
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)

        except Product.DoesNotExist:
            return Response({
                'message': 'Product not found'
            }, status=status.HTTP_404_NOT_FOUND)

        except Cart.DoesNotExist:
            return Response({
                'message': 'Cart item not found'
            }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({
                'message': f'An error occurred: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class ClassScheduleCRUDAPIView(APIView):
    # permission_classes = [IsAuthenticated]

    def get(self, request):
        class_section = request.query_params.get('class_section')
        print(f"Class section: {class_section}")
        if class_section:
            class_schedules = ClassSchedule.objects.filter(class_section__icontains=class_section)
        else:
            class_schedules = ClassSchedule.objects.all()
        
        serializer = ClassScheduleSerializer(class_schedules, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data
        serializer = ClassScheduleSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        class_section = request.data.get('class_section')

        # Ensure class_section is provided
        if not class_section:
            return Response({'message': 'class_section is required'}, status=status.HTTP_400_BAD_REQUEST)

        class_schedule = get_object_or_404(ClassSchedule, class_section=class_section)
        serializer = ClassScheduleSerializer(class_schedule, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        class_section = request.data.get('class_section')
        class_days = request.data.get('class_days')

        if not class_section:
            return Response({'message': 'class_section is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch the class schedule based on class_section
        class_schedule = get_object_or_404(ClassSchedule, class_section=class_section)

        if not class_days:
            # Delete the entire class section if no class days are provided
            class_schedule.delete()
            return Response({'message': 'Class section deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

        # Update class_days to remove the specific time entry
        for day, times in class_days.items():
            if day in class_schedule.class_days:
                class_schedule.class_days[day] = [
                    time for time in class_schedule.class_days[day]
                    if time not in times
                ]
                if not class_schedule.class_days[day]:
                    del class_schedule.class_days[day]

        # Save the updated class schedule
        class_schedule.save()

        return Response({'message': 'Class schedule updated successfully'}, status=status.HTTP_204_NO_CONTENT)   

        





class showNotification(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        token = request.COOKIES.get('jwt_access_token')
        if not token:
            return JsonResponse({'error': 'Authentication required'}, status=401)

        try:
            decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            username = decoded_token.get('username')
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({'error': 'Invalid token'}, status=401)

        # Get the count of unread notifications
        unread_count = Notification.objects.filter(user__username=username, read=0).count()
        
        # Get the latest 5 notifications for the user
        notifications = Notification.objects.filter(user__username=username).order_by('-timestamp')
        
        # Serialize notifications data
        notification_data = []
        for notification in notifications:
            message = notification.message
           
            # Extract the part after 'by'
            match = re.search(r'by\s(\w+)', message)
            if match:
                user_id = match.group(1)
                try:
                    user = User.objects.get(username=user_id)
                    full_name = f"{user.first_name} {user.last_name}"
                except User.DoesNotExist:
                    full_name = "User not found"
            else:
                full_name = "N/A"

            # Serialize the notification data
            notification_dict = NotificationSerializer(notification).data
            notification_dict['full_name'] = full_name
            notification_data.append(notification_dict)

        # Return the notifications and unread count separately
        return Response({
            'notifications': notification_data,
            'unread_count': unread_count
        }, status=status.HTTP_200_OK)


class readNotification(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        token = request.COOKIES.get('jwt_access_token')
        if not token:
            return JsonResponse({'error': 'Authentication required'}, status=401)

        try:
            decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            username = decoded_token.get('username')
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({'error': 'Invalid token'}, status=401)

        notification_id = request.data.get('id')
        if not notification_id:
            return JsonResponse({'error': 'Notification ID required'}, status=400)

        notification = get_object_or_404(Notification, id=notification_id)
        notification.read = True
        notification.save()

        return JsonResponse({'message': 'Notification read successfully'}, status=200)



logger = logging.getLogger(__name__)

# pang create ng reservation for checkout as user / update ng chineckout as user
class ReservationCreateUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            token = request.COOKIES.get('jwt_access_token')
            if not token:
                print("Authentication required: No token provided")
                return Response({
                    'message': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)

            try:
                decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                username = decoded_token.get('username')
                user_role = decoded_token.get('role')
                print(f"Token decoded successfully for username: {username}, role: {user_role}")
            except jwt.ExpiredSignatureError:
                print(f"Token expired for username: {username}")
                return Response({
                    'message': 'Token expired'
                }, status=status.HTTP_401_UNAUTHORIZED)
            except jwt.InvalidTokenError:
                print("Invalid token")
                return Response({
                    'message': 'Invalid token'
                }, status=status.HTTP_401_UNAUTHORIZED)

            #region
            product_ids = request.data.get('productIds')
            quantities = request.data.get('quantities')
            reservation_date = request.data.get('reservation_date')
            reservation_date_end = request.data.get('reservation_date_end')
            reservation_purpose = request.data.get('reservation_purpose')
            reservation_status = request.data.get('status')
            reservation_id = request.data.get('reservationId')
            is_group = request.data.get('is_group', False)
            group_members = request.data.get('group_members', [])
            subject = request.data.get('subject', None)
            reservation_day = request.data.get('reservation_day', None)
            reserved_date = request.data.get('reserved_date', None)
            user_class_section = request.data.get('user_class_section', None)
            #endregion

            print(f"Reservation data received: Product IDs: {product_ids}, Quantities: {quantities}, Group members: {group_members}")

            # Ensure group_members is a list
            if not isinstance(group_members, list):
                group_members = [group_members]

            philippines_tz = pytz.timezone('Asia/Manila')

            # pangupdate ng reservation as user
            if reservation_id:
                print(f"Updating reservation: {reservation_id}")
                reservation = get_object_or_404(Reservation, reservation_id=reservation_id)
                if reservation_status:
                    reservation.status = reservation_status
                    # start ng reservation time
                if reservation_date:
                    reservation.reservation_date = reservation_date
                    # end ng reservation time
                if reservation_date_end:
                    reservation.reservation_date_end = reservation_date_end
                if reservation_day:
                    reservation.reservation_day = reservation_day
                if reserved_date:
                    reservation.reserved_date = reserved_date

                reservation.save()

                if product_ids and quantities:
                    if len(product_ids) != len(quantities):
                        print("Product IDs and quantities length mismatch")
                        return Response({
                            'message': 'Product IDs and quantities must have the same length'
                        }, status=status.HTTP_400_BAD_REQUEST)

                    for product_id, quantity in zip(product_ids, quantities):
                        product = get_object_or_404(Product, productId=product_id)
                        if product.quantity < quantity:
                            print(f"Not enough stock for product: {product_id}")
                            return Response({
                                'message': f'Not enough stock for product: {product_id}'
                            }, status=status.HTTP_400_BAD_REQUEST)

                        try:
                            reservation_item = ReservationItem.objects.get(reservation=reservation, product=product)
                            original_quantity = reservation_item.quantity

                            reservation_item.quantity = quantity
                            reservation_item.save()

                            quantity_difference = quantity - original_quantity
                            product.quantity += quantity_difference
                            product.reserved += quantity_difference
                            product.save()

                        except ReservationItem.DoesNotExist:
                            print(f"Reservation item not found for product: {product_id}")
                            return Response({
                                'message': 'Product not found in reservation'
                            }, status=status.HTTP_404_NOT_FOUND)

                user = get_object_or_404(User, username=username)

                notification_message = f'Your reservation {reservation_id} has been updated.'  # Default message
                status_messages = {
                    "APPROVED": 'approved successfully and is awaiting your pickup.',
                    "REJECTED": 'has been rejected.',
                    "CANCELLED": 'has been cancelled.',
                    "COMPLETED": 'has been completed.',
                    "AWAITING RETURN": 'is awaiting return.',
                    "DAMAGED/LOST/PARTIALLY_COMPLETED": 'has been marked as damaged/lost/partially completed.',
                    "AWAITING PAYMENT": 'is awaiting payment.',
                    "RESOLVED": 'has been resolved.',
                }
                notification_message = f'Your reservation {reservation_id} has been {status_messages.get(reservation_status, "updated.")}'

                print(f"Notification message: {notification_message}")

                # Add notification to the model for the user
                user_notification = Notification.objects.create(
                    user=user,
                    message=notification_message,
                    read=0,
                )
                print(f"Notification updated for user {username} with ID {user_notification.id}")

                # Create notifications for all admins
                admin_users = User.objects.filter(role='admin')
                print(f"Number of admins found: {admin_users.count()}")
                for admin in admin_users:
                    admin_notification = Notification.objects.create(
                        user=admin,
                        message=f'New reservation {reservation_id} updated by {username}.',
                        read=0,
                    )
                    print(f"Notification updated for admin {admin.username} with ID {admin_notification.id}")

                print(f"Reservation updated successfully: {reservation_id}")
                return Response({
                    'message': 'Reservation updated successfully'
                }, status=status.HTTP_200_OK)

            else:
                if not quantities:
                    quantities = []
                    user = get_object_or_404(User, username=username)
                    print(f"Fetching cart items for user: {username}")
                    for product_id in product_ids:
                        try:
                            cart_item = Cart.objects.get(user=user, product__productId=product_id)
                            quantities.append(cart_item.quantity)
                        except Cart.DoesNotExist:
                            print(f"Cart item not found for product ID: {product_id} for user: {username}")
                            return Response({
                                'message': f'Cart item not found for product ID: {product_id} for user: {username}'
                            }, status=status.HTTP_404_NOT_FOUND)

                if not product_ids or not quantities:
                    print("Product IDs or quantities not provided")
                    return Response({
                        'message': 'Product IDs and quantities must be provided'
                    }, status=status.HTTP_400_BAD_REQUEST)

                if len(product_ids) != len(quantities):
                    print("Product IDs and quantities length mismatch")
                    return Response({
                        'message': 'Product IDs and quantities must have the same length'
                    }, status=status.HTTP_400_BAD_REQUEST)

                with transaction.atomic():
                    user = get_object_or_404(User, username=username)
                    reservation_id = f'{username}_{timezone.now().strftime("%m-%d-%Y-%H")}_{uuid.uuid4().hex[:8]}'

                    print(f"Creating reservation with ID: {reservation_id} for user: {username}")

                    # Check stock availability before creating the reservation
                    for product_id, quantity in zip(product_ids, quantities):
                        product = get_object_or_404(Product, productId=product_id)

                        # Lock the product row to prevent race conditions
                        product = Product.objects.select_for_update().get(productId=product_id)

                        if product.quantity < quantity:
                            print(f"Not enough stock for product: {product_id}")
                            transaction.set_rollback(True)
                            return Response({
                                'message': f'Not enough stock for product: {product_id}'
                            }, status=status.HTTP_400_BAD_REQUEST)

                    # Create the reservation after stock check
                    # In ReservationCreateUpdateAPIView
                    reservation = Reservation(
                        user=user,
                        user_class_section=user_class_section,
                        reserved_date=reserved_date,
                        reservation_id=reservation_id,
                        reservation_date=reservation_date,
                        reservation_date_end=reservation_date_end,
                        reservation_purpose=reservation_purpose,
                        is_group=is_group,
                        group_members=group_members,
                        subject=subject,
                        status=reservation_status or 'PENDING',
                        reservation_day=reservation_day,
                        same_day_reservation=request.data.get('same_day_reservation', False)  # Add this line
                    )
                    reservation.save()

                    for product_id, quantity in zip(product_ids, quantities):
                        product = get_object_or_404(Product, productId=product_id)

                        try:
                            cart_item = Cart.objects.get(user=user, product=product)

                            reservation_item = ReservationItem(
                                reservation=reservation,
                                product=product,
                                quantity=quantity
                            )
                            reservation_item.save()

                            # Decrease the product quantity on successful reservation creation
                            product.quantity -= quantity
                            product.save()
                            cart_item.delete()

                        except Cart.DoesNotExist:
                            print(f"Cart item not found for product ID: {product_id} for user: {username}")
                            logger.error(f'Cart item not found for product ID: {product_id} for user: {username}')
                            transaction.set_rollback(True)
                            return Response({
                                'message': f'Product {product_id} not found in cart'
                            }, status=status.HTTP_404_NOT_FOUND)

                    notification_message = f'Your reservation {reservation_id} has been created successfully and is waiting for approval.'
                    # Add notification to the model for the user
                    user_notification = Notification.objects.create(
                        user=user,
                        message=notification_message,
                        read=0,
                    )
                    print(f"Notification created for user {username} with ID {user_notification.id}")

                    # Create notifications for all admins
                    admin_users = User.objects.filter(role='admin')
                    print(f"Number of admins found: {admin_users.count()}")
                    for admin in admin_users:
                        admin_notification = Notification.objects.create(
                            user=admin,
                            message=f'New reservation {reservation_id} created by {username}.',
                            read=0,
                        )
                        print(f"Notification created for admin {admin.username} with ID {admin_notification.id}")

            print(f"Reservation created successfully with ID: {reservation_id}")
            return Response({
                'message': 'Reservation created successfully',
                'reservation_id': reservation_id,
                'product_ids': product_ids,
            }, status=status.HTTP_201_CREATED)

        except User.DoesNotExist:
            print(f"User not found: {username}")
            return Response({
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)

        except Product.DoesNotExist:
            print("Product not found")
            return Response({
                'message': 'Product not found'
            }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            print(f"Error handling reservation: {str(e)}")
            logger.error(f'Error handling reservation: {e}')
            return Response({
                'message': 'An error occurred',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

#updating the reservations as admin
class AdminUpdateReservationStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("Raw request data:", request.data)
        try:
            token = request.COOKIES.get('jwt_access_token')
            if not token:
                return Response({
                    'message': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            try:
                decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                role = decoded_token.get('role')
                usernameAdmin = decoded_token.get('username')

                if role != 'admin':
                    return Response({
                        'message': 'Unauthorized access'
                    }, status=status.HTTP_403_FORBIDDEN)
            except jwt.ExpiredSignatureError:
                return Response({
                    'message': 'Token expired'
                }, status=status.HTTP_401_UNAUTHORIZED)
            except jwt.InvalidTokenError:
                return Response({
                    'message': 'Invalid token'
                }, status=status.HTTP_401_UNAUTHORIZED)

            username = request.data.get('username')
            reservation_id = request.data.get('reservationId')
            reservation_status = request.data.get('status')
            reservation_purpose = request.data.get('reservation_purpose')
            product_ids = request.data.get('productIds')
            quantities = request.data.get('quantities')
            reservation_day = request.data.get('reservation_day')
            reservation_date = request.data.get('reservation_date')
            reservation_date_end = request.data.get('reservation_date_end')
            is_group = request.data.get('is_group', False)
            group_members = request.data.get('group_members', [])
            reserved_date = request.data.get('reserved_date', None)
            user_class_section = request.data.get('user_class_section', None)
            remarks = request.data.get('remarks', None)

            print(f"Reservation data received: Product IDs: {product_ids}, Quantities: {quantities}")

            if not isinstance(group_members, list):
                group_members = [group_members]

            if reservation_id:

                # Ensure group_members is a list

                reservation = get_object_or_404(Reservation, reservation_id=reservation_id)
                notification_message = ""

                if reservation_status:
                    reservation.status = reservation_status
                    notification_message = f'Your reservation`s status for {reservation_id} has been updated by {usernameAdmin}.'
                
                if reservation_purpose:
                    reservation.reservation_purpose = reservation_purpose
                    notification_message = f'Your reservation`s purpose for {reservation_id} has been updated by {usernameAdmin}.'
                
                if reservation_day or reservation_date or reservation_date_end:
                    if reservation_day is not None:
                        reservation.reservation_day = reservation_day
                    if reservation_date is not None:
                        reservation.reservation_date = reservation_date
                    if reservation_date_end is not None:
                        reservation.reservation_date_end = reservation_date_end
                    notification_message = f'Your reservation`s schedule for {reservation_id} has been updated by {usernameAdmin}.'
                        
                if reserved_date is not None:
                    reservation.reserved_date = reserved_date
                    print(f"Reserved date updated to: {reserved_date}")
                    
                    notification_message = f'Your reservation`s schedule for {reservation_id} has been updated by {usernameAdmin}.'

                if is_group:
                    reservation.is_group = is_group
                    

                if group_members:
                    reservation.group_members = group_members
                
                if user_class_section:
                    reservation.user_class_section = user_class_section
                
                if remarks:
                    reservation.remarks = remarks
                    notification_message = f'Your reservation`s remarks for {reservation_id} has been updated by {usernameAdmin}.'

                reservation.save()

                if product_ids and quantities:
                    if len(product_ids) != len(quantities):
                        return Response({
                            'message': 'Product IDs and quantities must have the same length'
                        }, status=status.HTTP_400_BAD_REQUEST)

                    for product_id, quantity in zip(product_ids, quantities):
                        product = get_object_or_404(Product, productId=product_id)
                        try:
                            reservation_item = ReservationItem.objects.get(reservation=reservation, product=product)
                            
                            # Check if the quantity exceeds the available stock
                            if quantity > product.quantity:
                                return Response({
                                    'message': f'Not enough stock available for product {product_id}'
                                }, status=status.HTTP_400_BAD_REQUEST)
                            
                            reservation_item.quantity = quantity
                            reservation_item.save()

                            # Update product quantities based on status
                            if reservation_status == "DAMAGED/LOST/PARTIALLY_COMPLETED":
                                product.quantity -= quantity
                                product.broken_damaged += quantity
                            elif reservation_status == "APPROVED":
                                product.quantity -= quantity
                                product.reserved += quantity
                            elif reservation_status == "RESOLVED":
                                product.quantity += quantity
                                product.reserved -= quantity
                            elif reservation_status == "CANCELLED":
                                product.reserved -= quantity
                            elif reservation_status == "COMPLETED":
                                product.reserved -= quantity
                                product.quantity += quantity

                            product.save()

                        except ReservationItem.DoesNotExist:
                            return Response({
                                'message': f'Product not found in reservation: {product_id}'
                            }, status=status.HTTP_404_NOT_FOUND)

                user = get_object_or_404(User, username=username)

            if reservation_status:
                if reservation_status == "APPROVED":
                    notification_message = f'Your reservation {reservation_id} has been approved successfully and is awaiting your pickup by {usernameAdmin}.'
                elif reservation_status == "REJECTED":
                    notification_message = f'Your reservation {reservation_id} has been rejected by {usernameAdmin}.'
                elif reservation_status == "CANCELLED":
                    notification_message = f'Your reservation {reservation_id} has been cancelled by {usernameAdmin}.'
                elif reservation_status == "COMPLETED":
                    notification_message = f'Your reservation {reservation_id} has been completed by {usernameAdmin}.'
                elif reservation_status == "AWAITING RETURN":
                    notification_message = f'Your reservation {reservation_id} is awaiting return by {usernameAdmin}.'
                elif reservation_status == "DAMAGED/LOST/PARTIALLY_COMPLETED":
                    notification_message = f'Your reservation {reservation_id} has been marked as damaged/lost/partially completed by {usernameAdmin}.'
                elif reservation_status == "AWAITING PAYMENT":
                    notification_message = f'Your reservation {reservation_id} is awaiting payment by {usernameAdmin}.'
                elif reservation_status == "RESOLVED":
                    notification_message = f'Your reservation {reservation_id} has been resolved and approved by {usernameAdmin}.'
                else:
                    notification_message = f'Your reservation {reservation_id} has been updated by {usernameAdmin}.'

                # Add notification to the model for the user
                user_notification = Notification.objects.create(
                    user=user,
                    message=notification_message,
                    read=0,
                )

                # Create notifications for all admins
                admin_users = User.objects.filter(role='admin')
                for admin in admin_users:
                    Notification.objects.create(
                        user=admin,
                        message=f'Reservation {reservation_id} updated by {usernameAdmin}.',
                        read=0,
                    )

            # After all updates and notifications, send a single email to the user
            user_email = user.email
            subject = f"Reservation {reservation_id} Status Update"
            email_message = f"Dear {user.first_name},\n\n{notification_message}\n\nThank you."

            send_mail(
                subject,
                email_message,
                settings.DEFAULT_FROM_EMAIL,
                [user_email],
                fail_silently=False,
            )

            return Response({
                'admin': usernameAdmin,
                'message': 'Reservation updated successfully'
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Product.DoesNotExist:
            return Response({
                'message': 'Product not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'message': 'An error occurred',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

#pangshow ng lahat ng reservations for admin table
class AdminReservationDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        token = request.COOKIES.get('jwt_access_token')
        if not token:
            return Response({
                'message': 'Authentication required: No token provided'
            }, status=status.HTTP_401_UNAUTHORIZED)

        try:
            # Decode and verify the token
            decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            role = decoded_token.get('role')

            if role != 'admin':
                return Response({
                    'message': 'Unauthorized access'
                }, status=status.HTTP_403_FORBIDDEN)

            # Fetch all reservations
            reservations = Reservation.objects.all()
            if not reservations.exists():
                return Response({
                    'message': 'No reservations available'
                })

            # Combine reservation data with corresponding reservation items
            combined_data = []
            for reservation in reservations:
                reservation_data = ReservationSerializer(reservation).data
                
                # Add user email
                reservation_data['user_email'] = reservation.user.email

                # Fetch and serialize reservation items
                reserved_items = ReservationItem.objects.filter(reservation=reservation)
                reserved_items_data = ReservationItemSerializer(reserved_items, many=True).data

                # Combine reservation and items in a single dictionary
                reservation_data['items'] = reserved_items_data
                combined_data.append(reservation_data)

            return Response({
                'reservations': combined_data,
                'message': 'Reservations retrieved successfully'
            }, status=status.HTTP_200_OK)

        except jwt.ExpiredSignatureError:
            # Token is expired, return 401 to trigger refresh in the frontend
            return Response({
                'message': 'Token has expired'
            }, status=status.HTTP_401_UNAUTHORIZED)

        except (jwt.InvalidTokenError, TokenError, InvalidToken) as e:
            # Token is invalid, return 401
            return Response({
                'message': 'Invalid token',
                'error': str(e)
            }, status=status.HTTP_401_UNAUTHORIZED)

        except Exception as e:
            return Response({
                'message': 'An error occurred',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)        

# pang view ng reservation as user
class ReservationDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        token = request.COOKIES.get('jwt_access_token')
        if not token:
            print("Authentication required: No token provided")
            return Response({
                'message': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)

        try:
            decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            username = decoded_token.get('username')
            user_role = decoded_token.get('role')
            print(f"Token decoded successfully for username: {username}, role: {user_role}")
        except jwt.ExpiredSignatureError:
            print(f"Token expired for username: {username}")
            return Response({
                'message': 'Token expired'
            }, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            print("Invalid token")
            return Response({
                'message': 'Invalid token'
            }, status=status.HTTP_401_UNAUTHORIZED)

        try:
            if username:
                # Fetch all reservations for the given username
                reservations = Reservation.objects.filter(user__username=username)
                
                if not reservations:
                    return Response({
                        'message': 'No reservations available'
                    }, status=status.HTTP_404_NOT_FOUND)

                # Prepare combined data
                combined_data = []
                for reservation in reservations:
                    # Serialize reservation
                    reservation_data = ReservationSerializer(reservation).data
                    
                    # Fetch and serialize reservation items
                    reserved_items = ReservationItem.objects.filter(reservation=reservation)
                    reserved_items_data = ReservationItemSerializer(reserved_items, many=True).data
                    
                    # Add items to reservation data
                    reservation_data['items'] = reserved_items_data
                    
                    combined_data.append(reservation_data)

                return Response({
                    'reservations': combined_data,
                    'message': 'Reservations retrieved successfully'
                }, status=status.HTTP_200_OK)

            else:
                return Response({
                    'message': 'Username parameter is required'
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'message': 'An error occurred',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)



# pang delete o cancel ng reservation     
class ReservationDeleteView(APIView):   
    def delete(self, request):
        try:
            reservation_id = request.data.get('reservationId')
            reservation = Reservation.objects.get( reservation_id=reservation_id)
            reservation.delete()

            # Notification code...
            user = reservation.user
            notification_message = f'Your reservation {reservation_id} has been cancelled.'
            user_notification = Notification.objects.create(
                user=user,
                message=notification_message,
                read=0,
            )

            # Create notifications for all admins
            admin_users = User.objects.filter(role='admin')
            for admin in admin_users:
                admin_notification = Notification.objects.create(
                    user=admin,
                    message=f'Reservation {reservation_id} cancelled by {user.username}.',
                    read=0,
                )

            




            return Response({
                'message': 'Reservation deleted successfully'
            }, status=200)
        except Reservation.DoesNotExist:
            return Response({
                'message': 'Reservation not found'
            }, status=404)
        except:
            return Response({
                'message': 'An error occurred'
            }, status=400)


class ReservationSearchView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            searchWord = request.data.get('searchWord')
            
            if not searchWord:
                return Response({
                    'message': 'No search word provided'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Search by username prefix in reservation_id
            filtered_reservations = Reservation.objects.filter(reservation_id__startswith=searchWord, user__username=searchWord)
            
            if filtered_reservations.exists():
                return Response({
                    'message': 'Reservation retrieved successfully',
                    'reservation': ReservationSerializer(filtered_reservations, many=True).data
                }, status=status.HTTP_200_OK)
            
            # Search in other fields: product_id, reservation_date, status
            reservation = Reservation.objects.filter(
                reservation_date__icontains=searchWord
            ) | Reservation.objects.filter(
                status__icontains=searchWord
            ) | Reservation.objects.filter(
                reservation_id__icontains=searchWord
            )


            
            if reservation.exists():

                reservedItems = ReservationItem.objects.filter(reservation=filtered_reservations[0].reservation_id)

                reserveditems_serializer = ReservationItemSerializer(reservedItems, many=True)
            
                return Response({
                    'message': 'Reservation retrieved successfully',
                    'reservation': ReservationSerializer(reservation, many=True).data,
                    'reservedItems': reserveditems_serializer.data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'message': 'No reservations available'
                }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({
                'message': f'An error occurred: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
class SendReminderEmailsView(APIView):
    def get(self, request, *args, **kwargs):
        try:
            # Get the current date and time
            current_date = timezone().date()
            one_day_later = current_date + timedelta(days=1)

            # Query reservations ending tomorrow
            reservations = Reservation.objects.filter(
                reservation_date_end__date=one_day_later,
                status="PENDING"
            )

            # Send emails for each reservation
            for reservation in reservations:
                email_content = f"""
                Hello {reservation.user.username},

                This is a reminder that your reservation with ID {reservation.reservation_id}
                is scheduled to end tomorrow at {reservation.reservation_date_end}.
                
                Purpose: {reservation.reservation_purpose}
                Date: {reservation.reserved_date.strftime('%Y-%m-%d')}
                
                Failure to do so will result to your portal to be locked.

                Thank you.
                """
                send_mail(
                    subject="Reservation Reminder",
                    message=email_content,
                    from_email="no-reply@yourdomain.com",
                    recipient_list=[reservation.user.email],
                )

            return JsonResponse({"message": "Reminder emails sent successfully"}, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

# class ReservationListCreateAPIView(APIView):
#     def post(self, request):
#         try:
#             # Extract and validate JWT token
#             token = request.COOKIES.get('jwt_access_token')
#             if not token:
#                 return Response({
#                     'message': 'Authentication required'
#                 }, status=status.HTTP_401_UNAUTHORIZED)

#             # Decode JWT token
#             try:
#                 decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
#                 username = decoded_token.get('username')
#                 user_role = decoded_token.get('role')
#             except jwt.ExpiredSignatureError:
#                 return Response({
#                     'message': 'Token expired'
#                 }, status=status.HTTP_401_UNAUTHORIZED)
#             except jwt.InvalidTokenError:
#                 return Response({
#                     'message': 'Invalid token'
#                 }, status=status.HTTP_401_UNAUTHORIZED)

#             product_ids = request.data.get('productIds')
#             quantities = request.data.get('quantities')
#             reservation_date = request.data.get('reservation_date')
#             reservation_date_end = request.data.get('reservation_date_end')
#             reservation_purpose = request.data.get('reservation_purpose')
#             reservation_status = request.data.get('status')
#             reservation_id = request.data.get('reservationId')

#             philippines_tz = pytz.timezone('Asia/Manila')

#             if reservation_id:
#                 # Update existing reservation
#                 reservation = get_object_or_404(Reservation, reservation_id=reservation_id)
#                 if reservation_status:
#                     reservation.status = reservation_status
#                 if reservation_date:
#                     reservation.reservation_date = reservation_date
#                 reservation.save()

#                 if product_ids and quantities:
#                     if len(product_ids) != len(quantities):
#                         return Response({
#                             'message': 'Product IDs and quantities must have the same length'
#                         }, status=status.HTTP_400_BAD_REQUEST)

#                     for product_id, quantity in zip(product_ids, quantities):
#                         product = get_object_or_404(Product, productId=product_id)
#                         try:
#                             reservation_item = ReservationItem.objects.get(reservation=reservation, product=product)
#                             original_quantity = reservation_item.quantity

#                             reservation_item.quantity = quantity
#                             reservation_item.save()

#                         except ReservationItem.DoesNotExist:
#                             return Response({
#                                 'message': 'Product not found in reservation'
#                             }, status=status.HTTP_404_NOT_FOUND)

#                         if quantity > original_quantity:
#                             product.quantity -= (quantity - original_quantity)
#                             product.save()
#                         elif quantity < original_quantity:
#                             product.quantity += (original_quantity - quantity)
#                             product.save()

#                 return Response({
#                     'message': 'Reservation updated successfully'
#                 }, status=status.HTTP_200_OK)

#             else:
#                 # Create a new reservation
#                 if not quantities:
#                     quantities = []
#                     user = get_object_or_404(User, username=username)
#                     for product_id in product_ids:
#                         try:
#                             cart_item = Cart.objects.get(user=user, product__productId=product_id)
#                             quantities.append(cart_item.quantity)
#                         except Cart.DoesNotExist:
#                             return Response({
#                                 'message': f'Cart item not found for product ID: {product_id} for user: {username}'
#                             }, status=status.HTTP_404_NOT_FOUND)

#                 if not product_ids or not quantities:
#                     return Response({
#                         'message': 'Product IDs and quantities must be provided'
#                     }, status=status.HTTP_400_BAD_REQUEST)

#                 if len(product_ids) != len(quantities):
#                     return Response({
#                         'message': 'Product IDs and quantities must have the same length'
#                     }, status=status.HTTP_400_BAD_REQUEST)

#                 # Start an atomic transaction
#                 with transaction.atomic():
#                     user = get_object_or_404(User, username=username)
#                     reservation_id = f'{username}_{timezone.now().strftime("%m-%d-%Y-%H")}_{uuid.uuid4().hex[:8]}'

#                     reservation = Reservation(
#                         user=user,
#                         reservation_id=reservation_id,
#                         reservation_date=reservation_date,
#                         reservation_date_end=reservation_date_end,
#                         reservation_purpose=reservation_purpose,
#                         status=reservation_status or 'PENDING'
#                     )
#                     reservation.save()

#                     for product_id, quantity in zip(product_ids, quantities):
#                         product = get_object_or_404(Product, productId=product_id)
#                         try:
#                             cart_item = Cart.objects.get(user=user, product=product)

#                             reservation_item = ReservationItem(
#                                 reservation=reservation,
#                                 product=product,
#                                 quantity=quantity
#                             )
#                             reservation_item.save()

#                             # Update the product quantity
#                             product.quantity -= quantity
#                             product.save()

#                             # Delete the cart item
#                             cart_item.delete()

#                         except Cart.DoesNotExist:
#                             logger.error(f'Cart item not found for product ID: {product_id} for user: {username}')
#                             # Rollback changes if there's an issue
#                             transaction.set_rollback(True)
#                             return Response({
#                                 'message': f'Product {product_id} not found in cart'
#                             }, status=status.HTTP_404_NOT_FOUND)

#                     # Create a notification for the user
#                     notification_message = f'Your reservation {reservation_id} has been created successfully.'
#                     Notification.objects.create(user=user, message=notification_message)

#                     # Notify admin about the new reservation
#                     current_time_ph = timezone.now().astimezone(philippines_tz)
#                     channel_layer = get_channel_layer()
                    
#                     async_to_sync(channel_layer.group_send)(
#                         "notifications",
#                         {
#                             "type": "notification",
#                             "message": f'New reservation {reservation.reservation_id} created by {username} at {current_time_ph.strftime("%Y-%m-%d %H:%M:%S")} in Philippine time.'
#                         }
#                     )

#                     # Notify only admins
#                     admins = User.objects.filter(role='admin')
#                     for admin in admins:
#                         async_to_sync(channel_layer.group_send)(
#                             f"user_{admin.username}",
#                             {
#                                 "type": "notification",
#                                 "message": f'New reservation {reservation.reservation_id} created by {username} at {current_time_ph.strftime("%Y-%m-%d %H:%M:%S")} in Philippine time.'
#                             }
#                         )

#                     # Notify the specific user
#                     async_to_sync(channel_layer.group_send)(
#                         f"user_{username}",
#                         {
#                             "type": "notification",
#                             "message": f'Your reservation {reservation.reservation_id} has been created successfully at {current_time_ph.strftime("%Y-%m-%d %H:%M:%S")} in Philippine time.'
#                         }
#                     )

#             return Response({
#                 'message': 'Reservation created successfully',
#                 'reservation_id': reservation_id
#             }, status=status.HTTP_201_CREATED)

#         except User.DoesNotExist:
#             return Response({
#                 'message': 'User not found'
#             }, status=status.HTTP_404_NOT_FOUND)

#         except Product.DoesNotExist:
#             return Response({
#                 'message': 'Product not found'
#             }, status=status.HTTP_404_NOT_FOUND)

#         except Exception as e:
#             logger.error(f'Error handling reservation: {e}')
#             return Response({
#                 'message': 'An error occurred',
#                 'error': str(e)
#             }, status=status.HTTP_400_BAD_REQUEST)

















# class UserNotificationsAPIView(APIView):
#     def get(self, request):
#         user = request.user
#         notifications = Notification.objects.filter(user=user).order_by('-created_at')
#         serializer = NotificationSerializer(notifications, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)
    
# class AdminNotificationsAPIView(APIView):
#     def get(self, request):
#         if not request.user.is_superuser:
#             return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
#         notifications = Notification.objects.all().order_by('-created_at')
#         serializer = NotificationSerializer(notifications, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)


# class ReservationUpdateView(APIView):
#     def put(self, request):
#         # username = request.query_params.get('username')
#         # product_id = request.query_params.get('product_id')
#         try:
            
#             reservation_id = request.data.get('reservationId')
#             product_id = request.data.get('productId')
#             quantity = request.data.get('quantity')
#             reservation_date = request.data.get('reservation_date')


#             product = Product.objects.get(productId=product_id)

#             if product.quantity < quantity:
#                 return Response({
#                     'message': 'Not enough stocks available'
#                 }, status=400)
            
            


            
#             reservation = Reservation.objects.get(reservation_id=reservation_id)


#             if product_id:
#                 reservation.product_id = product_id
            
#             if quantity:
#                 reservation.quantity = quantity

#             if reservation_date:
#                 reservation.reservation_date = reservation_date

#             reservation.save()

#             return Response({
#                 'message': 'Reservation updated successfully'
#             }, status=200)
        
#         except Reservation.DoesNotExist:
#             return Response({"error": "Reservation not found"}, status=status.HTTP_404_NOT_FOUND)
#         except:
#             return Response({
#                 'message': 'An error occurred'
#             }, status=400)
        




# class LongPollingAPIView(APIView):
#     def get(self, request):
#         token = request.COOKIES.get('jwt_access_token')
#         if not token:
#             print('Authentication required: No token provided')
#             return JsonResponse({'error': 'Authentication required'}, status=401)

#         try:
#             decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
#             username = decoded_token.get('username')
#         except jwt.ExpiredSignatureError:
#             print(f'Token expired for username: {username}')
#             return JsonResponse({'error': 'Token expired'}, status=401)
#         except jwt.InvalidTokenError:
#             print(f'Invalid token for username: {username}')
#             return JsonResponse({'error': 'Invalid token'}, status=401)

#         last_timestamp = request.GET.get('last_timestamp')
#         print(f'Last timestamp received: {last_timestamp}')
        
#         if last_timestamp:
#             last_timestamp = parse_datetime(last_timestamp)

#             # Fetch new notifications after the last timestamp
#             new_notifications = Notification.objects.filter(
#                 user__username=username,
#                 timestamp__gt=last_timestamp,
#                 read=0
#             )
#             print(f'New notifications fetched: {new_notifications.count()}')
#             print(f'New notifications: {new_notifications}')
#             # Update the read status of new notifications
#             if new_notifications.exists():
#                 new_notifications.update(read=False)
#                 notifications_data = [
#                     {'message': notification.message, 'timestamp': notification.timestamp.isoformat()}
#                     for notification in new_notifications
#                 ]
#                 print(f'Returning new notifications: {len(notifications_data)}')
#                 return JsonResponse({'notifications': notifications_data})
#             else:
#                 print('No new notifications found since last timestamp')

#         # If no last timestamp is provided or no new notifications
#         print('Returning empty notifications list')
#         return JsonResponse({'notifications': []})



            
#         #     serializer = ReservationSerializer(reservation, data=request.data, partial=True)
#         #     if serializer.is_valid():
#         #         serializer.save()
#         #         return Response(serializer.data, status=status.HTTP_200_OK)
#         #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
#         # except Reservation.DoesNotExist:
#         #     return Response({"error": "Reservation not found"}, status=status.HTTP_404_NOT_FOUND)


# class ReservationCartCreateAPIView(APIView):
#     # permission_classes = [IsAuthenticated]
#     def post(self, request):
#         try:
#             # Get the data from the request
#             username = request.data.get('username')
#             product_ids = request.data.get('productId')
#             quantities = request.data.get('quantity')
            
#             # Check if product_ids and quantities are not None
#             if product_ids is None or quantities is None:
#                 return Response({
#                     'message': 'Product IDs or quantities are missing'
#                 }, status=status.HTTP_400_BAD_REQUEST)
            
#             # Convert to lists if they are not already lists
#             if not isinstance(product_ids, list):
#                 product_ids = [product_ids]
#             if not isinstance(quantities, list):
#                 quantities = [quantities]
            
#             # Validate that the lengths of product_ids and quantities match
#             if len(product_ids) != len(quantities):
#                 return Response({
#                     'message': 'Mismatch between product IDs and quantities'
#                 }, status=status.HTTP_400_BAD_REQUEST)

#             # Get the user object
#             user = get_object_or_404(User, username=username)

#             # Iterate through product IDs and quantities to add each product to the cart
#             for i in range(len(product_ids)):
#                 product_id = product_ids[i]
#                 quantity = quantities[i]

#                 # Check if the quantity requested is available
#                 product = get_object_or_404(Product, productId=product_id)
#                 if quantity > product.quantity:
#                     return Response({
#                         'message': f'Not enough stock available for product {product_id}'
#                     }, status=400)

#                 # Add the product to the cart or update if it already exists
#                 cart_item, created = Cart.objects.update_or_create(
#                     user=user,
#                     product=product,
#                     defaults={'quantity': quantity}
#                 )

#             return Response({
#                 'message': 'Products added to cart successfully'
#             }, status=status.HTTP_200_OK)

#         except Exception as e:
#             return Response({
#                 'message': f'An error occurred: {str(e)}'
#             }, status=status.HTTP_400_BAD_REQUEST)
 

# class ReservationCartListAPIView(APIView):
#     # permission_classes = [IsAuthenticated]
#     def get(self, request):
#         try:
#             # Get the username from the request
#             username = request.query_params.get('username')

#             # Get the user object
#             user = get_object_or_404(User, username=username)

#             # Get all items in the cart for the user
#             cart_items = Cart.objects.filter(user_id=user)

#             # Serialize the cart items
#             cart_items_data = CartSerializer(cart_items, many=True).data

#             return Response({
#                 'cart_items': cart_items_data,
#                 'message': 'Cart items retrieved successfully'
#             }, status=status.HTTP_200_OK)

#         except User.DoesNotExist:
#             return Response({
#                 'message': 'User not found'
#             }, status=status.HTTP_404_NOT_FOUND)

#         except Exception as e:
#             return Response({
#                 'message': f'An error occurred: {str(e)}'
#             }, status=status.HTTP_400_BAD_REQUEST)

import uuid
from django.utils import timezone
import logging
from rest_framework import generics, status
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Reservation
from .serializers import ReservationItemSerializer, ReservationSerializer, NotificationSerializer
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
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db import transaction
import pytz
import jwt
from django.conf import settings
logger = logging.getLogger(__name__)
from django.http import JsonResponse
from django.utils.dateparse import parse_datetime
import datetime
import re



# pangadd to cart
class ReservationCartCreateAPIView(APIView):
     def post(self, request):
        try:
            # Get the data from the request
            username = request.data.get('username')
            product_ids = request.data.get('productIds')
            quantities = request.data.get('quantities')

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

                if quantity > Product.objects.get(productId=product_id).quantity:
                    return Response({
                        'message': 'Not enough stocks available'
                    }, status=400)

                # Get the product object
                product = get_object_or_404(Product, productId=product_id)

                # Add the product to the cart or update if it already exists
                cart_item, created = Cart.objects.update_or_create(
                    user=user,
                    product=product,
                    defaults={'quantity': quantity}
                )

            return Response({
                'message': 'Products added to cart successfully'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'message': f'An error occurred: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        

# pang reserve




class LongPollingAPIView(APIView):
    def get(self, request):
        token = request.COOKIES.get('jwt_access_token')
        if not token:
            print('Authentication required: No token provided')
            return JsonResponse({'error': 'Authentication required'}, status=401)

        try:
            decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            username = decoded_token.get('username')
        except jwt.ExpiredSignatureError:
            print(f'Token expired for username: {username}')
            return JsonResponse({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            print(f'Invalid token for username: {username}')
            return JsonResponse({'error': 'Invalid token'}, status=401)

        last_timestamp = request.GET.get('last_timestamp')
        print(f'Last timestamp received: {last_timestamp}')
        
        if last_timestamp:
            last_timestamp = parse_datetime(last_timestamp)

            # Fetch new notifications after the last timestamp
            new_notifications = Notification.objects.filter(
                user__username=username,
                timestamp__gt=last_timestamp,
                read=0
            )
            print(f'New notifications fetched: {new_notifications.count()}')
            print(f'New notifications: {new_notifications}')
            # Update the read status of new notifications
            if new_notifications.exists():
                new_notifications.update(read=False)
                notifications_data = [
                    {'message': notification.message, 'timestamp': notification.timestamp.isoformat()}
                    for notification in new_notifications
                ]
                print(f'Returning new notifications: {len(notifications_data)}')
                return JsonResponse({'notifications': notifications_data})
            else:
                print('No new notifications found since last timestamp')

        # If no last timestamp is provided or no new notifications
        print('Returning empty notifications list')
        return JsonResponse({'notifications': []})





class showNotification(APIView):
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
        
        notification_unread = Notification.objects.filter(user__username=username, read=0).count()
        notifications = Notification.objects.filter(user__username=username).order_by('-timestamp')[:5]  # Limit to 5
        # notifications = Notification.objects.filter(user__username=username).order_by('-timestamp')
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
        
        notification_data.append({'unread': notification_unread})

        return Response(notification_data, status=status.HTTP_200_OK)

class readNotification(APIView):
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





class ReservationCreateUpdateAPIView(APIView):
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

            product_ids = request.data.get('productIds')
            quantities = request.data.get('quantities')
            reservation_date = request.data.get('reservation_date')
            reservation_date_end = request.data.get('reservation_date_end')
            reservation_purpose = request.data.get('reservation_purpose')
            reservation_status = request.data.get('status')
            reservation_id = request.data.get('reservationId')

            print(f"Reservation data received: Product IDs: {product_ids}, Quantities: {quantities}")

            philippines_tz = pytz.timezone('Asia/Manila')

            if reservation_id:
                print(f"Updating reservation: {reservation_id}")
                reservation = get_object_or_404(Reservation, reservation_id=reservation_id)
                if reservation_status:
                    reservation.status = reservation_status
                if reservation_date:
                    reservation.reservation_date = reservation_date
                reservation.save()

                if product_ids and quantities:
                    if len(product_ids) != len(quantities):
                        print("Product IDs and quantities length mismatch")
                        return Response({
                            'message': 'Product IDs and quantities must have the same length'
                        }, status=status.HTTP_400_BAD_REQUEST)

                    for product_id, quantity in zip(product_ids, quantities):
                        product = get_object_or_404(Product, productId=product_id)
                        try:
                            reservation_item = ReservationItem.objects.get(reservation=reservation, product=product)
                            original_quantity = reservation_item.quantity

                            reservation_item.quantity = quantity
                            reservation_item.save()

                        except ReservationItem.DoesNotExist:
                            print(f"Reservation item not found for product: {product_id}")
                            return Response({
                                'message': 'Product not found in reservation'
                            }, status=status.HTTP_404_NOT_FOUND)

                        if quantity > original_quantity:
                            product.quantity -= (quantity - original_quantity)
                            product.save()
                        elif quantity < original_quantity:
                            product.quantity += (original_quantity - quantity)
                            product.save()

                user = get_object_or_404(User, username=username)

                if reservation_status == "APPROVED":
                    notification_message = f'Your reservation {reservation_id} has been approved successfully and is awaiting your pickup.'
                elif reservation_status == "REJECTED":
                    notification_message = f'Your reservation {reservation_id} has been rejected.'
                elif reservation_status == "CANCELLED":
                    notification_message = f'Your reservation {reservation_id} has been cancelled.'
                elif reservation_status == "COMPLETED":
                    notification_message = f'Your reservation {reservation_id} has been completed.'
                elif reservation_status == "AWAITING RETURN":
                    notification_message = f'Your reservation {reservation_id} is awaiting return.'
                elif reservation_status == "DAMAGED/LOST/PARTIALLY_COMPLETED":
                    notification_message = f'Your reservation {reservation_id} has been marked as damaged/lost/partially completed.'
                elif reservation_status == "AWAITING PAYMENT":
                    notification_message = f'Your reservation {reservation_id} is awaiting payment.'
                else:
                    notification_message = f'Your reservation {reservation_id} has been updated.'

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

                    reservation = Reservation(
                        user=user,
                        reservation_id=reservation_id,
                        reservation_date=reservation_date,
                        reservation_date_end=reservation_date_end,
                        reservation_purpose=reservation_purpose,
                        status=reservation_status or 'PENDING'
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

                    notification_message = f'Your reservation {reservation_id} has been created successfully.'
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
                'reservation_id': reservation_id
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


class AdminUpdateReservationStatusAPIView(APIView):
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
            product_ids = request.data.get('productIds')
            quantities = request.data.get('quantities')
            reservation_date = request.data.get('reservation_date')
            reservation_date_end = request.data.get('reservation_date_end')
            reservation_purpose = request.data.get('reservation_purpose')
            reservation_status = request.data.get('status')
            reservation_id = request.data.get('reservationId')

            print(f"Reservation data received: Product IDs: {product_ids}, Quantities: {quantities}")

            if reservation_id:
                reservation = get_object_or_404(Reservation, reservation_id=reservation_id)
                if reservation_status:
                    reservation.status = reservation_status
                    notification_message = f'Your reservation`s status for {reservation_id} has been updated. by {usernameAdmin}'
                if reservation_date:
                    reservation.reservation_date = reservation_date
                    notification_message = f'Your reservation`s pickup date for {reservation_id} has been updated. by {usernameAdmin}'
                if reservation_date_end:
                    reservation.reservation_date_end = reservation_date_end
                    notification_message = f'Your reservation`s return date for {reservation_id} has been updated. by {usernameAdmin}'
                if reservation_purpose:
                    reservation.reservation_purpose = reservation_purpose
                    notification_message = f'Your reservation`s purpose for {reservation_id} has been updated. by {usernameAdmin}'
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
                            reservation_item.quantity = quantity
                            reservation_item.save()

                            # Update the product quantity based on the difference
                            product_quantity_difference = quantity - reservation_item.quantity
                            product.quantity -= product_quantity_difference
                            product.save()
                            notification_message = f'Your reservation {reservation_id} has been updated. by {usernameAdmin}'

                        except ReservationItem.DoesNotExist:
                            return Response({
                                'message': f'Product not found in reservation: {product_id}'
                            }, status=status.HTTP_404_NOT_FOUND)

                user = get_object_or_404(User, username=username)
                # Notification code...
                
            if reservation_status:

                if reservation_status == "APPROVED":
                    notification_message = f'Your reservation {reservation_id} has been approved successfully and is awaiting your pickup. by {usernameAdmin}'
                elif reservation_status == "REJECTED":
                    notification_message = f'Your reservation {reservation_id} has been rejected. by {usernameAdmin}'
                elif reservation_status == "CANCELLED":
                    notification_message = f'Your reservation {reservation_id} has been cancelled. by {usernameAdmin}'
                elif reservation_status == "COMPLETED":
                    notification_message = f'Your reservation {reservation_id} has been completed. by {usernameAdmin}'
                elif reservation_status == "AWAITING RETURN":
                    notification_message = f'Your reservation {reservation_id} is awaiting return. by {usernameAdmin}'
                elif reservation_status == "DAMAGED/LOST/PARTIALLY_COMPLETED":
                    notification_message = f'Your reservation {reservation_id} has been marked as damaged/lost/partially completed. by {usernameAdmin}'
                elif reservation_status == "AWAITING PAYMENT":
                    notification_message = f'Your reservation {reservation_id} is awaiting payment. by {usernameAdmin}'
                else:
                    notification_message = f'Your reservation {reservation_id} has been updated. by {usernameAdmin}'

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
                        message=f'Reservation {reservation_id} updated by {usernameAdmin}.',
                        read=0,
                    )
                    print(f"Notification updated for admin {admin.username} with ID {admin_notification.id}")

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


class AdminReservationDetailAPIView(APIView):
    def get(self, request):
        token = request.COOKIES.get('jwt_access_token')
        if not token:
            print("Authentication required: No token provided")
            return Response({
                'message': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)

        try:
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
                }, status=status.HTTP_404_NOT_FOUND)

            # Combine reservation data with corresponding reservation items
            combined_data = []
            for reservation in reservations:
                reservation_data = ReservationSerializer(reservation).data

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

        except Exception as e:
            return Response({
                'message': 'An error occurred',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        
# pang view ng reservation
class ReservationDetailAPIView(APIView):
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
        







            
#         #     serializer = ReservationSerializer(reservation, data=request.data, partial=True)
#         #     if serializer.is_valid():
#         #         serializer.save()
#         #         return Response(serializer.data, status=status.HTTP_200_OK)
#         #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
#         # except Reservation.DoesNotExist:
#         #     return Response({"error": "Reservation not found"}, status=status.HTTP_404_NOT_FOUND)

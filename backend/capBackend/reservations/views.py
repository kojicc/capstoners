from tokenize import TokenError
import uuid
from django.utils import timezone
import logging
from rest_framework import generics, status
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ClassSchedule, Reservation, ReservationItem, ReturnedItem
from .serializers import ClassScheduleSerializer, ReservationItemSerializer, ReservationSerializer, NotificationSerializer, CartSerializer, PaymentProofSerializer
# from .serializers import AddToCartSerializer
from auth_app.models import User
from products.models import Product
from reservations.models import Cart, ReservationItem, Notification
from rest_framework.permissions import IsAuthenticated
import traceback
from .models import Reservation, ReservationItem, PaymentProof
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
import boto3
from botocore.exceptions import ClientError
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from datetime import datetime, timedelta
from django.db.models import Count, Sum
import pandas as pd
import xlsxwriter
import io
import os
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from django.conf import settings

# pangview ng total reservations


class ReservationImportExportView(APIView):
    def get(self, request):
        # Get and validate export parameters
        period = request.query_params.get('period', 'all')
        export_format = request.query_params.get('export_format')
        username = request.query_params.get('username')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        print(f"Debug - Export parameters: period={period}, format={export_format}, dates={start_date}-{end_date}")

        # Get base queryset
        reservations = Reservation.objects.all().order_by('-reserved_date')

        # Apply period filter
        today = timezone.now().date()
        if period == 'daily':
            reservations = reservations.filter(reserved_date__date=today)
        elif period == 'weekly':
            week_ago = today - timedelta(days=7)
            reservations = reservations.filter(reserved_date__date__gte=week_ago)
        elif period == 'monthly':
            month_start = today.replace(day=1)
            reservations = reservations.filter(reserved_date__date__gte=month_start)
        elif period == 'annually':
            year_start = today.replace(month=1, day=1)
            reservations = reservations.filter(reserved_date__date__gte=year_start)
        elif period == 'custom' and (start_date or end_date):
            if start_date:
                reservations = reservations.filter(reserved_date__date__gte=start_date)
            if end_date:
                reservations = reservations.filter(reserved_date__date__lte=end_date)

        # Apply username filter if provided
        if username:
            reservations = reservations.filter(user__username=username)

        print(f"Debug - Query results: {reservations.count()} reservations found")

        # Generate appropriate export format
        try:
            if export_format == 'pdf':
                buffer = self._generate_pdf_report(reservations, period, start_date, end_date)
                if not buffer:
                    return Response({'error': 'Failed to generate PDF'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="Reservoia_Transactions_{period}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
                return response
            else:
                buffer = self._generate_excel_report(reservations)
                response = HttpResponse(
                    buffer.getvalue(),
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
                response['Content-Disposition'] = f'attachment; filename="Reservoia_Transactions_{period}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.xlsx"'
                return response
        except Exception as e:
            logger.error(f"Error generating export: {str(e)}")
            return Response({'error': f'Failed to generate export: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    def _generate_pdf_report(self, reservations, period, start_date=None, end_date=None):
        try:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=landscape(letter),
                rightMargin=30,
                leftMargin=30,
                topMargin=30,
                bottomMargin=30
            )
            
            elements = []
            styles = getSampleStyleSheet()

            # Load custom font to handle special characters
            font_loaded = False
            try:
                # Try multiple font paths
                font_paths = [
                    os.path.join(settings.STATIC_ROOT, 'fonts', 'DejaVuSans.ttf'),
                    os.path.join(settings.BASE_DIR, 'static', 'fonts', 'DejaVuSans.ttf'),
                    os.path.join(settings.MEDIA_ROOT, 'fonts', 'DejaVuSans.ttf'),
                    # Add system font paths as fallback
                    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',  # Linux
                    '/System/Library/Fonts/Arial.ttf',  # macOS
                    'C:\\Windows\\Fonts\\arial.ttf',  # Windows
                ]
                
                for font_path in font_paths:
                    if os.path.exists(font_path):
                        pdfmetrics.registerFont(TTFont('CustomFont', font_path))
                        font_loaded = True
                        print(f"Font loaded successfully from: {font_path}")
                        break
                
                if font_loaded:
                    styles['Title'].fontName = 'CustomFont'
                    styles['Normal'].fontName = 'CustomFont'
                    styles['Heading1'].fontName = 'CustomFont'
                    styles['Heading2'].fontName = 'CustomFont'
                    
            except Exception as e:
                print(f"Font loading error: {str(e)}")
                font_loaded = False

            # Try to load logo with better error handling
            logo_paths = [
                os.path.join(settings.STATIC_ROOT, 'images', 'reservoia_logo.png'),
                os.path.join(settings.MEDIA_ROOT, 'images', 'reservoia_logo.png'),
                os.path.join(settings.BASE_DIR, 'static', 'images', 'reservoia_logo.png'),
                os.path.join(settings.BASE_DIR, 'staticfiles', 'images', 'reservoia_logo.png'),
                # Add more potential paths
                os.path.join(settings.BASE_DIR, 'assets', 'images', 'reservoia_logo.png'),
                os.path.join(settings.BASE_DIR, 'media', 'images', 'reservoia_logo.png'),
            ]

            logo_loaded = False
            for logo_path in logo_paths:
                print(f"Checking logo path: {logo_path}")
                if os.path.exists(logo_path):
                    try:
                        # Verify the file is a valid image
                        from PIL import Image as PILImage
                        pil_img = PILImage.open(logo_path)
                        pil_img.verify()  # Verify it's a valid image
                        
                        # Create ReportLab Image
                        logo = Image(logo_path)
                        logo.drawHeight = 1.5*inch
                        logo.drawWidth = 1.5*inch
                        elements.append(logo)
                        elements.append(Spacer(1, 20))
                        logo_loaded = True
                        print(f"Logo loaded successfully from: {logo_path}")
                        break
                    except Exception as e:
                        print(f"Failed to load logo from {logo_path}: {str(e)}")
                        continue

            if not logo_loaded:
                print("No logo found in any of the expected locations")
                # Add a text-based header instead
                company_header = Paragraph("RESERVOIA", ParagraphStyle(
                    'CompanyHeader',
                    parent=styles['Title'],
                    fontSize=20,
                    spaceAfter=20,
                    textColor=colors.purple,
                    alignment=1
                ))
                elements.append(company_header)
                
            # Add title with custom styling
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Title'],
                fontSize=24,
                spaceAfter=30,
                textColor=colors.purple,
                alignment=1,  # Center alignment
                fontName='CustomFont' if font_loaded else 'Helvetica-Bold'
            )
            elements.append(Paragraph("Transactions Report", title_style))
            elements.append(Spacer(1, 20))
            
            # Add period information
            period_text = f"Period: {period.capitalize()}"
            if period == 'custom' and (start_date or end_date):
                period_text += f" (From: {start_date or 'Start'} To: {end_date or 'End'})"
            elements.append(Paragraph(period_text, styles['Heading2']))
            elements.append(Spacer(1, 20))

            # Create data table with proper text conversion and wrapping for ALL columns
            data = [['ID', 'User', 'Date', 'Status', 'Items', 'Total\nQty']]
            
            for res in reservations:
                try:
                    # Build items string with proper formatting
                    items_list = []
                    for item in res.items.all():
                        item_str = f"{str(item.product.name)} ({str(item.quantity)})"
                        items_list.append(item_str)
                    
                    items_str = ", ".join(items_list)
                    total_qty = sum(item.quantity for item in res.items.all())
                    
                    # Format date properly with line break
                    formatted_date = res.reserved_date.strftime('%Y-%m-%d\n%H:%M')
                    
                    # Format status to handle long text with proper breaks
                    status_text = str(res.status).replace('_', '_\n')
                    if '/' in status_text:
                        status_text = status_text.replace('/', '/\n')
                    
                    # Format username to handle long usernames
                    username = str(res.user.username)
                    if len(username) > 10:
                        # Add line break for long usernames
                        username = username[:10] + '\n' + username[10:]
                    
                    row = [
                        str(res.reservation_id),
                        username,
                        formatted_date,
                        status_text,
                        items_str,
                        str(total_qty)
                    ]
                    data.append(row)
                except Exception as e:
                    print(f"Error processing reservation {res.reservation_id}: {str(e)}")
                    continue

            # Optimized column widths for better content distribution
            # Total width ≈ 10 inches (landscape letter minus margins)
            col_widths = [0.7*inch, 1.1*inch, 1.1*inch, 1.3*inch, 3.5*inch, 0.6*inch]
            
            # Create paragraph style for all cell content
            cell_style = ParagraphStyle(
                'CellStyle',
                fontSize=8,
                leading=10,
                fontName='CustomFont' if font_loaded else 'Helvetica',
                alignment=0,  # Left align
                wordWrap='LTR',
                splitLongWords=True
            )
            
            header_style = ParagraphStyle(
                'HeaderStyle',
                fontSize=10,
                leading=12,
                fontName='CustomFont' if font_loaded else 'Helvetica-Bold',
                alignment=1,  # Center align
                textColor=colors.whitesmoke
            )
            
            # Convert ALL cells to Paragraphs for proper wrapping
            wrapped_data = []
            for row_idx, row in enumerate(data):
                wrapped_row = []
                for col_idx, cell in enumerate(row):
                    if row_idx == 0:  # Header row
                        wrapped_cell = Paragraph(str(cell), header_style)
                    else:
                        # Data rows - handle different column types
                        cell_text = str(cell)
                        
                        # Special handling for items column to break long text
                        if col_idx == 4 and len(cell_text) > 50:
                            # Insert line breaks in long items list
                            words = cell_text.split(', ')
                            formatted_items = []
                            current_line = ""
                            for word in words:
                                if len(current_line + word) > 40:
                                    if current_line:
                                        formatted_items.append(current_line.rstrip(', '))
                                    current_line = word + ", "
                                else:
                                    current_line += word + ", "
                            if current_line:
                                formatted_items.append(current_line.rstrip(', '))
                            cell_text = '\n'.join(formatted_items)
                        
                        wrapped_cell = Paragraph(cell_text, cell_style)
                    wrapped_row.append(wrapped_cell)
                wrapped_data.append(wrapped_row)
            
            # Create table with wrapped content
            table = Table(wrapped_data, colWidths=col_widths)
            
            # Enhanced table style
            table_style = [
                ('BACKGROUND', (0, 0), (-1, 0), colors.purple),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),  # Center header
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),   # Top align all content
                ('FONTSIZE', (0, 0), (-1, 0), 10),     # Header font size
                ('FONTSIZE', (0, 1), (-1, -1), 8),     # Data font size
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('TOPPADDING', (0, 1), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
                ('LEFTPADDING', (0, 0), (-1, -1), 4),
                ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.lightgrey]),
                ('BOX', (0, 0), (-1, -1), 1, colors.black),
            ]
            
            table.setStyle(TableStyle(table_style))
            
            elements.append(table)
            
            # Add summary information
            elements.append(Spacer(1, 20))
            summary_text = f"Total Reservations: {len(data) - 1}"
            elements.append(Paragraph(summary_text, styles['Normal']))
            
            # Add timestamp
            elements.append(Spacer(1, 30))
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            footer = Paragraph(f"Generated on: {timestamp}", styles['Normal'])
            elements.append(footer)
            
            # Build PDF
            doc.build(elements)
            buffer.seek(0)
            return buffer
            
        except Exception as e:
            print(f"Error generating PDF: {str(e)}")
            logger.error(f"PDF Generation Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def _generate_excel_report(self, reservations):
        try:
            print("Debug - Generating Excel report")
            output = io.BytesIO()
            
            data = []
            for reservation in reservations:
                reservation_data = ReservationSerializer(reservation).data
                items = reservation.items.all()
                items_data = []
                
                for item in items:
                    item_data = {
                        'product_name': item.product.name,
                        'product_id': item.product.productId,
                        'quantity': item.quantity,
                        'returned': 0,
                        'damaged': 0
                    }
                    
                    # Safely get return info
                    try:
                        if hasattr(item, 'return_info_rel'):
                            item_data.update({
                                'returned': item.return_info_rel.quantity_returned,
                                'damaged': item.return_info_rel.quantity_damaged,
                            })
                    except Exception as e:
                        print(f"Warning: Could not get return info for item {item.id}: {str(e)}")
                    
                    items_data.append(item_data)
                
                reservation_data['items'] = items_data
                data.append(reservation_data)

            # Create DataFrame
            df = pd.DataFrame(data)

            # Write to Excel with formatting
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                sheet_name = f"Reservations_{datetime.now().strftime('%Y%m')}"
                df.to_excel(writer, sheet_name=sheet_name, index=False)
                
                # Format headers
                workbook = writer.book
                worksheet = writer.sheets[sheet_name]
                
                header_format = workbook.add_format({
                    'bold': True,
                    'bg_color': '#4B0082',
                    'font_color': 'white',
                    'border': 1,
                    'text_wrap': True,
                    'valign': 'vcenter',
                    'align': 'center'
                })
                
                for col_num, value in enumerate(df.columns.values):
                    worksheet.write(0, col_num, value, header_format)
                    col_width = max(len(str(value)), 12)
                    worksheet.set_column(col_num, col_num, col_width)

            output.seek(0)
            return output
        except Exception as e:
            print(f"Error generating Excel report: {str(e)}")
            raise

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
                    reservation_id = f'{uuid.uuid4().hex[:8]}'

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
        try:
            # Authentication checks
            token = request.COOKIES.get('jwt_access_token')
            if not token:
                return Response({'message': 'Authentication required'}, 
                             status=status.HTTP_401_UNAUTHORIZED)
            
            try:
                decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                role = decoded_token.get('role')
                usernameAdmin = decoded_token.get('username')
                if role != 'admin':
                    return Response({'message': 'Unauthorized access'}, 
                                status=status.HTTP_403_FORBIDDEN)
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
                return Response({'message': 'Invalid or expired token'}, 
                             status=status.HTTP_401_UNAUTHORIZED)

            # Get request data
            username = request.data.get('username')
            reservation_id = request.data.get('reservationId')
            reservation_status = request.data.get('status')
            returned_items = request.data.get('returned_items', {})
            product_ids = request.data.get('productIds', [])
            quantities = request.data.get('quantities', [])
            remarks = request.data.get('remarks', '')
            
            print(f"Processing reservation update - ID: {reservation_id}, Status: {reservation_status}")
            print(f"Returned items: {returned_items}")
            
            with transaction.atomic():
                reservation = get_object_or_404(Reservation, reservation_id=reservation_id)
                
                # Handle quantity updates
                if product_ids and quantities:
                    for product_id, new_quantity in zip(product_ids, quantities):
                        try:
                            product = Product.objects.get(productId=product_id)
                            reservation_item = ReservationItem.objects.get(
                                reservation=reservation,
                                product=product
                            )
                            
                            # Calculate quantity difference
                            quantity_difference = new_quantity - reservation_item.quantity
                            
                            # Update product inventory
                            if quantity_difference > 0:
                                if product.quantity < quantity_difference:
                                    return Response({
                                        'message': f'Not enough stock for product: {product_id}'
                                    }, status=status.HTTP_400_BAD_REQUEST)
                                product.quantity -= quantity_difference
                                product.reserved += quantity_difference
                            else:
                                product.quantity += abs(quantity_difference)
                                product.reserved -= abs(quantity_difference)
                            
                            # Update reservation item quantity
                            reservation_item.quantity = new_quantity
                            reservation_item.save()
                            product.save()
                            
                        except (Product.DoesNotExist, ReservationItem.DoesNotExist):
                            return Response({
                                'message': f'Product {product_id} not found in reservation'
                            }, status=status.HTTP_404_NOT_FOUND)

                # Calculate total items and return status for validation
                total_items = sum(item.quantity for item in reservation.items.all())
                total_returned = 0
                total_damaged = 0
                
                # Get existing return info
                for item in reservation.items.all():
                    try:
                        return_info = ReturnedItem.objects.get(reservation_item=item)
                        total_returned += return_info.quantity_returned
                        total_damaged += return_info.quantity_damaged
                    except ReturnedItem.DoesNotExist:
                        pass

                # Handle returned items and update inventory
                process_remarks = f"\nReturn processed on {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
                
                if returned_items:
                    # Reset totals before processing new returns
                    total_items = 0
                    total_returned = 0
                    total_damaged = 0

                    for item_id, item_data in returned_items.items():
                        try:
                            # Parse the item_id to ensure it's an integer
                            reservation_item_id = int(item_id)
                            reservation_item = get_object_or_404(ReservationItem, 
                                                            id=reservation_item_id, 
                                                            reservation=reservation)
                            product = reservation_item.product
                            
                            returned_qty = int(item_data.get('returned', 0))
                            damaged_qty = int(item_data.get('damaged', 0))
                            
                            # Validate returned quantities
                            if returned_qty > reservation_item.quantity:
                                return Response({
                                    'message': f'Returned quantity ({returned_qty}) exceeds original quantity ({reservation_item.quantity}) for item {item_id}'
                                }, status=status.HTTP_400_BAD_REQUEST)
                            
                            if damaged_qty > returned_qty:
                                return Response({
                                    'message': f'Damaged quantity ({damaged_qty}) cannot exceed returned quantity ({returned_qty}) for item {item_id}'
                                }, status=status.HTTP_400_BAD_REQUEST)
                            
                            print(f"Processing return for item {item_id}: {returned_qty} returned, {damaged_qty} damaged")
                            
                            # Create or update ReturnedItem record
                            returned_item, created = ReturnedItem.objects.update_or_create(
                                reservation_item=reservation_item,
                                defaults={
                                    'quantity_returned': returned_qty,
                                    'quantity_damaged': damaged_qty
                                }
                            )
                            
                            # Update product inventory - handle the case where quantities are being updated
                            try:
                                previous_return = ReturnedItem.objects.get(reservation_item=reservation_item)
                                previous_returned = previous_return.quantity_returned
                                previous_damaged = previous_return.quantity_damaged
                                
                                # Adjust inventory based on the difference
                                return_diff = returned_qty - previous_returned
                                damage_diff = damaged_qty - previous_damaged
                                
                                if return_diff != 0:
                                    # If returning more items
                                    if return_diff > 0:
                                        product.reserved -= return_diff
                                    # If returning fewer items (e.g. correcting a mistake)
                                    else:
                                        product.reserved += abs(return_diff)
                                
                                if damage_diff != 0:
                                    # If more damaged items
                                    if damage_diff > 0:
                                        product.broken_damaged += damage_diff
                                    # If fewer damaged items
                                    else:
                                        product.broken_damaged -= abs(damage_diff)
                                        
                                # Adjust quantity for good returned items
                                good_return_diff = (returned_qty - damaged_qty) - (previous_returned - previous_damaged)
                                if good_return_diff > 0:
                                    product.quantity += good_return_diff
                                elif good_return_diff < 0:
                                    product.quantity -= abs(good_return_diff)
                                    
                            except ReturnedItem.DoesNotExist:
                                # New return record
                                product.quantity += (returned_qty - damaged_qty)
                                product.broken_damaged += damaged_qty
                                product.reserved -= returned_qty
                            
                            product.save()

                            total_items += reservation_item.quantity
                            total_returned += returned_qty
                            total_damaged += damaged_qty

                            process_remarks += (
                                f"\nProduct: {product.name}\n"
                                f"- Original Quantity: {reservation_item.quantity}\n"
                                f"- Returned (Good): {returned_qty - damaged_qty}\n"
                                f"- Damaged: {damaged_qty}\n"
                                f"- Still Outstanding: {reservation_item.quantity - returned_qty}\n"
                            )
                        except (ValueError, TypeError) as e:
                            print(f"Error processing return item {item_id}: {str(e)}")
                            return Response({
                                'message': 'Invalid item ID format',
                                'error': f"Field 'id' expected a number but got '{item_id}': {str(e)}"
                            }, status=status.HTTP_400_BAD_REQUEST)
                        except Exception as e:
                            print(f"Unexpected error processing return item {item_id}: {str(e)}")
                            return Response({
                                'message': 'Error processing return',
                                'error': str(e)
                            }, status=status.HTTP_400_BAD_REQUEST)

                    # Determine appropriate status based on returns
                    if total_returned == 0:
                        suggested_status = "APPROVED/AWAITING RETURN"
                    elif total_returned < total_items:
                        suggested_status = "PARTIALLY_RETURNED"
                    elif total_damaged > 0:
                        # For damaged items, admin can choose between these two statuses
                        if reservation_status == "AWAITING PAYMENT":
                            suggested_status = "AWAITING PAYMENT"
                        else:
                            suggested_status = "DAMAGED/LOST/PARTIALLY_COMPLETED"
                    else:
                        suggested_status = "COMPLETED"

                    # Validate status against returned items
                    if reservation_status:
                        # Validate status changes based on returned items
                        if reservation_status == "COMPLETED" and total_returned < total_items:
                            return Response({
                                'message': 'Cannot mark as COMPLETED when not all items are returned',
                                'suggested_status': suggested_status,
                                'total_returned': total_returned,
                                'total_items': total_items
                            }, status=status.HTTP_400_BAD_REQUEST)
                        
                        if reservation_status == "DAMAGED/LOST/PARTIALLY_COMPLETED" and total_damaged == 0:
                            return Response({
                                'message': 'Cannot mark as DAMAGED/LOST/PARTIALLY_COMPLETED when no items are damaged',
                                'suggested_status': suggested_status,
                                'total_damaged': total_damaged
                            }, status=status.HTTP_400_BAD_REQUEST)
                        
                        if reservation_status == "PARTIALLY_RETURNED":
                            if total_returned == 0:
                                return Response({
                                    'message': 'Cannot mark as PARTIALLY_RETURNED when no items are returned',
                                    'suggested_status': suggested_status,
                                    'total_returned': total_returned
                                }, status=status.HTTP_400_BAD_REQUEST)
                            
                            if total_returned == total_items:
                                return Response({
                                    'message': 'Cannot mark as PARTIALLY_RETURNED when all items are returned. Use COMPLETED instead.'
                                }, status=status.HTTP_400_BAD_REQUEST)
                        
                        if reservation_status == "AWAITING PAYMENT" and total_damaged == 0:
                            return Response({
                                'message': 'Cannot mark as AWAITING PAYMENT when no items are damaged',
                                'suggested_status': suggested_status,
                                'total_damaged': total_damaged
                            }, status=status.HTTP_400_BAD_REQUEST)
                        
                        # If validation passes, use the requested status
                        new_status = reservation_status
                    else:
                        new_status = suggested_status
                    
                    print(f"Setting status to {new_status} based on returns: {total_returned}/{total_items} returned, {total_damaged} damaged")
                    reservation.status = new_status
                    
                    if reservation.remarks:
                        reservation.remarks += process_remarks
                    else:
                        reservation.remarks = process_remarks
                elif reservation_status:
                    # If no returned items data provided but status is changing
                    
                    # Validate status changes based on existing returned items
                    items_query = ReservationItem.objects.filter(reservation=reservation)
                    total_items = sum(item.quantity for item in items_query)
                    
                    # Check existing return records
                    total_returned = 0
                    total_damaged = 0
                    for item in items_query:
                        try:
                            return_info = ReturnedItem.objects.get(reservation_item=item)
                            total_returned += return_info.quantity_returned
                            total_damaged += return_info.quantity_damaged
                        except ReturnedItem.DoesNotExist:
                            pass
                    
                    # Validate status against existing return data
                    if reservation_status == "COMPLETED" and total_returned < total_items:
                        return Response({
                            'message': 'Cannot mark as COMPLETED when not all items are returned',
                            'total_returned': total_returned,
                            'total_items': total_items
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    if reservation_status == "DAMAGED/LOST/PARTIALLY_COMPLETED" and total_damaged == 0:
                        return Response({
                            'message': 'Cannot mark as DAMAGED/LOST/PARTIALLY_COMPLETED when no items are damaged',
                            'total_damaged': total_damaged
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    if reservation_status == "PARTIALLY_RETURNED":
                        if total_returned == 0:
                            return Response({
                                'message': 'Cannot mark as PARTIALLY_RETURNED when no items are returned',
                                'total_returned': total_returned
                            }, status=status.HTTP_400_BAD_REQUEST)
                        
                        if total_returned == total_items:
                            return Response({
                                'message': 'Cannot mark as PARTIALLY_RETURNED when all items are returned. Use COMPLETED instead.'
                            }, status=status.HTTP_400_BAD_REQUEST)
                    
                    if reservation_status == "AWAITING PAYMENT" and total_damaged == 0:
                        return Response({
                            'message': 'Cannot mark as AWAITING PAYMENT when no items are damaged',
                            'total_damaged': total_damaged
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Set the status after validation
                    reservation.status = reservation_status

                # Update remarks if provided
                    # Update remarks if provided
                    if remarks is not None:  # Changed to check if remarks is provided at all
                        reservation.remarks = remarks.strip() if remarks.strip() != "N/A" else ""

                # Process quantities
                if product_ids and quantities:
                    for product_id, new_quantity in zip(product_ids, quantities):
                        try:
                            # Lock the product for update
                            with transaction.atomic():
                                product = Product.objects.select_for_update().get(productId=product_id)
                                reservation_item = ReservationItem.objects.get(
                                    reservation=reservation,
                                    product=product
                                )
                                
                                # Calculate quantity difference
                                quantity_difference = new_quantity - reservation_item.quantity
                                
                                # If increasing quantity
                                if quantity_difference > 0:
                                    # Check available quantity considering reserved items
                                    available_quantity = product.quantity + reservation_item.quantity
                                    if quantity_difference > available_quantity:
                                        return Response({
                                            'message': f'Not enough stock for product: {product_id}. Available: {available_quantity}'
                                        }, status=status.HTTP_400_BAD_REQUEST)
                                    
                                    # Update inventory
                                    product.quantity -= quantity_difference
                                    product.reserved += quantity_difference
                                
                                # If decreasing quantity
                                elif quantity_difference < 0:
                                    # Return items to available stock
                                    product.quantity += abs(quantity_difference)
                                    product.reserved -= abs(quantity_difference)
                                
                                # Save changes
                                reservation_item.quantity = new_quantity
                                reservation_item.save()
                                product.save()
                                
                        except (Product.DoesNotExist, ReservationItem.DoesNotExist):
                            return Response({
                                'message': f'Product {product_id} not found in reservation'
                            }, status=status.HTTP_404_NOT_FOUND)
                        except ReservationItem.DoesNotExist:
                            return Response({
                                'message': f'Product {product_id} not found in reservation'
                            }, status=status.HTTP_404_NOT_FOUND)

                # Save the reservation after all updates
                reservation.save()

                # Get summary of returned/broken items
                returned_summary = []
                for item in reservation.items.all():
                    try:
                        return_info = ReturnedItem.objects.get(reservation_item=item)
                        returned_summary.append({
                            'product_name': item.product.name,
                            'product_id': item.product.productId,
                            'original_quantity': item.quantity,
                            'returned_good': return_info.quantity_returned - return_info.quantity_damaged,
                            'damaged': return_info.quantity_damaged,
                            'outstanding': item.quantity - return_info.quantity_returned
                        })
                    except ReturnedItem.DoesNotExist:
                        # Also include items without return info
                        returned_summary.append({
                            'product_name': item.product.name,
                            'product_id': item.product.productId,
                            'original_quantity': item.quantity,
                            'returned_good': 0,
                            'damaged': 0,
                            'outstanding': item.quantity
                        })

                # Create notification message
                notification_message = self._create_notification_message(
                    reservation_id=reservation_id,
                    status=reservation.status,
                    admin=usernameAdmin,
                    returned_items=returned_items if returned_items else None
                )

                # Create notifications
                user = get_object_or_404(User, username=username)
                Notification.objects.create(
                    user=user,
                    message=notification_message,
                    read=False
                )

                # Notify admins
                for admin in User.objects.filter(role='admin'):
                    Notification.objects.create(
                        user=admin,
                        message=f'Reservation {reservation_id} updated by {usernameAdmin}',
                        read=False
                    )

                # Send email notification
                self._send_email_notification(
                    email=user.email,
                    first_name=user.first_name,
                    reservation_id=reservation_id,
                    message=notification_message
                )

                return Response({
                    'admin': usernameAdmin,
                    'message': 'Reservation updated successfully',
                    'status': reservation.status,
                    'remarks': reservation.remarks,
                    'returned_summary': returned_summary
                }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Error updating reservation: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'message': 'An error occurred',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    def _create_notification_message(self, reservation_id, status, admin, returned_items=None):
        status_messages = {
            "PENDING": "is now pending review",
            "APPROVED/AWAITING RETURN": "has been approved and is awaiting return",
            "REJECTED": "has been rejected",
            "CANCELLED": "has been cancelled",
            "PARTIALLY_RETURNED": "has been partially returned",
            "DAMAGED/LOST/PARTIALLY_COMPLETED": "has damaged/lost items",
            "COMPLETED": "has been completed successfully",
            "AWAITING PAYMENT": "is awaiting payment for damaged items"
        }
        
        message = f'Your reservation {reservation_id} {status_messages.get(status, "has been updated")} by {admin}.'
        
        if returned_items:
            message += "\n\nDetails of returned items:"
            for item_id, data in returned_items.items():
                try:
                    reservation_item = ReservationItem.objects.get(id=int(item_id))
                    product_name = reservation_item.product.name
                    message += f"\nItem {product_name} (ID: {item_id}):"
                    message += f"\n - Returned: {data.get('returned', 0)}"
                    message += f"\n - Damaged: {data.get('damaged', 0)}"
                except (ValueError, ReservationItem.DoesNotExist):
                    message += f"\nItem ID {item_id}:"
                    message += f"\n - Returned: {data.get('returned', 0)}"
                    message += f"\n - Damaged: {data.get('damaged', 0)}"
        
        return message

    def _send_email_notification(self, email, first_name, reservation_id, message):
        subject = f"Reservation {reservation_id} Status Update"
        email_message = f"Dear {first_name},\n\n{message}\n\nThank you."
        send_mail(
            subject,
            email_message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
    
    # In the AdminUpdateReservationStatusAPIView class, add this method
    def verify_payment_proof(self, request):
        try:
            payment_proof_id = request.data.get('payment_proof_id')
            verified = request.data.get('verified', True)
            
            payment_proof = get_object_or_404(PaymentProof, id=payment_proof_id)
            payment_proof.verified = verified
            payment_proof.save()
            
            # If verifying the payment, update the reservation status
            if verified:
                reservation = payment_proof.reservation
                reservation.status = 'PAYMENT_VERIFIED'
                reservation.save()
                
                # Create notification for user
                Notification.objects.create(
                    user=reservation.user,
                    message=f'Your payment for reservation {reservation.reservation_id} has been verified.',
                    read=False
                )
            
            return Response({
                'message': 'Payment proof verification updated',
                'payment_proof': PaymentProofSerializer(payment_proof).data
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({
                'message': 'An error occurred',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


def create_presigned_post(bucket_name, object_name, fields=None, conditions=None, expiration=3600):
    s3_client = boto3.client(
        's3',
        endpoint_url=f"https://s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com",  # <-- ADD THIS
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME
    )
    try:
        response = s3_client.generate_presigned_post(
            bucket_name,
            object_name,
            Fields=fields,
            Conditions=conditions,
            ExpiresIn=expiration
        )
    except ClientError as e:
        logging.error(e)
        return None
    return response


class GeneratePaymentProofPresignedUrl(APIView):
    permission_classes = [IsAuthenticated]
    

    def post(self, request):
        file_name = request.data.get('file_name')
        file_type = request.data.get('file_type')

        if not file_name or not file_type:
            return Response({'error': 'File name and file type are required'}, status=400)

        bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        object_name = f"payment_proofs/{file_name}"

        # Use the same function as in products/views.py
        presigned_post = create_presigned_post(
            bucket_name, 
            object_name, 
            fields={"Content-Type": file_type}, 
            conditions=[{"Content-Type": file_type}]
        )

        if presigned_post is None:
            return Response({'error': 'Could not generate presigned URL'}, status=500)

        return Response({'url': presigned_post['url'], 'fields': presigned_post['fields']}, status=200)

class PaymentProofUploadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            token = request.COOKIES.get('jwt_access_token')
            if not token:
                return Response({'message': 'Authentication required'}, 
                             status=status.HTTP_401_UNAUTHORIZED)
            
            try:
                decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                username = decoded_token.get('username')
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
                return Response({'message': 'Invalid or expired token'}, 
                             status=status.HTTP_401_UNAUTHORIZED)
            
            reservation_id = request.data.get('reservationId')
            image_names = request.data.get('imageNames', [])
            
            if not reservation_id:
                return Response({'message': 'Reservation ID is required'}, 
                             status=status.HTTP_400_BAD_REQUEST)
            
            if not image_names:
                return Response({'message': 'No image names provided'}, 
                             status=status.HTTP_400_BAD_REQUEST)
            
            reservation = get_object_or_404(Reservation, reservation_id=reservation_id)
            
            # Check if the user owns this reservation or is an admin
            if reservation.user.username != username and decoded_token.get('role') != 'admin':
                return Response({'message': 'Unauthorized access'}, 
                             status=status.HTTP_403_FORBIDDEN)
            
            # Process the image names
            uploaded_proofs = []
            for image_name in image_names:
                # Create the S3 file path
                image_path = f"payment_proofs/{image_name}"
                
                # Create PaymentProof record
                payment_proof = PaymentProof.objects.create(
                    reservation=reservation,
                    image=image_path
                )
                uploaded_proofs.append(PaymentProofSerializer(payment_proof).data)
            
            # Update reservation status to mark as payment submitted
            if reservation.status == 'DAMAGED/LOST/PARTIALLY_COMPLETED':
                reservation.status = 'PAYMENT_SUBMITTED'
                reservation.save()
                
                # Create notification for admin
                admin_notification = f"Payment proof submitted for reservation {reservation_id} by {username}."
                for admin in User.objects.filter(role='admin'):
                    Notification.objects.create(
                        user=admin,
                        message=admin_notification,
                        read=False
                    )
                
                # Create notification for user
                user_notification = f"Your payment proof for reservation {reservation_id} has been submitted and is awaiting verification."
                Notification.objects.create(
                    user=reservation.user,
                    message=user_notification,
                    read=False
                )
            
            return Response({
                'message': 'Payment proof uploaded successfully',
                'payment_proofs': uploaded_proofs
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({
                'message': 'An error occurred',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)           

class PaymentProofListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, reservation_id):
        try:
            token = request.COOKIES.get('jwt_access_token')
            if not token:
                return Response({'message': 'Authentication required'}, 
                             status=status.HTTP_401_UNAUTHORIZED)
            
            try:
                decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                username = decoded_token.get('username')
                role = decoded_token.get('role')
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
                return Response({'message': 'Invalid or expired token'}, 
                             status=status.HTTP_401_UNAUTHORIZED)
            
            reservation = get_object_or_404(Reservation, reservation_id=reservation_id)
            
            # Check if the user owns this reservation or is an admin
            if reservation.user.username != username and role != 'admin':
                return Response({'message': 'Unauthorized access'}, 
                             status=status.HTTP_403_FORBIDDEN)
            
            payment_proofs = PaymentProof.objects.filter(reservation=reservation)
            serializer = PaymentProofSerializer(payment_proofs, many=True)
            
            return Response({
                'payment_proofs': serializer.data
            }, status=status.HTTP_200_OK)
        
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

















# # class UserNotificationsAPIView(APIView):
# #     def get(self, request):
# #         user = request.user
# #         notifications = Notification.objects.filter(user=user).order_by('-created_at')
# #         serializer = NotificationSerializer(notifications, many=True)
# #         return Response(serializer.data, status=status.HTTP_200_OK)
    
# # class AdminNotificationsAPIView(APIView):
# #     def get(self, request):
# #         if not request.user.is_superuser:
# #             return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
# #         notifications = Notification.objects.all().order_by('-created_at')
# #         serializer = NotificationSerializer(notifications, many=True)
# #         return Response(serializer.data, status=status.HTTP_200_OK)


# # class ReservationUpdateView(APIView):
# #     def put(self, request):
# #         # username = request.query_params.get('username')
# #         # product_id = request.query_params.get('product_id')
# #         try:
            
# #             reservation_id = request.data.get('reservationId')
# #             product_id = request.data.get('productId')
# #             quantity = request.data.get('quantity')
# #             reservation_date = request.data.get('reservation_date')


# #             product = Product.objects.get(productId=product_id)

# #             if product.quantity < quantity:
# #                 return Response({
# #                     'message': 'Not enough stocks available'
# #                 }, status=400)
            
            


            
# #             reservation = Reservation.objects.get(reservation_id=reservation_id)


# #             if product_id:
# #                 reservation.product_id = product_id
            
# #             if quantity:
# #                 reservation.quantity = quantity

# #             if reservation_date:
# #                 reservation.reservation_date = reservation_date

# #             reservation.save()

# #             return Response({
# #                 'message': 'Reservation updated successfully'
# #             }, status=200)
        
# #         except Reservation.DoesNotExist:
# #             return Response({"error": "Reservation not found"}, status=status.HTTP_404_NOT_FOUND)
# #         except:
# #             return Response({
# #                 'message': 'An error occurred'
# #             }, status=400)
        




# # class LongPollingAPIView(APIView):
# #     def get(self, request):
# #         token = request.COOKIES.get('jwt_access_token')
# #         if not token:
# #             print('Authentication required: No token provided')
# #             return JsonResponse({'error': 'Authentication required'}, status=401)

# #         try:
# #             decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
# #             username = decoded_token.get('username')
# #         except jwt.ExpiredSignatureError:
# #             print(f'Token expired for username: {username}')
# #             return JsonResponse({'error': 'Token expired'}, status=401)
# #         except jwt.InvalidTokenError:
# #             print(f'Invalid token for username: {username}')
# #             return JsonResponse({'error': 'Invalid token'}, status=401)

# #         last_timestamp = request.GET.get('last_timestamp')
# #         print(f'Last timestamp received: {last_timestamp}')
        
# #         if last_timestamp:
# #             last_timestamp = parse_datetime(last_timestamp)

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

from django.shortcuts import render
from rest_framework.views import APIView
from .models import Category, Product, ProductType
from .serializers import ProductImageSerializer, CategorySerializer,ProductImageonlySerializer, ProductTypeSerializer
from rest_framework.response import Response
import re
from rest_framework.permissions import IsAuthenticated
import pandas as pd
from django.http import HttpResponse
import io
import rest_framework.status as status
# Create your views here.


class ProductTypeCRUD(APIView):
    # permission_classes = [IsAuthenticated]

        
        # Create or Update
    def post(self, request):
        try:
            category_id = request.data.get('category_id')
            name = request.data.get('name')
            description = request.data.get('description')

            if not all([category_id, name]):
                return Response({
                    'message': 'Category ID and Name are required'
                }, status=status.HTTP_400_BAD_REQUEST)

            category, created = Category.objects.get_or_create(categoryId=category_id)

            product_type, created = ProductType.objects.update_or_create(
                name=name,  # Use 'name' as the unique identifier
                defaults={
                    'category': category,
                    'description': description
                }
            )

            action = 'created' if created else 'updated'
            return Response({
                'message': f'Product type {action} successfully',
                'product_type': ProductTypeSerializer(product_type).data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'message': f'An error occurred: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    # Read
    def get(self, request):
        category_id = request.query_params.get('category_id')
        try:
            if category_id:
                category = Category.objects.get(categoryId=category_id)
                product_types = ProductType.objects.filter(category=category)
                product_types = ProductTypeSerializer(product_types, many=True)
                return Response({
                    'product_types': product_types.data,
                    'message': 'Product types retrieved successfully'
                }, status=status.HTTP_200_OK)
            else:
                product_types = ProductType.objects.all()
                product_types = ProductTypeSerializer(product_types, many=True)
                return Response({
                    'product_types': product_types.data,
                    'message': 'Product types retrieved successfully'
                }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'message': f'An error occurred: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


    # Delete
    def delete(self, request):
        try:
            name = request.data.get('name')  # Use 'name' instead of 'id'

            if not name:
                return Response({
                    'message': 'Product type name is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            product_type = ProductType.objects.get(name=name)
            product_type.delete()

            return Response({
                'message': 'Product type deleted successfully'
            }, status=status.HTTP_200_OK)
        except ProductType.DoesNotExist:
            return Response({
                'message': 'Product type not found'
            }, status=status.HTTP_404_NOT_FOUND)


#excel import at export here
class ExportImportProductView(APIView):
    permission_classes = [IsAuthenticated]  # Uncomment if you want to enforce authentication
    
    # exporter
    def get(self, request):
        products = Product.objects.all()
        serializer = ProductImageSerializer(products, many=True)
        data = serializer.data
        
        # Convert data to DataFrame
        df = pd.DataFrame(data)
        
        # Create an in-memory output file for the HTTP response
        output = io.BytesIO()
        df.to_excel(output, index=False, engine='openpyxl')
        output.seek(0)  # Move to the beginning of the BytesIO object
        
        # Create the HTTP response with the Excel file
        response = HttpResponse(output, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="products.xlsx"'
        
        return response

    # importer
    def post(self, request):
        try:
            file = request.FILES['file']
            df = pd.read_excel(file)
            products = df.to_dict(orient='records')
            
            for product in products:
                # Handle category creation if it does not exist
                category_id = product['category']
                category, created = Category.objects.get_or_create(
                    categoryId=category_id,
                    defaults={
                        'name': f'Default Name {category_id}',  # Ensure unique names
                        'description': 'Default Description',
                        'icon': 'DefaultIcon'
                    }
                )
                
                # Use update_or_create to handle product creation or update
                Product.objects.update_or_create(
                    productId=product['productId'],  # Match on productId to avoid duplicates
                    defaults={
                        'name': product['name'],
                        'description': product['description'],
                        'type': product.get('type', 'Default Type'),
                        'price': product['price'],
                        'quantity': product['quantity'],
                        'reserved': product.get('reserved', 0),
                        'broken_damaged': product.get('broken_damaged', 0),
                        'category': category
                    }
                )
            
            return Response({
                'message': 'Products uploaded and updated successfully'
            }, status=201)
        except Exception as e:
            return Response({
                'message': f'An error occurred: {str(e)}'
            }, status=400)


class createCategory(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            categoryId = request.data.get('categoryId')
            name = request.data.get('name')
            description = request.data.get('description')
            icon = request.data.get('icon')

            if not all([name, description, categoryId]):
                return Response({
                    'message': 'All fields are required'
                }, status=400)

            Category.objects.create(
                categoryId=categoryId,
                name=name,
                description=description,
                icon=icon
            )

            return Response({
                'message': 'Category created successfully'
            }, status=201)

        except Exception as e:
            return Response({
                'message': f'An error occurred: {str(e)}'
            }, status=400)

class editCategory(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request):
        try:
            categoryId = request.data.get('categoryId')
            name = request.data.get('name')
            description = request.data.get('description')
            icon = request.data.get('icon')

            if not categoryId:
                return Response({
                    'message': 'Category ID is required'
                }, status=400)

            category = Category.objects.get(categoryId=categoryId)

            if name:
                category.name = name

            if description:
                category.description = description

            if icon:
                category.icon = icon

            category.save()

            return Response({
                'message': 'Category updated successfully'
            }, status=200)

        except Category.DoesNotExist:
            return Response({
                'message': 'Category not found'
            }, status=404)

        except Exception as e:
            return Response({
                'message': f'An error occurred: {str(e)}'
            }, status=400)

class deleteCategory(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request):
        try:
            categoryId = request.data.get('categoryId')

            if not categoryId:
                return Response({
                    'message': 'Category ID is required'
                }, status=400)

            category = Category.objects.get(categoryId=categoryId)
            category.delete()

            return Response({
                'message': 'Category deleted successfully'
            }, status=200)

        except Category.DoesNotExist:
            return Response({
                'message': 'Category not found'
            }, status=404)

        except Exception as e:
            return Response({
                'message': f'An error occurred: {str(e)}'
            }, status=400)

class RetrieveCategory(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request):
        try:
            categories = Category.objects.all()
            categories = CategorySerializer(categories, many=True)

            return Response({
                'categories': categories.data,
                'message': 'Categories retrieved successfully'
            }, status=200)
        except:
            return Response({
                'message': 'An error occurred'
            }, status=400)

#pangkuha ng latest na number ng prodID
class RetrieveProductIDView(APIView):
    # permission_classes = [IsAuthenticated]

    def get(self, request):
        categoryID = request.query_params.get('categoryID')

        try:
            if Product.objects.all().exists():
                products = Product.objects.filter(category_id=categoryID)
                
                if not products.exists():
                    prefix = Category.objects.get(categoryId=categoryID).name[:3].upper()
                    return Response({'nextProductId': f'{prefix}-1'}, status=200)
                

                products = ProductImageSerializer(products, many=True)

                prefix = products.data[0]['productId'].split('-')[0]
                products = Product.objects.filter(productId__startswith=prefix)
                existing_numbers = set()

                for product in products:
                    match = re.match(rf'{prefix}-(\d+)', product.productId)
                    if match:
                        existing_numbers.add(int(match.group(1)))
                
                # Find the first available number
                number = 1
                while number in existing_numbers:
                    number += 1
                return Response({'nextProductId': f'{prefix}-{number}'}, status=200)
                
            else:
                return Response({'message': 'No products available'}, status=404)
        except Exception as e:
            return Response({'message': 'An error occurred', 'error': str(e)}, status=400)     

class RetrieveProductImage(APIView):
    # permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            categoryID = request.query_params.get('categoryID')  # Get categoryID from query params



            print(f"Category ID: {categoryID}")

            # Check if categoryID is either None, an empty string, or any other falsy value
            if not categoryID or categoryID is None:  # If categoryID is falsy (None, empty, etc.), return all products
                images = Product.objects.all().order_by('-created_at')
            else:
                images = Product.objects.filter(category_id=categoryID)

            return Response({
                'images': ProductImageonlySerializer(images, many=True).data,
                'message': 'Products retrieved successfully',
            }, status=200)

        except Exception as e:
            return Response({
                'message': 'An error occurred',
                'error': str(e)
            }, status=400)
  
class RetrieveProductAdmin(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            categoryID = request.data.get('categoryID')  # Use query params to get categoryID
            if categoryID:
                products = Product.objects.filter(category_id=categoryID)
                products = ProductImageSerializer(products, many=True)
                return Response({
                    'products': products.data,
                    'message': 'Products retrieved successfully',
                }, status=200)
            
            elif not categoryID:

                products = Product.objects.all()
                products = ProductImageSerializer(products, many=True)
                return Response({
                    'products': products.data,
                    'message': 'Products retrieved successfully',
                }, status=200)
            
            else:
                return Response({
                    'message': 'No products available'
                }, status=404)
        except Exception as e:
            return Response({
                'message': 'An error occurred',
                'error': str(e)
            }, status=400)


class UploadProduct(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            name = request.data.get('name')
            description = request.data.get('description')
            price = request.data.get('price')
            quantity = request.data.get('quantity')
            category = request.data.get('category')
            image = request.FILES.get('image')
            type_name = request.data.get('type')  # Retrieve the product type
            print("image: ",image)
            

            print(f"Received data: name={name}, description={description}, price={price}, quantity={quantity}, category={category}, image={image}")

            if not all([name, description, price, quantity]):
                return Response({
                    'message': 'All fields except category are required'
                }, status=400)

            if category:
                category = Category.objects.get(name=category.lower())
                
            else:
                category, created = Category.objects.get_or_create(categoryId='DEF', name='Default Category', defaults={'description': 'This is a default category.'})

            product_type = ProductType.objects.get(name=type_name)
            product = Product.objects.create(
                name=name,
                description=description,
                price=price,
                category=category, 
                type=product_type,
                quantity=quantity,
                image=image
            )

            return Response({
                'message': 'Product uploaded successfully',
                'productId': product.productId,
                'category': product.category.name
            }, status=201)

        except Category.DoesNotExist:
            return Response({
                'message': 'Category not found'
            }, status=404)
        except Exception as e:
            return Response({
                'message': f'An error occurred: {str(e)}'
            }, status=400)



class updateProductView(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request):
        try:
            productId = request.data.get('productId')
            name = request.data.get('name')
            description = request.data.get('description')
            price = request.data.get('price')
            category = request.data.get('category')
            quantity = request.data.get('quantity')
            image = request.FILES.get('image')
            type = request.data.get('type')

            if not productId:
                return Response({
                    'message': 'Product ID is required'
                }, status=400)
            

            product = Product.objects.get(productId=productId)

            if name:
                product.name = name

            if description:
                product.description = description

            if price:
                product.price = price

            if category:
                product.category = Category.objects.get(categoryId=category)

            if quantity:
                product.quantity = quantity

            if type:
                product.type = type

            if image:
                product.image = image
            else:
                product.image = product.image

            product.save()

            return Response({
                'message': 'Product updated successfully'
            }, status=200)

        except Product.DoesNotExist:
            return Response({
                'message': 'Product not found'
            }, status=404)

        except Category.DoesNotExist:
            return Response({
                'message': 'Category not found'
            }, status=404)

        except Exception as e:
            return Response({
                'message': f'An error occurred: {str(e)}'
            }, status=400)


class deleteProductView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request):
        try:
            productId = request.data.get('productId')

            if not productId:
                return Response({
                    'message': 'Product ID is required'
                }, status=400)

            product = Product.objects.get(productId=productId)
            product.delete()

            return Response({
                'message': 'Product deleted successfully'
            }, status=200)

        except Product.DoesNotExist:
            return Response({
                'message': 'Product not found'
            }, status=404)

        except Exception as e:
            return Response({
                'message': f'An error occurred: {str(e)}'
            }, status=400)


class SearchProductView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            searchWord = request.query_params.get('searchWord')

            if searchWord:
                # Start with all products
                products = Product.objects.all()

                # Filter products by name
                products = products.filter(name__icontains=searchWord)

                # Filter products by category name
                products = products.filter(category__name__icontains=searchWord)

                # Filter products by product ID
                products = products.filter(productId__icontains=searchWord)

                # Serialize the filtered products
                products = ProductImageSerializer(products, many=True)

                return Response({
                    'products': products.data,
                    'message': 'Products retrieved successfully'
                }, status=200)

            else:
                return Response({
                    'message': 'No search word provided'
                }, status=400)
        except Exception as e:
            return Response({
                'message': 'An error occurred',
                'error': str(e)  # Include the actual error message in the response
            }, status=400)

# views.py
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView  # Import ng APIView mula sa rest_framework para sa Django
from .serializers import UserSerializer  # Import ng UserSerializer na ginawa natin
from rest_framework.response import Response  # Import para sa pag-return ng response
from .models import User  # Import ng User model na ginawa natin
from rest_framework.exceptions import AuthenticationFailed  # Import ng error handler para sa authentication
import jwt  # Import ng JWT at datetime para sa token creation at manipulation
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
from django.http import JsonResponse
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from django.contrib.auth.hashers import make_password
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework import status
import jwt
from rest_framework.permissions import IsAuthenticated
import io
import pandas as pd
from django.http import HttpResponse
from django.core.mail import send_mail
from uuid import uuid4



# Excel import export here
class ExportImportUserView(APIView):
    # permission_classes = [IsAuthenticated]  # Uncomment if you want to enforce authentication
    
    def get(self, request):
        # Get the username parameter from the query string
        username = request.GET.get('username', None)
        
        # Fetch users from the database with optional filtering
        if username:
            users = User.objects.filter(username=username)
        else:
            users = User.objects.all()
        
        # Serialize the user data
        serializer = UserSerializer(users, many=True)
        data = serializer.data
        
        # Convert data to DataFrame
        df = pd.DataFrame(data)
        
        # Create an in-memory output file for the HTTP response
        output = io.BytesIO()
        df.to_excel(output, index=False, engine='openpyxl')
        output.seek(0)  # Move to the beginning of the BytesIO object
        
        # Create the HTTP response with the Excel file
        response = HttpResponse(output, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="users.xlsx"'
        
        return response

    def post(self, request):
        try:
            file = request.FILES['file']
            df = pd.read_excel(file)
            users = df.to_dict(orient='records')
            
            for user in users:
                # Hash the password if it is provided
                password = user.get('password', '')
                if password:
                    hashed_password = make_password(password)
                else:
                    hashed_password = ''
                
                # Create or update the user
                User.objects.update_or_create(
                    username=user['username'],
                    defaults={
                        'first_name': user.get('first_name', ''),
                        'last_name': user.get('last_name', ''),
                        'email': user.get('email', ''),
                        'password': hashed_password,
                        'role': user.get('role', 'guest')
                    }
                )
            
            return Response({
                'message': 'Users uploaded successfully'
            }, status=201)
        except Exception as e:
            return Response({
                'message': f'An error occurred: {str(e)}'
            }, status=400)


class adminUpdateUsersView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        class_section = request.query_params.get('class_section')
        if class_section:
            users = User.objects.filter(class_section=class_section)
        else:
            users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def put(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')  # Get the password from the request
        locked_account = request.data.get('locked_out')
        
        if username is None or email is None:
            return Response({'error': 'Username and email are required'}, status=400)
        
        try:
            user = User.objects.get(username=username)
            if password:
                request.data['password'] = make_password(password)
            
            if locked_account is not None:
                user.locked_out = locked_account
                print("Is user locked: ",user.locked_out)
                
            
            serializer = UserSerializer(instance=user, data=request.data, partial=True)  
            serializer.is_valid(raise_exception=True)
            
            serializer.save()
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
            

    def delete(self, request):
        try:
            username = request.data.get('username')
            email = request.data.get('email')
            if username is None and email is None:
                return Response({'error': 'Username or email is required'}, status=400)

            
            user = User.objects.get(Q(username=username) | Q(email=email))
            user.delete()

            return Response('User deleted')
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)


class forgetPasswordView(APIView):
    # def post(self, request):
    #     email = request.data.get('email')
    #     if email is None:
    #         return Response({'error': 'Email is required'}, status=400)
        
    #     try:
    #         user = User.objects.get(email=email)
    #         return Response({'message': 'Email sent'})
    #     except User.DoesNotExist:
    #         return Response({'error': 'User not found'}, status=404)    
    def put(self, request):
        email = request.data.get('email')
        username = request.data.get('username')
        password = request.data.get('password')
        if email is None or password is None and username is None:
            return Response({'error': 'Email or username and password are required'}, status=400)
        
        try:
            user = User.objects.get(Q(username=username) | Q(email=email))
            user.password = make_password(password)
            user.save()
            return Response({'message': 'Password reset successful'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)    

# API view para sa pag-register ng user
class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Send verification email
        verification_link = f"{settings.FRONTEND_URL}/verification/{user.verification_token}"
        # verification_link = f"{settings.FRONTEND_URL}/"
        send_mail(
            'Verify your email',
            f'Click the link to verify your email: {verification_link}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

        return Response({'message': 'Registration successful. Please check your email to verify your account.'}, status=status.HTTP_201_CREATED)


class VerifyEmailView(APIView):
    def get(self, request, token):
        try:
            user = get_object_or_404(User, verification_token=token)
            user.is_active = True
            user.verification_token = uuid4()  # Assign a random value if NULL is not allowed
            user.save()
            return Response({'message': 'Email verified successfully'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    
# API view para kunin ang details ng user gamit ang JWT token
class UserView(APIView):
    def get(self, request):
        token = request.COOKIES.get('jwt_access_token')  # Retrieve token from cookies (adjust as needed)

        if not token:
            raise AuthenticationFailed('Unauthenticated')

        try:
            # Decode token with 'secret' key using HS256 algorithm
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            print(payload)


            
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Expired')  # Handle expired token

        except jwt.DecodeError:
            raise AuthenticationFailed('Invalid token')  # Handle invalid token
        

      
        user = User.objects.filter(id=payload['user_id']).first()
        serializer = UserSerializer(user)

        return Response({
            'user': serializer.data,
            'role': user.role,
        })




# API view para sa pag-logout ng userfrom rest_framework.views import APIView

class LogoutView(APIView):
    
    def get(self, request):
        response = Response()
        response.delete_cookie('jwt_access_token', path='/', samesite='None')
        response.delete_cookie('jwt_refresh_token', path='/', samesite='None')
        
        token = request.COOKIES.get('jwt_access_token')
        token2 = request.COOKIES.get('jwt_refresh_token')
        
        print(f"Access token before deletion: {token}")
        print(f"Refresh token before deletion: {token2}")
        
        response.data = {
            'message': 'success',
            'message2': token,
            'message3': token2,
        }
        return response
# panglagay sa cookies ng token para thru cookies ang usapan ng backend at frontend kung sino ang currently nagamit pang LOGIN


class MyTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        try:
            # Get the user based on the username provided in the request data
            user = get_object_or_404(User, username=request.data['username'])

            # Check if the user account is locked
            if user.locked_out:
                return Response({'detail': 'User account is locked'}, status=status.HTTP_403_FORBIDDEN)

            # Check if the user is active
            if not user.is_active:
                return Response({'detail': 'User account is not active. Please verify your email.'}, status=status.HTTP_403_FORBIDDEN)

            # Call the parent class's post method to handle the initial token generation
            response = super().post(request, *args, **kwargs)

            # Check if access token exists in the response
            if 'access' in response.data:
                access_token = response.data['access']
                refresh_token = response.data['refresh']

                # Decode the access token payload to modify it
                payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=['HS256'])

                # Add role and username to the payload
                payload['role'] = user.role
                payload['username'] = user.username

                # Check if the user has a class_section assigned and print it for debugging
                if user.class_section:
                    class_section_value = user.class_section.class_section  # Adjust to the right field
                    print(f"Class section value: {class_section_value}")  # Debugging line
                    payload['class_section'] = class_section_value
                else:
                    payload['class_section'] = None
                    print("User has no class_section")  # Debugging line

                # Print the payload to ensure it's correct before encoding
                print(f"Modified payload: {payload}")  # Debugging line

                # Encode a new access token with the updated payload
                new_access_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
                print(f"Encoded JWT: {new_access_token}") 
                # Set the new token in the response cookies
                response.set_cookie(key='jwt_access_token', value=new_access_token, httponly=True, samesite='Lax')
                response.set_cookie(key='jwt_refresh_token', value=refresh_token, httponly=True, samesite='Lax')

            return response

        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except jwt.ExpiredSignatureError:
            return Response({'detail': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'detail': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
        except AuthenticationFailed as e:
            return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'detail': 'An error occurred', 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

def get_access_token(request):
    
    token = request.COOKIES.get('jwt_access_token')
    if token:
        return JsonResponse({'jwt_access_token': token})
    else:
        return JsonResponse({'jwt_access_token': None})
    


class RefreshTokenView(APIView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('jwt_refresh_token')
        if refresh_token is None:
            return Response({'error': 'Refresh token not found'}, status=400)

        try:
            # Decode the refresh token to access the user info
            token = RefreshToken(refresh_token)
            access_token = token.access_token

            # Decode the access token to modify the payload
            payload = jwt.decode(str(access_token), settings.SECRET_KEY, algorithms=['HS256'])

            # Get the user associated with the refresh token
            user = User.objects.get(id=payload['user_id'])

            # Add user role and username to the payload
            payload['role'] = user.role
            payload['username'] = user.username
            
            # Check if the user has a class_section assigned and print it for debugging
            if user.class_section:
                    class_section_value = user.class_section.class_section  # Adjust to the right field
                    print(f"Class section value: {class_section_value}")  # Debugging line
                    payload['class_section'] = class_section_value
            else:
                    payload['class_section'] = None
                    print("User has no class_section")  # Debugging line
            # Encode the new access token with the updated payload
            new_access_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

            # If new_access_token is in bytes, decode it to a string
            if isinstance(new_access_token, bytes):
                new_access_token = new_access_token.decode('utf-8')

            # Return the new access token in the response and set it as a cookie
            response = Response({'access': new_access_token}, status=200)
            response.set_cookie(key='jwt_access_token', value=new_access_token, httponly=True, samesite='None', secure=True)
            return response

        except Exception as e:
            return Response({'error': str(e)}, status=400)
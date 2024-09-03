# views.py
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

class adminUpdateUsersView(APIView):
    def get(self, request):
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
        
        if username is None or email is None:
            return Response({'error': 'Username and email are required'}, status=400)
        
        try:
            user = User.objects.get(username=username)
            if password:
                request.data['password'] = make_password(password)
            
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




# API view para sa pag-register ng user
class RegisterView(APIView):    
    def post(self, request):
        serializer = UserSerializer(data=request.data)  # Gamitin ang UserSerializer para sa validation ng data
        serializer.is_valid(raise_exception=True)  # I-validate ang data, kung may error, itaas ang exception
        serializer.save()  # I-save ang validated na data sa database
        return Response(serializer.data)  # I-return ang serialized na data bilang response


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




# API view para sa pag-logout ng user
class LogoutView(APIView):
    
    def get(self, request):
        response = Response()
        response.delete_cookie('jwt_access_token')
        response.delete_cookie('jwt_refresh_token')
        token = request.COOKIES.get('jwt_access_token')
        token2 = request.COOKIES.get('jwt_refresh_token')
        response.data = {
            'message': 'success',
            'message2': {token},
             'message3': {token2},
        }
        return response
    

# panglagay sa cookies ng token para thru cookies ang usapan ng backend at frontend kung sino ang currently nagamit pang LOGIN
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework import status
import jwt

class MyTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            print(response.data)

            if 'access' in response.data:
                access_token = response.data['access']
                refresh_token = response.data['refresh']

                # Get user and role
                user = User.objects.get(username=request.data['username'])
                if not user:
                    raise AuthenticationFailed('User not found')

                payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=['HS256'])

                # Add user role and username to the payload
                payload['role'] = user.role
                payload['username'] = user.username

                # Encode new token with the additional info
                new_access_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

                # Set cookies in response
                response.set_cookie(key='jwt_access_token', value=new_access_token, httponly=True)
                response.set_cookie(key='jwt_refresh_token', value=refresh_token, httponly=True)

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
            token = RefreshToken(refresh_token)
            access_token = token.access_token

            response = Response({'access': str(access_token)}, status=200)
            response.set_cookie(key='jwt_access_token', value=str(access_token), httponly=True)
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=400)
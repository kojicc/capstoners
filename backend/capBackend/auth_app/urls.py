# urls.py (app auth level)
from django.urls import path
from .views import RegisterView, UserView, LogoutView,MyTokenObtainPairView,get_access_token,RefreshTokenView,adminUpdateUsersView,forgetPasswordView,ExportImportUserView,VerifyEmailView,sendForgetPasswordEmailView, SendResetCodeView, VerifyResetCodeView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),  # Custom token obtain view
    path('token/refresh-from-cookie/', RefreshTokenView.as_view(), name='token_refresh_from_cookie'),
    path('user/', UserView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('get-access-token/', get_access_token),
    path('adminupdateUsers/', adminUpdateUsersView.as_view()),
    path('forgetPassword/', forgetPasswordView.as_view()),
    path('exportimportUser/', ExportImportUserView.as_view()),
    path('verify-email/<uuid:token>/', VerifyEmailView.as_view(), name='verify-email'),
    path('forgetPasswordEmail/', sendForgetPasswordEmailView.as_view()),
    path('send_reset_code/', SendResetCodeView.as_view(), name='send_reset_code'),
    path('verify_reset_code/', VerifyResetCodeView.as_view(), name='verify_reset_code'),



]

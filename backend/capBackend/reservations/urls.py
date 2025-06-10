# urls.py (app auth level)
from django.urls import path
from .views import ReservationCreateUpdateAPIView, ReservationDetailAPIView,  ReservationDeleteView, ReservationSearchView ,showNotification,readNotification,AdminUpdateReservationStatusAPIView,AdminReservationDetailAPIView,ReservationCartAPIView,ReservationImportExportView, ClassScheduleCRUDAPIView, PaymentProofUploadView, PaymentProofListView, GeneratePaymentProofPresignedUrl
urlpatterns = [
    path('classScheduleCRUD/', ClassScheduleCRUDAPIView.as_view(), name='classScheduleCRUD'),
    path('reservationsCreateUpdate/', ReservationCreateUpdateAPIView.as_view(), name='reservationsCreate'),
    path('adminUpdateReservationStatus/', AdminUpdateReservationStatusAPIView.as_view(), name='adminUpdateReservationStatus'),
    path('reservationsDetail/', ReservationDetailAPIView.as_view(), name='reservationsDetail'),
    path('adminReservationDetail/', AdminReservationDetailAPIView.as_view(), name='adminReservationDetail'),
    # path('reservationsUpdate/', ReservationUpdateView.as_view(), name='reservationsUpdate'),
    path('reservationsDelete/', ReservationDeleteView.as_view(), name='reservationsDelete'),
    path('reservationsSearch/', ReservationSearchView.as_view(), name='reservationsSearch'),
    # path('reservationsCartAdd/', ReservationCartCreateAPIView.as_view(), name='reservationsCartAdd'),
    # path('reservationsCartList/', ReservationCartListAPIView.as_view(), name='reservationsCartList'),
    path('showNotification/', showNotification.as_view(), name='showNotification'),
    path('mark_as_read/', readNotification.as_view(), name='mark_as_read'),
    path('reservationsCart/', ReservationCartAPIView.as_view(), name='reservationsCart'),
    path('importExportReservations/', ReservationImportExportView.as_view(), name='importExportReservations'),
    path('payment-proof-upload/', PaymentProofUploadView.as_view(), name='payment-proof-upload'),
    path('payment-proof-list/', PaymentProofListView.as_view(), name='payment-proof-list'),
    path('generate-payment-proof-url/', GeneratePaymentProofPresignedUrl.as_view(), name='generate-payment-proof-url'),

    

    #  path('user/notifications/', UserNotificationsAPIView.as_view(), name='user_notifications'),
    # path('admin/notifications/', AdminNotificationsAPIView.as_view(), name='admin_notifications'),
   
]

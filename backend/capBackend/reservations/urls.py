# urls.py (app auth level)
from django.urls import path
from .views import ReservationCreateUpdateAPIView, ReservationDetailAPIView,  ReservationDeleteView, ReservationSearchView, ReservationCartCreateAPIView, LongPollingAPIView,showNotification,LongPollingAPIView,readNotification,AdminUpdateReservationStatusAPIView,AdminReservationDetailAPIView
urlpatterns = [
    path('reservationsCreateUpdate/', ReservationCreateUpdateAPIView.as_view(), name='reservationsCreate'),
    path('adminUpdateReservationStatus/', AdminUpdateReservationStatusAPIView.as_view(), name='adminUpdateReservationStatus'),
    path('reservationsDetail/', ReservationDetailAPIView.as_view(), name='reservationsDetail'),
    path('adminReservationDetail/', AdminReservationDetailAPIView.as_view(), name='adminReservationDetail'),
    # path('reservationsUpdate/', ReservationUpdateView.as_view(), name='reservationsUpdate'),
    path('reservationsDelete/', ReservationDeleteView.as_view(), name='reservationsDelete'),
    path('reservationsSearch/', ReservationSearchView.as_view(), name='reservationsSearch'),
    path('reservationsCartAdd/', ReservationCartCreateAPIView.as_view(), name='reservationsCartAdd'),
    path('long-polling/', LongPollingAPIView.as_view(), name='long-polling'),
    path('showNotification/', showNotification.as_view(), name='showNotification'),
    path('long-polling/', LongPollingAPIView.as_view(), name='long-polling'),
    path('mark_as_read/', readNotification.as_view(), name='mark_as_read'),

    #  path('user/notifications/', UserNotificationsAPIView.as_view(), name='user_notifications'),
    # path('admin/notifications/', AdminNotificationsAPIView.as_view(), name='admin_notifications'),
   
]

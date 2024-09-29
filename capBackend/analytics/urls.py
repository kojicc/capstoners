from django.urls import path
from .views import getMostReservedProducts,getTotalPageViews,getTotalNewUsersEachMonth,getCompletedOrdersEachMonth,TotalStocksPerCategoryAPIView,TotalStocksPerCategoryAPIView,getTotalPendingOrders,getTotalUsers

urlpatterns = [
    
    path('total-page-views/', getTotalPageViews.as_view()),
    path('total-new-users/', getTotalNewUsersEachMonth.as_view()),
    path('total-completed-orders/', getCompletedOrdersEachMonth.as_view()),
    path('totalStocks/', TotalStocksPerCategoryAPIView.as_view()),
    path('most-reserved-products/', getMostReservedProducts.as_view()),
    path('pending-orders/', getTotalPendingOrders.as_view()),
    path('total-users/', getTotalUsers.as_view()),

]

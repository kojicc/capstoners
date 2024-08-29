# products/urls.py

from django.urls import path
from .views import RetrieveProductImage, UploadProduct, updateProductView, deleteProductView, createCategory, RetrieveCategory, RetrieveProductIDView,RetrieveProduct,deleteCategory,editCategory

urlpatterns = [
    path('addCategory/', createCategory.as_view(), name='addCategory'),
    path('getImages/', RetrieveProductImage.as_view()),
    path('uploadProduct/', UploadProduct.as_view(), name='uploadProduct'),
    path('updateProduct/', updateProductView.as_view()),
    path('deleteProduct/', deleteProductView.as_view()),
    path('getCategories/', RetrieveCategory.as_view()),
    path('getProduct/', RetrieveProductIDView.as_view()),
    path('getadminProductDetail/', RetrieveProduct.as_view()),
    path('deleteCategory/', deleteCategory.as_view()),
    path('editCategory/', editCategory.as_view()),

]

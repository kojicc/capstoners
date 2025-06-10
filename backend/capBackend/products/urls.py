# products/urls.py

from django.urls import path
from .views import RetrieveProductImage, UploadProduct, updateProductView, deleteProductView, createCategory, RetrieveCategory, RetrieveProductIDView,RetrieveProductAdmin,deleteCategory,editCategory,ExportImportProductView,ProductTypeCRUD,GeneratePresignedUrl,GetProductStats

urlpatterns = [
    path('generate-presigned-url/', GeneratePresignedUrl.as_view(), name='generate_presigned_url'),
    path('addCategory/', createCategory.as_view(), name='addCategory'),
    path('getImages/', RetrieveProductImage.as_view()),
    path('uploadProduct/', UploadProduct.as_view(), name='uploadProduct'),
    path('updateProduct/', updateProductView.as_view()),
    path('deleteProduct/', deleteProductView.as_view()),
    path('getCategories/', RetrieveCategory.as_view()),
    path('getProduct/', RetrieveProductIDView.as_view()),
    path('getadminProductDetail/', RetrieveProductAdmin.as_view()),
    path('deleteCategory/', deleteCategory.as_view()),
    path('editCategory/', editCategory.as_view()),
    path('exportimportProduct/', ExportImportProductView.as_view(), name='export-import-product'),
    path('producttypeCrud/', ProductTypeCRUD.as_view()),
    path('getProductStats/', GetProductStats.as_view(), name='get-product-stats'),
]

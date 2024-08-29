from django.db import models
import re

class Category(models.Model):
    categoryId = models.CharField(max_length=10, primary_key=True, default='DEFAULT')
    name = models.CharField(max_length=255)
    description = models.TextField()
    icon = models.CharField(max_length=255, default='IconToolsKitchen')

    def __str__(self):
        return self.name

class Product(models.Model):
    productId = models.CharField(max_length=20, unique=True,primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    image = models.ImageField(upload_to='products/images/', blank=True, default='products/images/default.png')
    # created_at = models.DateTimeField(auto_now_add=True)
    


    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.productId:
            # Generate product ID
            prefix = self.category.categoryId
            
            # Default prefix if no product ID set
            if not prefix:
                prefix = 'DEF' 

            # Get all product IDs with the same prefix
            products_with_prefix = Product.objects.filter(productId__startswith=prefix)
            existing_numbers = set()

            for product in products_with_prefix:
                match = re.match(rf'{prefix}-(\d+)', product.productId)
                if match:
                    existing_numbers.add(int(match.group(1)))
            
            # Find the first available number
            number = 1
            while number in existing_numbers:
                number += 1
            
            self.productId = f'{prefix}-{number}'


        if not self.image:
            self.image = 'products/images/default.png'
        
        super().save(*args, **kwargs)

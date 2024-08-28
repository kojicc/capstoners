import axios from './axiosInstance';

export const getProducts = async () => {
    try {
        const response = await axios.get('products/');
        return response.data;
    } catch (error) {
        console.error('Error fetching products:', error);
        return null;
    }
    };

export const getProduct = async (id) => {
    try {
        const response = await axios.get(`products/${id}/`);
        return response.data;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
};

export const createProduct = async (product) => {
    try {
        const response = await axios.post('products/', product);
        return response.data;
    } catch (error) {
        console.error('Error creating product:', error);
        return null;
    }
};

export const updateProduct = async (id, product) => {
    try {
        const response = await axios.put(`products/${id}/`, product);
        return response.data;
    } catch (error) {
        console.error('Error updating product:', error);
        return null;
    }
}

export const deleteProduct = async (id) => {
    try {
        const response = await axios.delete(`products/${id}/`);
        return response.data;
    } catch (error) {
        console.error('Error deleting product:', error);
        return null;
    }
};

export const uploadImage = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post('products/upload/', formData);
        return response.data;
    } catch (error) {
        console.error('Error uploading image:', error);
        return null;
    }
}

export const getImage = (filename) => {
    // return `${axios.defaults.baseURL}products/images/${filename}`;
}

export const getCategories = async () => {
    try {
        const response = await axios.get('products/categories/');
        return response.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        return null;
    }
};

export const getProductsByCategory = async (category) => {
    try {
        const response = await axios.get(`products/categories/${category}/`);
        return response.data;
    } catch (error) {
        console.error('Error fetching products by category:', error);
        return null;
    }
}

export const searchProducts = async (query) => {
    try {
        const response = await axios.get(`products/search/?q=${query}`);
        return response.data;
    } catch (error) {
        console.error('Error searching products:', error);
        return null;
    }
}

export const getOrders = async () => {
    try {
        const response = await axios.get('orders/');
        return response.data;
    } catch (error) {
        console.error('Error fetching orders:', error);
        return null;
    }
}

export const createOrder = async (order) => {
    try {
        const response = await axios.post('orders/', order);
        return response.data;
    } catch (error) {
        console.error('Error creating order:', error);
        return null;
    }
}

export const updateOrder = async (id, order) => {
    try {
        const response = await axios.put(`orders/${id}/`, order);
        return response.data;
    } catch (error) {
        console.error('Error updating order:', error);
        return null;
    }
}

export const deleteOrder = async (id) => {
    try {
        const response = await axios.delete(`orders/${id}/`);
        return response.data;
    } catch (error) {
        console.error('Error deleting order:', error);
        return null;
    }
}

export const getCart = async () => {
    try {
        const response = await axios.get('cart/');
        return response.data;
    } catch (error) {
        console.error('Error fetching cart:', error);
        return null;
    }
}

export const addToCart = async (productId) => {
    try {
        const response = await axios.post('cart/', { product: productId });
        return response.data;
    } catch (error) {
        console.error('Error adding to cart:', error);
        return null;
    }
}

export const removeFromCart = async (productId) => {
    try {
        const response = await axios.delete(`cart/${productId}/`);
        return response.data;
    } catch (error) {
        console.error('Error removing from cart:', error);
        return null;
    }
}

export const clearCart = async () => {
    try {
        const response = await axios.delete('cart/');
        return response.data;
    } catch (error) {
        console.error('Error clearing cart:', error);
        return null;
    }
}

export const getProfile = async () => {
    try {
        const response = await axios.get('profile/');
        return response.data;
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}

export const updateProfile = async (profile) => {
    try {
        const response = await axios.put('profile/', profile);
        return response.data;
    } catch (error) {
        console.error('Error updating profile:', error);
        return null;
    }
}


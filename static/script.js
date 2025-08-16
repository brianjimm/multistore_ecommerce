// static/script.js

document.addEventListener('DOMContentLoaded', function() {
    // Auto-hide flash messages after 5 seconds
    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(function(message) {
        setTimeout(function() {
            message.style.opacity = '0';
            message.style.transform = 'translateY(-20px)';
            setTimeout(function() {
                message.remove();
            }, 300);
        }, 5000);
    });

    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Chat functionality
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        // Auto-scroll to bottom of chat
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Real-time message polling (simple implementation)
        let lastMessageCount = chatMessages.children.length;
        
        function checkForNewMessages() {
            fetch('/api/messages')
                .then(response => response.json())
                .then(messages => {
                    if (messages.length > lastMessageCount) {
                        location.reload(); // Simple approach - reload page for new messages
                    }
                })
                .catch(error => console.log('Error checking messages:', error));
        }

        // Check for new messages every 10 seconds
        setInterval(checkForNewMessages, 10000);
    }

    // Form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(function(form) {
        form.addEventListener('submit', function(e) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(function(field) {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = '#ef4444';
                } else {
                    field.style.borderColor = '#e2e8f0';
                }
            });

            if (!isValid) {
                e.preventDefault();
                showNotification('Please fill in all required fields', 'error');
            }
        });
    });

    // Shopping cart quantity updates (if implementing AJAX updates)
    const quantityButtons = document.querySelectorAll('.quantity-btn');
    quantityButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.dataset.action;
            const productId = this.dataset.productId;
            
            // Add your AJAX logic here for quantity updates
            updateCartQuantity(productId, action);
        });
    });

    // Product search functionality
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const productCards = document.querySelectorAll('.product-card');
            
            productCards.forEach(function(card) {
                const productName = card.querySelector('h3').textContent.toLowerCase();
                const productDescription = card.querySelector('p').textContent.toLowerCase();
                
                if (productName.includes(searchTerm) || productDescription.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // Category filter functionality
    const categoryFilters = document.querySelectorAll('.category-filter');
    categoryFilters.forEach(function(filter) {
        filter.addEventListener('change', function() {
            const selectedCategory = this.value;
            const productCards = document.querySelectorAll('.product-card');
            
            productCards.forEach(function(card) {
                const productCategory = card.dataset.category;
                
                if (selectedCategory === 'all' || productCategory === selectedCategory) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Mobile navigation toggle
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileNavToggle && navLinks) {
        mobileNavToggle.addEventListener('click', function() {
            navLinks.classList.toggle('mobile-active');
        });
    }

    // Product image carousel (if implementing multiple images)
    const productImages = document.querySelectorAll('.product-image-thumb');
    const mainProductImage = document.getElementById('mainProductImage');
    
    productImages.forEach(function(thumb) {
        thumb.addEventListener('click', function() {
            const newImageSrc = this.src;
            if (mainProductImage) {
                mainProductImage.src = newImageSrc;
                
                // Remove active class from all thumbnails
                productImages.forEach(function(img) {
                    img.classList.remove('active');
                });
                
                // Add active class to clicked thumbnail
                this.classList.add('active');
            }
        });
    });

    // Order status updates
    const orderStatusButtons = document.querySelectorAll('.update-order-status');
    orderStatusButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const orderId = this.dataset.orderId;
            const newStatus = this.dataset.status;
            
            updateOrderStatus(orderId, newStatus);
        });
    });

    // Auto-save cart changes
    const cartQuantityInputs = document.querySelectorAll('.cart-quantity-input');
    cartQuantityInputs.forEach(function(input) {
        input.addEventListener('change', function() {
            const productId = this.dataset.productId;
            const newQuantity = this.value;
            
            updateCartItem(productId, newQuantity);
        });
    });

    // Wishlist functionality
    const wishlistButtons = document.querySelectorAll('.wishlist-btn');
    wishlistButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.dataset.productId;
            
            toggleWishlist(productId, this);
        });
    });

    // Price filter
    const priceRangeInputs = document.querySelectorAll('.price-range');
    priceRangeInputs.forEach(function(input) {
        input.addEventListener('input', function() {
            const minPrice = document.getElementById('minPrice').value;
            const maxPrice = document.getElementById('maxPrice').value;
            
            filterProductsByPrice(minPrice, maxPrice);
        });
    });

    // Loading states for buttons
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    submitButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            this.classList.add('loading');
            this.disabled = true;
            
            // Re-enable after 3 seconds as fallback
            setTimeout(() => {
                this.classList.remove('loading');
                this.disabled = false;
            }, 3000);
        });
    });
});

// Utility functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#10b981';
            break;
        case 'error':
            notification.style.backgroundColor = '#ef4444';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f59e0b';
            break;
        default:
            notification.style.backgroundColor = '#2563eb';
    }
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function updateCartQuantity(productId, action) {
    // This would typically be an AJAX call to update cart quantities
    fetch(`/update_cart/${productId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            action: action
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Cart updated successfully', 'success');
            // Update the cart display
            updateCartDisplay(data.cart);
        } else {
            showNotification('Error updating cart', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error updating cart', 'error');
    });
}

function updateCartItem(productId, quantity) {
    if (quantity < 1) {
        if (confirm('Remove this item from cart?')) {
            removeCartItem(productId);
        }
        return;
    }
    
    fetch(`/update_cart_item/${productId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            quantity: quantity
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Cart updated', 'success');
            updateCartTotal();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error updating cart', 'error');
    });
}

function removeCartItem(productId) {
    fetch(`/remove_cart_item/${productId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Item removed from cart', 'success');
            document.querySelector(`[data-product-id="${productId}"]`).closest('.cart-item').remove();
            updateCartTotal();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error removing item', 'error');
    });
}

function updateOrderStatus(orderId, status) {
    fetch(`/update_order_status/${orderId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            status: status
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Order status updated', 'success');
            location.reload(); // Refresh to show updated status
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error updating order status', 'error');
    });
}

function toggleWishlist(productId, button) {
    fetch(`/toggle_wishlist/${productId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.added) {
                button.classList.add('active');
                button.innerHTML = '<i class="fas fa-heart"></i>';
                showNotification('Added to wishlist', 'success');
            } else {
                button.classList.remove('active');
                button.innerHTML = '<i class="far fa-heart"></i>';
                showNotification('Removed from wishlist', 'info');
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error updating wishlist', 'error');
    });
}

function filterProductsByPrice(minPrice, maxPrice) {
    const products = document.querySelectorAll('.product-card');
    
    products.forEach(function(product) {
        const priceElement = product.querySelector('.product-price');
        if (priceElement) {
            const price = parseFloat(priceElement.textContent.replace('$', ''));
            
            if (price >= minPrice && price <= maxPrice) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        }
    });
}

function updateCartDisplay(cart) {
    // Update cart count in navigation
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
        cartCount.textContent = totalItems;
    }
}

function updateCartTotal() {
    let total = 0;
    const cartItems = document.querySelectorAll('.cart-item');
    
    cartItems.forEach(function(item) {
        const priceElement = item.querySelector('.cart-item-price');
        const quantityElement = item.querySelector('.cart-item-quantity');
        
        if (priceElement && quantityElement) {
            const price = parseFloat(priceElement.textContent.replace('$', ''));
            const quantity = parseInt(quantityElement.textContent.replace('Qty: ', ''));
            total += price * quantity;
        }
    });
    
    const totalElement = document.querySelector('.cart-total h3');
    if (totalElement) {
        totalElement.textContent = `Total: $${total.toFixed(2)}`;
    }
}

// Add CSS animations via JavaScript
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .loading {
        position: relative;
        color: transparent !important;
    }
    
    .loading::after {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        top: 50%;
        left: 50%;
        margin-left: -8px;
        margin-top: -8px;
        border: 2px solid #ffffff;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
    
    .mobile-active {
        display: flex !important;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        padding: 1rem;
        z-index: 50;
    }
    
    @media (min-width: 768px) {
        .mobile-active {
            position: static !important;
            flex-direction: row !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
        }
    }
`;
document.head.appendChild(style);

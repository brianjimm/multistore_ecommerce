from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ecommerce.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    orders = db.relationship('Order', backref='customer', lazy=True)
    messages_sent = db.relationship('Message', foreign_keys='Message.sender_id', backref='sender', lazy=True)
    messages_received = db.relationship('Message', foreign_keys='Message.receiver_id', backref='receiver', lazy=True)

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    products = db.relationship('Product', backref='category', lazy=True)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, default=0)
    image_url = db.Column(db.String(255))
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship('OrderItem', backref='order', lazy=True)

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    product = db.relationship('Product', backref='order_items')

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # None for admin messages
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@app.route('/')
def home():
    categories = Category.query.all()
    featured_products = Product.query.limit(8).all()
    return render_template('home.html', categories=categories, products=featured_products)

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        phone = request.form.get('phone', '')
        address = request.form.get('address', '')
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            flash('Username already exists')
            return redirect(url_for('signup'))
        
        if User.query.filter_by(email=email).first():
            flash('Email already exists')
            return redirect(url_for('signup'))
        
        # Create new user
        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
            phone=phone,
            address=address
        )
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful')
        return redirect(url_for('login'))
    
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('home'))
        else:
            flash('Invalid username or password')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

@app.route('/category/<int:category_id>')
def category_products(category_id):
    category = Category.query.get_or_404(category_id)
    products = Product.query.filter_by(category_id=category_id).all()
    return render_template('category.html', category=category, products=products)

@app.route('/product/<int:product_id>')
def product_detail(product_id):
    product = Product.query.get_or_404(product_id)
    return render_template('product.html', product=product)

@app.route('/add_to_cart/<int:product_id>')
@login_required
def add_to_cart(product_id):
    if 'cart' not in session:
        session['cart'] = {}
    
    cart = session['cart']
    product_id_str = str(product_id)
    
    if product_id_str in cart:
        cart[product_id_str] += 1
    else:
        cart[product_id_str] = 1
    
    session['cart'] = cart
    flash('Product added to cart')
    return redirect(url_for('product_detail', product_id=product_id))

@app.route('/cart')
@login_required
def view_cart():
    if 'cart' not in session:
        session['cart'] = {}
    
    cart_items = []
    total = 0
    
    for product_id, quantity in session['cart'].items():
        product = Product.query.get(int(product_id))
        if product:
            subtotal = product.price * quantity
            cart_items.append({
                'product': product,
                'quantity': quantity,
                'subtotal': subtotal
            })
            total += subtotal
    
    return render_template('cart.html', cart_items=cart_items, total=total)

@app.route('/checkout', methods=['POST'])
@login_required
def checkout():
    if 'cart' not in session or not session['cart']:
        flash('Your cart is empty')
        return redirect(url_for('view_cart'))
    
    # Create order
    total_amount = 0
    order = Order(user_id=current_user.id, total_amount=0)
    db.session.add(order)
    db.session.flush()  # Get the order ID
    
    # Add order items
    for product_id, quantity in session['cart'].items():
        product = Product.query.get(int(product_id))
        if product and product.stock >= quantity:
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=quantity,
                price=product.price
            )
            db.session.add(order_item)
            product.stock -= quantity
            total_amount += product.price * quantity
    
    order.total_amount = total_amount
    db.session.commit()
    
    # Clear cart
    session['cart'] = {}
    
    flash('Order placed successfully!')
    return redirect(url_for('order_history'))

@app.route('/orders')
@login_required
def order_history():
    orders = Order.query.filter_by(user_id=current_user.id).order_by(Order.created_at.desc()).all()
    return render_template('orders.html', orders=orders)

@app.route('/chat')
@login_required
def chat():
    messages = Message.query.filter(
        (Message.sender_id == current_user.id) | (Message.receiver_id == current_user.id)
    ).order_by(Message.timestamp.asc()).all()
    return render_template('chat.html', messages=messages)

@app.route('/send_message', methods=['POST'])
@login_required
def send_message():
    content = request.form['message']
    if content:
        message = Message(
            sender_id=current_user.id,
            receiver_id=None,  # To admin
            content=content
        )
        db.session.add(message)
        db.session.commit()
    return redirect(url_for('chat'))

@app.route('/api/messages')
@login_required
def get_messages():
    messages = Message.query.filter(
        (Message.sender_id == current_user.id) | (Message.receiver_id == current_user.id)
    ).order_by(Message.timestamp.asc()).all()
    
    return jsonify([{
        'id': msg.id,
        'sender_id': msg.sender_id,
        'content': msg.content,
        'timestamp': msg.timestamp.isoformat(),
        'sender_name': msg.sender.username if msg.sender else 'Admin'
    } for msg in messages])

def init_db():
    """Initialize the database with sample data"""
    db.create_all()
    
    # Check if categories already exist
    if Category.query.first():
        return
    
    # Add categories
    categories_data = [
        {'name': 'Construction Materials', 'description': 'Cement, iron sheets, and building supplies'},
        {'name': 'Fresh Produce', 'description': 'Fruits, grains, and fresh food items'},
        {'name': 'Fashion & Cosmetics', 'description': 'Clothing, footwear, and beauty products'},
        {'name': 'Electronics', 'description': 'Smartphones, laptops, stereo systems'},
        {'name': 'Cars & Spare Parts', 'description': 'Vehicles and automotive parts'}
    ]
    
    categories = []
    for cat_data in categories_data:
        category = Category(**cat_data)
        categories.append(category)
        db.session.add(category)
    
    db.session.commit()
    
    # Add sample products
    products_data = [
        # Construction Materials
        {'name': 'Portland Cement 50kg', 'description': 'High quality portland cement', 'price': 15.99, 'stock': 100, 'category_id': 1},
        {'name': 'Iron Sheets 3m', 'description': 'Galvanized iron sheets', 'price': 25.50, 'stock': 50, 'category_id': 1},
        {'name': 'Steel Rods 12mm', 'description': 'Construction steel rods', 'price': 8.75, 'stock': 200, 'category_id': 1},
        
        # Fresh Produce
        {'name': 'Fresh Bananas 1kg', 'description': 'Sweet ripe bananas', 'price': 2.50, 'stock': 500, 'category_id': 2},
        {'name': 'Rice 5kg Bag', 'description': 'Premium white rice', 'price': 12.00, 'stock': 100, 'category_id': 2},
        {'name': 'Fresh Tomatoes 1kg', 'description': 'Farm fresh tomatoes', 'price': 3.25, 'stock': 300, 'category_id': 2},
        
        # Fashion & Cosmetics
        {'name': 'Running Shoes', 'description': 'Comfortable sports shoes', 'price': 45.99, 'stock': 30, 'category_id': 3},
        {'name': 'Moisturizing Cream', 'description': 'Premium face cream', 'price': 18.50, 'stock': 75, 'category_id': 3},
        {'name': 'Cotton T-Shirt', 'description': 'Soft cotton t-shirt', 'price': 12.99, 'stock': 150, 'category_id': 3},
        
        # Electronics
        {'name': 'Smartphone', 'description': 'Latest model smartphone', 'price': 299.99, 'stock': 25, 'category_id': 4},
        {'name': 'Laptop', 'description': 'High performance laptop', 'price': 699.99, 'stock': 15, 'category_id': 4},
        {'name': 'Bluetooth Speaker', 'description': 'Portable stereo system', 'price': 89.99, 'stock': 40, 'category_id': 4},
        
        # Cars & Spare Parts
        {'name': 'Car Battery', 'description': '12V car battery', 'price': 85.00, 'stock': 20, 'category_id': 5},
        {'name': 'Brake Pads', 'description': 'Universal brake pads', 'price': 35.50, 'stock': 60, 'category_id': 5},
        {'name': 'Engine Oil 5L', 'description': 'Premium engine oil', 'price': 28.99, 'stock': 80, 'category_id': 5}
    ]
    
    for prod_data in products_data:
        product = Product(**prod_data)
        db.session.add(product)
    
    db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        init_db()
    app.run(debug=True)

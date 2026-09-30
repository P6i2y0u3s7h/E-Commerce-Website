"""
populate_db.py — Comprehensive database seeding script.
Seeds products with categories, brands, specs, ratings, additional images, coupons, and sample reviews.
Safe to run multiple times.
"""
import sys
import os
import json
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
import app.models
from app.models import Product, ProductImage, Coupon, Review, User, UserRole
from app.security import hash_password

Base.metadata.create_all(bind=engine)

SAMPLE_PRODUCTS = [
    {
        "name": "Sony WH-1000XM5 Wireless Headphones",
        "description": "Industry-leading noise cancellation with Auto NC Optimizer. Up to 30-hour battery life, multipoint connection, and crystal-clear hands-free calling. Lightweight, comfortable design for all-day wear.",
        "category": "Electronics",
        "brand": "Sony",
        "price": 349.99,
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
        "stock_quantity": 45,
        "rating": 4.8,
        "review_count": 18,
        "specs": json.dumps({"Connectivity": "Bluetooth 5.2", "Battery Life": "30 Hours", "Weight": "250g", "Noise Cancellation": "Active (ANC)", "Warranty": "1 Year"}),
        "additional_images": [
            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800",
            "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800",
        ],
    },
    {
        "name": "Apple MacBook Air M3 13-inch",
        "description": "Supercharged by the M3 chip. Up to 18 hours of battery life, a stunning Liquid Retina display, and all-day performance in an incredibly thin and light design. Available in multiple colors.",
        "category": "Computers",
        "brand": "Apple",
        "price": 1099.00,
        "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
        "stock_quantity": 20,
        "rating": 4.9,
        "review_count": 32,
        "specs": json.dumps({"Processor": "Apple M3 8-core", "RAM": "8GB / 16GB Unified", "Display": "13.6-inch Liquid Retina", "Storage": "256GB / 512GB SSD", "Weight": "1.24 kg"}),
        "additional_images": [
            "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800",
            "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800",
        ],
    },
    {
        "name": "Samsung 65\" QLED 4K Smart TV",
        "description": "Quantum HDR technology delivers brilliant color and contrast. Powered by the Neo Quantum Processor 4K for lifelike picture quality. Built-in Alexa and Google Assistant.",
        "category": "Electronics",
        "brand": "Samsung",
        "price": 1299.99,
        "image_url": "https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=800",
        "stock_quantity": 12,
        "rating": 4.7,
        "review_count": 14,
        "specs": json.dumps({"Screen Size": "65-inch", "Resolution": "4K Ultra HD (3840x2160)", "Refresh Rate": "120Hz", "HDR": "Quantum HDR+", "Smart OS": "Tizen"}),
        "additional_images": [
            "https://images.unsplash.com/photo-1552975084-6e027cd345c2?w=800",
        ],
    },
    {
        "name": "Nike Air Max 270 Sneakers",
        "description": "The Nike Air Max 270 features a large Max Air unit in the heel for all-day comfort. Engineered mesh upper for breathability, with a foam midsole for lightweight cushioning.",
        "category": "Footwear",
        "brand": "Nike",
        "price": 149.95,
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
        "stock_quantity": 85,
        "rating": 4.6,
        "review_count": 25,
        "specs": json.dumps({"Material": "Breathable Mesh", "Sole": "Max Air 270", "Closure": "Lace-up", "Usage": "Lifestyle & Casual", "Origin": "Imported"}),
        "additional_images": [
            "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800",
        ],
    },
    {
        "name": "Kindle Paperwhite (16 GB)",
        "description": "The thinnest, lightest Kindle Paperwhite yet. 7\" 300 ppi glare-free display, adjustable warm light, IPX8 waterproof rating. Up to 12 weeks of battery life.",
        "category": "Electronics",
        "brand": "Amazon",
        "price": 139.99,
        "image_url": "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800",
        "stock_quantity": 60,
        "rating": 4.8,
        "review_count": 42,
        "specs": json.dumps({"Display": "6.8-inch Paperwhite 300 ppi", "Storage": "16 GB", "Battery Life": "Up to 10 weeks", "Waterproofing": "IPX8 (2m fresh water)", "Weight": "205g"}),
        "additional_images": [],
    },
    {
        "name": "Dyson V15 Detect Cordless Vacuum",
        "description": "Dyson's most powerful, intelligent cordless vacuum. Laser reveals microscopic dust. Intelligently adapts suction based on floor type and debris level. Up to 60 minutes run time.",
        "category": "Home & Kitchen",
        "brand": "Dyson",
        "price": 699.99,
        "image_url": "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800",
        "stock_quantity": 8,  # Low stock test
        "rating": 4.9,
        "review_count": 19,
        "specs": json.dumps({"Filtration": "Whole-machine HEPA", "Run Time": "60 minutes", "Weight": "3.1 kg", "Charge Time": "4.5 hours", "Bin Volume": "0.77 Liters"}),
        "additional_images": [],
    },
    {
        "name": "Levi's 501 Original Fit Jeans",
        "description": "The original blue jean since 1873. Iconic straight fit with the signature button fly. Made with durable heavyweight denim that breaks in over time.",
        "category": "Apparel",
        "brand": "Levi's",
        "price": 79.50,
        "image_url": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800",
        "stock_quantity": 110,
        "rating": 4.5,
        "review_count": 50,
        "specs": json.dumps({"Fit": "Regular Straight Leg", "Closure": "Button Fly", "Composition": "100% Cotton", "Care": "Machine wash cold", "Rise": "Mid rise"}),
        "additional_images": [],
    },
    {
        "name": "Instant Pot Duo 7-in-1 Electric Pressure Cooker",
        "description": "Pressure cook, slow cook, rice cooker, steamer, sauté pan, yogurt maker, and warmer. 13 customizable Smart Programs for quick one-touch meals.",
        "category": "Home & Kitchen",
        "brand": "Instant Pot",
        "price": 89.95,
        "image_url": "https://images.unsplash.com/photo-1584990347449-399c279c6d4e?w=800",
        "stock_quantity": 4,  # Low stock test
        "rating": 4.7,
        "review_count": 68,
        "specs": json.dumps({"Capacity": "6 Quart", "Functions": "7-in-1 Multi-Cooker", "Material": "Stainless Steel", "Wattage": "1000W", "Dishwasher Safe": "Inner Pot"}),
        "additional_images": [],
    },
    {
        "name": "Canon EOS R50 Mirrorless Camera Kit",
        "description": "24.2 MP APS-C sensor with Dual Pixel CMOS AF II. 4K 30p uncropped video recording, lightweight body, vari-angle touchscreen LCD. Includes 18-45mm lens.",
        "category": "Electronics",
        "brand": "Canon",
        "price": 879.99,
        "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",
        "stock_quantity": 15,
        "rating": 4.8,
        "review_count": 11,
        "specs": json.dumps({"Sensor": "24.2 MP APS-C", "Video": "4K UHD at 30 fps", "Lens Mount": "Canon RF / RF-S", "Autofocus": "Dual Pixel CMOS AF II", "Weight": "375g"}),
        "additional_images": [],
    },
    {
        "name": "LEGO Technic Land Rover Defender",
        "description": "Experience world-leading vehicle design firsthand with this highly authentic and displayable 42110 LEGO Technic Land Rover Defender model. 2573 pieces.",
        "category": "Toys & Games",
        "brand": "LEGO",
        "price": 239.99,
        "image_url": "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800",
        "stock_quantity": 0,  # Out of stock test
        "rating": 5.0,
        "review_count": 29,
        "specs": json.dumps({"Piece Count": "2573 Pieces", "Age Group": "11+ Years", "Dimensions": "22cm H x 42cm L x 20cm W", "Transmission": "4-speed sequential gearbox"}),
        "additional_images": [],
    },
    {
        "name": "Philips Sonicare DiamondClean Smart Toothbrush",
        "description": "Complete oral care with smart sensors and connected app. 4 brush modes, 3 intensity settings, premium travel case and charging glass.",
        "category": "Health & Beauty",
        "brand": "Philips",
        "price": 199.99,
        "image_url": "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=800",
        "stock_quantity": 48,
        "rating": 4.6,
        "review_count": 16,
        "specs": json.dumps({"Battery Life": "Up to 14 days", "Modes": "Clean, White+, Deep Clean+, Gum Health", "Speed": "Up to 62000 brush movements/min"}),
        "additional_images": [],
    },
    {
        "name": "Yeti Rambler 30 oz Travel Mug",
        "description": "Double-wall vacuum insulation keeps drinks hot or cold for hours. StrongHold lid seals closed for leak-proof portability. 18/8 stainless steel, dishwasher safe.",
        "category": "Home & Kitchen",
        "brand": "Yeti",
        "price": 38.00,
        "image_url": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800",
        "stock_quantity": 95,
        "rating": 4.9,
        "review_count": 85,
        "specs": json.dumps({"Capacity": "30 fl oz / 887 ml", "Material": "Kitchen-grade 18/8 Stainless Steel", "Dishwasher Safe": "Yes", "Lid": "Leak-resistant StrongHold"}),
        "additional_images": [],
    },
]

SAMPLE_COUPONS = [
    {
        "code": "WELCOME10",
        "discount_type": "percentage",
        "discount_value": 10.0,
        "minimum_order_amount": 50.0,
        "expiration_date": datetime.now(timezone.utc) + timedelta(days=90),
        "usage_limit": 500,
        "is_active": True,
    },
    {
        "code": "SAVE20",
        "discount_type": "fixed",
        "discount_value": 20.0,
        "minimum_order_amount": 100.0,
        "expiration_date": datetime.now(timezone.utc) + timedelta(days=60),
        "usage_limit": 200,
        "is_active": True,
    },
    {
        "code": "SUPER15",
        "discount_type": "percentage",
        "discount_value": 15.0,
        "minimum_order_amount": 150.0,
        "expiration_date": datetime.now(timezone.utc) + timedelta(days=30),
        "usage_limit": 100,
        "is_active": True,
    },
]


def seed_database():
    db = SessionLocal()
    try:
        # 1. Seed or Update Products
        print("[INFO] Seeding products...")
        for pdata in SAMPLE_PRODUCTS:
            extra_imgs = pdata.pop("additional_images", [])
            existing = db.query(Product).filter(Product.name == pdata["name"]).first()
            if existing:
                for k, v in pdata.items():
                    setattr(existing, k, v)
                prod = existing
                print(f"  [OK] Updated product: {prod.name}")
            else:
                prod = Product(**pdata)
                db.add(prod)
                db.flush()
                print(f"  [OK] Inserted product: {prod.name}")

            # Ensure primary image is in images table
            if not db.query(ProductImage).filter(ProductImage.product_id == prod.id).first():
                db.add(ProductImage(product_id=prod.id, image_url=prod.image_url, display_order=0))
                for idx, img_url in enumerate(extra_imgs, start=1):
                    db.add(ProductImage(product_id=prod.id, image_url=img_url, display_order=idx))

        # 2. Seed Coupons
        print("\n[INFO] Seeding coupons...")
        for cdata in SAMPLE_COUPONS:
            existing_c = db.query(Coupon).filter(Coupon.code == cdata["code"]).first()
            if not existing_c:
                coupon = Coupon(**cdata)
                db.add(coupon)
                print(f"  [OK] Added coupon: {coupon.code}")
            else:
                print(f"  [SKIP] Coupon already exists: {existing_c.code}")

        # 3. Seed Sample Customer & Reviews if not present
        sample_cust = db.query(User).filter(User.username == "sarah_customer").first()
        if not sample_cust:
            sample_cust = User(
                username="sarah_customer",
                email="sarah@example.com",
                hashed_password=hash_password("Customer123!"),
                first_name="Sarah",
                last_name="Jenkins",
                role=UserRole.CUSTOMER,
            )
            db.add(sample_cust)
            db.flush()
            print("\n[INFO] Created sample customer: sarah@example.com")

        # Seed reviews for Sony headphones
        sony = db.query(Product).filter(Product.name.ilike("%Sony WH-1000XM5%")).first()
        if sony and not db.query(Review).filter(Review.product_id == sony.id).first():
            rev1 = Review(
                user_id=sample_cust.id,
                product_id=sony.id,
                rating=5,
                title="Best noise cancelling headphones ever!",
                comment="Unbelievable sound quality and the noise cancellation is next level. Wore them on an 8-hour flight with zero ear fatigue.",
            )
            db.add(rev1)
            print("  [OK] Added sample review for Sony headphones")

        db.commit()
        print("\n[DONE] Database seeding complete!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

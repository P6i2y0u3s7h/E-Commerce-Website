"""
migrate_db.py — Safe database schema migration script.
Adds missing columns to existing SQLite tables and creates new tables.
"""
import sys
import os
import sqlite3

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
import app.models  # Ensure all models are registered

def run_migration():
    print("[INFO] Running database schema upgrade...")

    # 1. Create any missing tables
    Base.metadata.create_all(bind=engine)
    print("[OK] Base.metadata.create_all completed.")

    # 2. Add columns to SQLite if they are missing
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ecommerce.db")
    if not os.path.exists(db_path):
        print(f"[INFO] Database file {db_path} does not exist yet. It will be created on first start.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    def get_columns(table_name):
        cursor.execute(f"PRAGMA table_info({table_name})")
        return [row[1] for row in cursor.fetchall()]

    # Check products columns
    product_cols = get_columns("products")
    product_additions = [
        ("category", "VARCHAR(100) DEFAULT 'General' NOT NULL"),
        ("brand", "VARCHAR(100) DEFAULT 'Generic'"),
        ("rating", "FLOAT DEFAULT 5.0 NOT NULL"),
        ("review_count", "INTEGER DEFAULT 0 NOT NULL"),
        ("specs", "TEXT"),
    ]
    for col_name, col_def in product_additions:
        if col_name not in product_cols:
            print(f"  [+] Adding column '{col_name}' to products table")
            cursor.execute(f"ALTER TABLE products ADD COLUMN {col_name} {col_def}")

    # Check orders columns
    order_cols = get_columns("orders")
    order_additions = [
        ("subtotal", "FLOAT DEFAULT 0.0 NOT NULL"),
        ("discount_amount", "FLOAT DEFAULT 0.0 NOT NULL"),
        ("shipping_fee", "FLOAT DEFAULT 0.0 NOT NULL"),
        ("coupon_code", "VARCHAR(50)"),
        ("payment_method", "VARCHAR(50) DEFAULT 'Sandbox Card' NOT NULL"),
        ("payment_status", "VARCHAR(50) DEFAULT 'PAID' NOT NULL"),
        ("tracking_number", "VARCHAR(100)"),
        ("estimated_delivery", "DATETIME"),
        ("contact_email", "VARCHAR(255)"),
        ("contact_phone", "VARCHAR(50)"),
        ("notes", "TEXT"),
    ]
    for col_name, col_def in order_additions:
        if col_name not in order_cols:
            print(f"  [+] Adding column '{col_name}' to orders table")
            cursor.execute(f"ALTER TABLE orders ADD COLUMN {col_name} {col_def}")

    # Check users columns
    user_cols = get_columns("users")
    if "is_active" not in user_cols:
        print("  [+] Adding column 'is_active' to users table")
        cursor.execute("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1 NOT NULL")

    conn.commit()
    conn.close()
    print("[DONE] Migration complete!")

if __name__ == "__main__":
    run_migration()

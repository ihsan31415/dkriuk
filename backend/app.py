from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- Constants & Initial Data ---

OUTLETS = [
    {"id": "outlet_1", "name": "Cabang UNNES Sekaran"},
    {"id": "outlet_2", "name": "Cabang Banaran"},
    {"id": "outlet_3", "name": "Cabang Patemon"},
    {"id": "outlet_4", "name": "Cabang Sampangan"}
]

PRODUCTS = [
    {"id": 1, "name": "Ayam Dada", "price": 10000, "image": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=300&auto=format&fit=crop"},
    {"id": 2, "name": "Paha Atas", "price": 10000, "image": "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?q=80&w=300&auto=format&fit=crop"},
    {"id": 3, "name": "Sayap", "price": 8000, "image": "https://i.huffpost.com/gen/1350227/images/o-MIGHTY-WINGS-facebook.jpg"},
    {"id": 4, "name": "Paha Bawah", "price": 8000, "image": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=300&auto=format&fit=crop"},
    {"id": 5, "name": "Nasi Putih", "price": 4000, "image": "https://images.unsplash.com/photo-1516684732162-798a0062be99?q=80&w=300&auto=format&fit=crop"},
    {"id": 6, "name": "Es Teh", "price": 3000, "image": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=300&auto=format&fit=crop"}
]

HUB_ID = "hub_pusat"

# Hub inventory (pusat). Sumber utama distribusi & refill otomatis.
hub_inventory = {
    1: 400,  # Dada
    2: 400,  # Paha Atas
    3: 300,  # Sayap
    4: 300,  # Paha Bawah
    5: 600,  # Nasi
    6: 600   # Es Teh
}

# Inventory: { outlet_id: { product_id (int): quantity } }
inventory = {
    "outlet_1": {1: 24, 2: 18, 3: 5, 4: 12, 5: 50, 6: 100},
    "outlet_2": {1: 40, 2: 35, 3: 20, 4: 30, 5: 80, 6: 120},
    "outlet_3": {1: 10, 2: 8, 3: 5, 4: 5, 5: 20, 6: 40},
    "outlet_4": {1: 5, 2: 2, 3: 0, 4: 4, 5: 10, 6: 15}
}

# Last Update Timestamps
last_updates = {
    "outlet_1": datetime.now() - timedelta(minutes=5),
    "outlet_2": datetime.now() - timedelta(minutes=15),
    "outlet_3": datetime.now() - timedelta(minutes=30),
    "outlet_4": datetime.now() - timedelta(minutes=2)
}

last_hub_refill = datetime.now()

# Transactions Log
transactions = []

# Distribution Log
distributions = []

# Requests Log
requests_log = []


# --- Helper Functions ---

def get_outlet(outlet_id):
    for outlet in OUTLETS:
        if outlet["id"] == outlet_id:
            return outlet
    return None


def get_outlet_name(outlet_id):
    outlet = get_outlet(outlet_id)
    return outlet["name"] if outlet else "Unknown Outlet"


def get_product(prod_id):
    for product in PRODUCTS:
        if product["id"] == prod_id:
            return product
    return None


def parse_positive_int(value, default=0):
    try:
        parsed = int(value)
        return parsed if parsed > 0 else default
    except (TypeError, ValueError):
        return default


def apply_hub_refill():
    """Auto-refill hub stock: +50 pcs per product every full minute."""
    global last_hub_refill
    now = datetime.now()
    minutes = int((now - last_hub_refill).total_seconds() // 60)
    if minutes <= 0:
        return
    increment = 50 * minutes
    for pid in hub_inventory:
        hub_inventory[pid] = hub_inventory.get(pid, 0) + increment
    last_hub_refill = last_hub_refill + timedelta(minutes=minutes)


def hub_total_stock():
    return sum(hub_inventory.values())


def outlets_total_stock():
    total = 0
    for stock in inventory.values():
        total += sum(stock.values())
    return total


def calculate_overstock_pcs():
    """Estimate overstock that is likely to become waste soon."""
    overstock = 0
    # Outlet threshold: >180 pcs total (roughly 45/part) is considered berlebih
    for stock in inventory.values():
        outlet_total = sum(stock.values())
        if outlet_total > 180:
            overstock += outlet_total - 180

    # Hub buffer: everything above 2000 pcs counts as potential waste (discounted 50%)
    hub_buffer = max(0, hub_total_stock() - 2000)
    overstock += int(hub_buffer * 0.5)

    return max(0, overstock)


def recent_sales_qty(hours=24):
    if not transactions:
        return 0
    cutoff = datetime.now() - timedelta(hours=hours)
    total_qty = 0
    for t in transactions:
        try:
            dt = datetime.fromisoformat(str(t.get('date', '')).replace('Z', '+00:00'))
        except (TypeError, ValueError):
            dt = datetime.now()
        # Normalize tz-aware to naive for safe comparison
        if dt.tzinfo is not None:
            dt = dt.replace(tzinfo=None)
        if dt >= cutoff:
            for item in t.get('items', []):
                total_qty += parse_positive_int(item.get('qty'))
    return total_qty


def calculate_waste_percentage():
    """Estimate waste risk based on overstock and recent sales velocity."""
    outlet_stock = outlets_total_stock()
    total_stock_all = hub_total_stock() + outlet_stock

    # If we have no stock at all, there is no waste risk
    if total_stock_all <= 0:
        return {"percent": 0.0, "pcs": 0}

    overstock_pcs = calculate_overstock_pcs()

    qty_24h = recent_sales_qty(hours=24)
    qty_7d = recent_sales_qty(hours=24 * 7)
    # Use the strongest signal available, but keep a sensible floor so we don't max out risk when there's no history
    velocity_daily = max(qty_24h, qty_7d / 7 if qty_7d > 0 else 0, 80)

    coverage_days = outlet_stock / max(velocity_daily, 1)
    if coverage_days <= 1.5:
        baseline_risk = 5.0
    elif coverage_days <= 3:
        baseline_risk = 5.0 + (coverage_days - 1.5) * 12.0  # up to ~23%
    elif coverage_days <= 7:
        baseline_risk = 23.0 + (coverage_days - 3) * 7.0    # up to ~51%
    else:
        baseline_risk = 51.0 + min(25.0, (coverage_days - 7) * 4.0)  # cap ~76%

    overstock_pct = (overstock_pcs / total_stock_all) * 100.0 if total_stock_all else 0.0

    waste_pct = round(min(100.0, max(baseline_risk, overstock_pct, 5.0)), 1)

    return {"percent": waste_pct, "pcs": int(overstock_pcs)}


def get_time_ago(dt):
    if not dt:
        return "Unknown"
    now = datetime.now()
    diff = now - dt
    minutes = int(diff.total_seconds() / 60)
    if minutes < 1:
        return "Just now"
    if minutes < 60:
        return f"{minutes} min ago"
    hours = int(minutes / 60)
    return f"{hours} hours ago"


def calculate_dashboard_stats():
    apply_hub_refill()
    total_pendapatan = sum(t['total'] for t in transactions)
    hub_stock = hub_total_stock()
    total_stock = 0
    outlet_status_counts = {"CRITICAL": 0, "AMAN": 0, "BERLEBIH": 0}
    inventory_list = []

    for outlet in OUTLETS:
        oid = outlet['id']
        stock_data = inventory.get(oid, {})

        outlet_total_stock = sum(stock_data.values())
        total_stock += outlet_total_stock

        status = "AMAN"
        if outlet_total_stock < 50:
            status = "CRITICAL"
            outlet_status_counts["CRITICAL"] += 1
        elif outlet_total_stock > 200:
            status = "BERLEBIH"
            outlet_status_counts["BERLEBIH"] += 1
        else:
            outlet_status_counts["AMAN"] += 1

        inventory_list.append({
            "id": oid,
            "outlet": outlet['name'],
            "paha_atas": stock_data.get(2, 0),
            "paha_bawah": stock_data.get(4, 0),
            "dada": stock_data.get(1, 0),
            "sayap": stock_data.get(3, 0),
            "status": status,
            "last_update": get_time_ago(last_updates.get(oid, datetime.now()))
        })

    waste_metrics = calculate_waste_percentage()

    return {
        "stats": {
            "total_outlet": len(OUTLETS),
            "total_pendapatan": total_pendapatan + 15700000,
            "stok_gudang": hub_stock,
            "outlet_kritis": outlet_status_counts["CRITICAL"],
            "potensi_waste": f"{waste_metrics['percent']:.1f}%",
            "potensi_waste_pcs": waste_metrics.get("pcs", 0)
        },
        "inventory": inventory_list,
        "requests_count": len(requests_log)
    }


# --- Routes ---


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "time": datetime.now().isoformat()}), 200


@app.route('/api/products', methods=['GET'])
def get_products():
    apply_hub_refill()
    outlet_id = request.args.get('outlet_id')
    if outlet_id:
        if outlet_id == HUB_ID:
            products_with_stock = []
            for p in PRODUCTS:
                p_copy = p.copy()
                p_copy['stock'] = hub_inventory.get(p['id'], 0)
                products_with_stock.append(p_copy)
            return jsonify(products_with_stock)
        if not get_outlet(outlet_id):
            return jsonify({"error": "Outlet tidak ditemukan"}), 404
        products_with_stock = []
        for p in PRODUCTS:
            p_copy = p.copy()
            p_copy['stock'] = inventory.get(outlet_id, {}).get(p['id'], 0)
            products_with_stock.append(p_copy)
        return jsonify(products_with_stock)
    return jsonify(PRODUCTS)


@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    data = calculate_dashboard_stats()
    return jsonify(data)


@app.route('/api/laporan', methods=['GET'])
def get_laporan():
    report_map = {}

    mock_history = [
        {"id": "hist_1", "tanggal": "02 Des 2023", "outlet": "Cabang UNNES Sekaran", "transaksi": 150, "item_terjual": 340, "omzet": 3450000, "status": "Final"},
        {"id": "hist_2", "tanggal": "02 Des 2023", "outlet": "Cabang Banaran", "transaksi": 98, "item_terjual": 210, "omzet": 2150000, "status": "Final"}
    ]

    current_reports = []

    for t in transactions:
        try:
            parsed_date = datetime.fromisoformat(str(t['date']).replace('Z', '+00:00'))
        except (TypeError, ValueError):
            parsed_date = datetime.now()
        date_str = parsed_date.strftime("%d Des %Y")
        key = (date_str, t['outlet_id'])

        if key not in report_map:
            report_map[key] = {"transaksi": 0, "item_terjual": 0, "omzet": 0}

        report_map[key]["transaksi"] += 1
        report_map[key]["omzet"] += t['total']
        report_map[key]["item_terjual"] += sum(item['qty'] for item in t['items'])

    for (date, outlet_id), data in report_map.items():
        current_reports.append({
            "id": f"rep_{date}_{outlet_id}",
            "tanggal": date,
            "outlet": get_outlet_name(outlet_id),
            "transaksi": data['transaksi'],
            "item_terjual": data['item_terjual'],
            "omzet": data['omzet'],
            "status": "Open"
        })

    return jsonify(current_reports + mock_history)


@app.route('/api/distribusi', methods=['GET', 'POST'])
def handle_distribusi():
    if request.method == 'POST':
        data = request.json or {}
        outlet_id = data.get('outlet_id')
        items_to_add = data.get('items', [])

        apply_hub_refill()

        if not outlet_id:
            return jsonify({"error": "outlet_id wajib diisi"}), 400
        if not get_outlet(outlet_id):
            return jsonify({"error": "Outlet tidak ditemukan"}), 404
        if not isinstance(items_to_add, list) or len(items_to_add) == 0:
            return jsonify({"error": "items harus berupa list dan tidak boleh kosong"}), 400

        total_qty = 0
        # Validate hub stock availability first
        for item in items_to_add:
            prod_id = parse_positive_int(item.get('id'))
            qty = parse_positive_int(item.get('qty'))
            if prod_id == 0 or qty == 0:
                return jsonify({"error": "Setiap item harus memiliki id dan qty > 0"}), 400
            product = get_product(prod_id)
            if not product:
                return jsonify({"error": f"Produk dengan id {prod_id} tidak ditemukan"}), 404

            if hub_inventory.get(prod_id, 0) < qty:
                return jsonify({"error": f"Stok hub tidak cukup untuk {product['name']}"}), 400

        # Deduct from hub, add to outlet
        for item in items_to_add:
            prod_id = parse_positive_int(item.get('id'))
            qty = parse_positive_int(item.get('qty'))
            hub_inventory[prod_id] = hub_inventory.get(prod_id, 0) - qty
            current_stock = inventory.setdefault(outlet_id, {})
            current_stock[prod_id] = current_stock.get(prod_id, 0) + qty
            total_qty += qty

        distributions.append({
            "date": datetime.now().isoformat(),
            "outlet": get_outlet_name(outlet_id),
            "items_count": len(items_to_add),
            "total_qty": total_qty
        })

        last_updates[outlet_id] = datetime.now()

        return jsonify({
            "message": "Stok berhasil ditambahkan",
            "total_qty": total_qty,
            "hub_remaining": hub_inventory
        }), 201

    return jsonify(distributions)


@app.route('/api/pos/transaksi', methods=['POST'])
def pos_transaksi():
    data = request.json or {}
    outlet_id = data.get('outlet_id', 'outlet_1')
    items = data.get('items', [])

    if not get_outlet(outlet_id):
        return jsonify({"error": "Outlet invalid"}), 400
    if not isinstance(items, list) or len(items) == 0:
        return jsonify({"error": "items tidak boleh kosong"}), 400

    validated_items = []
    for item in items:
        prod_id = parse_positive_int(item.get('id'))
        qty = parse_positive_int(item.get('qty'))
        if prod_id == 0 or qty == 0:
            return jsonify({"error": "Setiap item harus memiliki id dan qty > 0"}), 400

        product = get_product(prod_id)
        if not product:
            return jsonify({"error": f"Produk dengan id {prod_id} tidak ditemukan"}), 404

        try:
            price = float(item.get('price', product['price']))
        except (TypeError, ValueError):
            price = float(product['price'])

        current_stock = inventory[outlet_id].get(prod_id, 0)
        if current_stock < qty:
            return jsonify({"error": f"Stok tidak cukup untuk {product['name']}"}), 400

        validated_items.append({
            "id": prod_id,
            "name": product['name'],
            "qty": qty,
            "price": price,
            "image": item.get('image', product.get('image', ''))
        })

    for item in validated_items:
        inventory[outlet_id][item['id']] -= item['qty']

    total_calculated = sum(i['price'] * i['qty'] for i in validated_items)

    transaction_record = {
        "id": len(transactions) + 1,
        "outlet_id": outlet_id,
        "items": validated_items,
        "total": total_calculated,
        "date": data.get('date', datetime.now().isoformat())
    }
    transactions.append(transaction_record)

    last_updates[outlet_id] = datetime.now()

    return jsonify({
        "message": "Transaksi berhasil",
        "total": total_calculated,
        "new_stock": inventory[outlet_id]
    }), 200


@app.route('/api/requests', methods=['GET', 'POST'])
def handle_requests():
    if request.method == 'POST':
        data = request.json or {}
        outlet_id = data.get('outlet_id')
        items_requested = data.get('requests', [])

        if not outlet_id:
            return jsonify({"error": "outlet_id wajib diisi"}), 400
        if not get_outlet(outlet_id):
            return jsonify({"error": "Outlet tidak ditemukan"}), 404
        if not isinstance(items_requested, list) or len(items_requested) == 0:
            return jsonify({"error": "requests harus berisi minimal 1 item"}), 400

        requests_log.append({
            "id": len(requests_log) + 1,
            "date": datetime.now().isoformat(),
            "outlet_id": outlet_id,
            "items": items_requested,
            "note": data.get('note'),
            "status": "Pending"
        })
        return jsonify({"message": "Request received"}), 201
    return jsonify(requests_log)


if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')

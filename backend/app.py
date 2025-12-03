from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta

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

# Transactions Log
transactions = []

# Distribution Log
distributions = []

# Requests Log
requests_log = []

# --- Helper Functions ---

def get_outlet_name(outlet_id):
    for o in OUTLETS:
        if o['id'] == outlet_id:
            return o['name']
    return "Unknown Outlet"

def get_time_ago(dt):
    now = datetime.now()
    diff = now - dt
    minutes = int(diff.total_seconds() / 60)
    if minutes < 1:
        return "Just now"
    elif minutes < 60:
        return f"{minutes} min ago"
    else:
        hours = int(minutes / 60)
        return f"{hours} hours ago"

def calculate_dashboard_stats():
    total_pendapatan = sum(t['total'] for t in transactions)
    
    # Calculate total stock across all outlets
    total_stock = 0
    outlet_status_counts = {"CRITICAL": 0, "AMAN": 0, "BERLEBIH": 0}
    
    inventory_list = []
    
    for outlet in OUTLETS:
        oid = outlet['id']
        stock_data = inventory.get(oid, {})
        
        # Calculate total stock for this outlet
        outlet_total_stock = sum(stock_data.values())
        total_stock += outlet_total_stock
        
        # Determine status based on arbitrary logic
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
            "paha_atas": stock_data.get(2, 0), # ID 2 is Paha Atas
            "paha_bawah": stock_data.get(4, 0), # ID 4 is Paha Bawah
            "dada": stock_data.get(1, 0), # ID 1 is Dada
            "sayap": stock_data.get(3, 0), # ID 3 is Sayap
            "status": status,
            "last_update": get_time_ago(last_updates.get(oid, datetime.now()))
        })

    # Dynamic Waste Calculation (Mock)
    # Assume waste increases slightly with time or transactions
    base_waste = 5.2
    dynamic_waste = base_waste + (len(transactions) * 0.1)
    
    return {
        "stats": {
            "total_outlet": len(OUTLETS),
            "total_pendapatan": total_pendapatan + 15700000, # Add base mock value
            "stok_gudang": total_stock,
            "outlet_kritis": outlet_status_counts["CRITICAL"],
            "potensi_waste": f"{dynamic_waste:.1f}%"
        },
        "inventory": inventory_list,
        "requests_count": len(requests_log)
    }

# --- Routes ---

@app.route('/api/products', methods=['GET'])
def get_products():
    # Return products with stock for a specific outlet if requested
    outlet_id = request.args.get('outlet_id')
    if outlet_id and outlet_id in inventory:
        products_with_stock = []
        for p in PRODUCTS:
            p_copy = p.copy()
            p_copy['stock'] = inventory[outlet_id].get(p['id'], 0)
            products_with_stock.append(p_copy)
        return jsonify(products_with_stock)
    return jsonify(PRODUCTS)

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    data = calculate_dashboard_stats()
    return jsonify(data)

@app.route('/api/laporan', methods=['GET'])
def get_laporan():
    # Generate laporan from transactions
    # Group by date and outlet
    report_map = {}
    
    # Add some mock historical data
    mock_history = [
        {"id": "hist_1", "tanggal": "02 Des 2023", "outlet": "Cabang UNNES Sekaran", "transaksi": 150, "item_terjual": 340, "omzet": 3450000, "status": "Final"},
        {"id": "hist_2", "tanggal": "02 Des 2023", "outlet": "Cabang Banaran", "transaksi": 98, "item_terjual": 210, "omzet": 2150000, "status": "Final"}
    ]
    
    current_reports = []
    
    # Process live transactions
    for t in transactions:
        date_str = datetime.fromisoformat(t['date'].replace('Z', '+00:00')).strftime("%d Des %Y")
        key = (date_str, t['outlet_id'])
        
        if key not in report_map:
            report_map[key] = {
                "transaksi": 0,
                "item_terjual": 0,
                "omzet": 0
            }
        
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
        data = request.json
        # Expected data: { outlet_id: "outlet_1", items: [ {id: 1, qty: 10} ] }
        
        outlet_id = data.get('outlet_id')
        items_to_add = data.get('items', []) 
        
        if outlet_id and outlet_id in inventory:
            for item in items_to_add:
                prod_id = int(item.get('id'))
                qty = int(item.get('qty', 0))
                if prod_id in inventory[outlet_id]:
                    inventory[outlet_id][prod_id] += qty
            
            distributions.append({
                "date": datetime.now().isoformat(),
                "outlet": get_outlet_name(outlet_id),
                "items_count": len(items_to_add)
            })
            
            # Update timestamp
            last_updates[outlet_id] = datetime.now()
            
            return jsonify({"message": "Stok berhasil ditambahkan"}), 201
        return jsonify({"error": "Outlet not found"}), 404

    return jsonify(distributions)

@app.route('/api/pos/transaksi', methods=['POST'])
def pos_transaksi():
    data = request.json
    # Expected: { outlet_id: "outlet_1", items: [ { id: 1, qty: 2, ... } ], total: 20000, date: ... }
    
    outlet_id = data.get('outlet_id', 'outlet_1') # Default to outlet_1 if missing
    items = data.get('items', [])
    
    if outlet_id not in inventory:
        return jsonify({"error": "Outlet invalid"}), 400
        
    # Check stock first
    for item in items:
        prod_id = int(item['id'])
        qty = item['qty']
        current_stock = inventory[outlet_id].get(prod_id, 0)
        if current_stock < qty:
            return jsonify({"error": f"Stok tidak cukup untuk {item['name']}"}), 400
            
    # Deduct stock
    for item in items:
        prod_id = int(item['id'])
        qty = item['qty']
        inventory[outlet_id][prod_id] -= qty
        
    # Record transaction
    transaction_record = {
        "id": len(transactions) + 1,
        "outlet_id": outlet_id,
        "items": items,
        "total": data.get('total', 0),
        "date": data.get('date', datetime.now().isoformat())
    }
    transactions.append(transaction_record)
    
    # Update timestamp
    last_updates[outlet_id] = datetime.now()
    
    return jsonify({"message": "Transaksi berhasil", "new_stock": inventory[outlet_id]}), 200

@app.route('/api/requests', methods=['GET', 'POST'])
def handle_requests():
    if request.method == 'POST':
        data = request.json
        # Expected: { outlet_id: "outlet_1", requests: [...], note: "..." }
        requests_log.append({
            "id": len(requests_log) + 1,
            "date": datetime.now().isoformat(),
            "outlet_id": data.get('outlet_id'),
            "items": data.get('requests'),
            "note": data.get('note'),
            "status": "Pending"
        })
        return jsonify({"message": "Request received"}), 201
    return jsonify(requests_log)

if __name__ == '__main__':
    app.run(debug=True, port=5000)

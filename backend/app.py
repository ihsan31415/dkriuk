from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for React communication

# Mock Data
dashboard_stats = {
    "total_outlet": 8,
    "total_pendapatan": 15700000,
    "stok_gudang": 1240,
    "outlet_kritis": 2,
    "potensi_waste": "8.5%"
}

inventory_data = [
    {"id": 1, "outlet": "Cabang UNNES Sekaran", "paha_atas": 8, "paha_bawah": 12, "dada": 5, "sayap": 15, "status": "CRITICAL", "last_update": "5 min ago"},
    {"id": 2, "outlet": "Cabang Banaran", "paha_atas": 25, "paha_bawah": 18, "dada": 30, "sayap": 45, "status": "AMAN", "last_update": "10 min ago"},
    {"id": 3, "outlet": "Cabang Patemon", "paha_atas": 65, "paha_bawah": 72, "dada": 55, "sayap": 80, "status": "BERLEBIH", "last_update": "15 min ago"},
    {"id": 4, "outlet": "Cabang Sampangan", "paha_atas": 9, "paha_bawah": 4, "dada": 11, "sayap": 14, "status": "CRITICAL", "last_update": "2 min ago"}
]

laporan_data = [
    {"id": 1, "tanggal": "03 Des 2023", "outlet": "Cabang UNNES Sekaran", "transaksi": 142, "item_terjual": 320, "omzet": 3200000, "status": "Final"},
    {"id": 2, "tanggal": "03 Des 2023", "outlet": "Cabang Banaran", "transaksi": 98, "item_terjual": 210, "omzet": 2150000, "status": "Final"},
    {"id": 3, "tanggal": "03 Des 2023", "outlet": "Cabang Sampangan", "transaksi": 85, "item_terjual": 180, "omzet": 1950000, "status": "Open"},
    {"id": 4, "tanggal": "02 Des 2023", "outlet": "Cabang UNNES Sekaran", "transaksi": 150, "item_terjual": 340, "omzet": 3450000, "status": "Final"}
]

distribusi_log = []

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_stats():
    return jsonify({
        "stats": dashboard_stats,
        "inventory": inventory_data
    })

@app.route('/api/laporan', methods=['GET'])
def get_laporan():
    return jsonify(laporan_data)

@app.route('/api/distribusi', methods=['GET', 'POST'])
def handle_distribusi():
    if request.method == 'POST':
        data = request.json
        distribusi_log.append(data)
        return jsonify({"message": "Data distribusi berhasil ditambahkan", "data": data}), 201
    return jsonify(distribusi_log)

@app.route('/api/pos/transaksi', methods=['POST'])
def pos_transaksi():
    data = request.json
    # Logic to save transaction would go here
    return jsonify({"message": "Transaksi berhasil", "data": data}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)

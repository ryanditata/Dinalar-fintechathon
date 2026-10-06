from flask import Flask, request, jsonify
from optimize_portfolio import run_optimization
import os

app = Flask(__name__)

@app.route('/', methods=['GET'])
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'Portfolio Optimizer API Running'})

@app.route('/optimize', methods=['POST'])
def optimize():
    payload = request.get_json(force=True, silent=True)
    if not payload:
        return jsonify({'status': 'error', 'message': 'Payload JSON tidak valid'}), 400

    try:
        result = run_optimization(payload)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
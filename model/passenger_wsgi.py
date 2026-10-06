import os
import sys
import json
import traceback

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

# Tambahkan path site-packages cPanel virtualenv secara otomatis untuk Python 3.8/3.10/3.11
for base in ['/home/kyjurutw/virtualenv/production/model', '/home/kyjurutw/virtualenv/model']:
    for ver in ['3.8', '3.10', '3.11', '3.9', '3.7']:
        for sub in ['lib', 'lib64']:
            pkg = f"{base}/{ver}/{sub}/python{ver}/site-packages"
            if os.path.exists(pkg) and pkg not in sys.path:
                sys.path.insert(0, pkg)

# Import fungsi optimasi
import_error = None
try:
    from optimize_portfolio import run_optimization
except Exception as e:
    run_optimization = None
    import_error = f"{str(e)}\n\nTraceback:\n{traceback.format_exc()}"

def application(environ, start_response):
    """
    Phusion Passenger WSGI entry point for cPanel Python App.
    """
    request_method = environ.get('REQUEST_METHOD', 'GET').upper()
    
    if request_method == 'POST':
        if import_error is not None:
            status = '500 Internal Server Error'
            response_data = json.dumps({
                'status': 'error',
                'message': f'Python Module Import Error (Cek dependencies di cPanel): {import_error}'
            }).encode('utf-8')
        else:
            try:
                try:
                    content_length = int(environ.get('CONTENT_LENGTH', 0))
                except (ValueError, TypeError):
                    content_length = 0
                    
                request_body = environ['wsgi.input'].read(content_length) if content_length > 0 else b'{}'
                input_data = json.loads(request_body.decode('utf-8'))
                
                result = run_optimization(input_data)
                status = '200 OK'
                response_data = json.dumps(result).encode('utf-8')
            except Exception as e:
                status = '500 Internal Server Error'
                response_data = json.dumps({
                    'status': 'error',
                    'message': f'Optimization execution error: {str(e)}\n{traceback.format_exc()}'
                }).encode('utf-8')
                
        response_headers = [
            ('Content-Type', 'application/json'),
            ('Content-Length', str(len(response_data))),
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Headers', 'Content-Type, Authorization'),
            ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
        ]
        start_response(status, response_headers)
        return [response_data]
        
    elif request_method == 'OPTIONS':
        status = '204 No Content'
        response_headers = [
            ('Content-Type', 'application/json'),
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Headers', 'Content-Type, Authorization'),
            ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
        ]
        start_response(status, response_headers)
        return [b'']

    # Health check untuk GET via browser (https://dinalar.my.id/model)
    status = '200 OK'
    response_data = json.dumps({
        'status': 'ok' if import_error is None else 'error',
        'service': 'Dinalar Portfolio Optimizer WSGI Engine',
        'ready': import_error is None,
        'import_error': import_error,
        'python_executable': sys.executable,
        'python_version': sys.version,
    }, indent=2).encode('utf-8')
    
    response_headers = [
        ('Content-Type', 'application/json'),
        ('Content-Length', str(len(response_data))),
    ]
    start_response(status, response_headers)
    return [response_data]

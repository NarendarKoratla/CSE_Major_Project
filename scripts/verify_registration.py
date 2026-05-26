import urllib.request
import json
import sys

url = "http://127.0.0.1:8000/register"
data = {
    "email": "verify_user@example.com",
    "password": "securepassword123",
    "full_name": "Verify User"
}

try:
    req = urllib.request.Request(
        url, 
        data=json.dumps(data).encode('utf-8'), 
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code} - {e.read().decode('utf-8')}")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

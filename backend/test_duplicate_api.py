import requests

def test_request_otp_duplicate():
    url = "http://127.0.0.1:8000/request-otp"
    # email from my check_users.py script
    data = {"email": "koratla@gmail.com"}
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.json()}")
        
        if response.status_code == 400 and response.json().get("detail") == "User Already Exists":
            print("SUCCESS: Duplicate email check working!")
        else:
            print("FAILURE: Duplicate email check NOT working as expected.")
    except Exception as e:
        print(f"Error during test: {e}")

if __name__ == "__main__":
    test_request_otp_duplicate()

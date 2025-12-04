import requests

url = 'http://localhost:5000/login'
data = {'username': 'admin', 'password': 'password'}
headers = {'Content-Type': 'application/json'}

response = requests.post(url, json=data, headers=headers)
print(f'Status: {response.status_code}')
print(f'Response: {response.json()}')

import urllib.request
import json
url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=AQ.Ab8RN6IAChoAnHShKfOffREwBXg8cCCLkK9-wp4ko_615LbqOA'
data = json.dumps({"contents":[{"parts":[{"text":"Hi"}]}]}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code}")
    print(e.read().decode())

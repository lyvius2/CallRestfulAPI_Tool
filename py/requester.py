# requester.py
import sys
import requests

class ApiError(Exception):
    def __init__(self, msg):
        self.msg = msg

    def __str__(self):
        return self.msg

def request_api(method, url, params):
    try:
        if method == 'get':
            res = requests.get(url, params=params)
        else:
            res = requests.post(url, data=params)
        if res.status_code == 200:
            return res.text
        else:
            raise ApiError('Response Status Code : %s' % res.status_code)
    except Exception as e:
        return e

print(ascii(request_api(sys.argv[1], sys.argv[2], eval(sys.argv[3]))))

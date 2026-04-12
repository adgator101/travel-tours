import urllib.request
url = 'https://travel-tours-app.happygrass-dcd4e26f.centralindia.azurecontainerapps.io/'
try:
    html = urllib.request.urlopen(url, timeout=10).read().decode('utf-8', errors='ignore')
    print(html[:4000])
except Exception as e:
    print('ERROR', e)

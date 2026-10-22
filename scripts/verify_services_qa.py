import subprocess, time, json, urllib.request, websocket, os, shutil, base64

user_data = 'C:/haraya/temp_verify_services'
if os.path.exists(user_data):
    shutil.rmtree(user_data, ignore_errors=True)

proc = subprocess.Popen([
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    '--headless=new',
    '--remote-debugging-port=9231',
    '--remote-allow-origins=*',
    f'--user-data-dir={user_data}',
    '--window-size=1440,900',
    '--disable-gpu',
    'http://localhost:5173/index.html'
])

time.sleep(2.5)
try:
    tabs = json.loads(urllib.request.urlopen('http://localhost:9231/json').read())
    target_tab = None
    for tab in tabs:
        if '5173' in tab.get('url', ''):
            target_tab = tab
            break
    if not target_tab:
        target_tab = tabs[0]
        
    ws = websocket.create_connection(target_tab['webSocketDebuggerUrl'])
    ws.send(json.dumps({'id': 1, 'method': 'Page.navigate', 'params': {'url': 'http://localhost:5173/index.html'}}))
    time.sleep(1.5)
    
    # Check for console errors or broken images/links
    ws.send(json.dumps({'id': 2, 'method': 'Runtime.evaluate', 'params': {'expression': '''(() => {
        const errors = [];
        const brokenImages = Array.from(document.querySelectorAll('img')).filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src);
        const hero = document.querySelector('.hero').getBoundingClientRect();
        const cards = document.querySelector('.cards').getBoundingClientRect();
        const services = document.querySelector('#services').getBoundingClientRect();
        const cards3 = document.querySelectorAll('.service-card').length;
        return JSON.stringify({
            brokenImages,
            cards3Count: cards3,
            hero: { top: hero.top, height: hero.height },
            cards: { top: cards.top, bottom: cards.bottom, height: cards.height },
            services: { top: services.top, height: services.height },
            hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
        });
    })()'''}}))
    while True:
        msg = json.loads(ws.recv())
        if msg.get('id') == 2:
            print("Desktop 1440x900 QA:", msg['result']['result']['value'])
            break
    
    # Capture Desktop Full screenshot of Services section
    ws.send(json.dumps({'id': 3, 'method': 'Runtime.evaluate', 'params': {'expression': '''(() => {
        document.querySelector('#services').scrollIntoView();
        return true;
    })()'''}}))
    ws.recv()
    time.sleep(0.5)
    
    ws.send(json.dumps({'id': 4, 'method': 'Page.captureScreenshot'}))
    while True:
        msg = json.loads(ws.recv())
        if msg.get('id') == 4:
            with open('qa/services-desktop-view.png', 'wb') as f:
                f.write(base64.b64decode(msg['result']['data']))
            print("Saved qa/services-desktop-view.png")
            break

    # Test Mobile Viewport (375x812)
    ws.send(json.dumps({'id': 5, 'method': 'Emulation.setDeviceMetricsOverride', 'params': {
        'width': 375,
        'height': 812,
        'deviceScaleFactor': 2,
        'mobile': True
    }}))
    ws.recv()
    time.sleep(0.5)
    
    ws.send(json.dumps({'id': 6, 'method': 'Runtime.evaluate', 'params': {'expression': '''(() => {
        return JSON.stringify({
            hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth
        });
    })()'''}}))
    while True:
        msg = json.loads(ws.recv())
        if msg.get('id') == 6:
            print("Mobile 375px QA:", msg['result']['result']['value'])
            break
    
    ws.send(json.dumps({'id': 7, 'method': 'Page.captureScreenshot'}))
    while True:
        msg = json.loads(ws.recv())
        if msg.get('id') == 7:
            with open('qa/services-mobile-view.png', 'wb') as f:
                f.write(base64.b64decode(msg['result']['data']))
            print("Saved qa/services-mobile-view.png")
            break
            
    ws.close()
finally:
    proc.terminate()
    time.sleep(1)
    if os.path.exists(user_data):
        shutil.rmtree(user_data, ignore_errors=True)

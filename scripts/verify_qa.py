import subprocess
import time
import json
import urllib.request
import base64
import os
import websocket
from PIL import Image, ImageChops

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
QA_DIR = r"C:\haraya\qa"
os.makedirs(QA_DIR, exist_ok=True)

class CDPClient:
    def __init__(self, ws_url):
        self.ws = websocket.create_connection(ws_url, timeout=30)
        self.msg_id = 0
        self.events = []

    def send_cmd(self, method, params=None):
        self.msg_id += 1
        cid = self.msg_id
        payload = {"id": cid, "method": method}
        if params:
            payload["params"] = params
        self.ws.send(json.dumps(payload))
        
        while True:
            resp_raw = self.ws.recv()
            resp = json.loads(resp_raw)
            if "id" in resp and resp["id"] == cid:
                if "error" in resp:
                    raise Exception(f"CDP error on {method}: {resp['error']}")
                return resp.get("result", {})
            else:
                self.events.append(resp)

    def eval_js(self, expr):
        res = self.send_cmd("Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True})
        return res.get("result", {}).get("value")

    def close(self):
        try:
            self.ws.close()
        except:
            pass

def capture_page(client, url, out_path):
    client.send_cmd("Page.navigate", {"url": url})
    
    # Wait 4.0 seconds for intro animation to finish
    time.sleep(4.0)
    
    # Inject style to hide video on both pages
    # Also synchronize and pause floating animations at exactly 4000ms
    sync_expr = """
    (function(){
        document.head.insertAdjacentHTML('beforeend', '<style>video{visibility:hidden!important}</style>');
        document.getAnimations().forEach(function(anim) {
            anim.currentTime = 4000;
            anim.pause();
        });
    })()
    """
    client.eval_js(sync_expr)
    time.sleep(0.2)
    
    shot_data = client.send_cmd("Page.captureScreenshot", {"format": "png"})
    img_bytes = base64.b64decode(shot_data["data"])
    with open(out_path, "wb") as f:
        f.write(img_bytes)
    print(f"Saved {out_path} ({len(img_bytes)} bytes)")

def analyze_diff(name, orig_path, new_path):
    img_orig = Image.open(orig_path).convert("RGB")
    img_new = Image.open(new_path).convert("RGB")
    
    if img_orig.size != img_new.size:
        return f"{name.upper()}: Size mismatch! orig={img_orig.size}, new={img_new.size}", 100.0, True
    
    diff = ImageChops.difference(img_orig, img_new)
    diff.save(os.path.join(QA_DIR, f"{name}-diff.png"))
    
    total_pixels = img_orig.width * img_orig.height
    diff_data = diff.getdata()
    
    raw_diff = sum(1 for p in diff_data if p != (0, 0, 0))
    t5_diff = sum(1 for p in diff_data if max(p) > 5)
    t10_diff = sum(1 for p in diff_data if max(p) > 10)
    
    raw_pct = (raw_diff / total_pixels) * 100
    t5_pct = (t5_diff / total_pixels) * 100
    t10_pct = (t10_diff / total_pixels) * 100
    
    # Sliding window 20x20 check
    w, h = img_orig.size
    mask = [1 if max(p) > 5 else 0 for p in diff_data]
    max_20x20 = 0
    for y in range(0, h - 20, 5):
        for x in range(0, w - 20, 5):
            c = sum(mask[(y + dy) * w + (x + dx)] for dy in range(20) for dx in range(20))
            if c > max_20x20:
                max_20x20 = c
                
    has_large_region = max_20x20 >= 300
    bbox = diff.getbbox()
    
    passed = t5_pct < 0.5 and not has_large_region
    report = (f"{name.upper()}:\n"
              f"  - Total pixels: {total_pixels}\n"
              f"  - Differing pixels (raw): {raw_diff} ({raw_pct:.4f}%)\n"
              f"  - Differing pixels (threshold > 5): {t5_diff} ({t5_pct:.4f}%)\n"
              f"  - Differing pixels (threshold > 10): {t10_diff} ({t10_pct:.4f}%)\n"
              f"  - Max differing pixels in any 20x20 block: {max_20x20}/400\n"
              f"  - Difference bounding box: {bbox}\n"
              f"  - Pass condition (<0.5% and no 20x20 region): {'PASS' if passed else 'FAIL'}")
    return report, t5_pct, has_large_region

def main():
    profile_dir = r"C:\haraya\temp_chrome_qa"
    os.makedirs(profile_dir, exist_ok=True)
    
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9229",
        "--remote-allow-origins=*",
        "--disable-gpu",
        "--no-sandbox",
        "--mute-audio",
        f"--user-data-dir={profile_dir}"
    ])
    
    print("Launched Chrome, waiting for CDP...")
    time.sleep(2)
    
    try:
        req = urllib.request.Request("http://localhost:9229/json/new", method="PUT")
        with urllib.request.urlopen(req) as resp:
            page_info = json.loads(resp.read().decode())
        
        ws_url = page_info["webSocketDebuggerUrl"]
        print(f"Connecting to {ws_url}...")
        client = CDPClient(ws_url)
        
        client.send_cmd("Page.enable")
        client.send_cmd("Runtime.enable")
        client.send_cmd("Network.enable")
        client.send_cmd("Log.enable")

        tests = [
            ("desktop", 1672, 941, False),
            ("mobile", 390, 844, True)
        ]

        pages = [
            ("original", "http://localhost:5173/backup/hero-original.html"),
            ("new", "http://localhost:5173/index.html")
        ]

        # 1. Capture Screenshots
        for name, width, height, is_mobile in tests:
            print(f"\n--- Setting Viewport {name.upper()} ({width}x{height}) ---")
            client.send_cmd("Emulation.setDeviceMetricsOverride", {
                "width": width,
                "height": height,
                "deviceScaleFactor": 1,
                "mobile": is_mobile
            })
            for page_name, url in pages:
                out_path = os.path.join(QA_DIR, f"{name}-{page_name}.png")
                capture_page(client, url, out_path)

        # 2. Compare screenshots with Pillow
        diff_report_lines = []
        all_passed = True
        for name in ["desktop", "mobile"]:
            orig_path = os.path.join(QA_DIR, f"{name}-original.png")
            new_path = os.path.join(QA_DIR, f"{name}-new.png")
            
            report, pct, has_large_region = analyze_diff(name, orig_path, new_path)
            print("\n" + report)
            diff_report_lines.append(report)
            if pct >= 0.5 or has_large_region:
                all_passed = False

        print(f"\nOverall Visual Difference Condition (< 0.5% & no 20x20 region): {'PASSED' if all_passed else 'FAILED'}")

        report_content = "\n\n".join(diff_report_lines)
        with open(os.path.join(QA_DIR, "diff-report.txt"), "w") as f:
            f.write(report_content + "\n")
        print("Saved qa/diff-report.txt")

        # 3. Interactivity & Video Playback Verification on index.html
        print("\n--- Verifying Video and Interactivity on index.html ---")
        client.send_cmd("Emulation.setDeviceMetricsOverride", {
            "width": 1672,
            "height": 941,
            "deviceScaleFactor": 1,
            "mobile": False
        })
        client.events.clear()
        client.send_cmd("Page.navigate", {"url": "http://localhost:5173/index.html"})
        while client.eval_js("document.readyState") != "complete":
            time.sleep(0.05)
        time.sleep(2)

        network_404s = []
        for ev in client.events:
            if ev.get("method") == "Network.responseReceived":
                resp = ev["params"]["response"]
                if resp["status"] >= 400:
                    network_404s.append(f"{resp['url']} -> {resp['status']}")
        
        console_errors = []
        for ev in client.events:
            if ev.get("method") == "Log.entryAdded":
                entry = ev["params"]["entry"]
                if entry.get("level") in ["error"]:
                    console_errors.append(entry.get("text"))
        
        print(f"Network errors (4xx/5xx): {network_404s}")
        print(f"Console errors: {console_errors}")

        video_info = client.eval_js("""
        (function(){
            var v = document.querySelector('video');
            if(!v) return {exists: false};
            return {
                exists: true,
                paused: v.paused,
                currentTime: v.currentTime,
                duration: v.duration,
                currentSrc: v.currentSrc,
                videoWidth: v.videoWidth,
                videoHeight: v.videoHeight,
                loop: v.loop
            };
        })()
        """)
        print("Video initial info:", video_info)

        # Loop test: set currentTime near end and verify it wraps to near 0
        client.eval_js("var v = document.querySelector('video'); v.currentTime = Math.max(0, v.duration - 0.4); v.play();")
        print("Set video currentTime near end (6.6s), waiting for loop wrap...")
        time.sleep(1.2)

        loop_check = client.eval_js("""
        (function(){
            var v = document.querySelector('video');
            return {
                currentTime: v.currentTime,
                paused: v.paused,
                ended: v.ended
            };
        })()
        """)
        print("Video state after wrap/loop:", loop_check)
        video_loops = loop_check["currentTime"] < 2.0 and not loop_check["paused"]
        print(f"Video loop check: {'PASSED' if video_loops else 'FAILED'}")

        # Test 3D tilt on desktop
        tilt_test = client.eval_js("""
        (function(){
            var h = document.querySelector('.hero');
            var v = document.querySelector('video');
            var r = h.getBoundingClientRect();
            var event = new PointerEvent('pointermove', {
                clientX: r.left + r.width * 0.8,
                clientY: r.top + r.height * 0.8,
                bubbles: true
            });
            document.dispatchEvent(event);
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve({
                        videoTransform: v.style.transform,
                        glowTransform: document.querySelector('.glow').style.transform
                    });
                }, 150);
            });
        })()
        """)
        print("3D Tilt Test Result:", tilt_test)

        # Test Mobile Menu toggle at 390x844
        print("\n--- Verifying Mobile Menu Toggle ---")
        client.send_cmd("Emulation.setDeviceMetricsOverride", {
            "width": 390,
            "height": 844,
            "deviceScaleFactor": 1,
            "mobile": True
        })
        time.sleep(0.5)

        menu_open = client.eval_js("""
        (function(){
            var bg = document.getElementById('bg');
            var nav = document.getElementById('nav');
            bg.click();
            return {
                navHasOpen: nav.classList.contains('open'),
                bgAriaExpanded: bg.getAttribute('aria-expanded')
            };
        })()
        """)
        print("Menu open check:", menu_open)

        menu_close = client.eval_js("""
        (function(){
            var bg = document.getElementById('bg');
            var nav = document.getElementById('nav');
            bg.click();
            return {
                navHasOpen: nav.classList.contains('open'),
                bgAriaExpanded: bg.getAttribute('aria-expanded')
            };
        })()
        """)
        print("Menu close check:", menu_close)

        client.close()

    finally:
        proc.terminate()
        proc.wait()
        print("Chrome finished.")

if __name__ == "__main__":
    main()

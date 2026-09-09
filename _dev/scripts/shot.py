#!/usr/bin/python3
"""uso: shot.py <out_dir> <path> <name> [full]
Captura desktop (1440) y móvil (390) con el loader saltado, reveals forzados y scroll completo."""
import sys, time
from playwright.sync_api import sync_playwright

out, path, name = sys.argv[1], sys.argv[2], sys.argv[3]
url = "http://127.0.0.1:8093" + path

FORCE_CSS = """
#loader{display:none!important}
.sr,.port-card,.hero-static-eyebrow,.hero-static-sub,.hero-static-actions,#heroEyebrow,#heroSub,#heroActions{opacity:1!important;transform:none!important}
.cursor-dot,.cursor-ring{display:none!important}
*{animation-play-state:paused!important}
"""

def snap(p, vw, vh, mobile, suffix):
    ctx = p.chromium.launch_persistent_context if False else None
    browser = p.chromium.launch(executable_path="/Users/carlos/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell")
    ctx = browser.new_context(viewport={"width": vw, "height": vh}, device_scale_factor=1,
                              is_mobile=mobile, has_touch=mobile,
                              user_agent=("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" if mobile else None) or None)
    page = ctx.new_page()
    BLOCK=("googletagmanager","metricool","google-analytics","facebook","hotjar","challenges.cloudflare","doubleclick","connect.facebook")
    ctx.route("**/*", lambda route: route.abort() if any(b in route.request.url for b in BLOCK) else route.continue_())
    page.add_init_script("try{sessionStorage.setItem('cs_v','1');localStorage.setItem('cs_consent','{\"analytics\":false,\"marketing\":false,\"ts\":1}')}catch(e){}")
    page.goto(url, wait_until="load", timeout=45000); time.sleep(1.2)
    page.add_style_tag(content=FORCE_CSS)
    # scroll para disparar ScrollTrigger / IntersectionObserver
    h = page.evaluate("document.body.scrollHeight")
    y = 0
    while y < h:
        page.evaluate(f"window.scrollTo(0,{y})"); time.sleep(0.12); y += vh // 2
        h = page.evaluate("document.body.scrollHeight")
    page.evaluate("window.scrollTo(0,0)"); time.sleep(0.6)
    # cerrar banner cookies si existe
    page.evaluate("var b=document.getElementById('cookie-banner')||document.querySelector('.cc-banner,[id*=cookie]'); if(b) b.style.display='none'")
    page.add_style_tag(content=FORCE_CSS)
    page.screenshot(path=f"{out}/{name}-{suffix}.png", full_page=True)
    browser.close()

with sync_playwright() as p:
    snap(p, 1440, 900, False, "desktop")
    snap(p, 390, 844, True, "mobile")
print("ok", name)

from playwright.sync_api import sync_playwright
from pathlib import Path
import base64, mimetypes, json, sys
ROOT=Path(__file__).resolve().parents[2]
CSS=(ROOT/'styles.css').read_text()
DATA=(ROOT/'data.js').read_text()
APP=(ROOT/'app.js').read_text()
MOCK="""
const CM_STORAGE={_d:{},getItem(k){return this._d[k]??null},setItem(k,v){this._d[k]=String(v)},removeItem(k){delete this._d[k]}};
const CM_SESSION={_d:{},getItem(k){return this._d[k]??null},setItem(k,v){this._d[k]=String(v)},removeItem(k){delete this._d[k]}};
"""
APP=MOCK+APP.replace('localStorage','CM_STORAGE').replace('sessionStorage','CM_SESSION')

def data_uri(rel):
    p=ROOT/rel
    mime=mimetypes.guess_type(p.name)[0] or 'application/octet-stream'
    return f'data:{mime};base64,'+base64.b64encode(p.read_bytes()).decode()
for rel in ['assets/logo-mark.svg','assets/founder-shriyan.jpg','assets/founder-signature.png','assets/seal.svg','assets/approved-brand-board.webp','assets/qr-preview.png']:
    APP=APP.replace(rel,data_uri(rel))
HTML=f'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>{CSS}</style></head><body><a class="skip-link" href="#main">Skip to content</a><div id="app"></div><script>{DATA}</script><script>{APP}</script></body></html>'''

routes=['#/','#/careers','#/compare','#/about','#/methodology','#/credentials','#/passport','#/privacy','#/terms','#/disclaimer','#/credential-policy','#/login','#/admin-preview']
careers=[]
# Parse career ids from JS object with a tiny node-like regex-free approach after browser boot.
errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1280,'height':900})
    page.on('pageerror',lambda e: errors.append('PAGEERROR: '+str(e)))
    page.on('console',lambda m: errors.append('CONSOLE: '+m.text) if m.type=='error' else None)
    page.set_content(HTML,wait_until='load',timeout=30000)
    page.evaluate("CM.toggleQa()")
    careers=page.evaluate("window.CM_DATA.careers.map(c=>c.id)")
    for cid in careers:
        routes += [f'#/career/{cid}',f'#/learn/{cid}/1',f'#/learn/{cid}/2',f'#/learn/{cid}/3',f'#/learn/{cid}/4',f'#/learn/{cid}/5',f'#/quiz/{cid}/1',f'#/quiz/{cid}/5',f'#/simulation/{cid}',f'#/final/{cid}']
    # create a fully-complete flagship state for credential routes
    page.evaluate("CM.qaScores(90)")
    routes += ['#/achievement/investment-banking/foundations','#/achievement/investment-banking/applied','#/achievement/investment-banking/career','#/credential/investment-banking/career','#/certificate/investment-banking/foundations','#/certificate/investment-banking/applied','#/certificate/investment-banking/career']
    bad=[]
    for route in routes:
        page.evaluate("r=>{location.hash=r}",route)
        page.wait_for_timeout(25)
        txt=page.locator('body').inner_text()
        if 'Something went wrong.' in txt or len(txt)<30:
            bad.append((route,txt[:200]))
    print(json.dumps({'routes_checked':len(routes),'careers':len(careers),'bad_routes':bad,'errors':errors[:50]},indent=2))
    browser.close()
    if bad or errors:
        sys.exit(1)

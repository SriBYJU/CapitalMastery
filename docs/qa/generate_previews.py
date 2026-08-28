from playwright.sync_api import sync_playwright
from pathlib import Path
import base64,mimetypes,shutil
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/product-preview'
CSS=(ROOT/'styles.css').read_text(); DATA=(ROOT/'data.js').read_text(); APP=(ROOT/'app.js').read_text()
MOCK="""const CM_STORAGE={_d:{},getItem(k){return this._d[k]??null},setItem(k,v){this._d[k]=String(v)},removeItem(k){delete this._d[k]}}; const CM_SESSION={_d:{},getItem(k){return this._d[k]??null},setItem(k,v){this._d[k]=String(v)},removeItem(k){delete this._d[k]}};"""
APP=MOCK+APP.replace('localStorage','CM_STORAGE').replace('sessionStorage','CM_SESSION')
def uri(rel):
 p=ROOT/rel; mime=mimetypes.guess_type(p.name)[0] or 'application/octet-stream'; return f'data:{mime};base64,'+base64.b64encode(p.read_bytes()).decode()
for rel in ['assets/logo-mark.svg','assets/founder-shriyan.jpg','assets/founder-signature.png','assets/seal.svg','assets/approved-brand-board.webp','assets/qr-preview.png']:
 APP=APP.replace(rel,uri(rel))
HTML=f'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>{CSS}</style></head><body><a class="skip-link" href="#main">Skip to content</a><div id="app"></div><script>{DATA}</script><script>{APP}</script></body></html>'''
for p in OUT.glob('*/*.png'): p.unlink()
shutil.copy2(ROOT/'assets/approved-brand-board.webp',OUT/'01-brand/brand-board.png')

def shot(page,route,path,full=True,qa=False):
 if qa: page.evaluate("()=>{ if(!document.body.classList.contains('qa-dummy')){} }")
 page.evaluate("r=>{location.hash=r}",route)
 page.wait_for_timeout(120)
 page.screenshot(path=str(OUT/path),full_page=full)

def open_site(browser,w,h):
 page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
 page.set_content(HTML,wait_until='load',timeout=30000); page.wait_for_timeout(100)
 return page
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'])
 pg=open_site(b,1440,1000)
 # baseline desktop
 shot(pg,'#/','02-homepage/home-desktop.png')
 shot(pg,'#/careers','05-career-pathway/career-directory.png')
 shot(pg,'#/login','03-login/firebase-pending-login.png')
 shot(pg,'#/about','14-founder/about-founder.png')
 shot(pg,'#/methodology','06-learning/research-methodology.png')
 # QA unlock, complete flagship
 pg.evaluate("CM.toggleQa()")
 pg.evaluate("CM.qaScores(90)")
 shot(pg,'#/passport','04-dashboard/my-learning-passport.png')
 shot(pg,'#/career/investment-banking','05-career-pathway/investment-banking-pathway.png')
 shot(pg,'#/learn/investment-banking/1','06-learning/foundations-lesson.png')
 shot(pg,'#/learn/investment-banking/2','06-learning/technical-academy.png')
 shot(pg,'#/learn/investment-banking/4','08-applied-work/applied-work.png')
 shot(pg,'#/quiz/investment-banking/1','07-quizzes/foundations-quiz.png')
 shot(pg,'#/final/investment-banking','07-quizzes/final-exam.png')
 shot(pg,'#/simulation/investment-banking','09-job-simulation/inbox.png')
 # workspace and results tabs
 pg.locator('[data-sim-tab="workspace"]').click(); pg.wait_for_timeout(100); pg.screenshot(path=str(OUT/'09-job-simulation/workspace.png'),full_page=True)
 pg.locator('[data-sim-tab="results"]').click(); pg.wait_for_timeout(100); pg.screenshot(path=str(OUT/'09-job-simulation/results.png'),full_page=True)
 shot(pg,'#/achievement/investment-banking/career','10-completion/career-certificate-earned.png')
 shot(pg,'#/certificate/investment-banking/foundations','11-certificates/foundations-certificate.png')
 shot(pg,'#/certificate/investment-banking/applied','11-certificates/applied-skills-certificate.png')
 shot(pg,'#/certificate/investment-banking/career','11-certificates/career-certificate.png')
 shot(pg,'#/credentials','12-credentials/my-credentials.png')
 shot(pg,'#/credential/investment-banking/career','12-credentials/career-credential-detail.png')
 # sharing modal screenshots
 shot(pg,'#/credential/investment-banking/career','13-linkedin-sharing/base.png')
 pg.evaluate("CM.linkedinFields('investment-banking','career')"); pg.wait_for_timeout(100); pg.screenshot(path=str(OUT/'13-linkedin-sharing/add-to-linkedin.png'),full_page=False); pg.evaluate('CM.closeModal()')
 pg.evaluate("CM.postModal('investment-banking','career')"); pg.wait_for_timeout(100); pg.screenshot(path=str(OUT/'13-linkedin-sharing/linkedin-post-generator.png'),full_page=False); pg.evaluate('CM.closeModal()')
 shot(pg,'#/admin-preview','15-admin/admin-qa-dashboard.png')
 pg.close()
 # Mobile snapshots
 mob=open_site(b,390,844); mob.evaluate("CM.toggleQa()"); mob.evaluate("CM.qaScores(90)")
 shot(mob,'#/','16-mobile/home-mobile.png')
 shot(mob,'#/career/investment-banking','16-mobile/career-mobile.png')
 shot(mob,'#/achievement/investment-banking/career','16-mobile/achievement-mobile.png')
 shot(mob,'#/certificate/investment-banking/career','16-mobile/certificate-mobile.png')
 mob.close(); b.close()
print('generated',len(list(OUT.glob('*/*.png'))),'preview images')

from pathlib import Path
import subprocess, json, re, sys
from playwright.sync_api import sync_playwright
import base64,mimetypes
ROOT=Path(__file__).resolve().parents[2]
results={'checks':{},'failures':[]}

def ok(name,value=True,detail=''):
    results['checks'][name]={'pass':bool(value),'detail':detail}
    if not value: results['failures'].append(name)

# Static syntax and content checks
r=subprocess.run(['node','--check',str(ROOT/'app.js')],capture_output=True,text=True)
ok('javascript_syntax',r.returncode==0,r.stderr.strip())
# Load data via node and parse JSON output
node_script=f"""const fs=require('fs'),vm=require('vm');let c={{window:{{}}}};vm.createContext(c);vm.runInContext(fs.readFileSync('{ROOT/'data.js'}','utf8'),c);console.log(JSON.stringify(c.window.CM_DATA));"""
r=subprocess.run(['node','-e',node_script],capture_output=True,text=True)
D=json.loads(r.stdout)
careers=D['careers']
ok('career_count_16',len(careers)==16,f"{len(careers)} careers")
ok('credential_claim_48',len(careers)*3==48,'16 pathways × 3 certificates = 48')
ok('marketing_claim_45plus',D['stats']['marketingCredentials']=='45+','Homepage claim 45+ is below actual 48')
ids=[c['id'] for c in careers]
ok('career_ids_unique',len(ids)==len(set(ids)))
ok('career_content_depth',all(len(c['vocab'])>=10 and len(c['concepts'])>=5 and len(c['toolkit'])>=6 and len(c['applied'])>=5 and len(c['sources'])>=5 for c in careers),'Each career: ≥10 vocab, ≥5 concepts, ≥6 toolkit labs, ≥5 applied tasks, ≥5 sources')
missing_vocab=[]; missing_concepts=[]
for c in careers:
    missing_vocab += [(c['id'],v) for v in c['vocab'] if v not in D['vocab']]
    missing_concepts += [(c['id'],x) for x in c['concepts'] if x not in D.get('concepts',{})]
ok('all_vocab_defined',not missing_vocab,str(missing_vocab[:10]))
ok('all_concepts_defined',not missing_concepts,str(missing_concepts[:10]))
ok('research_source_count',len(D['researchSources'])>=20,f"{len(D['researchSources'])} named research sources")
ok('source_urls_https',all(s['url'].startswith('https://') for s in D['researchSources']))
# Required assets / docs
required=['index.html','app.js','data.js','styles.css','manifest.webmanifest','robots.txt','sitemap.xml','assets/logo-mark.svg','assets/logo-horizontal.svg','assets/seal.svg','assets/founder-shriyan.jpg','assets/founder-signature.png']
ok('required_files_present',all((ROOT/x).exists() for x in required),', '.join(x for x in required if not (ROOT/x).exists()))
idx=(ROOT/'index.html').read_text()
ok('seo_title', '45+ Free Finance Credentials' in idx and 'Made by Shriyan Avadhanula' in idx)
ok('meta_description', '<meta name="description"' in idx)
ok('manifest_linked','manifest.webmanifest' in idx)

# Browser-based UI route + logic checks with in-memory storage
CSS=(ROOT/'styles.css').read_text(); DATA=(ROOT/'data.js').read_text(); APP=(ROOT/'app.js').read_text()
MOCK="""const CM_STORAGE={_d:{},getItem(k){return this._d[k]??null},setItem(k,v){this._d[k]=String(v)},removeItem(k){delete this._d[k]}}; const CM_SESSION={_d:{},getItem(k){return this._d[k]??null},setItem(k,v){this._d[k]=String(v)},removeItem(k){delete this._d[k]}};"""
APP=MOCK+APP.replace('localStorage','CM_STORAGE').replace('sessionStorage','CM_SESSION')
def uri(rel):
    p=ROOT/rel; mime=mimetypes.guess_type(p.name)[0] or 'application/octet-stream'; return f'data:{mime};base64,'+base64.b64encode(p.read_bytes()).decode()
for rel in ['assets/logo-mark.svg','assets/founder-shriyan.jpg','assets/founder-signature.png','assets/seal.svg','assets/approved-brand-board.webp','assets/qr-preview.png']:
    APP=APP.replace(rel,uri(rel))
HTML=f'<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>{CSS}</style></head><body><a class="skip-link" href="#main">Skip</a><div id="app"></div><script>{DATA}</script><script>{APP}</script></body></html>'
errors=[]; bad_routes=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1280,'height':900})
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.on('console',lambda m: errors.append(m.text) if m.type=='error' else None)
    page.set_content(HTML,wait_until='load',timeout=30000); page.wait_for_timeout(50)
    page.evaluate('CM.toggleQa()')
    routes=['#/','#/careers','#/compare','#/about','#/methodology','#/credentials','#/passport','#/privacy','#/terms','#/disclaimer','#/credential-policy','#/login','#/admin-preview']
    for cid in ids:
        routes += [f'#/career/{cid}',*[f'#/learn/{cid}/{n}' for n in range(1,6)],f'#/quiz/{cid}/1',f'#/quiz/{cid}/5',f'#/simulation/{cid}',f'#/final/{cid}']
    page.evaluate('CM.qaScores(90)')
    routes += ['#/achievement/investment-banking/foundations','#/achievement/investment-banking/applied','#/achievement/investment-banking/career','#/credential/investment-banking/career','#/certificate/investment-banking/foundations','#/certificate/investment-banking/applied','#/certificate/investment-banking/career']
    for route in routes:
        page.evaluate('(r)=>location.hash=r',route); page.wait_for_timeout(12)
        txt=page.locator('body').inner_text()
        if 'Something went wrong.' in txt or len(txt)<25: bad_routes.append(route)
    ok('ui_route_sweep',not bad_routes,f"{len(routes)} routes checked; bad={bad_routes}")
    ok('browser_console_clean',not errors,str(errors[:10]))
    # Question counts
    page.evaluate("location.hash='#/quiz/investment-banking/1'"); page.wait_for_timeout(30)
    ok('part_quiz_10_questions',page.locator('fieldset.question').count()==10,f"{page.locator('fieldset.question').count()}")
    page.evaluate("location.hash='#/final/investment-banking'"); page.wait_for_timeout(30)
    ok('final_exam_20_questions',page.locator('fieldset.question').count()==20,f"{page.locator('fieldset.question').count()}")
    # Threshold boundary: 79 should not issue final career, 80 should.
    page.evaluate('CM.qaScores(79)'); st79=json.loads(page.evaluate("CM_STORAGE.getItem('capitalMasteryLocalStateV1')"))
    career79=[x for x in st79['credentials'] if x['careerId']=='investment-banking' and x['type']=='career']
    ok('threshold_79_fails',len(career79)==0,f"career credentials={len(career79)}")
    page.evaluate('CM.qaScores(80)'); st80=json.loads(page.evaluate("CM_STORAGE.getItem('capitalMasteryLocalStateV1')"))
    career80=[x for x in st80['credentials'] if x['careerId']=='investment-banking' and x['type']=='career']
    ok('threshold_80_passes',len(career80)==1,f"career credentials={len(career80)}")
    # Credential date/id and one-per-type behavior
    page.evaluate('CM.qaScores(100)'); st100=json.loads(page.evaluate("CM_STORAGE.getItem('capitalMasteryLocalStateV1')"))
    ibcreds=[x for x in st100['credentials'] if x['careerId']=='investment-banking']
    ok('three_credentials_per_completed_path',len(ibcreds)==3,f"{len(ibcreds)}")
    ok('unique_credential_ids',len({x['credentialId'] for x in ibcreds})==3)
    ok('credential_issue_dates_present',all(x.get('issuedAt') for x in ibcreds))
    # Simulation workspace and score display
    page.evaluate("location.hash='#/simulation/investment-banking'"); page.wait_for_timeout(30)
    page.locator('[data-sim-tab="workspace"]').click(); page.wait_for_timeout(20)
    ok('simulation_workspace_has_tasks',page.locator('.work-task').count()>=6,f"{page.locator('.work-task').count()} tasks")
    # Sharing modals
    page.evaluate("location.hash='#/credential/investment-banking/career'"); page.wait_for_timeout(30)
    page.evaluate("CM.linkedinFields('investment-banking','career')"); page.wait_for_timeout(20)
    ok('linkedin_add_profile_modal','Credential ID' in page.locator('#cm-modal').inner_text())
    page.evaluate('CM.closeModal()'); page.evaluate("CM.postModal('investment-banking','career')"); page.wait_for_timeout(20)
    ok('linkedin_post_generator','Professional' in page.locator('#cm-modal').inner_text() and 'Detailed' in page.locator('#cm-modal').inner_text())
    page.evaluate('CM.closeModal()')
    # Mobile overflow key screens
    page.set_viewport_size({'width':390,'height':844})
    overflow=[]
    for route in ['#/','#/career/investment-banking','#/achievement/investment-banking/career','#/certificate/investment-banking/career']:
        page.evaluate('(r)=>location.hash=r',route); page.wait_for_timeout(30)
        sw=page.evaluate('document.documentElement.scrollWidth'); iw=page.evaluate('innerWidth')
        if sw>iw+2: overflow.append((route,sw,iw))
    ok('mobile_no_horizontal_overflow',not overflow,str(overflow))
    browser.close()

# Preview screenshot count
preview_count=len(list((ROOT/'docs/product-preview').glob('*/*.png'))) + len(list((ROOT/'docs/product-preview').glob('*/*.webp')))
ok('preview_screenshot_package',preview_count>=25,f"{preview_count} organized screenshots")

out=ROOT/'docs/qa/audit-results.json'; out.write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
sys.exit(1 if results['failures'] else 0)

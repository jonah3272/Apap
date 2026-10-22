#!/usr/bin/env python3
"""Build a public Pages artifact using the URL returned by actions/configure-pages.
The private Sites config and its custom-domain verification remain unchanged.
"""
from pathlib import Path
from urllib.parse import urlsplit
import os,json,subprocess,sys,tempfile
root=Path(__file__).resolve().parents[1]
cfg=json.loads((root/'config.json').read_text())
if not cfg.get('publicLaunchApproved'):
    raise SystemExit('Public launch has not been authorized in config.json.')
base=os.environ.get('PAGES_BASE_URL','').rstrip('/')
u=urlsplit(base)
custom=urlsplit(cfg['targetDomain']).hostname
if u.scheme!='https' or not u.hostname or u.query or u.fragment or u.username or u.password:
    raise SystemExit('PAGES_BASE_URL must be the HTTPS URL returned by configure-pages.')
if not (u.hostname.endswith('.github.io') or u.hostname in {custom,'www.'+custom}):
    raise SystemExit('Pages URL is not github.io or the configured custom domain.')
if u.path and any(not (c.isalnum() or c in '/-_') for c in u.path):
    raise SystemExit('Unsupported Pages base path.')
cfg.update(origin=base,targetDomain=base,publicationMode='public',domainConnectionVerified=True,hostingProvider='GitHub Pages')
# The URL is supplied by the authenticated provider, not assumed to be apapsif.com.
with tempfile.TemporaryDirectory(prefix='apapsif-pages-') as tmp:
    p=Path(tmp)/'config.json';p.write_text(json.dumps(cfg,ensure_ascii=False))
    env={**os.environ,'APAPSIF_CONFIG':str(p)}
    subprocess.run([sys.executable,str(root/'scripts/build.py')],cwd=root,env=env,check=True)
    subprocess.run([sys.executable,str(root/'scripts/check.py')],cwd=root,env=env,check=True)
(root/'dist/.nojekyll').touch()
# These files configure other hosts and must not be published as Pages content.
for name in ('_headers','_redirects'):
    (root/'dist'/name).unlink(missing_ok=True)
print('Public Pages artifact prepared for '+base)

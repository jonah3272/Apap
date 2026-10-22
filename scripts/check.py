#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,sys,os,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist';cfg=json.loads(Path(os.environ.get('APAPSIF_CONFIG',ROOT/'config.json')).read_text());errors=[];titles=[];descriptions=[];pages={}
class Page(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.links=[];self.h1=0;self.canon=[];self.robots=[];self.forms=[];self.ld=[];self.inscript=False;self.title='';self.intitle=False;self.desc=[];self.lang='';self.images=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id'in a:self.ids.append(a['id'])
  if tag=='html':self.lang=a.get('lang','')
  if tag=='h1':self.h1+=1
  if tag=='a':self.links.append(a.get('href',''))
  if tag=='title':self.intitle=True
  if tag=='meta' and a.get('name')=='description':self.desc.append(a.get('content',''))
  if tag=='meta' and a.get('name')=='robots':self.robots.append(a.get('content',''))
  if tag=='link' and a.get('rel')=='canonical':self.canon.append(a.get('href',''))
  if tag=='form':self.forms.append(a)
  if tag=='img':self.images.append(a)
  if tag=='script' and a.get('type')=='application/ld+json':self.inscript=True
 def handle_data(self,text):
  if self.intitle:self.title+=text
  if self.inscript:
   try:self.ld.extend(json.loads(text))
   except Exception as e:errors.append(f'Invalid JSON-LD: {e}')
 def handle_endtag(self,tag):
  if tag=='title':self.intitle=False
  if tag=='script':self.inscript=False
for file in DIST.rglob('*.html'):
 p=Page();p.feed(file.read_text());pages[file]=p
 if p.h1!=1:errors.append(f'{file}: expected one H1')
 if p.lang!='es-PA':errors.append(f'{file}: missing Spanish language')
 if len(p.ids)!=len(set(p.ids)):errors.append(f'{file}: duplicate IDs')
 route='/404.html' if file==DIST/'404.html' else '/'+file.relative_to(DIST).as_posix().removesuffix('index.html')
 if p.canon!=[cfg['origin'].rstrip('/')+route]:errors.append(f'{file}: canonical does not match its route')
 if len(p.desc)!=1 or not 50<=len(p.desc[0])<=220:errors.append(f'{file}: description length')
 if cfg['publicationMode']!='public' and not any('noindex'in x for x in p.robots):errors.append(f'{file}: preview indexable')
 if p.forms:errors.append(f'{file}: unapproved data collection')
 organizations=[x for x in p.ld if x.get('@type')=='Organization']
 if len(organizations)!=1 or organizations[0].get('name')!=cfg['organization']:errors.append(f'{file}: inaccurate organization identity')
 if organizations and set(organizations[0])!={'@context','@type','@id','name','alternateName','url','logo'}:errors.append(f'{file}: unapproved institutional schema claims')
 for image in p.images:
  if not all(x in image for x in ['alt','width','height']):errors.append(f'{file}: image accessibility/layout attributes')
 titles.append(p.title);descriptions.extend(p.desc)
if len(titles)!=len(set(titles)):errors.append('Duplicate titles')
if len(descriptions)!=len(set(descriptions)):errors.append('Duplicate descriptions')
links=0
for file,p in pages.items():
 for href in p.links:
  links+=1;u=urlsplit(href)
  if u.scheme or u.netloc:continue
  if not href or href=='#':errors.append(f'{file}: empty href');continue
  base=urlsplit(cfg['origin']).path.rstrip('/')
  local_path=u.path
  if base and local_path.startswith(base+'/'):local_path=local_path[len(base):]
  target=(DIST/local_path.lstrip('/'))if local_path else file
  if target.is_dir():target=target/'index.html'
  if not target.exists():errors.append(f'{file}: missing target {href}');continue
  if u.fragment and target in pages and unquote(u.fragment)not in pages[target].ids:errors.append(f'{file}: missing fragment {href}')
root=ET.parse(DIST/'sitemap.xml').getroot()
if len(root)!=len(pages)-1:errors.append('Sitemap page count mismatch')
sitemap_urls={x.findtext('{http://www.sitemaps.org/schemas/sitemap/0.9}loc') for x in root}
if sitemap_urls!={p.canon[0] for file,p in pages.items() if file!=DIST/'404.html'}:errors.append('Sitemap URLs do not match content canonicals')
if cfg['publicationMode']!='public' and 'Disallow: /'not in(DIST/'robots.txt').read_text():errors.append('Preview not protected in robots')
if cfg['publicationMode']!='public' and 'X-Robots-Tag: noindex'not in(DIST/'_headers').read_text():errors.append('Preview missing non-indexing response header declaration')
if cfg['publicationMode']=='public' and ('Disallow: /' in (DIST/'robots.txt').read_text()):errors.append('Public site blocks crawling')
if cfg['publicationMode']=='public' and not (cfg.get('publicLaunchApproved') and cfg.get('domainConnectionVerified') and cfg['origin'].rstrip('/')==cfg['targetDomain'].rstrip('/')):errors.append('Public launch conditions not met')
print(json.dumps({'pages':len(pages),'links':links,'sitemapEntries':len(root),'staticAssetBytes':sum(p.stat().st_size for p in(DIST/'assets').glob('*')),'errors':errors},indent=2))
sys.exit(bool(errors))

"""Import approved campaign writings and IC posts; raw Discord exports stay outside the repo."""
import argparse,json,shutil,tempfile,zipfile,xml.etree.ElementTree as E
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
W='{'+NS['w']+'}'
DOCS={
 'Year_of_Dust_47.docx':('year-of-dust-47','Year of Dust 47','Opening chronicle','Day of Salt · Year of Dust 47','At the end of the Blind Steppes, the Company gathers for the Reading. The Captain promises a new beginning.'),
 'Year_47_Part_2.docx':('year-47-part-two','Year 47 · Part II','Orders & departure','After the Day of Salt gathering','The officers choose a Devil’s Knuckle to cross the ridge, enter the city, and find answers before supplies run out.'),
 'The_Annals_of_the_Black_Company_-_The_First_Book.docx':('first-book','The First Book','The Annals','Day of Salt through Suraan · Year of Dust 47','The full record of the Devil’s Knuckle: Caras, Dengbi, Gjol Port, Thar Anos, and the Drum of Telembor.'),
 'Annals_Summary_-_Captains_Briefing.docx':('captains-briefing','The Captain’s briefing','Session 1 · summary','Day of Salt through Suraan · Year of Dust 47','A shorter account of the First Book, prepared at the Captain’s request. The victories, the losses, and the charge left at Telembor.'),
 'BC_S2_Quick_Recap.docx':('session-two','Session 2 · The reckoning','Session recap','Muirthemne, Forest Heart & Harran','From the Rhish ambush and the Inaccessible Collection to the Collector’s Vault, Harran, and a new contract with Soulblighter.'),
 'The_Fourth_Ur_Annals.docx':('fourth-ur-annals','The Fourth Ur-Annals','Recovered historical record','The Hand of Chalk · an earlier Company','Entries in the hand of Chalk: older Brothers, their losses, and the road through Dun Thavok and Scholomance. Historical dates remain inside the text.'),
 'S3_Preamble_-_The_Road_to_Gregors_Ditch.docx':('road-to-gregors-ditch','The road to Gregor’s Ditch','Session 3 · preamble','After Scales · the Sunkenlands','In the rain, Croaker reads a troubling old account. The Captain explains the new contract, and the LT speaks of the Taken.')
}
AUTHORS={'The_Frostrune':'Gallows','TheBit':'Prancer','Fitz':'Bumble','Kartoonstew':'Tulip','Catfish':'Twitch','BGM':'Grimace','The Idle Villager#OG1':'Herbie','smalls':'Narrator & NPCs'}
# Whole-message asides reviewed from the export. Mixed IC/OOC messages retain their full text in IC.
ASIDES=set('1477861085628469380 1477862458369511424 1477879882481533039 1494877607282606250 1494877707312562239 1494878173052276906 1494878569988624434 1494878925082464306 1494879342226968757 1494880130395279483 1494880233197797527 1495870632578121750 1495968799814324256 1497330072133046443 1497330135123365899 1497337073886035968 1498272789419790408 1501264366169882714 1501268501724270703 1501268610549813407 1503133364801110046 1518242844148633702 1518243328699797644 1518243600113205368'.split())

# Approved writings supplied outside the Discord export. They have no Discord `created_at`, so they carry
# explicit archive-addition provenance instead of an invented publication timestamp.
ADDED='2026-09-21'
SUPPLEMENTS=[{
 'file':'S3 Summary Annals.docx','asset':'session-three.docx','id':'session-three',
 'title':'Session 3 · War in the West','label':'Session 3 · summary',
 'period':'Gregor’s Ditch, Marrow & the hunt for the White Rose',
 'description':'Croaker’s account of the Ditch contract: the Chalkwood ambush, the siege at Marrow, Two Tower and Drumford, the hunt for the White Rose, the duel at the river crossing, and the night Crispus died.'
}]
# A reviewed expanded source supersedes the export copy of a bundled writing. The export file is kept as the original filing.
EXPANDED={'The_Fourth_Ur_Annals.docx':{'file':'The Fourth Ur Annals S1-S3.docx','asset':'fourth-ur-annals-s1-s3.docx','updatedAt':ADDED}}
# The seven revelation headings reviewed for the expanded Fourth Ur-Annals, in reading order.
REVELATIONS={
 'REVEALED WHEN THE PARTY FIRST ARRIVED AT HARRAN.':'Revealed at Harran',
 'REVEALED WHEN THE PARTY APPROACHED THE COLLECTOR’S VAULT IN FOREST HEART.':'Approaching the Collector’s Vault',
 'REVEALED WHEN THE PARTY ENTERED THE VAULT IN FOREST HEART.':'Inside the Vault at Forest Heart',
 'REVEALED WHEN THE PARTY SLEPT IN VILLAGE OF DUN THAVOK.':'Dun Thavok',
 'REVEALED WHEN THE PARTY ARRIVED AT SCHOLOMANCE.':'Scholomance',
 'REVEALED WHEN THE PARTY ARRIVED NEAR GREGOR’S DITCH.':'Near Gregor’s Ditch',
 'REVEALED WHEN THE PARTY ARRIVED AT THE GREGOR’S WORLD KNOT.':'The Gregor’s World Knot',
}
SUMMARY_ORDER={'captains-briefing':1,'session-two':2,'session-three':3}

def messages(folder):return [json.loads(line) for line in (folder/'messages.jsonl').read_text().splitlines() if line.strip()]
def extract(path):
 root=E.fromstring(zipfile.ZipFile(path).read('word/document.xml'));blocks=[]
 for p in root.findall('.//w:body//w:p',NS):
  runs=[]
  for r in p.findall('.//w:r',NS):
   txt=''.join((t.text or '') if t.tag==W+'t' else '\n' if t.tag==W+'br' else '\t' if t.tag==W+'tab' else '' for t in r)
   if txt:runs.append({'text':txt,'bold':r.find('w:rPr/w:b',NS)is not None,'italic':r.find('w:rPr/w:i',NS)is not None})
  text=''.join(r['text'] for r in runs)
  if not text.strip():continue
  style=p.find('w:pPr/w:pStyle',NS);heading=style is not None and 'heading' in style.get(W+'val','').lower()
  heading=heading or (len(text)<160 and all(r['bold'] for r in runs))
  blocks.append({'type':'divider' if text.strip() in ['*','---'] else 'heading' if heading else 'paragraph','text':text,'runs':runs})
 return blocks
def bundle(name,asset,supplied,out):
 """Copy an approved supplied DOCX into the output folder, falling back to the committed bundle so a reimport never drops it."""
 src,target,bundled=supplied/name,out/asset,ROOT/'assets/campaign'/asset
 if src.exists():shutil.copyfile(src,target)
 elif not target.exists() and bundled.exists() and bundled!=target:shutil.copyfile(bundled,target)
 if not target.exists():raise SystemExit(f'Missing approved source {name}: looked in {src}, {target} and {bundled}. Pass --supplied with the folder holding it.')
 return target
def revelation_toc(blocks,title):
 toc=[]
 for i,b in enumerate(blocks):
  key=b['text'].strip()
  if b['type']=='heading' and key.startswith('REVEALED WHEN'):
   if key not in REVELATIONS:raise SystemExit(f'{title}: unreviewed revelation heading {key!r}. Add it to REVELATIONS with a contents label.')
   toc.append({'index':i,'label':REVELATIONS[key]})
 if len(toc)!=len(REVELATIONS):raise SystemExit(f'{title}: expected {len(REVELATIONS)} revelation headings, found {len(toc)}.')
 return toc
def build(args,out):
 """Rebuild every record and asset into `out`; the committed bundle is only ever read as a fallback."""
 out.mkdir(parents=True,exist_ok=True);entries=[]
 def copy(src,name):shutil.copyfile(src,out/name);return 'assets/campaign/'+name
 for m in messages(args.docs):
  if m['type'] not in ['MessageType.default','MessageType.reply']:continue
  for file in m['saved_files']:
   src=args.docs/file;filename=src.name.split('-',2)[2]
   base={'published':m['created_at'],'author':m['author_display'],'source':'campaign_docs'}
   if filename in DOCS:
    key,title,label,period,description=DOCS[filename]
    record={**base,'id':key,'kind':'document','title':title,'label':label,'period':period,'description':description,'originalName':filename}
    if filename in EXPANDED:
     spec=EXPANDED[filename]
     record.update({'download':'assets/campaign/'+spec['asset'],'originalDownload':copy(src,key+'.docx'),'updatedAt':spec['updatedAt'],'updatedName':spec['file']})
     source=bundle(spec['file'],spec['asset'],args.supplied,out)
    else:
     record['download']=copy(src,key+'.docx');source=src
    blocks=extract(source);record.update({'blocks':blocks,'words':sum(len(b['text'].split()) for b in blocks)})
    if filename in EXPANDED:record['toc']=revelation_toc(blocks,title)
    if key in SUMMARY_ORDER:record.update({'summary':True,'summaryOrder':SUMMARY_ORDER[key]})
    entries.append(record)
   elif filename=='Session_1_-_Travel_Route.jpg':entries.append({**base,'id':'session-one-route','kind':'attachment','title':'Session 1 · Travel route','label':'Map','period':'Session 1','description':'The route map posted with the First Book and Captain’s briefing.','image':copy(src,'session-one-route.jpg'),'download':'assets/campaign/session-one-route.jpg','originalName':filename})
   elif filename=='Image_Gallery.pdf':
    import subprocess
    subprocess.run(['pdftoppm','-f','1','-l','1','-singlefile','-scale-to','900','-png',str(src),str(out/'gallery-cover')],check=True,capture_output=True)
    entries.append({**base,'id':'campaign-image-gallery','kind':'attachment','title':'The campaign image gallery','label':'Illustrated archive','period':'44 pages','description':'The original collection of campaign images, kept together as a browsable PDF.','image':'assets/campaign/gallery-cover.png','download':copy(src,'campaign-image-gallery.pdf'),'originalName':filename})
 for spec in SUPPLEMENTS:
  source=bundle(spec['file'],spec['asset'],args.supplied,out);blocks=extract(source)
  record={'id':spec['id'],'kind':'document','title':spec['title'],'label':spec['label'],'period':spec['period'],'description':spec['description'],
   'blocks':blocks,'words':sum(len(b['text'].split()) for b in blocks),'download':'assets/campaign/'+spec['asset'],'originalName':spec['file'],
   'author':'smalls','source':'supplied_docs','published':ADDED+'T00:00:00.000000+00:00','dateKind':'added','addedAt':ADDED}
  if spec['id'] in SUMMARY_ORDER:record.update({'summary':True,'summaryOrder':SUMMARY_ORDER[spec['id']]})
  entries.append(record)
 for m in messages(args.ic):
  if m['type'] not in ['MessageType.default','MessageType.reply']:continue
  attachments=[]
  for i,file in enumerate(m['saved_files']):
   src=args.ic/file;attachments.append({'src':copy(src,'ic-'+m['id']+'-'+str(i)+src.suffix),'alt':'Illustration attached to '+m['author_display']+'’s post'})
  entries.append({'id':'ic-'+m['id'],'kind':'ic','published':m['created_at'],'edited':m['edited_at'],'author':m['author_display'],'voice':AUTHORS.get(m['author_display'],m['author_display']),'source':'ic_posting','body':m['clean_content'],'aside':m['id'] in ASIDES,'replyTo':'ic-'+str(m['reply_to']) if m['reply_to'] else None,'images':attachments})
 entries.sort(key=lambda e:e['published'])
 docs=[e for e in entries if e['kind']=='document']
 summaries=sorted([e for e in docs if e.get('summary')],key=lambda e:e['summaryOrder'])
 assert len(docs)==8,f'expected 8 formal writings, found {len(docs)}'
 assert len([e for e in entries if e['kind']=='ic'])==197
 assert [e['id'] for e in summaries]==['captains-briefing','session-two','session-three'],'expected exactly three reviewed session summaries in session order'
 annals=[e for e in docs if e['id']=='fourth-ur-annals']
 assert len(annals)==1 and len(annals[0]['toc'])==len(REVELATIONS),'expected one Fourth Ur-Annals record with seven reviewable revelations'
 assert len(set(e['id'] for e in entries))==len(entries)
 data={'edition':1,'dateBasis':'Original Discord publication timestamps, displayed in UTC. Story dates are retained separately. Supplied writings with no Discord post are labelled with the date they were added to the archive.','entries':entries}
 note='Imported %d records: 8 writings (3 session summaries), 2 visual attachments, 197 posts. Excluded Herbie narrative, character sheet, rulebook duplicate and channel housekeeping.'%len(entries)
 return data,note

def main():
 parser=argparse.ArgumentParser(description='Rebuild data/campaign.json from the approved Discord export and supplied DOCX sources.')
 parser.add_argument('--docs',type=Path,default=Path('/Users/ryanstewart/discord-export/export-campaign_docs'))
 parser.add_argument('--ic',type=Path,default=Path('/Users/ryanstewart/discord-export/export-ic_posting'))
 parser.add_argument('--supplied',type=Path,default=Path('/Users/ryanstewart/Downloads'),help='folder holding the approved DOCX files supplied outside Discord')
 parser.add_argument('--check',action='store_true',help='rebuild into a scratch folder, write nothing, and fail if data/campaign.json or any bundled asset would change')
 args=parser.parse_args()
 if args.check:
  with tempfile.TemporaryDirectory() as scratch:
   data,_=build(args,Path(scratch));payload=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
   target=ROOT/'data/campaign.json';current=target.read_text() if target.exists() else ''
   built={p.name:p for p in Path(scratch).iterdir() if p.is_file()};stored={p.name:p for p in (ROOT/'assets/campaign').iterdir() if p.is_file()}
   problems=[]
   if current!=payload:problems.append('data/campaign.json differs from a fresh import')
   for name in sorted(set(built)|set(stored)):
    if name not in built:problems.append(f'assets/campaign/{name} is no longer produced by the importer')
    elif name not in stored:problems.append(f'assets/campaign/{name} is missing from the bundle')
    elif built[name].read_bytes()!=stored[name].read_bytes():problems.append(f'assets/campaign/{name} differs from the imported source bytes')
   if problems:raise SystemExit('CHECK FAILED — nothing was written:\n  '+'\n  '.join(problems))
   print(f'Import check passed without writing: data/campaign.json and all {len(built)} bundled assets reproduce exactly from the approved sources.')
  return
 data,note=build(args,ROOT/'assets/campaign');(ROOT/'data/campaign.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');print(note)
if __name__=='__main__':main()

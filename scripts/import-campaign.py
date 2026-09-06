"""Import approved campaign writings and IC posts; raw Discord exports stay outside the repo."""
import argparse,json,re,shutil,zipfile,xml.etree.ElementTree as E
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

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--docs',type=Path,default=Path('/Users/ryanstewart/discord-export/export-campaign_docs'));parser.add_argument('--ic',type=Path,default=Path('/Users/ryanstewart/discord-export/export-ic_posting'));args=parser.parse_args()
 out=ROOT/'assets/campaign';out.mkdir(parents=True,exist_ok=True);entries=[]
 def copy(src,name):shutil.copyfile(src,out/name);return 'assets/campaign/'+name
 for m in messages(args.docs):
  if m['type'] not in ['MessageType.default','MessageType.reply']:continue
  for file in m['saved_files']:
   src=args.docs/file;filename=src.name.split('-',2)[2]
   base={'published':m['created_at'],'author':m['author_display'],'source':'campaign_docs'}
   if filename in DOCS:
    key,title,label,period,description=DOCS[filename];blocks=extract(src)
    entries.append({**base,'id':key,'kind':'document','title':title,'label':label,'period':period,'description':description,'blocks':blocks,'words':sum(len(b['text'].split()) for b in blocks),'download':copy(src,key+'.docx'),'originalName':filename})
   elif filename=='Session_1_-_Travel_Route.jpg':entries.append({**base,'id':'session-one-route','kind':'attachment','title':'Session 1 · Travel route','label':'Map','period':'Session 1','description':'The route map posted with the First Book and Captain’s briefing.','image':copy(src,'session-one-route.jpg'),'download':'assets/campaign/session-one-route.jpg','originalName':filename})
   elif filename=='Image_Gallery.pdf':
    import subprocess
    subprocess.run(['pdftoppm','-f','1','-l','1','-singlefile','-scale-to','900','-png',str(src),str(out/'gallery-cover')],check=True,capture_output=True)
    entries.append({**base,'id':'campaign-image-gallery','kind':'attachment','title':'The campaign image gallery','label':'Illustrated archive','period':'44 pages','description':'The original collection of campaign images, kept together as a browsable PDF.','image':'assets/campaign/gallery-cover.png','download':copy(src,'campaign-image-gallery.pdf'),'originalName':filename})
 for m in messages(args.ic):
  if m['type'] not in ['MessageType.default','MessageType.reply']:continue
  attachments=[]
  for i,file in enumerate(m['saved_files']):
   src=args.ic/file;attachments.append({'src':copy(src,'ic-'+m['id']+'-'+str(i)+src.suffix),'alt':'Illustration attached to '+m['author_display']+'’s post'})
  entries.append({'id':'ic-'+m['id'],'kind':'ic','published':m['created_at'],'edited':m['edited_at'],'author':m['author_display'],'voice':AUTHORS.get(m['author_display'],m['author_display']),'source':'ic_posting','body':m['clean_content'],'aside':m['id'] in ASIDES,'replyTo':'ic-'+str(m['reply_to']) if m['reply_to'] else None,'images':attachments})
 entries.sort(key=lambda e:e['published'])
 assert len([e for e in entries if e['kind']=='document'])==7
 assert len([e for e in entries if e['kind']=='ic'])==197
 assert len(set(e['id'] for e in entries))==len(entries)
 data={'edition':1,'dateBasis':'Original Discord publication timestamps, displayed in UTC. Story dates are retained separately.','entries':entries}
 (ROOT/'data/campaign.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 print(f'Imported {len(entries)} records: 7 writings, 2 visual attachments, 197 posts. Excluded Herbie narrative, character sheet, rulebook duplicate and channel housekeeping.')
if __name__=='__main__':main()

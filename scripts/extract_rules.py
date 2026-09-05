"""Rebuild the complete, page-cited index from the supplied v1.14 PDF.

Uses column-aware extraction. Explicit section boundaries are intentional: this
is an audited edition importer, not a heuristic parser for unrelated PDFs.
"""
from pathlib import Path
import json, re, logging
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
logging.getLogger('pdfminer').setLevel(logging.ERROR)
lines = []
with pdfplumber.open(ROOT / 'BC PHB 1.14.pdf') as pdf:
    for number, page in enumerate(pdf.pages[:8], 1):
        for box in [(30, 30, 308, 760), (310, 30, 590, 760)]:
            lines.extend({'page': number, 'text': text} for text in
                         page.crop(box).extract_text(x_tolerance=1.5).splitlines() if text.strip())
assert len(lines) == 756, 'Source layout changed; re-audit section boundaries.'
records = []
def joined(a, b):
    return ' '.join(row['text'] for row in lines[a:b]).replace('mid- sentence', 'mid-sentence')
def add(title, category, a, b, body=None, **extra):
    content = body if body is not None else joined(a,b)
    slug = re.sub(r'[^a-z0-9]+', '-', (extra.get('subclass','') + ' ' + title).lower()).strip('-')
    record = dict(id=slug, title=title, category=category, page=lines[a]['page'],
                  endPage=lines[b-1]['page'], body=content, **extra)
    records.append(record)
    return record
def segments(category, starts, end, delimiter='.', **extra):
    for a,b in zip(starts,starts[1:]+[end]):
        title,body = joined(a,b).split(delimiter,1)
        add(title.strip(),category,a,b,body.strip(),**extra)

add('From the Annals','Company lore',1,12,joined(1,12).replace('Y OU WHO COME AFTER ME, SCRIBBLING THESE','You who come after me, scribbling these'))
add('The Black Banner','Black Banner',363,374,joined(363,374).replace('T HERE WEREN’T ENOUGH OF US LEFT TO MAKE A','There weren’t enough of us left to make a'))
add('Black Company Brother','Character creation',13,16)
segments('Character creation',[16,17,20,22,23,26,29,36,44,48],50,':')
segments('Traits',[53,54,57,62,64,66,71,74,75],77)
segments('Quirks',[79,81,83,84,86,89,90,93,94],96)
add('Choosing a subclass','Character creation',97,100)
add('Subclass saving throw DC','Character creation',110,114)
class_starts=[114,150,178,216,248,275,297,315,339]
classes=[]
for a,b,overview in zip(class_starts,class_starts[1:]+[362],range(100,109)):
    name = lines[a]['text']
    description=lines[overview]['text'].split('. ',1)[1]
    classes.append(dict(name=name, description=description, page=lines[a]['page']))
    add(name,'Subclasses',a,b,description,subclass=name,overview=True)
    starts=[i for i in range(a+1,b) if re.match(r'\d+(st|rd|th) Level\.',lines[i]['text'])]
    assert len(starts)==4, (name,starts)
    for x,y in zip(starts,starts[1:]+[b]):
        match=re.match(r'(\d+)(?:st|rd|th) Level\. ([^.]+)\. (.*)',joined(x,y))
        assert match,joined(x,y)
        level,title,body=match.groups()
        add(title,'Subclasses',x,y,body,subclass=name,level=int(level))

# The banner introduction includes the Annals quotation; rules start at Description.
banner_start=next(i for i in range(363,395) if lines[i]['text'].startswith('Description.'))
starts=[i for i in range(banner_start,414) if re.match(r'^(Description|Using the Banner|Action|Aura Radius|Aura Effect|Durability|Restoration|Replacement|Advancing in Level)\.',lines[i]['text'])]
segments('Black Banner',starts,414)
add('Bannerman','Black Banner',415,421)
segments('Black Banner',[421,427,432],437)
for a,b in zip([438,443,447,455,460],[443,447,455,460,468]):
    level,title,body=re.match(r'(\d+)(?:nd|th) Level\. ([^.]+)\. (.*)',joined(a,b)).groups()
    add(title,'Black Banner',a,b,body,level=int(level))
for title,a,b in [('Morale',469,473),('Morale triggers & timing',473,480),('Morale checks & outcomes',480,486),('Groups & unbreakable enemies',486,490),('Adjusting the morale DC',490,492),('Increasing the morale DC',492,504),('Decreasing the morale DC',504,512)]:
    add(title,'Morale',a,b)
add('The Commissary','Commissary',513,520)
segments('Commissary',[520],526)
segments('Commissary',[526,529],534,':')
segments('Commissary',[534],542)
add('Company organization','Company lore',543,560,joined(543,560).replace('T HE BLACK COMPANY NUMBERS ABOUT THREE','The Black Company numbers about three'))
segments('Company lore',[560,568,576,583,592,598,604,611,619,634,642],651)
add('Our Brothers','Company lore',652,662,joined(652,662).replace('W E ALL HAVE OUR PASTS. I SUSPECT WE','We all have our pasts. I suspect we'))
starts=[i for i in range(662,len(lines)) if re.match(r'^.{1,25} [–-]',lines[i]['text'])]
for a,b in zip(starts,starts[1:]+[len(lines)]):
    title,body=re.split(r' [–-]\s*',joined(a,b),maxsplit=1)
    add(title,'Brothers',a,b,body)
assert len({r['id'] for r in records})==len(records)
for r in records:
    if r['id']=='armor-shield':
        r['note']='Source note: the book says “base DC” here, within the Durability Points rules. The wording is preserved; confirm the intended DP with your DM.'
    if r['id']=='aura-effect':
        r['note']='Source note: the book distinguishes a suppressed aura from a lost aura. Disarmed explicitly allows recovery and replanting. Consult your DM if the distinction is unclear.'
    if r['id']=='company-organization':
        r['note']='Source note: the book defines a Finger as ten men, but gives “Thin Finger of forty men” as an example. Both are preserved from the source.'
result=dict(version='1.14',source='BC PHB 1.14.pdf',campaignPages=8,excludedPages=[9,10],
            classes=classes,records=records,
            notes=['Uses the Fighter class table and PHB equipment rules, which are referenced but not reproduced in the supplied booklet.',
                   'Luck, chips, and death checks are referenced but their complete general procedures are not defined in this booklet.',
                   'Pages 9–10 contain Homebrewery help, not campaign rules.'])
(ROOT/'data'/'rules.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
(ROOT/'data'/'source-pages.json').write_text(json.dumps([dict(page=n,text='\n'.join(r['text'] for r in lines if r['page']==n)) for n in range(1,9)],ensure_ascii=False,indent=2)+'\n')
print(f'Indexed {len(records)} entries, {len(classes)} subclasses, {len(starts)} Brothers.')

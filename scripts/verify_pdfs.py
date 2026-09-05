"""Verify canonical form fields, widgets, values, appearances, and note overflow."""
from pypdf import PdfReader

for path in ['tmp/qa/gravel-editable.pdf','output/pdf/black-company-universal-editable.pdf','tmp/qa/long-notes.pdf','tmp/qa/rook-final.pdf','tmp/qa/rook-final-variant.pdf']:
    reader=PdfReader(path)
    fields=reader.get_fields()
    widgets=[]
    for page in reader.pages:
        for annotation in page.get('/Annots',[]):
            widget=annotation.get_object()
            if widget.get('/Subtype')!='/Widget': continue
            owner=widget.get('/Parent',widget).get_object()
            name=owner.get('/T')
            assert name in fields,(path,name)
            assert owner.get('/V')==fields[name].get('/V'),name
            assert widget.get('/AP',{}).get('/N') is not None,name
            if owner.get('/FT')=='/Tx':
                assert widget.get('/DA')==owner.get('/DA'),(path,name,'widget font')
                assert '/Helvetica' in reader.trailer['/Root']['/AcroForm']['/DR']['/Font']
            widgets.append(widget)
    assert len(widgets)==len(fields),(len(widgets),len(fields))
    assert len(fields)>=154
    assert len(reader.outline)==len(reader.pages)
    order=reader.trailer['/Root']['/AcroForm']['/CO']
    expected_calcs=47-(0 if 'universal' in path else 1)
    assert len(order)==expected_calcs,(path,len(order))
    for ref in order:
        f=ref.get_object()
        assert f['/AA']['/C']['/S']=='/JavaScript'
        assert f.get('/Ff',0)&1, f['/T']
    assert 'BlackCompanyCalculations' in str(reader.trailer['/Root']['/Names']['/JavaScript'])
    if 'gravel' in path:
        assert fields['name']['/V']=='Gravel'
        assert fields['subclass']['/V']=='Salt'
        assert fields['saveDC']['/V']=='15'
        assert fields['secondWind']['/V']=='0'
        assert fields['secondWindMax']['/V']=='3'
        assert fields['attack1Name']['/V']=='Longsword'
        assert fields['fightingStyle']['/V']=='Defense (+1 AC while wearing armor)'
    if 'universal' in path:
        assert fields['name'].get('/V','')==''
        assert len(reader.pages)==4
    if 'long-notes' in path:
        chunks=[str(fields['notes']['/V'])]+[str(v['/V']) for k,v in fields.items() if k.startswith('notes_continued_')]
        assert ' '.join(' '.join(chunks).split())==' '.join(('Long field note about the Company. '*200).split())
    print(f'{path}: {len(reader.pages)} pages, {len(fields)} editable fields; canonical values, widgets, and appearances agree.')

a,b=map(PdfReader,['tmp/qa/rook-final.pdf','tmp/qa/rook-final-variant.pdf'])
assert {k:v.get('/V') for k,v in a.get_fields().items()}=={k:v.get('/V') for k,v in b.get_fields().items()}
assert a.pages[0].get_contents().get_data()!=b.pages[0].get_contents().get_data()
assert a.metadata['/Keywords']!=b.metadata['/Keywords']
print('Two exports have identical character fields and different decorative page content / wear seeds.')

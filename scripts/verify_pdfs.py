"""Verify canonical form fields, widgets, values, appearances, and note overflow."""
from pypdf import PdfReader

for path in ['tmp/qa/gravel-editable.pdf','output/pdf/black-company-universal-editable.pdf','tmp/qa/long-notes.pdf']:
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
            widgets.append(widget)
    assert len(widgets)==len(fields),(len(widgets),len(fields))
    assert len(fields)>=97
    if 'gravel' in path:
        assert fields['name']['/V']=='Gravel'
        assert fields['subclass']['/V']=='Salt'
        assert fields['saveDC']['/V']=='15'
    if 'universal' in path:
        assert fields['name'].get('/V','')==''
        assert len(reader.pages)==3
    if 'long-notes' in path:
        chunks=[str(fields['notes']['/V'])]+[str(v['/V']) for k,v in fields.items() if k.startswith('notes_continued_')]
        assert ' '.join(' '.join(chunks).split())==' '.join(('Long field note about the Company. '*200).split())
    print(f'{path}: {len(reader.pages)} pages, {len(fields)} editable fields; canonical values, widgets, and appearances agree.')

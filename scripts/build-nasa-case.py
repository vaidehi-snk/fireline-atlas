"""Reconstruct unchanged contact-sheet thumbnails and retain their published timestamps.
Requires pypdf and Pillow; these are authoring dependencies, not browser dependencies.
"""
from pathlib import Path
from pypdf import PdfReader
from PIL import Image
import re,json,base64,io,hashlib
root=Path(__file__).resolve().parents[1]
source=root/'data'/'BASS-II_B3_ProofSheet.pdf'
reader=PdfReader(source);pictures=[];entries=[]
for page in reader.pages:
    images=sorted(page.images,key=lambda image:int(re.search(r'Im(\d+)',image.name).group(1)))
    assert len(images)%6==0
    for start in range(0,len(images),6):
        strips=images[start:start+6]
        assert all(strip.image.width==314 for strip in strips)
        frame=Image.new('RGB',(314,sum(strip.image.height for strip in strips)));y=0
        for strip in strips:
            frame.paste(strip.image.convert('RGB'),(0,y));y+=strip.image.height
        pictures.append(frame)
    entries.extend(re.findall(r'(iss\d+e\d+)\s+(\d\d:\d\d:\d\d)',page.extract_text()))
assert len(pictures)==len(entries)==43
selected={'iss038e051275','iss038e051277','iss038e051279','iss038e051281','iss038e051283','iss038e051285','iss038e051287','iss038e051289','iss038e051291','iss038e051293','iss038e051294'}
def seconds(clock):
    h,m,s=map(int,clock.split(':'));return h*3600+m*60+s
frames=[];origin=None
for image,(identifier,clock) in zip(pictures,entries):
    if identifier not in selected:continue
    if origin is None:origin=seconds(clock)
    buffer=io.BytesIO();image.save(buffer,format='PNG');png=buffer.getvalue()
    frames.append({'name':identifier,'clock':clock,'time':seconds(clock)-origin,'width':image.width,'height':image.height,'sha256':hashlib.sha256(png).hexdigest(),'image':'data:image/png;base64,'+base64.b64encode(png).decode()})
assert len(frames)==11 and all(a['time']<b['time'] for a,b in zip(frames,frames[1:]))
payload={'meta':{'doi':'10.60555/4qc4-de67','source':'https://psi.nasa.gov/physci/repo/data/investigations/PSI-25','originalFile':'PSI-25_Raw Data_GMT2014_050_BASS_S148M_TPB3_ProofSheet.pdf','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'license':'CC0-1.0','test':'B3','investigator':'Bhattacharjee','sample':'148M (contact-sheet label; table uses 148)','date':'2014-02-19','timeMode':'Photo-clock offsets in seconds, relative to 12:20:37','note':'Low-resolution 314×209 contact-sheet images, reconstructed from six embedded strips without resizing. Exposure varies. No known spatial calibration or published boundary annotations. Not validated physical flame-spread measurements.'},'frames':frames}
(root/'nasa-case.js').write_text('window.FIRELINE_NASA_CASE = '+json.dumps(payload,separators=(',',':'))+';\n',encoding='utf-8')
(root/'data'/'B3-case-manifest.json').write_text(json.dumps({'meta':payload['meta'],'frames':[{k:v for k,v in frame.items() if k!='image'} for frame in frames]},indent=2)+'\n')
print('Built',len(frames),'real NASA contact-sheet frames, offsets:',[f['time'] for f in frames])
print('Source SHA-256',payload['meta']['sourceSha256'])

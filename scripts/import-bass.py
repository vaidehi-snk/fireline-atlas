"""Rebuild the browser dataset from the archived, unchanged NASA source CSV."""
import csv,hashlib,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=root/'data'/'PSI-25_Experimental-table_BASS-II.csv'
with source.open(encoding='utf-8-sig',newline='') as stream: records=list(csv.DictReader(stream))
oxygen=[float(row['Calibrated  initial O2 % by vol ']) for row in records]
payload={'meta':{'investigation':'PSI-25','doi':'10.60555/4qc4-de67','license':'CC0-1.0','source':'https://psi.nasa.gov/physci/repo/data/investigations/PSI-25','fileName':'PSI-25_Experimental table_BASS-II.csv','fileVersion':1,'retrievedOn':'2026-11-14','sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'records':len(records),'oxygenRange':[min(oxygen),max(oxygen)],'note':'Source values preserved as strings. Recorded oxygen envelope spans heterogeneous tests and does not imply joint condition coverage.'},'records':records}
(root/'bass-data.js').write_text('window.FIRELINE_DATA = '+json.dumps(payload,ensure_ascii=True,separators=(',',':'))+';\n',encoding='utf-8')
print(f'Imported {len(records)} source records; initial O2 envelope {min(oxygen)}–{max(oxygen)}%; SHA-256 {payload["meta"]["sha256"]}')

from pathlib import Path
import subprocess
root=Path(__file__).resolve().parents[1]
files=sorted((root/'mockup').rglob('*.js'))
for file in files:subprocess.run(['node','--check',str(file)],check=True)
print(str(len(files))+' JavaScript files passed syntax checks.')

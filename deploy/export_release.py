"""Create a clean release tree with an allowlist. No history, logs, secrets or notes."""
from pathlib import Path
import shutil,sys
src=Path(__file__).resolve().parents[1];dest=Path(sys.argv[1]).resolve()
if dest.exists():raise SystemExit('Choose a new output directory.')
dest.mkdir(parents=True)
allowed={'.js','.css','.html','.svg','.png','.jpg','.jpeg','.webp','.gif','.pdf','.json','.jsonl','.txt','.py','.swift','.md','.yml','.pptx','.mp4','.webm','.zip'}
for folder in ['mockup','serwer','deploy','tests']:
 for p in (src/folder).rglob('*'):
  if not p.is_file() or any(x.startswith('.') or x in {'__pycache__','node_modules','private'} for x in p.relative_to(src).parts):continue
  if p.suffix.lower() not in allowed or p.name in {'agent.log'}:continue
  target=dest/p.relative_to(src);target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target)
for name in ['Dockerfile','LICENSE','README.md','DESIGN.md','PRODUCT.md','.gitignore','.dockerignore']:
 if (src/name).is_file():shutil.copy2(src/name,dest/name)
for name in ['Caddyfile','.env.example']:
 shutil.copy2(src/'deploy'/name,dest/'deploy'/name)
print(dest)

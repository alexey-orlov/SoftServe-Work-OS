# Reorder <w:pBdr> children to the schema order (top, left, bottom, right, between, bar) — docx-js emits top,bottom,left.
import re, sys, zipfile, shutil, os
src=sys.argv[1]; tmp=src+'.tmp'
ORDER=['top','left','bottom','right','between','bar']
def fix(m):
    kids=re.findall(r'<w:(top|left|bottom|right|between|bar)\b[^>]*/>', m.group(1))
    tags=re.findall(r'(<w:(?:top|left|bottom|right|between|bar)\b[^>]*/>)', m.group(1))
    pairs=sorted(zip(kids,tags), key=lambda kt: ORDER.index(kt[0]))
    return '<w:pBdr>'+''.join(t for _,t in pairs)+'</w:pBdr>'
with zipfile.ZipFile(src) as zin, zipfile.ZipFile(tmp,'w',zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data=zin.read(item.filename)
        if item.filename=='word/document.xml':
            x=data.decode('utf-8'); x=re.sub(r'<w:pBdr>(.*?)</w:pBdr>', fix, x); data=x.encode('utf-8')
        zout.writestr(item, data)
shutil.move(tmp, src); print("pBdr order fixed:", src)

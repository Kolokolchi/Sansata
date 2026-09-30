"""Locate the dark apartment highlight in each published plan's floor inset."""
from pathlib import Path
import json
import cv2
import numpy as np
root=Path(__file__).resolve().parents[1]
plans=json.loads((root/'src/data/saf-plans.json').read_text(encoding='utf8'))['plans']
assets={a['source']:a['file'] for a in json.loads((root/'src/data/saf-materials.json').read_text(encoding='utf8'))['assets']}
anchors={}
for plan in plans:
    im=cv2.imread(str(root/'src/assets/saf-avenue'/assets[plan['image']]))
    h,w=im.shape[:2]
    roi=im[int(.79*h):int(.98*h),int(.73*w):int(.97*w)]
    dark=(np.max(roi,axis=2)<110).astype('uint8')*255
    connected=cv2.morphologyEx(dark,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
    contours,_=cv2.findContours(connected,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    if not contours:continue
    contour=max(contours,key=cv2.contourArea)
    x,y,bw,bh=cv2.boundingRect(contour)
    if bw<.07*w or bh<.07*h:continue
    filled=cv2.morphologyEx(dark,cv2.MORPH_OPEN,np.ones((max(5,int(w*.004)),)*2,np.uint8))
    components,_=cv2.findContours(filled,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    if not components:continue
    candidate=max(components,key=cv2.contourArea)
    if cv2.contourArea(candidate)<bw*bh*.045:continue
    m=cv2.moments(candidate)
    center=[round((m['m10']/m['m00']-x)/bw,4),round((m['m01']/m['m00']-y)/bh,4)]
    if all(0<=v<=1 for v in center): anchors[plan['code']]=center
(root/'src/data/saf-plan-anchors.json').write_text(json.dumps({'note':'Image-derived inset centroids; used for approximate brochure alignment, not official apartment geometry.','anchors':anchors},indent=2)+'\n')
print(len(anchors),'of',len(plans),'floor inset anchors extracted')
print({k:v for k,v in anchors.items() if k.startswith('KV-P1-E2-')})

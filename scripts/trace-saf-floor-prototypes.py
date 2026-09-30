"""Trace coloured brochure regions for the explicitly approximate interactive prototype.
These are UI regions, not construction or cadastral geometry.
"""
from pathlib import Path
import cv2
import numpy as np
import json

root=Path(__file__).resolve().parents[1]
# BGR fill families used by the supplied brochure (different units can share a family).
palette=np.array([[203,218,234],[225,226,218],[228,219,226],[211,195,195],[160,175,179],[194,187,170],[176,184,168],[199,233,246],[173,194,216]],dtype=np.float32)
result=[]
for page in range(13,26):
    im=cv2.imread(str(root/f'src/assets/saf-brochures/residential-{page:02}.jpg'))
    roi=im[330:1140,180:840]
    distance=np.linalg.norm(roi[:,:,None,:].astype(float)-palette[None,None,:,:],axis=3)
    closest=distance.argmin(axis=2)
    regions=[]
    for i in range(len(palette)):
        mask=((closest==i)&(distance[:,:,i]<16)).astype('uint8')*255
        mask=cv2.morphologyEx(mask,cv2.MORPH_CLOSE,np.ones((11,11),np.uint8))
        mask=cv2.morphologyEx(mask,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
        contours,_=cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
        for contour in contours:
            area=cv2.contourArea(contour)
            if area<6500: continue
            approx=cv2.approxPolyDP(contour,3,True).reshape(-1,2)+[180,330]
            moments=cv2.moments(contour)
            center=[round(moments['m10']/moments['m00']+180,1),round(moments['m01']/moments['m00']+330,1)]
            regions.append(dict(points=approx.tolist(),center=center,area=round(area)))
    regions=sorted(regions,key=lambda r:-r['area'])
    unique=[]
    for region in regions:
        if all(np.linalg.norm(np.array(region['center'])-other['center'])>60 for other in unique): unique.append(region)
    regions=unique
    regions.sort(key=lambda r:np.arctan2(r['center'][1]-680,r['center'][0]-505))
    result.append(dict(page=page,regions=regions))
    print(page,len(regions),[r['area'] for r in regions])
(root/'src/data/saf-floor-prototype-regions.json').write_text(json.dumps({'accuracy':'prototype','width':1013,'height':1800,'viewBox':'160 330 700 810','sheets':result},indent=2)+'\n')

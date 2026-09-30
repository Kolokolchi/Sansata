"""Project user-supplied 2:1 panoramas into reviewable stills; preserve the originals."""
from pathlib import Path
import json
import hashlib
import math
import cv2
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = 200_000_000
root = Path(__file__).resolve().parents[1]
out = root / 'src/assets/saf-tour'
out.mkdir(parents=True, exist_ok=True)
scenes = [
    ('cam-5', 'cam_5 копия_fin.jpg', 'Общий вид', .445, -32),
    ('cam-6', 'cam_6 копия.jpg', 'Со стороны двора', .43, -20),
    ('aerial', 'pano_250.jpg', 'Высотная панорама', .23, -26),
]

def perspective(panorama, u, pitch, fov=100, width=1920, height=1080):
    longitude, latitude = u * math.tau, math.radians(pitch)
    forward = np.array([math.cos(latitude)*math.cos(longitude), math.sin(latitude), math.cos(latitude)*math.sin(longitude)])
    right = np.array([-math.sin(longitude), 0, math.cos(longitude)])
    up = np.cross(right, forward)
    x, y = np.meshgrid((np.arange(width)+.5)/width*2-1, 1-(np.arange(height)+.5)/height*2)
    extent = math.tan(math.radians(fov/2))
    rays = forward + x[..., None]*right*extent + y[..., None]*up*extent*height/width
    rays /= np.linalg.norm(rays, axis=2)[..., None]
    map_x = ((np.arctan2(rays[...,2], rays[...,0])/math.tau)%1 * panorama.shape[1]).astype('float32')
    map_y = ((.5-np.arcsin(rays[...,1])/math.pi) * panorama.shape[0]).astype('float32')
    return cv2.remap(panorama, map_x, map_y, cv2.INTER_CUBIC, borderMode=cv2.BORDER_WRAP)

manifest=[]
for scene_id, filename, title, u, pitch in scenes:
    source = root/'3d tour'/filename
    with Image.open(source) as im:
        assert im.width == im.height*2, f'{filename}: expected equirectangular 2:1'
        size=im.size
        im=im.convert('RGB'); im.thumbnail((4096,2048), Image.Resampling.LANCZOS)
        im.save(out/f'{scene_id}.jpg', quality=91, optimize=True)
        small=im.copy(); small.thumbnail((1024,512), Image.Resampling.LANCZOS)
        small.save(out/f'{scene_id}-preview.jpg', quality=80, optimize=True)
        photo=perspective(np.asarray(im), u, pitch)
        Image.fromarray(photo).save(out/f'{scene_id}-view.jpg', quality=93, optimize=True)
    manifest.append(dict(id=scene_id,title=title,source=filename,sourceSize=size,sha256=hashlib.sha256(source.read_bytes()).hexdigest(),initialYaw=(u*360+90+180)%360-180,initialPitch=pitch))
(root/'src/data/saf-tour.json').write_text(json.dumps({'note':'User-supplied temporary visual material; section and floor placement is approximate.', 'scenes':manifest}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print('Prepared',len(manifest),'panoramas and rectilinear views;', sum(p.stat().st_size for p in out.glob('*')),'bytes')

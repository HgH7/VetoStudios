import os, time, numpy as np
from PIL import Image
from engine import render
OUT="/mnt/user-data/outputs/belt-images"; WORN="/mnt/user-data/outputs/builder-belts"
os.makedirs(WORN,exist_ok=True)
L=105.0; t0=time.time()
def save(im,path):
    Image.fromarray(im).save(path+".png",optimize=True)
    Image.fromarray(im).save(path+".webp",quality=92,method=4)
import sys
for c in sys.argv[1:]:
    d=f"{OUT}/{c}"; os.makedirs(d,exist_ok=True)
    save(render('flat',-1,L+1,-3.4,3.4,40,c),f"{d}/belt-{c}-full")
    A=render('flat',-1,44,-3.4,3.4,100,c); save(A,f"{d}/belt-{c}-buckle-half")
    save(render('flat',-1,44,-3.4,3.4,100,c,mirror=True),f"{d}/belt-{c}-entry-left")
    save(render('flat',L-44,L+1,-3.4,3.4,100,c),f"{d}/belt-{c}-free-end")
    save(render('flat',L-44,L+1,-3.4,3.4,100,c,mirror=True),f"{d}/belt-{c}-entry-right")
    save(render('flat',-0.8,7.0,-3.4,3.4,200,c),f"{d}/belt-{c}-buckle-macro")
    # worn strip (supersampled) -> placed on 1792x2400 canvas per outfit with its mask
    w=render('worn',-21,21,-2.9,2.9,36,c); w=Image.fromarray(w).resize((756,105),Image.LANCZOS)
    for cut in ["cut-01","cut-02","cut-03"]:
        canvas=Image.new("RGBA",(1792,2400),(0,0,0,0)); canvas.paste(w,(526,960),w)
        m=Image.open(f"/mnt/user-data/outputs/builder-placement/belt-mask-{cut}.png").split()[3].resize((1792,2400),Image.LANCZOS)
        a=np.array(canvas); a[...,3]=(a[...,3].astype(np.float32)*np.array(m).astype(np.float32)/255).astype(np.uint8)
        Image.fromarray(a).save(f"{WORN}/worn-{c}-{cut}.png",optimize=True)
    print(c,"done",round(time.time()-t0),"s",flush=True)

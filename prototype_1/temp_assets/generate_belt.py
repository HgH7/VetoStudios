import numpy as np, trimesh, json
from PIL import Image
from scipy.spatial import cKDTree
from shapely.geometry import box, Point, Polygon
from trimesh.visual import TextureVisuals
from trimesh.visual.material import PBRMaterial

OUT="/mnt/user-data/outputs/veto_belt_assets"
W=4.0; T=0.38   # cm: strap width / thickness

# ---------- leather texture (croc emboss + edge stitching), tileable 8cm x 4cm ----------
def leather(base, crev, stitch, seed=3):
    rng=np.random.default_rng(seed); TW,TH=1536,768
    nx,ny=13,7
    pts=[]
    for i in range(nx):
        for j in range(ny):
            pts.append(((i+.5+rng.uniform(-.38,.38))/nx,(j+.5+rng.uniform(-.38,.38))/ny))
    pts=np.array(pts); tiled=np.vstack([pts+[dx,dy] for dx in(-1,0,1) for dy in(-1,0,1)])
    tree=cKDTree(tiled)
    xs=(np.arange(TW)+.5)/TW; ys=(np.arange(TH)+.5)/TH
    gx,gy=np.meshgrid(xs,ys); q=np.column_stack([gx.ravel(),gy.ravel()])
    # scale y so cells are physically round (tile is 2:1)
    s=np.array([2.0,1.0]); tree=cKDTree(tiled*s); d,_=tree.query(q*s,k=2)
    f1=d[:,0].reshape(TH,TW); f2=d[:,1].reshape(TH,TW)
    edge=(f2-f1); e=np.clip(edge/0.018,0,1); e=e*e*(3-2*e)
    dome=np.clip(1-f1/ (0.5/nx*2.0*1.0),0,1)
    h=e*(0.65+0.35*dome)
    grain=rng.normal(0,1,(TH,TW)); 
    from scipy.ndimage import gaussian_filter
    grain=gaussian_filter(grain,1.2); grain/=np.abs(grain).max()
    h=np.clip(h+0.04*grain,0,1)
    col=np.zeros((TH,TW,3),np.float32)
    for c in range(3):
        col[...,c]=crev[c]+(base[c]-crev[c])*h
    spec=np.clip(h*dome,0,1)**2
    col+=0.10*spec[...,None]*(1-np.array(base))[None,None,:]*0+0.05*spec[...,None]
    # stitches
    st=np.zeros((TH,TW),bool); hn=h.copy()
    for row in (int(TH*0.075),int(TH*0.925)):
        for k in range(16):
            x0=k*96+10
            st[row-4:row+4,x0:x0+70]=True
    st=gaussian_filter(st.astype(float),1.0)
    col=col*(1-st[...,None])+np.array(stitch)[None,None,:]*st[...,None]
    hn=np.clip(hn-0.5*st,0,1)
    gy_,gx_=np.gradient(gaussian_filter(hn,0.8)); k=6.0
    n=np.dstack([-gx_*k,-gy_*k,np.ones_like(hn)]); n/=np.linalg.norm(n,axis=2,keepdims=True)
    nm=((n*0.5+0.5)*255).astype(np.uint8)
    return Image.fromarray((np.clip(col,0,1)*255).astype(np.uint8)), Image.fromarray(nm)

VARIANTS={
 "red":  dict(base=(0.62,0.05,0.07), crev=(0.20,0.01,0.02), stitch=(0.93,0.82,0.72)),
 "black":dict(base=(0.11,0.11,0.11), crev=(0.02,0.02,0.02), stitch=(0.55,0.55,0.55)),
 "white":dict(base=(0.88,0.86,0.80), crev=(0.52,0.49,0.42), stitch=(0.97,0.96,0.93)),
}

# ---------- geometry helpers (design coords: x=length, y=width, z=thickness) ----------
def extrude(poly,h,z0):
    m=trimesh.creation.extrude_polygon(poly,h); m.apply_translation([0,0,z0]); return m
def uv(m):
    v=m.vertices; return np.column_stack([v[:,0]/8.0, v[:,1]/4.0+0.5])
def conv(m):  # design (x,w,t) -> glTF Y-up (x, t, -w)
    M=np.eye(4); M[:3,:3]=[[1,0,0],[0,0,1],[0,-1,0]]; m.apply_transform(M); return m
def leather_mesh(m,mat):
    m.visual=TextureVisuals(uv=uv(m),material=mat); return conv(m)
def metal_mesh(m,mat):
    m.visual=TextureVisuals(material=mat); return conv(m)

def strap_left():
    p=box(-38,-W/2,0.3,W/2).buffer(0.05)
    return extrude(p,T,-T/2)
def strap_right():
    L=38; x0=0
    tip=Polygon([(x0,0),(x0+1.4,1.1),(x0+3.6,W/2),(L,W/2),(L,-W/2),(x0+3.6,-W/2),(x0+1.4,-1.1)])
    tip=tip.buffer(0.35).buffer(-0.35)
    for k in range(5): tip=tip.difference(Point(6+k*2.5,0).buffer(0.25,resolution=24))
    return extrude(tip,T,-T/2)
def keeper():
    outer=box(-0.6,-2.3,0.6,2.3).buffer(0.0); # in (len, w) later; build cross-section in (w,t)
    sec=box(-2.3,-0.25,2.3,0.62).difference(box(-2.05,-0.19,2.05,0.57))  # w x t ring
    sec=box(-2.3,-0.75,2.3,0.75).buffer(0.12).difference(box(-2.05,-0.52,2.05,0.52))
    m=trimesh.creation.extrude_polygon(sec,1.1)  # axes: a=w, b=t, c=len
    V=m.vertices.copy(); m.vertices=np.column_stack([V[:,2]-0.55, V[:,0], V[:,1]])  # -> (x,w,t)
    m.faces=m.faces[:,::-1]; m.apply_translation([-3.6,0,0.29]); return m
def frame():
    outer=box(0.25,-2.4,3.25,2.4).buffer(0.25)
    inner=box(0.67,-1.98,2.83,1.98).buffer(0.12)
    base=extrude(outer.difference(inner),0.40,-0.20)
    ridge=extrude(outer.buffer(-0.12).difference(inner.buffer(0.12)),0.14,0.20)
    return trimesh.util.concatenate([base,ridge])
def prong():
    r=0.14; P=np.array([(0.275,0,0.1),(0.55,0,0.55),(1.0,0,1.0),(1.75,0,1.0),(1.75,0,0.25)],float)
    parts=[]
    for a,b in zip(P[:-1],P[1:]): parts.append(trimesh.creation.cylinder(radius=r,segment=[a,b],sections=20))
    for p in P[1:]: 
        s=trimesh.creation.icosphere(subdivisions=2,radius=r); s.apply_translation(p); parts.append(s)
    parts.append(trimesh.creation.cylinder(radius=0.22,segment=[(0.275,-1.9,0.1),(0.275,1.9,0.1)],sections=24))
    m=trimesh.util.concatenate(parts); m.apply_translation(-P[0]); return m  # origin = pivot

for name,v in VARIANTS.items():
    col,nm=leather(v["base"],v["crev"],v["stitch"])
    lmat=PBRMaterial(name=f"leather_{name}",baseColorTexture=col,normalTexture=nm,metallicFactor=0.0,roughnessFactor=0.48)
    mmat=PBRMaterial(name="chrome",baseColorFactor=[0.86,0.86,0.88,1],metallicFactor=1.0,roughnessFactor=0.22)
    sc=trimesh.Scene()
    sc.add_geometry(leather_mesh(strap_left(),lmat),node_name="strap_left",geom_name="strap_left")
    sc.add_geometry(leather_mesh(keeper(),lmat),node_name="keeper",geom_name="keeper")
    sc.add_geometry(metal_mesh(frame(),mmat),node_name="buckle_frame",geom_name="buckle_frame")
    T_pr=np.eye(4); T_pr[:3,3]=[0.275,0.1,0]          # prong pivot (converted)
    sc.add_geometry(metal_mesh(prong(),mmat),node_name="buckle_prong",geom_name="buckle_prong",transform=T_pr)
    T_r=np.eye(4); T_r[:3,3]=[-9.25,0.575,0]           # locked pose, hole #3 under the prong
    sc.add_geometry(leather_mesh(strap_right(),lmat),node_name="strap_right",geom_name="strap_right",transform=T_r)
    sc.export(f"{OUT}/veto-belt-{name}.glb")
    print(name,"ok")

import numpy as np, cv2, math
from scipy import ndimage as ndi
from scipy.spatial import cKDTree

# ---------------- croc texture (tileable 8 x 4 cm) ----------------
def croc_tile(seed=3, TW=1536, TH=768):
    rng=np.random.default_rng(seed); nx,ny=11,8
    pts=np.array([((i+0.5*(j%2)+.5+rng.uniform(-.13,.13))/nx,(j+.5+rng.uniform(-.13,.13))/ny) for i in range(nx) for j in range(ny)])
    tiled=np.vstack([pts+[dx,dy] for dx in(-1,0,1) for dy in(-1,0,1)]); s=np.array([2.0,1.0])
    tree=cKDTree(tiled*s)
    xs=(np.arange(TW)+.5)/TW; ys=(np.arange(TH)+.5)/TH; gx,gy=np.meshgrid(xs,ys)
    d,_=tree.query(np.column_stack([gx.ravel(),gy.ravel()])*s,k=2)
    f1=d[:,0].reshape(TH,TW); f2=d[:,1].reshape(TH,TW)
    e=np.clip((f2-f1)/0.022,0,1); e=e*e*(3-2*e)
    dome=np.clip(1-f1/(0.5/nx*2.0),0,1)
    h=e*(0.66+0.34*dome)
    g=ndi.gaussian_filter(rng.normal(0,1,(TH,TW)),1.2); g/=np.abs(g).max()
    return np.clip(h+0.04*g,0,1).astype(np.float32)
_TILE=None
def tile():
    global _TILE
    if _TILE is None: _TILE=croc_tile()
    return _TILE
def tsample(X,Y,off=0.0):
    t=tile(); TH,TW=t.shape
    u=(((X+off)/8.0)%1.0*TW).astype(np.float32); v=(((2.0-Y)/4.0)%1.0*TH).astype(np.float32)
    return cv2.remap(t,u,v,cv2.INTER_LINEAR,borderMode=cv2.BORDER_WRAP)

# ---------------- SDF helpers (cm, positive inside) ----------------
def rbox(X,Y,cx,cy,hx,hy,r):
    qx=np.abs(X-cx)-(hx-r); qy=np.abs(Y-cy)-(hy-r)
    return -(np.hypot(np.maximum(qx,0),np.maximum(qy,0))+np.minimum(np.maximum(qx,qy),0)-r)
def circle(X,Y,cx,cy,r): return r-np.hypot(X-cx,Y-cy)
def seg_dist(X,Y,ax,ay,bx,by):
    px,py=X-ax,Y-ay; dx,dy=bx-ax,by-ay
    t=np.clip((px*dx+py*dy)/(dx*dx+dy*dy),0,1); return np.hypot(px-t*dx,py-t*dy)
def sstep(a,b,x):
    t=np.clip((x-a)/(b-a),0,1); return t*t*(3-2*t)
def bevel(sd,bw): 
    t=1-np.clip(sd/bw,0,1); return np.sqrt(np.maximum(1-t*t,0))

# ---------------- lighting ----------------
def normals(h,pxcm,k=1.0):
    gy,gx=np.gradient(h,1.0/pxcm)
    n=np.dstack([-gx*k,gy*k,np.ones_like(h)]); n/=np.linalg.norm(n,axis=2,keepdims=True); return n
def unit(*v): v=np.array(v,float); return v/np.linalg.norm(v)
BOX1=unit(-0.55,0.55,0.62); BOX2=unit(0.75,-0.25,0.6); DARK=unit(0.5,0.6,0.62); LDIR=unit(-0.45,0.55,0.7)
def refl(n):
    nx,ny,nz=n[...,0],n[...,1],n[...,2]
    return 2*nz*nx,2*nz*ny,2*nz*nz-1
def blob(R,c,w,amp):
    d=R[0]*c[0]+R[1]*c[1]+R[2]*c[2]; return amp*np.exp(-(1-d)/w)
def metal(n,tint,ao,sh,seed=1):
    rng=np.random.default_rng(seed)
    nz=n.copy(); nz[...,:2]+=0.012*rng.normal(0,1,n[...,:2].shape).astype(np.float32); nz/=np.linalg.norm(nz,axis=2,keepdims=True)
    R=refl(nz)
    env=np.where(R[2]>0,0.44+0.36*np.clip(R[2],0,1),0.30+0.15*(R[2]+1))
    v=env+blob(R,BOX1,0.09,1.0)+blob(R,BOX2,0.06,0.55)-blob(R,DARK,0.10,0.22)
    v=np.clip(v,0,1.35)
    return np.array(tint,np.float32)[None,None,:]*v[...,None]*(ao*(1-0.6*sh))[...,None]
def leather(n,alb,ao,sh,gloss=0.5):
    H=unit(LDIR[0],LDIR[1],LDIR[2]+1)
    nl=np.clip(n[...,0]*LDIR[0]+n[...,1]*LDIR[1]+n[...,2]*LDIR[2],0,1)
    diff=0.50+0.68*nl
    R=refl(n); spec=blob(R,BOX1,0.035,gloss)+blob(R,BOX2,0.03,gloss*0.4)
    return alb*(diff*ao*(1-0.65*sh))[...,None]+(spec*ao*(1-sh))[...,None]*np.array([1,1,1],np.float32)*0.9

# ---------------- compose parts ----------------
def compose(parts,pxcm,bg_noise_seed=0):
    rows,cols=parts[0]['sd'].shape
    Hs=[np.where(p['sd']>0,p['h'],-1.0).astype(np.float32) for p in parts]
    Hg=np.maximum(np.maximum.reduce(Hs),0)
    top=np.argmax(np.stack(Hs),axis=0)
    alpha=np.maximum.reduce([np.clip(p['sd']*pxcm+0.5,0,1) for p in parts]).astype(np.float32)
    # ambient occlusion + cast shadow from the combined height field
    ao=1-np.clip((ndi.gaussian_filter(Hg,0.16*pxcm)-Hg)*3.2,0,0.55)
    s=0.38*pxcm
    Hs_=ndi.shift(Hg,(s,s*0.8),order=1,mode='nearest')
    sh=ndi.gaussian_filter(np.clip((Hs_-Hg)/0.45,0,1),0.07*pxcm)*0.55
    out=np.zeros((rows,cols,3),np.float32)
    for i,p in enumerate(parts):
        sel=(top==i)&(p['sd']>-1)
        if not sel.any(): continue
        ys,xs=np.where(sel); y0,y1,x0,x1=max(ys.min()-2,0),ys.max()+3,max(xs.min()-2,0),xs.max()+3
        sl=(slice(y0,y1),slice(x0,x1))
        n=normals(p['h'][sl],pxcm,p.get('nk',1.0))
        a,sv=ao[sl],sh[sl]
        if p['kind']=='metal': col=metal(n,p['tint'],a,sv,seed=i)
        else: col=leather(n,p['albedo'][sl],a,sv,p.get('gloss',0.5))
        o=out[sl]; m=sel[sl]; o[m]=col[m]
    rgb=np.clip(out,0,1)**(1/1.0)
    rgba=np.dstack([(rgb*255).astype(np.uint8),(alpha*255).astype(np.uint8)])
    return rgba

# ---------------- belt definition ----------------
VARIANTS={
 'red':  dict(base=(0.44,0.045,0.06),crev=(0.12,0.01,0.02),thread=(0.78,0.16,0.17),edge=0.55),
 'black':dict(base=(0.13,0.13,0.13),crev=(0.02,0.02,0.02),thread=(0.42,0.42,0.42),edge=0.55),
 'white':dict(base=(0.90,0.88,0.83),crev=(0.55,0.52,0.45),thread=(0.98,0.97,0.94),edge=0.80),
}
TINT=(0.93,0.92,0.89)
BW=4.0; TH=0.40
def knurl(X,Y,f=7.0): return 0.5+0.5*np.sin(2*np.pi*(X*f+Y*f))

def leather_part(X,Y,sd,v,top=TH,bw=0.10,toff=0.0,rise=None,stitch_y=None,z0=0.0):
    prof=bevel(sd,bw)
    cr=tsample(X,Y,toff)
    h=z0+(top-z0)*prof+0.024*(cr-0.5)*prof
    if rise is not None: h=h+rise
    base=np.array(v['base'],np.float32); crev=np.array(v['crev'],np.float32)
    alb=crev[None,None,:]+(base-crev)[None,None,:]*(0.50+0.50*cr)[...,None]
    # tonal mottling
    rng=np.random.default_rng(5); low=cv2.resize(rng.normal(0,1,(24,60)).astype(np.float32),(X.shape[1],X.shape[0]),interpolation=cv2.INTER_CUBIC)
    alb=alb*(1+0.05*low)[...,None]
    # burnished darker edge
    alb=alb*(v['edge']+(1-v['edge'])*sstep(0.0,0.15,sd))[...,None]
    if stitch_y is not None:
        ed=stitch_y[0]-np.abs(Y-stitch_y[1])
        dash=(((X/0.38)%1.0)<0.62).astype(np.float32)
        th=sstep(0,0.012,0.034-np.abs(ed-0.30))*dash*sstep(0.1,0.2,sd)
        h=h+0.014*th; th3=np.array(v['thread'],np.float32)
        alb=alb*(1-0.9*th)[...,None]+th3[None,None,:]*(0.9*th)[...,None]
    return dict(sd=sd,h=h.astype(np.float32),kind='leather',albedo=alb.astype(np.float32),gloss=0.36 if v['base'][0]<0.8 else 0.28)

def keeper_part(X,Y,cx,top,z0):
    sd=rbox(X,Y,cx,0,0.44,2.22,0.22)
    p=bevel(sd,0.2); h=z0+(top-z0)*p+0.016*knurl(X,Y,6.5)*sstep(0.05,0.12,sd)*sstep(0.05,0.14,0.30-np.abs(sd-0.22)*0+sd)  
    h=h-0.05*sstep(0.0,0.02,0.035-np.abs(sd-0.17))  # engraved line
    return dict(sd=sd,h=h.astype(np.float32),kind='metal',tint=TINT)

def cap_part(X,Y,cx0,cx1,top):
    u=np.clip((X-cx0)/(cx1-cx0),0,1); hw=2.15*np.maximum(1-u**2.3,0)**0.62
    dhw=np.gradient(hw,axis=1)/np.maximum(np.gradient(X,axis=1),1e-6)
    sd=np.minimum((hw-np.abs(Y))/np.sqrt(1+dhw**2),X-cx0)
    sd=np.where(X>cx1,-1,sd)
    p=bevel(sd,0.22); h=TH*0.9+(top-TH*0.9)*p
    h=h-0.05*sstep(0,0.02,0.035-np.abs(sd-0.36))                       # inner border line
    h=h-0.045*sstep(0,0.02,0.04-np.abs(Y))*sstep(cx0+0.7,cx0+1.2,X)*(1-sstep(cx1-1.2,cx1-0.5,X))  # center engraving line
    return dict(sd=sd,h=h.astype(np.float32),kind='metal',tint=TINT),hw

def frame_parts(X,Y,ox):
    Xo=X-ox
    outer=rbox(Xo,Y,3.2,0,3.2,2.85,0.9); inner=rbox(Xo,Y,3.125,0,2.175,2.05,0.35)
    sd=np.minimum(outer,-inner)
    p=bevel(sd,0.26)
    kn=knurl(Xo,Y,7.5)
    band=sstep(0.06,0.11,outer)*(1-sstep(0.26,0.31,outer))
    band2=sstep(0.06,0.10,-inner)*(1-sstep(0.22,0.27,-inner))
    h=0.60*p+0.034*kn*(band+band2)
    h=h-0.05*sstep(0,0.02,0.032-np.abs(outer-0.42))
    frame=dict(sd=sd,h=h.astype(np.float32),kind='metal',tint=TINT)
    # prong: pivot sleeve on the strap-side bar, stem resting on the front bar
    pv=5.85; 
    sl_sd=rbox(Xo,Y,pv,0,0.30,0.72,0.28); sl_h=0.46+np.sqrt(np.maximum(0.30**2-(Xo-pv)**2,0))*1.0
    d=seg_dist(Xo,Y,0.80,0,5.6,0); r=0.13+0.035*(Xo-0.8)/4.8
    st_sd=r-d; st_h=0.52+np.sqrt(np.maximum(r**2-d**2,0))
    st_sd=np.where(Xo<0.62,-1,st_sd)
    prong=dict(sd=np.maximum(sl_sd,st_sd),h=np.where(sl_sd>st_sd,sl_h,st_h).astype(np.float32),kind='metal',tint=TINT)
    return [frame,prong]

def belt_flat(X,Y,v,L=105.0,capL=4.6):
    parts=[]
    xs0=5.6; c0=L-capL; c1=L+0.4
    cap,hw=cap_part(X,Y,c0,c1,0.62)
    strap=rbox(X,Y,(xs0+L)/2,0,(L-xs0)/2,2.0,0.05)
    strap=np.minimum(strap,np.where(X>c0,cap['sd']-0.09,9))
    for k in range(5): strap=np.minimum(strap,-circle(X,Y,L-17.5-2.5*k,0,0.23))
    parts.append(leather_part(X,Y,strap,v,stitch_y=(2.0,0.0)))
    # stitch on both edges: add second pass for the other edge by mirroring Y
    parts.append(cap)
    for kx in (7.7,10.2,L-9.0,L-11.6): parts.append(keeper_part(X,Y,kx,0.82,TH))
    parts+=frame_parts(X,Y,0.0)
    return parts

def belt_worn(X,Y,v):
    """front view as worn: strap through the buckle, tail with tip cap tucked under a keeper"""
    parts=[]
    strap=rbox(X,Y,0,0,21,2.0,0.05)
    parts.append(leather_part(X,Y,strap,v,stitch_y=(2.0,0.0)))
    # tail lying over the strap, diving under the buckle's strap-side bar
    t0=2.4; L=8.7; c0=L-3.5
    cap,hw=cap_part(X,Y,c0,L+0.3,1.02)
    tail=rbox(X,Y,(t0+L)/2,0,(L-t0)/2,2.0,0.05)
    tail=np.minimum(tail,np.where(X>c0,cap['sd']-0.09,9))
    rise=0.4*sstep(2.2,3.9,X)
    parts.append(leather_part(X,Y,tail,v,top=TH,z0=0.0,rise=rise+0.0,toff=3.3,stitch_y=(2.0,0.0)))
    cap['h']=cap['h']+0.4
    parts.append(cap)
    parts.append(keeper_part(X,Y,3.95,1.25,0.8))
    parts+=frame_parts(X,Y,-3.2)
    return parts

def render(kind,x0,x1,y0,y1,pxcm,color,mirror=False,**kw):
    cols=int(round((x1-x0)*pxcm)); rows=int(round((y1-y0)*pxcm))
    X=(x0+(np.arange(cols)+0.5)/pxcm).astype(np.float32); Y=(y1-(np.arange(rows)+0.5)/pxcm).astype(np.float32)
    if mirror: X=(x0+x1-X).astype(np.float32)
    X,Y=np.meshgrid(X,Y)
    v=VARIANTS[color]
    parts=belt_worn(X,Y,v) if kind=='worn' else belt_flat(X,Y,v,**kw)
    return compose(parts,pxcm)

import{r as s,n as K,a as N,i as ot,b as at,j as t,m as k,T as J,t as ct,e as lt,g as nt,u as D,o as W,c as rt,d as dt,f as ut,R as ht,L as ft,B as pt}from"../shared/TextIcon-BHlThyDp.js";const mt=140,gt=`
$ErrorActionPreference = 'Stop'
Add-Type @'
using System;
using System.Text;
using System.Threading;
using System.Runtime.InteropServices;
public static class FlexioPanelProbe {
  delegate bool EnumProc(IntPtr h, IntPtr l);
  [StructLayout(LayoutKind.Sequential)] struct RECT { public int L, T, R, B; }
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc cb, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumChildWindows(IntPtr p, EnumProc cb, IntPtr l);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern IntPtr GetAncestor(IntPtr h, uint flags);
  [DllImport("user32.dll")] static extern IntPtr GetDesktopWindow();
  [DllImport("user32.dll")] static extern bool IsWindow(IntPtr h);
  [DllImport("user32.dll")] static extern bool SetProcessDPIAware();

  static IntPtr found;

  static bool Check(IntPtr h, uint[] pids) {
    var cls = new StringBuilder(64);
    GetClassName(h, cls, 64);
    if (cls.ToString() != "CefBrowserWindow") return true;
    uint pid;
    GetWindowThreadProcessId(h, out pid);
    if (Array.IndexOf(pids, pid) < 0) return true;
    found = h;
    return false;
  }

  static IntPtr Find(uint[] pids) {
    found = IntPtr.Zero;
    EnumWindows((top, l) => {
      if (!Check(top, pids)) return false;
      EnumChildWindows(top, (child, l2) => Check(child, pids), IntPtr.Zero);
      return found == IntPtr.Zero;
    }, IntPtr.Zero);
    return found;
  }

  // The view keeps its minimum width; the frames above it are what shrink
  static string Measure(IntPtr view) {
    RECT v;
    GetWindowRect(view, out v);
    int left = v.L, right = v.R;
    IntPtr desktop = GetDesktopWindow();
    for (IntPtr p = GetAncestor(view, 1); p != IntPtr.Zero && p != desktop; p = GetAncestor(p, 1)) {
      RECT a;
      GetWindowRect(p, out a);
      if (a.L > left) left = a.L;
      if (a.R < right) right = a.R;
    }
    return (v.R - v.L) + " " + Math.Max(0, right - left);
  }

  public static void Run(uint[] pids) {
    SetProcessDPIAware();
    IntPtr view = IntPtr.Zero;
    for (int i = 0; i < 25 && view == IntPtr.Zero; i++) {
      view = Find(pids);
      if (view == IntPtr.Zero) Thread.Sleep(200);
    }
    string last = null;
    while (view != IntPtr.Zero && IsWindow(view)) {
      string now = Measure(view);
      if (now != last) { Console.Out.WriteLine(now); Console.Out.Flush(); last = now; }
      Thread.Sleep(100);
    }
  }
}
'@
`;function wt(r){var p,f,g;if(!K||!N||N.platform!=="win32")return()=>{};const o=[N.pid,N.ppid].filter(m=>Number.isInteger(m)),d=`${gt}
[FlexioPanelProbe]::Run([uint32[]]@(${o.join(",")}))
`;let c;try{c=K.spawn("powershell.exe",["-NoProfile","-NonInteractive","-NoLogo","-Command","& ([scriptblock]::Create([Console]::In.ReadToEnd()))"],{windowsHide:!0,stdio:["pipe","pipe","ignore"]})}catch{return()=>{}}let a="";(p=c.stdout)==null||p.on("data",m=>{a+=String(m);const w=a.split(/\r?\n/);a=w.pop()??"";for(const x of w){const[y,b]=x.trim().split(" ").map(Number);y>0&&b>=0&&r(Math.min(1,b/y))}}),c.on("error",()=>{}),(f=c.stdin)==null||f.on("error",()=>{}),(g=c.stdin)==null||g.end(d);const i=()=>{try{c.kill()}catch{}};return window.addEventListener("unload",i),()=>{window.removeEventListener("unload",i),i()}}function vt(){const[r,o]=s.useState(()=>window.innerWidth),[d,c]=s.useState(1);s.useEffect(()=>{const i=()=>o(window.innerWidth);return window.addEventListener("resize",i),()=>window.removeEventListener("resize",i)},[]);const a=r<=mt;return s.useEffect(()=>{if(!a)return;const i=wt(c);return()=>{i(),c(1)}},[a]),d<1?Math.floor(r*d):null}const xt="_btn_1kn86_3",_t="_running_1kn86_27",It="_iconArea_1kn86_27",yt="_error_1kn86_29",bt="_crisp_1kn86_61",Rt="_iconImg_1kn86_69",Pt="_listBtn_1kn86_83",St="_nameOnly_1kn86_127",kt="_listLabel_1kn86_135",l={btn:xt,running:_t,iconArea:It,error:yt,crisp:bt,iconImg:Rt,listBtn:Pt,nameOnly:St,listLabel:kt};function tt({button:r,scale:o,uiMode:d,iconShape:c}){const[a,i]=s.useState(!1),[p,f]=s.useState(!1);async function g(){if(!a){i(!0),f(!1);try{const R=ct(r.scriptPath),_=await lt(R);_!=null&&_.startsWith("ERROR")&&(f(!0),setTimeout(()=>f(!1),1500))}catch{f(!0),setTimeout(()=>f(!1),1500)}finally{i(!1)}}}const m=r.iconType==="image"?ot(r.iconPath):"",w=at(r.name),x=d==="icon+name"?Math.max(24,Math.round(o*.6)):o,y=Math.max(10,Math.round(o*.19)),b=c==="crisp";return d==="icon"?t.jsx(k.button,{className:`${l.btn} ${a?l.running:""} ${p?l.error:""}`,style:{width:o,height:o},onClick:g,whileHover:{scale:1.06,filter:"brightness(1.15)"},whileTap:{scale:.94},transition:{duration:.12,ease:"easeOut"},children:t.jsx("div",{className:`${l.iconArea} ${b?l.crisp:""}`,style:{background:r.iconType==="text"?w:"transparent"},children:r.iconType==="image"&&m?t.jsx("img",{src:m,alt:r.name,className:l.iconImg,draggable:!1}):t.jsx(J,{text:r.autoIconText,box:o})})}):d==="icon+name"?t.jsxs(k.button,{className:`${l.listBtn} ${a?l.running:""} ${p?l.error:""}`,onClick:g,whileHover:{backgroundColor:"var(--surface-hover)"},whileTap:{scale:.98,backgroundColor:"var(--surface-active)"},transition:{duration:.1,ease:"easeOut"},children:[t.jsx("div",{className:l.listIcon,style:{width:x,height:x,flexShrink:0,background:r.iconType==="text"?w:"transparent",borderRadius:b?0:"var(--radius)",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"},children:r.iconType==="image"&&m?t.jsx("img",{src:m,alt:r.name,className:l.iconImg,draggable:!1}):t.jsx(J,{text:r.autoIconText,box:x})}),t.jsx("span",{className:l.listLabel,style:{fontSize:y},children:r.name})]}):t.jsx(k.button,{className:`${l.listBtn} ${l.nameOnly} ${a?l.running:""} ${p?l.error:""}`,onClick:g,whileHover:{backgroundColor:"var(--surface-hover)"},whileTap:{scale:.98,backgroundColor:"var(--surface-active)"},transition:{duration:.1,ease:"easeOut"},style:{fontSize:y},children:t.jsx("span",{className:l.listLabel,children:r.name})})}const Ct="_btn_144a7_1",Et="_iconArea_144a7_23",jt="_crisp_144a7_47",Tt="_listBtn_144a7_67",Lt="_listLabel_144a7_99",T={btn:Ct,iconArea:Et,crisp:jt,listBtn:Tt,listLabel:Lt};function et({size:r,app:o,iconShape:d,listMode:c}){const a=nt(),i=D();return c?t.jsxs(k.button,{className:T.listBtn,onClick:()=>W(o,a),whileHover:{backgroundColor:"var(--surface-hover)"},whileTap:{scale:.98},transition:{duration:.12},title:i.addScriptButton,children:[t.jsx("svg",{width:"12",height:"12",viewBox:"0 0 20 20",fill:"none",children:t.jsx("path",{d:"M10 4v12M4 10h12",stroke:"var(--accent)",strokeWidth:"2",strokeLinecap:"round"})}),t.jsx("span",{className:T.listLabel,children:i.addButton})]}):t.jsx(k.button,{className:T.btn,style:{width:r,height:r},onClick:()=>W(o,a),whileHover:{scale:1.06,borderColor:"var(--accent)"},whileTap:{scale:.94},transition:{duration:.12},title:i.addScriptButton,children:t.jsx("div",{className:`${T.iconArea} ${d==="crisp"?T.crisp:""}`,children:t.jsx("svg",{width:"20",height:"20",viewBox:"0 0 20 20",fill:"none",children:t.jsx("path",{d:"M10 4v12M4 10h12",stroke:"var(--accent)",strokeWidth:"2",strokeLinecap:"round"})})})})}const Bt="_grid_1qhi3_3",Mt="_item_1qhi3_15",Nt="_list_1qhi3_27",$t="_listItem_1qhi3_37",At="_draggable_1qhi3_49",Wt="_dragging_1qhi3_69",S={grid:Bt,item:Mt,list:Nt,listItem:$t,draggable:At,dragging:Wt},Dt=6,Ot=180;function Gt({buttons:r,app:o,toolsetId:d,scale:c,spacing:a,flipToReorder:i,uiMode:p,iconShape:f,columns:g}){const{reorderButtons:m}=rt(),w=s.useMemo(()=>r.filter(e=>!e.hidden).sort((e,n)=>e.order-n.order),[r]),[x,y]=s.useState(()=>w.map(e=>e.id)),[b,R]=s.useState(null),[_,O]=s.useState(null),G=b??x,C=s.useRef(x),E=s.useRef(null),P=s.useRef(null),j=s.useRef(null),A=s.useRef(null),L=s.useRef(new Map),B=s.useRef(!1),H=s.useRef(i),Z=s.useRef(o),z=s.useRef(d),F=s.useRef(m);s.useEffect(()=>{Z.current=o},[o]),s.useEffect(()=>{z.current=d},[d]),s.useEffect(()=>{F.current=m},[m]),s.useEffect(()=>{H.current=i},[i]),s.useEffect(()=>{if(P.current)return;const e=w.map(n=>n.id);C.current=e,y(e)},[w]),s.useLayoutEffect(()=>{const e=A.current;A.current=null,e&&L.current.forEach((n,u)=>{const h=e.get(u);if(!h)return;const I=n.getBoundingClientRect(),v=h.left-I.left,M=h.top-I.top;Math.abs(v)<.5&&Math.abs(M)<.5||(n.style.transform=`translate(${v}px,${M}px)`,n.style.transition="none",n.getBoundingClientRect(),n.style.transition=`transform ${Ot}ms ease`,n.style.transform="")})},[G]),s.useEffect(()=>(_?(document.body.style.cursor="grabbing",document.body.style.userSelect="none"):(document.body.style.cursor="",document.body.style.userSelect=""),()=>{document.body.style.cursor="",document.body.style.userSelect=""}),[_]),s.useEffect(()=>{const e=u=>{if(!H.current)return;const h=j.current;if(!h||P.current!==null||Math.hypot(u.clientX-h.startX,u.clientY-h.startY)<Dt)return;j.current=null;const I=[...C.current];P.current=h.id,E.current=I,O(h.id),R(I)},n=()=>{if(j.current){j.current=null;return}if(P.current===null)return;const u=E.current??C.current,h=C.current;u.some((I,v)=>I!==h[v])&&F.current(Z.current,z.current,u),B.current=!0,P.current=null,E.current=null,O(null),R(null)};return window.addEventListener("mousemove",e),window.addEventListener("mouseup",n),()=>{window.removeEventListener("mousemove",e),window.removeEventListener("mouseup",n)}},[]);function q(e,n){B.current=!1,i&&(j.current={id:e,startX:n.clientX,startY:n.clientY})}function U(e){if(!P.current||P.current===e)return;const n=E.current??C.current,u=n.indexOf(P.current),h=n.indexOf(e);if(u===-1||h===-1||u===h)return;const I=new Map;L.current.forEach((M,it)=>I.set(it,M.getBoundingClientRect())),A.current=I;const v=[...n];[v[u],v[h]]=[v[h],v[u]],E.current=v,R(v)}function V(e){B.current&&(B.current=!1,e.stopPropagation(),e.preventDefault())}function X(e,n){n?L.current.set(e,n):L.current.delete(e)}const st=s.useMemo(()=>{const e={};for(const n of r)e[n.id]=n;return e},[r]),Y=G.map(e=>st[e]).filter(Boolean),Q=r.length===0;if(p==="icon"){const e=g>0?{gap:a,display:"grid",gridTemplateColumns:`repeat(${g}, ${c}px)`}:{gap:a};return t.jsxs("div",{className:S.grid,style:e,children:[Y.map(n=>t.jsx("div",{ref:u=>X(n.id,u),style:{width:c,height:c},className:[S.item,i?S.draggable:"",_===n.id?S.dragging:""].filter(Boolean).join(" "),onMouseDown:u=>q(n.id,u),onMouseEnter:()=>U(n.id),onClickCapture:V,children:t.jsx(tt,{button:n,app:o,scale:c,uiMode:p,iconShape:f})},n.id)),Q&&t.jsx(et,{size:c,app:o,iconShape:f})]})}return t.jsxs("div",{className:S.list,style:{gap:a},children:[Y.map(e=>t.jsx("div",{ref:n=>X(e.id,n),className:[S.listItem,i?S.draggable:"",_===e.id?S.dragging:""].filter(Boolean).join(" "),onMouseDown:n=>q(e.id,n),onMouseEnter:()=>U(e.id),onClickCapture:V,children:t.jsx(tt,{button:e,app:o,scale:c,uiMode:p,iconShape:f})},e.id)),Q&&t.jsx(et,{size:c,app:o,listMode:!0})]})}const Ht="_gear_y3ydv_1",Zt={gear:Ht},zt="data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='utf-8'?%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Generator:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2048%2048'%20xmlns='http://www.w3.org/2000/svg'%3e%3ctitle%3esetting-solid%3c/title%3e%3cg%20id='Layer_2'%20data-name='Layer%202'%3e%3cg%20id='invisible_box'%20data-name='invisible%20box'%3e%3crect%20width='48'%20height='48'%20fill='none'/%3e%3crect%20width='48'%20height='48'%20fill='none'/%3e%3crect%20width='48'%20height='48'%20fill='none'/%3e%3c/g%3e%3cg%20id='icons_Q2'%20data-name='icons%20Q2'%3e%3cpath%20d='M40.2,29.2l5.5-1.5a23,23,0,0,0,0-7.4l-5.5-1.5a1.8,1.8,0,0,1-1.1-2.6l2.8-5a20.6,20.6,0,0,0-5.1-5.1l-5,2.8-.8.2a1.8,1.8,0,0,1-1.8-1.3L27.7,2.3a23,23,0,0,0-7.4,0L18.8,7.8A1.8,1.8,0,0,1,17,9.1l-.8-.2-5-2.8a20.6,20.6,0,0,0-5.1,5.1l2.8,5a1.8,1.8,0,0,1-1.1,2.6L2.3,20.3a23,23,0,0,0,0,7.4l5.5,1.5a1.8,1.8,0,0,1,1.1,2.6l-2.8,5a20.6,20.6,0,0,0,5.1,5.1l5-2.8.8-.2a1.8,1.8,0,0,1,1.8,1.3l1.5,5.5a23,23,0,0,0,7.4,0l1.5-5.5A1.8,1.8,0,0,1,31,38.9l.8.2,5,2.8a20.6,20.6,0,0,0,5.1-5.1l-2.8-5A1.8,1.8,0,0,1,40.2,29.2ZM24,33a9,9,0,1,1,9-9A9,9,0,0,1,24,33Z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e";function Ft({onClick:r}){const o=D();return t.jsx(k.button,{className:Zt.gear,onClick:r,whileHover:{rotate:45,scale:1.15},whileTap:{scale:.9},transition:{duration:.2,ease:"easeInOut"},title:o.flexioSettings,children:t.jsx("img",{src:zt,alt:"",width:14,height:14})})}const qt="_root_1sk2k_1",Ut="_content_1sk2k_21",Vt="_empty_1sk2k_37",Xt="_emptyText_1sk2k_51",$={root:qt,content:Ut,empty:Vt,emptyText:Xt};function Yt(){const{blueprints:r,isLoaded:o,loadError:d}=rt(),c=D(),a=dt(),i=nt(),p=r.allocation[a][i],f=s.useMemo(()=>r.apps[a].toolsets.find(_=>_.id===p)??null,[r,a,p]),{scale:g,spacing:m,flipToReorder:w,uiMode:x,iconShape:y,columns:b}=r.panelSettings[a][i],R=vt();return o?t.jsxs("div",{className:$.root,style:R!==null?{width:R}:void 0,children:[t.jsx(k.div,{className:$.content,initial:{opacity:0},animate:{opacity:1},transition:{duration:.25},children:f?t.jsx(Gt,{buttons:f.buttons,app:a,toolsetId:p,scale:g,spacing:m,flipToReorder:w,uiMode:x,iconShape:y,columns:b}):d?t.jsx("div",{className:$.empty,children:t.jsxs("span",{className:$.emptyText,children:[c.panelLoadError,t.jsx("br",{}),c.openSettingsForDetails]})}):null}),t.jsx(Ft,{onClick:()=>W(a,i)})]}):null}ut.createRoot(document.getElementById("root")).render(t.jsx(ht.StrictMode,{children:t.jsx(ft,{children:t.jsx(pt,{children:t.jsx(Yt,{})})})}));

const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/advanced-features-C9VqCi7o.js","assets/motion-0TFh2d6v.js","assets/rolldown-runtime-Dd_uD5pT.js","assets/api-reference-BcVfGAIF.js","assets/architecture-DU_oH-zq.js","assets/codelab-CA0RTGV2.js","assets/configuration-Be84_gUc.js","assets/github-action-BSxmJXbk.js","assets/introduction-C8xlsd68.js","assets/onboarding-ClhmbJKa.js","assets/security-DdKPERJx.js","assets/setup-C3cLmw_d.js","assets/troubleshooting-B065SsTQ.js","assets/workspaces-mXpcFZit.js","assets/highlighter-C2W_oa2D.js","assets/shiki-2mtfBG2y.js","assets/Mermaid-j2YcXTPo.js","assets/chunk-Y2CYZVJY-DsF7k-Jl.js","assets/src-oBChb5qS.js","assets/chunk-O7XYJQB3-C0PrhSoS.js","assets/chunk-ZIGJFQKS-CDBNr19Y.js","assets/dist-B_J_HbC0.js","assets/chunk-742MDFTN-Bf02Zrot.js","assets/chunk-MBY4JIJT-mWjpp3sB.js","assets/chunk-DUW6YSOI-Dgx8z5s3.js","assets/chunk-7PRAP22T-mjX03ZRA.js","assets/chunk-7INBJB4K-Ryulyehg.js","assets/chunk-J5ZVWO5B-oDCd-gWO.js","assets/rough.esm-Dy-Kn_BL.js","assets/chunk-5DYCD2WN-DPBMCUZL.js","assets/chunk-Z7XXMR3K-DmBoLv8x.js","assets/line-C9oJC1-6.js","assets/path-fybaL0A-.js","assets/array-BifhSqXX.js","assets/chunk-UA2S7LBM-B6DxloqG.js"])))=>i.map(i=>d[i]);
import{i as e}from"./rolldown-runtime-Dd_uD5pT.js";import{n as t,r as n,t as r}from"./motion-0TFh2d6v.js";import{n as i,t as a}from"./react-vendor-CNeaAu3m.js";import{a as o,c as s,i as c,l,n as u,o as d,r as f,s as p,t as m,u as h}from"./router-CHn7Mkyd.js";import{t as g}from"./fuse-COMZIxA7.js";import{n as _,t as v}from"./state-dS3bmQq2.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var y=e(n(),1),b={};function ee(e,t){let n=y.useRef(b);return n.current===b&&(n.current=e(t)),n}var te=Object.freeze([]);Object.freeze({});var ne=typeof document<`u`?y.useLayoutEffect:()=>{};function x(e){y.useEffect(e,te)}var S=0,re=class e{static create(){return new e}currentId=S;start(e,t){this.clear(),this.currentId=setTimeout(()=>{this.currentId=S,t()},e)}isStarted(){return this.currentId!==S}clear=()=>{this.currentId!==S&&(clearTimeout(this.currentId),this.currentId=S)};disposeEffect=()=>this.clear};function ie(){let e=ee(re.create).current;return x(e.disposeEffect),e}function ae(e,t){let n=[`mouse`,`pen`];return t||n.push(``,void 0),n.includes(e)}function oe(e,t){return t!=null&&!ae(t)?0:typeof e==`function`?e():e}function se(e,t,n){let r=oe(e,n);return typeof r==`number`?r:r?.[t]}var C=t(),w=y.createContext({hasProvider:!1,timeoutMs:0,delayRef:{current:0},initialDelayRef:{current:0},timeout:new re,currentIdRef:{current:null},currentContextRef:{current:null}});function T(e){let{children:t,delay:n,timeoutMs:r=0}=e,i=y.useRef(n),a=y.useRef(n),o=y.useRef(null),s=y.useRef(null),c=ie();return ne(()=>{if(a.current=n,!o.current){i.current=n;return}i.current={open:se(i.current,`open`),close:se(n,`close`)}},[n,o,i,a]),(0,C.jsx)(w.Provider,{value:y.useMemo(()=>({hasProvider:!0,delayRef:i,initialDelayRef:a,currentIdRef:o,timeoutMs:r,currentContextRef:s,timeout:c}),[r,c]),children:t})}var ce=y.createContext(void 0),le=function(e){let{delay:t,closeDelay:n,timeout:r=400}=e,i=y.useMemo(()=>({open:t,close:n}),[t,n]);return(0,C.jsx)(ce.Provider,{value:t,children:(0,C.jsx)(T,{delay:i,timeoutMs:r,children:e.children})})},E=a();function ue(e){var t,n,r=``;if(typeof e==`string`||typeof e==`number`)r+=e;else if(typeof e==`object`){if(Array.isArray(e)){var i=e.length;for(t=0;t<i;t++)e[t]&&(n=ue(e[t]))&&(r&&(r+=` `),r+=n)}else for(n in e)e[n]&&(r&&(r+=` `),r+=n)}return r}function de(){for(var e,t,n=0,r=``,i=arguments.length;n<i;n++)(e=arguments[n])&&(t=ue(e))&&(r&&(r+=` `),r+=t);return r}var fe=(e,t)=>{let n=Array(e.length+t.length);for(let t=0;t<e.length;t++)n[t]=e[t];for(let r=0;r<t.length;r++)n[e.length+r]=t[r];return n},pe=(e,t)=>({classGroupId:e,validator:t}),D=(e=new Map,t=null,n)=>({nextPart:e,validators:t,classGroupId:n}),O=`-`,me=[],he=`arbitrary..`,k=e=>{let t=ve(e),{conflictingClassGroups:n,conflictingClassGroupModifiers:r}=e;return{getClassGroupId:e=>{if(e.startsWith(`[`)&&e.endsWith(`]`))return _e(e);let n=e.split(O);return ge(n,+(n[0]===``&&n.length>1),t)},getConflictingClassGroupIds:(e,t)=>{if(t){let t=r[e],i=n[e];return t?i?fe(i,t):t:i||me}return n[e]||me}}},ge=(e,t,n)=>{if(e.length-t===0)return n.classGroupId;let r=e[t],i=n.nextPart.get(r);if(i){let n=ge(e,t+1,i);if(n)return n}let a=n.validators;if(a===null)return;let o=t===0?e.join(O):e.slice(t).join(O),s=a.length;for(let e=0;e<s;e++){let t=a[e];if(t.validator(o))return t.classGroupId}},_e=e=>e.slice(1,-1).indexOf(`:`)===-1?void 0:(()=>{let t=e.slice(1,-1),n=t.indexOf(`:`),r=t.slice(0,n);return r?he+r:void 0})(),ve=e=>{let{theme:t,classGroups:n}=e;return ye(n,t)},ye=(e,t)=>{let n=D();for(let r in e){let i=e[r];A(i,n,r,t)}return n},A=(e,t,n,r)=>{let i=e.length;for(let a=0;a<i;a++){let i=e[a];be(i,t,n,r)}},be=(e,t,n,r)=>{if(typeof e==`string`){xe(e,t,n);return}if(typeof e==`function`){Se(e,t,n,r);return}Ce(e,t,n,r)},xe=(e,t,n)=>{let r=e===``?t:we(t,e);r.classGroupId=n},Se=(e,t,n,r)=>{if(Te(e)){A(e(r),t,n,r);return}t.validators===null&&(t.validators=[]),t.validators.push(pe(n,e))},Ce=(e,t,n,r)=>{let i=Object.entries(e),a=i.length;for(let e=0;e<a;e++){let[a,o]=i[e];A(o,we(t,a),n,r)}},we=(e,t)=>{let n=e,r=t.split(O),i=r.length;for(let e=0;e<i;e++){let t=r[e],i=n.nextPart.get(t);i||(i=D(),n.nextPart.set(t,i)),n=i}return n},Te=e=>`isThemeGetter`in e&&e.isThemeGetter===!0,Ee=e=>{if(e<1)return{get:()=>void 0,set:()=>{}};let t=0,n=Object.create(null),r=Object.create(null),i=(i,a)=>{n[i]=a,t++,t>e&&(t=0,r=n,n=Object.create(null))};return{get(e){let t=n[e];if(t!==void 0)return t;if((t=r[e])!==void 0)return i(e,t),t},set(e,t){e in n?n[e]=t:i(e,t)}}},De=`!`,Oe=`:`,ke=[],Ae=(e,t,n,r,i)=>({modifiers:e,hasImportantModifier:t,baseClassName:n,maybePostfixModifierPosition:r,isExternal:i}),je=e=>{let{prefix:t,experimentalParseClassName:n}=e,r=e=>{let t=[],n=0,r=0,i=0,a,o=e.length;for(let s=0;s<o;s++){let o=e[s];if(n===0&&r===0){if(o===Oe){t.push(e.slice(i,s)),i=s+1;continue}if(o===`/`){a=s;continue}}o===`[`?n++:o===`]`?n--:o===`(`?r++:o===`)`&&r--}let s=t.length===0?e:e.slice(i),c=s,l=!1;s.endsWith(De)?(c=s.slice(0,-1),l=!0):s.startsWith(De)&&(c=s.slice(1),l=!0);let u=a&&a>i?a-i:void 0;return Ae(t,l,c,u)};if(t){let e=t+Oe,n=r;r=t=>t.startsWith(e)?n(t.slice(e.length)):Ae(ke,!1,t,void 0,!0)}if(n){let e=r;r=t=>n({className:t,parseClassName:e})}return r},Me=e=>{let t=new Map;return e.orderSensitiveModifiers.forEach((e,n)=>{t.set(e,1e6+n)}),e=>{let n=[],r=[];for(let i=0;i<e.length;i++){let a=e[i],o=a[0]===`[`,s=t.has(a);o||s?(r.length>0&&(r.sort(),n.push(...r),r=[]),n.push(a)):r.push(a)}return r.length>0&&(r.sort(),n.push(...r)),n}},Ne=e=>({cache:Ee(e.cacheSize),parseClassName:je(e),sortModifiers:Me(e),postfixLookupClassGroupIds:Pe(e),...k(e)}),Pe=e=>{let t=Object.create(null),n=e.postfixLookupClassGroups;if(n)for(let e=0;e<n.length;e++)t[n[e]]=!0;return t},Fe=/\s+/,Ie=(e,t)=>{let{parseClassName:n,getClassGroupId:r,getConflictingClassGroupIds:i,sortModifiers:a,postfixLookupClassGroupIds:o}=t,s=[],c=e.trim().split(Fe),l=``;for(let e=c.length-1;e>=0;--e){let t=c[e],{isExternal:u,modifiers:d,hasImportantModifier:f,baseClassName:p,maybePostfixModifierPosition:m}=n(t);if(u){l=t+(l.length>0?` `+l:l);continue}let h=!!m,g;if(h){g=r(p.substring(0,m));let e=g&&o[g]?r(p):void 0;e&&e!==g&&(g=e,h=!1)}else g=r(p);if(!g){if(!h){l=t+(l.length>0?` `+l:l);continue}if(g=r(p),!g){l=t+(l.length>0?` `+l:l);continue}h=!1}let _=d.length===0?``:d.length===1?d[0]:a(d).join(`:`),v=f?_+De:_,y=v+g;if(s.indexOf(y)>-1)continue;s.push(y);let b=i(g,h);for(let e=0;e<b.length;++e){let t=b[e];s.push(v+t)}l=t+(l.length>0?` `+l:l)}return l},Le=(...e)=>{let t=0,n,r,i=``;for(;t<e.length;)(n=e[t++])&&(r=Re(n))&&(i&&(i+=` `),i+=r);return i},Re=e=>{if(typeof e==`string`)return e;let t,n=``;for(let r=0;r<e.length;r++)e[r]&&(t=Re(e[r]))&&(n&&(n+=` `),n+=t);return n},ze=(e,...t)=>{let n,r,i,a,o=o=>(n=Ne(t.reduce((e,t)=>t(e),e())),r=n.cache.get,i=n.cache.set,a=s,s(o)),s=e=>{let t=r(e);if(t)return t;let a=Ie(e,n);return i(e,a),a};return a=o,(...e)=>a(Le(...e))},Be=[],j=e=>{let t=t=>t[e]||Be;return t.isThemeGetter=!0,t.themeKey=e,t},Ve=/^\[(?:(\w[\w-]*):)?(.+)\]$/i,He=/^\((?:(\w[\w-]*):)?(.+)\)$/i,Ue=/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/,We=/^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,Ge=/\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,Ke=/^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix|color|light-dark)\(.+\)$/,qe=/^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,Je=/^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,M=e=>Ue.test(e),N=e=>!!e&&!Number.isNaN(Number(e)),P=e=>!!e&&Number.isInteger(Number(e)),Ye=e=>e.endsWith(`%`)&&N(e.slice(0,-1)),F=e=>We.test(e),Xe=()=>!0,Ze=e=>Ge.test(e)&&!Ke.test(e),Qe=()=>!1,$e=e=>qe.test(e),et=e=>Je.test(e),tt=e=>!I(e)&&!R(e),nt=e=>e.startsWith(`@container`)&&(e[10]===`/`&&e[11]!==void 0||e[11]===`s`&&e[16]!==void 0&&e.startsWith(`-size/`,10)||e[11]===`n`&&e[18]!==void 0&&e.startsWith(`-normal/`,10)),rt=e=>z(e,yt,Qe),I=e=>Ve.test(e),L=e=>z(e,bt,Ze),it=e=>z(e,xt,N),at=e=>z(e,Ct,Xe),ot=e=>z(e,St,Qe),st=e=>z(e,_t,Qe),ct=e=>z(e,vt,et),lt=e=>z(e,wt,$e),R=e=>He.test(e),ut=e=>B(e,bt),dt=e=>B(e,St),ft=e=>B(e,_t),pt=e=>B(e,yt),mt=e=>B(e,vt),ht=e=>B(e,wt,!0),gt=e=>B(e,Ct,!0),z=(e,t,n)=>{let r=Ve.exec(e);return r?r[1]?t(r[1]):n(r[2]):!1},B=(e,t,n=!1)=>{let r=He.exec(e);return r?r[1]?t(r[1]):n:!1},_t=e=>e===`position`||e===`percentage`,vt=e=>e===`image`||e===`url`,yt=e=>e===`length`||e===`size`||e===`bg-size`,bt=e=>e===`length`,xt=e=>e===`number`,St=e=>e===`family-name`,Ct=e=>e===`number`||e===`weight`,wt=e=>e===`shadow`,Tt=ze(()=>{let e=j(`color`),t=j(`font`),n=j(`text`),r=j(`font-weight`),i=j(`tracking`),a=j(`leading`),o=j(`breakpoint`),s=j(`container`),c=j(`spacing`),l=j(`radius`),u=j(`shadow`),d=j(`inset-shadow`),f=j(`text-shadow`),p=j(`drop-shadow`),m=j(`blur`),h=j(`perspective`),g=j(`aspect`),_=j(`ease`),v=j(`animate`),y=()=>[`auto`,`avoid`,`all`,`avoid-page`,`page`,`left`,`right`,`column`],b=()=>[`center`,`top`,`bottom`,`left`,`right`,`top-left`,`left-top`,`top-right`,`right-top`,`bottom-right`,`right-bottom`,`bottom-left`,`left-bottom`],ee=()=>[...b(),R,I],te=()=>[`auto`,`hidden`,`clip`,`visible`,`scroll`],ne=()=>[`auto`,`contain`,`none`],x=()=>[R,I,c],S=()=>[M,`full`,`auto`,...x()],re=()=>[P,`none`,`subgrid`,R,I],ie=()=>[`auto`,{span:[`full`,P,R,I]},P,R,I],ae=()=>[P,`auto`,R,I],oe=()=>[`auto`,`min`,`max`,`fr`,R,I],se=()=>[`start`,`end`,`center`,`between`,`around`,`evenly`,`stretch`,`baseline`,`center-safe`,`end-safe`],C=()=>[`start`,`end`,`center`,`stretch`,`center-safe`,`end-safe`],w=()=>[`auto`,...x()],T=()=>[M,`auto`,`full`,`dvw`,`dvh`,`lvw`,`lvh`,`svw`,`svh`,`min`,`max`,`fit`,...x()],ce=()=>[s,M,`screen`,`full`,`dvw`,`lvw`,`svw`,`min`,`max`,`fit`,...x()],le=()=>[M,`screen`,`full`,`lh`,`dvh`,`lvh`,`svh`,`min`,`max`,`fit`,...x()],E=()=>[e,R,I],ue=()=>[...b(),ft,st,{position:[R,I]}],de=()=>[`no-repeat`,{repeat:[``,`x`,`y`,`space`,`round`]}],fe=()=>[`auto`,`cover`,`contain`,pt,rt,{size:[R,I]}],pe=()=>[Ye,ut,L],D=()=>[``,`none`,`full`,l,R,I],O=()=>[``,N,ut,L],me=()=>[`solid`,`dashed`,`dotted`,`double`],he=()=>[`normal`,`multiply`,`screen`,`overlay`,`darken`,`lighten`,`color-dodge`,`color-burn`,`hard-light`,`soft-light`,`difference`,`exclusion`,`hue`,`saturation`,`color`,`luminosity`],k=()=>[N,Ye,ft,st],ge=()=>[``,`none`,m,R,I],_e=()=>[`none`,N,R,I],ve=()=>[`none`,N,R,I],ye=()=>[N,R,I],A=()=>[M,`full`,...x()];return{cacheSize:500,theme:{animate:[`spin`,`ping`,`pulse`,`bounce`],aspect:[`video`],blur:[F],breakpoint:[F],color:[Xe],container:[F],"drop-shadow":[F],ease:[`in`,`out`,`in-out`],font:[tt],"font-weight":[`thin`,`extralight`,`light`,`normal`,`medium`,`semibold`,`bold`,`extrabold`,`black`],"inset-shadow":[F],leading:[`none`,`tight`,`snug`,`normal`,`relaxed`,`loose`],perspective:[`dramatic`,`near`,`normal`,`midrange`,`distant`,`none`],radius:[F],shadow:[F],spacing:[`px`,N],text:[F],"text-shadow":[F],tracking:[`tighter`,`tight`,`normal`,`wide`,`wider`,`widest`]},classGroups:{aspect:[{aspect:[`auto`,`square`,M,I,R,g]}],container:[`container`],"container-type":[{"@container":[``,`normal`,`size`,R,I]}],"container-named":[nt],columns:[{columns:[N,`auto`,I,R,s]}],"break-after":[{"break-after":y()}],"break-before":[{"break-before":y()}],"break-inside":[{"break-inside":[`auto`,`avoid`,`avoid-page`,`avoid-column`]}],"box-decoration":[{"box-decoration":[`slice`,`clone`]}],box:[{box:[`border`,`content`]}],display:[`block`,`inline-block`,`inline`,`flex`,`inline-flex`,`table`,`inline-table`,`table-caption`,`table-cell`,`table-column`,`table-column-group`,`table-footer-group`,`table-header-group`,`table-row-group`,`table-row`,`flow-root`,`grid`,`inline-grid`,`contents`,`list-item`,`hidden`],sr:[`sr-only`,`not-sr-only`],float:[{float:[`right`,`left`,`none`,`start`,`end`]}],clear:[{clear:[`left`,`right`,`both`,`none`,`start`,`end`]}],isolation:[`isolate`,`isolation-auto`],"object-fit":[{object:[`contain`,`cover`,`fill`,`none`,`scale-down`]}],"object-position":[{object:ee()}],overflow:[{overflow:te()}],"overflow-x":[{"overflow-x":te()}],"overflow-y":[{"overflow-y":te()}],overscroll:[{overscroll:ne()}],"overscroll-x":[{"overscroll-x":ne()}],"overscroll-y":[{"overscroll-y":ne()}],position:[`static`,`fixed`,`absolute`,`relative`,`sticky`],inset:[{inset:S()}],"inset-x":[{"inset-x":S()}],"inset-y":[{"inset-y":S()}],start:[{"inset-s":S(),start:S()}],end:[{"inset-e":S(),end:S()}],"inset-bs":[{"inset-bs":S()}],"inset-be":[{"inset-be":S()}],top:[{top:S()}],right:[{right:S()}],bottom:[{bottom:S()}],left:[{left:S()}],visibility:[`visible`,`invisible`,`collapse`],z:[{z:[P,`auto`,R,I]}],basis:[{basis:[M,`full`,`auto`,s,...x()]}],"flex-direction":[{flex:[`row`,`row-reverse`,`col`,`col-reverse`]}],"flex-wrap":[{flex:[`nowrap`,`wrap`,`wrap-reverse`]}],flex:[{flex:[N,M,`auto`,`initial`,`none`,I]}],grow:[{grow:[``,N,R,I]}],shrink:[{shrink:[``,N,R,I]}],order:[{order:[P,`first`,`last`,`none`,R,I]}],"grid-cols":[{"grid-cols":re()}],"col-start-end":[{col:ie()}],"col-start":[{"col-start":ae()}],"col-end":[{"col-end":ae()}],"grid-rows":[{"grid-rows":re()}],"row-start-end":[{row:ie()}],"row-start":[{"row-start":ae()}],"row-end":[{"row-end":ae()}],"grid-flow":[{"grid-flow":[`row`,`col`,`dense`,`row-dense`,`col-dense`]}],"auto-cols":[{"auto-cols":oe()}],"auto-rows":[{"auto-rows":oe()}],gap:[{gap:x()}],"gap-x":[{"gap-x":x()}],"gap-y":[{"gap-y":x()}],"justify-content":[{justify:[...se(),`normal`]}],"justify-items":[{"justify-items":[...C(),`normal`]}],"justify-self":[{"justify-self":[`auto`,...C()]}],"align-content":[{content:[`normal`,...se()]}],"align-items":[{items:[...C(),{baseline:[``,`last`]}]}],"align-self":[{self:[`auto`,...C(),{baseline:[``,`last`]}]}],"place-content":[{"place-content":se()}],"place-items":[{"place-items":[...C(),`baseline`]}],"place-self":[{"place-self":[`auto`,...C()]}],p:[{p:x()}],px:[{px:x()}],py:[{py:x()}],ps:[{ps:x()}],pe:[{pe:x()}],pbs:[{pbs:x()}],pbe:[{pbe:x()}],pt:[{pt:x()}],pr:[{pr:x()}],pb:[{pb:x()}],pl:[{pl:x()}],m:[{m:w()}],mx:[{mx:w()}],my:[{my:w()}],ms:[{ms:w()}],me:[{me:w()}],mbs:[{mbs:w()}],mbe:[{mbe:w()}],mt:[{mt:w()}],mr:[{mr:w()}],mb:[{mb:w()}],ml:[{ml:w()}],"space-x":[{"space-x":x()}],"space-x-reverse":[`space-x-reverse`],"space-y":[{"space-y":x()}],"space-y-reverse":[`space-y-reverse`],size:[{size:T()}],"inline-size":[{inline:[`auto`,...ce()]}],"min-inline-size":[{"min-inline":[`auto`,...ce()]}],"max-inline-size":[{"max-inline":[`none`,...ce()]}],"block-size":[{block:[`auto`,...le()]}],"min-block-size":[{"min-block":[`auto`,...le()]}],"max-block-size":[{"max-block":[`none`,...le()]}],w:[{w:[s,`screen`,...T()]}],"min-w":[{"min-w":[s,`screen`,`none`,...T()]}],"max-w":[{"max-w":[s,`screen`,`none`,`prose`,{screen:[o]},...T()]}],h:[{h:[`screen`,`lh`,...T()]}],"min-h":[{"min-h":[`screen`,`lh`,`none`,...T()]}],"max-h":[{"max-h":[`screen`,`lh`,`none`,...T()]}],"font-size":[{text:[`base`,n,ut,L]}],"font-smoothing":[`antialiased`,`subpixel-antialiased`],"font-style":[`italic`,`not-italic`],"font-weight":[{font:[r,gt,at]}],"font-stretch":[{"font-stretch":[`ultra-condensed`,`extra-condensed`,`condensed`,`semi-condensed`,`normal`,`semi-expanded`,`expanded`,`extra-expanded`,`ultra-expanded`,Ye,I]}],"font-family":[{font:[dt,ot,t]}],"font-features":[{"font-features":[I]}],"fvn-normal":[`normal-nums`],"fvn-ordinal":[`ordinal`],"fvn-slashed-zero":[`slashed-zero`],"fvn-figure":[`lining-nums`,`oldstyle-nums`],"fvn-spacing":[`proportional-nums`,`tabular-nums`],"fvn-fraction":[`diagonal-fractions`,`stacked-fractions`],tracking:[{tracking:[i,R,I]}],"line-clamp":[{"line-clamp":[N,`none`,R,it]}],leading:[{leading:[`none`,a,...x()]}],"list-image":[{"list-image":[`none`,R,I]}],"list-style-position":[{list:[`inside`,`outside`]}],"list-style-type":[{list:[`disc`,`decimal`,`none`,R,I]}],"text-alignment":[{text:[`left`,`center`,`right`,`justify`,`start`,`end`]}],"placeholder-color":[{placeholder:E()}],"text-color":[{text:E()}],"text-decoration":[`underline`,`overline`,`line-through`,`no-underline`],"text-decoration-style":[{decoration:[...me(),`wavy`]}],"text-decoration-thickness":[{decoration:[N,`from-font`,`auto`,R,L]}],"text-decoration-color":[{decoration:E()}],"underline-offset":[{"underline-offset":[N,`auto`,R,I]}],"text-transform":[`uppercase`,`lowercase`,`capitalize`,`normal-case`],"text-overflow":[`truncate`,`text-ellipsis`,`text-clip`],"text-wrap":[{text:[`wrap`,`nowrap`,`balance`,`pretty`]}],indent:[{indent:x()}],"tab-size":[{tab:[P,R,I]}],"vertical-align":[{align:[`baseline`,`top`,`middle`,`bottom`,`text-top`,`text-bottom`,`sub`,`super`,R,I]}],whitespace:[{whitespace:[`normal`,`nowrap`,`pre`,`pre-line`,`pre-wrap`,`break-spaces`]}],break:[{break:[`normal`,`words`,`all`,`keep`]}],wrap:[{wrap:[`break-word`,`anywhere`,`normal`]}],hyphens:[{hyphens:[`none`,`manual`,`auto`]}],content:[{content:[`none`,R,I]}],"bg-attachment":[{bg:[`fixed`,`local`,`scroll`]}],"bg-clip":[{"bg-clip":[`border`,`padding`,`content`,`text`]}],"bg-origin":[{"bg-origin":[`border`,`padding`,`content`]}],"bg-position":[{bg:ue()}],"bg-repeat":[{bg:de()}],"bg-size":[{bg:fe()}],"bg-image":[{bg:[`none`,{linear:[{to:[`t`,`tr`,`r`,`br`,`b`,`bl`,`l`,`tl`]},P,R,I],radial:[``,R,I],conic:[``,P,R,I]},mt,ct]}],"bg-color":[{bg:E()}],"gradient-from-pos":[{from:pe()}],"gradient-via-pos":[{via:pe()}],"gradient-to-pos":[{to:pe()}],"gradient-from":[{from:E()}],"gradient-via":[{via:E()}],"gradient-to":[{to:E()}],rounded:[{rounded:D()}],"rounded-s":[{"rounded-s":D()}],"rounded-e":[{"rounded-e":D()}],"rounded-t":[{"rounded-t":D()}],"rounded-r":[{"rounded-r":D()}],"rounded-b":[{"rounded-b":D()}],"rounded-l":[{"rounded-l":D()}],"rounded-ss":[{"rounded-ss":D()}],"rounded-se":[{"rounded-se":D()}],"rounded-ee":[{"rounded-ee":D()}],"rounded-es":[{"rounded-es":D()}],"rounded-tl":[{"rounded-tl":D()}],"rounded-tr":[{"rounded-tr":D()}],"rounded-br":[{"rounded-br":D()}],"rounded-bl":[{"rounded-bl":D()}],"border-w":[{border:O()}],"border-w-x":[{"border-x":O()}],"border-w-y":[{"border-y":O()}],"border-w-s":[{"border-s":O()}],"border-w-e":[{"border-e":O()}],"border-w-bs":[{"border-bs":O()}],"border-w-be":[{"border-be":O()}],"border-w-t":[{"border-t":O()}],"border-w-r":[{"border-r":O()}],"border-w-b":[{"border-b":O()}],"border-w-l":[{"border-l":O()}],"divide-x":[{"divide-x":O()}],"divide-x-reverse":[`divide-x-reverse`],"divide-y":[{"divide-y":O()}],"divide-y-reverse":[`divide-y-reverse`],"border-style":[{border:[...me(),`hidden`,`none`]}],"divide-style":[{divide:[...me(),`hidden`,`none`]}],"border-color":[{border:E()}],"border-color-x":[{"border-x":E()}],"border-color-y":[{"border-y":E()}],"border-color-s":[{"border-s":E()}],"border-color-e":[{"border-e":E()}],"border-color-bs":[{"border-bs":E()}],"border-color-be":[{"border-be":E()}],"border-color-t":[{"border-t":E()}],"border-color-r":[{"border-r":E()}],"border-color-b":[{"border-b":E()}],"border-color-l":[{"border-l":E()}],"divide-color":[{divide:E()}],"outline-style":[{outline:[...me(),`none`,`hidden`]}],"outline-offset":[{"outline-offset":[N,R,I]}],"outline-w":[{outline:[``,N,ut,L]}],"outline-color":[{outline:E()}],shadow:[{shadow:[``,`inner`,`none`,u,ht,lt]}],"shadow-color":[{shadow:E()}],"inset-shadow":[{"inset-shadow":[`none`,d,ht,lt]}],"inset-shadow-color":[{"inset-shadow":E()}],"ring-w":[{ring:O()}],"ring-w-inset":[`ring-inset`],"ring-color":[{ring:E()}],"ring-offset-w":[{"ring-offset":[N,L]}],"ring-offset-color":[{"ring-offset":E()}],"inset-ring-w":[{"inset-ring":O()}],"inset-ring-color":[{"inset-ring":E()}],"text-shadow":[{"text-shadow":[`none`,f,ht,lt]}],"text-shadow-color":[{"text-shadow":E()}],opacity:[{opacity:[N,R,I]}],"mix-blend":[{"mix-blend":[...he(),`plus-darker`,`plus-lighter`]}],"bg-blend":[{"bg-blend":he()}],"mask-clip":[{"mask-clip":[`border`,`padding`,`content`,`fill`,`stroke`,`view`]},`mask-no-clip`],"mask-composite":[{mask:[`add`,`subtract`,`intersect`,`exclude`]}],"mask-image-linear-pos":[{"mask-linear":[N]}],"mask-image-linear-from-pos":[{"mask-linear-from":k()}],"mask-image-linear-to-pos":[{"mask-linear-to":k()}],"mask-image-linear-from-color":[{"mask-linear-from":E()}],"mask-image-linear-to-color":[{"mask-linear-to":E()}],"mask-image-t-from-pos":[{"mask-t-from":k()}],"mask-image-t-to-pos":[{"mask-t-to":k()}],"mask-image-t-from-color":[{"mask-t-from":E()}],"mask-image-t-to-color":[{"mask-t-to":E()}],"mask-image-r-from-pos":[{"mask-r-from":k()}],"mask-image-r-to-pos":[{"mask-r-to":k()}],"mask-image-r-from-color":[{"mask-r-from":E()}],"mask-image-r-to-color":[{"mask-r-to":E()}],"mask-image-b-from-pos":[{"mask-b-from":k()}],"mask-image-b-to-pos":[{"mask-b-to":k()}],"mask-image-b-from-color":[{"mask-b-from":E()}],"mask-image-b-to-color":[{"mask-b-to":E()}],"mask-image-l-from-pos":[{"mask-l-from":k()}],"mask-image-l-to-pos":[{"mask-l-to":k()}],"mask-image-l-from-color":[{"mask-l-from":E()}],"mask-image-l-to-color":[{"mask-l-to":E()}],"mask-image-x-from-pos":[{"mask-x-from":k()}],"mask-image-x-to-pos":[{"mask-x-to":k()}],"mask-image-x-from-color":[{"mask-x-from":E()}],"mask-image-x-to-color":[{"mask-x-to":E()}],"mask-image-y-from-pos":[{"mask-y-from":k()}],"mask-image-y-to-pos":[{"mask-y-to":k()}],"mask-image-y-from-color":[{"mask-y-from":E()}],"mask-image-y-to-color":[{"mask-y-to":E()}],"mask-image-radial":[{"mask-radial":[R,I]}],"mask-image-radial-from-pos":[{"mask-radial-from":k()}],"mask-image-radial-to-pos":[{"mask-radial-to":k()}],"mask-image-radial-from-color":[{"mask-radial-from":E()}],"mask-image-radial-to-color":[{"mask-radial-to":E()}],"mask-image-radial-shape":[{"mask-radial":[`circle`,`ellipse`]}],"mask-image-radial-size":[{"mask-radial":[{closest:[`side`,`corner`],farthest:[`side`,`corner`]}]}],"mask-image-radial-pos":[{"mask-radial-at":b()}],"mask-image-conic-pos":[{"mask-conic":[N]}],"mask-image-conic-from-pos":[{"mask-conic-from":k()}],"mask-image-conic-to-pos":[{"mask-conic-to":k()}],"mask-image-conic-from-color":[{"mask-conic-from":E()}],"mask-image-conic-to-color":[{"mask-conic-to":E()}],"mask-mode":[{mask:[`alpha`,`luminance`,`match`]}],"mask-origin":[{"mask-origin":[`border`,`padding`,`content`,`fill`,`stroke`,`view`]}],"mask-position":[{mask:ue()}],"mask-repeat":[{mask:de()}],"mask-size":[{mask:fe()}],"mask-type":[{"mask-type":[`alpha`,`luminance`]}],"mask-image":[{mask:[`none`,R,I]}],filter:[{filter:[``,`none`,R,I]}],blur:[{blur:ge()}],brightness:[{brightness:[N,R,I]}],contrast:[{contrast:[N,R,I]}],"drop-shadow":[{"drop-shadow":[``,`none`,p,ht,lt]}],"drop-shadow-color":[{"drop-shadow":E()}],grayscale:[{grayscale:[``,N,R,I]}],"hue-rotate":[{"hue-rotate":[N,R,I]}],invert:[{invert:[``,N,R,I]}],saturate:[{saturate:[N,R,I]}],sepia:[{sepia:[``,N,R,I]}],"backdrop-filter":[{"backdrop-filter":[``,`none`,R,I]}],"backdrop-blur":[{"backdrop-blur":ge()}],"backdrop-brightness":[{"backdrop-brightness":[N,R,I]}],"backdrop-contrast":[{"backdrop-contrast":[N,R,I]}],"backdrop-grayscale":[{"backdrop-grayscale":[``,N,R,I]}],"backdrop-hue-rotate":[{"backdrop-hue-rotate":[N,R,I]}],"backdrop-invert":[{"backdrop-invert":[``,N,R,I]}],"backdrop-opacity":[{"backdrop-opacity":[N,R,I]}],"backdrop-saturate":[{"backdrop-saturate":[N,R,I]}],"backdrop-sepia":[{"backdrop-sepia":[``,N,R,I]}],"border-collapse":[{border:[`collapse`,`separate`]}],"border-spacing":[{"border-spacing":x()}],"border-spacing-x":[{"border-spacing-x":x()}],"border-spacing-y":[{"border-spacing-y":x()}],"table-layout":[{table:[`auto`,`fixed`]}],caption:[{caption:[`top`,`bottom`]}],transition:[{transition:[``,`all`,`colors`,`opacity`,`shadow`,`transform`,`none`,R,I]}],"transition-behavior":[{transition:[`normal`,`discrete`]}],duration:[{duration:[N,`initial`,R,I]}],ease:[{ease:[`linear`,`initial`,_,R,I]}],delay:[{delay:[N,R,I]}],animate:[{animate:[`none`,v,R,I]}],backface:[{backface:[`hidden`,`visible`]}],perspective:[{perspective:[h,R,I]}],"perspective-origin":[{"perspective-origin":ee()}],rotate:[{rotate:_e()}],"rotate-x":[{"rotate-x":_e()}],"rotate-y":[{"rotate-y":_e()}],"rotate-z":[{"rotate-z":_e()}],scale:[{scale:ve()}],"scale-x":[{"scale-x":ve()}],"scale-y":[{"scale-y":ve()}],"scale-z":[{"scale-z":ve()}],"scale-3d":[`scale-3d`],skew:[{skew:ye()}],"skew-x":[{"skew-x":ye()}],"skew-y":[{"skew-y":ye()}],transform:[{transform:[R,I,``,`none`,`gpu`,`cpu`]}],"transform-origin":[{origin:ee()}],"transform-style":[{transform:[`3d`,`flat`]}],translate:[{translate:A()}],"translate-x":[{"translate-x":A()}],"translate-y":[{"translate-y":A()}],"translate-z":[{"translate-z":A()}],"translate-none":[`translate-none`],zoom:[{zoom:[P,R,I]}],accent:[{accent:E()}],appearance:[{appearance:[`none`,`auto`]}],"caret-color":[{caret:E()}],"color-scheme":[{scheme:[`normal`,`dark`,`light`,`light-dark`,`only-dark`,`only-light`]}],cursor:[{cursor:[`auto`,`default`,`pointer`,`wait`,`text`,`move`,`help`,`not-allowed`,`none`,`context-menu`,`progress`,`cell`,`crosshair`,`vertical-text`,`alias`,`copy`,`no-drop`,`grab`,`grabbing`,`all-scroll`,`col-resize`,`row-resize`,`n-resize`,`e-resize`,`s-resize`,`w-resize`,`ne-resize`,`nw-resize`,`se-resize`,`sw-resize`,`ew-resize`,`ns-resize`,`nesw-resize`,`nwse-resize`,`zoom-in`,`zoom-out`,R,I]}],"field-sizing":[{"field-sizing":[`fixed`,`content`]}],"pointer-events":[{"pointer-events":[`auto`,`none`]}],resize:[{resize:[`none`,``,`y`,`x`]}],"scroll-behavior":[{scroll:[`auto`,`smooth`]}],"scrollbar-thumb-color":[{"scrollbar-thumb":E()}],"scrollbar-track-color":[{"scrollbar-track":E()}],"scrollbar-gutter":[{"scrollbar-gutter":[`auto`,`stable`,`both`]}],"scrollbar-w":[{scrollbar:[`auto`,`thin`,`none`]}],"scroll-m":[{"scroll-m":x()}],"scroll-mx":[{"scroll-mx":x()}],"scroll-my":[{"scroll-my":x()}],"scroll-ms":[{"scroll-ms":x()}],"scroll-me":[{"scroll-me":x()}],"scroll-mbs":[{"scroll-mbs":x()}],"scroll-mbe":[{"scroll-mbe":x()}],"scroll-mt":[{"scroll-mt":x()}],"scroll-mr":[{"scroll-mr":x()}],"scroll-mb":[{"scroll-mb":x()}],"scroll-ml":[{"scroll-ml":x()}],"scroll-p":[{"scroll-p":x()}],"scroll-px":[{"scroll-px":x()}],"scroll-py":[{"scroll-py":x()}],"scroll-ps":[{"scroll-ps":x()}],"scroll-pe":[{"scroll-pe":x()}],"scroll-pbs":[{"scroll-pbs":x()}],"scroll-pbe":[{"scroll-pbe":x()}],"scroll-pt":[{"scroll-pt":x()}],"scroll-pr":[{"scroll-pr":x()}],"scroll-pb":[{"scroll-pb":x()}],"scroll-pl":[{"scroll-pl":x()}],"snap-align":[{snap:[`start`,`end`,`center`,`align-none`]}],"snap-stop":[{snap:[`normal`,`always`]}],"snap-type":[{snap:[`none`,`x`,`y`,`both`]}],"snap-strictness":[{snap:[`mandatory`,`proximity`]}],touch:[{touch:[`auto`,`none`,`manipulation`]}],"touch-x":[{"touch-pan":[`x`,`left`,`right`]}],"touch-y":[{"touch-pan":[`y`,`up`,`down`]}],"touch-pz":[`touch-pinch-zoom`],select:[{select:[`none`,`text`,`all`,`auto`]}],"will-change":[{"will-change":[`auto`,`scroll`,`contents`,`transform`,R,I]}],fill:[{fill:[`none`,...E()]}],"stroke-w":[{stroke:[N,ut,L,it]}],stroke:[{stroke:[`none`,...E()]}],"forced-color-adjust":[{"forced-color-adjust":[`auto`,`none`]}]},conflictingClassGroups:{"container-named":[`container-type`],overflow:[`overflow-x`,`overflow-y`],overscroll:[`overscroll-x`,`overscroll-y`],inset:[`inset-x`,`inset-y`,`inset-bs`,`inset-be`,`start`,`end`,`top`,`right`,`bottom`,`left`],"inset-x":[`start`,`end`,`right`,`left`],"inset-y":[`inset-bs`,`inset-be`,`top`,`bottom`],flex:[`basis`,`grow`,`shrink`],gap:[`gap-x`,`gap-y`],p:[`px`,`py`,`ps`,`pe`,`pbs`,`pbe`,`pt`,`pr`,`pb`,`pl`],px:[`ps`,`pe`,`pr`,`pl`],py:[`pbs`,`pbe`,`pt`,`pb`],m:[`mx`,`my`,`ms`,`me`,`mbs`,`mbe`,`mt`,`mr`,`mb`,`ml`],mx:[`ms`,`me`,`mr`,`ml`],my:[`mbs`,`mbe`,`mt`,`mb`],size:[`w`,`h`],"font-size":[`leading`],"fvn-normal":[`fvn-ordinal`,`fvn-slashed-zero`,`fvn-figure`,`fvn-spacing`,`fvn-fraction`],"fvn-ordinal":[`fvn-normal`],"fvn-slashed-zero":[`fvn-normal`],"fvn-figure":[`fvn-normal`],"fvn-spacing":[`fvn-normal`],"fvn-fraction":[`fvn-normal`],"line-clamp":[`display`,`overflow`],rounded:[`rounded-s`,`rounded-e`,`rounded-t`,`rounded-r`,`rounded-b`,`rounded-l`,`rounded-ss`,`rounded-se`,`rounded-ee`,`rounded-es`,`rounded-tl`,`rounded-tr`,`rounded-br`,`rounded-bl`],"rounded-s":[`rounded-ss`,`rounded-es`],"rounded-e":[`rounded-se`,`rounded-ee`],"rounded-t":[`rounded-tl`,`rounded-tr`],"rounded-r":[`rounded-tr`,`rounded-br`],"rounded-b":[`rounded-br`,`rounded-bl`],"rounded-l":[`rounded-tl`,`rounded-bl`],"border-spacing":[`border-spacing-x`,`border-spacing-y`],"border-w":[`border-w-x`,`border-w-y`,`border-w-s`,`border-w-e`,`border-w-bs`,`border-w-be`,`border-w-t`,`border-w-r`,`border-w-b`,`border-w-l`],"border-w-x":[`border-w-s`,`border-w-e`,`border-w-r`,`border-w-l`],"border-w-y":[`border-w-bs`,`border-w-be`,`border-w-t`,`border-w-b`],"border-color":[`border-color-x`,`border-color-y`,`border-color-s`,`border-color-e`,`border-color-bs`,`border-color-be`,`border-color-t`,`border-color-r`,`border-color-b`,`border-color-l`],"border-color-x":[`border-color-s`,`border-color-e`,`border-color-r`,`border-color-l`],"border-color-y":[`border-color-bs`,`border-color-be`,`border-color-t`,`border-color-b`],translate:[`translate-x`,`translate-y`,`translate-none`],"translate-none":[`translate`,`translate-x`,`translate-y`,`translate-z`],"scroll-m":[`scroll-mx`,`scroll-my`,`scroll-ms`,`scroll-me`,`scroll-mbs`,`scroll-mbe`,`scroll-mt`,`scroll-mr`,`scroll-mb`,`scroll-ml`],"scroll-mx":[`scroll-ms`,`scroll-me`,`scroll-mr`,`scroll-ml`],"scroll-my":[`scroll-mbs`,`scroll-mbe`,`scroll-mt`,`scroll-mb`],"scroll-p":[`scroll-px`,`scroll-py`,`scroll-ps`,`scroll-pe`,`scroll-pbs`,`scroll-pbe`,`scroll-pt`,`scroll-pr`,`scroll-pb`,`scroll-pl`],"scroll-px":[`scroll-ps`,`scroll-pe`,`scroll-pr`,`scroll-pl`],"scroll-py":[`scroll-pbs`,`scroll-pbe`,`scroll-pt`,`scroll-pb`],touch:[`touch-x`,`touch-y`,`touch-pz`],"touch-x":[`touch`],"touch-y":[`touch`],"touch-pz":[`touch`]},conflictingClassGroupModifiers:{"font-size":[`leading`]},postfixLookupClassGroups:[`container-type`],orderSensitiveModifiers:[`*`,`**`,`after`,`backdrop`,`before`,`details-content`,`file`,`first-letter`,`first-line`,`marker`,`placeholder`,`selection`]}});function Et(...e){return Tt(de(e))}function Dt(e){delete e.dataset.prerendered}function Ot({delay:e=0,...t}){return(0,C.jsx)(le,{"data-slot":`tooltip-provider`,delay:e,...t})}var kt=e=>e?.replace(/([a-z0-9])([A-Z])/g,`$1-$2`).toLowerCase();function At(e,t,n=[]){if(t==null)throw Error(`[lucide]: iconNode is required when icon name is used`);return{name:kt(e),size:24,node:t,...n.length>0?{aliases:n}:{}}}var jt=e=>{let t=``,n=!1;for(let r of e){if(r===`-`||r===`_`||r<=` `){n=t.length>0;continue}t.length===0?t+=r.toLowerCase():t+=n?r.toUpperCase():r,n=!1}return t},Mt=e=>{let t=jt(e);return t.charAt(0).toUpperCase()+t.slice(1)},Nt=(...e)=>e.filter((e,t,n)=>!!e&&e.trim()!==``&&n.indexOf(e)===t).join(` `).trim(),V={xmlns:`http://www.w3.org/2000/svg`,width:24,height:24,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,"stroke-width":2,"stroke-linecap":`round`,"stroke-linejoin":`round`};function Pt(e){return e!=null}function Ft(e,t={}){let n=t.attributeNames??{},r=e=>n[e]??e,i=e.size??e.width??V.width,a=e.size??e.height??V.height,o=e.aliases?.filter(e=>typeof e==`string`&&e.trim()!==``).map(e=>`lucide-${e}`)??[],s=[...e.name?[`lucide-${e.name}`]:[],...o],c=t.className?.split(` `).filter(Boolean)??[],l=t.includeDefaultClasses===!1?Nt(...c):Nt(`lucide`,...s,...c),u=t.absoluteStrokeWidth?Number(t.strokeWidth??V[`stroke-width`])*Number(e.size??e.width??V.width)/Number(t.size??t.width??V.width):t.strokeWidth??V[`stroke-width`];return[`svg`,{...Object.entries(V).reduce((e,[t,n])=>(e[r(t)]=n,e),{}),...`color`in t&&t.color&&{[r(`stroke`)]:t.color},...`size`in t&&Pt(t.size)&&{[r(`width`)]:t.size,[r(`height`)]:t.size},...`width`in t&&Pt(t.width)&&{[r(`width`)]:t.width},...`height`in t&&Pt(t.height)&&{[r(`height`)]:t.height},[r(`stroke-width`)]:u,...l&&{[r(`class`)]:l},[r(`viewBox`)]:`0 0 ${i} ${a}`,...t.hasA11yProp===!1?{[r(`aria-hidden`)]:`true`}:{},...`attributes`in t&&t.attributes},e.node.map(e=>{let[n,i,a]=e,o=t.nonScalingStroke?{[r(`vector-effect`)]:`non-scaling-stroke`,...i}:i;return a?[n,o,a]:[n,o]})]}function It(e,t={}){return Ft(e,{...t,attributeNames:{...t.attributeNames,class:`className`,"stroke-width":`strokeWidth`,"stroke-linecap":`strokeLinecap`,"stroke-linejoin":`strokeLinejoin`,"vector-effect":`vectorEffect`}})}var Lt=e=>{for(let t in e)if(t.startsWith(`aria-`)||t===`role`||t===`title`)return!0;return!1},Rt=(0,y.createContext)({}),zt=()=>(0,y.useContext)(Rt),Bt=(0,y.forwardRef)(({color:e,size:t,width:n,height:r,strokeWidth:i,absoluteStrokeWidth:a,nonScalingStroke:o,className:s=``,children:c,iconNode:l=[],icon:u={node:l,aliases:[],size:24},...d},f)=>{let{size:p=24,strokeWidth:m=2,absoluteStrokeWidth:h=!1,nonScalingStroke:g=!1,color:_=`currentColor`,className:v=``}=zt()??{},b=!!c||Lt(d),[ee,te,ne=[]]=It(u,{color:e??_,width:n??t??p,height:r??t??p,strokeWidth:i??m,absoluteStrokeWidth:a??h,nonScalingStroke:o??g,className:Nt(v,s),hasA11yProp:b,attributes:d});return(0,y.createElement)(ee,{ref:f,...te},[...ne.map(([e,t])=>(0,y.createElement)(e,t)),...Array.isArray(c)?c:[c]])});function H(e,t=[],n=[]){let r=typeof e==`string`?At(e,t,n):e,i=(0,y.forwardRef)(({className:e,...t},n)=>(0,y.createElement)(Bt,{ref:n,icon:r,className:e,...t}));return r.name&&(i.displayName=Mt(r.name)),i}var Vt={name:`arrow-right`,size:24,node:[[`path`,{d:`M5 12h14`,key:`1ays0h`}],[`path`,{d:`m12 5 7 7-7 7`,key:`xquz4c`}]]};Vt.node;var Ht=H(Vt),Ut={name:`check`,size:24,node:[[`path`,{d:`M20 6 9 17l-5-5`,key:`1gmf2c`}]]};Ut.node;var Wt=H(Ut),Gt={name:`chevron-left`,size:24,node:[[`path`,{d:`m15 18-6-6 6-6`,key:`1wnfg3`}]]};Gt.node;var Kt=H(Gt),qt={name:`chevron-right`,size:24,node:[[`path`,{d:`m9 18 6-6-6-6`,key:`mthhwq`}]]};qt.node;var Jt=H(qt),Yt={name:`copy`,size:24,node:[[`rect`,{width:`14`,height:`14`,x:`8`,y:`8`,rx:`2`,ry:`2`,key:`17jyea`}],[`path`,{d:`M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2`,key:`zix9uf`}]]};Yt.node;var Xt=H(Yt),Zt={name:`link`,size:24,node:[[`path`,{d:`M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71`,key:`1cjeqo`}],[`path`,{d:`M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71`,key:`19qd67`}]]};Zt.node;var Qt=H(Zt),$t={name:`loader-circle`,size:24,node:[[`path`,{d:`M21 12a9 9 0 1 1-6.219-8.56`,key:`13zald`}]],aliases:[`loader-2`]};$t.node;var en=H($t),tn={name:`menu`,size:24,node:[[`path`,{d:`M4 5h16`,key:`1tepv9`}],[`path`,{d:`M4 12h16`,key:`1lakjw`}],[`path`,{d:`M4 19h16`,key:`1djgab`}]]};tn.node;var nn=H(tn),rn={name:`moon`,size:24,node:[[`path`,{d:`M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401`,key:`kfwtm`}]]};rn.node;var an=H(rn),on={name:`search`,size:24,node:[[`path`,{d:`m21 21-4.34-4.34`,key:`14j7rj`}],[`circle`,{cx:`11`,cy:`11`,r:`8`,key:`4ej97u`}]]};on.node;var sn=H(on),cn={name:`sun`,size:24,node:[[`circle`,{cx:`12`,cy:`12`,r:`4`,key:`4exip2`}],[`path`,{d:`M12 2v2`,key:`tus03m`}],[`path`,{d:`M12 20v2`,key:`1lh1kg`}],[`path`,{d:`m4.93 4.93 1.41 1.41`,key:`149t6j`}],[`path`,{d:`m17.66 17.66 1.41 1.41`,key:`ptbguv`}],[`path`,{d:`M2 12h2`,key:`1t8f8n`}],[`path`,{d:`M20 12h2`,key:`1q8mjw`}],[`path`,{d:`m6.34 17.66-1.41 1.41`,key:`1m8zz5`}],[`path`,{d:`m19.07 4.93-1.41 1.41`,key:`1shlcs`}]]};cn.node;var ln=H(cn),un=H(`Github`,[[`path`,{d:`M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4`,key:`tonef`}],[`path`,{d:`M9 18c-4.51 2-5-2-7-2`,key:`9comsn`}]]),dn=`/pastoralist`,fn=dn.endsWith(`/`)?dn:dn+`/`;function pn(){return(0,C.jsxs)(`footer`,{className:`w-full px-4 sm:px-6 md:px-10 xl:px-28 py-6 sm:py-7 border-t border-base-content/10 flex flex-col gap-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center`,children:[(0,C.jsx)(`div`,{className:`flex items-center justify-center sm:justify-start gap-2 order-3 sm:order-1`,children:(0,C.jsxs)(`p`,{className:`text-sm sm:text-base text-center sm:text-left`,children:[`Copyright © `,new Date().getFullYear(),` - All rights reserved`]})}),(0,C.jsx)(`div`,{className:`flex items-center justify-center gap-2 order-1 sm:order-2`,children:(0,C.jsx)(s,{to:`/`,className:`hover:opacity-80 transition-opacity`,children:(0,C.jsx)(`img`,{src:`${fn}pastoralist-logo.svg`,alt:`Pastoralist Logo`,className:`h-12 w-12`})})}),(0,C.jsx)(mn,{})]})}function mn(){return(0,C.jsx)(`nav`,{className:`flex justify-center sm:justify-end order-2 sm:order-3`,children:(0,C.jsx)(`div`,{className:`grid grid-flow-col gap-4`,children:(0,C.jsx)(`a`,{className:`btn btn-ghost btn-circle flex items-center justify-center`,href:`https://github.com/yowainwright/pastoralist`,"aria-label":`GitHub`,target:`_blank`,rel:`noopener noreferrer`,children:(0,C.jsx)(un,{className:`h-5 w-5`})})})})}var hn=new Map,gn=new WeakMap,_n=0,vn;function yn(e){return e?gn.has(e)?gn.get(e):(_n+=1,gn.set(e,_n.toString()),gn.get(e)):`0`}function bn(e){return Object.keys(e).sort().filter(t=>e[t]!==void 0).map(t=>`${t}_${t===`root`?yn(e.root):e[t]}`).toString()}function xn(e){let t=bn(e),n=hn.get(t);if(!n){let r=new Map,i,a=new IntersectionObserver(t=>{t.forEach(t=>{let n=t.isIntersecting&&i.some(e=>t.intersectionRatio>=e);e.trackVisibility&&t.isVisible===void 0&&(t.isVisible=n),[...r.get(t.target)??[]].forEach(e=>{e(n,t)})})},e);i=a.thresholds||(Array.isArray(e.threshold)?e.threshold:[e.threshold||0]),n={id:t,observer:a,elements:r},hn.set(t,n)}return n}function Sn(e,t,n={},r=vn){if(window.IntersectionObserver===void 0&&r!==void 0){let i=e.getBoundingClientRect();return t(r,{isIntersecting:r,target:e,intersectionRatio:typeof n.threshold==`number`?n.threshold:0,time:0,boundingClientRect:i,intersectionRect:i,rootBounds:i}),()=>{}}let{id:i,observer:a,elements:o}=xn(n),s=o.get(e)||[];o.has(e)||o.set(e,s),s.push(t),a.observe(e);let c=!1;return function(){c||(c=!0,s.splice(s.indexOf(t),1),s.length===0&&(o.delete(e),a.unobserve(e)),o.size===0&&(a.disconnect(),hn.delete(i)))}}y.Component;var Cn=Reflect.get(y,`useInsertionEffect`),wn=Cn??y.useEffect;function Tn(e){return e?.startsWith(`19.`)||!1}var En=Tn(`19.3.0`);function Dn(e,{threshold:t,root:n,rootMargin:r,scrollMargin:i,trackVisibility:a,delay:o,fallbackInView:s,skip:c,triggerOnce:l}){let u=y.useRef(e),d=y.useRef({node:null,stop:void 0,owner:null});return Cn||(u.current=e),wn(()=>{u.current=e},[e]),y.useCallback(function e(f){let p=d.current;if(!f&&p.owner!==e)return;if(f===p.node)return p.owner=e,En?p.stop:void 0;let m=p.stop;if(p.stop=void 0,m?.(),!f||c){p.node=null,p.owner=f?e:null;return}p.node=f,p.owner=e;let h,g;function _(){h?.(),p.stop===_&&(p.node=null,p.stop=void 0)}return p.stop=_,h=Sn(f,(e,t)=>{u.current(e,t,g),g=e,l&&e&&_()},{threshold:t,root:n,rootMargin:r,scrollMargin:i,trackVisibility:a,delay:o},s),p.stop!==_&&h(),En?p.stop:void 0},[Array.isArray(t)?t.toString():t,n,r,i,a,o,s,c,l])}var On=typeof window>`u`?y.useEffect:y.useLayoutEffect;function kn({threshold:e,delay:t,trackVisibility:n,rootMargin:r,scrollMargin:i,root:a,triggerOnce:o,skip:s,initialInView:c,fallbackInView:l,onChange:u}={}){let d=y.useRef(c),[f,p]=y.useState({inView:!!c,entry:void 0}),m=Dn((e,t)=>{let n=d.current;d.current=e,(n!==void 0||e)&&(p({inView:e,entry:t}),u?.(e,t))},{threshold:e,root:a,rootMargin:r,scrollMargin:i,trackVisibility:n,delay:t,fallbackInView:l,skip:s,triggerOnce:o}),h=y.useRef({node:null,reset:!1}),g=y.useCallback(function(e){e?(h.current.node=e,h.current.reset=!1):h.current.node&&(h.current.node=null,h.current.reset=!0);let t=m(e);if(t)return()=>{t(),h.current.node===e&&(h.current.node=null,h.current.reset=!0)}},[m]);On(()=>{h.current.reset&&(h.current.reset=!1,!(o||s)&&(p({inView:!!c,entry:void 0}),d.current=c))});let _=[g,f.inView,f.entry];return _.ref=_[0],_.inView=_[1],_.entry=_[2],_}var An=()=>()=>void 0,jn=()=>!0,Mn=()=>!1;function Nn(e={}){let{threshold:t=.1,triggerOnce:n=!0,initialInView:r,onChange:i}=e,a=Pn(),{ref:o,inView:s}=kn({threshold:t,triggerOnce:n,onChange:i,initialInView:r??!a});return{ref:o,isVisible:s}}function Pn(){return(0,y.useSyncExternalStore)(An,jn,Mn)}function Fn(e){return e===`lofi`?`night`:`lofi`}function In(){if(typeof window>`u`)return`lofi`;let e=localStorage.getItem(`theme`);return e===`lofi`||e===`night`?e:window.matchMedia(`(prefers-color-scheme: dark)`).matches?`night`:`lofi`}function Ln(){let e=Pn(),[t,n]=(0,y.useState)(In);return(0,y.useEffect)(()=>{document.documentElement.setAttribute(`data-theme`,t),localStorage.setItem(`theme`,t)},[t]),{theme:e?t:`lofi`,setTheme:n,toggle:()=>n(Fn)}}var Rn=`---
title: Advanced Features
description: Advanced cleanup, patch tracking, and override management workflows
---

## Nested Overrides (Transitive Dependencies)

Pastoralist supports npm's nested override syntax for transitive dependencies.

### How It Works

When you need to override a transitive dependency, you can use nested overrides:

\`\`\`json
{
  "dependencies": {
    "pg": "^8.13.1"
  },
  "overrides": {
    "pg": {
      "pg-types": "^4.0.1"
    }
  }
}
\`\`\`

This tells npm to use \`pg-types@^4.0.1\` whenever \`pg\` requests \`pg-types\`,
regardless of the version range declared by \`pg\`.

### Multiple Nested Overrides

You can override multiple transitive dependencies:

\`\`\`json
{
  "overrides": {
    "pg": {
      "pg-types": "^4.0.1",
      "pg-protocol": "^1.6.0"
    },
    "express": {
      "cookie": "0.5.0"
    }
  }
}
\`\`\`

### Tracking in Appendix

Nested overrides are tracked with a special notation in the appendix. Each entry
still gets a \`ledger\` recording when it was added:

\`\`\`json
{
  "pastoralist": {
    "appendix": {
      "pg-types@^4.0.1": {
        "dependents": {
          "my-app": "pg@^8.13.1 (nested override)"
        },
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "source": "manual"
        }
      },
      "cookie@0.5.0": {
        "dependents": {
          "my-app": "express@^4.18.0 (nested override)"
        },
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "source": "manual"
        }
      }
    }
  }
}
\`\`\`

### Workspace Support

In monorepos, nested overrides in workspace packages are also tracked. For
example, \`packages/app/package.json\` might contain:

\`\`\`json
{
  "overrides": {
    "pg": {
      "pg-types": "^4.0.1"
    }
  }
}
\`\`\`

With \`--depPaths\`, Pastoralist tracks these nested overrides across workspace
packages.

## Patch Support

Pastoralist detects and tracks patches created by tools such as \`patch-package\`.

### How It Works

When you have patches in your \`patches/\` directory:

\`\`\`
patches/
├── lodash+4.17.21.patch
├── express+4.18.0.patch
└── react+18.2.0.patch
\`\`\`

Pastoralist tracks them in the appendix:

\`\`\`json
{
  "pastoralist": {
    "appendix": {
      "lodash@4.17.21": {
        "dependents": {
          "my-app": "lodash@^4.17.0"
        },
        "patches": ["patches/lodash+4.17.21.patch"],
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "source": "manual"
        }
      }
    }
  }
}
\`\`\`

### Unused Patch Detection

When a dependency is removed, Pastoralist alerts you:

\`\`\`
🐑 Found 2 potentially unused patch files:
  - patches/old-package+1.0.0.patch
  - patches/removed-dep+2.0.0.patch
Consider removing these patches if the packages are no longer used.
\`\`\`

<a
  href="https://stackblitz.com/github/yowainwright/pastoralist/tree/main/tests/sandboxes/patches?title=Pastoralist%20Patches&file=README.md&startScript=demo&view=editor"
  target="_blank"
  rel="noopener noreferrer"
>
  <img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz" />
</a>

## PeerDependencies Support

Pastoralist considers \`peerDependencies\` when tracking override usage.

### Example

\`\`\`json
{
  "peerDependencies": {
    "react": "^17.0.0 || ^18.0.0"
  },
  "overrides": {
    "react": "18.2.0"
  }
}
\`\`\`

The appendix will reflect peer dependency requirements:

\`\`\`json
{
  "pastoralist": {
    "appendix": {
      "react@18.2.0": {
        "dependents": {
          "my-component": "react@^17.0.0 || ^18.0.0"
        },
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "source": "manual"
        }
      }
    }
  }
}
\`\`\`

## Smart Cleanup

Pastoralist identifies overrides that are no longer needed and can remove them
when you explicitly opt in.

### Removal with \`--remove-unused\`

When a dependency is updated and no longer needs an override:

**Before:**

\`\`\`json
{
  "dependencies": {
    "lodash": "^4.17.0"
  },
  "overrides": {
    "lodash": "4.17.21"
  }
}
\`\`\`

**After updating lodash to 4.17.21 and running \`pastoralist --remove-unused\`:**

\`\`\`json
{
  "dependencies": {
    "lodash": "^4.17.21"
  },
  "overrides": {}
}
\`\`\`

<a
  href="https://stackblitz.com/github/yowainwright/pastoralist/tree/main/tests/sandboxes/cleanup?title=Pastoralist%20Cleanup&file=README.md&startScript=demo&view=editor"
  target="_blank"
  rel="noopener noreferrer"
>
  <img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz" />
</a>

### Unused Override Detection

When an override exists but no package in your project depends on it,
Pastoralist labels it as \`(unused override)\` in the appendix:

\`\`\`json
{
  "pastoralist": {
    "appendix": {
      "stale-pkg@1.0.0": {
        "dependents": {
          "root": "stale-pkg (unused override)"
        }
      }
    }
  }
}
\`\`\`

Pastoralist displays a notice when unused overrides are detected:

\`\`\`
|  1 unused override detected. Run with --remove-unused to clean up.  |
\`\`\`

To remove them, run with the \`--remove-unused\` flag:

\`\`\`bash
pastoralist --remove-unused
\`\`\`

This removes both the override from \`overrides\` and its entry from the appendix.

### Protecting Overrides from Removal

Set \`keep: true\` on a ledger entry to prevent \`--remove-unused\` from removing
it:

\`\`\`json
{
  "lodash@4.17.21": {
    "ledger": {
      "addedDate": "2026-05-30T00:00:00.000Z",
      "keep": true
    }
  }
}
\`\`\`

For time- or version-bounded protection, use a \`KeepConstraint\`:

\`\`\`json
{
  "lodash@4.17.21": {
    "ledger": {
      "addedDate": "2026-05-30T00:00:00.000Z",
      "keep": {
        "reason": "Waiting for upstream patch",
        "untilVersion": "4.18.0",
        "until": "2027-06-01"
      }
    }
  }
}
\`\`\`

Once the condition is met, \`--remove-unused\` can treat the override as removable
again.

### Transitive Dependency Tracking

Pastoralist tracks overrides needed by transitive dependencies:

\`\`\`json
{
  "pastoralist": {
    "appendix": {
      "minimist@1.2.8": {
        "dependents": {
          "mkdirp": "minimist@^1.2.6",
          "optimist": "minimist@~1.2.0"
        }
      }
    }
  }
}
\`\`\`

## Fuzzy Version Matching

Pastoralist uses version-range matching to determine if overrides are needed.

### How It Works

Given these dependencies:

\`\`\`json
{
  "dependencies": {
    "express": "^4.18.0"
  }
}
\`\`\`

And this override:

\`\`\`json
{
  "overrides": {
    "express": "4.18.2"
  }
}
\`\`\`

Pastoralist understands that \`^4.18.0\` can resolve to \`4.18.2\` without an
override. Unless the override fixes a specific issue, it may be removable.

## Appendix Cleanup

Pastoralist keeps appendix entries while an override is still tracked. When you
run with \`--remove-unused\`, it removes both the override and the matching
appendix entry.

### Example Scenario

1. **Initial state**: Override with appendix
2. **Dependency removed**: Pastoralist reports the override as unused
3. **Cleanup run**: \`--remove-unused\` removes the override and appendix entry

Use ledger \`reason\` and \`keep\` fields for override decisions that should stay
reviewable until a specific cleanup condition is met.

## Multi-Format Support

Pastoralist reads the override field your package manager already uses:

- **npm and Bun**: \`overrides\`
- **pnpm**: \`pnpm.overrides\`
- **Yarn**: \`resolutions\`

When it writes changes, it preserves the existing override field when one is
present. If a security fix creates the first override field in a project,
Pastoralist chooses the field that matches the detected package manager.

### Format Example

Yarn resolutions:

\`\`\`json
{
  "resolutions": {
    "package-a": "1.0.0",
    "**/package-b": "2.0.0"
  }
}
\`\`\`

The equivalent npm or Bun override shape:

\`\`\`json
{
  "overrides": {
    "package-a": "1.0.0",
    "package-b": "2.0.0"
  }
}
\`\`\`

## Debug Mode Insights

Debug mode (\`--debug\`) provides detailed information:

\`\`\`
🐑 pastoralist checking herd...
[DEBUG] Reading package.json from /path/to/package.json
[DEBUG] Found 3 overrides
[DEBUG] Analyzing dependency tree...
[DEBUG] lodash@4.17.21 required by:
  - express@4.18.0 (wants lodash@^4.17.0)
  - custom-utils@1.0.0 (wants lodash@~4.17.0)
[DEBUG] Writing updated package.json
✅ pastoralist the herd is safe!
\`\`\`

## Integration with Other Tools

### patch-package

Pastoralist complements \`patch-package\` by tracking which overrides have
associated patches:

\`\`\`bash
# Apply a patch
npx patch-package lodash

# Run Pastoralist to update tracking
npx pastoralist
\`\`\`

### npm-check-updates

Use with \`npm-check-updates\` to manage both regular updates and overrides:

\`\`\`bash
# Update dependencies
npx npm-check-updates -u

# Update override tracking
npx pastoralist
\`\`\`

### Renovate/Dependabot

Configure automated tools to run Pastoralist after updates:

\`\`\`json
{
  "postUpgradeTasks": {
    "commands": ["npm install", "npx pastoralist"],
    "fileFilters": ["package.json"]
  }
}
\`\`\`

## Custom Workflows

### Override Policies

Create policies for when overrides should be used:

\`\`\`javascript
// scripts/check-override-policy.js
const pkg = require("./package.json");

const policies = {
  security: ["minimist", "lodash"], // Require review before keeping security overrides
  compatibility: ["react"], // Track compatibility overrides
  temporary: ["experimental-pkg"], // Review temporary overrides regularly
};

// Validate overrides match policies
Object.keys(pkg.overrides || {}).forEach((override) => {
  const category = Object.entries(policies).find(([_, pkgs]) => pkgs.includes(override))?.[0];

  if (!category) {
    console.warn(\`Override '\${override}' has no policy!\`);
  }
});
\`\`\`

### Appendix Analysis

Extract insights from the appendix:

\`\`\`javascript
const pkg = require("./package.json");
const appendix = pkg.pastoralist?.appendix || {};

// Find overrides with most dependents
const overrideImpact = Object.entries(appendix)
  .map(([override, info]) => ({
    override,
    dependentCount: Object.keys(info.dependents || {}).length,
  }))
  .sort((a, b) => b.dependentCount - a.dependentCount);

console.log("Highest impact overrides:", overrideImpact.slice(0, 5));
\`\`\`

## Best Practices

1. **Regular Updates**: Run Pastoralist on install, scheduled CI, or dependency-update PRs
2. **Review Patches**: Check for upstream fixes when dependencies update
`,zn=`---
title: API Reference
description: Complete reference for pastoralist CLI and Node.js API
---

Pastoralist provides a CLI and a Node.js API.

:::tip[Configuration Files]
Most CLI options can be stored in config files. See [Configuration](/docs/configuration) for \`.pastoralistrc\`, \`pastoralist.config.js\`, and \`package.json\` settings.
:::

{/* public CLI commands and options from src/cli/parser/constants.ts and src/cli/index.ts */}

## CLI

CLI commands and options have their own headings so each entry can be linked
directly.

### \`pastoralist\`

Run Pastoralist on the current directory's \`package.json\`.

\`\`\`bash
npx pastoralist
\`\`\`

### \`--help\` and \`--version\`

Print CLI help or the installed package version.

\`\`\`bash
npx pastoralist --help
npx pastoralist --version # -v
\`\`\`

### \`pastoralist doctor\`

Run a read-only setup and override health check. This command enables dry-run
summary mode and does not modify \`package.json\`.

\`\`\`bash
npx pastoralist doctor
\`\`\`

### \`pastoralist onboard\`

Print a first-run onboarding checklist with initial local usage, agent setup,
and GitHub Action setup.

\`\`\`bash
npx pastoralist onboard
\`\`\`

Aliases: \`pastoralist onboarding\`, \`pastoralist --onboard\`.

### \`pastoralist --path <path>\`

> Type: **\`string\`**
> Default: \`"package.json"\`

Run Pastoralist on a specific \`package.json\` file.

\`\`\`bash
npx pastoralist --path packages/app/package.json # -p packages/app/package.json
\`\`\`

### \`pastoralist --depPaths [paths...]\`

> Type: **\`string[]\`**
> Default: unset

Read dependency data from multiple \`package.json\` files using glob patterns.

\`\`\`bash
npx pastoralist --depPaths "packages/*/package.json" # -d "packages/*/package.json"
\`\`\`

### \`pastoralist --ignore [patterns...]\`

> Type: **\`string[]\`**
> Default: \`[]\`

Exclude files matching glob patterns.

\`\`\`bash
npx pastoralist --ignore "**/node_modules/**"
\`\`\`

### \`pastoralist --root <root>\`

> Type: **\`string\`**
> Default: derived from \`--path\` or the current working directory

Set the root directory for all operations.

\`\`\`bash
npx pastoralist --root ../my-project # -r ../my-project
\`\`\`

### \`pastoralist init\`

Initialize configuration with the guided setup. The wizard can configure
workspace paths, security scanning, and where the configuration should be saved.

\`\`\`bash
npx pastoralist init
\`\`\`

Aliases: \`pastoralist init config\`, \`pastoralist --init config\`.

When run, this will:

- Detect \`workspaces\` entries from \`package.json\`
- Prompt for \`depPaths: "workspace"\` or custom package globs
- Offer security provider and severity threshold setup
- Save configuration to \`package.json\` or a supported config file

### \`pastoralist --init agent-skill\`

Install the bundled Pastoralist agent skill into \`.agents/skills/pastoralist\`.

\`\`\`bash
npx pastoralist init agent-skill
\`\`\`

Alias: \`pastoralist --init agent-skill\`.

### \`pastoralist --interactive\`

Review security fixes interactively. Use this with \`--checkSecurity\` when you
want to approve fixes instead of applying everything with \`--forceSecurityRefactor\`.

\`\`\`bash
npx pastoralist --checkSecurity --interactive
\`\`\`

### \`pastoralist --debug\`

Enable detailed debug output.

\`\`\`bash
npx pastoralist --debug
\`\`\`

### \`pastoralist --dry-run\`

Preview changes without modifying \`package.json\`.

\`\`\`bash
npx pastoralist --dry-run
\`\`\`

### \`pastoralist --outputFormat json\`

Return machine-readable output for CI or custom tooling.

\`\`\`bash
npx pastoralist --summary --outputFormat json
\`\`\`

JSON output is a single result object.

\`\`\`jsonc
{
  "success": true,
  "hasSecurityIssues": false,
  "hasUnusedOverrides": true,
  "updated": false,
  "securityAlertCount": 0,
  "unusedOverrideCount": 1,
  "overrideCount": 2,
  "errors": [],
  "securityAlerts": [],
  "unusedOverrides": ["left-pad@1.3.0"],
  "appliedOverrides": {
    "left-pad": "1.3.0",
  },
  "metrics": {
    "packagesScanned": 1,
    "workspacePackagesScanned": 0,
    "appendixEntriesUpdated": 2,
    "vulnerabilitiesBlocked": 0,
    "overridesAdded": 0,
    "overridesRemoved": 0,
    "writeSuccess": false,
    "writeSkipped": true,
  },
}
\`\`\`

### \`pastoralist --styleguide\`

Open an interactive radio menu for exploring the Pastoralist DX components
without changing project configuration. Use the arrow keys and Enter to choose
a demo. In the prompt demo, Space toggles choices, \`a\` selects all, \`n\` selects
none, and Esc cancels.

\`\`\`bash
npx pastoralist --styleguide
\`\`\`

### \`pastoralist --quiet\`

Quiet mode for CI pipelines. Outputs minimal text and uses exit codes.

- Exit 0: No vulnerabilities found
- Exit 1: Vulnerabilities detected

\`\`\`bash
npx pastoralist --quiet --checkSecurity # -q --checkSecurity
\`\`\`

### \`pastoralist --summary\`

Display metrics after run.

\`\`\`bash
npx pastoralist --summary
\`\`\`

### \`pastoralist --setup-hook\`

Add Pastoralist to your \`postinstall\` script automatically.

\`\`\`bash
npx pastoralist --setup-hook
\`\`\`

### \`pastoralist --remove-unused\`

Remove overrides that no package in your project depends on. When Pastoralist detects unused overrides during a run, it suggests this flag.

\`\`\`bash
npx pastoralist --remove-unused
\`\`\`

### \`pastoralist --checkSecurity\`

Enable security vulnerability scanning.

\`\`\`bash
npx pastoralist --checkSecurity
\`\`\`

### \`pastoralist --securityProvider <provider...>\`

Choose one or more security providers. Supported values are \`osv\`, \`github\`,
\`npm\`, \`snyk\`, \`socket\`, and \`spektion\`.

\`\`\`bash
npx pastoralist --checkSecurity --securityProvider osv
\`\`\`

### \`pastoralist --securityProviderToken <token>\`

Pass a provider token without writing it to config. Prefer environment variables
for committed workflows.

\`\`\`bash
npx pastoralist --checkSecurity --securityProvider github --securityProviderToken "$GITHUB_TOKEN"
\`\`\`

### \`pastoralist --hasWorkspaceSecurityChecks\`

Include workspace package manifests in security scans when workspaces are
configured.

\`\`\`bash
npx pastoralist --checkSecurity --hasWorkspaceSecurityChecks
\`\`\`

### \`pastoralist --forceSecurityRefactor\`

Apply security override fixes without prompting.

\`\`\`bash
npx pastoralist --checkSecurity --forceSecurityRefactor
\`\`\`

### \`pastoralist --promptForReasons\`

Prompt for ledger reasons when Pastoralist adds manual override records.

\`\`\`bash
npx pastoralist --promptForReasons
\`\`\`

### \`pastoralist --strict\`

Fail when a security provider, network request, or API call cannot complete.

\`\`\`bash
npx pastoralist --checkSecurity --strict
\`\`\`

### \`pastoralist --cache-dir <path>\`

> Type: **\`string\`**
> Default: \`node_modules/.cache/pastoralist/\`

Store provider cache data in a custom directory.

\`\`\`bash
npx pastoralist --checkSecurity --cache-dir .cache/pastoralist
\`\`\`

### \`pastoralist --cache-ttl <seconds>\`

> Type: **\`number\`**
> Default: provider default

Override the provider cache TTL.

\`\`\`bash
npx pastoralist --checkSecurity --cache-ttl 3600
\`\`\`

### \`pastoralist --no-cache\`

Bypass cache reads and writes for a security run.

\`\`\`bash
npx pastoralist --checkSecurity --no-cache
\`\`\`

### \`pastoralist --refresh-cache\`

Bypass cache reads and write fresh provider results.

\`\`\`bash
npx pastoralist --checkSecurity --refresh-cache
\`\`\`

## CI

Use the CLI directly when CI only needs to validate or report data.

\`\`\`diff
 npx pastoralist
+npx pastoralist --dry-run --summary
+npx pastoralist --quiet --checkSecurity
+npx pastoralist --dry-run --outputFormat json
\`\`\`

Use the GitHub Action when the workflow should also expose outputs or create a
maintenance PR.

\`\`\`diff
 - uses: yowainwright/pastoralist@v1
  id: pastoralist
  with:
+    mode: check
+    check-security: true
+    security-provider: osv

 - name: Block unused overrides
+  if: steps.pastoralist.outputs.has-unused-overrides == 'true'
+  run: exit 1
\`\`\`

The action exposes \`has-security-issues\`, \`has-unused-overrides\`, \`updated\`,
\`security-count\`, \`unused-count\`, \`override-count\`, and \`pr-url\`.

{/* public result and appendix data from src/cli/utils.ts and src/types.ts */}

## Data API

Use these shapes when you read JSON output, inspect the appendix, or build
tooling around Pastoralist.

### \`PastoralistResult\`

\`PastoralistResult\` is the JSON object returned by \`--outputFormat json\`. It
reports whether the run succeeded, whether files changed, what security or
unused-override issues were found, and the run metrics.

\`\`\`bash
npx pastoralist --dry-run --outputFormat json
\`\`\`

\`\`\`jsonc
{
  "success": true,
  "hasSecurityIssues": false,
  "hasUnusedOverrides": true,
  "updated": false,
  "securityAlertCount": 0,
  "unusedOverrideCount": 1,
  "overrideCount": 2,
  "errors": [],
  "securityAlerts": [],
  "unusedOverrides": ["left-pad@1.3.0"],
  "appliedOverrides": {
    "left-pad": "1.3.0",
  },
  "metrics": {
    "packagesScanned": 1,
    "workspacePackagesScanned": 0,
    "appendixEntriesUpdated": 2,
    "vulnerabilitiesBlocked": 0,
    "overridesAdded": 0,
    "overridesRemoved": 0,
    "severityCritical": 0,
    "severityHigh": 0,
    "severityMedium": 0,
    "severityLow": 0,
    "writeSuccess": false,
    "writeSkipped": true,
  },
}
\`\`\`

Optional fields include \`securityAlerts\`, \`unusedOverrides\`,
\`appliedOverrides\`, \`removalVerification\`, \`bestCase\`, and \`metrics\`.

### \`pastoralist.appendix\`

\`pastoralist.appendix\` stores one entry per override version. Keys use
\`package-name@version\`; values can include root dependencies, dependents, patch
files, and ledger data.

\`\`\`json
{
  "pastoralist": {
    "appendix": {
      "left-pad@1.3.0": {
        "dependents": {
          "example-app": "left-pad@^1.0.0"
        },
        "patches": ["patches/left-pad+1.3.0.patch"],
        "ledger": {
          "addedDate": "2026-08-22T00:00:00.000Z",
          "reason": "Keep the legacy formatter working."
        }
      }
    }
  }
}
\`\`\`

### \`AppendixItem.ledger\`

Every current appendix entry has a \`ledger\` with \`addedDate\`. Manual records can
add \`reason\`; security runs can add provider, CVE, severity, vulnerable range,
patched version, confidence, source, and resolution fields.

\`\`\`json
{
  "ledger": {
    "addedDate": "2026-08-22T00:00:00.000Z",
    "source": "security",
    "securityProvider": "osv",
    "cves": ["CVE-2026-1234"],
    "severity": "high",
    "vulnerableRange": "<1.3.0",
    "patchedVersion": "1.3.0",
    "confidence": "confirmed",
    "keep": {
      "reason": "Wait for upstream compatibility confirmation.",
      "reviewBy": "2026-09-30"
    }
  }
}
\`\`\`

{/* primary public Node.js API exports from src/index.ts and src/types.ts */}

## Node.js API

### Installation

\`\`\`bash
npm install pastoralist
\`\`\`

The Node API runs the same override policy from JavaScript or TypeScript. The
CLI loads config, runs security checks, then calls \`update()\`. If you use the
API directly, call the pieces you need in that order.

### \`update(options)\`

> Type: **\`(options: Options) => UpdateContext\`**
> Default: \`{ path: "package.json" }\`

Update \`package.json\` overrides and the appendix. Each appendix entry includes a
\`ledger\` with at least \`addedDate\`. Pass the parsed package manifest as
\`config\`; the function is synchronous and returns an \`UpdateContext\`.

\`\`\`diff
 import { resolveJSON, update } from "pastoralist";

 const path = "./package.json";
 const config = resolveJSON(path);

 if (config) {
  const result = update({
    config,
    path,
+    dryRun: true,
+    outputFormat: "json",
+    summary: true,
    depPaths: ["packages/*/package.json"],
    ignore: ["**/test/**"],
  });

+  process.stdout.write(\`\${result.metrics?.appendixEntriesUpdated ?? 0} entries\\n\`);
 }
\`\`\`

### \`SecurityChecker.checkSecurity(config, options)\`

> Type: **\`(config: PastoralistJSON, options?: SecurityCheckRuntimeOptions) => Promise<SecurityCheckResult>\`**
> Default: provider and cache settings come from the \`SecurityChecker\`
> constructor.

Run vulnerability scanning directly and receive provider alerts, suggested
overrides, update suggestions, package counts, and optional best-case metadata.

\`\`\`diff
 import { resolveJSON, SecurityChecker } from "pastoralist";

 const config = resolveJSON("./package.json");
 const checker = new SecurityChecker({ provider: "osv" });

 if (config) {
  const result = await checker.checkSecurity(config, {
+    root: process.cwd(),
+    packageJsonPath: "./package.json",
+    severityThreshold: "high",
  });

  process.stdout.write(\`\${result.alerts.length} alerts found\\n\`);
 }
\`\`\`

### \`optimizeBestCasePortfolio(options)\`

> Type: **\`(options: OptimizeBestCaseOptions) => Promise<BestCaseResult>\`**
> Default: policy from \`resolveBestCasePolicy()\`

Evaluate complete package-version states and return the lowest-risk state under
a lexicographic policy. The evaluator must return alerts for the complete state,
not for one package in isolation.

\`\`\`diff
 import {
  optimizeBestCasePortfolio,
  type BestCaseEvaluator,
  type BestCasePackageChoice,
 } from "pastoralist";

 const choices: BestCasePackageChoice[] = [
  {
    packageName: "example",
    currentVersion: "1.0.0",
    versions: ["1.0.0", "1.1.0"],
  },
 ];

 const evaluate: BestCaseEvaluator = async (state) => {
  const usesVulnerableVersion = state.example === "1.0.0";
  const alerts = usesVulnerableVersion
    ? [
        {
          packageName: "example",
          currentVersion: state.example,
          vulnerableVersions: "<1.1.0",
          patchedVersion: "1.1.0",
          severity: "high" as const,
          title: "Example vulnerability",
          cves: ["CVE-2026-1234"],
          fixAvailable: true,
        },
      ]
    : [];

  return { alerts };
 };

 const result = await optimizeBestCasePortfolio({
  choices,
  evaluate,
+  config: {
+    enabled: true,
+    search: { mode: "auto", exactStateLimit: 256 },
+  },
 });

 console.log(result.selectedState);
 console.log(result.search.provenOptimal);
\`\`\`

\`BestCaseEvaluation\` may also return \`incompatibilities\`, \`oldness\`, \`valid\`,
and \`error\`. Rejected callbacks are recorded as invalid states and do not abort
other evaluations.

\`SecurityChecker.checkSecurity(config, options)\` accepts \`bestCase\` and a
project-supplied \`bestCaseEvaluator\`. Package JSON can configure \`bestCase\`, but
the evaluator is an API option because functions cannot be stored in JSON.

### Ledger reason types

\`LedgerReason\` is a non-empty string, \`ProjectReason\`, or \`BestCaseReason\`.
Reasons are stored per appendix dependency.

\`\`\`diff
 import type { LedgerReason } from "pastoralist";

 const reason: LedgerReason = {
+  type: "project",
+  summary: "Pin this dependency while the upstream fix is reviewed.",
+  pin: "3.2.1",
+  patch: "patches/example+3.2.1.patch",
+  constraints: ["Must retain the current runtime API"],
+  references: ["https://example.com/upstream/issue/123"],
 };
\`\`\`

A \`BestCaseReason\` contains \`decisionId\`, \`policyHash\`, \`search\`, and \`impact\`.
CVEs stay in \`ledger.cves\`; they are not duplicated in the reason.

### \`logger(config)\`

> Type: **\`(config: LoggerOptions) => Logger\`**
> Default: \`{ isLogging: false }\`

Create a logger instance for custom debugging.

\`\`\`diff
 import { logger } from "pastoralist";

 const log = logger({
  file: "my-script.js",
+  isLogging: true,
 });

+log.debug("starting action", "method-name", { data: "value" });
+log.error("unexpected error", "method-name", { error: err });
\`\`\`

## Examples

### Build Tool Integration

\`\`\`diff
 import { resolveJSON, update } from "pastoralist";

 const path = "./package.json";
 const config = resolveJSON(path);

 if (config) {
+  update({ config, path });
+  console.log("Package overrides verified");
 }
\`\`\`

### Workspace Automation

\`\`\`diff
 import { resolveJSON, update } from "pastoralist";
 import glob from "glob";

 const packages = glob.sync("packages/*/package.json");

+for (const pkgPath of packages) {
+  const pkg = resolveJSON(pkgPath);
+  if (pkg) {
+    update({ config: pkg, path: pkgPath });
+    console.log(\`Updated \${pkgPath}\`);
+  }
+}
\`\`\`

### CI Validation

\`\`\`diff
 import { resolveJSON, update } from "pastoralist";
 import { execSync } from "child_process";

 const path = "./package.json";
 const config = resolveJSON(path);

 const before = execSync("git status --porcelain").toString();
 if (config) {
+  update({ config, path });
 }
 const after = execSync("git status --porcelain").toString();

 if (before !== after) {
+  console.error("Package.json overrides need updating");
+  process.exit(1);
 }
\`\`\`

### Custom Logger

\`\`\`diff
 import { logger, resolveJSON, update } from "pastoralist";

 const log = logger({
  file: "my-script.js",
+  isLogging: process.env.DEBUG === "true",
 });

 const path = "./package.json";
 const config = resolveJSON(path);

+log.debug("starting", "custom-action", { time: Date.now() });

 if (config) {
+  update({ config, path, debug: true });
 }

+log.debug("completed", "custom-action", { time: Date.now() });
\`\`\`

### Error Handling

\`\`\`javascript
import { resolveJSON, update } from "pastoralist";

try {
  const path = "./package.json";
  const config = resolveJSON(path);
  if (!config) throw new Error("Package.json not found");
  update({ config, path });
} catch (error) {
  if (error.message === "Package.json not found") {
    console.error("Package.json not found");
  } else {
    console.error("Unexpected error:", error);
  }
}
\`\`\`

## Environment Variables

### \`DEBUG=true\`

Enable debug output (equivalent to --debug flag).

### Provider Tokens

Security providers read tokens from environment variables when a token is not
passed with \`--securityProviderToken\` or \`SecurityChecker\` options.

- \`github\`: \`GITHUB_TOKEN\`
- \`snyk\`: \`SNYK_TOKEN\`
- \`socket\`: \`SOCKET_SECURITY_API_KEY\`
- \`spektion\`: \`SPEKTION_API_KEY\`

\`\`\`diff
 npx pastoralist
+DEBUG=true npx pastoralist
\`\`\`

## TypeScript

Pastoralist includes full TypeScript support.

\`\`\`diff
 import { resolveJSON, update, type Options } from "pastoralist";

 const path = "./package.json";
 const config = resolveJSON(path);

 if (!config) {
  throw new Error("Package.json not found");
 }

 const options: Options = {
  config,
  path,
+  debug: true,
 };

 update(options);
\`\`\`
`,Bn=`---
title: Architecture
description: "How Pastoralist reads overrides, writes the appendix, tracks patches, and handles cleanup"
---

## How Pastoralist Works

\`\`\`mermaid
flowchart LR
    Manifest["package.json overrides / resolutions"] --> Config["Load CLI and project config"]
    Config --> Security{"Security enabled?"}
    Security -->|Yes| Scan["Scan providers and collect alerts"]
    Scan --> Fixes["Merge fixable security overrides"]
    Security -->|No| Update["Run update()"]
    Fixes --> Update
    Update --> Patches["Detect patch-package files"]
    Patches --> Overrides["Resolve package manager overrides"]
    Overrides --> Workspaces{"Workspace paths?"}
    Workspaces -->|Yes| WorkspaceAppendix["Read workspace manifests"]
    Workspaces -->|No| Appendix["Build appendix"]
    WorkspaceAppendix --> Appendix
    Appendix --> Cleanup{"--remove-unused?"}
    Cleanup -->|Yes| Remove["Remove verified unused overrides"]
    Cleanup -->|No| Write["Write package.json or appendix target"]
    Remove --> Write
    Write --> Result["Report metrics and outputs"]
\`\`\`

Pastoralist reads the root \`package.json\`, maps each override or resolution into
a \`pastoralist.appendix\` entry, and records when the entry was created in its
\`ledger\`. Patches created by tools such as \`patch-package\` are detected and
tracked on the same entry.

If an override or resolution is no longer needed, Pastoralist marks the appendix
entry as unused and prints a cleanup notice. The override and its appendix entry
are removed only when you run with \`--remove-unused\`. Patch files are reported
as potentially unused; Pastoralist does not delete patch files for you.

You manage the override or resolution field; Pastoralist manages the appendix.

### Workspace Support

In workspace/monorepo setups, Pastoralist:

- Reads the root \`package.json\` or project manifest file
- Maps overrides, resolutions, and patches to the \`pastoralist.appendix\`, with a
  \`ledger\` entry recording when each override was added
- Reads workspace package manifests when \`depPaths\` or \`workspaces\` are configured
- Writes the consolidated appendix to the target \`package.json\`, usually the root

## Simple Project Architecture

Standard single-package project with overrides:

\`\`\`mermaid
flowchart TD
    PkgJson[package.json] --> Pastoralist[Pastoralist]
    NodeModules[node_modules] --> Pastoralist
    Pastoralist --> UpdatedPkg[Updated package.json with appendix]

    style PkgJson fill:#e3f2fd
    style Pastoralist fill:#f3e5f5
    style UpdatedPkg fill:#e8f5e9
\`\`\`

## Monorepo Architecture

Complex workspace setup with shared overrides:

\`\`\`mermaid
flowchart TD
    Root[Root package.json] --> Pastoralist[Pastoralist]
    WS1[Workspace A] --> Pastoralist
    WS2[Workspace B] --> Pastoralist
    Pastoralist --> Output[Root package.json with consolidated appendix]

    style Root fill:#e3f2fd
    style Pastoralist fill:#f3e5f5
    style Output fill:#e8f5e9
\`\`\`

## What Are Overrides, Resolutions, and Patches?

### Overrides (npm)

Overrides replace a package version in your dependency tree with the version
you choose. This is npm's way to handle dependency conflicts:

\`\`\`json
{
  "overrides": {
    "foo": "1.0.0",
    "bar": {
      "baz": "1.0.0"
    }
  }
}
\`\`\`

### Resolutions (Yarn)

Resolutions serve the same purpose for Yarn users:

\`\`\`json
{
  "resolutions": {
    "foo": "1.0.0",
    "**/bar/baz": "1.0.0"
  }
}
\`\`\`

### Patches

Patches are local changes to \`node_modules\` packages, usually created with
tools such as \`patch-package\`. Pastoralist detects and tracks these patches.

## Object Anatomy

The Pastoralist object in \`package.json\` records what the tool manages:

\`\`\`json
{
  "overrides": {
    "minimist": "1.2.8"
  },
  "pastoralist": {
    "appendix": {
      "minimist@1.2.8": {
        "dependents": {
          "my-app": "minimist@^1.2.6",
          "mkdirp": "minimist@^1.2.5"
        },
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "reason": "Pin minimist while upstream packages adopt the patched version.",
          "source": "manual"
        }
      }
    }
  }
}
\`\`\`

### Appendix Properties

- **appendix key**: The package and override version, such as \`minimist@1.2.8\`
- **dependents**: Direct, workspace, or transitive packages that still require the override
- **patches**: Patch files associated with the package, when any are detected
- **ledger**: Always present on entries written by current Pastoralist. Holds
  \`addedDate\`, optional \`reason\` and \`source\`, security metadata (\`securityProvider\`,
  \`cves\`, \`cveDetails\`, \`severity\`, \`vulnerableRange\`, \`patchedVersion\`), and
  optional \`keep\` constraints

## Nested Override Architecture

How nested overrides work for transitive dependencies:

\`\`\`mermaid
flowchart TD
    App[Your App] --> ParentPkg[Parent Package]
    ParentPkg --> NestedDep[Nested Dependency]
    Override[Override in package.json] -.->|Forces version| NestedDep

    style App fill:#e3f2fd
    style Override fill:#fff3cd
    style NestedDep fill:#e8f5e9
\`\`\`

## Design Decisions

### Synchronous I/O

Pastoralist uses sync file I/O intentionally. As a CLI tool, predictable execution and simple debugging outweigh async benefits.

### Caching

Two caches avoid redundant work: \`jsonCache\` (parsed package.json files) and \`dependencyTreeCache\` (npm ls output). Caches persist across \`update()\` calls - pass \`clearCache: true\` to reset.

### Rate Limiting

npm registry requests are limited to 5 concurrent to avoid rate limits during security scans.

## Dependency Resolution Flow

How package managers resolve dependencies with overrides:

\`\`\`mermaid
flowchart TD
    Install[npm install] --> ReadPkg[Read package.json]
    ReadPkg --> CheckOverrides{Overrides exist?}
    CheckOverrides -->|Yes| ApplyOverrides[Apply overrides to dependency tree]
    CheckOverrides -->|No| NormalInstall[Normal install]
    ApplyOverrides --> UpdateLock[Update lock file]
    NormalInstall --> UpdateLock
    UpdateLock --> Done[✓ Dependencies installed]

    style Install fill:#e3f2fd
    style ApplyOverrides fill:#fff3cd
    style Done fill:#e8f5e9
\`\`\`
`,Vn=`---
title: Interactive Tutorial
description: Learn Pastoralist step by step
---

## Quick Start

\`\`\`bash
# Create a test project
mkdir test-pastoralist && cd test-pastoralist

# Create package.json with a transitive override
echo '{
  "name": "test",
  "dependencies": {
    "express": "^4.18.0"
  },
  "overrides": {
    "qs": "6.11.2"
  }
}' > package.json

# Install and run Pastoralist
npm install
npm install --save-dev pastoralist
npx pastoralist

# Check the result
cat package.json
\`\`\`

## How It Works

### Before Pastoralist

\`\`\`json
{
  "dependencies": {
    "express": "^4.18.0"
  },
  "overrides": {
    "qs": "6.11.2"
  }
}
\`\`\`

### After Pastoralist

\`\`\`json
{
  "overrides": {
    "qs": "6.11.2"
  },
  "pastoralist": {
    "appendix": {
      "qs@6.11.2": {
        "dependents": {
          "express": "qs@6.11.0"
        },
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "source": "manual"
        }
      }
    }
  }
}
\`\`\`

### Cleanup

When dependencies no longer need an override, Pastoralist labels it as unused.
Run with \`--remove-unused\` to remove the override and appendix entry:

\`\`\`bash
npx pastoralist --remove-unused
\`\`\`

## Setup

### Install

\`\`\`bash
npm install --save-dev pastoralist
\`\`\`

### Add to postinstall

\`\`\`json
{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
\`\`\`

### For Monorepos

\`\`\`bash
# Root package
pastoralist

# Specific workspace
pastoralist --path packages/app/package.json
\`\`\`

## Common Use Cases

### Security Patches

\`\`\`json
{
  "overrides": {
    "minimist": "1.2.8"
  },
  "pastoralist": {
    "appendix": {
      "minimist@1.2.8": {
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "reason": "Pin minimist to a patched version while upstream dependencies update.",
          "source": "security",
          "cves": ["CVE-2021-44906"],
          "severity": "high",
          "patchedVersion": "1.2.8"
        }
      }
    }
  }
}
\`\`\`

Pastoralist keeps the security context with the override so you can remove it
when upstream dependencies no longer need it.

### Version Conflicts

\`\`\`json
{
  "overrides": {
    "react": "17.0.2"
  },
  "pastoralist": {
    "appendix": {
      "react@17.0.2": {
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "reason": "Legacy app compatibility",
          "source": "manual"
        }
      }
    }
  }
}
\`\`\`

The appendix shows which packages aren't ready for React 18.

### API Usage

\`\`\`javascript
import { resolveJSON, update } from "pastoralist";

const path = "./package.json";
const config = resolveJSON(path);

if (config) {
  update({ config, path });
}
\`\`\`

## Try It Now

<a
  href="https://stackblitz.com/github/yowainwright/pastoralist/tree/main/tests/sandboxes/basic-overrides?title=Pastoralist%20Basic%20Overrides&file=README.md&startScript=demo&view=editor"
  target="_blank"
  rel="noopener noreferrer"
>
  <img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz" />
</a>

[Open Interactive Demos](/docs/introduction) to see Pastoralist in action.

## Resources

- [GitHub](https://github.com/yowainwright/pastoralist)
- [npm](https://www.npmjs.com/package/pastoralist)
- [Issues and Questions](https://github.com/yowainwright/pastoralist/issues)
`,Hn=`---
title: Configuration
description: Learn how to configure Pastoralist using config files or package.json
---

For most projects, start small: enable workspace scanning only if you have
workspaces, and enable security checks only where you want advisory data.

## Configuration Files

Pastoralist searches for configuration files in this order (first found wins):

1. \`.pastoralistrc\` (JSON format)
2. \`.pastoralistrc.json\`
3. \`pastoralist.json\`
4. \`pastoralist.config.cjs\`
5. \`pastoralist.config.js\`
6. \`pastoralist.config.mjs\`

All external config files use the same top-level Pastoralist settings. Choose
the filename by format and convention:

- \`.pastoralistrc\`: extensionless rc file parsed as JSON
- \`.pastoralistrc.json\`: explicit JSON rc file, and the JSON option created by
  \`pastoralist init\`
- \`pastoralist.json\`: visible non-dotfile JSON config
- \`pastoralist.config.cjs\`: CommonJS module with \`module.exports\`
- \`pastoralist.config.js\`: JavaScript config. CommonJS exports are accepted;
  otherwise it is imported as a module
- \`pastoralist.config.mjs\`: ESM module with \`export default\`

Use \`pastoralist.json\`, not \`.pastoralist.json\`.

### Example Configurations

#### Minimal Configuration

Enable security checks with defaults:

\`\`\`json
{
  "checkSecurity": true,
  "depPaths": "workspace",
  "security": {
    "provider": "osv"
  }
}
\`\`\`

#### \`.pastoralistrc.json\`

\`\`\`json
{
  "checkSecurity": true,
  "depPaths": "workspace",
  "security": {
    "provider": "osv",
    "severityThreshold": "medium"
  }
}
\`\`\`

#### \`pastoralist.config.js\`

\`\`\`js
module.exports = {
  depPaths: ["packages/*/package.json", "apps/*/package.json"],
  checkSecurity: true,
  security: {
    provider: "osv",
    severityThreshold: "high",
    excludePackages: ["@types/*"],
  },
};
\`\`\`

#### \`pastoralist.config.mjs\`

\`\`\`js
export default {
  checkSecurity: true,
  depPaths: "workspace",
  security: {
    provider: "osv",
    severityThreshold: "critical",
  },
};
\`\`\`

## Configuration Priority

When both external config files and \`package.json\` configuration exist,
Pastoralist merges them and lets \`package.json\` take precedence:

1. **External config** provides base settings
2. **\`package.json\`** overrides top-level fields
3. **Nested objects** (like \`security\`) are deep merged

### Example: Config Merging

\`.pastoralistrc.json\`:

\`\`\`json
{
  "checkSecurity": true,
  "depPaths": "workspace",
  "security": {
    "provider": "osv",
    "severityThreshold": "medium"
  }
}
\`\`\`

\`package.json\`:

\`\`\`json
{
  "pastoralist": {
    "security": {
      "severityThreshold": "high"
    }
  }
}
\`\`\`

Effective configuration:

\`\`\`json
{
  "checkSecurity": true,
  "depPaths": "workspace",
  "security": {
    "provider": "osv",
    "severityThreshold": "high"
  }
}
\`\`\`

## Configuration Options

### Top-Level Options

| Option            | Type                                          | Description                                                                                                                           |
| ----------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| \`checkSecurity\`   | \`boolean\`                                     | Enable security vulnerability scanning                                                                                                |
| \`compactAppendix\` | \`boolean\`                                     | Collapse routine appendix entries to \`{ addedDate }\`; entries with security info, patches, or active \`keep\` constraints stay expanded |
| \`depPaths\`        | \`"workspace"\` \\| \`"workspaces"\` \\| \`string[]\` | Paths to scan for dependencies in monorepos                                                                                           |
| \`appendix\`        | \`object\`                                      | Auto-generated dependency tracking (managed by Pastoralist)                                                                           |
| \`overridePaths\`   | \`object\`                                      | Manual override tracking for specific paths                                                                                           |
| \`resolutionPaths\` | \`object\`                                      | Manual resolution tracking for specific paths                                                                                         |
| \`bestCase\`        | \`object\`                                      | Opt-in dependency-portfolio optimization policy                                                                                       |
| \`security\`        | \`object\`                                      | Security scanning configuration                                                                                                       |

### Security Configuration

The \`security\` object supports the following options:

| Option                       | Type                                                                                | Description                                                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \`enabled\`                    | \`boolean\`                                                                           | Enable/disable security checks                                                                                                                              |
| \`provider\`                   | \`"osv"\` \\| \`"github"\` \\| \`"snyk"\` \\| \`"npm"\` \\| \`"socket"\` \\| \`"spektion"\` \\| array | Security provider or providers to use                                                                                                                       |
| \`autoFix\`                    | \`boolean\`                                                                           | Automatically apply security fixes                                                                                                                          |
| \`interactive\`                | \`boolean\`                                                                           | Use interactive mode for security fixes                                                                                                                     |
| \`securityProviderToken\`      | \`string\`                                                                            | API token for providers that require authentication. Prefer provider environment variables; use this only for controlled config that will not be committed. |
| \`severityThreshold\`          | \`"low"\` \\| \`"medium"\` \\| \`"high"\` \\| \`"critical"\`                                   | Minimum severity level to report                                                                                                                            |
| \`excludePackages\`            | \`string[]\`                                                                          | Packages to exclude from security checks                                                                                                                    |
| \`hasWorkspaceSecurityChecks\` | \`boolean\`                                                                           | Include workspace packages in security scans                                                                                                                |
| \`strict\`                     | \`boolean\`                                                                           | Fail when a security provider cannot complete                                                                                                               |

### Best-Case Portfolio Configuration

Enable \`bestCase\` when package fixes must be chosen as one portfolio instead
of independently. Pastoralist evaluates complete version combinations so a fix
for one package cannot hide a vulnerability introduced elsewhere.

\`\`\`json
{
  "pastoralist": {
    "checkSecurity": true,
    "bestCase": {
      "enabled": true,
      "userOwnedOverrides": ["alpha"],
      "riskAggregation": "both",
      "objectives": [
        "known-exploited",
        "critical",
        "high",
        "expected-exploitation",
        "package-exposures",
        "compatibility",
        "change-count",
        "oldness"
      ],
      "search": {
        "mode": "auto",
        "exactStateLimit": 256,
        "beamWidth": 16,
        "maxEvaluations": 1000
      }
    }
  }
}
\`\`\`

| Option                   | Type                                                 | Default   | Description                                                     |
| ------------------------ | ---------------------------------------------------- | --------- | --------------------------------------------------------------- |
| \`enabled\`                | \`boolean\`                                            | \`false\`   | Enable portfolio selection during security checks               |
| \`userOwnedOverrides\`     | \`string[]\`                                           | \`[]\`      | Hard-constrain listed packages to their active override version |
| \`riskAggregation\`        | \`"unique-cves"\` \\| \`"package-exposures"\` \\| \`"both"\` | \`"both"\`  | Choose how vulnerability risk is counted                        |
| \`objectives\`             | \`BestCaseObjective[]\`                                | See above | Set the lexicographic ranking order                             |
| \`search.mode\`            | \`"auto"\` \\| \`"exact"\` \\| \`"beam"\`                    | \`"auto"\`  | Select exhaustive or deterministic bounded search               |
| \`search.exactStateLimit\` | positive integer                                     | \`256\`     | Limit exact search to this many states in auto mode             |
| \`search.beamWidth\`       | positive integer                                     | \`16\`      | Retain this many states at each step during beam search         |
| \`search.maxEvaluations\`  | positive integer                                     | \`1000\`    | Stop after this many complete-state evaluations                 |

Objectives are compared in array order; Pastoralist does not combine them
into a weighted sum. Supported objectives are \`known-exploited\`, \`critical\`,
\`high\`, \`medium\`, \`low\`, \`expected-exploitation\`, \`package-exposures\`,
\`compatibility\`, \`change-count\`, and \`oldness\`.

An exact search reports \`provenOptimal: true\` only when it evaluates every
state. Beam search and capped exact search report \`provenOptimal: false\`.

## Package.json Configuration

You can configure Pastoralist directly in your \`package.json\`:

\`\`\`json
{
  "name": "my-project",
  "version": "1.0.0",
  "pastoralist": {
    "checkSecurity": true,
    "depPaths": "workspace",
    "security": {
      "provider": "osv",
      "severityThreshold": "medium",
      "excludePackages": ["@types/*"]
    }
  }
}
\`\`\`

## Monorepo Configuration

For monorepos, use \`depPaths\` to specify which package.json files to scan:

### Using "workspace"

The simplest approach for monorepos with a \`workspaces\` field:

\`\`\`json
{
  "workspaces": ["packages/*", "apps/*"],
  "pastoralist": {
    "depPaths": "workspace"
  }
}
\`\`\`

This scans all workspace packages defined in your \`workspaces\` field.
\`"workspaces"\` is accepted as an alias.

### Using Custom Paths

For more control, specify custom glob patterns:

\`\`\`json
{
  "pastoralist": {
    "depPaths": ["packages/*/package.json", "apps/*/package.json"]
  }
}
\`\`\`

## Security Tracking

Every appendix entry gets a \`ledger\` with at least \`addedDate\`. When a security
provider detects a fix, Pastoralist adds CVE, severity, provider, and
vulnerable-range metadata to the same ledger:

\`\`\`json
{
  "pastoralist": {
    "appendix": {
      "lodash@4.17.21": {
        "dependents": {
          "my-app": "lodash@^4.17.0"
        },
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "reason": "Security vulnerability CVE-2021-23337",
          "source": "security",
          "securityChecked": true,
          "securityCheckDate": "2026-05-30T00:00:00.000Z",
          "securityCheckResult": "clean",
          "securityProvider": "osv",
          "cves": ["CVE-2021-23337"],
          "cveDetails": [
            {
              "cve": "CVE-2021-23337",
              "severity": "high",
              "patchedVersion": "4.17.21"
            }
          ],
          "severity": "high",
          "vulnerableRange": "<4.17.21",
          "patchedVersion": "4.17.21",
          "keep": true
        }
      }
    }
  }
}
\`\`\`

### Ledger Fields

- **\`addedDate\`**: ISO timestamp recorded when the entry was first written. Always present
- **\`reason\`**: Why the override was needed. Accepts a non-empty string, a \`ProjectReason\`, or a \`BestCaseReason\`
- **\`source\`**: How the entry was created — \`"manual"\` or \`"security"\`
- **\`securityChecked\`**: Whether a security check was performed
- **\`securityCheckDate\`**: When the last security check occurred
- **\`securityCheckResult\`**: Result of the last check — \`"clean"\`, \`"error"\`, or \`"skipped"\`
- **\`securityProvider\`**: Which provider detected the vulnerability
- **\`cves\`**: All CVE identifiers related to this vulnerability
- **\`cveDetails\`**: Per-CVE objects with \`cve\`, \`severity\`, and \`patchedVersion\`
- **\`severity\`**: Highest severity across all CVEs (\`low\`, \`medium\`, \`high\`, \`critical\`)
- **\`vulnerableRange\`**: Semver range that is affected
- **\`patchedVersion\`**: Version that resolves the vulnerability
- **\`keep\`**: Prevent \`--remove-unused\` from removing this entry. Set to \`true\` or a \`KeepConstraint\` object

### Structured Ledger Reasons

Use a project reason for an engineer-selected pin or patch:

\`\`\`json
{
  "reason": {
    "type": "project",
    "summary": "Keep the patched fork until upstream publishes a release.",
    "pin": "2.4.1",
    "patch": "patches/example+2.4.1.patch",
    "constraints": ["Requires the current plugin API"],
    "references": ["https://example.com/upstream/issue/123"]
  }
}
\`\`\`

\`summary\` is required. \`pin\`, \`patch\`, \`constraints\`, and \`references\` are
optional and descriptive; package-manager overrides and appendix patch paths
remain authoritative.

Best-case selection writes a reason tied to the complete portfolio decision:

\`\`\`json
{
  "reason": {
    "type": "best-case",
    "summary": "Selected as part of the lowest-risk dependency portfolio",
    "decisionId": "best-case-4b825dc642cb",
    "policyHash": "d14a028c2a3a2bc9",
    "search": {
      "evaluatedStates": 64,
      "provenOptimal": true
    },
    "impact": {
      "fixedVulnerabilities": 3,
      "introducedVulnerabilities": 0,
      "remainingVulnerabilities": 1
    }
  },
  "cves": ["CVE-2026-1234"]
}
\`\`\`

The reason belongs to one dependency item. Dependencies selected by the same
portfolio share a \`decisionId\`. CVEs remain in the sibling \`cves\` field.

### Keeping Overrides with \`keep\`

To pin an override so \`--remove-unused\` never removes it, set \`keep: true\` on the ledger:

\`\`\`json
{
  "ledger": {
    "addedDate": "2026-05-30T00:00:00.000Z",
    "keep": true
  }
}
\`\`\`

For time-bounded or version-bounded keeps, use a \`KeepConstraint\` object:

\`\`\`json
{
  "ledger": {
    "addedDate": "2026-05-30T00:00:00.000Z",
    "keep": {
      "reason": "Waiting for upstream patch",
      "until": "2027-06-01",
      "untilVersion": "4.18.0"
    }
  }
}
\`\`\`

\`KeepConstraint\` fields:

- **\`reason\`** _(required)_: Why this override is being kept
- **\`until\`**: ISO date after which the keep is considered expired
- **\`untilVersion\`**: Semver. The keep expires once the root dependency meets or exceeds this version
- **\`reviewBy\`**: Freeform field for tracking who should review the decision

This shows which packages were overridden for security reasons and when they
were last checked.

## Best Practices

1. **Use \`depPaths: "workspace"\`** for most monorepos
2. **Enable security checks** in CI with \`--checkSecurity\`
3. **Commit config files** to version control

## JavaScript Config Files

Use \`pastoralist.config.cjs\` for CommonJS or \`pastoralist.config.mjs\` for ESM:

\`\`\`js
export default {
  checkSecurity: true,
  depPaths: "workspace",
  security: {
    provider: "osv",
    severityThreshold: "high",
  },
};
\`\`\`

TypeScript config files are not loaded directly. Use JSON, CJS, JS, or MJS
config files.

## Environment-Specific Configuration

You can use JavaScript config files to provide environment-specific settings:

\`\`\`js
// pastoralist.config.js
const isDev = process.env.NODE_ENV === "development";
const isCI = process.env.CI === "true";

module.exports = {
  checkSecurity: !isDev, // Only check in production/CI
  depPaths: "workspace",
  security: {
    provider: "osv",
    severityThreshold: isCI ? "high" : "medium",
    autoFix: isCI && !isDev,
  },
};
\`\`\`

## Migration from CLI Flags

If you're currently using CLI flags, you can migrate to config files:

### Before (CLI flags)

\`\`\`bash
pastoralist --checkSecurity --depPaths "packages/*/package.json"
\`\`\`

### After (config file)

\`\`\`json
{
  "checkSecurity": true,
  "depPaths": ["packages/*/package.json"]
}
\`\`\`

\`\`\`bash
pastoralist
\`\`\`

CLI flags still work and will override config file settings.
`,Un=`---
title: GitHub Action
description: Automated dependency override management for CI
---

## Quick Start

### Basic PR Check

\`\`\`diff
 name: Override Check
 on: [pull_request]

 jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
+      - uses: yowainwright/pastoralist@v1
+        with:
+          mode: check
+          check-security: false
\`\`\`

The action enables OSV security scanning by default. Set
\`check-security: false\` when you only want to validate override tracking.

### Scheduled Maintenance with PR Creation

\`\`\`diff
 name: Override Maintenance
 on:
  schedule:
    - cron: "0 0 * * 1" # Weekly on Monday

+permissions:
+  contents: write
+  pull-requests: write

 jobs:
  maintain:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
+      - uses: yowainwright/pastoralist@v1
+        with:
+          mode: pr
+          pr-title: "chore(deps): update dependency overrides"
+          pr-labels: "dependencies automated"
\`\`\`

## Modes

### \`mode: check\`

Runs Pastoralist in dry-run mode. Reports issues without modifying files.

\`\`\`diff
 - uses: yowainwright/pastoralist@v1
  with:
+    mode: check
\`\`\`

### \`mode: update\`

> Default: selected when \`mode\` is unset

Runs Pastoralist and modifies \`package.json\`. Use when you want to handle commits yourself.

\`\`\`diff
 - uses: actions/checkout@v7

 - uses: yowainwright/pastoralist@v1
  with:
+    mode: update

+- name: Commit changes
+  run: |
+    git config user.name github-actions[bot]
+    git config user.email github-actions[bot]@users.noreply.github.com
+    git add package.json
+    git diff --staged --quiet || git commit -m "chore: update overrides"
+    git push
\`\`\`

### \`mode: pr\`

Runs Pastoralist and creates a PR if changes are needed. This is best for scheduled workflows.
Use this mode with \`contents: write\` and \`pull-requests: write\` workflow
permissions.

\`\`\`diff
 - uses: yowainwright/pastoralist@v1
  with:
+    mode: pr
+    pr-title: "fix(security): update vulnerable overrides"
\`\`\`

## Inputs

### \`mode\`

> Type: **\`"check" | "update" | "pr"\`**
> Default: \`"update"\`

Selects validation, direct file updates, or PR creation.

### \`check-security\`

> Type: **\`boolean\`**
> Default: \`true\`

Enables vulnerability scanning.

### \`security-provider\`

> Type: **\`"osv" | "github" | "npm" | "snyk" | "socket" | "spektion"\`**
> Default: \`"osv"\`

Selects the security provider used when \`check-security\` is enabled.

### \`security-token\`

> Type: **\`string\`**
> Default: unset

Passes a token to providers that require authentication.

### \`auto-fix\`

> Type: **\`boolean\`**
> Default: \`true\`

Applies security fixes automatically when the action can write files.

### \`dry-run\`

> Type: **\`boolean\`**
> Default: \`false\`

Previews changes without modifying files. \`mode: check\` always runs as a dry
run.

### \`root-dir\`

> Type: **\`string\`**
> Default: unset

Sets the project root directory passed to \`pastoralist --root\`.

### \`dep-paths\`

> Type: **\`string\`**
> Default: unset

Passes space-separated workspace package patterns to \`pastoralist --depPaths\`.

### \`config\`

> Type: **\`string\`**
> Default: unset

Deprecated. Config files are auto-detected from \`root-dir\`.

### \`fail-on-security\`

> Type: **\`boolean\`**
> Default: \`true\`

Fails the action when vulnerabilities are found.

### \`fail-on-unused\`

> Type: **\`boolean\`**
> Default: \`false\`

Fails the action when unused overrides are detected.

### \`silent\`

> Type: **\`boolean\`**
> Default: \`false\`

Deprecated compatibility input. The action ignores it and prints a warning when
it is enabled.

### \`debug\`

> Type: **\`boolean\`**
> Default: \`false\`

Passes \`--debug\` to Pastoralist.

### \`pr-title\`

> Type: **\`string\`**
> Default: \`"chore(deps): update dependency overrides"\`

Sets the PR title for \`mode: pr\`.

### \`pr-body\`

> Type: **\`string\`**
> Default: auto-generated

Sets the PR body for \`mode: pr\`.

### \`pr-branch\`

> Type: **\`string\`**
> Default: \`"pastoralist/updates"\`

Sets the PR branch for \`mode: pr\`.

### \`pr-labels\`

> Type: **\`string\`**
> Default: \`"dependencies"\`

Adds space-separated labels to the PR created by \`mode: pr\`.

### \`github-token\`

> Type: **\`string\`**
> Default: \`github.token\`

Sets the GitHub token for PR creation.

## Outputs

### \`has-security-issues\`

> Type: **\`"true" | "false"\`**
> Default: \`"false"\`

Reports whether vulnerabilities were found.

### \`has-unused-overrides\`

> Type: **\`"true" | "false"\`**
> Default: \`"false"\`

Reports whether unused overrides were detected.

### \`updated\`

> Type: **\`"true" | "false"\`**
> Default: \`"false"\`

Reports whether \`package.json\` was modified.

### \`security-count\`

> Type: **\`number\`**
> Default: \`0\`

Reports the number of security vulnerabilities found.

### \`unused-count\`

> Type: **\`number\`**
> Default: \`0\`

Reports the number of unused overrides detected.

### \`override-count\`

> Type: **\`number\`**
> Default: \`0\`

Reports the number of tracked overrides after the run.

### \`pr-url\`

> Type: **\`string\`**
> Default: \`""\`

Reports the created PR URL in \`mode: pr\`.

## Examples

### PR Check with Security Gate

\`\`\`diff
 name: Override Security
 on: [pull_request]

 jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - uses: yowainwright/pastoralist@v1
        with:
+          mode: check
+          fail-on-security: true
+          security-provider: osv
\`\`\`

### Monorepo Support

\`\`\`diff
 - uses: yowainwright/pastoralist@v1
  with:
+    dep-paths: "packages/*/package.json apps/*/package.json"
\`\`\`

### Using GitHub Security Provider

\`\`\`diff
 - uses: yowainwright/pastoralist@v1
  with:
+    security-provider: github
+    security-token: \${{ secrets.GITHUB_TOKEN }}
\`\`\`

### Conditional PR on Vulnerabilities

\`\`\`diff
 - uses: yowainwright/pastoralist@v1
+  id: pastoralist
  with:
+    mode: check

+- name: Create security PR
+  if: steps.pastoralist.outputs.has-security-issues == 'true'
+  run: |
+    # Custom PR logic here
\`\`\`

### Weekly Maintenance with Slack Notification

\`\`\`diff
 name: Weekly Override Maintenance
 on:
  schedule:
    - cron: "0 9 * * 1"

+permissions:
+  contents: write
+  pull-requests: write

 jobs:
  maintain:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

+      - uses: yowainwright/pastoralist@v1
+        id: pastoralist
+        with:
+          mode: pr
+
+      - name: Notify Slack
+        if: steps.pastoralist.outputs.pr-url != ''
+        uses: slackapi/slack-github-action@v3.0.3
+        with:
+          payload: |
+            {
+              "text": "Pastoralist created a PR: \${{ steps.pastoralist.outputs.pr-url }}"
+            }
\`\`\`

## Permissions

For \`mode: pr\`, the action needs write permissions:

\`\`\`diff
 permissions:
+  contents: write
+  pull-requests: write
\`\`\`

## Security Providers

### \`security-provider: osv\`

> Auth: **none**
> Default: selected when \`security-provider\` is unset

Uses the Open Source Vulnerabilities database.

### \`security-provider: npm\`

> Auth: **none**
> Default: unset

Uses the detected package manager's audit command.

### \`security-provider: github\`

> Auth: **required**
> Default: unset

Reads Dependabot alerts. Pass \`GITHUB_TOKEN\` or rely on an authenticated \`gh\`
CLI session.

### \`security-provider: snyk\`

> Auth: **required**
> Default: unset

Requires \`SNYK_TOKEN\`.

### \`security-provider: socket\`

> Auth: **required**
> Default: unset

Requires \`SOCKET_SECURITY_API_KEY\`.

### \`security-provider: spektion\`

> Auth: **required**
> Default: unset

Requires \`SPEKTION_API_KEY\`.
`,Wn=`---
title: Introduction to Pastoralist
description: "Pastoralist keeps dependency overrides explainable, current, and removable"
---

<div className="flex flex-wrap gap-2 mb-8">
  <a href="https://www.npmjs.com/package/pastoralist" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/npm/v/pastoralist.svg" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/pastoralist" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/npm/dm/pastoralist.svg" alt="npm downloads" />
  </a>
  <a href="https://www.typescriptlang.org/" target="_blank" rel="noopener noreferrer">
    <img
      src="https://img.shields.io/badge/TypeScript-types%20included-blue"
      alt="TypeScript types included"
    />
  </a>
</div>

Pastoralist tracks your dependency overrides: why they’re there, which packages
need them, and when you can remove them.

Pastoralist works with npm and Bun \`overrides\`, pnpm \`pnpm.overrides\`, and Yarn
\`resolutions\`. It can also tie security fixes, patch files, workspace packages,
and CI checks to the same record.

## Why This Matters

Overrides usually start with a good reason:

\`\`\`json
{
  "overrides": {
    "lodash": "4.17.21"
  }
}
\`\`\`

Months later, you might not remember why you added it. Was it a security fix?
A transitive bug? Which packages still need it? Can you remove it? The override
sets the version, and with Pastoralist, you have an appendix that keeps the context.

\`\`\`json
{
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "appendix": {
      "lodash@4.17.21": {
        "dependents": {
          "web-app": "lodash@^4.17.20",
          "admin-ui": "lodash@^4.17.19"
        },
        "ledger": {
          "addedDate": "2026-05-06T00:00:00.000Z",
          "reason": "Pin lodash to a patched version while workspace packages finish upgrades.",
          "source": "manual",
          "securityChecked": true,
          "securityProvider": "osv",
          "cves": ["CVE-2021-23337"],
          "cveDetails": [
            {
              "cve": "CVE-2021-23337",
              "severity": "high",
              "patchedVersion": "4.17.21"
            }
          ],
          "severity": "high",
          "vulnerableRange": "<4.17.21",
          "patchedVersion": "4.17.21",
          "keep": {
            "reason": "Keep until each workspace requests lodash 4.17.21 or newer.",
            "untilVersion": "4.17.21"
          }
        }
      }
    }
  }
}
\`\`\`

The appendix shows why the override was added, why it is needed, or if it can be removed.

## What Pastoralist Handles

- Tracks npm and Bun \`overrides\`, pnpm \`pnpm.overrides\`, and Yarn
  \`resolutions\`
- Shows which direct or workspace packages still depend on each override
- Removes stale overrides with \`--remove-unused\`
- Links \`patch-package\` files to the overrides they support
- Checks security advisories with OSV, GitHub Dependabot alerts, npm audit,
  Snyk, Socket, or Spektion
- Supports monorepos through \`workspaces\`, \`depPaths\`, \`overridePaths\`, and
  \`resolutionPaths\`
- Provides CI-friendly output with \`--dry-run\`, \`--quiet\`, \`--summary\`, and
  \`--outputFormat json\`

## At A Glance

| Area               | Details                                                      |
| ------------------ | ------------------------------------------------------------ |
| Package managers   | npm, pnpm, Yarn, Bun                                         |
| Runtime            | Node 20.19+                                                  |
| Security default   | OSV, no token required                                       |
| Optional providers | GitHub, npm audit, Snyk, Socket, Spektion                    |
| Monorepos          | Auto-detects \`workspaces\`; accepts explicit package globs    |
| CI                 | CLI flags plus a GitHub Action                               |
| Test surface       | 2,000+ test cases across unit, integration, and e2e fixtures |

## When To Use It

Use Pastoralist to document dependency overrides, remove the overrides you don't
need anymore, and track override security fixes.

It is designed to sit beside tools such as npm audit, Dependabot, Renovate,
patch-package, syncpack, and depcheck. Those tools find or apply dependency
changes. Pastoralist keeps the resulting overrides from becoming invisible
technical debt.

## Start Here

\`\`\`bash
npm install pastoralist --save-dev
npx pastoralist init
\`\`\`

Then add it to \`postinstall\`:

\`\`\`json
{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
\`\`\`

Continue with the [setup guide](/docs/setup), or try a sandbox:

<a
  href="https://stackblitz.com/github/yowainwright/pastoralist/tree/main/tests/sandboxes/basic-overrides?title=Pastoralist%20Basic%20Overrides&file=README.md&startScript=demo&view=editor"
  target="_blank"
  rel="noopener noreferrer"
>
  <img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz" />
</a>
`,Gn=`---
title: Onboarding
description: "First-run checklist for local use, agent setup, and CI"
---

Use onboarding when you are adding Pastoralist to a repo for the first time or
when you want a repeatable setup path for contributors and agents.

## Start Read-Only

Check the current project without writing files:

\`\`\`bash
npx pastoralist doctor
\`\`\`

Print the full checklist from the CLI:

\`\`\`bash
npx pastoralist onboard
\`\`\`

## Add Project Setup

Install Pastoralist and create the initial config:

\`\`\`bash
npm install pastoralist --save-dev
npx pastoralist init
\`\`\`

Update the appendix once the config is in place:

\`\`\`bash
npx pastoralist
\`\`\`

Keep it current after dependency installs:

\`\`\`bash
npx pastoralist --setup-hook
\`\`\`

## Add Agent Setup

Install only the bundled Pastoralist skill:

\`\`\`bash
npx pastoralist --init agent-skill
\`\`\`

Preview local dev setup before writing files:

\`\`\`bash
pnpm run setup:local-dev -- --dry-run
\`\`\`

Set up agent config, bundled skills, and local hooks:

\`\`\`bash
pnpm run setup:local-dev -- --skills all --hooks git,postinstall
\`\`\`

The local dev setup script auto-detects Codex or Claude when possible. You can
pin the target explicitly:

\`\`\`bash
pnpm run setup:local-dev -- --agent codex
pnpm run setup:local-dev -- --agent claude
\`\`\`

## Copy/Paste Prompts

Use this prompt when you want an agent to do the setup:

\`\`\`text
Set up Pastoralist in this repository.
Start with \`npx pastoralist doctor\` and inspect the current package manager setup.
Run \`pnpm run setup:local-dev -- --dry-run\` before writing files.
Configure the Pastoralist skill, local agent config, GitHub Action, and postinstall hook only when appropriate.
Keep changes scoped to setup files, docs, and tests.
\`\`\`

Use this prompt when you want an agent to review an existing setup:

\`\`\`text
Review this repository's Pastoralist setup.
Run \`npx pastoralist --dry-run\` and summarize stale overrides, security checks, and missing setup.
Do not remove overrides unless \`npx pastoralist --remove-unused --dry-run\` shows they are unused.
If setup is missing, propose the smallest script, skill, hook, or GitHub Action change.
\`\`\`

## Agent Setup Loop

Use this loop when an agent owns the setup:

1. Run \`npx pastoralist doctor\`.
2. Run \`pnpm run setup:local-dev -- --dry-run\`.
3. Apply the smallest needed setup command.
4. Run \`npx pastoralist --dry-run\`.
5. Report changed files and remaining manual steps.

## Add CI

Create \`.github/workflows/pastoralist.yml\`:

\`\`\`yaml
name: Override Check
on: [pull_request]

jobs:
  pastoralist:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: yowainwright/pastoralist@v1
        with:
          mode: check
          check-security: false
\`\`\`

## Verify

Use these commands before merging setup changes:

\`\`\`bash
npx pastoralist --dry-run
npx pastoralist --summary
npx pastoralist --checkSecurity
\`\`\`
`,Kn=`---
title: Security Vulnerability Detection
description: Detect vulnerabilities and select lowest-risk dependency portfolios
---

Pastoralist can check dependencies against security providers and connect fixes
to the same appendix used for override tracking.

## Overview

Security checks scan your dependencies, report vulnerable packages, and can
suggest or apply package manager overrides when a safe version is available. The
appendix keeps the CVE, provider, severity, patched version, and reason with the
override.

## Quick Start

### Basic Check

\`\`\`bash
# Check for vulnerabilities and display a report
pastoralist --checkSecurity
\`\`\`

### Auto Fix

\`\`\`bash
# Automatically apply security fixes
pastoralist --checkSecurity --forceSecurityRefactor
\`\`\`

### Interactive

\`\`\`bash
# Choose which fixes to apply
pastoralist --checkSecurity --interactive
\`\`\`

### Workspaces

\`\`\`bash
# Include workspace packages in the scan
pastoralist --checkSecurity --hasWorkspaceSecurityChecks
\`\`\`

<a
  href="https://stackblitz.com/github/yowainwright/pastoralist/tree/main/tests/sandboxes/security-scan?title=Pastoralist%20Security%20Scan&file=README.md&startScript=demo&view=editor"
  target="_blank"
  rel="noopener noreferrer"
>
  <img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz" />
</a>

## Configuration

You can configure security settings in your \`package.json\`:

\`\`\`json
{
  "pastoralist": {
    "security": {
      "enabled": false,
      "provider": "osv",
      "autoFix": false,
      "interactive": false,
      "hasWorkspaceSecurityChecks": false,
      "severityThreshold": "medium",
      "excludePackages": []
    },
    "bestCase": {
      "enabled": false,
      "userOwnedOverrides": []
    }
  }
}
\`\`\`

### Configuration Options

| Option                       | Type            | Default    | Description                                                                                                                                                |
| ---------------------------- | --------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \`enabled\`                    | boolean         | \`false\`    | Enable automatic security checks when running pastoralist                                                                                                  |
| \`provider\`                   | string or array | \`"osv"\`    | Provider: \`"osv"\`, \`"github"\`, \`"npm"\`, \`"snyk"\` [EXPERIMENTAL], \`"socket"\` [EXPERIMENTAL], \`"spektion"\` [EXPERIMENTAL]                                    |
| \`autoFix\`                    | boolean         | \`false\`    | Automatically apply security fixes without prompting                                                                                                       |
| \`interactive\`                | boolean         | \`false\`    | Use interactive mode to select which fixes to apply                                                                                                        |
| \`securityProviderToken\`      | string          | \`""\`       | Authentication token for providers that require it. Prefer provider environment variables; use this only for controlled config that will not be committed. |
| \`hasWorkspaceSecurityChecks\` | boolean         | \`false\`    | Include workspace packages in security scan                                                                                                                |
| \`severityThreshold\`          | string          | \`"medium"\` | Minimum severity level to report (low, medium, high, critical)                                                                                             |
| \`excludePackages\`            | array           | \`[]\`       | List of package names to exclude from security checks                                                                                                      |
| \`strict\`                     | boolean         | \`false\`    | Fail when a provider cannot complete                                                                                                                       |

### Best-Case Portfolio Selection

Independent upgrades can interact: one package fix may introduce a
vulnerability or compatibility failure in another package. Enable \`bestCase\`
to rank complete package-version portfolios under one policy:

\`\`\`json
{
  "pastoralist": {
    "checkSecurity": true,
    "bestCase": {
      "enabled": true,
      "riskAggregation": "both",
      "search": {
        "mode": "auto",
        "exactStateLimit": 256,
        "beamWidth": 16,
        "maxEvaluations": 1000
      }
    }
  }
}
\`\`\`

Each patchable package contributes its current version, known patched versions,
and latest compatible version. Auto mode exhaustively evaluates small products
and uses deterministic beam search above the configured cap. The result includes
the selected state, decision ID, policy hash, vulnerability impact, duration,
evaluated-state count, and \`provenOptimal\` status.

Declare a package as user-owned when its active override must win over portfolio
ranking. Interactive mode also prompts before promoting a newer independent
security update and persists an approved package name.

\`\`\`json
{
  "overrides": {
    "alpha": "2.5.0"
  },
  "pastoralist": {
    "bestCase": {
      "enabled": true,
      "userOwnedOverrides": ["alpha"]
    },
    "appendix": {
      "alpha@2.5.0": {
        "ledger": {
          "addedDate": "2026-08-09T00:00:00.000Z"
        }
      }
    }
  }
}
\`\`\`

\`userOwnedOverrides\` is the machine-readable ownership declaration. The active
override supplies the constrained version. The ledger \`addedDate\` is displayed
as the human-facing “user-owned since” signal, but does not establish ownership
by itself.

The built-in evaluator scans all root packages and candidate-controlled
packages. Projects that materialize lockfiles, solve peer constraints, or model
version-combination behavior can pass a whole-state \`bestCaseEvaluator\` through
the Node.js API.

#### Formal Model

Package $i$ contributes a set of candidate versions $V_i$. The complete search
space is the Cartesian product of those sets:

$$
\\mathcal{X} = \\prod_{i=1}^{n} V_i
$$

Let $\\pi = (o_1, \\ldots, o_m, a)$ be the resolved policy, where each $o_j$ is
an objective and $a$ is the risk-aggregation mode. Each objective produces a
score block $g_{o_j,a}(x)$, and the blocks are concatenated in policy order:

$$
F_{\\pi}(x) = g_{o_1,a}(x) \\mathbin{\\Vert} \\cdots \\mathbin{\\Vert} g_{o_m,a}(x)
$$

The default blocks represent known-exploited vulnerabilities, critical
vulnerabilities, high vulnerabilities, summed EPSS, package exposures,
incompatibilities, changed packages, and oldness. With \`riskAggregation: "both"\`,
security blocks contain both unique-advisory and package-exposure values.

Pastoralist minimizes the vector lexicographically:

$$
x^* = \\operatorname*{arg\\,min}^{\\mathrm{lex}}_{x \\in \\mathcal{X}} F_{\\pi}(x)
$$

For each selected dependency $i$, the ledger reason stores the shared decision
provenance:

$$
r_i = \\left(\\mathtt{decisionId}(x^*), \\mathtt{policyHash}(\\pi),
\\mathtt{search}, \\mathtt{impact}\\right)
$$

The reason is per dependency, while the decision ID connects every dependency
selected in the same portfolio. CVE identifiers remain in the sibling \`cves\`
field rather than being duplicated in $r_i$.

## CLI Options

| Option                            | Description                                           |
| --------------------------------- | ----------------------------------------------------- |
| \`--checkSecurity\`                 | Enable security vulnerability checking                |
| \`--forceSecurityRefactor\`         | Automatically apply security fixes without prompting  |
| \`--securityProvider <provider>\`   | Specify one or more security providers                |
| \`--securityProviderToken <token>\` | Provide an authentication token for one-off/local use |
| \`--interactive\`                   | Use interactive mode to select fixes                  |
| \`--hasWorkspaceSecurityChecks\`    | Include workspace packages in the security scan       |
| \`--strict\`                        | Fail on provider, network, or API errors              |

### Token Handling

Set provider tokens with environment variables whenever possible:
\`GITHUB_TOKEN\`, \`SNYK_TOKEN\`, \`SOCKET_SECURITY_API_KEY\`, or \`SPEKTION_API_KEY\`.
\`securityProviderToken\` remains available for controlled local or generated
config, but do not commit real tokens to the repository.

## Release Assurance

Pastoralist npm releases are published from GitHub Actions with npm provenance.
The release workflow also packs the npm tarball before publishing and creates a
GitHub artifact attestation for that exact tarball.

You can inspect provenance on the npm package page and verify registry
signatures from your own project:

\`\`\`bash
npm audit signatures
\`\`\`

These checks prove where the package was built and which artifact was published.
They do not prove the code is bug-free, so the project also runs CI, CodeQL,
OpenSSF Scorecard, dependency update policy checks, and unit, integration, and
e2e tests.

## Security Providers

### OSV (Open Source Vulnerabilities)

Free and requires no token.

The [OSV database](https://osv.dev/) is a distributed vulnerability database for open source, created by Google and the open source community.

### GitHub Provider

Requires a token but provides more in-depth security awareness, including transitive dependencies.

The GitHub provider uses Dependabot alerts to check for vulnerabilities. This provider queries GitHub's Dependabot API for your repository.

#### Setup

The GitHub provider supports two authentication methods:

**Option 1: GitHub CLI**

If you have the [GitHub CLI](https://cli.github.com/) installed and authenticated, no additional setup is required:

\`\`\`bash
# Install and authenticate gh CLI
gh auth login

# Run pastoralist with GitHub provider
pastoralist --checkSecurity --securityProvider github
\`\`\`

**Option 2: Personal Access Token**

If you don't have the GitHub CLI, you can provide a GitHub token:

1. Create a personal access token at https://github.com/settings/tokens with \`repo\` scope
2. Set the token as an environment variable:
   \`\`\`bash
   export GITHUB_TOKEN="..."
   \`\`\`
3. Or pass it via CLI in one-off/local use:
   \`\`\`bash
   pastoralist --checkSecurity --securityProvider github --securityProviderToken "$GITHUB_TOKEN"
   \`\`\`

#### CI Permissions

When using the GitHub provider in CI workflows, you need to:

1. **Add workflow permissions:**

\`\`\`yaml
permissions:
  contents: read
  vulnerability-alerts: read
\`\`\`

2. **Enable Dependabot alerts** in your repository: Settings → Code security and analysis → Dependabot alerts

If permissions are insufficient, Pastoralist displays a warning and continues.

### npm Audit Provider

Runs the current package manager's audit command and converts the result into
Pastoralist security alerts.

\`\`\`bash
pastoralist --checkSecurity --securityProvider npm
\`\`\`

This provider uses the package manager detected for the project: npm, Yarn,
pnpm, or Bun.

### Snyk Provider [EXPERIMENTAL]

:::caution[Experimental]
The Snyk provider is experimental and may have breaking changes. Report issues at https://github.com/yowainwright/pastoralist/issues
:::

Requires the Snyk CLI and API authentication token.

\`\`\`bash
# Set your Snyk token
export SNYK_TOKEN="..."

# Run with Snyk provider
pastoralist --checkSecurity --securityProvider snyk
\`\`\`

### Socket Provider [EXPERIMENTAL]

:::caution[Experimental]
The Socket provider is experimental and may have breaking changes. Report issues at https://github.com/yowainwright/pastoralist/issues
:::

Requires the Socket CLI and API key.

\`\`\`bash
# Set your Socket API key
export SOCKET_SECURITY_API_KEY=your_key_here

# Run with Socket provider
pastoralist --checkSecurity --securityProvider socket
\`\`\`

### Spektion Provider [EXPERIMENTAL]

:::caution[Experimental]
The Spektion provider is experimental and may have breaking changes. Report issues at https://github.com/yowainwright/pastoralist/issues
:::

Requires a Spektion API key.

\`\`\`bash
# Set your Spektion API key
export SPEKTION_API_KEY=your_key_here

# Run with Spektion provider
pastoralist --checkSecurity --securityProvider spektion
\`\`\`

## CVE Tracking in the Ledger

Every appendix entry has a \`ledger\`. When a security provider detects a fix,
Pastoralist adds CVE, severity, provider, and vulnerable-range metadata to that
ledger alongside the \`addedDate\`:

\`\`\`json
{
  "lodash@4.17.21": {
    "dependents": { "my-app": "lodash@^4.17.0" },
    "ledger": {
      "addedDate": "2026-05-30T00:00:00.000Z",
      "source": "security",
      "securityChecked": true,
      "securityProvider": "osv",
      "cves": ["CVE-2021-23337"],
      "cveDetails": [
        {
          "cve": "CVE-2021-23337",
          "severity": "high",
          "patchedVersion": "4.17.21"
        }
      ],
      "severity": "high",
      "vulnerableRange": "<4.17.21",
      "patchedVersion": "4.17.21"
    }
  }
}
\`\`\`

Multiple CVEs from the same package are aggregated — \`cveDetails\` gives per-CVE granularity (severity and patched version per identifier), while \`cves\` is the deduplicated flat list for quick reference.

\`reason\` accepts a non-empty string or a typed \`project\` or \`best-case\` object.
A best-case reason links each dependency entry to the shared portfolio decision;
the fixed CVEs remain in the sibling \`cves\` field.

## Keeping Security Overrides with \`keep\`

By default, \`--remove-unused\` removes overrides whose dependents no longer
require them. For security overrides you want to retain, set \`keep\` on the
ledger:

\`\`\`json
{
  "ledger": {
    "addedDate": "2026-05-30T00:00:00.000Z",
    "cves": ["CVE-2024-12345"],
    "keep": true
  }
}
\`\`\`

For expiring keeps, use a \`KeepConstraint\` object:

\`\`\`json
{
  "ledger": {
    "addedDate": "2026-05-30T00:00:00.000Z",
    "cves": ["CVE-2024-12345"],
    "keep": {
      "reason": "Waiting for upstream patch",
      "untilVersion": "4.18.0"
    }
  }
}
\`\`\`

Once the root dependency reaches \`4.18.0\`, the keep is expired and
\`--remove-unused\` can treat it as removable again.

## How It Works

1. **Scanning**: Pastoralist extracts all dependencies from your \`package.json\` (and optionally workspace packages)
2. **Checking**: Dependencies are checked against the configured provider or providers
3. **Reporting**: Vulnerable packages are displayed with severity levels and available fixes
4. **Fixing**: If fixes are available, Pastoralist can:
   - Display them for review
   - Apply them automatically (with \`--forceSecurityRefactor\`)
   - Let you choose interactively (with \`--interactive\`)
5. **Applying**: Selected fixes are added to your \`package.json\` overrides section with full CVE context in the ledger

## Example Output

\`\`\`text
pastoralist checking for security vulnerabilities...

Security Check Report
==================================================

Found 3 vulnerable package(s):

lodash@4.17.20
   Prototype Pollution
   CVE: CVE-2021-23337
   Fix available: 4.17.21
   https://osv.dev/vulnerability/GHSA-35jh-r3h4-6jhm

minimist@1.2.5
   Prototype Pollution
   CVE: CVE-2021-44906
   Fix available: 1.2.6
   https://osv.dev/vulnerability/GHSA-xvch-5gv4-984h

Generated 2 override(s):

  "lodash": "4.17.21" // Security fix: Prototype Pollution (high)
  "minimist": "1.2.6" // Security fix: Prototype Pollution (medium)
\`\`\`

## Performance Considerations

:::caution[Performance Impact]

- Security scanning is **disabled by default** for CLI config and enabled by default in the GitHub Action
- Workspace scanning is **opt-in** via the \`hasWorkspaceSecurityChecks\` option
- The OSV provider is optimized for batch queries
- Provider results can be cached using the CLI cache options
- Results are processed in parallel when possible
- Best-case results record duration and evaluated-state count
  :::

## Limitations

:::note[Current Limitations]

- Security checks focus on npm ecosystem packages
- Some providers require credentials or local CLI access
- Some vulnerabilities may not have available fixes
  :::

## Troubleshooting

### No vulnerabilities found when expected

- Ensure you're using the latest version of Pastoralist
- Check that your dependencies are correctly specified in \`package.json\`
- Try running with \`--debug\` to see detailed logs

### Fixes not being applied

- Verify you have write permissions to \`package.json\`
- Check for existing overrides that might conflict
- Ensure the package manager supports overrides

### Performance issues

- Disable workspace scanning if not needed
- Consider excluding large dependency trees with \`excludePackages\`
- Use severity threshold to limit results

### GitHub provider shows "security check skipped"

This happens when the GitHub API can't access Dependabot alerts. To fix:

1. Add \`vulnerability-alerts: read\` permission to your workflow
2. Enable Dependabot alerts in Settings → Code security and analysis
3. Ensure the \`GITHUB_TOKEN\` is available in your workflow

Pastoralist will show specific guidance in the warning message.

## Example: CI Integration

### GitHub Actions

\`\`\`yaml
name: Security Check
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      vulnerability-alerts: read # Required for GitHub provider
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v6.4.0
      - run: npm install
      - run: npx pastoralist --checkSecurity --securityProvider github
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
\`\`\`

For OSV provider (no permissions needed):

\`\`\`yaml
name: Security Check
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v6.4.0
      - run: npm install
      - run: npx pastoralist --checkSecurity
\`\`\`

### GitLab CI

\`\`\`yaml
security:
  script:
    - npm install
    - npx pastoralist --checkSecurity
  only:
    - main
    - merge_requests
\`\`\`
`,qn=`---
title: Setup
description: "Install Pastoralist and keep your override appendix current"
---

## Install

Add Pastoralist as a dev dependency:

\`\`\`bash
npm install pastoralist --save-dev
\`\`\`

Other package managers work too:

\`\`\`bash
pnpm add pastoralist --save-dev
yarn add pastoralist --dev
bun add pastoralist --dev
\`\`\`

For a global CLI, install with npm or Homebrew:

\`\`\`bash
npm install --global pastoralist
brew install yowainwright/tap/pastoralist
\`\`\`

## Initialize

Check your dependency overrides without touching \`package.json\`:

\`\`\`bash
npx pastoralist doctor
\`\`\`

\`doctor\` shows a summary of your dependency overrides.

The \`onboard\` command shows setup steps for local use, agents, and CI.

\`\`\`bash
npx pastoralist onboard
\`\`\`

Install the Pastoralist agent skill in a repo:

\`\`\`bash
npx pastoralist --init agent-skill
\`\`\`

Set up local dev with selected skills and hooks:

\`\`\`bash
pnpm run setup:local-dev -- --skills all --hooks git,postinstall
\`\`\`

Run the guided setup:

\`\`\`bash
npx pastoralist init
\`\`\`

The init command can detect workspaces, set up security checks, and save settings
in a config file.

For a simple project, you can also run Pastoralist directly:

\`\`\`bash
npx pastoralist
\`\`\`

Pastoralist checks dependency overrides and updates its appendix; it does this
without touching other package settings.

## Add The Install Hook

Most projects should run Pastoralist after dependency installs:

\`\`\`json
{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
\`\`\`

Pastoralist can add that hook automatically:

\`\`\`bash
npx pastoralist --setup-hook
\`\`\`

## Verify Changes

Preview the package.json update before writing anything:

\`\`\`bash
npx pastoralist --dry-run
\`\`\`

Print summary metrics for CI or release checks:

\`\`\`bash
npx pastoralist --summary
\`\`\`

Remove overrides that no package still depends on:

\`\`\`bash
npx pastoralist --remove-unused
\`\`\`

## Common Starting Config

For a workspace project with OSV security checks:

\`\`\`json
{
  "pastoralist": {
    "depPaths": "workspace",
    "checkSecurity": true,
    "security": {
      "provider": "osv",
      "severityThreshold": "medium",
      "hasWorkspaceSecurityChecks": true
    }
  }
}
\`\`\`

Read [Configuration](/docs/configuration) for all options or
[Workspaces & Monorepos](/docs/workspaces) for monorepo setup.
`,Jn=`---
title: Troubleshooting & FAQ
description: Common issues and frequently asked questions
---

## Frequently Asked Questions

### What is pastoralist?

Pastoralist manages npm and Bun \`overrides\`, pnpm \`pnpm.overrides\`, and Yarn
\`resolutions\` by creating an appendix that documents why each override exists
and which packages depend on it.

### Why do I need pastoralist?

Without pastoralist, it's easy to forget why an override was added, which
packages still need it, or whether it's safe to remove.

### Does pastoralist work with Yarn, pnpm, and Bun?

Yes. Pastoralist reads and writes the override field your package manager uses:

- **npm and Bun**: \`overrides\`
- **pnpm**: \`pnpm.overrides\`
- **Yarn**: \`resolutions\`

### Is pastoralist safe to use?

Pastoralist is designed to keep changes reviewable:

- Only modifies override/resolution fields and the \`pastoralist\` section of \`package.json\`
- Normalizes \`package.json\` output to two-space JSON
- Leaves changes visible in git so you can review or revert them
- Creates a temporary backup before security auto-fix writes package.json

### When should overrides be used?

Use overrides for:

- Security patches before upstream updates
- Compatibility issues between packages
- Bug fixes not yet released
- Temporary workarounds

## Common Issues

### Overrides Not Being Removed

**Problem:** Pastoralist isn't removing overrides that seem unnecessary.

**Solution:** The override might still be needed by a transitive dependency. Run with debug mode to see why:

\`\`\`bash
npx pastoralist --debug
\`\`\`

Look for output showing which packages require the override.

### package.json Formatting Changes

**Problem:** Pastoralist changes the formatting of my \`package.json\`.

**Solution:** Pastoralist rewrites \`package.json\` as two-space JSON. If you see unexpected changes:

1. Ensure you're using the latest version
2. Check if you have a \`.prettierrc\` or \`.editorconfig\` that might conflict
3. Consider running a formatter after pastoralist

### Patches Not Detected

**Problem:** My patch files aren't being tracked in the appendix.

**Solution:** Ensure patches follow the standard naming convention:

\`\`\`
patches/
├── package-name+1.0.0.patch    # Correct
├── package-name@1.0.0.patch    # Incorrect
└── custom-patch.patch          # Won't be detected
\`\`\`

### Performance Issues

**Problem:** Pastoralist takes a long time to run.

**Solution:** For large monorepos:

1. Run on specific packages instead of all at once
2. Use \`--ignore\` to skip unnecessary directories
3. Run packages in parallel:

\`\`\`bash
# Instead of
pastoralist --depPaths "**/package.json"

# Try
find . -name "package.json" -not -path "*/node_modules/*" | \\
  xargs -P 4 -I {} npx pastoralist --path {}
\`\`\`

### Monorepo Override Conflicts

**Problem:** Different packages in my monorepo need different versions.

**Solution:** Use package-specific overrides:

Root package.json can hold shared security patches:

\`\`\`json
{
  "overrides": {
    "minimist": "1.2.8"
  }
}
\`\`\`

Packages can hold their own compatibility requirements:

\`\`\`json
{
  "overrides": {
    "react": "17.0.2"
  }
}
\`\`\`

### CI Failures

**Problem:** CI fails saying \`package.json\` was modified.

**Solution:** Run pastoralist locally and commit the changes:

\`\`\`bash
npx pastoralist
git add package.json
git commit -m "Update override appendix"
\`\`\`

Then add to your CI check:

\`\`\`yaml
- run: npx pastoralist
- run: git diff --exit-code package.json
\`\`\`

## Debug Mode

Enable debug mode for detailed information:

\`\`\`bash
npx pastoralist --debug
\`\`\`

Debug output includes:

- Package resolution paths
- Dependency tree analysis
- Override usage detection
- File operation details

## Error Messages

### "Cannot find package.json"

Pastoralist can't locate your \`package.json\`. Solutions:

- Run from project root
- Use \`--path\` to specify location
- Check file permissions

### "Invalid package.json"

Your \`package.json\` has syntax errors. Validate with:

\`\`\`bash
npx json package.json
\`\`\`

### "No overrides found"

This is normal if you don't have any overrides. Pastoralist will:

- Clean up any existing appendix
- Exit successfully

## Best Practices

### 1. Regular Updates

Run pastoralist regularly:

\`\`\`json
{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
\`\`\`

### 2. Document Override Reasons

\`package.json\` does not support comments. Every appendix entry has a \`ledger\`;
add a \`reason\` to it (or provide manual reasons when you generate the appendix):

\`\`\`json
{
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "appendix": {
      "lodash@4.17.21": {
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "reason": "CVE-2021-12345 fix",
          "source": "manual"
        }
      }
    }
  }
}
\`\`\`

### 3. Monitor Patch Files

When you see this warning:

\`\`\`
🐑 Found potentially unused patch files:
  - patches/old-package+1.0.0.patch
\`\`\`

Review and remove unused patches to keep your repo clean.

## Getting Help

### Resources

- [GitHub Issues](https://github.com/yowainwright/pastoralist/issues) - Report bugs and ask questions

### Before Filing an Issue

1. Update to the latest version
2. Run with \`--debug\` flag
3. Check existing issues
4. Provide minimal reproduction

### Issue Template

When reporting issues, include:

- Pastoralist version
- Node.js version
- Package manager (npm, Yarn, pnpm, or Bun)
- Relevant package.json sections
- Debug output

## Migration Help

### From Manual Management

If you're tracking overrides manually in docs or issue trackers, Pastoralist will:

1. Document all current overrides in \`pastoralist.appendix\`
2. Track their usage going forward
3. Flag unused overrides and remove them when you run with \`--remove-unused\`

## Advanced Debugging

### Trace Dependency Paths

To understand why an override is needed:

\`\`\`javascript
// debug-override.js
import { resolveJSON, update } from "pastoralist";

const path = "./package.json";
const config = resolveJSON(path);

if (config) {
  update({ config, debug: true, path });
}

// Check the debug output for dependency paths
\`\`\`

### Analyze Appendix

\`\`\`javascript
// analyze-appendix.js
import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
const appendix = pkg.pastoralist?.appendix || {};

console.log("Override Report:");
Object.entries(appendix).forEach(([override, info]) => {
  console.log(\`\\n\${override}:\`);
  console.log("  Dependents:", Object.keys(info.dependents || {}));
  console.log("  Patches:", info.patches || "none");
});
\`\`\`
`,Yn=`---
title: Workspaces & Monorepos
description: Using pastoralist in workspace and monorepo environments
---

Pastoralist works with workspace and monorepo setups. This guide covers how to
track root-level overrides while still showing which workspace packages depend
on them.

<a
  href="https://stackblitz.com/github/yowainwright/pastoralist/tree/main/tests/sandboxes/monorepo?title=Pastoralist%20Monorepo&file=README.md&startScript=demo&view=editor"
  target="_blank"
  rel="noopener noreferrer"
>
  <img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz" />
</a>

## How Pastoralist Works in Workspaces

Pastoralist updates one target \`package.json\`, usually the workspace root. When
\`depPaths\` is configured, it also reads workspace package manifests so the root
appendix can show which packages still need each override.

You can also run it against an individual workspace package with \`--path\` when
that package owns its own override field.

## Configuration Methods

Pastoralist can configure workspace scanning in three ways:

### Method 1: depPaths in package.json

Configure dependency paths directly in your \`package.json\` for workspace
tracking:

\`\`\`json
{
  "name": "my-monorepo",
  "workspaces": ["packages/*", "apps/*"],
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "depPaths": "workspace"
  },
  "scripts": {
    "postinstall": "pastoralist"
  }
}
\`\`\`

**Using \`"workspace"\` string** - Pastoralist uses all packages defined in your \`workspaces\` field. The appendix only appears in the root; workspace packages stay clean.

**Using array of paths** - Specify custom paths to scan:

\`\`\`json
{
  "pastoralist": {
    "depPaths": ["packages/app-a/package.json", "packages/app-b/package.json"]
  }
}
\`\`\`

After running \`pastoralist\`, your root package.json will contain:

\`\`\`json
{
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "depPaths": "workspace",
    "appendix": {
      "lodash@4.17.21": {
        "dependents": {
          "app-a": "lodash@^4.17.0",
          "app-b": "lodash@^4.17.0",
          "package-c": "lodash@^4.17.0"
        },
        "ledger": {
          "addedDate": "2026-05-30T00:00:00.000Z",
          "source": "manual"
        }
      }
    }
  }
}
\`\`\`

The workspace packages (\`packages/*/package.json\` and \`apps/*/package.json\`) remain clean without any pastoralist appendix.

### Method 2: CLI depPaths Flag

Specify paths at runtime:

\`\`\`bash
# Scan specific paths
pastoralist --depPaths "packages/*/package.json" "apps/*/package.json"

# CLI flags override package.json configuration
pastoralist --depPaths "packages/app-a/package.json"
\`\`\`

### Method 3: Guided Configuration

Pastoralist offers guided configuration for monorepo setups:

\`\`\`bash
# Initialize with guided setup
pastoralist init
\`\`\`

The initializer can:

- Detect \`workspaces\` entries from \`package.json\`
- Let you choose \`depPaths: "workspace"\` or custom package globs
- Save configuration to \`package.json\` or a supported config file
- Optionally configure security scanning

## Basic Usage

### Running on Root Package

\`\`\`bash
# Run on the root package.json
pastoralist
\`\`\`

This manages overrides in your root \`package.json\`, which affect all workspaces.

### Running on Workspace Packages

\`\`\`bash
# Run on a specific workspace package
pastoralist --path packages/app-a/package.json

# Or navigate to the package
cd packages/app-a
pastoralist
\`\`\`

## Common Patterns

### Pattern 1: Root-Level Overrides

Most monorepos use root-level overrides that apply to all workspaces:

\`\`\`json
{
  "name": "my-monorepo",
  "workspaces": ["packages/*"],
  "overrides": {
    "lodash": "4.17.21",
    "react": "18.2.0"
  }
}
\`\`\`

Run pastoralist at the root:

\`\`\`bash
pastoralist
\`\`\`

### Pattern 2: Package-Specific Overrides

Some packages may need their own overrides:

\`\`\`json
{
  "name": "legacy-app",
  "overrides": {
    "react": "17.0.2"
  }
}
\`\`\`

Run pastoralist for this package:

\`\`\`bash
pastoralist --path packages/legacy-app/package.json
\`\`\`

### Pattern 3: Automated Workspace Management

Most workspaces should avoid running Pastoralist separately in every package.
Keep shared overrides at the root and let \`depPaths\` read workspace manifests:

\`\`\`json
{
  "workspaces": ["packages/*", "apps/*"],
  "pastoralist": {
    "depPaths": "workspace"
  },
  "scripts": {
    "pastoralist": "pastoralist"
  }
}
\`\`\`

Use \`--path\` only for workspace packages that intentionally own their own
override field.

## Integration Strategies

### Strategy 1: Centralized Management with depPaths

Keep all overrides in the root \`package.json\` and use \`depPaths\` configuration:

\`\`\`json
{
  "workspaces": ["packages/*", "apps/*"],
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "depPaths": "workspace"
  },
  "scripts": {
    "postinstall": "pastoralist"
  }
}
\`\`\`

### Strategy 2: Distributed Management

Allow packages to manage their own overrides only when those overrides are
package-specific:

\`\`\`json
{
  "overrides": {
    "react": "17.0.2"
  },
  "scripts": {
    "pastoralist": "pastoralist --path package.json"
  }
}
\`\`\`

### Strategy 3: Hybrid Approach

Combine root overrides with package-specific ones:

Root overrides can hold shared security patches:

\`\`\`json
{
  "overrides": {
    "minimist": "1.2.8"
  }
}
\`\`\`

Package overrides can hold feature-specific constraints:

\`\`\`json
{
  "overrides": {
    "react": "17.0.2"
  }
}
\`\`\`

## Package Manager Examples

### npm Workspaces

\`\`\`json
{
  "name": "my-npm-workspace",
  "workspaces": ["packages/*", "apps/*"],
  "pastoralist": {
    "depPaths": "workspace"
  },
  "scripts": {
    "check-overrides": "pastoralist --dry-run"
  }
}
\`\`\`

### pnpm Workspace

\`\`\`yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
  - "apps/*"
\`\`\`

\`\`\`json
{
  "pastoralist": {
    "depPaths": "workspace"
  },
  "scripts": {
    "check-overrides": "pastoralist --dry-run"
  }
}
\`\`\`

### Yarn Workspaces

\`\`\`json
{
  "private": true,
  "workspaces": {
    "packages": ["packages/*"]
  },
  "pastoralist": {
    "depPaths": "workspace"
  },
  "scripts": {
    "check-overrides": "pastoralist --dry-run"
  }
}
\`\`\`

## Best Practices

### CI Integration

Ensure overrides are valid in CI:

\`\`\`yaml
- name: Validate overrides
  run: |
    npx pastoralist
    git diff --exit-code package.json
\`\`\`

## Troubleshooting

### Issue: Overrides Not Applied

**Symptom:** Workspace packages don't respect root overrides

**Solution:** Use a package manager that supports workspace overrides:

- npm 8.3+ ✅
- yarn 1.x (use resolutions) ✅
- pnpm (use pnpm.overrides) ✅

### Issue: Duplicate Appendix Entries

**Symptom:** Same override tracked in multiple package.json files

**Solution:** If the override is shared, move it to the root package and use
\`depPaths: "workspace"\`. If each package owns a different override, separate
appendixes are expected.

### Issue: Performance in Large Monorepos

**Symptom:** Pastoralist takes long to run across many packages

**Solution:** First prefer \`depPaths: "workspace"\` so one root run reads the
workspace manifests. If you must scan packages individually, make sure your file
search excludes \`node_modules\`:

\`\`\`bash
# Using GNU parallel for package-owned override fields
find . -name "node_modules" -prune -o -name "package.json" -print | \\
  parallel "pastoralist --path {}"
\`\`\`

## Migration Guide

### Moving to Centralized Overrides

1. Collect all overrides:

\`\`\`bash
find . -name "package.json" -not -path "*/node_modules/*" \\
  -exec jq '.overrides // {}' {} \\; | jq -s 'add'
\`\`\`

2. Add to root package.json
3. Remove from individual packages
4. Run pastoralist at root

### Splitting Overrides

1. Identify package-specific needs
2. Move relevant overrides to packages
3. Run pastoralist on each package
4. Update CI scripts
`,Xn=[{slug:`introduction`,title:`Introduction to Pastoralist`,description:`Pastoralist keeps dependency overrides explainable, current, and removable`},{slug:`setup`,title:`Setup`,description:`Install Pastoralist and keep your override appendix current`},{slug:`onboarding`,title:`Onboarding`,description:`First-run checklist for local use, agent setup, and CI`},{slug:`security`,title:`Security Vulnerability Detection`,description:`Detect vulnerabilities and select lowest-risk dependency portfolios`,usesMath:!0},{slug:`workspaces`,title:`Workspaces & Monorepos`,description:`Using pastoralist in workspace and monorepo environments`},{slug:`advanced-features`,title:`Advanced Features`,description:`Advanced cleanup, patch tracking, and override management workflows`},{slug:`codelab`,title:`Interactive Tutorial`,description:`Learn Pastoralist step by step`},{slug:`api-reference`,title:`API Reference`,description:`Complete reference for pastoralist CLI and Node.js API`},{slug:`architecture`,title:`Architecture`,description:`How Pastoralist reads overrides, writes the appendix, tracks patches, and handles cleanup`},{slug:`troubleshooting`,title:`Troubleshooting & FAQ`,description:`Common issues and frequently asked questions`},{slug:`configuration`,title:`Configuration`,description:`Configure Pastoralist with package.json, rc files, or JavaScript config files`},{slug:`github-action`,title:`GitHub Action`,description:`Automated dependency override management for CI`}],Zn=`modulepreload`,Qn=function(e){return`/pastoralist/`+e},$n={},U=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?import.meta.resolve(e):new URL(e,import.meta.url).href}r=o(t.map(t=>{if(t=Qn(t,n),t=s(t),t in $n)return;$n[t]=!0;let r=t.endsWith(`.css`);for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}let i=document.createElement(`link`);if(i.rel=r?`stylesheet`:Zn,r||(i.as=`script`),i.crossOrigin=``,i.href=t,a&&i.setAttribute(`nonce`,a),document.head.appendChild(i),r)return new Promise((e,n)=>{i.addEventListener(`load`,e),i.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},er=Object.fromEntries(Object.entries(Object.assign({"./docs/advanced-features.mdx":()=>U(()=>import(`./advanced-features-C9VqCi7o.js`),__vite__mapDeps([0,1,2])),"./docs/api-reference.mdx":()=>U(()=>import(`./api-reference-BcVfGAIF.js`),__vite__mapDeps([3,1,2])),"./docs/architecture.mdx":()=>U(()=>import(`./architecture-DU_oH-zq.js`),__vite__mapDeps([4,1,2])),"./docs/codelab.mdx":()=>U(()=>import(`./codelab-CA0RTGV2.js`),__vite__mapDeps([5,1,2])),"./docs/configuration.mdx":()=>U(()=>import(`./configuration-Be84_gUc.js`),__vite__mapDeps([6,1,2])),"./docs/github-action.mdx":()=>U(()=>import(`./github-action-BSxmJXbk.js`),__vite__mapDeps([7,1,2])),"./docs/introduction.mdx":()=>U(()=>import(`./introduction-C8xlsd68.js`),__vite__mapDeps([8,1,2])),"./docs/onboarding.mdx":()=>U(()=>import(`./onboarding-ClhmbJKa.js`),__vite__mapDeps([9,1,2])),"./docs/security.mdx":()=>U(()=>import(`./security-DdKPERJx.js`),__vite__mapDeps([10,1,2])),"./docs/setup.mdx":()=>U(()=>import(`./setup-C3cLmw_d.js`),__vite__mapDeps([11,1,2])),"./docs/troubleshooting.mdx":()=>U(()=>import(`./troubleshooting-B065SsTQ.js`),__vite__mapDeps([12,1,2])),"./docs/workspaces.mdx":()=>U(()=>import(`./workspaces-mXpcFZit.js`),__vite__mapDeps([13,1,2]))})).map(([e,t])=>[e,(0,y.lazy)(t)])),tr=Object.assign({"./docs/advanced-features.mdx":Rn,"./docs/api-reference.mdx":zn,"./docs/architecture.mdx":Bn,"./docs/codelab.mdx":Vn,"./docs/configuration.mdx":Hn,"./docs/github-action.mdx":Un,"./docs/introduction.mdx":Wn,"./docs/onboarding.mdx":Gn,"./docs/security.mdx":Kn,"./docs/setup.mdx":qn,"./docs/troubleshooting.mdx":Jn,"./docs/workspaces.mdx":Yn});function nr(e){return Xn.find(t=>t.slug===e)}function rr(e){return tr[`./docs/${e}.mdx`]}function ir(e){return er[`./docs/${e}.mdx`]}function ar(){return Xn}var or=(e,t)=>e.map(({title:e,description:n,slug:r})=>({title:e,description:n,content:t(r)??``,slug:r})),sr=e=>new g(e,{keys:[`title`,`description`,`content`],threshold:.3,ignoreLocation:!0}),cr=(e,t)=>{let n=t.trim();return n?e.search(n).slice(0,5).map(e=>e.item):[]},lr=e(i(),1),ur=(e,t)=>{let n=(0,y.useMemo)(()=>sr(e),[e]);return(0,y.useMemo)(()=>cr(n,t),[t,n])},dr=(e,t)=>{(0,y.useEffect)(()=>{let n=n=>{(n.metaKey||n.ctrlKey)&&n.key===`k`&&(n.preventDefault(),e()),n.key===`Escape`&&t()};return document.addEventListener(`keydown`,n),()=>document.removeEventListener(`keydown`,n)},[t,e])};function fr({onOpen:e}){return(0,C.jsxs)(`button`,{onClick:e,className:`btn btn-sm btn-ghost gap-1`,"aria-label":`Search (⌘K)`,children:[(0,C.jsx)(sn,{className:`h-4 w-4`}),(0,C.jsx)(`kbd`,{className:`hidden rounded bg-base-200 px-1.5 py-0.5 text-xs font-medium text-base-content/60 lg:inline-flex`,children:`⌘K`})]})}function pr({iconOnly:e,onOpen:t}){return e?(0,C.jsx)(fr,{onOpen:t}):(0,C.jsxs)(`button`,{onClick:t,className:`flex min-w-[200px] items-center gap-2 rounded-lg bg-base-200/50 px-3 py-1.5 text-sm text-base-content/60 transition-colors hover:bg-base-200 md:min-w-[300px]`,children:[(0,C.jsx)(sn,{className:`h-4 w-4`}),(0,C.jsx)(`span`,{children:`Search documentation...`})]})}function mr({onSelect:e}){return(0,C.jsxs)(`nav`,{className:`space-y-1 p-4`,"aria-label":`Recent documentation`,children:[(0,C.jsx)(`p`,{className:`px-2 text-xs font-medium uppercase text-base-content/40`,children:`Recent`}),(0,C.jsx)(hr,{slug:`introduction`,onSelect:e,title:`Introduction to Pastoralist`}),(0,C.jsx)(hr,{slug:`setup`,onSelect:e,title:`Setup Guide`})]})}function hr({slug:e,title:t,onSelect:n}){return(0,C.jsx)(s,{to:`/docs/$slug/`,params:{slug:e},onClick:n,className:`block rounded-lg px-3 py-2 text-sm hover:bg-base-200/50`,children:t})}function gr({query:e,results:t,onSelect:n}){return e?t.length===0?(0,C.jsx)(`p`,{className:`p-8 text-center text-base-content/60`,children:`No results found`}):(0,C.jsx)(`ul`,{className:`space-y-1 p-2`,children:t.map(e=>(0,C.jsx)(_r,{result:e,onSelect:n},e.slug))}):(0,C.jsx)(mr,{onSelect:n})}function _r({result:e,onSelect:t}){let{slug:n,title:r,description:i}=e;return(0,C.jsx)(`li`,{children:(0,C.jsxs)(s,{to:`/docs/$slug/`,params:{slug:n},onClick:t,className:`block rounded-lg px-4 py-3 transition-colors hover:bg-base-200/50`,children:[(0,C.jsx)(`strong`,{className:`block`,children:r}),(0,C.jsx)(`span`,{className:`mt-0.5 block text-sm text-base-content/60`,children:i})]})})}function vr({query:e,results:t,inputRef:n,onQueryChange:r,onClose:i}){return(0,lr.createPortal)((0,C.jsx)(`div`,{className:`fixed inset-0 z-[101] bg-black/60 p-4 pt-[10vh] backdrop-blur-sm`,onClick:i,children:(0,C.jsxs)(`section`,{className:`mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-2xl`,onClick:e=>e.stopPropagation(),children:[(0,C.jsx)(yr,{query:e,inputRef:n,onQueryChange:r}),(0,C.jsx)(`div`,{className:`max-h-[60vh] overflow-y-auto`,children:(0,C.jsx)(gr,{query:e,results:t,onSelect:i})})]})}),document.body)}function yr({query:e,inputRef:t,onQueryChange:n}){return(0,C.jsxs)(`label`,{className:`flex items-center border-b border-base-content/10 p-4`,children:[(0,C.jsx)(sn,{className:`mr-3 h-5 w-5 text-[#1D4ED8]`}),(0,C.jsx)(`input`,{ref:t,value:e,onChange:e=>n(e.target.value),placeholder:`Search documentation...`,className:`flex-1 bg-transparent text-lg outline-none`})]})}function br(e){let[t,n]=(0,y.useState)(!1),[r,i]=(0,y.useState)(``),a=(0,y.useRef)(null),o=ur(e,r),s=(0,y.useCallback)(()=>n(!0),[]),c=(0,y.useCallback)(()=>{n(!1),i(``)},[]);return dr(s,c),(0,y.useEffect)(()=>{t&&a.current?.focus()},[t]),{isOpen:t,open:s,props:{query:r,results:o,inputRef:a,onQueryChange:i,onClose:c}}}function xr({searchData:e,iconOnly:t=!1}){let{isOpen:n,open:r,props:i}=br(e);return(0,C.jsxs)(C.Fragment,{children:[(0,C.jsx)(pr,{iconOnly:t,onOpen:r}),n&&(0,C.jsx)(vr,{...i})]})}var Sr=[{title:`Docs`,href:`/docs/introduction`,preload:`intent`}],Cr=or(ar(),rr);function wr(){return(0,C.jsx)(`header`,{className:`fixed top-0 z-[1000] w-full`,children:(0,C.jsxs)(`nav`,{className:`grid h-[68px] w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 border-b border-base-content/10 bg-base-100/80 px-2 py-2 backdrop-blur-3xl sm:gap-2 sm:px-4`,children:[(0,C.jsx)(Tr,{}),(0,C.jsx)(`div`,{className:`justify-self-center`}),(0,C.jsx)(Er,{})]})})}function Tr(){return(0,C.jsxs)(`div`,{className:`flex min-w-0 items-center gap-1 justify-self-start`,children:[(0,C.jsx)(`label`,{htmlFor:`my-drawer-2`,className:`btn btn-sm btn-ghost btn-square lg:hidden`,"aria-label":`toggle sidebar`,children:(0,C.jsx)(nn,{className:`h-4 w-4`})}),(0,C.jsx)(s,{to:`/`,preload:`intent`,className:`btn btn-ghost min-w-0 px-1.5 sm:px-2`,children:(0,C.jsx)(`h1`,{className:`gradient-text truncate text-lg font-bold sm:text-2xl`,children:`Pastoralist`})})]})}function Er(){return(0,C.jsxs)(`div`,{className:`flex items-center gap-1 justify-self-end`,children:[(0,C.jsx)(Or,{}),(0,C.jsx)(xr,{searchData:Cr,iconOnly:!0}),(0,C.jsx)(`a`,{className:`btn btn-sm btn-ghost btn-square`,href:`https://github.com/yowainwright/pastoralist`,"aria-label":`github`,children:(0,C.jsx)(un,{className:`h-4 w-4`})}),(0,C.jsx)(kr,{})]})}function Dr(e,t){let n=t.includes(`/docs`),r=e.includes(`/docs`);return`rounded-lg hover:text-[#1D4ED8] hover:bg-[#1D4ED8]/10 transition flex ${(n?r:e===t)?`text-[#1D4ED8] bg-[#1D4ED8]/10`:``}`}function Or(){let{pathname:e}=u(),t=Sr.map(t=>(0,C.jsx)(s,{to:t.href,preload:`intent`,className:`btn btn-sm btn-ghost hidden sm:flex ${Dr(e,t.href)}`,children:t.title},t.href));return(0,C.jsx)(C.Fragment,{children:t})}function kr(){let{theme:e,toggle:t}=Ln();return(0,C.jsxs)(`button`,{"aria-label":`theme-toggle`,onClick:t,className:`btn btn-sm btn-ghost swap swap-rotate btn-square ${e===`night`?`swap-active`:``}`,children:[(0,C.jsx)(ln,{className:`w-4 h-4 swap-off`}),(0,C.jsx)(an,{className:`w-4 h-4 swap-on`})]})}function Ar(e){let t=`/pastoralist`;return e===``?t.endsWith(`/`)?t.slice(0,-1):t:(t.endsWith(`/`)?t:t+`/`)+(e.startsWith(`/`)?e.slice(1):e)}function jr(e){return Ar(`docs/${e}`)}var W=(e,t)=>({title:e,href:jr(t)}),Mr=[W(`Introduction`,`introduction`),W(`Setup`,`setup`),W(`Onboarding`,`onboarding`)],Nr=[W(`Security Scanning`,`security`),W(`Workspaces & Monorepos`,`workspaces`),W(`Advanced Features`,`advanced-features`)],Pr=[W(`Basic Usage`,`codelab`)],Fr=[W(`API Reference`,`api-reference`),W(`GitHub Action`,`github-action`),W(`Architecture`,`architecture`),W(`Troubleshooting & FAQ`,`troubleshooting`)],Ir=[{title:`Getting Started`,items:Mr},{title:`Features`,items:Nr},{title:`Codelabs`,items:Pr},{title:`Reference`,items:Fr}],Lr=(e,t)=>e.map((e,n)=>n===t?!e:e);function Rr({onClose:e=()=>void 0}){return(0,C.jsxs)(`aside`,{className:`drawer-side`,children:[(0,C.jsx)(`label`,{htmlFor:`my-drawer-2`,className:`drawer-overlay lg:hidden bg-transparent`,onClick:e}),(0,C.jsx)(`nav`,{className:`w-64 bg-base-100 z-20 sticky top-[68px] h-[calc(100vh-68px)] overflow-y-auto border-r border-base-content/10`,children:(0,C.jsx)(zr,{})})]})}function zr(){let e=u().pathname,[t,n]=(0,y.useState)(()=>Ir.map(()=>!0)),r=e=>{n(t=>Lr(t,e))},i=Ir.map((n,i)=>(0,C.jsx)(Br,{section:n,isOpen:t[i],onToggle:()=>r(i),pathname:e},n.title));return(0,C.jsx)(`section`,{className:`px-3 pt-2 space-y-3`,children:i})}function Br({section:e,isOpen:t,onToggle:n,pathname:r}){let i=`sidebar-content ${t?``:`hidden`}`;return(0,C.jsxs)(`article`,{className:`sidebar-section`,children:[(0,C.jsx)(Vr,{title:e.title,isOpen:t,onToggle:n}),(0,C.jsx)(`nav`,{className:i,children:(0,C.jsx)(`ul`,{className:`ml-2 mt-1 border-l-2 border-base-content/10 space-y-0.5 py-1`,children:e.items.map(e=>(0,C.jsx)(Hr,{item:e,pathname:r},e.href))})})]})}function Vr({title:e,isOpen:t,onToggle:n}){return(0,C.jsxs)(`button`,{className:`sidebar-toggle w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-base-content/70 uppercase tracking-normal font-spline-sans-mono hover:text-base-content transition-colors`,"aria-expanded":t,onClick:n,children:[(0,C.jsx)(`span`,{children:e}),(0,C.jsx)(Jt,{className:`w-4 h-4 transition-transform duration-200 ${t?`rotate-90`:``}`})]})}function Hr({item:e,pathname:t}){let n=Wr(e.href),r=Ur(t,n);return(0,C.jsx)(`li`,{children:(0,C.jsx)(s,{to:`/docs/$slug/`,params:{slug:n},preload:`intent`,className:`block ml-0 pl-4 pr-3 py-2 text-sm transition-colors relative ${r?`text-[#1D4ED8] bg-[#1D4ED8]/10 font-medium before:absolute before:left-[-2px] before:top-0 before:bottom-0 before:w-0.5 before:bg-[#1D4ED8]`:`text-base-content/80 hover:text-[#1D4ED8] hover:bg-base-content/5`}`,children:(0,C.jsx)(`span`,{className:`flex items-center justify-between`,children:e.title})})})}function Ur(e,t){return e.replace(/\/+$/,``).endsWith(`/docs/${t}`)}function Wr(e){let t=e.match(/docs\/([^/]+)$/);return t?t[1]:`introduction`}var Gr={shell:`relative flex min-h-screen flex-col`,main:`drawer lg:drawer-open relative min-h-[calc(100vh-68px)] flex-1`,drawerContent:`drawer-content flex min-h-[calc(100vh-68px)] flex-col pt-[68px]`,article:`flex min-h-[calc(100vh-68px)] flex-1 flex-col`};function Kr({children:e}){return(0,C.jsxs)(`section`,{className:Gr.shell,children:[(0,C.jsx)(wr,{}),(0,C.jsx)(qr,{children:e}),(0,C.jsx)(pn,{})]})}function qr({children:e}){let[t,n]=(0,y.useState)(!1),r=e=>n(e.target.checked),i=()=>n(!1),a={checked:t,onChange:r};return(0,C.jsxs)(`main`,{className:Gr.main,children:[(0,C.jsx)(`input`,{id:`my-drawer-2`,type:`checkbox`,className:`drawer-toggle`,...a}),(0,C.jsx)(`section`,{className:Gr.drawerContent,children:(0,C.jsx)(`article`,{className:Gr.article,children:e})}),(0,C.jsx)(Rr,{onClose:i})]})}function Jr({children:e}){return(0,C.jsxs)(`section`,{className:`flex flex-col min-h-screen relative`,children:[(0,C.jsx)(wr,{}),(0,C.jsxs)(`main`,{className:`drawer flex-1 relative`,children:[(0,C.jsx)(`input`,{id:`my-drawer-2`,type:`checkbox`,className:`drawer-toggle`}),(0,C.jsx)(`section`,{className:`drawer-content flex flex-col pt-[68px]`,children:(0,C.jsx)(`article`,{className:`flex-1`,children:e})}),(0,C.jsx)(Rr,{})]}),(0,C.jsx)(pn,{})]})}var Yr=/[\0-\x1F!-,\.\/:-@\[-\^`\{-\xA9\xAB-\xB4\xB6-\xB9\xBB-\xBF\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0378\u0379\u037E\u0380-\u0385\u0387\u038B\u038D\u03A2\u03F6\u0482\u0530\u0557\u0558\u055A-\u055F\u0589-\u0590\u05BE\u05C0\u05C3\u05C6\u05C8-\u05CF\u05EB-\u05EE\u05F3-\u060F\u061B-\u061F\u066A-\u066D\u06D4\u06DD\u06DE\u06E9\u06FD\u06FE\u0700-\u070F\u074B\u074C\u07B2-\u07BF\u07F6-\u07F9\u07FB\u07FC\u07FE\u07FF\u082E-\u083F\u085C-\u085F\u086B-\u089F\u08B5\u08C8-\u08D2\u08E2\u0964\u0965\u0970\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09F2-\u09FB\u09FD\u09FF\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF0-\u0AF8\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B54\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B70\u0B72-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BF0-\u0BFF\u0C0D\u0C11\u0C29\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5B-\u0C5F\u0C64\u0C65\u0C70-\u0C7F\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0CFF\u0D0D\u0D11\u0D45\u0D49\u0D4F-\u0D53\u0D58-\u0D5E\u0D64\u0D65\u0D70-\u0D79\u0D80\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DE5\u0DF0\u0DF1\u0DF4-\u0E00\u0E3B-\u0E3F\u0E4F\u0E5A-\u0E80\u0E83\u0E85\u0E8B\u0EA4\u0EA6\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F01-\u0F17\u0F1A-\u0F1F\u0F2A-\u0F34\u0F36\u0F38\u0F3A-\u0F3D\u0F48\u0F6D-\u0F70\u0F85\u0F98\u0FBD-\u0FC5\u0FC7-\u0FFF\u104A-\u104F\u109E\u109F\u10C6\u10C8-\u10CC\u10CE\u10CF\u10FB\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u1360-\u137F\u1390-\u139F\u13F6\u13F7\u13FE-\u1400\u166D\u166E\u1680\u169B-\u169F\u16EB-\u16ED\u16F9-\u16FF\u170D\u1715-\u171F\u1735-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17D4-\u17D6\u17D8-\u17DB\u17DE\u17DF\u17EA-\u180A\u180E\u180F\u181A-\u181F\u1879-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191F\u192C-\u192F\u193C-\u1945\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DA-\u19FF\u1A1C-\u1A1F\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1AA6\u1AA8-\u1AAF\u1AC1-\u1AFF\u1B4C-\u1B4F\u1B5A-\u1B6A\u1B74-\u1B7F\u1BF4-\u1BFF\u1C38-\u1C3F\u1C4A-\u1C4C\u1C7E\u1C7F\u1C89-\u1C8F\u1CBB\u1CBC\u1CC0-\u1CCF\u1CD3\u1CFB-\u1CFF\u1DFA\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FBD\u1FBF-\u1FC1\u1FC5\u1FCD-\u1FCF\u1FD4\u1FD5\u1FDC-\u1FDF\u1FED-\u1FF1\u1FF5\u1FFD-\u203E\u2041-\u2053\u2055-\u2070\u2072-\u207E\u2080-\u208F\u209D-\u20CF\u20F1-\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F-\u215F\u2189-\u24B5\u24EA-\u2BFF\u2C2F\u2C5F\u2CE5-\u2CEA\u2CF4-\u2CFF\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D70-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E00-\u2E2E\u2E30-\u3004\u3008-\u3020\u3030\u3036\u3037\u303D-\u3040\u3097\u3098\u309B\u309C\u30A0\u30FB\u3100-\u3104\u3130\u318F-\u319F\u31C0-\u31EF\u3200-\u33FF\u4DC0-\u4DFF\u9FFD-\u9FFF\uA48D-\uA4CF\uA4FE\uA4FF\uA60D-\uA60F\uA62C-\uA63F\uA673\uA67E\uA6F2-\uA716\uA720\uA721\uA789\uA78A\uA7C0\uA7C1\uA7CB-\uA7F4\uA828-\uA82B\uA82D-\uA83F\uA874-\uA87F\uA8C6-\uA8CF\uA8DA-\uA8DF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA954-\uA95F\uA97D-\uA97F\uA9C1-\uA9CE\uA9DA-\uA9DF\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A-\uAA5F\uAA77-\uAA79\uAAC3-\uAADA\uAADE\uAADF\uAAF0\uAAF1\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F\uAB5B\uAB6A-\uAB6F\uABEB\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uD7FF\uE000-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB29\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBB2-\uFBD2\uFD3E-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFC-\uFDFF\uFE10-\uFE1F\uFE30-\uFE32\uFE35-\uFE4C\uFE50-\uFE6F\uFE75\uFEFD-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF3E\uFF40\uFF5B-\uFF65\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFFF]|\uD800[\uDC0C\uDC27\uDC3B\uDC3E\uDC4E\uDC4F\uDC5E-\uDC7F\uDCFB-\uDD3F\uDD75-\uDDFC\uDDFE-\uDE7F\uDE9D-\uDE9F\uDED1-\uDEDF\uDEE1-\uDEFF\uDF20-\uDF2C\uDF4B-\uDF4F\uDF7B-\uDF7F\uDF9E\uDF9F\uDFC4-\uDFC7\uDFD0\uDFD6-\uDFFF]|\uD801[\uDC9E\uDC9F\uDCAA-\uDCAF\uDCD4-\uDCD7\uDCFC-\uDCFF\uDD28-\uDD2F\uDD64-\uDDFF\uDF37-\uDF3F\uDF56-\uDF5F\uDF68-\uDFFF]|\uD802[\uDC06\uDC07\uDC09\uDC36\uDC39-\uDC3B\uDC3D\uDC3E\uDC56-\uDC5F\uDC77-\uDC7F\uDC9F-\uDCDF\uDCF3\uDCF6-\uDCFF\uDD16-\uDD1F\uDD3A-\uDD7F\uDDB8-\uDDBD\uDDC0-\uDDFF\uDE04\uDE07-\uDE0B\uDE14\uDE18\uDE36\uDE37\uDE3B-\uDE3E\uDE40-\uDE5F\uDE7D-\uDE7F\uDE9D-\uDEBF\uDEC8\uDEE7-\uDEFF\uDF36-\uDF3F\uDF56-\uDF5F\uDF73-\uDF7F\uDF92-\uDFFF]|\uD803[\uDC49-\uDC7F\uDCB3-\uDCBF\uDCF3-\uDCFF\uDD28-\uDD2F\uDD3A-\uDE7F\uDEAA\uDEAD-\uDEAF\uDEB2-\uDEFF\uDF1D-\uDF26\uDF28-\uDF2F\uDF51-\uDFAF\uDFC5-\uDFDF\uDFF7-\uDFFF]|\uD804[\uDC47-\uDC65\uDC70-\uDC7E\uDCBB-\uDCCF\uDCE9-\uDCEF\uDCFA-\uDCFF\uDD35\uDD40-\uDD43\uDD48-\uDD4F\uDD74\uDD75\uDD77-\uDD7F\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDFF\uDE12\uDE38-\uDE3D\uDE3F-\uDE7F\uDE87\uDE89\uDE8E\uDE9E\uDEA9-\uDEAF\uDEEB-\uDEEF\uDEFA-\uDEFF\uDF04\uDF0D\uDF0E\uDF11\uDF12\uDF29\uDF31\uDF34\uDF3A\uDF45\uDF46\uDF49\uDF4A\uDF4E\uDF4F\uDF51-\uDF56\uDF58-\uDF5C\uDF64\uDF65\uDF6D-\uDF6F\uDF75-\uDFFF]|\uD805[\uDC4B-\uDC4F\uDC5A-\uDC5D\uDC62-\uDC7F\uDCC6\uDCC8-\uDCCF\uDCDA-\uDD7F\uDDB6\uDDB7\uDDC1-\uDDD7\uDDDE-\uDDFF\uDE41-\uDE43\uDE45-\uDE4F\uDE5A-\uDE7F\uDEB9-\uDEBF\uDECA-\uDEFF\uDF1B\uDF1C\uDF2C-\uDF2F\uDF3A-\uDFFF]|\uD806[\uDC3B-\uDC9F\uDCEA-\uDCFE\uDD07\uDD08\uDD0A\uDD0B\uDD14\uDD17\uDD36\uDD39\uDD3A\uDD44-\uDD4F\uDD5A-\uDD9F\uDDA8\uDDA9\uDDD8\uDDD9\uDDE2\uDDE5-\uDDFF\uDE3F-\uDE46\uDE48-\uDE4F\uDE9A-\uDE9C\uDE9E-\uDEBF\uDEF9-\uDFFF]|\uD807[\uDC09\uDC37\uDC41-\uDC4F\uDC5A-\uDC71\uDC90\uDC91\uDCA8\uDCB7-\uDCFF\uDD07\uDD0A\uDD37-\uDD39\uDD3B\uDD3E\uDD48-\uDD4F\uDD5A-\uDD5F\uDD66\uDD69\uDD8F\uDD92\uDD99-\uDD9F\uDDAA-\uDEDF\uDEF7-\uDFAF\uDFB1-\uDFFF]|\uD808[\uDF9A-\uDFFF]|\uD809[\uDC6F-\uDC7F\uDD44-\uDFFF]|[\uD80A\uD80B\uD80E-\uD810\uD812-\uD819\uD824-\uD82B\uD82D\uD82E\uD830-\uD833\uD837\uD839\uD83D\uD83F\uD87B-\uD87D\uD87F\uD885-\uDB3F\uDB41-\uDBFF][\uDC00-\uDFFF]|\uD80D[\uDC2F-\uDFFF]|\uD811[\uDE47-\uDFFF]|\uD81A[\uDE39-\uDE3F\uDE5F\uDE6A-\uDECF\uDEEE\uDEEF\uDEF5-\uDEFF\uDF37-\uDF3F\uDF44-\uDF4F\uDF5A-\uDF62\uDF78-\uDF7C\uDF90-\uDFFF]|\uD81B[\uDC00-\uDE3F\uDE80-\uDEFF\uDF4B-\uDF4E\uDF88-\uDF8E\uDFA0-\uDFDF\uDFE2\uDFE5-\uDFEF\uDFF2-\uDFFF]|\uD821[\uDFF8-\uDFFF]|\uD823[\uDCD6-\uDCFF\uDD09-\uDFFF]|\uD82C[\uDD1F-\uDD4F\uDD53-\uDD63\uDD68-\uDD6F\uDEFC-\uDFFF]|\uD82F[\uDC6B-\uDC6F\uDC7D-\uDC7F\uDC89-\uDC8F\uDC9A-\uDC9C\uDC9F-\uDFFF]|\uD834[\uDC00-\uDD64\uDD6A-\uDD6C\uDD73-\uDD7A\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDE41\uDE45-\uDFFF]|\uD835[\uDC55\uDC9D\uDCA0\uDCA1\uDCA3\uDCA4\uDCA7\uDCA8\uDCAD\uDCBA\uDCBC\uDCC4\uDD06\uDD0B\uDD0C\uDD15\uDD1D\uDD3A\uDD3F\uDD45\uDD47-\uDD49\uDD51\uDEA6\uDEA7\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3\uDFCC\uDFCD]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85-\uDE9A\uDEA0\uDEB0-\uDFFF]|\uD838[\uDC07\uDC19\uDC1A\uDC22\uDC25\uDC2B-\uDCFF\uDD2D-\uDD2F\uDD3E\uDD3F\uDD4A-\uDD4D\uDD4F-\uDEBF\uDEFA-\uDFFF]|\uD83A[\uDCC5-\uDCCF\uDCD7-\uDCFF\uDD4C-\uDD4F\uDD5A-\uDFFF]|\uD83B[\uDC00-\uDDFF\uDE04\uDE20\uDE23\uDE25\uDE26\uDE28\uDE33\uDE38\uDE3A\uDE3C-\uDE41\uDE43-\uDE46\uDE48\uDE4A\uDE4C\uDE50\uDE53\uDE55\uDE56\uDE58\uDE5A\uDE5C\uDE5E\uDE60\uDE63\uDE65\uDE66\uDE6B\uDE73\uDE78\uDE7D\uDE7F\uDE8A\uDE9C-\uDEA0\uDEA4\uDEAA\uDEBC-\uDFFF]|\uD83C[\uDC00-\uDD2F\uDD4A-\uDD4F\uDD6A-\uDD6F\uDD8A-\uDFFF]|\uD83E[\uDC00-\uDFEF\uDFFA-\uDFFF]|\uD869[\uDEDE-\uDEFF]|\uD86D[\uDF35-\uDF3F]|\uD86E[\uDC1E\uDC1F]|\uD873[\uDEA2-\uDEAF]|\uD87A[\uDFE1-\uDFFF]|\uD87E[\uDE1E-\uDFFF]|\uD884[\uDF4B-\uDFFF]|\uDB40[\uDC00-\uDCFF\uDDF0-\uDFFF]/g,Xr=Object.hasOwnProperty,Zr=class{constructor(){this.occurrences,this.reset()}slug(e,t){let n=this,r=Qr(e,t===!0),i=r;for(;Xr.call(n.occurrences,r);)n.occurrences[i]++,r=i+`-`+n.occurrences[i];return n.occurrences[r]=0,r}reset(){this.occurrences=Object.create(null)}};function Qr(e,t){return typeof e==`string`?(t||(e=e.toLowerCase()),e.replace(Yr,``).replace(/ /g,`-`)):``}var $r=/^(#{2,4})\s+(.+)$/gm;function ei(e){let t=new Zr,n=new RegExp($r.source,$r.flags);return Array.from(e.matchAll(n)).map(([,e,n])=>{let{length:r}=e,i=n.trim();return{depth:r,slug:t.slug(i),text:i}})}var ti={rootMargin:`-20% 0% -70% 0%`,threshold:0},ni=`h2[id], h3[id], h4[id]`,ri=88,ii=e=>e.scrollTop+e.clientHeight>=e.scrollHeight-1;function ai(e,t=!1){let n=e[0];return n?t?e.at(-1)?.id??n.id:e.filter(e=>e.getBoundingClientRect().top<=ri).at(-1)?.id??n.id:null}var oi=(e,t)=>{let n=new Set(t);return()=>Array.from(e.querySelectorAll(ni)).filter(({id:e})=>n.has(e))},si=(e,t)=>{let{body:n,documentElement:r}=e.ownerDocument;return t.getComputedStyle(n).overflowY===`visible`?r:n},ci=(e,t,n,r)=>{let i;return{update:()=>{i!==void 0&&e.cancelAnimationFrame(i),i=e.requestAnimationFrame(()=>{i=void 0,r(ai(n(),ii(t)))})},cancel:()=>{i!==void 0&&e.cancelAnimationFrame(i)}}};function li(e,t,n,r){let{update:i,cancel:a}=r,o=new IntersectionObserver(i,ti);return i(),t.addEventListener(`scroll`,i,{passive:!0}),e.addEventListener(`resize`,i),n.forEach(e=>o.observe(e)),()=>{o.disconnect(),t.removeEventListener(`scroll`,i),e.removeEventListener(`resize`,i),a()}}function ui(e,t,n){let r=e.current;if(!r||t.length===0)return;let i=r.ownerDocument.defaultView;if(!i)return;let a=oi(r,t),o=a();if(o.length<t.length)return;let s=si(r,i);return li(i,s,o,ci(i,s,a,n))}function di(e,t,n){let r=ui(e,t,n);if(r)return r;let i=e.current;if(!i)return;let a=new MutationObserver(()=>{r=ui(e,t,n),r&&a.disconnect()});return a.observe(i,{childList:!0,subtree:!0}),()=>{a.disconnect(),r?.()}}function fi(e,t){let[n,r]=(0,y.useState)(null),i=t.join(`,`);return(0,y.useEffect)(()=>{if(r(null),t.length!==0)return di(e,t,r)},[e,i]),n}function pi(e,t){return t.reduce((e,t)=>e[t]?.subheadings??[],e)}function mi(e,t,n){if(t.length===0)return e.concat(n);let[r,...i]=t;return e.map((e,t)=>{if(t!==r)return e;let a=mi(e.subheadings,i,n);return Object.assign({},e,{subheadings:a})})}function hi(e,t){let n=Object.assign({},t,{subheadings:[]}),r=[],i=e.paths[n.depth-1],a=n.depth===2?r:i;if(!a)return e;let o=pi(e.toc,a).length,s=a.concat(o);return{toc:mi(e.toc,a,n),paths:Object.assign({},e.paths,{[n.depth]:s})}}function gi(e){let{toc:t}=e.reduce(hi,{toc:[],paths:{}});return t}var _i=/`([^`]+)`/g;function vi(e){let t=e.split(_i).flatMap((e,t)=>e?[{text:e,isCode:t%2==1}]:[]),n=[{text:e,isCode:!1}];return t.length===0?n:t}var yi=`block text-sm transition-colors border-l-2 pl-4 -ml-0.5 font-spline-sans-mono`,bi=`text-[#1D4ED8] font-medium border-[#1D4ED8]`,xi=`hover:text-[#1D4ED8] border-transparent`;function Si(e,t=!1){return`${yi} ${t?`py-0.5`:`py-1`} ${e?bi:`${t?`text-base-content/60`:`text-base-content/70`} ${xi}`}`}function Ci(e,t){let n=e?Array.from(e.querySelectorAll(ni)).find(e=>e.id===t):void 0;return n?(n.scrollIntoView({behavior:`smooth`,block:`start`}),history.pushState(null,``,`#${t}`),!0):!1}function wi({headings:e,contentRef:t}){let n=e??[],r=gi(n),i=fi(t,n.map(({slug:e})=>e)),a=(0,y.useCallback)((e,n)=>{Ci(t.current,n)&&e.preventDefault()},[t]);return r.length===0?null:(0,C.jsxs)(`nav`,{className:`sticky top-28 w-64`,"aria-label":`Table of contents`,children:[(0,C.jsx)(Ti,{}),(0,C.jsx)(Ei,{toc:r,activeId:i,onClickLink:a})]})}function Ti(){return(0,C.jsx)(`h2`,{className:`mb-3 text-xs font-semibold text-base-content/60 uppercase tracking-wider font-spline-sans-mono`,children:`On this page`})}function Ei({toc:e,activeId:t,onClickLink:n}){return(0,C.jsx)(`ul`,{className:`space-y-2.5`,children:e.map(e=>(0,C.jsx)(Di,{heading:e,activeId:t,onClickLink:n},e.slug))})}function Di({heading:e,activeId:t,onClickLink:n}){let r=t===e.slug,i=e.subheadings.length>0,{slug:a,text:o}=e;return(0,C.jsxs)(`li`,{children:[(0,C.jsx)(Oi,{slug:a,text:o,isActive:r,onClickLink:n}),i&&(0,C.jsx)(ki,{subheadings:e.subheadings,activeId:t,onClickLink:n})]})}function Oi({slug:e,text:t,isActive:n,isSubheading:r=!1,onClickLink:i}){let a=vi(t);return(0,C.jsx)(`a`,{href:`#${e}`,onClick:t=>i(t,e),className:Si(n,r),children:a.map((e,t)=>e.isCode?(0,C.jsx)(`code`,{className:`text-xs px-1 py-0.5 rounded bg-base-content/10`,children:e.text},t):(0,C.jsx)(`span`,{children:e.text},t))})}function ki({subheadings:e,activeId:t,onClickLink:n}){return(0,C.jsx)(`ul`,{className:`mt-2 space-y-2 ml-3`,children:e.map(e=>(0,C.jsx)(`li`,{children:(0,C.jsx)(Oi,{slug:e.slug,text:e.text,isActive:t===e.slug,isSubheading:!0,onClickLink:n})},e.slug))})}var Ai=_({id:`copy`,initial:`idle`,states:{idle:{on:{COPY:`copied`}},copied:{after:{2e3:`idle`}}}}),ji=e=>e?(0,C.jsx)(Wt,{className:`h-4 w-4 text-green-500`}):(0,C.jsx)(Xt,{className:`h-4 w-4`}),Mi=async e=>{try{return await navigator.clipboard.writeText(e),!0}catch{return!1}};function Ni(e){let[t,n]=v(Ai);return{copied:t.matches(`copied`),handleCopy:async()=>{await Mi(e)&&n({type:`COPY`})}}}function Pi({code:e}){let{copied:t,handleCopy:n}=Ni(e),r=t?`Copied!`:`Copy code`,i=ji(t);return(0,C.jsx)(`button`,{type:`button`,className:`flex items-center justify-center h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer`,onClick:n,"aria-label":r,children:i})}var Fi=[`javascript`,`js`,`typescript`,`ts`,`jsx`,`tsx`,`bash`,`shellscript`,`json`,`jsonc`,`yaml`,`markdown`,`text`],Ii={js:`javascript`,ts:`typescript`},Li=new Set([`bash`,`console`,`plaintext`,`shell`,`shellscript`,`sh`,`terminal`,`text`]),Ri=e=>Ii[e]||e,zi=e=>e.replace(/\r?\n$/,``),Bi=e=>{let t=Ri(e.trim().toLowerCase());return!Li.has(t)},Vi={wrapper:`not-prose shiki-wrapper relative group w-full min-w-0 max-w-full overflow-hidden rounded-md border border-border/70 bg-card/85 backdrop-blur`,header:`shiki-header flex items-center justify-between gap-3 border-b border-border/70 bg-muted/55 px-3 py-2`,pre:`max-w-full overflow-x-auto px-2 py-2 text-[13px] leading-5`,content:`max-w-full [&_.shiki]:!overflow-visible [&_.shiki]:!bg-transparent [&_pre]:!m-0 [&_pre]:!max-w-full [&_pre]:!border-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:!bg-transparent [&_code]:!p-0`},Hi=[`bg-rose-400`,`bg-amber-400`,`bg-emerald-400`],Ui=128,Wi=null,G=new Map;function Gi(){return Wi||=U(()=>import(`./highlighter-C2W_oa2D.js`).then(e=>e.createCodeHighlighter()),__vite__mapDeps([14,15,2])),Wi}var Ki=e=>{let t=Ri(e);return Fi.includes(t)?t:`text`},qi=e=>{let t=G.get(e);if(t)return G.delete(e),G.set(e,t),t},Ji=(e,t)=>{if(G.size>=Ui){let e=G.keys().next().value;e!==void 0&&G.delete(e)}G.set(e,t)},Yi=(e,t,n)=>{let r=Ki(t),i=JSON.stringify([e,r,n]),a=qi(i);if(a)return a;let o=Gi().then(t=>t.codeToHtml(e,r,n)).catch(e=>{throw G.delete(i),e});return Ji(i,o),o};function Xi({code:e,lang:t=`text`,showLineNumbers:n=!1}){let r=zi(e),i=(0,y.use)(Yi(r,t,n));return(0,C.jsx)(`div`,{className:Vi.content,dangerouslySetInnerHTML:{__html:i}})}function Zi({line:e}){return(0,C.jsx)(`span`,{className:`line`,children:(0,C.jsx)(`span`,{children:e||`\xA0`})})}function Qi({code:e}){let t=e.split(`
`);return(0,C.jsx)(`div`,{className:Vi.content,children:(0,C.jsx)(`pre`,{className:`shiki`,children:(0,C.jsx)(`code`,{children:t.map((e,t)=>(0,C.jsx)(Zi,{line:e},t))})})})}function $i({code:e,lang:t=`text`,showLineNumbers:n=!1,className:r}){let i=zi(e),a=n&&Bi(t);return{normalizedCode:i,wrapperClass:Et(Vi.wrapper,a&&`show-line-numbers`,r),highlightedProps:{code:i,lang:t,showLineNumbers:a}}}function ea(e){let{normalizedCode:t,wrapperClass:n,highlightedProps:r}=$i(e);return(0,C.jsxs)(`div`,{className:n,children:[(0,C.jsx)(ta,{...e,code:t}),(0,C.jsx)(`div`,{className:Vi.pre,children:(0,C.jsx)(y.Suspense,{fallback:(0,C.jsx)(Qi,{code:t}),children:(0,C.jsx)(Xi,{...r})})})]})}function ta({code:e,title:t,lang:n=`text`,showLanguage:r=!0,showCopy:i=!0}){return t||r||i?(0,C.jsxs)(`div`,{className:Vi.header,children:[(0,C.jsxs)(`div`,{className:`flex min-w-0 items-center gap-3`,children:[(0,C.jsx)(na,{}),(0,C.jsx)(ra,{title:t,lang:n,showLanguage:r})]}),i&&(0,C.jsx)(Pi,{code:e})]}):null}function na(){return(0,C.jsx)(`div`,{className:`flex items-center gap-1.5`,"aria-hidden":`true`,children:Hi.map(e=>(0,C.jsx)(`span`,{className:Et(`h-2.5 w-2.5 rounded-full ring-1 ring-black/5`,e)},e))})}function ra({title:e,lang:t,showLanguage:n}){return(0,C.jsxs)(`div`,{className:`flex min-w-0 items-center gap-2`,children:[e&&(0,C.jsx)(`span`,{className:`truncate text-xs font-medium text-base-content/70`,children:e}),n&&t&&t!==`text`&&(0,C.jsx)(`span`,{className:`font-mono text-xs text-base-content/50`,children:t})]})}function ia({href:e=``,children:t,className:n}){let r=e.replace(`/docs/`,``);return(0,C.jsx)(s,{to:`/docs/$slug/`,params:{slug:r},className:n,children:t})}function aa({href:e,children:t,className:n}){if(!e)return(0,C.jsx)(`a`,{className:n,children:t});let r={href:e,children:t,className:n};return e.startsWith(`http`)||e.startsWith(`//`)?(0,C.jsx)(oa,{...r}):e.startsWith(`/docs/`)?(0,C.jsx)(ia,{...r}):(0,C.jsx)(`a`,{href:e,className:n,children:t})}function oa({href:e,children:t,className:n}){return(0,C.jsx)(`a`,{href:e,className:n,target:`_blank`,rel:`noopener noreferrer`,children:t})}function sa({level:e,id:t,children:n,...r}){if(!t)return(0,C.jsx)(e,{...r,children:n});let i=`#${t}`;return(0,C.jsx)(e,{...r,id:t,children:(0,C.jsxs)(`a`,{href:i,className:`group text-inherit no-underline`,children:[n,(0,C.jsx)(Qt,{"aria-hidden":`true`,className:`ml-2 inline-block h-[0.8em] w-[0.8em] align-baseline opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60`})]})})}var ca=e=>function(t){return(0,C.jsx)(sa,{...t,level:e})},la=(0,y.lazy)(()=>U(async()=>{let{Mermaid:e}=await import(`./Mermaid-j2YcXTPo.js`);return{Mermaid:e}},__vite__mapDeps([16,2,1,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34])).then(({Mermaid:e})=>({default:e}))),ua=ca(`h1`),da=ca(`h2`),fa=ca(`h3`),pa=ca(`h4`),ma=ca(`h5`),ha=ca(`h6`);function ga(e){return typeof e==`string`?e:Array.isArray(e)?e.map(ga).join(``):typeof e==`object`&&e&&`props`in e?ga(e.props?.children):``}function _a({chart:e}){return(0,C.jsx)(`div`,{className:`not-prose my-6 h-80 overflow-auto sm:h-96`,role:`region`,"aria-label":`Architecture diagram`,tabIndex:0,children:(0,C.jsx)(y.Suspense,{fallback:(0,C.jsx)(`div`,{className:`flex h-full items-center justify-center animate-pulse`,"aria-hidden":`true`,children:(0,C.jsx)(`div`,{className:`h-48 w-full max-w-lg rounded bg-base-content/10`})}),children:(0,C.jsx)(la,{chart:e})})})}function va(e){if(e?.[`data-language`]===`mermaid`)return e[`data-mermaid-content`]}function ya(e,t){let n=e?.props??{},r=n.className??``,{"data-language":i}=n,{"data-language":a}=t;return{lang:(r.match(/language-(\S+)/)?.[1]??i??a??`text`).replace(/^language-/,``),code:ga(n.children??e)}}function ba({children:e,...t}){let n=e,r=va(t)||va(n?.props);if(r)return(0,C.jsx)(_a,{chart:r});let{lang:i,code:a}=ya(e,t);return i===`mermaid`?(0,C.jsx)(_a,{chart:a}):(0,C.jsx)(`div`,{className:`not-prose my-4 min-w-0 max-w-full overflow-hidden`,children:(0,C.jsx)(ea,{code:a,lang:i,showCopy:!1,showLanguage:!1,showLineNumbers:!0})})}var xa={Mermaid:_a,pre:ba,a:aa,h1:ua,h2:da,h3:fa,h4:pa,h5:ma,h6:ha,p:`p`,code:`code`,span:`span`,strong:`strong`,em:`em`,ul:`ul`,ol:`ol`,li:`li`,img:`img`};function Sa(e){let t=e.match(/docs\/([^/]+)$/);return t?t[1]:`introduction`}function Ca(e){let t=Ir.flatMap(e=>e.items),n=t.findIndex(t=>t.href.endsWith(`/${e}`)),r=t[n-1],i=n>=0,a=t[n+1];return{prevItem:r,nextItem:i?a:void 0}}function wa({item:e}){let t={slug:Sa(e.href)};return(0,C.jsx)(s,{to:`/docs/$slug/`,params:t,preload:`intent`,className:`mr-auto flex`,children:(0,C.jsxs)(`button`,{className:`btn rounded-full bg-base-100 border border-base-content/10 text-base-content/80 shadow-sm shadow-base-content/5 hover:bg-base-content/5 hover:text-[#1D4ED8] transition-all`,children:[(0,C.jsx)(Kt,{className:`w-6 h-6`}),(0,C.jsx)(`span`,{className:`text-xs md:text-sm font-medium`,children:e.title})]})})}function Ta({item:e}){let t={slug:Sa(e.href)};return(0,C.jsx)(s,{to:`/docs/$slug/`,params:t,preload:`intent`,className:`ml-auto flex`,children:(0,C.jsxs)(`button`,{className:`btn rounded-full bg-base-100 border border-base-content/10 text-base-content/80 shadow-sm shadow-base-content/5 hover:bg-base-content/5 hover:text-[#1D4ED8] transition-all`,children:[(0,C.jsx)(`span`,{className:`text-xs md:text-sm font-medium`,children:e.title}),(0,C.jsx)(Jt,{className:`w-6 h-6`})]})})}function Ea({prevItem:e,nextItem:t}){return(0,C.jsxs)(`nav`,{className:`flex gap-7`,children:[e?.href&&(0,C.jsx)(wa,{item:e}),t?.href&&(0,C.jsx)(Ta,{item:t})]})}var Da=`/pastoralist/assets/katex.min-BsN2iI2U.css`,Oa={page:`relative mx-auto grid min-h-[calc(100vh-68px)] w-full max-w-[1120px] grid-cols-1 gap-8 overflow-x-clip px-4 py-6 font-spline-sans-mono sm:px-6 md:px-10 md:py-10 lg:px-12 xl:grid-cols-[minmax(0,680px)_240px] xl:gap-16 xl:px-16 2xl:max-w-[1240px] 2xl:grid-cols-[minmax(0,720px)_260px] 2xl:gap-20 2xl:px-20`,article:`flex w-[calc(100vw-2rem)] min-w-0 max-w-full flex-1 flex-col sm:w-full`,content:`docs-prose prose prose-sm sm:prose-base md:prose-md mb-10 min-h-[calc(100vh-220px)] w-full min-w-0 max-w-full break-words prose-pre:max-w-full prose-pre:overflow-x-auto [&>*]:max-w-full`,loading:`not-prose flex min-h-[calc(100vh-220px)] w-full items-center justify-center rounded-md border border-base-content/10 bg-base-100/70`};function ka(e,t){(0,y.useEffect)(()=>{let t=window.location.hash.slice(1);if(!(t.length>0))return;let n=e.current;if(n)return ja(n,t)},[e,t])}function Aa(e,t){let n=new MutationObserver(()=>{t()&&n.disconnect()});return t()||n.observe(e,{childList:!0,subtree:!0}),n}function ja(e,t){let n,r=Aa(e,()=>{let r=Array.from(e.querySelectorAll(`[id]`)).find(e=>e.id===t);return r?(n=window.requestAnimationFrame(()=>r.scrollIntoView({block:`start`})),!0):!1});return()=>{r.disconnect(),n!==void 0&&window.cancelAnimationFrame(n)}}function Ma(){let{slug:e}=h({from:`/docs/$slug`}),t=(0,y.useRef)(null),n=nr(e);if(ka(t,e),!n)return(0,C.jsx)(l,{to:`/docs/$slug/`,params:{slug:`introduction`}});let r=rr(e),i=r?ei(r):[];return(0,C.jsxs)(`section`,{className:Oa.page,children:[(0,C.jsx)(Na,{enabled:n.usesMath}),(0,C.jsx)(La,{doc:n,slug:e,contentRef:t}),(0,C.jsx)(`aside`,{className:`hidden xl:block`,children:(0,C.jsx)(wi,{headings:i,contentRef:t},e)})]})}function Na({enabled:e}){return e?(0,C.jsx)(`link`,{rel:`stylesheet`,href:Da,precedence:`low`}):null}function Pa({title:e}){return(0,C.jsx)(`nav`,{className:`text-base breadcrumbs pt-0 pb-4`,children:(0,C.jsxs)(`ul`,{children:[(0,C.jsx)(`li`,{children:(0,C.jsx)(s,{to:`/`,className:`hover:text-primary`,children:`Home`})}),(0,C.jsx)(`li`,{className:`text-primary`,children:e})]})})}function Fa({Content:e}){return e?(0,C.jsx)(y.Suspense,{fallback:(0,C.jsx)(Ia,{}),children:(0,C.jsx)(e,{components:xa})}):null}function Ia(){return(0,C.jsx)(`div`,{className:Oa.loading,role:`status`,"aria-label":`Loading documentation`,children:(0,C.jsx)(en,{className:`size-8 animate-spin text-primary`,"aria-hidden":`true`})})}function La({doc:e,slug:t,contentRef:n}){let r=ir(t),{prevItem:i,nextItem:a}=Ca(t);return(0,C.jsxs)(`article`,{className:Oa.article,children:[(0,C.jsx)(Pa,{title:e.title}),(0,C.jsx)(Ra,{doc:e,Content:r,contentRef:n}),(0,C.jsx)(Ea,{prevItem:i,nextItem:a})]})}function Ra({doc:e,Content:t,contentRef:n}){return(0,C.jsxs)(`section`,{ref:n,className:Oa.content,children:[(0,C.jsxs)(`header`,{children:[(0,C.jsx)(`h1`,{children:e.title}),(0,C.jsx)(`p`,{children:e.description})]}),(0,C.jsx)(Fa,{Content:t})]})}var za=_({id:`copy`,initial:`idle`,states:{idle:{on:{COPY:`copied`}},copied:{after:{800:`idle`}}}}),Ba=`flex items-center justify-center size-9 shrink-0 rounded-xl bg-base-100/70 hover:bg-base-200/80 transition-colors cursor-pointer`,Va=`h-5 w-5 pointer-events-none`,Ha=`h-6 w-6 pointer-events-none text-green-500`,Ua=e=>e?(0,C.jsx)(Wt,{className:Ha}):(0,C.jsx)(Xt,{className:Va}),Wa=async e=>{try{return await navigator.clipboard.writeText(e),!0}catch{return!1}};async function Ga(e,t){let n=e.currentTarget.closest(`figure, div`)?.querySelector(`code`);n&&await Wa(n.textContent??``)&&t()}function Ka(){let[e,t]=v(za),n=e.matches(`copied`),r=e=>Ga(e,()=>t({type:`COPY`})),i=n?`Copied!`:`Copy`,a=Ua(n);return(0,C.jsx)(`button`,{type:`button`,className:Ba,onClick:r,"aria-label":i,children:a})}var qa=({children:e,maskSrc:t})=>{let n=Ja(t);return(0,C.jsx)(`div`,{style:{position:`relative`,display:`inline-flex`},children:(0,C.jsxs)(`div`,{className:`logo-shine-wrap`,style:n,children:[e,(0,C.jsx)(`div`,{"aria-hidden":`true`,className:`logo-shine-beam`})]})})};function Ja(e){let t=`url(${e})`;return{WebkitMaskImage:t,maskImage:t,WebkitMaskSize:`contain`,maskSize:`contain`,WebkitMaskRepeat:`no-repeat`,maskRepeat:`no-repeat`,WebkitMaskPosition:`center`,maskPosition:`center`}}var Ya=({size:e,color:t})=>{let n={filter:`drop-shadow(0 0 3px ${t})`};return(0,C.jsx)(`svg`,{width:e,height:e,viewBox:`0 0 10 10`,fill:t,"aria-hidden":`true`,style:n,children:(0,C.jsx)(`path`,{d:`M5 0 L6.2 3.8 L10 5 L6.2 6.2 L5 10 L3.8 6.2 L0 5 L3.8 3.8 Z`})})},Xa=[{left:`5%`,top:`4%`,size:12,color:`#fbbf24`,delay:0,duration:3.2},{left:`13%`,top:`1%`,size:7,color:`#c084fc`,delay:1.7,duration:2.8},{left:`20%`,top:`2%`,size:8,color:`#e2e8f0`,delay:1.4,duration:2.7},{left:`32%`,top:`4%`,size:11,color:`#f9a8d4`,delay:.2,duration:3.4},{left:`44%`,top:`3%`,size:10,color:`#93c5fd`,delay:.6,duration:3.5},{left:`57%`,top:`1%`,size:8,color:`#fbbf24`,delay:2.8,duration:2.6},{left:`70%`,top:`5%`,size:14,color:`#fbbf24`,delay:2.1,duration:2.9},{left:`79%`,top:`2%`,size:7,color:`#e2e8f0`,delay:1,duration:3.1},{left:`90%`,top:`7%`,size:9,color:`#c084fc`,delay:.3,duration:3.1},{left:`1%`,top:`14%`,size:8,color:`#93c5fd`,delay:2.2,duration:3},{left:`1%`,top:`25%`,size:11,color:`#f9a8d4`,delay:1.8,duration:2.6},{left:`4%`,top:`38%`,size:7,color:`#fbbf24`,delay:.4,duration:3.5},{left:`3%`,top:`55%`,size:8,color:`#93c5fd`,delay:.5,duration:3.4},{left:`1%`,top:`67%`,size:12,color:`#e2e8f0`,delay:2.6,duration:2.7},{left:`2%`,top:`78%`,size:13,color:`#fbbf24`,delay:2.3,duration:2.8},{left:`4%`,top:`89%`,size:7,color:`#c084fc`,delay:1,duration:3.3},{left:`96%`,top:`16%`,size:8,color:`#f9a8d4`,delay:.6,duration:2.9},{left:`96%`,top:`22%`,size:10,color:`#e2e8f0`,delay:1.1,duration:3},{left:`98%`,top:`35%`,size:7,color:`#fbbf24`,delay:2,duration:3.4},{left:`97%`,top:`48%`,size:13,color:`#c084fc`,delay:.4,duration:3.3},{left:`96%`,top:`62%`,size:8,color:`#93c5fd`,delay:1.5,duration:2.6},{left:`95%`,top:`72%`,size:9,color:`#f9a8d4`,delay:1.9,duration:2.7},{left:`97%`,top:`85%`,size:11,color:`#fbbf24`,delay:.1,duration:3.2},{left:`10%`,top:`12%`,size:9,color:`#e2e8f0`,delay:1.3,duration:2.8},{left:`14%`,top:`18%`,size:7,color:`#fbbf24`,delay:.9,duration:3.6},{left:`25%`,top:`10%`,size:10,color:`#c084fc`,delay:2.4,duration:2.5},{left:`35%`,top:`16%`,size:8,color:`#93c5fd`,delay:.7,duration:3},{left:`74%`,top:`11%`,size:9,color:`#f9a8d4`,delay:1.6,duration:2.7},{left:`82%`,top:`14%`,size:11,color:`#93c5fd`,delay:2.5,duration:2.5},{left:`88%`,top:`20%`,size:7,color:`#fbbf24`,delay:.3,duration:3.3},{left:`7%`,top:`42%`,size:10,color:`#c084fc`,delay:1.2,duration:3.1},{left:`8%`,top:`60%`,size:8,color:`#f9a8d4`,delay:2.7,duration:2.8},{left:`91%`,top:`38%`,size:9,color:`#e2e8f0`,delay:.5,duration:3.4},{left:`92%`,top:`57%`,size:11,color:`#fbbf24`,delay:1.8,duration:2.6},{left:`12%`,top:`74%`,size:7,color:`#93c5fd`,delay:.4,duration:3.2},{left:`18%`,top:`80%`,size:9,color:`#c084fc`,delay:.7,duration:3.2},{left:`28%`,top:`76%`,size:12,color:`#fbbf24`,delay:2.1,duration:2.9},{left:`38%`,top:`88%`,size:12,color:`#e2e8f0`,delay:2,duration:2.8},{left:`48%`,top:`78%`,size:8,color:`#f9a8d4`,delay:1.4,duration:3.5},{left:`58%`,top:`83%`,size:10,color:`#c084fc`,delay:.2,duration:3},{left:`62%`,top:`85%`,size:8,color:`#fbbf24`,delay:1.3,duration:3.5},{left:`72%`,top:`77%`,size:11,color:`#93c5fd`,delay:2.6,duration:2.7},{left:`80%`,top:`82%`,size:11,color:`#f9a8d4`,delay:.2,duration:3.1},{left:`88%`,top:`75%`,size:7,color:`#e2e8f0`,delay:1.7,duration:3.4},{left:`7%`,top:`95%`,size:8,color:`#fbbf24`,delay:2.3,duration:2.6},{left:`10%`,top:`94%`,size:10,color:`#93c5fd`,delay:1.6,duration:2.6},{left:`22%`,top:`97%`,size:7,color:`#c084fc`,delay:.9,duration:3.1},{left:`35%`,top:`95%`,size:9,color:`#e2e8f0`,delay:1.4,duration:2.8},{left:`50%`,top:`96%`,size:7,color:`#c084fc`,delay:.8,duration:3.3},{left:`63%`,top:`94%`,size:11,color:`#f9a8d4`,delay:2,duration:2.9},{left:`75%`,top:`97%`,size:8,color:`#fbbf24`,delay:.5,duration:3.4},{left:`85%`,top:`93%`,size:13,color:`#fbbf24`,delay:2.4,duration:2.9},{left:`93%`,top:`95%`,size:7,color:`#93c5fd`,delay:1.1,duration:3}],Za=[0,1,0],Qa={opacity:Za,scale:Za,rotate:[0,135,0]};function $a({left:e,top:t,size:n,color:i,duration:a,delay:o}){let s={position:`absolute`,left:e,top:t},c={duration:a,delay:o,repeat:1/0,ease:`easeInOut`};return(0,C.jsx)(r.span,{style:s,initial:{opacity:0,scale:0,rotate:0},animate:Qa,transition:c,children:(0,C.jsx)(Ya,{size:n,color:i})})}function eo(){return(0,C.jsx)(`div`,{"aria-hidden":`true`,className:`pointer-events-none absolute inset-0 overflow-hidden`,style:{zIndex:0},children:Xa.map((e,t)=>(0,C.jsx)($a,{...e},t))})}var K={window:`terminal-window`,windowActive:`ring-2 ring-primary ring-offset-2`,windowMaxWidth:`max-w-lg w-full`,header:`terminal-header`,headerWithTabs:`terminal-header flex justify-between items-center`,dotRed:`terminal-dot terminal-dot-red`,dotYellow:`terminal-dot terminal-dot-yellow`,dotGreen:`terminal-dot terminal-dot-green`,dots:`flex gap-2 items-center`,label:`ml-3 text-slate-400 text-xs`,tabs:`terminal-tabs`,tab:`terminal-tab`,tabActive:`terminal-tab active`,content:`terminal-content`,contentPadding:`terminal-content text-sm`,line:`terminal-line`,prefix:`terminal-prefix`,cursor:`cursor`,footer:`terminal-footer`,loader:`terminal-window w-full animate-pulse`,loaderBar:`h-4 bg-base-content/10 rounded`},to=e=>Number.isFinite(e)?Math.max(0,e):0,no=(e,t)=>to(t??e.delay??35),ro={threshold:.1},io=`terminal-window max-w-lg w-full my-4`,ao=`380px`,q=`●`,oo=`✓`,so=`⬢`,co=`▲`,lo=`🧑‍🌾`,uo=`🐑`,J=(e,t,n)=>{let r=Object.assign({text:e},t);return n&&(r.connectors=n),r},fo=[{lines:[J(`pastoralist`,{prefix:`$`,animate:!0}),J(`&nbsp;`,{}),J(`${lo} Pastoralist`,{className:`text-success`}),J(`&nbsp;`,{}),J(`Updating overrides`,{className:`text-base-content/70`,depth:0,isLast:!0},[]),J(`${q} lodash@4.17.21`,{className:`text-success`,depth:1,isLast:!1},[!1]),J(`Security fix`,{className:`text-base-content/70`,depth:2,isLast:!1},[!0,!0]),J(`Used by: 1 package`,{className:`text-base-content/70`,depth:2,isLast:!0},[!0,!1]),J(`${q} 1 override applied`,{className:`text-success`,depth:1,isLast:!0},[!1]),J(`${oo} 1 override tracked`,{className:`text-success`}),J(`${so} 1 dependent documented`,{className:`text-cyan-400`}),J(`<span class="text-error">■</span> 0 crit · <span class="text-warning">▲</span> 1 high · <span class="text-cyan-400">◆</span> 0 med · <span class="text-success">●</span> 0 low · <span class="text-cyan-400">▸</span> 1 tracked · ○ 0 removed · 10 scanned`,{className:`text-base-content/50`}),J(`${oo} The herd is safe! ${uo}`,{className:`text-gold`})],pauseAfter:0}],po=[{lines:[J(`pastoralist`,{prefix:`$`,animate:!0}),J(`&nbsp;`,{}),J(`${lo} Pastoralist`,{className:`text-success`}),J(`&nbsp;`,{}),J(`Scanning overrides`,{className:`text-base-content/70`,depth:0,isLast:!1},[]),J(`${q} lodash@4.17.21`,{className:`text-success`,depth:1,isLast:!1,delay:30},[!0]),J(`Reason: Security fix CVE-2021-23337`,{className:`text-base-content/70`,depth:2,isLast:!1,delay:20},[!0,!0]),J(`Used by: my-app@1.0.0`,{className:`text-base-content/70`,depth:2,isLast:!0,delay:20},[!0,!1]),J(`${co} minimist@1.2.5`,{className:`text-warning`,depth:1,isLast:!0,delay:30},[!1]),J(`Stale: no package depends on this override`,{className:`text-base-content/70`,depth:2,isLast:!0,delay:20},[!1,!1]),J(`Cleanup`,{className:`text-base-content/70`,depth:0,isLast:!0,delay:30},[]),J(`${q} Removed 1 stale override`,{className:`text-success`,depth:1,isLast:!0,delay:20},[!1]),J(`<span class="text-error">■</span> 0 crit · <span class="text-warning">▲</span> 0 high · <span class="text-cyan-400">◆</span> 0 med · <span class="text-success">●</span> 0 low · <span class="text-cyan-400">▸</span> 1 tracked · ○ 1 removed · 10 scanned`,{className:`text-base-content/50`,delay:40}),J(`${oo} The herd is safe! ${uo}`,{className:`text-gold`,delay:30})],pauseAfter:0}];J(`pastoralist --checkSecurity`,{prefix:`$`,animate:!0}),J(`&nbsp;`,{}),J(`${lo} Pastoralist`,{className:`text-success`}),J(`&nbsp;`,{}),J(`Scanning packages`,{className:`text-base-content/70`,depth:0,isLast:!1,delay:25,animate:!1},[]),J(`${co} [HIGH] lodash@4.17.19`,{className:`text-warning`,depth:1,isLast:!1,delay:30,animate:!1},[!0]),J(`Prototype Pollution in lodash`,{className:`text-base-content/70`,depth:2,isLast:!1,delay:20,animate:!1},[!0,!0]),J(`CVE: CVE-2020-8203`,{className:`text-base-content/70`,depth:2,isLast:!1,delay:20,animate:!1},[!0,!0]),J(`Fix: upgrade to 4.17.21`,{className:`text-base-content/70`,depth:2,isLast:!0,delay:20,animate:!1},[!0,!0]),J(`${q} 1 vulnerability found`,{className:`text-success`,depth:1,isLast:!0,delay:30,animate:!1},[!0]),J(`Fixes applied`,{className:`text-base-content/70`,depth:0,isLast:!1,delay:30,animate:!1},[]),J(`${q} lodash@4.17.21`,{className:`text-success`,depth:1,isLast:!1,delay:20,animate:!1},[!0]),J(`4.17.19 → 4.17.21`,{className:`text-base-content/70`,depth:2,isLast:!1,delay:20,animate:!1},[!0,!0]),J(`Blocks CVE-2020-8203`,{className:`text-base-content/70`,depth:2,isLast:!0,delay:20,animate:!1},[!0,!0]),J(`${q} 1 override added`,{className:`text-success`,depth:1,isLast:!0,delay:20,animate:!1},[!0]),J(`Updating overrides`,{className:`text-base-content/70`,depth:0,isLast:!0,delay:30,animate:!1},[]),J(`${q} 1 override applied`,{className:`text-success`,depth:1,isLast:!0,delay:20,animate:!1},[!1]),J(`${oo} 1 vulnerability fixed`,{className:`text-success`,delay:25,animate:!1}),J(`${so} 1 package protected`,{className:`text-cyan-400`,delay:20,animate:!1}),J(`<span class="text-error">■</span> 0 crit · <span class="text-warning">▲</span> 1 high · <span class="text-cyan-400">◆</span> 0 med · <span class="text-success">●</span> 0 low · <span class="text-cyan-400">▸</span> 1 tracked · ○ 0 removed · 10 scanned`,{className:`text-base-content/50`,delay:20,animate:!1}),J(`${oo} The herd is safe! ${uo}`,{className:`text-gold`,delay:35,animate:!1});function mo({isActive:e=!1,height:t,minHeight:n,className:r}){let i=e?K.windowActive:``;return{className:Et(r??K.window,`transition-shadow duration-300`,i),style:t||n?{height:t,minHeight:n}:void 0}}var ho=e=>{let{hideHeader:t,children:n,footer:r,footerClassName:i}=e,a=mo(e);return(0,C.jsxs)(`div`,{...a,children:[!t&&(0,C.jsx)(go,{...e}),n,r&&(0,C.jsx)(`div`,{className:Et(K.footer,i),children:r})]})};function go({tabs:e,fileName:t,activeTab:n,onTabChange:r}){let i=e&&e.length>0,a=i?K.headerWithTabs:K.header,o=t??`terminal`;return(0,C.jsxs)(`div`,{className:a,children:[(0,C.jsxs)(`div`,{className:K.dots,children:[(0,C.jsx)(`div`,{className:K.dotRed}),(0,C.jsx)(`div`,{className:K.dotYellow}),(0,C.jsx)(`div`,{className:K.dotGreen}),(0,C.jsx)(`span`,{className:K.label,children:o})]}),i&&(0,C.jsx)(_o,{tabs:e,activeTab:n,onTabChange:r})]})}function _o({tabs:e,activeTab:t,onTabChange:n}){return(0,C.jsx)(`div`,{className:K.tabs,children:e.map(e=>{let r=e.id===t?K.tabActive:K.tab;return(0,C.jsx)(`button`,{onClick:()=>n?.(e.id),className:r,children:e.label},e.id)})})}var vo=(e,t,n)=>{let[r,i]=(0,y.useState)(``);return(0,y.useEffect)(()=>{if(!n){i(``);return}let a=r.length;if(a<e.length){let n=setTimeout(()=>{i(e.slice(0,a+1))},t);return()=>clearTimeout(n)}},[n,r,e,t]),{displayedText:r,isComplete:r.length===e.length&&e.length>0}};function yo(e,t,n,r){let i=e.animate??!1,a=no(e,t),o=setTimeout(i?()=>r(!0):n,a);return()=>clearTimeout(o)}var bo=(e,t,n)=>{let[r,i]=(0,y.useState)(!1);return(0,y.useEffect)(()=>{if(e)return yo(e,t,n,i)},[e,n,t]),{isTyping:r,setIsTyping:i}},xo=({line:e})=>{let t=e.depth??0;if(t===0)return null;let n=(e.connectors??[]).slice(0,t-1).map((e,t)=>(0,C.jsx)(`span`,{className:`tree-connector ${e?`tree-connector-pipe`:`tree-connector-empty`}`},t)),r=e.isLast?`tree-connector-last`:`tree-connector-mid`;return(0,C.jsxs)(C.Fragment,{children:[n,(0,C.jsx)(`span`,{className:`tree-connector ${r}`})]})},So=({visibleLines:e,isTyping:t,currentLine:n,displayedText:r,animateLines:i,reserveCursor:a})=>{let o=i?`terminal-line-enter`:``;return(0,C.jsxs)(C.Fragment,{children:[e.map((e,t)=>(0,C.jsx)(Co,{line:e,animation:o,reserveCursor:a},t)),t&&n&&(0,C.jsx)(Bo,{currentLine:n,displayedText:r})]})};function Co({line:e,animation:t,reserveCursor:n}){let{text:r}=e,i={__html:r};return(0,C.jsxs)(`div`,{className:`${K.line} ${t} ${e.className??``}`,children:[e.prefix&&(0,C.jsx)(`span`,{className:K.prefix,children:e.prefix}),(0,C.jsx)(xo,{line:e}),(0,C.jsx)(`span`,{dangerouslySetInnerHTML:i}),n&&(0,C.jsx)(`span`,{className:`${K.cursor} invisible !animate-none`})]})}var wo=({demos:e,lineProps:t})=>(0,C.jsxs)(`div`,{className:`${K.content} terminal-content-layered min-h-0 flex-1`,children:[e.map((e,t)=>(0,C.jsx)(`div`,{className:`terminal-content-sizer`,"aria-hidden":`true`,children:(0,C.jsx)(So,{visibleLines:e.lines,isTyping:!1,currentLine:void 0,displayedText:``,animateLines:!1,reserveCursor:!0})},t)),(0,C.jsx)(`div`,{className:`terminal-content-output`,children:(0,C.jsx)(So,{...t})})]}),To=(e,t,n)=>{if(e&&!t)return n};function Eo(e){let[t,n]=(0,y.useState)(0),[r,i]=(0,y.useState)(0),[a,o]=(0,y.useState)([]),[s,c]=(0,y.useState)(!e),[l,u]=(0,y.useState)(!e);return{currentDemoIndex:t,setCurrentDemoIndex:n,currentLineIndex:r,setCurrentLineIndex:i,visibleLines:a,setVisibleLines:o,hasStarted:s,setHasStarted:c,isFinished:l,setIsFinished:u}}function Do(){let e=(0,y.useRef)(null);return(0,y.useEffect)(()=>()=>{e.current&&clearTimeout(e.current)},[]),e}function Oo(e,t){let{shouldAnimate:n=!0,demos:r,onComplete:i}=t,{setVisibleLines:a,setIsFinished:o}=e;(0,y.useEffect)(()=>{if(n)return;let e=r.flatMap(e=>e.lines);a(e),o(!0),i?.()},[n,r,i])}function ko(e,t){let{hasStarted:n,setHasStarted:r}=t,i=new IntersectionObserver(e=>{e[0]?.isIntersecting&&!n&&r(!0)},ro);return e&&i.observe(e),()=>{e&&i.unobserve(e)}}function Ao(e,t,n){let{hasStarted:r,setHasStarted:i}=e,{startAnimation:a}=t;(0,y.useEffect)(()=>{if(a!==void 0){a&&!r&&i(!0);return}return ko(n.current,e)},[r,a])}function jo(e){let{setCurrentLineIndex:t,setVisibleLines:n}=e;return(0,y.useCallback)(()=>{t(0),n([])},[])}function Mo(e,t,n){let{currentDemoIndex:r,setCurrentDemoIndex:i,setIsFinished:a}=e,{demos:o,loop:s=!0,onComplete:c}=t,l=r===o.length-1;if(l&&!s){a(!0),c?.();return}let u=r+1;i(l?0:u),n()}function No(e,t){let{currentDemoIndex:n}=e,{demos:r,loop:i=!0,onComplete:a}=t,o=jo(e);return(0,y.useCallback)(()=>Mo(e,t,o),[n,r.length,i,o,a])}function Po(e,t,n,r){let{currentLineIndex:i,setCurrentLineIndex:a,setVisibleLines:o}=e,s=t.lines[i],c=i===t.lines.length-1;if(s&&o(e=>e.concat(s)),c){let e=t.pauseAfter??2e3;n.current=setTimeout(r,e);return}a(i+1)}function Fo(e,t,n,r){let{currentDemoIndex:i,currentLineIndex:a}=e,o=t.demos[i],s=o?.lines[a];return(0,y.useCallback)(()=>Po(e,o,n,r),[a,o,r,s])}function Io(e,t,n,r){(0,y.useEffect)(()=>{e&&t&&(n(!1),r())},[e,t,r,n])}function Lo(e,t,n){let{currentDemoIndex:r,currentLineIndex:i,hasStarted:a,isFinished:o,visibleLines:s}=e,{demos:c,timing:l,typingSpeed:u=12,shouldAnimate:d=!0}=t,f=c[r]?.lines[i],{isTyping:p,setIsTyping:m}=bo(To(a,o,f),l,n),{displayedText:h,isComplete:g}=vo(f?.text??``,u,p);return Io(g,p,m,n),{visibleLines:s,isTyping:p,currentLine:f,displayedText:h,animateLines:d&&a}}function Ro(e){let{shouldAnimate:t=!0}=e,n=Eo(t),r=(0,y.useRef)(null),i=Do();return Oo(n,e),Ao(n,e,r),{containerRef:r,lineProps:Lo(n,e,Fo(n,e,i,No(n,e)))}}var zo=e=>{let{demos:t,hideHeader:n=!1,minHeight:r}=e,{containerRef:i,lineProps:a}=Ro(e),o=(0,C.jsx)(wo,{demos:t,lineProps:a});return n?(0,C.jsx)(`div`,{ref:i,className:`bg-transparent`,children:o}):(0,C.jsx)(`div`,{ref:i,children:(0,C.jsx)(ho,{className:io,height:r,minHeight:r,children:o})})};function Bo({currentLine:e,displayedText:t}){return(0,C.jsxs)(`div`,{className:`${K.line} ${e.className??``}`,children:[e.prefix&&(0,C.jsx)(`span`,{className:K.prefix,children:e.prefix}),(0,C.jsx)(xo,{line:e}),(0,C.jsx)(`span`,{dangerouslySetInnerHTML:{__html:t}}),(0,C.jsx)(`span`,{className:K.cursor})]})}var Vo=`pastoralist-hero-animation-seen`,Ho=[`#ff0000`,`#ff8000`,`#ffff00`,`#00ff00`,`#0080ff`,`#8000ff`],Uo=()=>sessionStorage.getItem(Vo)===`true`,Wo={idle:{after:{500:`logoVisible`}},logoVisible:{after:{700:`textVisible`}},textVisible:{after:{400:`terminalVisible`}},terminalVisible:{on:{TERMINAL_DONE:`terminalComplete`}},terminalComplete:{after:{500:`rainbow`}},rainbow:{after:{700:`done`}},done:{}},Go=e=>_({id:`hero`,initial:e?`done`:`terminalVisible`,states:Wo}),Ko=[.16,1,.3,1],qo=[0,.45,.78,1],Jo=[1,1.14,.98,1],Yo=[0,12,-4,0],Xo=[1,1.18,.96,1],Zo=-18,Qo=-32,$o={opacity:0,x:Zo,scale:1},es={opacity:1,x:0,scale:1},ts={opacity:1,x:0,scale:Jo},ns={opacity:0,scale:.75,rotate:Zo},rs={opacity:1,scale:1,rotate:0},is={opacity:1,rotate:Yo,scale:Xo},as={duration:.4,ease:Ko},os={duration:.62,ease:Ko,times:qo},ss={duration:.2,ease:`easeOut`},cs={duration:.72,ease:Ko,times:qo},Y={section:`relative flex items-start justify-center px-4 md:px-8 pt-6 pb-16 md:pt-8 md:pb-20 overflow-hidden min-h-screen`,article:`max-w-2xl md:max-w-5xl w-full`,logoHeader:`text-center mb-10 md:mb-12`,logo:`mx-auto h-24 w-24 md:h-36 md:w-36`,main:`flex flex-col-reverse gap-10 lg:flex-row lg:items-center lg:gap-10 lg:justify-between`,aside:`mt-6 lg:mt-0 w-full text-left lg:flex-[1.05]`,terminalFrame:`relative mx-auto w-full max-w-lg lg:mx-0`,contentHeader:`text-center lg:max-w-2xl lg:flex-[0.95] lg:text-left`,h1:`text-3xl sm:text-4xl md:text-5xl lg:text-[3.35rem] font-black leading-[1.05] tracking-tight mb-8`,nav:`flex flex-col sm:flex-row items-center sm:items-stretch gap-4 sm:gap-5 justify-center lg:justify-start`,codeBlock:`flex h-12 w-full max-w-md items-center gap-3 rounded-2xl border border-base-content/10 bg-base-100/85 px-3 shadow-sm shadow-base-content/5 backdrop-blur sm:w-auto`,code:`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-[0.95rem] font-medium`},X={logoAlt:`Pastoralist Logo`,headingStart:`Pastoralist`,headingMid:`tracks, documents, and cleans up your npm dependency overrides`,headingHighlight:`automatically`,emoji:`👍`,command:`npm install -g pastoralist`,docsSlug:`introduction`,buttonText:`Get Started`},ls=[`idle`,`logoVisible`,`textVisible`,`terminalVisible`,`terminalComplete`,`rainbow`,`done`];function us(e,t){let n=ls.indexOf(t);return ls.slice(n).some(t=>e.matches(t))}function ds(e,t){return e?ts:t?es:$o}function fs(e,t){return e?is:t?rs:ns}function ps(e){return e?os:as}function ms(e){return e?cs:ss}function hs(e){let[t]=(0,y.useState)(()=>e||Uo()),n=(0,y.useMemo)(()=>Go(t),[t]),[r,i]=v(n);return{wasAlreadySeen:t,snapshot:r,handleTerminalComplete:()=>{let e={type:`TERMINAL_DONE`};r.can(e)&&(i(e),sessionStorage.setItem(Vo,`true`))}}}function gs(e,t){let n=(0,y.useRef)(null);return(0,y.useEffect)(()=>{let r=n.current;if(e||!t||!r)return;let i=r.getBoundingClientRect(),a={particleCount:100,spread:70,origin:{x:(i.left+i.width/2)/window.innerWidth,y:(i.top+i.height/2)/window.innerHeight},colors:Ho};U(()=>import(`./confetti.module-75bydEUS.js`),[]).then(({default:e})=>e(a)).catch(()=>void 0)},[t,e]),n}function _s({showComplete:e}){let t=hs(e);return(0,C.jsxs)(`section`,{id:`hero`,className:Y.section,children:[(0,C.jsx)(Ns,{}),(0,C.jsx)(eo,{}),(0,C.jsxs)(`article`,{className:Y.article,style:{position:`relative`,zIndex:1},children:[(0,C.jsx)(ys,{state:t}),(0,C.jsxs)(`main`,{className:Y.main,children:[(0,C.jsx)(xs,{state:t}),(0,C.jsx)(Cs,{state:t})]})]})]})}function vs(){let e=`/pastoralist`;return`${e.endsWith(`/`)?e:e+`/`}pastoralist-logo.svg`}function ys({state:e}){let t=vs();return(0,C.jsx)(`header`,{className:Y.logoHeader,children:(0,C.jsx)(qa,{maskSrc:t,children:(0,C.jsx)(bs,{src:t,state:e})})})}function bs({src:e,state:t}){let{wasAlreadySeen:n,snapshot:i}=t,a=us(i,`logoVisible`);return(0,C.jsx)(r.img,{src:e,alt:X.logoAlt,className:Y.logo,initial:!n&&{opacity:0,y:16,scale:.75},animate:a?{opacity:1,y:0,scale:1}:void 0,transition:{duration:.5,ease:Ko}})}function xs({state:e}){let{wasAlreadySeen:t,snapshot:n}=e,i=us(n,`terminalVisible`);return(0,C.jsx)(r.aside,{className:Y.aside,initial:!t&&{opacity:0,x:Qo},animate:i?{opacity:1,x:0}:void 0,transition:{duration:.7,ease:Ko},children:(0,C.jsx)(Ss,{state:e,terminalVisible:i})})}function Ss({state:e,terminalVisible:t}){let{wasAlreadySeen:n,handleTerminalComplete:r}=e;return(0,C.jsxs)(`div`,{className:Y.terminalFrame,children:[(0,C.jsx)(Ps,{}),(0,C.jsx)(zo,{demos:po,loop:!1,typingSpeed:18,startAnimation:t,shouldAnimate:!n,minHeight:ao,onComplete:r})]})}function Cs({state:e}){let{wasAlreadySeen:t,snapshot:n}=e,i=us(n,`textVisible`);return(0,C.jsxs)(r.header,{className:Y.contentHeader,initial:!t&&{opacity:0,y:32},animate:i?{opacity:1,y:0}:void 0,transition:{duration:.7,ease:Ko},children:[(0,C.jsx)(ws,{state:e}),(0,C.jsx)(As,{})]})}function ws({state:e}){return(0,C.jsxs)(`h1`,{className:Y.h1,children:[(0,C.jsx)(`span`,{className:`font-bold gradient-text`,children:X.headingStart}),` `,X.headingMid,(0,C.jsx)(Es,{state:e})]})}function Ts({wasAlreadySeen:e,snapshot:t}){return{wasAlreadySeen:e,terminalComplete:us(t,`terminalComplete`),rainbowVisible:us(t,`rainbow`),celebrationActive:t.matches(`rainbow`),announcementSettled:us(t,`done`)}}function Es({state:e}){let t=Ts(e),n=gs(t.wasAlreadySeen,t.rainbowVisible);return(0,C.jsxs)(`span`,{className:`ml-2 inline-flex items-baseline gap-1 whitespace-nowrap align-baseline`,children:[(0,C.jsx)(Os,{state:t,targetRef:n}),(0,C.jsx)(ks,{state:t})]})}function Ds(e){return`inline-block ${e.rainbowVisible?`rainbow-text`:`text-base-content`} ${e.announcementSettled?`[animation:gradient-shimmer_3.2s_ease-in-out_1.4s_infinite]`:``}`}function Os({state:e,targetRef:t}){let{wasAlreadySeen:n,terminalComplete:i,celebrationActive:a}=e,o=Ds(e),s=ds(a,i),c=ps(a);return(0,C.jsx)(r.span,{ref:t,className:o,initial:!n&&$o,animate:s,transition:c,"aria-hidden":!i,children:X.headingHighlight})}function ks({state:e}){let{wasAlreadySeen:t,terminalComplete:n,celebrationActive:i}=e,a=fs(i,n),o=ms(i);return(0,C.jsx)(r.span,{className:`inline-block origin-[50%_80%]`,initial:!t&&ns,animate:a,transition:o,"aria-hidden":!n,children:X.emoji})}function As(){let{docsSlug:e}=X;return(0,C.jsxs)(`nav`,{className:Y.nav,children:[(0,C.jsx)(s,{to:`/docs/$slug/`,params:{slug:e},preload:`intent`,children:(0,C.jsxs)(`button`,{className:`btn btn-lg btn-primary rounded-2xl whitespace-nowrap`,children:[X.buttonText,(0,C.jsx)(Ht,{className:`size-4`})]})}),(0,C.jsxs)(`figure`,{className:Y.codeBlock,children:[(0,C.jsx)(`code`,{className:Y.code,children:X.command}),(0,C.jsx)(Ka,{})]})]})}function js(){let e=!Pn();return(0,C.jsx)(_s,{showComplete:e})}var Ms=`polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 150%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)`;function Ns(){return(0,C.jsxs)(`figure`,{className:`absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl`,"aria-hidden":`true`,children:[(0,C.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] block`,style:{clipPath:Ms}}),(0,C.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(100%)] sm:w-[72.1875rem] block`,style:{clipPath:Ms}})]})}function Ps(){return(0,C.jsx)(`div`,{className:`pointer-events-none absolute inset-x-8 bottom-2 h-24 rounded-full bg-gradient-to-r from-sky-500/18 via-cyan-400/10 to-emerald-400/16 blur-3xl`,"aria-hidden":`true`})}var Fs=[`Tracks override dependencies`,`Documents security fixes with CVE references`,`Cleans up orphaned overrides`,`Works with npm, yarn, pnpm, and bun`],Is=-8,Ls={list:`mt-6 divide-y divide-base-content/10 border-y border-base-content/10 text-base-content/80`,item:`flex items-start gap-3 py-3`,icon:`check-icon mt-0.5`};function Rs({isVisible:e}){return(0,C.jsx)(`ul`,{className:Ls.list,children:Fs.map((t,n)=>(0,C.jsx)(zs,{text:t,index:n,isVisible:e},t))})}function zs({text:e,index:t,isVisible:n}){let i={duration:.3,delay:t*.15,ease:`easeOut`};return(0,C.jsxs)(r.li,{className:Ls.item,initial:{opacity:0,x:Is},animate:n?{opacity:1,x:0}:{},transition:i,children:[(0,C.jsx)(Bs,{isVisible:n,transition:i}),(0,C.jsx)(`span`,{children:e})]})}function Bs({isVisible:e,transition:t}){return(0,C.jsx)(r.span,{className:Ls.icon,initial:{opacity:0,scale:.5},animate:e?{opacity:1,scale:1}:{},transition:t,children:(0,C.jsx)(Wt,{className:`w-5 h-5`})})}var Vs=[{id:`cli`,label:`CLI Output`},{id:`json`,label:`package.json`}],Hs=`{
  "name": "my-app",
  "scripts": {
    "postinstall": "pastoralist"
  },
  "overrides": {
    "lodash": "4.17.21"
  },
  "pastoralist": {
    "appendix": {
      "lodash@4.17.21": {
        "dependents": { "express": "^4.18.0" }
      }
    }
  }
}`;function Us({line:e}){let t=`${K.line} ${e.className??``}`,n=e.prefix?(0,C.jsx)(`span`,{className:K.prefix,children:e.prefix}):null,{text:r}=e;return(0,C.jsxs)(`div`,{className:t,children:[n,(0,C.jsx)(xo,{line:e}),(0,C.jsx)(`span`,{dangerouslySetInnerHTML:{__html:r}})]})}function Ws(){let e=fo[0].lines.map((e,t)=>(0,C.jsx)(Us,{line:e},t));return(0,C.jsx)(`div`,{className:K.content,children:(0,C.jsx)(`div`,{className:`space-y-1`,children:e})})}function Gs({shouldAnimate:e,onComplete:t}){return e?(0,C.jsx)(zo,{demos:fo,loop:!1,typingSpeed:20,shouldAnimate:!0,onComplete:t,hideHeader:!0}):(0,C.jsx)(Ws,{})}function Ks(){return(0,C.jsx)(`div`,{className:K.content,children:(0,C.jsx)(y.Suspense,{fallback:(0,C.jsx)(`pre`,{className:`text-sm leading-relaxed text-base-content`,children:(0,C.jsx)(`code`,{children:Hs})}),children:(0,C.jsx)(Xi,{code:Hs,lang:`json`})})})}function qs({shouldAnimate:e=!1,onComplete:t=()=>void 0}){let[n,r]=(0,y.useState)(`cli`),i={activeTab:n,shouldAnimate:e,onComplete:t};return(0,C.jsx)(ho,{className:`${K.window} ${K.windowMaxWidth}`,tabs:Vs,activeTab:n,onTabChange:r,height:`400px`,minHeight:`400px`,children:(0,C.jsx)(Js,{...i})})}function Js({activeTab:e,shouldAnimate:t,onComplete:n}){return(0,C.jsx)(`div`,{className:`min-h-0 flex-1 overflow-auto`,children:e===`cli`?(0,C.jsx)(Gs,{shouldAnimate:t,onComplete:n}):(0,C.jsx)(Ks,{})})}var Ys=`pastoralist-codeblock-animation-seen`,Xs=()=>sessionStorage.getItem(Ys)===`true`,Z={section:`py-16 lg:py-24 bg-base-200/50 border-y border-base-content/10`,article:`lg:flex gap-10 items-center max-w-2xl md:max-w-5xl mx-auto px-4 transition-[opacity,transform] duration-700 ease-out`,articleVisible:`opacity-100 translate-y-0`,articleHidden:`opacity-0 translate-y-8`,header:`lg:max-w-md flex flex-col justify-center`,h2:`text-3xl lg:text-4xl font-black`,description:`mt-6 text-lg text-base-content/80`,nav:`flex gap-4 mt-8`,aside:`flex-1 mt-8 lg:mt-0`},Zs={headingStart:`Simple`,headingEnd:`Override Tracking`,description:`Pastoralist creates an appendix that documents why each override exists. Track which packages depend on each override, detect security fixes, and clean up stale overrides when they're no longer needed.`,learnMoreSlug:`introduction`,githubHref:`https://github.com/yowainwright/pastoralist`};function Qs(e){let[t,n]=(0,y.useState)(()=>e||Xs()),{ref:r,isVisible:i}=Nn({initialInView:e});return{ref:r,active:t||i,handleComplete:()=>{n(!0),sessionStorage.setItem(Ys,`true`)},shouldAnimate:!t&&i}}function $s({showComplete:e}){let{ref:t,active:n,handleComplete:r,shouldAnimate:i}=Qs(e);return(0,C.jsx)(`section`,{id:`features`,className:Z.section,children:(0,C.jsxs)(`article`,{ref:t,className:`${Z.article} ${n?Z.articleVisible:Z.articleHidden}`,children:[(0,C.jsx)(tc,{active:n}),(0,C.jsx)(`aside`,{className:Z.aside,children:(0,C.jsx)(qs,{shouldAnimate:i,onComplete:r})})]})})}function ec(){let e=!Pn();return(0,C.jsx)($s,{showComplete:e})}function tc({active:e}){return(0,C.jsxs)(`header`,{className:Z.header,children:[(0,C.jsxs)(`h2`,{className:Z.h2,children:[(0,C.jsx)(`span`,{className:`gradient-text`,children:Zs.headingStart}),` `,Zs.headingEnd]}),(0,C.jsx)(`p`,{className:Z.description,children:Zs.description}),(0,C.jsx)(Rs,{isVisible:e}),(0,C.jsx)(nc,{})]})}function nc(){let{learnMoreSlug:e}=Zs;return(0,C.jsxs)(`nav`,{className:Z.nav,children:[(0,C.jsx)(s,{to:`/docs/$slug/`,params:{slug:e},preload:`intent`,className:`btn btn-lg btn-primary rounded-2xl`,children:`Learn More`}),(0,C.jsx)(`a`,{href:Zs.githubHref,className:`btn btn-lg btn-ghost rounded-2xl`,children:`View on GitHub`})]})}var rc=[{title:`The Problem`,description:`Overrides exist but nobody knows why. Which packages depend on it?`},{title:`Run Pastoralist`,description:`Pastoralist scans your dependencies and documents your overrides.`},{title:`Automatic Documentation`,description:`Now you know why each override exists, what depends on it, and any associated CVEs.`}],ic=[`Undocumented overrides`,`Execute pastoralist`,`Pastoralist manages the rest`],ac=5,Q=[`  "pastoralist": {`,`    "appendix": {`,`      "lodash@4.17.21": {`,`        "dependents": {`,`          "express": "^4.18.0"`,`        },`,`        "ledger": {`,`          "reason": "security",`,`          "cve": "CVE-2020-8203"`,`        }`,`      }`,`    }`,`  }`],oc=Q.length,sc=44+(ac+oc)*16,cc=(ac+oc)*16,lc=`pastoralist`,uc={base:`step cursor-pointer transition-all duration-200 text-base-content`,active:`step-primary [&::before]:!bg-gradient-to-b [&::before]:!from-blue-400 [&::before]:!to-blue-500 [&::before]:shadow-md [&::before]:shadow-blue-500/25 [&::before]:!text-white [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-29px)] [&::before]:!z-[999] [&::after]:!bg-blue-500`,inactive:`[&::before]:text-base-content [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-32px)] [&::before]:!z-[999] [&::after]:!bg-base-300`},dc={before:`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white [background:linear-gradient(to_bottom,var(--color-red-400),var(--color-red-500))] border-2 border-red-600 shadow-md shadow-red-500/25`,cli:`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white [background:linear-gradient(to_bottom,var(--color-blue-400),var(--color-blue-500))] border-2 border-blue-600 shadow-md shadow-blue-500/25`,after:`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white [background:linear-gradient(to_bottom,var(--color-green-400),var(--color-green-500))] border-2 border-green-600 shadow-md shadow-green-500/25`},fc=/"([^"]+)":/g,pc=/: "([^"]+)"/g,mc=[`"pastoralist"`,`"appendix"`,`"lodash@`,`"dependents"`,`"express"`,`"ledger"`,`"reason"`,`"cve"`],hc=e=>mc.some(t=>e.includes(t)),gc=e=>e.replace(fc,`<span class="text-primary">"$1"</span>:`).replace(pc,`: <span class="text-success">"$1"</span>`),_c=e=>{let{stepNumber:t,title:n,description:r,visible:i,showEmoji:a,verticalCenter:o}=e;return i?(0,C.jsx)(`div`,{className:`absolute z-10 w-64 right-4 ${o?`top-1/2 -translate-y-1/2`:`top-12`} animate-pop-in`,children:(0,C.jsxs)(`div`,{className:`bg-base-100/95 backdrop-blur-sm border-2 border-blue-600 rounded-lg shadow-xl shadow-blue-500/15 p-4`,children:[(0,C.jsx)(vc,{title:n,stepNumber:t}),(0,C.jsxs)(`div`,{className:`text-sm text-base-content/70 ml-8`,children:[r,a&&(0,C.jsx)(`span`,{className:`inline-block ml-1 animate-bounce-once`,children:`⚡`})]})]})}):null};function vc({title:e,stepNumber:t}){return(0,C.jsxs)(`div`,{className:`flex items-center gap-2 mb-1`,children:[(0,C.jsx)(`span`,{className:`flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-b from-blue-400 to-blue-500 border-2 border-blue-600 text-white text-sm font-bold shadow-md shadow-blue-500/25`,children:t}),(0,C.jsx)(`span`,{className:`font-bold text-base-content`,children:e})]})}var yc=({isActive:e})=>(0,C.jsx)(ho,{isActive:e,fileName:`package.json`,children:(0,C.jsxs)(`div`,{className:K.contentPadding,style:{height:`auto`},children:[(0,C.jsx)(`div`,{className:`${K.line} text-base-content/50`,children:`{`}),(0,C.jsxs)(`div`,{className:K.line,children:[`  `,(0,C.jsx)(`span`,{className:`text-primary`,children:`"overrides"`}),`: `,`{`]}),(0,C.jsxs)(`div`,{className:K.line,children:[`    `,(0,C.jsx)(`span`,{className:`text-primary`,children:`"lodash"`}),`:`,` `,(0,C.jsx)(`span`,{className:`text-success`,children:`"4.17.21"`})]}),(0,C.jsx)(`div`,{className:K.line,children:`  }`}),(0,C.jsx)(`div`,{className:`${K.line} text-base-content/50`,children:`}`})]})}),bc=e=>{let{isActive:t}=e;return(0,C.jsx)(ho,{isActive:t,children:(0,C.jsx)(Cc,{props:e})})};function xc({showSpinner:e}){let t=e?`text-cyan-400`:`invisible`;return(0,C.jsxs)(`div`,{className:`${K.line} ${t}`,"aria-hidden":!e,children:[(0,C.jsx)(`span`,{className:`inline-block animate-spin mr-2`,children:`⠋`}),`Scanning overrides...`]})}function Sc({showSuccess:e}){let t=e?`text-success`:`invisible`;return(0,C.jsx)(`div`,{className:`${K.line} ${t}`,"aria-hidden":!e,children:`└── The herd is safe! 🐑`})}function Cc({props:e}){let{typedCommand:t,phase:n,showSpinner:r,showSuccess:i}=e,a=n===`step2`;return(0,C.jsxs)(`div`,{className:`${K.contentPadding}`,style:{height:`auto`,padding:`0.75rem 1rem`},children:[(0,C.jsxs)(`div`,{className:K.line,children:[(0,C.jsx)(`span`,{className:K.prefix,children:`$`}),(0,C.jsx)(`span`,{children:t}),a&&(0,C.jsx)(`span`,{className:K.cursor})]}),(0,C.jsx)(xc,{showSpinner:r}),(0,C.jsx)(Sc,{showSuccess:i})]})}var wc=({line:e,isAdded:t=!1,className:n})=>{let r=t?`terminal-line json-added`:`terminal-line`,i=n?`${r} ${n}`:r;if(!hc(e))return(0,C.jsx)(`div`,{className:i,children:e});let a=gc(e);return(0,C.jsx)(`div`,{className:i,dangerouslySetInnerHTML:{__html:a}})},Tc=({isActive:e,appendixLines:t})=>(0,C.jsx)(ho,{isActive:e,fileName:`package.json`,minHeight:`${sc}px`,children:(0,C.jsx)(Ec,{appendixLines:t})});function Ec({appendixLines:e}){let t=`${cc}px`,n=e>0;return(0,C.jsxs)(`div`,{className:K.contentPadding,style:{minHeight:t},children:[(0,C.jsx)(Dc,{showComma:n}),(0,C.jsx)(Oc,{appendixLines:e}),(0,C.jsx)(`div`,{className:`${K.line} text-base-content/50`,children:`}`})]})}function Dc({showComma:e}){return(0,C.jsxs)(C.Fragment,{children:[(0,C.jsx)(`div`,{className:`${K.line} text-base-content/50`,children:`{`}),(0,C.jsxs)(`div`,{className:K.line,children:[`  `,(0,C.jsx)(`span`,{className:`text-primary`,children:`"overrides"`}),`: `,`{`]}),(0,C.jsxs)(`div`,{className:K.line,children:[`    `,(0,C.jsx)(`span`,{className:`text-primary`,children:`"lodash"`}),`:`,` `,(0,C.jsx)(`span`,{className:`text-success`,children:`"4.17.21"`})]}),(0,C.jsxs)(`div`,{className:K.line,children:[`  }`,e&&`,`]})]})}function Oc({appendixLines:e}){let t=Q.slice(0,e),n=Q.slice(e);return(0,C.jsxs)(C.Fragment,{children:[t.map((e,t)=>(0,C.jsx)(wc,{line:e,isAdded:!0},t)),n.map((e,t)=>(0,C.jsx)(wc,{line:e,isAdded:!0,className:`invisible`},`hidden-${t}`))]})}var kc=(e,t)=>e===3&&t===`complete`,Ac=(e,t,n)=>e>t||kc(t,n),jc=({activeStep:e,phase:t,onStepClick:n})=>(0,C.jsx)(`ul`,{className:`steps w-full`,children:ic.map((r,i)=>(0,C.jsx)(Mc,{step:r,index:i,activeStep:e,phase:t,onStepClick:n},i))});function Mc({step:e,index:t,activeStep:n,phase:r,onStepClick:i}){let a=t+1,o=Ac(n,a,r),s=n>=a?uc.active:uc.inactive,c=o?`✓`:a;return(0,C.jsx)(`li`,{className:`${uc.base} ${s}`,onClick:()=>i(a),"data-content":c,children:e})}function Nc(){let[e,t]=(0,y.useState)(`idle`),[n,r]=(0,y.useState)(``),[i,a]=(0,y.useState)(0);return{phase:e,setPhase:t,typedCommand:n,setTypedCommand:r,activeStep:i,setActiveStep:a}}function Pc(){let[e,t]=(0,y.useState)(0),[n,r]=(0,y.useState)(!1),[i,a]=(0,y.useState)(!1);return{appendixLines:e,setAppendixLines:t,showLightning:n,setShowLightning:r,showAllPopovers:i,setShowAllPopovers:a}}function Fc(){let[e,t]=(0,y.useState)(!1),[n,r]=(0,y.useState)(!1),[i,a]=(0,y.useState)(!1);return{showSpinner:e,setShowSpinner:t,showSuccess:n,setShowSuccess:r,isPaused:i,setIsPaused:a}}function Ic(){let e=Nc(),t=Pc(),n=Fc(),r={hasStarted:(0,y.useRef)(!1),animationRef:(0,y.useRef)(null),pausedState:(0,y.useRef)(null)};return Object.assign({},e,t,n,r)}function Lc({animationRef:e}){return(0,y.useCallback)(()=>{e.current&&=(clearInterval(e.current),null)},[])}function Rc(e,t,n){t(),e.setPhase(`complete`),e.setShowAllPopovers(!0),n?.(),setTimeout(()=>e.setShowLightning(!0),100)}function zc(e,t,n){return(0,y.useCallback)(r=>{let i=r;e.animationRef.current=setInterval(()=>{if(i<Q.length){e.setAppendixLines(i+1),i++;return}Rc(e,t,n)},25)},[t])}function Bc(e,t){e.setShowSpinner(!1),e.setShowSuccess(!0),setTimeout(()=>{e.setPhase(`step3`),e.setActiveStep(3),t(0)},200)}function Vc(e,t,n){t(),setTimeout(()=>{e.setPhase(`checking`),e.setShowSpinner(!0),setTimeout(()=>Bc(e,n),350)},60)}function Hc(e,t,n,r){let i=t;e.animationRef.current=setInterval(()=>{if(i<11){e.setTypedCommand(lc.slice(0,i+1)),i++;return}Vc(e,n,r)},10)}function Uc(e,t,n){return(0,y.useCallback)(()=>{e.setPhase(`step2`),e.setActiveStep(2),Hc(e,0,t,n)},[t,n])}function Wc(e,t){return(0,y.useCallback)(()=>{t(),e.setTypedCommand(``),e.setShowSpinner(!1),e.setShowSuccess(!1),e.setAppendixLines(0),e.setShowLightning(!1)},[t])}function Gc(e,t,n){return(0,y.useCallback)(()=>{t(),e.setPhase(`step1`),e.setActiveStep(1),setTimeout(n,400)},[t,n])}function Kc(e,t,n,r){let{phase:i,typedCommand:a,appendixLines:o}=t;if(i===`step2`&&a.length<11){Hc(e,a.length,n,r);return}i===`step3`&&o<Q.length&&r(o)}function qc(e,t,n){let{isPaused:r,pausedState:i,setIsPaused:a}=e;return(0,y.useCallback)(()=>{let o=i.current;r&&o&&(a(!1),i.current=null,Kc(e,o,t,n))},[r,t,n])}function Jc(e,t){let n=Lc(e),r=zc(e,n,t),i=Uc(e,n,r);return{clear:n,start:Gc(e,Wc(e,n),i),resume:qc(e,n,r)}}function Yc(e,t,n,r){if(t&&n){if(!e.hasStarted.current){e.hasStarted.current=!0,r.start();return}e.isPaused&&r.resume()}}function Xc(e,t){(0,y.useEffect)(()=>{t||e.hasStarted.current||(e.hasStarted.current=!0,e.setPhase(`complete`),e.setTypedCommand(lc),e.setAppendixLines(Q.length),e.setActiveStep(3),e.setShowAllPopovers(!0),e.setShowLightning(!0),e.setShowSuccess(!0))},[t])}var Zc={1:`step1`,2:`step2`,3:`step3`};function Qc(e,t,n){n();let{phase:r,typedCommand:i,appendixLines:a}=e;e.pausedState.current={phase:r,typedCommand:i,appendixLines:a},e.setIsPaused(!0),e.setShowAllPopovers(!1),e.setActiveStep(t);let o=Zc[t];o&&e.setPhase(o)}function $c(e,t){let{isPaused:n,activeStep:r,showAllPopovers:i}=e;return n?r===t:r>=t||i}function el(e){return{isStep1Active:$c(e,1),isStep2Active:$c(e,2),isStep3Active:$c(e,3)}}function tl(e){let{phase:t,typedCommand:n,showSpinner:r,showSuccess:i}=e,{appendixLines:a,activeStep:o,showLightning:s,showAllPopovers:c}=e;return{phase:t,typedCommand:n,showSpinner:r,showSuccess:i,appendixLines:a,activeStep:o,showLightning:s,showAllPopovers:c}}function nl(e,t){let n=Ic(),r=Jc(n,t),{ref:i}=kn({threshold:.3,onChange:t=>Yc(n,t,e,r)});Xc(n,e);let a=e=>Qc(n,e,r.clear),o=tl(n),s=el(n);return Object.assign({},o,s,{containerRef:i,handleStepClick:a})}function rl({shouldAnimate:e=!0,onComplete:t}){let n=nl(e,t),{containerRef:r,phase:i,activeStep:a,handleStepClick:o}=n;return(0,C.jsxs)(`div`,{ref:r,className:`flex flex-col gap-6`,children:[(0,C.jsx)(jc,{activeStep:a,phase:i,onStepClick:o}),(0,C.jsx)(`div`,{className:`h-6 w-px bg-primary/20 mx-auto`}),(0,C.jsx)(il,{state:n})]})}function il({state:e}){let{isStep1Active:t,isStep3Active:n,showLightning:r,appendixLines:i}=e;return(0,C.jsxs)(`div`,{className:`grid md:grid-cols-2 gap-6 lg:gap-8`,children:[(0,C.jsxs)(`div`,{className:`flex flex-col gap-4`,children:[(0,C.jsx)(al,{isStep1Active:t}),(0,C.jsx)(ol,{state:e})]}),(0,C.jsx)(sl,{isStep3Active:n,showLightning:r,appendixLines:i})]})}function al({isStep1Active:e}){return(0,C.jsxs)(`div`,{className:`relative flex flex-col`,children:[(0,C.jsx)(_c,{stepNumber:1,...rc[0],visible:e}),(0,C.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,C.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Undocumented overrides`}),(0,C.jsx)(`span`,{className:dc.before,children:`Before`})]}),(0,C.jsx)(yc,{isActive:e})]})}function ol({state:e}){let{isStep2Active:t,typedCommand:n,phase:r,showSpinner:i,showSuccess:a}=e,o={isActive:t,typedCommand:n,phase:r,showSpinner:i,showSuccess:a};return(0,C.jsxs)(`div`,{className:`relative`,children:[(0,C.jsx)(_c,{stepNumber:2,...rc[1],visible:t}),(0,C.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,C.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Execute the pastoralist cli`}),(0,C.jsx)(`span`,{className:dc.cli,children:`CLI`})]}),(0,C.jsx)(bc,{...o})]})}function sl({isStep3Active:e,showLightning:t,appendixLines:n}){return(0,C.jsxs)(`div`,{className:`relative flex flex-col`,children:[(0,C.jsx)(_c,{stepNumber:3,...rc[2],visible:e,showEmoji:t,verticalCenter:!0}),(0,C.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,C.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Documented overrides`}),(0,C.jsx)(`span`,{className:dc.after,children:`After`})]}),(0,C.jsx)(Tc,{isActive:e,appendixLines:n})]})}function cl(){return(0,C.jsxs)(`div`,{className:`flex flex-col gap-6`,children:[(0,C.jsx)(ll,{}),(0,C.jsx)(`div`,{className:`h-6 w-px bg-primary/20 mx-auto`}),(0,C.jsxs)(`div`,{className:`grid md:grid-cols-2 gap-6 lg:gap-8`,children:[(0,C.jsxs)(`div`,{className:`flex flex-col gap-4`,children:[(0,C.jsx)(ul,{}),(0,C.jsx)(pl,{})]}),(0,C.jsx)(dl,{})]})]})}function ll(){return(0,C.jsx)(`ul`,{className:`steps w-full`,children:ic.map((e,t)=>(0,C.jsx)(`li`,{className:`step cursor-pointer transition-all duration-200 text-base-content step-primary [&::before]:!bg-gradient-to-b [&::before]:!from-blue-400 [&::before]:!to-blue-500 [&::before]:shadow-md [&::before]:shadow-blue-500/25 [&::before]:!text-white [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-29px)] [&::before]:!z-[999] [&::after]:!bg-blue-500`,"data-content":`✓`,children:e},t))})}function ul(){return(0,C.jsxs)(`div`,{className:`relative flex flex-col`,children:[(0,C.jsx)(_c,{stepNumber:1,...rc[0],visible:!0}),(0,C.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,C.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Undocumented overrides`}),(0,C.jsx)(`span`,{className:`badge badge-lg text-white bg-gradient-to-b from-red-400 to-red-500 border-2 border-red-600 shadow-md shadow-red-500/25 p-2`,children:`Before`})]}),(0,C.jsx)(yc,{isActive:!0})]})}function dl(){return(0,C.jsxs)(`div`,{className:`relative flex flex-col`,children:[(0,C.jsx)(_c,{stepNumber:3,...rc[2],visible:!0,showEmoji:!0,verticalCenter:!0}),(0,C.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,C.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Documented overrides`}),(0,C.jsx)(`span`,{className:`badge badge-lg text-white bg-gradient-to-b from-green-400 to-green-500 border-2 border-green-600 shadow-md shadow-green-500/25 p-2`,children:`After`})]}),(0,C.jsx)(Tc,{isActive:!0,appendixLines:Q.length})]})}var fl={isActive:!0,typedCommand:lc,phase:`complete`,showSpinner:!1,showSuccess:!0};function pl(){return(0,C.jsxs)(`div`,{className:`relative`,children:[(0,C.jsx)(_c,{stepNumber:2,...rc[1],visible:!0}),(0,C.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,C.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Execute the pastoralist cli`}),(0,C.jsx)(`span`,{className:`badge badge-lg text-white bg-gradient-to-b from-blue-400 to-blue-500 border-2 border-blue-600 shadow-md shadow-blue-500/25 p-2`,children:`CLI`})]}),(0,C.jsx)(bc,{...fl})]})}var ml=`pastoralist-transform-animation-seen`,hl=()=>sessionStorage.getItem(ml)===`true`,gl=()=>sessionStorage.setItem(ml,`true`);function _l({isStatic:e}){return e?(0,C.jsx)(cl,{}):(0,C.jsx)(rl,{shouldAnimate:!0,onComplete:gl})}var vl=`polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 150%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)`,yl={section:`relative py-16 lg:py-24 overflow-hidden`,article:`max-w-2xl md:max-w-6xl mx-auto px-4`,header:`text-center mb-10 transition-[opacity,transform] duration-700 ease-out`,headerVisible:`opacity-100 translate-y-0`,headerHidden:`opacity-0 translate-y-8`,h2:`text-3xl lg:text-4xl font-black text-base-content`,description:`mt-4 text-lg text-base-content/80 max-w-2xl mx-auto`},bl={headingStart:`See the`,headingHighlight:`Transformation`,description:`Pastoralist reads your overrides and creates a detailed appendix documenting why each one exists, who depends on it, and any security context.`};function xl({showComplete:e}){let[t]=(0,y.useState)(()=>e||hl()),{ref:n,isVisible:r}=Nn({initialInView:e});return(0,C.jsxs)(`section`,{id:`demo`,className:yl.section,children:[(0,C.jsx)(Cl,{}),(0,C.jsxs)(`article`,{className:yl.article,children:[(0,C.jsx)(wl,{headerRef:n,headerVisible:r}),(0,C.jsx)(_l,{isStatic:t})]})]})}function Sl(){let e=!Pn();return(0,C.jsx)(xl,{showComplete:e})}function Cl(){return(0,C.jsxs)(`figure`,{className:`absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl`,"aria-hidden":`true`,children:[(0,C.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] block`,style:{clipPath:vl}}),(0,C.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(100%)] sm:w-[72.1875rem] block`,style:{clipPath:vl}})]})}function wl({headerRef:e,headerVisible:t}){return(0,C.jsxs)(`header`,{ref:e,className:`${yl.header} ${t?yl.headerVisible:yl.headerHidden}`,children:[(0,C.jsxs)(`h2`,{className:yl.h2,children:[bl.headingStart,` `,(0,C.jsx)(`span`,{className:`gradient-text`,children:bl.headingHighlight})]}),(0,C.jsx)(`p`,{className:yl.description,children:bl.description})]})}var Tl=`get-started`,El={heading:`Ready to`,headingHighlight:`get started`,command:`npm install -g pastoralist`,buttonText:`Learn More`,docsSlug:`introduction`},$={section:`py-16 lg:py-24 border-t border-base-content/10`,article:`max-w-2xl md:max-w-6xl mx-auto px-4 text-center`,articleVisible:`animate-in fade-in slide-in-from-bottom-4 duration-700`,articleHidden:`opacity-0`,heading:`text-2xl lg:text-3xl font-black text-base-content mb-6`,nav:`flex flex-col justify-center items-center gap-4`,codeBlock:`flex h-12 w-fit items-center gap-3 rounded-2xl border border-base-content/10 bg-base-100/85 px-3 shadow-sm shadow-base-content/5 backdrop-blur`,code:`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-[0.95rem] font-medium`,button:`btn btn-lg btn-primary rounded-2xl`};function Dl({id:e,showComplete:t}){let{ref:n,isVisible:r}=Nn({initialInView:t}),i=`${$.article} ${r?$.articleVisible:$.articleHidden}`;return(0,C.jsx)(`section`,{id:e,className:$.section,children:(0,C.jsxs)(`article`,{ref:n,className:i,children:[(0,C.jsxs)(`h3`,{className:$.heading,children:[El.heading,` `,(0,C.jsx)(`span`,{className:`gradient-text`,children:El.headingHighlight}),`?`]}),(0,C.jsx)(kl,{})]})})}function Ol({id:e=Tl}){let t=!Pn();return(0,C.jsx)(Dl,{id:e,showComplete:t})}function kl(){let{docsSlug:e}=El;return(0,C.jsxs)(`nav`,{className:$.nav,children:[(0,C.jsxs)(`figure`,{className:$.codeBlock,children:[(0,C.jsx)(`code`,{className:$.code,children:El.command}),(0,C.jsx)(Ka,{})]}),(0,C.jsx)(s,{to:`/docs/$slug/`,params:{slug:e},preload:`intent`,children:(0,C.jsxs)(`button`,{className:$.button,children:[El.buttonText,(0,C.jsx)(Ht,{className:`size-4`})]})})]})}function Al(){return(0,C.jsxs)(C.Fragment,{children:[(0,C.jsx)(js,{}),(0,C.jsx)(ec,{}),(0,C.jsx)(Sl,{}),(0,C.jsx)(Ol,{})]})}var jl=d({component:()=>(0,C.jsx)(o,{})}),Ml=p({getParentRoute:()=>jl,path:`/`,component:()=>(0,C.jsx)(Jr,{children:(0,C.jsx)(Al,{})})}),Nl=p({getParentRoute:()=>jl,path:`/docs/$slug`,component:()=>(0,C.jsx)(Kr,{children:(0,C.jsx)(Ma,{})})}),Pl=jl.addChildren([Ml,Nl]),Fl=()=>c({routeTree:Pl,basepath:`/pastoralist`,trailingSlash:`always`});function Il(){let e=document.getElementById(`root`);if(!e)throw Error(`Missing root element`);return e}var Ll=Fl(),Rl=Il(),zl=Rl.dataset.prerendered===`true`,Bl=zl?(0,C.jsx)(m,{router:Ll}):(0,C.jsx)(f,{router:Ll});function Vl(){return(0,y.useEffect)(()=>Dt(Rl),[]),(0,C.jsx)(y.StrictMode,{children:(0,C.jsx)(Ot,{children:Bl})})}var Hl=(0,C.jsx)(Vl,{});zl?(0,E.hydrateRoot)(Rl,Hl):(0,E.createRoot)(Rl).render(Hl);export{U as n,Ri as t};
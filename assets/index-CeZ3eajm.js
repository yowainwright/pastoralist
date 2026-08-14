const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/advanced-features-DajmqwpN.js","assets/motion-C16f7Ten.js","assets/rolldown-runtime-hePW80VL.js","assets/api-reference-DAvHC_tg.js","assets/architecture-BFHCsutF.js","assets/codelab-C-TE4Qfb.js","assets/configuration-BDS7ZBHf.js","assets/github-action-BmVJGYWP.js","assets/introduction-BifnmxP1.js","assets/onboarding-BwXvkEn0.js","assets/security-K0lxRvsQ.js","assets/setup-D9ON5hg0.js","assets/troubleshooting-DLxq5-nu.js","assets/workspaces-su7pl0Oo.js","assets/highlighter-BXDqwenT.js","assets/shiki-BzV0Wj0L.js","assets/Mermaid-pamgRpeF.js","assets/chunk-Y2CYZVJY-DsF7k-Jl.js","assets/src-B6xuSHsQ.js","assets/chunk-I66GZJ75-C2FtQthW.js","assets/chunk-NSK5VX7P-v9TvJ6Sx.js","assets/dist-v5Q1xZ2K.js","assets/chunk-4I5QYGJK-Ct3dSUuR.js","assets/chunk-WRU74C26-D9MOT_y9.js","assets/chunk-7BUUIJ7U-Bb538aSH.js","assets/chunk-UBXNYLIW-DEw5hyJf.js","assets/chunk-W5SLKNZC-DBpyKzIo.js","assets/chunk-QR6OTTB3-C4SHAyYW.js","assets/rough.esm-Dy-Kn_BL.js","assets/chunk-7Z6QIM7H-FaRWhpk5.js","assets/line-BgnC3vBu.js","assets/path-fybaL0A-.js","assets/array-BifhSqXX.js"])))=>i.map(i=>d[i]);
import{r as e}from"./rolldown-runtime-hePW80VL.js";import{n as t,r as n,t as r}from"./motion-C16f7Ten.js";import{n as i,t as a}from"./react-vendor-B6ETkhbf.js";import{a as o,c as s,i as c,l,n as u,o as d,r as f,s as p,t as m,u as h}from"./router-DXHBc7aA.js";import{t as g}from"./fuse-COMZIxA7.js";import{n as _,t as v}from"./state-wUDpyA10.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var y=e(n(),1),b={};function x(e,t){let n=y.useRef(b);return n.current===b&&(n.current=e(t)),n}var S=Object.freeze([]);Object.freeze({});var C=typeof document<`u`?y.useLayoutEffect:()=>{};function w(e){y.useEffect(e,S)}var T=0,ee=class e{static create(){return new e}currentId=T;start(e,t){this.clear(),this.currentId=setTimeout(()=>{this.currentId=T,t()},e)}isStarted(){return this.currentId!==T}clear=()=>{this.currentId!==T&&(clearTimeout(this.currentId),this.currentId=T)};disposeEffect=()=>this.clear};function te(){let e=x(ee.create).current;return w(e.disposeEffect),e}function E(e,t){let n=[`mouse`,`pen`];return t||n.push(``,void 0),n.includes(e)}function ne(e,t){return t!=null&&!E(t)?0:typeof e==`function`?e():e}function re(e,t,n){let r=ne(e,n);return typeof r==`number`?r:r?.[t]}var D=t(),O=y.createContext({hasProvider:!1,timeoutMs:0,delayRef:{current:0},initialDelayRef:{current:0},timeout:new ee,currentIdRef:{current:null},currentContextRef:{current:null}});function k(e){let{children:t,delay:n,timeoutMs:r=0}=e,i=y.useRef(n),a=y.useRef(n),o=y.useRef(null),s=y.useRef(null),c=te();return C(()=>{if(a.current=n,!o.current){i.current=n;return}i.current={open:re(i.current,`open`),close:re(n,`close`)}},[n,o,i,a]),(0,D.jsx)(O.Provider,{value:y.useMemo(()=>({hasProvider:!0,delayRef:i,initialDelayRef:a,currentIdRef:o,timeoutMs:r,currentContextRef:s,timeout:c}),[r,c]),children:t})}var ie=y.createContext(void 0),ae=function(e){let{delay:t,closeDelay:n,timeout:r=400}=e,i=y.useMemo(()=>({open:t,close:n}),[t,n]);return(0,D.jsx)(ie.Provider,{value:t,children:(0,D.jsx)(k,{delay:i,timeoutMs:r,children:e.children})})},A=a();function oe(e){var t,n,r=``;if(typeof e==`string`||typeof e==`number`)r+=e;else if(typeof e==`object`){if(Array.isArray(e)){var i=e.length;for(t=0;t<i;t++)e[t]&&(n=oe(e[t]))&&(r&&(r+=` `),r+=n)}else for(n in e)e[n]&&(r&&(r+=` `),r+=n)}return r}function se(){for(var e,t,n=0,r=``,i=arguments.length;n<i;n++)(e=arguments[n])&&(t=oe(e))&&(r&&(r+=` `),r+=t);return r}var ce=(e,t)=>{let n=Array(e.length+t.length);for(let t=0;t<e.length;t++)n[t]=e[t];for(let r=0;r<t.length;r++)n[e.length+r]=t[r];return n},le=(e,t)=>({classGroupId:e,validator:t}),j=(e=new Map,t=null,n)=>({nextPart:e,validators:t,classGroupId:n}),M=`-`,ue=[],de=`arbitrary..`,N=e=>{let t=me(e),{conflictingClassGroups:n,conflictingClassGroupModifiers:r}=e;return{getClassGroupId:e=>{if(e.startsWith(`[`)&&e.endsWith(`]`))return pe(e);let n=e.split(M);return fe(n,+(n[0]===``&&n.length>1),t)},getConflictingClassGroupIds:(e,t)=>{if(t){let t=r[e],i=n[e];return t?i?ce(i,t):t:i||ue}return n[e]||ue}}},fe=(e,t,n)=>{if(e.length-t===0)return n.classGroupId;let r=e[t],i=n.nextPart.get(r);if(i){let n=fe(e,t+1,i);if(n)return n}let a=n.validators;if(a===null)return;let o=t===0?e.join(M):e.slice(t).join(M),s=a.length;for(let e=0;e<s;e++){let t=a[e];if(t.validator(o))return t.classGroupId}},pe=e=>e.slice(1,-1).indexOf(`:`)===-1?void 0:(()=>{let t=e.slice(1,-1),n=t.indexOf(`:`),r=t.slice(0,n);return r?de+r:void 0})(),me=e=>{let{theme:t,classGroups:n}=e;return he(n,t)},he=(e,t)=>{let n=j();for(let r in e){let i=e[r];ge(i,n,r,t)}return n},ge=(e,t,n,r)=>{let i=e.length;for(let a=0;a<i;a++){let i=e[a];_e(i,t,n,r)}},_e=(e,t,n,r)=>{if(typeof e==`string`){ve(e,t,n);return}if(typeof e==`function`){ye(e,t,n,r);return}be(e,t,n,r)},ve=(e,t,n)=>{let r=e===``?t:xe(t,e);r.classGroupId=n},ye=(e,t,n,r)=>{if(Se(e)){ge(e(r),t,n,r);return}t.validators===null&&(t.validators=[]),t.validators.push(le(n,e))},be=(e,t,n,r)=>{let i=Object.entries(e),a=i.length;for(let e=0;e<a;e++){let[a,o]=i[e];ge(o,xe(t,a),n,r)}},xe=(e,t)=>{let n=e,r=t.split(M),i=r.length;for(let e=0;e<i;e++){let t=r[e],i=n.nextPart.get(t);i||(i=j(),n.nextPart.set(t,i)),n=i}return n},Se=e=>`isThemeGetter`in e&&e.isThemeGetter===!0,Ce=e=>{if(e<1)return{get:()=>void 0,set:()=>{}};let t=0,n=Object.create(null),r=Object.create(null),i=(i,a)=>{n[i]=a,t++,t>e&&(t=0,r=n,n=Object.create(null))};return{get(e){let t=n[e];if(t!==void 0)return t;if((t=r[e])!==void 0)return i(e,t),t},set(e,t){e in n?n[e]=t:i(e,t)}}},we=`!`,Te=`:`,Ee=[],De=(e,t,n,r,i)=>({modifiers:e,hasImportantModifier:t,baseClassName:n,maybePostfixModifierPosition:r,isExternal:i}),Oe=e=>{let{prefix:t,experimentalParseClassName:n}=e,r=e=>{let t=[],n=0,r=0,i=0,a,o=e.length;for(let s=0;s<o;s++){let o=e[s];if(n===0&&r===0){if(o===Te){t.push(e.slice(i,s)),i=s+1;continue}if(o===`/`){a=s;continue}}o===`[`?n++:o===`]`?n--:o===`(`?r++:o===`)`&&r--}let s=t.length===0?e:e.slice(i),c=s,l=!1;s.endsWith(we)?(c=s.slice(0,-1),l=!0):s.startsWith(we)&&(c=s.slice(1),l=!0);let u=a&&a>i?a-i:void 0;return De(t,l,c,u)};if(t){let e=t+Te,n=r;r=t=>t.startsWith(e)?n(t.slice(e.length)):De(Ee,!1,t,void 0,!0)}if(n){let e=r;r=t=>n({className:t,parseClassName:e})}return r},ke=e=>{let t=new Map;return e.orderSensitiveModifiers.forEach((e,n)=>{t.set(e,1e6+n)}),e=>{let n=[],r=[];for(let i=0;i<e.length;i++){let a=e[i],o=a[0]===`[`,s=t.has(a);o||s?(r.length>0&&(r.sort(),n.push(...r),r=[]),n.push(a)):r.push(a)}return r.length>0&&(r.sort(),n.push(...r)),n}},Ae=e=>({cache:Ce(e.cacheSize),parseClassName:Oe(e),sortModifiers:ke(e),postfixLookupClassGroupIds:je(e),...N(e)}),je=e=>{let t=Object.create(null),n=e.postfixLookupClassGroups;if(n)for(let e=0;e<n.length;e++)t[n[e]]=!0;return t},Me=/\s+/,Ne=(e,t)=>{let{parseClassName:n,getClassGroupId:r,getConflictingClassGroupIds:i,sortModifiers:a,postfixLookupClassGroupIds:o}=t,s=[],c=e.trim().split(Me),l=``;for(let e=c.length-1;e>=0;--e){let t=c[e],{isExternal:u,modifiers:d,hasImportantModifier:f,baseClassName:p,maybePostfixModifierPosition:m}=n(t);if(u){l=t+(l.length>0?` `+l:l);continue}let h=!!m,g;if(h){g=r(p.substring(0,m));let e=g&&o[g]?r(p):void 0;e&&e!==g&&(g=e,h=!1)}else g=r(p);if(!g){if(!h){l=t+(l.length>0?` `+l:l);continue}if(g=r(p),!g){l=t+(l.length>0?` `+l:l);continue}h=!1}let _=d.length===0?``:d.length===1?d[0]:a(d).join(`:`),v=f?_+we:_,y=v+g;if(s.indexOf(y)>-1)continue;s.push(y);let b=i(g,h);for(let e=0;e<b.length;++e){let t=b[e];s.push(v+t)}l=t+(l.length>0?` `+l:l)}return l},Pe=(...e)=>{let t=0,n,r,i=``;for(;t<e.length;)(n=e[t++])&&(r=Fe(n))&&(i&&(i+=` `),i+=r);return i},Fe=e=>{if(typeof e==`string`)return e;let t,n=``;for(let r=0;r<e.length;r++)e[r]&&(t=Fe(e[r]))&&(n&&(n+=` `),n+=t);return n},Ie=(e,...t)=>{let n,r,i,a,o=o=>(n=Ae(t.reduce((e,t)=>t(e),e())),r=n.cache.get,i=n.cache.set,a=s,s(o)),s=e=>{let t=r(e);if(t)return t;let a=Ne(e,n);return i(e,a),a};return a=o,(...e)=>a(Pe(...e))},Le=[],P=e=>{let t=t=>t[e]||Le;return t.isThemeGetter=!0,t},Re=/^\[(?:(\w[\w-]*):)?(.+)\]$/i,ze=/^\((?:(\w[\w-]*):)?(.+)\)$/i,Be=/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/,Ve=/^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,He=/\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,Ue=/^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/,We=/^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,Ge=/^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,F=e=>Be.test(e),I=e=>!!e&&!Number.isNaN(Number(e)),L=e=>!!e&&Number.isInteger(Number(e)),Ke=e=>e.endsWith(`%`)&&I(e.slice(0,-1)),R=e=>Ve.test(e),qe=()=>!0,Je=e=>He.test(e)&&!Ue.test(e),Ye=()=>!1,Xe=e=>We.test(e),Ze=e=>Ge.test(e),Qe=e=>!z(e)&&!B(e),$e=e=>e.startsWith(`@container`)&&(e[10]===`/`&&e[11]!==void 0||e[11]===`s`&&e[16]!==void 0&&e.startsWith(`-size/`,10)||e[11]===`n`&&e[18]!==void 0&&e.startsWith(`-normal/`,10)),et=e=>V(e,vt,Ye),z=e=>Re.test(e),tt=e=>V(e,yt,Je),nt=e=>V(e,bt,I),rt=e=>V(e,St,qe),it=e=>V(e,xt,Ye),at=e=>V(e,gt,Ye),ot=e=>V(e,_t,Ze),st=e=>V(e,Ct,Xe),B=e=>ze.test(e),ct=e=>ht(e,yt),lt=e=>ht(e,xt),ut=e=>ht(e,gt),dt=e=>ht(e,vt),ft=e=>ht(e,_t),pt=e=>ht(e,Ct,!0),mt=e=>ht(e,St,!0),V=(e,t,n)=>{let r=Re.exec(e);return r?r[1]?t(r[1]):n(r[2]):!1},ht=(e,t,n=!1)=>{let r=ze.exec(e);return r?r[1]?t(r[1]):n:!1},gt=e=>e===`position`||e===`percentage`,_t=e=>e===`image`||e===`url`,vt=e=>e===`length`||e===`size`||e===`bg-size`,yt=e=>e===`length`,bt=e=>e===`number`,xt=e=>e===`family-name`,St=e=>e===`number`||e===`weight`,Ct=e=>e===`shadow`,wt=Ie(()=>{let e=P(`color`),t=P(`font`),n=P(`text`),r=P(`font-weight`),i=P(`tracking`),a=P(`leading`),o=P(`breakpoint`),s=P(`container`),c=P(`spacing`),l=P(`radius`),u=P(`shadow`),d=P(`inset-shadow`),f=P(`text-shadow`),p=P(`drop-shadow`),m=P(`blur`),h=P(`perspective`),g=P(`aspect`),_=P(`ease`),v=P(`animate`),y=()=>[`auto`,`avoid`,`all`,`avoid-page`,`page`,`left`,`right`,`column`],b=()=>[`center`,`top`,`bottom`,`left`,`right`,`top-left`,`left-top`,`top-right`,`right-top`,`bottom-right`,`right-bottom`,`bottom-left`,`left-bottom`],x=()=>[...b(),B,z],S=()=>[`auto`,`hidden`,`clip`,`visible`,`scroll`],C=()=>[`auto`,`contain`,`none`],w=()=>[B,z,c],T=()=>[F,`full`,`auto`,...w()],ee=()=>[L,`none`,`subgrid`,B,z],te=()=>[`auto`,{span:[`full`,L,B,z]},L,B,z],E=()=>[L,`auto`,B,z],ne=()=>[`auto`,`min`,`max`,`fr`,B,z],re=()=>[`start`,`end`,`center`,`between`,`around`,`evenly`,`stretch`,`baseline`,`center-safe`,`end-safe`],D=()=>[`start`,`end`,`center`,`stretch`,`center-safe`,`end-safe`],O=()=>[`auto`,...w()],k=()=>[F,`auto`,`full`,`dvw`,`dvh`,`lvw`,`lvh`,`svw`,`svh`,`min`,`max`,`fit`,...w()],ie=()=>[F,`screen`,`full`,`dvw`,`lvw`,`svw`,`min`,`max`,`fit`,...w()],ae=()=>[F,`screen`,`full`,`lh`,`dvh`,`lvh`,`svh`,`min`,`max`,`fit`,...w()],A=()=>[e,B,z],oe=()=>[...b(),ut,at,{position:[B,z]}],se=()=>[`no-repeat`,{repeat:[``,`x`,`y`,`space`,`round`]}],ce=()=>[`auto`,`cover`,`contain`,dt,et,{size:[B,z]}],le=()=>[Ke,ct,tt],j=()=>[``,`none`,`full`,l,B,z],M=()=>[``,I,ct,tt],ue=()=>[`solid`,`dashed`,`dotted`,`double`],de=()=>[`normal`,`multiply`,`screen`,`overlay`,`darken`,`lighten`,`color-dodge`,`color-burn`,`hard-light`,`soft-light`,`difference`,`exclusion`,`hue`,`saturation`,`color`,`luminosity`],N=()=>[I,Ke,ut,at],fe=()=>[``,`none`,m,B,z],pe=()=>[`none`,I,B,z],me=()=>[`none`,I,B,z],he=()=>[I,B,z],ge=()=>[F,`full`,...w()];return{cacheSize:500,theme:{animate:[`spin`,`ping`,`pulse`,`bounce`],aspect:[`video`],blur:[R],breakpoint:[R],color:[qe],container:[R],"drop-shadow":[R],ease:[`in`,`out`,`in-out`],font:[Qe],"font-weight":[`thin`,`extralight`,`light`,`normal`,`medium`,`semibold`,`bold`,`extrabold`,`black`],"inset-shadow":[R],leading:[`none`,`tight`,`snug`,`normal`,`relaxed`,`loose`],perspective:[`dramatic`,`near`,`normal`,`midrange`,`distant`,`none`],radius:[R],shadow:[R],spacing:[`px`,I],text:[R],"text-shadow":[R],tracking:[`tighter`,`tight`,`normal`,`wide`,`wider`,`widest`]},classGroups:{aspect:[{aspect:[`auto`,`square`,F,z,B,g]}],container:[`container`],"container-type":[{"@container":[``,`normal`,`size`,B,z]}],"container-named":[$e],columns:[{columns:[I,z,B,s]}],"break-after":[{"break-after":y()}],"break-before":[{"break-before":y()}],"break-inside":[{"break-inside":[`auto`,`avoid`,`avoid-page`,`avoid-column`]}],"box-decoration":[{"box-decoration":[`slice`,`clone`]}],box:[{box:[`border`,`content`]}],display:[`block`,`inline-block`,`inline`,`flex`,`inline-flex`,`table`,`inline-table`,`table-caption`,`table-cell`,`table-column`,`table-column-group`,`table-footer-group`,`table-header-group`,`table-row-group`,`table-row`,`flow-root`,`grid`,`inline-grid`,`contents`,`list-item`,`hidden`],sr:[`sr-only`,`not-sr-only`],float:[{float:[`right`,`left`,`none`,`start`,`end`]}],clear:[{clear:[`left`,`right`,`both`,`none`,`start`,`end`]}],isolation:[`isolate`,`isolation-auto`],"object-fit":[{object:[`contain`,`cover`,`fill`,`none`,`scale-down`]}],"object-position":[{object:x()}],overflow:[{overflow:S()}],"overflow-x":[{"overflow-x":S()}],"overflow-y":[{"overflow-y":S()}],overscroll:[{overscroll:C()}],"overscroll-x":[{"overscroll-x":C()}],"overscroll-y":[{"overscroll-y":C()}],position:[`static`,`fixed`,`absolute`,`relative`,`sticky`],inset:[{inset:T()}],"inset-x":[{"inset-x":T()}],"inset-y":[{"inset-y":T()}],start:[{"inset-s":T(),start:T()}],end:[{"inset-e":T(),end:T()}],"inset-bs":[{"inset-bs":T()}],"inset-be":[{"inset-be":T()}],top:[{top:T()}],right:[{right:T()}],bottom:[{bottom:T()}],left:[{left:T()}],visibility:[`visible`,`invisible`,`collapse`],z:[{z:[L,`auto`,B,z]}],basis:[{basis:[F,`full`,`auto`,s,...w()]}],"flex-direction":[{flex:[`row`,`row-reverse`,`col`,`col-reverse`]}],"flex-wrap":[{flex:[`nowrap`,`wrap`,`wrap-reverse`]}],flex:[{flex:[I,F,`auto`,`initial`,`none`,z]}],grow:[{grow:[``,I,B,z]}],shrink:[{shrink:[``,I,B,z]}],order:[{order:[L,`first`,`last`,`none`,B,z]}],"grid-cols":[{"grid-cols":ee()}],"col-start-end":[{col:te()}],"col-start":[{"col-start":E()}],"col-end":[{"col-end":E()}],"grid-rows":[{"grid-rows":ee()}],"row-start-end":[{row:te()}],"row-start":[{"row-start":E()}],"row-end":[{"row-end":E()}],"grid-flow":[{"grid-flow":[`row`,`col`,`dense`,`row-dense`,`col-dense`]}],"auto-cols":[{"auto-cols":ne()}],"auto-rows":[{"auto-rows":ne()}],gap:[{gap:w()}],"gap-x":[{"gap-x":w()}],"gap-y":[{"gap-y":w()}],"justify-content":[{justify:[...re(),`normal`]}],"justify-items":[{"justify-items":[...D(),`normal`]}],"justify-self":[{"justify-self":[`auto`,...D()]}],"align-content":[{content:[`normal`,...re()]}],"align-items":[{items:[...D(),{baseline:[``,`last`]}]}],"align-self":[{self:[`auto`,...D(),{baseline:[``,`last`]}]}],"place-content":[{"place-content":re()}],"place-items":[{"place-items":[...D(),`baseline`]}],"place-self":[{"place-self":[`auto`,...D()]}],p:[{p:w()}],px:[{px:w()}],py:[{py:w()}],ps:[{ps:w()}],pe:[{pe:w()}],pbs:[{pbs:w()}],pbe:[{pbe:w()}],pt:[{pt:w()}],pr:[{pr:w()}],pb:[{pb:w()}],pl:[{pl:w()}],m:[{m:O()}],mx:[{mx:O()}],my:[{my:O()}],ms:[{ms:O()}],me:[{me:O()}],mbs:[{mbs:O()}],mbe:[{mbe:O()}],mt:[{mt:O()}],mr:[{mr:O()}],mb:[{mb:O()}],ml:[{ml:O()}],"space-x":[{"space-x":w()}],"space-x-reverse":[`space-x-reverse`],"space-y":[{"space-y":w()}],"space-y-reverse":[`space-y-reverse`],size:[{size:k()}],"inline-size":[{inline:[`auto`,...ie()]}],"min-inline-size":[{"min-inline":[`auto`,...ie()]}],"max-inline-size":[{"max-inline":[`none`,...ie()]}],"block-size":[{block:[`auto`,...ae()]}],"min-block-size":[{"min-block":[`auto`,...ae()]}],"max-block-size":[{"max-block":[`none`,...ae()]}],w:[{w:[s,`screen`,...k()]}],"min-w":[{"min-w":[s,`screen`,`none`,...k()]}],"max-w":[{"max-w":[s,`screen`,`none`,`prose`,{screen:[o]},...k()]}],h:[{h:[`screen`,`lh`,...k()]}],"min-h":[{"min-h":[`screen`,`lh`,`none`,...k()]}],"max-h":[{"max-h":[`screen`,`lh`,...k()]}],"font-size":[{text:[`base`,n,ct,tt]}],"font-smoothing":[`antialiased`,`subpixel-antialiased`],"font-style":[`italic`,`not-italic`],"font-weight":[{font:[r,mt,rt]}],"font-stretch":[{"font-stretch":[`ultra-condensed`,`extra-condensed`,`condensed`,`semi-condensed`,`normal`,`semi-expanded`,`expanded`,`extra-expanded`,`ultra-expanded`,Ke,z]}],"font-family":[{font:[lt,it,t]}],"font-features":[{"font-features":[z]}],"fvn-normal":[`normal-nums`],"fvn-ordinal":[`ordinal`],"fvn-slashed-zero":[`slashed-zero`],"fvn-figure":[`lining-nums`,`oldstyle-nums`],"fvn-spacing":[`proportional-nums`,`tabular-nums`],"fvn-fraction":[`diagonal-fractions`,`stacked-fractions`],tracking:[{tracking:[i,B,z]}],"line-clamp":[{"line-clamp":[I,`none`,B,nt]}],leading:[{leading:[a,...w()]}],"list-image":[{"list-image":[`none`,B,z]}],"list-style-position":[{list:[`inside`,`outside`]}],"list-style-type":[{list:[`disc`,`decimal`,`none`,B,z]}],"text-alignment":[{text:[`left`,`center`,`right`,`justify`,`start`,`end`]}],"placeholder-color":[{placeholder:A()}],"text-color":[{text:A()}],"text-decoration":[`underline`,`overline`,`line-through`,`no-underline`],"text-decoration-style":[{decoration:[...ue(),`wavy`]}],"text-decoration-thickness":[{decoration:[I,`from-font`,`auto`,B,tt]}],"text-decoration-color":[{decoration:A()}],"underline-offset":[{"underline-offset":[I,`auto`,B,z]}],"text-transform":[`uppercase`,`lowercase`,`capitalize`,`normal-case`],"text-overflow":[`truncate`,`text-ellipsis`,`text-clip`],"text-wrap":[{text:[`wrap`,`nowrap`,`balance`,`pretty`]}],indent:[{indent:w()}],"tab-size":[{tab:[L,B,z]}],"vertical-align":[{align:[`baseline`,`top`,`middle`,`bottom`,`text-top`,`text-bottom`,`sub`,`super`,B,z]}],whitespace:[{whitespace:[`normal`,`nowrap`,`pre`,`pre-line`,`pre-wrap`,`break-spaces`]}],break:[{break:[`normal`,`words`,`all`,`keep`]}],wrap:[{wrap:[`break-word`,`anywhere`,`normal`]}],hyphens:[{hyphens:[`none`,`manual`,`auto`]}],content:[{content:[`none`,B,z]}],"bg-attachment":[{bg:[`fixed`,`local`,`scroll`]}],"bg-clip":[{"bg-clip":[`border`,`padding`,`content`,`text`]}],"bg-origin":[{"bg-origin":[`border`,`padding`,`content`]}],"bg-position":[{bg:oe()}],"bg-repeat":[{bg:se()}],"bg-size":[{bg:ce()}],"bg-image":[{bg:[`none`,{linear:[{to:[`t`,`tr`,`r`,`br`,`b`,`bl`,`l`,`tl`]},L,B,z],radial:[``,B,z],conic:[L,B,z]},ft,ot]}],"bg-color":[{bg:A()}],"gradient-from-pos":[{from:le()}],"gradient-via-pos":[{via:le()}],"gradient-to-pos":[{to:le()}],"gradient-from":[{from:A()}],"gradient-via":[{via:A()}],"gradient-to":[{to:A()}],rounded:[{rounded:j()}],"rounded-s":[{"rounded-s":j()}],"rounded-e":[{"rounded-e":j()}],"rounded-t":[{"rounded-t":j()}],"rounded-r":[{"rounded-r":j()}],"rounded-b":[{"rounded-b":j()}],"rounded-l":[{"rounded-l":j()}],"rounded-ss":[{"rounded-ss":j()}],"rounded-se":[{"rounded-se":j()}],"rounded-ee":[{"rounded-ee":j()}],"rounded-es":[{"rounded-es":j()}],"rounded-tl":[{"rounded-tl":j()}],"rounded-tr":[{"rounded-tr":j()}],"rounded-br":[{"rounded-br":j()}],"rounded-bl":[{"rounded-bl":j()}],"border-w":[{border:M()}],"border-w-x":[{"border-x":M()}],"border-w-y":[{"border-y":M()}],"border-w-s":[{"border-s":M()}],"border-w-e":[{"border-e":M()}],"border-w-bs":[{"border-bs":M()}],"border-w-be":[{"border-be":M()}],"border-w-t":[{"border-t":M()}],"border-w-r":[{"border-r":M()}],"border-w-b":[{"border-b":M()}],"border-w-l":[{"border-l":M()}],"divide-x":[{"divide-x":M()}],"divide-x-reverse":[`divide-x-reverse`],"divide-y":[{"divide-y":M()}],"divide-y-reverse":[`divide-y-reverse`],"border-style":[{border:[...ue(),`hidden`,`none`]}],"divide-style":[{divide:[...ue(),`hidden`,`none`]}],"border-color":[{border:A()}],"border-color-x":[{"border-x":A()}],"border-color-y":[{"border-y":A()}],"border-color-s":[{"border-s":A()}],"border-color-e":[{"border-e":A()}],"border-color-bs":[{"border-bs":A()}],"border-color-be":[{"border-be":A()}],"border-color-t":[{"border-t":A()}],"border-color-r":[{"border-r":A()}],"border-color-b":[{"border-b":A()}],"border-color-l":[{"border-l":A()}],"divide-color":[{divide:A()}],"outline-style":[{outline:[...ue(),`none`,`hidden`]}],"outline-offset":[{"outline-offset":[I,B,z]}],"outline-w":[{outline:[``,I,ct,tt]}],"outline-color":[{outline:A()}],shadow:[{shadow:[``,`none`,u,pt,st]}],"shadow-color":[{shadow:A()}],"inset-shadow":[{"inset-shadow":[`none`,d,pt,st]}],"inset-shadow-color":[{"inset-shadow":A()}],"ring-w":[{ring:M()}],"ring-w-inset":[`ring-inset`],"ring-color":[{ring:A()}],"ring-offset-w":[{"ring-offset":[I,tt]}],"ring-offset-color":[{"ring-offset":A()}],"inset-ring-w":[{"inset-ring":M()}],"inset-ring-color":[{"inset-ring":A()}],"text-shadow":[{"text-shadow":[`none`,f,pt,st]}],"text-shadow-color":[{"text-shadow":A()}],opacity:[{opacity:[I,B,z]}],"mix-blend":[{"mix-blend":[...de(),`plus-darker`,`plus-lighter`]}],"bg-blend":[{"bg-blend":de()}],"mask-clip":[{"mask-clip":[`border`,`padding`,`content`,`fill`,`stroke`,`view`]},`mask-no-clip`],"mask-composite":[{mask:[`add`,`subtract`,`intersect`,`exclude`]}],"mask-image-linear-pos":[{"mask-linear":[I]}],"mask-image-linear-from-pos":[{"mask-linear-from":N()}],"mask-image-linear-to-pos":[{"mask-linear-to":N()}],"mask-image-linear-from-color":[{"mask-linear-from":A()}],"mask-image-linear-to-color":[{"mask-linear-to":A()}],"mask-image-t-from-pos":[{"mask-t-from":N()}],"mask-image-t-to-pos":[{"mask-t-to":N()}],"mask-image-t-from-color":[{"mask-t-from":A()}],"mask-image-t-to-color":[{"mask-t-to":A()}],"mask-image-r-from-pos":[{"mask-r-from":N()}],"mask-image-r-to-pos":[{"mask-r-to":N()}],"mask-image-r-from-color":[{"mask-r-from":A()}],"mask-image-r-to-color":[{"mask-r-to":A()}],"mask-image-b-from-pos":[{"mask-b-from":N()}],"mask-image-b-to-pos":[{"mask-b-to":N()}],"mask-image-b-from-color":[{"mask-b-from":A()}],"mask-image-b-to-color":[{"mask-b-to":A()}],"mask-image-l-from-pos":[{"mask-l-from":N()}],"mask-image-l-to-pos":[{"mask-l-to":N()}],"mask-image-l-from-color":[{"mask-l-from":A()}],"mask-image-l-to-color":[{"mask-l-to":A()}],"mask-image-x-from-pos":[{"mask-x-from":N()}],"mask-image-x-to-pos":[{"mask-x-to":N()}],"mask-image-x-from-color":[{"mask-x-from":A()}],"mask-image-x-to-color":[{"mask-x-to":A()}],"mask-image-y-from-pos":[{"mask-y-from":N()}],"mask-image-y-to-pos":[{"mask-y-to":N()}],"mask-image-y-from-color":[{"mask-y-from":A()}],"mask-image-y-to-color":[{"mask-y-to":A()}],"mask-image-radial":[{"mask-radial":[B,z]}],"mask-image-radial-from-pos":[{"mask-radial-from":N()}],"mask-image-radial-to-pos":[{"mask-radial-to":N()}],"mask-image-radial-from-color":[{"mask-radial-from":A()}],"mask-image-radial-to-color":[{"mask-radial-to":A()}],"mask-image-radial-shape":[{"mask-radial":[`circle`,`ellipse`]}],"mask-image-radial-size":[{"mask-radial":[{closest:[`side`,`corner`],farthest:[`side`,`corner`]}]}],"mask-image-radial-pos":[{"mask-radial-at":b()}],"mask-image-conic-pos":[{"mask-conic":[I]}],"mask-image-conic-from-pos":[{"mask-conic-from":N()}],"mask-image-conic-to-pos":[{"mask-conic-to":N()}],"mask-image-conic-from-color":[{"mask-conic-from":A()}],"mask-image-conic-to-color":[{"mask-conic-to":A()}],"mask-mode":[{mask:[`alpha`,`luminance`,`match`]}],"mask-origin":[{"mask-origin":[`border`,`padding`,`content`,`fill`,`stroke`,`view`]}],"mask-position":[{mask:oe()}],"mask-repeat":[{mask:se()}],"mask-size":[{mask:ce()}],"mask-type":[{"mask-type":[`alpha`,`luminance`]}],"mask-image":[{mask:[`none`,B,z]}],filter:[{filter:[``,`none`,B,z]}],blur:[{blur:fe()}],brightness:[{brightness:[I,B,z]}],contrast:[{contrast:[I,B,z]}],"drop-shadow":[{"drop-shadow":[``,`none`,p,pt,st]}],"drop-shadow-color":[{"drop-shadow":A()}],grayscale:[{grayscale:[``,I,B,z]}],"hue-rotate":[{"hue-rotate":[I,B,z]}],invert:[{invert:[``,I,B,z]}],saturate:[{saturate:[I,B,z]}],sepia:[{sepia:[``,I,B,z]}],"backdrop-filter":[{"backdrop-filter":[``,`none`,B,z]}],"backdrop-blur":[{"backdrop-blur":fe()}],"backdrop-brightness":[{"backdrop-brightness":[I,B,z]}],"backdrop-contrast":[{"backdrop-contrast":[I,B,z]}],"backdrop-grayscale":[{"backdrop-grayscale":[``,I,B,z]}],"backdrop-hue-rotate":[{"backdrop-hue-rotate":[I,B,z]}],"backdrop-invert":[{"backdrop-invert":[``,I,B,z]}],"backdrop-opacity":[{"backdrop-opacity":[I,B,z]}],"backdrop-saturate":[{"backdrop-saturate":[I,B,z]}],"backdrop-sepia":[{"backdrop-sepia":[``,I,B,z]}],"border-collapse":[{border:[`collapse`,`separate`]}],"border-spacing":[{"border-spacing":w()}],"border-spacing-x":[{"border-spacing-x":w()}],"border-spacing-y":[{"border-spacing-y":w()}],"table-layout":[{table:[`auto`,`fixed`]}],caption:[{caption:[`top`,`bottom`]}],transition:[{transition:[``,`all`,`colors`,`opacity`,`shadow`,`transform`,`none`,B,z]}],"transition-behavior":[{transition:[`normal`,`discrete`]}],duration:[{duration:[I,`initial`,B,z]}],ease:[{ease:[`linear`,`initial`,_,B,z]}],delay:[{delay:[I,B,z]}],animate:[{animate:[`none`,v,B,z]}],backface:[{backface:[`hidden`,`visible`]}],perspective:[{perspective:[h,B,z]}],"perspective-origin":[{"perspective-origin":x()}],rotate:[{rotate:pe()}],"rotate-x":[{"rotate-x":pe()}],"rotate-y":[{"rotate-y":pe()}],"rotate-z":[{"rotate-z":pe()}],scale:[{scale:me()}],"scale-x":[{"scale-x":me()}],"scale-y":[{"scale-y":me()}],"scale-z":[{"scale-z":me()}],"scale-3d":[`scale-3d`],skew:[{skew:he()}],"skew-x":[{"skew-x":he()}],"skew-y":[{"skew-y":he()}],transform:[{transform:[B,z,``,`none`,`gpu`,`cpu`]}],"transform-origin":[{origin:x()}],"transform-style":[{transform:[`3d`,`flat`]}],translate:[{translate:ge()}],"translate-x":[{"translate-x":ge()}],"translate-y":[{"translate-y":ge()}],"translate-z":[{"translate-z":ge()}],"translate-none":[`translate-none`],zoom:[{zoom:[L,B,z]}],accent:[{accent:A()}],appearance:[{appearance:[`none`,`auto`]}],"caret-color":[{caret:A()}],"color-scheme":[{scheme:[`normal`,`dark`,`light`,`light-dark`,`only-dark`,`only-light`]}],cursor:[{cursor:[`auto`,`default`,`pointer`,`wait`,`text`,`move`,`help`,`not-allowed`,`none`,`context-menu`,`progress`,`cell`,`crosshair`,`vertical-text`,`alias`,`copy`,`no-drop`,`grab`,`grabbing`,`all-scroll`,`col-resize`,`row-resize`,`n-resize`,`e-resize`,`s-resize`,`w-resize`,`ne-resize`,`nw-resize`,`se-resize`,`sw-resize`,`ew-resize`,`ns-resize`,`nesw-resize`,`nwse-resize`,`zoom-in`,`zoom-out`,B,z]}],"field-sizing":[{"field-sizing":[`fixed`,`content`]}],"pointer-events":[{"pointer-events":[`auto`,`none`]}],resize:[{resize:[`none`,``,`y`,`x`]}],"scroll-behavior":[{scroll:[`auto`,`smooth`]}],"scrollbar-thumb-color":[{"scrollbar-thumb":A()}],"scrollbar-track-color":[{"scrollbar-track":A()}],"scrollbar-gutter":[{"scrollbar-gutter":[`auto`,`stable`,`both`]}],"scrollbar-w":[{scrollbar:[`auto`,`thin`,`none`]}],"scroll-m":[{"scroll-m":w()}],"scroll-mx":[{"scroll-mx":w()}],"scroll-my":[{"scroll-my":w()}],"scroll-ms":[{"scroll-ms":w()}],"scroll-me":[{"scroll-me":w()}],"scroll-mbs":[{"scroll-mbs":w()}],"scroll-mbe":[{"scroll-mbe":w()}],"scroll-mt":[{"scroll-mt":w()}],"scroll-mr":[{"scroll-mr":w()}],"scroll-mb":[{"scroll-mb":w()}],"scroll-ml":[{"scroll-ml":w()}],"scroll-p":[{"scroll-p":w()}],"scroll-px":[{"scroll-px":w()}],"scroll-py":[{"scroll-py":w()}],"scroll-ps":[{"scroll-ps":w()}],"scroll-pe":[{"scroll-pe":w()}],"scroll-pbs":[{"scroll-pbs":w()}],"scroll-pbe":[{"scroll-pbe":w()}],"scroll-pt":[{"scroll-pt":w()}],"scroll-pr":[{"scroll-pr":w()}],"scroll-pb":[{"scroll-pb":w()}],"scroll-pl":[{"scroll-pl":w()}],"snap-align":[{snap:[`start`,`end`,`center`,`align-none`]}],"snap-stop":[{snap:[`normal`,`always`]}],"snap-type":[{snap:[`none`,`x`,`y`,`both`]}],"snap-strictness":[{snap:[`mandatory`,`proximity`]}],touch:[{touch:[`auto`,`none`,`manipulation`]}],"touch-x":[{"touch-pan":[`x`,`left`,`right`]}],"touch-y":[{"touch-pan":[`y`,`up`,`down`]}],"touch-pz":[`touch-pinch-zoom`],select:[{select:[`none`,`text`,`all`,`auto`]}],"will-change":[{"will-change":[`auto`,`scroll`,`contents`,`transform`,B,z]}],fill:[{fill:[`none`,...A()]}],"stroke-w":[{stroke:[I,ct,tt,nt]}],stroke:[{stroke:[`none`,...A()]}],"forced-color-adjust":[{"forced-color-adjust":[`auto`,`none`]}]},conflictingClassGroups:{"container-named":[`container-type`],overflow:[`overflow-x`,`overflow-y`],overscroll:[`overscroll-x`,`overscroll-y`],inset:[`inset-x`,`inset-y`,`inset-bs`,`inset-be`,`start`,`end`,`top`,`right`,`bottom`,`left`],"inset-x":[`right`,`left`],"inset-y":[`top`,`bottom`],flex:[`basis`,`grow`,`shrink`],gap:[`gap-x`,`gap-y`],p:[`px`,`py`,`ps`,`pe`,`pbs`,`pbe`,`pt`,`pr`,`pb`,`pl`],px:[`pr`,`pl`],py:[`pt`,`pb`],m:[`mx`,`my`,`ms`,`me`,`mbs`,`mbe`,`mt`,`mr`,`mb`,`ml`],mx:[`mr`,`ml`],my:[`mt`,`mb`],size:[`w`,`h`],"font-size":[`leading`],"fvn-normal":[`fvn-ordinal`,`fvn-slashed-zero`,`fvn-figure`,`fvn-spacing`,`fvn-fraction`],"fvn-ordinal":[`fvn-normal`],"fvn-slashed-zero":[`fvn-normal`],"fvn-figure":[`fvn-normal`],"fvn-spacing":[`fvn-normal`],"fvn-fraction":[`fvn-normal`],"line-clamp":[`display`,`overflow`],rounded:[`rounded-s`,`rounded-e`,`rounded-t`,`rounded-r`,`rounded-b`,`rounded-l`,`rounded-ss`,`rounded-se`,`rounded-ee`,`rounded-es`,`rounded-tl`,`rounded-tr`,`rounded-br`,`rounded-bl`],"rounded-s":[`rounded-ss`,`rounded-es`],"rounded-e":[`rounded-se`,`rounded-ee`],"rounded-t":[`rounded-tl`,`rounded-tr`],"rounded-r":[`rounded-tr`,`rounded-br`],"rounded-b":[`rounded-br`,`rounded-bl`],"rounded-l":[`rounded-tl`,`rounded-bl`],"border-spacing":[`border-spacing-x`,`border-spacing-y`],"border-w":[`border-w-x`,`border-w-y`,`border-w-s`,`border-w-e`,`border-w-bs`,`border-w-be`,`border-w-t`,`border-w-r`,`border-w-b`,`border-w-l`],"border-w-x":[`border-w-r`,`border-w-l`],"border-w-y":[`border-w-t`,`border-w-b`],"border-color":[`border-color-x`,`border-color-y`,`border-color-s`,`border-color-e`,`border-color-bs`,`border-color-be`,`border-color-t`,`border-color-r`,`border-color-b`,`border-color-l`],"border-color-x":[`border-color-r`,`border-color-l`],"border-color-y":[`border-color-t`,`border-color-b`],translate:[`translate-x`,`translate-y`,`translate-none`],"translate-none":[`translate`,`translate-x`,`translate-y`,`translate-z`],"scroll-m":[`scroll-mx`,`scroll-my`,`scroll-ms`,`scroll-me`,`scroll-mbs`,`scroll-mbe`,`scroll-mt`,`scroll-mr`,`scroll-mb`,`scroll-ml`],"scroll-mx":[`scroll-mr`,`scroll-ml`],"scroll-my":[`scroll-mt`,`scroll-mb`],"scroll-p":[`scroll-px`,`scroll-py`,`scroll-ps`,`scroll-pe`,`scroll-pbs`,`scroll-pbe`,`scroll-pt`,`scroll-pr`,`scroll-pb`,`scroll-pl`],"scroll-px":[`scroll-pr`,`scroll-pl`],"scroll-py":[`scroll-pt`,`scroll-pb`],touch:[`touch-x`,`touch-y`,`touch-pz`],"touch-x":[`touch`],"touch-y":[`touch`],"touch-pz":[`touch`]},conflictingClassGroupModifiers:{"font-size":[`leading`]},postfixLookupClassGroups:[`container-type`],orderSensitiveModifiers:[`*`,`**`,`after`,`backdrop`,`before`,`details-content`,`file`,`first-letter`,`first-line`,`marker`,`placeholder`,`selection`]}}),Tt=typeof document>`u`||(e=>e?.dataset.prerendered===`true`)(document.getElementById(`root`));function Et(...e){return wt(se(e))}function Dt(){return Tt}function Ot(e){delete e.dataset.prerendered}function kt({delay:e=0,...t}){return(0,D.jsx)(ae,{"data-slot":`tooltip-provider`,delay:e,...t})}var At=(...e)=>e.filter((e,t,n)=>!!e&&e.trim()!==``&&n.indexOf(e)===t).join(` `).trim(),jt=e=>e.replace(/([a-z0-9])([A-Z])/g,`$1-$2`).toLowerCase(),Mt=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,t,n)=>n?n.toUpperCase():t.toLowerCase()),Nt=e=>{let t=Mt(e);return t.charAt(0).toUpperCase()+t.slice(1)},Pt={xmlns:`http://www.w3.org/2000/svg`,width:24,height:24,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:2,strokeLinecap:`round`,strokeLinejoin:`round`},Ft=e=>{for(let t in e)if(t.startsWith(`aria-`)||t===`role`||t===`title`)return!0;return!1},It=(0,y.createContext)({}),Lt=()=>(0,y.useContext)(It),Rt=(0,y.forwardRef)(({color:e,size:t,strokeWidth:n,absoluteStrokeWidth:r,className:i=``,children:a,iconNode:o,...s},c)=>{let{size:l=24,strokeWidth:u=2,absoluteStrokeWidth:d=!1,color:f=`currentColor`,className:p=``}=Lt()??{},m=r??d?Number(n??u)*24/Number(t??l):n??u;return(0,y.createElement)(`svg`,{ref:c,...Pt,width:t??l??Pt.width,height:t??l??Pt.height,stroke:e??f,strokeWidth:m,className:At(`lucide`,p,i),...!a&&!Ft(s)&&{"aria-hidden":`true`},...s},[...o.map(([e,t])=>(0,y.createElement)(e,t)),...Array.isArray(a)?a:[a]])}),H=(e,t)=>{let n=(0,y.forwardRef)(({className:n,...r},i)=>(0,y.createElement)(Rt,{ref:i,iconNode:t,className:At(`lucide-${jt(Nt(e))}`,`lucide-${e}`,n),...r}));return n.displayName=Nt(e),n},zt=H(`arrow-right`,[[`path`,{d:`M5 12h14`,key:`1ays0h`}],[`path`,{d:`m12 5 7 7-7 7`,key:`xquz4c`}]]),Bt=H(`check`,[[`path`,{d:`M20 6 9 17l-5-5`,key:`1gmf2c`}]]),Vt=H(`chevron-left`,[[`path`,{d:`m15 18-6-6 6-6`,key:`1wnfg3`}]]),Ht=H(`chevron-right`,[[`path`,{d:`m9 18 6-6-6-6`,key:`mthhwq`}]]),Ut=H(`copy`,[[`rect`,{width:`14`,height:`14`,x:`8`,y:`8`,rx:`2`,ry:`2`,key:`17jyea`}],[`path`,{d:`M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2`,key:`zix9uf`}]]),Wt=H(`link`,[[`path`,{d:`M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71`,key:`1cjeqo`}],[`path`,{d:`M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71`,key:`19qd67`}]]),Gt=H(`menu`,[[`path`,{d:`M4 5h16`,key:`1tepv9`}],[`path`,{d:`M4 12h16`,key:`1lakjw`}],[`path`,{d:`M4 19h16`,key:`1djgab`}]]),Kt=H(`moon`,[[`path`,{d:`M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401`,key:`kfwtm`}]]),qt=H(`search`,[[`path`,{d:`m21 21-4.34-4.34`,key:`14j7rj`}],[`circle`,{cx:`11`,cy:`11`,r:`8`,key:`4ej97u`}]]),Jt=H(`sun`,[[`circle`,{cx:`12`,cy:`12`,r:`4`,key:`4exip2`}],[`path`,{d:`M12 2v2`,key:`tus03m`}],[`path`,{d:`M12 20v2`,key:`1lh1kg`}],[`path`,{d:`m4.93 4.93 1.41 1.41`,key:`149t6j`}],[`path`,{d:`m17.66 17.66 1.41 1.41`,key:`ptbguv`}],[`path`,{d:`M2 12h2`,key:`1t8f8n`}],[`path`,{d:`M20 12h2`,key:`1q8mjw`}],[`path`,{d:`m6.34 17.66-1.41 1.41`,key:`1m8zz5`}],[`path`,{d:`m19.07 4.93-1.41 1.41`,key:`1shlcs`}]]),Yt=H(`Github`,[[`path`,{d:`M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4`,key:`tonef`}],[`path`,{d:`M9 18c-4.51 2-5-2-7-2`,key:`9comsn`}]]),Xt=`/pastoralist`,Zt=Xt.endsWith(`/`)?Xt:`/pastoralist/`;function Qt(){return(0,D.jsxs)(`footer`,{className:`w-full px-4 sm:px-6 md:px-10 xl:px-28 py-6 sm:py-7 border-t border-base-content/10 flex flex-col gap-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center`,children:[(0,D.jsx)(`div`,{className:`flex items-center justify-center sm:justify-start gap-2 order-3 sm:order-1`,children:(0,D.jsxs)(`p`,{className:`text-sm sm:text-base text-center sm:text-left`,children:[`Copyright © `,new Date().getFullYear(),` - All rights reserved`]})}),(0,D.jsx)(`div`,{className:`flex items-center justify-center gap-2 order-1 sm:order-2`,children:(0,D.jsx)(s,{to:`/`,className:`hover:opacity-80 transition-opacity`,children:(0,D.jsx)(`img`,{src:`${Zt}pastoralist-logo.svg`,alt:`Pastoralist Logo`,className:`h-12 w-12`})})}),(0,D.jsx)(`nav`,{className:`flex justify-center sm:justify-end order-2 sm:order-3`,children:(0,D.jsx)(`div`,{className:`grid grid-flow-col gap-4`,children:(0,D.jsx)(`a`,{className:`btn btn-ghost btn-circle flex items-center justify-center`,href:`https://github.com/yowainwright/pastoralist`,"aria-label":`GitHub`,target:`_blank`,rel:`noopener noreferrer`,children:(0,D.jsx)(Yt,{className:`h-5 w-5`})})})})]})}function $t(){let[e,t]=(0,y.useState)(()=>{if(typeof window>`u`)return`lofi`;let e=localStorage.getItem(`theme`);return e===`lofi`||e===`night`?e:window.matchMedia(`(prefers-color-scheme: dark)`).matches?`night`:`lofi`});return(0,y.useEffect)(()=>{document.documentElement.setAttribute(`data-theme`,e),localStorage.setItem(`theme`,e)},[e]),{theme:e,setTheme:t,toggle:()=>t(e=>e===`lofi`?`night`:`lofi`)}}var en=`---
title: Advanced Features
description: Deep dive into pastoralist's advanced capabilities
---

## Nested Overrides (Transitive Dependencies)

Pastoralist supports npm's nested override syntax for overriding transitive dependencies (dependencies of dependencies).

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

This tells npm to use \`pg-types@^4.0.1\` whenever it's required by the \`pg\` package, regardless of what version \`pg\` actually specifies.

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

In monorepos, nested overrides in workspace packages are also tracked. For example,
\`packages/app/package.json\` might contain:

\`\`\`json
{
  "overrides": {
    "pg": {
      "pg-types": "^4.0.1"
    }
  }
}
\`\`\`

Pastoralist will detect and manage these nested overrides across all workspace packages when using the \`--depPaths\` option.

## Patch Support

Pastoralist automatically detects and tracks patches created by tools like \`patch-package\`.

### How It Works

When you have patches in your \`patches/\` directory:

\`\`\`
patches/
├── lodash+4.17.21.patch
├── express+4.18.0.patch
└── react+18.2.0.patch
\`\`\`

Pastoralist will track them in the appendix:

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

When a dependency is removed, pastoralist alerts you:

\`\`\`
🐑 Found 2 potentially unused patch files:
  - patches/old-package+1.0.0.patch
  - patches/removed-dep+2.0.0.patch
Consider removing these patches if the packages are no longer used.
\`\`\`

<a
  href="https://stackblitz.com/fork/github/yowainwright/pastoralist/tree/main/tests/sandboxes/patches?title=Pastoralist%20Patches&file=README.md&startScript=demo&view=editor"
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
  href="https://stackblitz.com/fork/github/yowainwright/pastoralist/tree/main/tests/sandboxes/cleanup?title=Pastoralist%20Cleanup&file=README.md&startScript=demo&view=editor"
  target="_blank"
  rel="noopener noreferrer"
>
  <img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz" />
</a>

### Unused Override Detection

When an override exists but no package in your project depends on it, Pastoralist labels it as \`(unused override)\` in the appendix:

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

Set \`keep: true\` on a ledger entry to prevent \`--remove-unused\` from ever removing it:

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

Pastoralist understands that \`^4.18.0\` could resolve to \`4.18.2\` naturally, so the override might not be necessary unless it's fixing a specific issue.

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

Pastoralist complements \`patch-package\` by tracking which overrides have associated patches:

\`\`\`bash
# Apply a patch
npx patch-package lodash

# Run pastoralist to update tracking
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

Configure automated tools to run pastoralist after updates:

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

1. **Regular Updates**: Run pastoralist on install, scheduled CI, or dependency-update PRs
2. **Review Patches**: Check for upstream fixes when dependencies update
`,tn=`---
title: API Reference
description: Complete reference for pastoralist CLI and Node.js API
---

Pastoralist provides both a CLI interface and a Node.js API for programmatic usage.

:::tip[Configuration Files]
Most CLI options can be configured using config files. See the [Configuration](/docs/configuration) documentation for details on using \`.pastoralistrc\`, \`pastoralist.config.js\`, or \`package.json\` for persistent settings.
:::

## CLI

### \`pastoralist\`

Run pastoralist on the current directory's package.json.

\`\`\`bash
npx pastoralist
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

### \`pastoralist --path <path>\`

Run pastoralist on a specific package.json file.

**params:**

- \`<path>\`: path to a package.json file

\`\`\`bash
# Run on a specific package
npx pastoralist --path packages/app/package.json

# Run on a nested project
npx pastoralist --path ./nested/project/package.json
\`\`\`

### \`pastoralist --depPaths [paths...]\`

Run pastoralist on multiple package.json files using glob patterns.

**params:**

- \`[paths...]\`: array of glob patterns

\`\`\`bash
# Run on all packages in monorepo
npx pastoralist --depPaths "packages/*/package.json"

# Run on multiple directories
npx pastoralist --depPaths "packages/*/package.json" "apps/*/package.json"
\`\`\`

### \`pastoralist --ignore [patterns...]\`

Exclude files matching glob patterns.

**params:**

- \`[patterns...]\`: array of glob patterns to ignore

\`\`\`bash
# Ignore test directories
npx pastoralist --ignore "**/test/**" "**/dist/**"

# Ignore specific packages
npx pastoralist --depPaths "**/*package.json" --ignore "**/node_modules/**" "**/legacy/**"
\`\`\`

### \`pastoralist --root <root>\`

Set the root directory for all operations.

**params:**

- \`<root>\`: root directory path

\`\`\`bash
# Run from different directory
npx pastoralist --root /path/to/project

# Combine with other options
npx pastoralist --root ../my-project --path package.json
\`\`\`

### \`pastoralist init\`

Initialize configuration with the guided setup. The wizard can configure
workspace paths, security scanning, and where the configuration should be saved.

\`\`\`bash
# Start interactive setup
npx pastoralist init
\`\`\`

When run, this will:

- Detect \`workspaces\` entries from \`package.json\`
- Prompt for \`depPaths: "workspace"\` or custom package globs
- Offer security provider and severity threshold setup
- Save configuration to \`package.json\` or a supported config file

### \`pastoralist --init agent-skill\`

Install the bundled Pastoralist agent skill into \`.agents/skills/pastoralist\`.

\`\`\`bash
npx pastoralist --init agent-skill
\`\`\`

\`pastoralist init agent-skill\` is also supported.

### \`pastoralist --interactive\`

Review security fixes interactively. Use this with \`--checkSecurity\` when you
want to approve fixes instead of applying everything with \`--forceSecurityRefactor\`.

\`\`\`bash
# Review security fixes before applying them
npx pastoralist --checkSecurity --interactive
\`\`\`

### \`pastoralist --debug\`

Enable detailed debug output.

\`\`\`bash
npx pastoralist --debug
\`\`\`

### \`pastoralist --dry-run\`

Preview changes without modifying package.json.

\`\`\`bash
npx pastoralist --dry-run
\`\`\`

### \`pastoralist --outputFormat json\`

Return machine-readable output for CI or custom tooling.

\`\`\`bash
npx pastoralist --summary --outputFormat json
\`\`\`

### \`pastoralist --quiet\`

Quiet mode for CI pipelines. Outputs minimal text and uses exit codes.

- Exit 0: No vulnerabilities found
- Exit 1: Vulnerabilities detected

\`\`\`bash
npx pastoralist --quiet --checkSecurity
\`\`\`

### \`pastoralist --summary\`

Display metrics table after run.

\`\`\`bash
npx pastoralist --summary
\`\`\`

### \`pastoralist --setup-hook\`

Add pastoralist to your postinstall script automatically.

\`\`\`bash
npx pastoralist --setup-hook
\`\`\`

### \`pastoralist-setup-local-dev\`

Set up local agent config, selected skills, and selected local hooks.

\`\`\`bash
npx -p pastoralist pastoralist-setup-local-dev --dry-run
npx -p pastoralist pastoralist-setup-local-dev --skills all --hooks git,postinstall
\`\`\`

### \`pastoralist --remove-unused\`

Remove overrides that no package in your project depends on. When Pastoralist detects unused overrides during a run, it displays a notice suggesting this flag.

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
npx pastoralist --checkSecurity --securityProvider osv npm
\`\`\`

### \`pastoralist --forceSecurityRefactor\`

Apply security override fixes without prompting.

\`\`\`bash
npx pastoralist --checkSecurity --forceSecurityRefactor
\`\`\`

### \`pastoralist --strict\`

Fail when a security provider, network request, or API call cannot complete.

\`\`\`bash
npx pastoralist --checkSecurity --strict
\`\`\`

### Cache Options

Control provider cache behavior for security checks.

\`\`\`bash
npx pastoralist --checkSecurity --cache-dir .cache/pastoralist
npx pastoralist --checkSecurity --cache-ttl 3600
npx pastoralist --checkSecurity --no-cache
npx pastoralist --checkSecurity --refresh-cache
\`\`\`

## Node.js API

### Installation

\`\`\`bash
npm install pastoralist
\`\`\`

### \`update(options)\`

Update \`package.json\` overrides and the appendix. Each appendix entry includes a
\`ledger\` with at least \`addedDate\`; security metadata is added when security
checks run. This is a low-level API: pass the parsed \`package.json\` as \`config\`.
The CLI handles config loading for normal command-line use. \`update()\` is
synchronous and returns an \`UpdateContext\`, so the examples below intentionally
do not use \`await\`.

**params:**

- \`options\`: configuration object
  - \`path\`: path to package.json (default: './package.json')
  - \`config\`: parsed package.json content
  - \`depPaths\`: array of glob patterns for multiple files
  - \`ignore\`: array of glob patterns to ignore
  - \`root\`: root directory path
  - \`debug\`: enable debug logging
  - \`dryRun\`: preview changes without writing package.json
  - \`summary\`: include summary metrics
  - \`removeUnused\`: remove overrides with no active dependents
  - \`checkSecurity\`: enable security checks
  - \`securityProvider\`: security provider to use
  - \`forceSecurityRefactor\`: apply security fixes without prompting
  - \`strict\`: fail on security provider errors

\`\`\`javascript
import { resolveJSON, update } from "pastoralist";

// Basic usage
const path = "./package.json";
const config = resolveJSON(path);

if (config) {
  update({ config, path });
}

// With specific path
const workspacePath = "./packages/app/package.json";
const workspaceConfig = resolveJSON(workspacePath);

if (workspaceConfig) {
  update({ config: workspaceConfig, path: workspacePath });
}

// With debug mode
if (config) {
  update({ config, path, debug: true });
}

// Multiple packages
if (config) {
  update({
    config,
    path,
    depPaths: ["packages/*/package.json"],
    ignore: ["**/test/**"],
  });
}
\`\`\`

### \`optimizeBestCasePortfolio(options)\`

Evaluate complete package-version states and return the lowest-risk state under
a lexicographic policy. The evaluator must return alerts for the complete state,
not for one package in isolation.

**params:**

- \`choices\`: package names, current versions, and candidate versions
- \`evaluate\`: async \`BestCaseEvaluator\` callback for one complete state
- \`config\`: optional \`BestCaseConfig\` policy and search limits

\`\`\`typescript
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
  config: {
    enabled: true,
    search: { mode: "auto", exactStateLimit: 256 },
  },
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

\`\`\`typescript
import type { LedgerReason } from "pastoralist";

const reason: LedgerReason = {
  type: "project",
  summary: "Pin this dependency while the upstream fix is reviewed.",
  pin: "3.2.1",
  patch: "patches/example+3.2.1.patch",
  constraints: ["Must retain the current runtime API"],
  references: ["https://example.com/upstream/issue/123"],
};
\`\`\`

A \`BestCaseReason\` contains \`decisionId\`, \`policyHash\`, \`search\`, and \`impact\`.
CVEs stay in \`ledger.cves\`; they are not duplicated in the reason.

### \`logger(config)\`

Create a logger instance for custom debugging.

**params:**

- \`config\`: logger configuration
  - \`file\`: source file name
  - \`isLogging\`: enable/disable logging

\`\`\`javascript
import { logger } from "pastoralist";

// Create logger
const log = logger({
  file: "my-script.js",
  isLogging: true,
});

// Use logger
log.debug("starting action", "method-name", { data: "value" });
log.error("unexpected error", "method-name", { error: err });
\`\`\`

## Examples

### Build Tool Integration

\`\`\`javascript
import { resolveJSON, update } from "pastoralist";

const path = "./package.json";
const config = resolveJSON(path);

// Ensure overrides are up-to-date before building
if (config) {
  update({ config, path });
  console.log("Package overrides verified");
}
\`\`\`

### Workspace Automation

\`\`\`javascript
import { resolveJSON, update } from "pastoralist";
import glob from "glob";

// Update all workspace packages
const packages = glob.sync("packages/*/package.json");

for (const pkgPath of packages) {
  const pkg = resolveJSON(pkgPath);
  if (pkg) {
    update({ config: pkg, path: pkgPath });
    console.log(\`Updated \${pkgPath}\`);
  }
}
\`\`\`

### CI/CD Validation

\`\`\`javascript
import { resolveJSON, update } from "pastoralist";
import { execSync } from "child_process";

const path = "./package.json";
const config = resolveJSON(path);

// Check if overrides are up-to-date
const before = execSync("git status --porcelain").toString();
if (config) {
  update({ config, path });
}
const after = execSync("git status --porcelain").toString();

if (before !== after) {
  console.error("Package.json overrides need updating");
  process.exit(1);
}
\`\`\`

### Custom Logger

\`\`\`javascript
import { logger, resolveJSON, update } from "pastoralist";

// Create custom logger
const log = logger({
  file: "my-script.js",
  isLogging: process.env.DEBUG === "true",
});

const path = "./package.json";
const config = resolveJSON(path);

// Log custom events
log.debug("starting", "custom-action", { time: Date.now() });

if (config) {
  update({ config, path, debug: true });
}

log.debug("completed", "custom-action", { time: Date.now() });
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

\`\`\`bash
DEBUG=true npx pastoralist
\`\`\`

## TypeScript

Pastoralist includes full TypeScript support.

\`\`\`typescript
import { resolveJSON, update, type Options } from "pastoralist";

const path = "./package.json";
const config = resolveJSON(path);

if (!config) {
  throw new Error("Package.json not found");
}

const options: Options = {
  config,
  path,
  debug: true,
};

update(options);
\`\`\`
`,nn=`---
title: Architecture
description: "Deep dive into how Pastoralist works, including overrides, resolutions, patches, and the object anatomy"
---

## How Pastoralist Works

\`\`\`mermaid
flowchart LR
    You[You add override] --> Install[npm install]
    Install --> Pastor[Pastoralist runs]
    Pastor --> Track[Tracks it]
    Pastor --> Scan[Scans it]
    Pastor --> Clean[Cleans if unused]
    Track --> Chill[You go back to coding]
    Scan --> Chill
    Clean --> Chill

    style You fill:#e3f2fd
    style Pastor fill:#f3e5f5
    style Chill fill:#e8f5e9
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

- Reads the root package.json or project manifest file
- Maps overrides, resolutions, and patches to the \`pastoralist.appendix\`, with a
  \`ledger\` entry recording when each override was added
- Reads workspace package manifests when \`depPaths\` or \`workspaces\` are configured
- Writes the consolidated appendix to the target package.json, usually the root

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

Overrides allow you to replace a package version in your dependency tree with a different version. This is npm's way of handling dependency conflicts:

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

Resolutions serve the same purpose for Yarn users, allowing you to force specific versions:

\`\`\`json
{
  "resolutions": {
    "foo": "1.0.0",
    "**/bar/baz": "1.0.0"
  }
}
\`\`\`

### Patches

Patches are custom modifications to node_modules packages, typically created with tools like \`patch-package\`. Pastoralist automatically detects and tracks these patches.

## Object Anatomy

The Pastoralist object in your package.json provides full transparency into what's being managed:

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

Complete flow of how dependencies are resolved with overrides:

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
`,rn=`---
title: Interactive Tutorial
description: Learn pastoralist step-by-step
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

# Install and run pastoralist
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
  href="https://stackblitz.com/fork/github/yowainwright/pastoralist/tree/main/tests/sandboxes/basic-overrides?title=Pastoralist%20Basic%20Overrides&file=README.md&startScript=demo&view=editor"
  target="_blank"
  rel="noopener noreferrer"
>
  <img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz" />
</a>

[Open Interactive Demos](/docs/introduction) to see pastoralist in action!

## Resources

- [GitHub](https://github.com/yowainwright/pastoralist)
- [npm](https://www.npmjs.com/package/pastoralist)
- [Issues & Questions](https://github.com/yowainwright/pastoralist/issues)
`,an=`---
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

When both external config files and \`package.json\` configuration exist, they are merged with \`package.json\` taking precedence:

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

This automatically scans all workspace packages defined in your \`workspaces\` field.
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

This allows you to see at a glance which packages were overridden due to security issues and when they were last verified.

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
`,on=`---
title: GitHub Action
description: Automated dependency override management for CI/CD
---

## Quick Start

### Basic PR Check

\`\`\`yaml
name: Override Check
on: [pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: yowainwright/pastoralist@v1
        with:
          mode: check
          check-security: false
\`\`\`

The action enables OSV security scanning by default. Set
\`check-security: false\` when you only want to validate override tracking.

### Scheduled Maintenance with PR Creation

\`\`\`yaml
name: Override Maintenance
on:
  schedule:
    - cron: "0 0 * * 1" # Weekly on Monday

permissions:
  contents: write
  pull-requests: write

jobs:
  maintain:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: yowainwright/pastoralist@v1
        with:
          mode: pr
          pr-title: "chore(deps): update dependency overrides"
          pr-labels: "dependencies automated"
\`\`\`

## Modes

| Mode     | Description                                            |
| -------- | ------------------------------------------------------ |
| \`check\`  | Validate only - reports issues without modifying files |
| \`update\` | Modify package.json (default) - you handle commits     |
| \`pr\`     | Create pull request with changes automatically         |

### Check Mode

Runs pastoralist in dry-run mode. Reports issues without modifying files.

\`\`\`yaml
- uses: yowainwright/pastoralist@v1
  with:
    mode: check
\`\`\`

### Update Mode (Default)

Runs pastoralist and modifies \`package.json\`. Use when you want to handle commits yourself.

\`\`\`yaml
- uses: actions/checkout@v7

- uses: yowainwright/pastoralist@v1
  with:
    mode: update

- name: Commit changes
  run: |
    git config user.name github-actions[bot]
    git config user.email github-actions[bot]@users.noreply.github.com
    git add package.json
    git diff --staged --quiet || git commit -m "chore: update overrides"
    git push
\`\`\`

### PR Mode

Runs pastoralist and creates a PR if changes are needed. Ideal for scheduled workflows.
Use this mode with \`contents: write\` and \`pull-requests: write\` workflow
permissions.

\`\`\`yaml
- uses: yowainwright/pastoralist@v1
  with:
    mode: pr
    pr-title: "fix(security): update vulnerable overrides"
\`\`\`

## Inputs

| Input               | Description                                                    | Default                                    |
| ------------------- | -------------------------------------------------------------- | ------------------------------------------ |
| \`mode\`              | Operation mode: \`check\`, \`update\`, or \`pr\`                     | \`update\`                                   |
| \`check-security\`    | Enable security scanning                                       | \`true\`                                     |
| \`security-provider\` | Provider: \`osv\`, \`github\`, \`npm\`, \`snyk\`, \`socket\`, \`spektion\` | \`osv\`                                      |
| \`security-token\`    | Token for security provider                                    | -                                          |
| \`auto-fix\`          | Apply security fixes automatically when the action can write   | \`true\`                                     |
| \`dry-run\`           | Preview changes only                                           | \`false\`                                    |
| \`root-dir\`          | Project root directory                                         | -                                          |
| \`dep-paths\`         | Workspace patterns (space-separated)                           | -                                          |
| \`config\`            | Deprecated; config files are auto-detected from \`root-dir\`     | -                                          |
| \`fail-on-security\`  | Fail if vulnerabilities found                                  | \`true\`                                     |
| \`fail-on-unused\`    | Fail if unused overrides found                                 | \`false\`                                    |
| \`silent\`            | Deprecated compatibility input; ignored with a warning         | \`false\`                                    |
| \`debug\`             | Enable debug logging                                           | \`false\`                                    |
| \`pr-title\`          | PR title (mode: pr)                                            | \`chore(deps): update dependency overrides\` |
| \`pr-body\`           | PR body (mode: pr)                                             | Auto-generated                             |
| \`pr-branch\`         | PR branch name (mode: pr)                                      | \`pastoralist/updates\`                      |
| \`pr-labels\`         | PR labels (space-separated)                                    | \`dependencies\`                             |
| \`github-token\`      | GitHub token for PR creation                                   | \`GITHUB_TOKEN\`                             |

## Outputs

| Output                 | Description                              |
| ---------------------- | ---------------------------------------- |
| \`has-security-issues\`  | \`true\` if vulnerabilities were found     |
| \`has-unused-overrides\` | \`true\` if unused overrides detected      |
| \`updated\`              | \`true\` if package.json was modified      |
| \`security-count\`       | Number of security vulnerabilities found |
| \`unused-count\`         | Number of unused overrides detected      |
| \`override-count\`       | Number of tracked overrides              |
| \`pr-url\`               | URL of created PR (mode: pr only)        |

## Examples

### PR Check with Security Gate

\`\`\`yaml
name: Override Security
on: [pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - uses: yowainwright/pastoralist@v1
        with:
          mode: check
          fail-on-security: true
          security-provider: osv
\`\`\`

### Monorepo Support

\`\`\`yaml
- uses: yowainwright/pastoralist@v1
  with:
    dep-paths: "packages/*/package.json apps/*/package.json"
\`\`\`

### Using GitHub Security Provider

\`\`\`yaml
- uses: yowainwright/pastoralist@v1
  with:
    security-provider: github
    security-token: \${{ secrets.GITHUB_TOKEN }}
\`\`\`

### Conditional PR on Vulnerabilities

\`\`\`yaml
- uses: yowainwright/pastoralist@v1
  id: pastoralist
  with:
    mode: check

- name: Create security PR
  if: steps.pastoralist.outputs.has-security-issues == 'true'
  run: |
    # Custom PR logic here
\`\`\`

### Weekly Maintenance with Slack Notification

\`\`\`yaml
name: Weekly Override Maintenance
on:
  schedule:
    - cron: "0 9 * * 1"

permissions:
  contents: write
  pull-requests: write

jobs:
  maintain:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - uses: yowainwright/pastoralist@v1
        id: pastoralist
        with:
          mode: pr

      - name: Notify Slack
        if: steps.pastoralist.outputs.pr-url != ''
        uses: slackapi/slack-github-action@v3.0.3
        with:
          payload: |
            {
              "text": "Pastoralist created a PR: \${{ steps.pastoralist.outputs.pr-url }}"
            }
\`\`\`

## Permissions

For \`mode: pr\`, the action needs write permissions:

\`\`\`yaml
permissions:
  contents: write
  pull-requests: write
\`\`\`

## Security Providers

| Provider   | Auth     | Notes                                                                                     |
| ---------- | -------- | ----------------------------------------------------------------------------------------- |
| \`osv\`      | None     | Open Source Vulnerabilities database (default)                                            |
| \`npm\`      | None     | Uses the detected package manager's audit command                                         |
| \`github\`   | Required | Reads Dependabot alerts; pass \`GITHUB_TOKEN\` or rely on an authenticated \`gh\` CLI session |
| \`snyk\`     | Required | Requires \`SNYK_TOKEN\` [EXPERIMENTAL]                                                      |
| \`socket\`   | Required | Requires \`SOCKET_SECURITY_API_KEY\` [EXPERIMENTAL]                                         |
| \`spektion\` | Required | Requires \`SPEKTION_API_KEY\` [EXPERIMENTAL]                                                |
`,sn=`---
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

Pastoralist is the audit trail for package manager overrides.

If your project uses \`overrides\`, \`pnpm.overrides\`, or \`resolutions\`,
Pastoralist records why each entry exists, which packages still need it, and
when it can be removed. It can also connect security fixes, patch files,
workspace packages, and CI checks to the same record.

## Why This Matters

Overrides usually start with a good reason:

\`\`\`json
{
  "overrides": {
    "lodash": "4.17.21"
  }
}
\`\`\`

Months later, the context is gone. Was it a security fix? A transitive bug? Who
still needs it? Is it safe to remove? The override should stay as the package
manager instruction; the appendix carries the review detail:

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

The override controls the installed version. The appendix explains why that
control exists, who still depends on it, what scanner or reviewer justified it,
and what condition makes it removable.

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
| Runtime            | Node 20+                                                     |
| Security default   | OSV, no token required                                       |
| Optional providers | GitHub, npm audit, Snyk, Socket, Spektion                    |
| Monorepos          | Auto-detects \`workspaces\`; accepts explicit package globs    |
| CI                 | CLI flags plus a GitHub Action                               |
| Test surface       | 1,700+ test cases across unit, integration, and e2e fixtures |

## When To Use It

Use Pastoralist when your project has overrides that need a durable reason, a
regular cleanup path, or a security audit trail.

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
  href="https://stackblitz.com/fork/github/yowainwright/pastoralist/tree/main/tests/sandboxes/basic-overrides?title=Pastoralist%20Basic%20Overrides&file=README.md&startScript=demo&view=editor"
  target="_blank"
  rel="noopener noreferrer"
>
  <img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz" />
</a>
`,cn=`---
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
npx -p pastoralist pastoralist-setup-local-dev --dry-run
\`\`\`

Set up agent config, bundled skills, and local hooks:

\`\`\`bash
npx -p pastoralist pastoralist-setup-local-dev --skills all --hooks git,postinstall
\`\`\`

The local dev setup script auto-detects Codex or Claude when possible. You can
pin the target explicitly:

\`\`\`bash
npx -p pastoralist pastoralist-setup-local-dev --agent codex
npx -p pastoralist pastoralist-setup-local-dev --agent claude
\`\`\`

## Copy/Paste Prompts

Use this prompt when you want an agent to do the setup:

\`\`\`text
Set up Pastoralist in this repository.
Start with \`npx pastoralist doctor\` and inspect the current package manager setup.
Run \`npx -p pastoralist pastoralist-setup-local-dev --dry-run\` before writing files.
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
2. Run \`npx -p pastoralist pastoralist-setup-local-dev --dry-run\`.
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
`,ln=`---
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
  href="https://stackblitz.com/fork/github/yowainwright/pastoralist/tree/main/tests/sandboxes/security-scan?title=Pastoralist%20Security%20Scan&file=README.md&startScript=demo&view=editor"
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

**Option 1: GitHub CLI (Recommended)**

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
   export GITHUB_TOKEN=your_token_here
   \`\`\`
3. Or pass it via CLI in one-off/local use:
   \`\`\`bash
   pastoralist --checkSecurity --securityProvider github --securityProviderToken your_token_here
   \`\`\`

#### CI/CD Permissions

When using the GitHub provider in CI workflows, you need to:

1. **Add workflow permissions:**

\`\`\`yaml
permissions:
  contents: read
  vulnerability-alerts: read
\`\`\`

2. **Enable Dependabot alerts** in your repository: Settings → Code security and analysis → Dependabot alerts

If permissions are insufficient, Pastoralist will display a warning with guidance and continue (your workflow won't fail).

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
export SNYK_TOKEN=your_token_here

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

By default, \`--remove-unused\` will remove overrides whose dependents no longer require them. For security overrides you want to retain regardless, set \`keep\` on the ledger:

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

Once the root dependency reaches \`4.18.0\`, the keep is considered expired and \`--remove-unused\` will treat it as removable again.

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

- Security scanning is **disabled by default** to maintain fast performance
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

- Ensure you're using the latest version of pastoralist
- Check that your dependencies are correctly specified in package.json
- Try running with \`--debug\` to see detailed logs

### Fixes not being applied

- Verify you have write permissions to package.json
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

## Example: CI/CD Integration

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
`,un=`---
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

## Initialize

Run a read-only setup and override health check first:

\`\`\`bash
npx pastoralist doctor
\`\`\`

\`doctor\` runs in dry-run summary mode, so it shows current override health
without modifying \`package.json\`.

Print the full first-run checklist when you want local setup, agent setup, and
CI setup in one place:

\`\`\`bash
npx pastoralist onboard
\`\`\`

Install the Pastoralist agent skill in a repo:

\`\`\`bash
npx pastoralist --init agent-skill
\`\`\`

Set up local dev with selected skills and hooks:

\`\`\`bash
npx -p pastoralist pastoralist-setup-local-dev --skills all --hooks git,postinstall
\`\`\`

Run the guided setup:

\`\`\`bash
npx pastoralist init
\`\`\`

The initializer can detect workspace packages, ask whether security checks
should run, and save the configuration in \`package.json\` or a config file.

For a simple project, you can also run Pastoralist directly:

\`\`\`bash
npx pastoralist
\`\`\`

It will scan your package manager overrides or resolutions, update the
\`pastoralist.appendix\`, and leave unrelated package fields alone.

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

Next, read [Configuration](/docs/configuration) for all options or
[Workspaces & Monorepos](/docs/workspaces) for monorepo setup.
`,dn=`---
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

- Only modifies override/resolution fields and the \`pastoralist\` section of package.json
- Normalizes package.json output to two-space JSON
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

### Package.json Formatting Changes

**Problem:** Pastoralist changes the formatting of my package.json.

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
pastoralist --depPaths "**/*package.json"

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

**Problem:** CI fails saying package.json was modified.

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

Pastoralist can't locate your package.json. Solutions:

- Run from project root
- Use \`--path\` to specify location
- Check file permissions

### "Invalid package.json"

Your package.json has syntax errors. Validate with:

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

- [GitHub Issues](https://github.com/yowainwright/pastoralist/issues) - Report bugs & ask questions

### Before Filing an Issue

1. Update to the latest version
2. Run with \`--debug\` flag
3. Check existing issues
4. Provide minimal reproduction

### Issue Template

When reporting issues, include:

- Pastoralist version
- Node.js version
- Package manager (npm/yarn/pnpm)
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
`,fn=`---
title: Workspaces & Monorepos
description: Using pastoralist in workspace and monorepo environments
---

Pastoralist works with workspace and monorepo setups. This guide covers how to
track root-level overrides while still showing which workspace packages depend
on them.

<a
  href="https://stackblitz.com/fork/github/yowainwright/pastoralist/tree/main/tests/sandboxes/monorepo?title=Pastoralist%20Monorepo&file=README.md&startScript=demo&view=editor"
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

Pastoralist provides multiple ways to configure workspace scanning in monorepos:

### Method 1: depPaths in package.json (Recommended)

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

**Using \`"workspace"\` string** - Pastoralist automatically uses all packages defined in your \`workspaces\` field. The appendix only appears in the root; workspace packages stay clean.

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

This will manage overrides in your root \`package.json\`, which affect all workspaces.

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

### Strategy 1: Centralized Management with depPaths (Recommended)

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

### CI/CD Integration

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

**Solution:** Ensure you're using a package manager that supports workspace overrides:

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
4. Update CI/CD scripts
`,pn=[{slug:`introduction`,title:`Introduction to Pastoralist`,description:`Pastoralist keeps dependency overrides explainable, current, and removable`},{slug:`setup`,title:`Setup`,description:`Install Pastoralist and keep your override appendix current`},{slug:`onboarding`,title:`Onboarding`,description:`First-run checklist for local use, agent setup, and CI`},{slug:`security`,title:`Security Vulnerability Detection`,description:`Detect vulnerabilities and select lowest-risk dependency portfolios`,usesMath:!0},{slug:`workspaces`,title:`Workspaces & Monorepos`,description:`Using pastoralist in workspace and monorepo environments`},{slug:`advanced-features`,title:`Advanced Features`,description:`Advanced cleanup, patch tracking, and override management workflows`},{slug:`codelab`,title:`Interactive Tutorial`,description:`Learn pastoralist step-by-step`},{slug:`api-reference`,title:`API Reference`,description:`Complete reference for pastoralist CLI and Node.js API`},{slug:`architecture`,title:`Architecture`,description:`Deep dive into how Pastoralist works, including overrides, resolutions, patches, and the object anatomy`},{slug:`troubleshooting`,title:`Troubleshooting & FAQ`,description:`Common issues and frequently asked questions`},{slug:`configuration`,title:`Configuration`,description:`Configure Pastoralist with package.json, rc files, or JavaScript config files`},{slug:`github-action`,title:`GitHub Action`,description:`Automated dependency override management for CI/CD`}],mn=`modulepreload`,hn=function(e){return`/pastoralist/`+e},gn={},U=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?import.meta.resolve(e):new URL(e,import.meta.url).href}r=o(t.map(t=>{if(t=hn(t,n),t=s(t),t in gn)return;gn[t]=!0;let r=t.endsWith(`.css`);for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}let i=document.createElement(`link`);if(i.rel=r?`stylesheet`:mn,r||(i.as=`script`),i.crossOrigin=``,i.href=t,a&&i.setAttribute(`nonce`,a),document.head.appendChild(i),r)return new Promise((e,n)=>{i.addEventListener(`load`,e),i.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},_n=Object.fromEntries(Object.entries(Object.assign({"./docs/advanced-features.mdx":()=>U(()=>import(`./advanced-features-DajmqwpN.js`),__vite__mapDeps([0,1,2])),"./docs/api-reference.mdx":()=>U(()=>import(`./api-reference-DAvHC_tg.js`),__vite__mapDeps([3,1,2])),"./docs/architecture.mdx":()=>U(()=>import(`./architecture-BFHCsutF.js`),__vite__mapDeps([4,1,2])),"./docs/codelab.mdx":()=>U(()=>import(`./codelab-C-TE4Qfb.js`),__vite__mapDeps([5,1,2])),"./docs/configuration.mdx":()=>U(()=>import(`./configuration-BDS7ZBHf.js`),__vite__mapDeps([6,1,2])),"./docs/github-action.mdx":()=>U(()=>import(`./github-action-BmVJGYWP.js`),__vite__mapDeps([7,1,2])),"./docs/introduction.mdx":()=>U(()=>import(`./introduction-BifnmxP1.js`),__vite__mapDeps([8,1,2])),"./docs/onboarding.mdx":()=>U(()=>import(`./onboarding-BwXvkEn0.js`),__vite__mapDeps([9,1,2])),"./docs/security.mdx":()=>U(()=>import(`./security-K0lxRvsQ.js`),__vite__mapDeps([10,1,2])),"./docs/setup.mdx":()=>U(()=>import(`./setup-D9ON5hg0.js`),__vite__mapDeps([11,1,2])),"./docs/troubleshooting.mdx":()=>U(()=>import(`./troubleshooting-DLxq5-nu.js`),__vite__mapDeps([12,1,2])),"./docs/workspaces.mdx":()=>U(()=>import(`./workspaces-su7pl0Oo.js`),__vite__mapDeps([13,1,2]))})).map(([e,t])=>[e,(0,y.lazy)(t)])),vn=Object.assign({"./docs/advanced-features.mdx":en,"./docs/api-reference.mdx":tn,"./docs/architecture.mdx":nn,"./docs/codelab.mdx":rn,"./docs/configuration.mdx":an,"./docs/github-action.mdx":on,"./docs/introduction.mdx":sn,"./docs/onboarding.mdx":cn,"./docs/security.mdx":ln,"./docs/setup.mdx":un,"./docs/troubleshooting.mdx":dn,"./docs/workspaces.mdx":fn});function yn(e){return pn.find(t=>t.slug===e)}function bn(e){return vn[`./docs/${e}.mdx`]}function xn(e){return _n[`./docs/${e}.mdx`]}function Sn(){return pn}var Cn=(e,t)=>e.map(e=>{let n=t(e.slug)??``;return{title:e.title,description:e.description,content:n,slug:e.slug}}),wn=e=>new g(e,{keys:[`title`,`description`,`content`],threshold:.3,ignoreLocation:!0}),Tn=(e,t)=>{let n=t.trim();return n?e.search(n).slice(0,5).map(e=>e.item):[]},En=e(i(),1),Dn=(e,t)=>{let n=(0,y.useMemo)(()=>wn(e),[e]);return(0,y.useMemo)(()=>Tn(n,t),[t,n])},On=(e,t)=>{(0,y.useEffect)(()=>{let n=n=>{(n.metaKey||n.ctrlKey)&&n.key===`k`&&(n.preventDefault(),e()),n.key===`Escape`&&t()};return document.addEventListener(`keydown`,n),()=>document.removeEventListener(`keydown`,n)},[t,e])};function kn({iconOnly:e,onOpen:t}){return e?(0,D.jsxs)(`button`,{onClick:t,className:`btn btn-sm btn-ghost gap-1`,"aria-label":`Search (⌘K)`,children:[(0,D.jsx)(qt,{className:`h-4 w-4`}),(0,D.jsx)(`kbd`,{className:`hidden rounded bg-base-200 px-1.5 py-0.5 text-xs font-medium text-base-content/60 lg:inline-flex`,children:`⌘K`})]}):(0,D.jsxs)(`button`,{onClick:t,className:`flex min-w-[200px] items-center gap-2 rounded-lg bg-base-200/50 px-3 py-1.5 text-sm text-base-content/60 transition-colors hover:bg-base-200 md:min-w-[300px]`,children:[(0,D.jsx)(qt,{className:`h-4 w-4`}),(0,D.jsx)(`span`,{children:`Search documentation...`})]})}function An({onSelect:e}){return(0,D.jsxs)(`nav`,{className:`space-y-1 p-4`,"aria-label":`Recent documentation`,children:[(0,D.jsx)(`p`,{className:`px-2 text-xs font-medium uppercase text-base-content/40`,children:`Recent`}),(0,D.jsx)(s,{to:`/docs/$slug/`,params:{slug:`introduction`},onClick:e,className:`block rounded-lg px-3 py-2 text-sm hover:bg-base-200/50`,children:`Introduction to Pastoralist`}),(0,D.jsx)(s,{to:`/docs/$slug/`,params:{slug:`setup`},onClick:e,className:`block rounded-lg px-3 py-2 text-sm hover:bg-base-200/50`,children:`Setup Guide`})]})}function jn({query:e,results:t,onSelect:n}){return e?t.length===0?(0,D.jsx)(`p`,{className:`p-8 text-center text-base-content/60`,children:`No results found`}):(0,D.jsx)(`ul`,{className:`space-y-1 p-2`,children:t.map(e=>(0,D.jsx)(`li`,{children:(0,D.jsxs)(s,{to:`/docs/$slug/`,params:{slug:e.slug},onClick:n,className:`block rounded-lg px-4 py-3 transition-colors hover:bg-base-200/50`,children:[(0,D.jsx)(`strong`,{className:`block`,children:e.title}),(0,D.jsx)(`span`,{className:`mt-0.5 block text-sm text-base-content/60`,children:e.description})]})},e.slug))}):(0,D.jsx)(An,{onSelect:n})}function Mn({query:e,results:t,inputRef:n,onQueryChange:r,onClose:i}){return(0,En.createPortal)((0,D.jsx)(`div`,{className:`fixed inset-0 z-[101] bg-black/60 p-4 pt-[10vh] backdrop-blur-sm`,onClick:i,children:(0,D.jsxs)(`section`,{className:`mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-2xl`,onClick:e=>e.stopPropagation(),children:[(0,D.jsxs)(`label`,{className:`flex items-center border-b border-base-content/10 p-4`,children:[(0,D.jsx)(qt,{className:`mr-3 h-5 w-5 text-[#1D4ED8]`}),(0,D.jsx)(`input`,{ref:n,value:e,onChange:e=>r(e.target.value),placeholder:`Search documentation...`,className:`flex-1 bg-transparent text-lg outline-none`})]}),(0,D.jsx)(`div`,{className:`max-h-[60vh] overflow-y-auto`,children:(0,D.jsx)(jn,{query:e,results:t,onSelect:i})})]})}),document.body)}function Nn({searchData:e,iconOnly:t=!1}){let[n,r]=(0,y.useState)(!1),[i,a]=(0,y.useState)(``),o=(0,y.useRef)(null),s=Dn(e,i),c=(0,y.useCallback)(()=>r(!0),[]),l=(0,y.useCallback)(()=>{r(!1),a(``)},[]);return On(c,l),(0,y.useEffect)(()=>{n&&o.current?.focus()},[n]),(0,D.jsxs)(D.Fragment,{children:[(0,D.jsx)(kn,{iconOnly:t,onOpen:c}),n?(0,D.jsx)(Mn,{query:i,results:s,inputRef:o,onQueryChange:a,onClose:l}):null]})}var Pn=[{title:`Docs`,href:`/docs/introduction`,preload:`intent`}],Fn=Cn(Sn(),bn);function In(){let{theme:e,toggle:t}=$t(),n=u().pathname,r=`btn btn-sm btn-ghost swap swap-rotate btn-square ${e===`night`?`swap-active`:``}`,i=e=>e.includes(`/docs`)?n.includes(`/docs`):n===e,a=e=>`rounded-lg hover:text-[#1D4ED8] hover:bg-[#1D4ED8]/10 transition flex ${i(e)?`text-[#1D4ED8] bg-[#1D4ED8]/10`:``}`;return(0,D.jsx)(`header`,{className:`fixed top-0 z-[1000] w-full`,children:(0,D.jsxs)(`nav`,{className:`grid h-[68px] w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 border-b border-base-content/10 bg-base-100/80 px-2 py-2 backdrop-blur-3xl sm:gap-2 sm:px-4`,children:[(0,D.jsxs)(`div`,{className:`flex min-w-0 items-center gap-1 justify-self-start`,children:[(0,D.jsx)(`label`,{htmlFor:`my-drawer-2`,className:`btn btn-sm btn-ghost btn-square lg:hidden`,"aria-label":`toggle sidebar`,children:(0,D.jsx)(Gt,{className:`h-4 w-4`})}),(0,D.jsx)(s,{to:`/`,preload:`intent`,className:`btn btn-ghost min-w-0 px-1.5 sm:px-2`,children:(0,D.jsx)(`h1`,{className:`gradient-text truncate text-lg font-bold sm:text-2xl`,children:`Pastoralist`})})]}),(0,D.jsx)(`div`,{className:`justify-self-center`}),(0,D.jsxs)(`div`,{className:`flex items-center gap-1 justify-self-end`,children:[Pn.map(e=>(0,D.jsx)(s,{to:e.href,preload:`intent`,className:`btn btn-sm btn-ghost hidden sm:flex ${a(e.href)}`,children:e.title},e.href)),(0,D.jsx)(Nn,{searchData:Fn,iconOnly:!0}),(0,D.jsx)(`a`,{className:`btn btn-sm btn-ghost btn-square`,href:`https://github.com/yowainwright/pastoralist`,"aria-label":`github`,children:(0,D.jsx)(Yt,{className:`h-4 w-4`})}),(0,D.jsxs)(`button`,{"aria-label":`theme-toggle`,onClick:t,className:r,children:[(0,D.jsx)(Jt,{className:`w-4 h-4 swap-off`}),(0,D.jsx)(Kt,{className:`w-4 h-4 swap-on`})]})]})]})})}function Ln(e){let t=`/pastoralist`;return e===``?t.endsWith(`/`)?t.slice(0,-1):t:(t.endsWith(`/`)?t:`/pastoralist/`)+(e.startsWith(`/`)?e.slice(1):e)}function W(e){return Ln(`docs/${e}`)}var G=[{title:`Getting Started`,items:[{title:`Introduction`,href:W(`introduction`)},{title:`Setup`,href:W(`setup`)},{title:`Onboarding`,href:W(`onboarding`)}]},{title:`Features`,items:[{title:`Security Scanning`,href:W(`security`)},{title:`Workspaces & Monorepos`,href:W(`workspaces`)},{title:`Advanced Features`,href:W(`advanced-features`)}]},{title:`Codelabs`,items:[{title:`Basic Usage`,href:W(`codelab`)}]},{title:`Reference`,items:[{title:`API Reference`,href:W(`api-reference`)},{title:`GitHub Action`,href:W(`github-action`)},{title:`Architecture`,href:W(`architecture`)},{title:`Troubleshooting & FAQ`,href:W(`troubleshooting`)}]}],Rn=(e,t)=>e.map((e,n)=>n===t?!e:e);function zn({onClose:e=()=>void 0}){let t=u().pathname,[n,r]=(0,y.useState)(()=>G.map(()=>!0)),i=e=>{r(t=>Rn(t,e))},a=G.map((e,r)=>(0,D.jsx)(Bn,{section:e,isOpen:n[r],onToggle:()=>i(r),pathname:t},e.title));return(0,D.jsxs)(`aside`,{className:`drawer-side`,children:[(0,D.jsx)(`label`,{htmlFor:`my-drawer-2`,className:`drawer-overlay lg:hidden bg-transparent`,onClick:e}),(0,D.jsx)(`nav`,{className:`w-64 bg-base-100 z-20 sticky top-[68px] h-[calc(100vh-68px)] overflow-y-auto border-r border-base-content/10`,children:(0,D.jsx)(`section`,{className:`px-3 pt-2 space-y-3`,children:a})})]})}function Bn({section:e,isOpen:t,onToggle:n,pathname:r}){let i=`sidebar-content ${t?``:`hidden`}`,a=`w-4 h-4 transition-transform duration-200 ${t?`rotate-90`:``}`;return(0,D.jsxs)(`article`,{className:`sidebar-section`,children:[(0,D.jsxs)(`button`,{className:`sidebar-toggle w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-base-content/70 uppercase tracking-normal font-spline-sans-mono hover:text-base-content transition-colors`,"aria-expanded":t,onClick:n,children:[(0,D.jsx)(`span`,{children:e.title}),(0,D.jsx)(Ht,{className:a})]}),(0,D.jsx)(`nav`,{className:i,children:(0,D.jsx)(`ul`,{className:`ml-2 mt-1 border-l-2 border-base-content/10 space-y-0.5 py-1`,children:e.items.map(e=>(0,D.jsx)(Vn,{item:e,pathname:r},e.href))})})]})}function Vn({item:e,pathname:t}){let n=Hn(e.href),r=t.endsWith(`/docs/${n}`);return(0,D.jsx)(`li`,{children:(0,D.jsx)(s,{to:`/docs/$slug/`,params:{slug:n},preload:`intent`,className:`block ml-0 pl-4 pr-3 py-2 text-sm transition-colors relative ${r?`text-[#1D4ED8] bg-[#1D4ED8]/10 font-medium before:absolute before:left-[-2px] before:top-0 before:bottom-0 before:w-0.5 before:bg-[#1D4ED8]`:`text-base-content/80 hover:text-[#1D4ED8] hover:bg-base-content/5`}`,children:(0,D.jsx)(`span`,{className:`flex items-center justify-between`,children:e.title})})})}function Hn(e){let t=e.match(/docs\/([^/]+)$/);return t?t[1]:`introduction`}function Un({children:e}){let[t,n]=(0,y.useState)(!1);return(0,D.jsxs)(`section`,{className:`flex flex-col min-h-screen relative`,children:[(0,D.jsx)(Wn,{}),(0,D.jsx)(In,{}),(0,D.jsxs)(`main`,{className:`drawer lg:drawer-open flex-1 relative`,children:[(0,D.jsx)(`input`,{id:`my-drawer-2`,type:`checkbox`,className:`drawer-toggle`,checked:t,onChange:e=>{n(e.target.checked)}}),(0,D.jsx)(`section`,{className:`drawer-content flex flex-col pt-[68px]`,children:(0,D.jsx)(`article`,{className:`flex-1`,children:e})}),(0,D.jsx)(zn,{onClose:()=>n(!1)})]}),(0,D.jsx)(Qt,{})]})}function Wn(){return(0,D.jsxs)(`figure`,{className:`absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl pointer-events-none`,"aria-hidden":`true`,children:[(0,D.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] block`,style:{clipPath:`polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 150%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)`}}),(0,D.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(100%)] sm:w-[72.1875rem] block`,style:{clipPath:`polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 150%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)`}})]})}function Gn({children:e}){return(0,D.jsxs)(`section`,{className:`flex flex-col min-h-screen relative`,children:[(0,D.jsx)(In,{}),(0,D.jsxs)(`main`,{className:`drawer flex-1 relative`,children:[(0,D.jsx)(`input`,{id:`my-drawer-2`,type:`checkbox`,className:`drawer-toggle`}),(0,D.jsx)(`section`,{className:`drawer-content flex flex-col pt-[68px]`,children:(0,D.jsx)(`article`,{className:`flex-1`,children:e})}),(0,D.jsx)(zn,{})]}),(0,D.jsx)(Qt,{})]})}var Kn=/[\0-\x1F!-,\.\/:-@\[-\^`\{-\xA9\xAB-\xB4\xB6-\xB9\xBB-\xBF\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0378\u0379\u037E\u0380-\u0385\u0387\u038B\u038D\u03A2\u03F6\u0482\u0530\u0557\u0558\u055A-\u055F\u0589-\u0590\u05BE\u05C0\u05C3\u05C6\u05C8-\u05CF\u05EB-\u05EE\u05F3-\u060F\u061B-\u061F\u066A-\u066D\u06D4\u06DD\u06DE\u06E9\u06FD\u06FE\u0700-\u070F\u074B\u074C\u07B2-\u07BF\u07F6-\u07F9\u07FB\u07FC\u07FE\u07FF\u082E-\u083F\u085C-\u085F\u086B-\u089F\u08B5\u08C8-\u08D2\u08E2\u0964\u0965\u0970\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09F2-\u09FB\u09FD\u09FF\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF0-\u0AF8\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B54\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B70\u0B72-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BF0-\u0BFF\u0C0D\u0C11\u0C29\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5B-\u0C5F\u0C64\u0C65\u0C70-\u0C7F\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0CFF\u0D0D\u0D11\u0D45\u0D49\u0D4F-\u0D53\u0D58-\u0D5E\u0D64\u0D65\u0D70-\u0D79\u0D80\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DE5\u0DF0\u0DF1\u0DF4-\u0E00\u0E3B-\u0E3F\u0E4F\u0E5A-\u0E80\u0E83\u0E85\u0E8B\u0EA4\u0EA6\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F01-\u0F17\u0F1A-\u0F1F\u0F2A-\u0F34\u0F36\u0F38\u0F3A-\u0F3D\u0F48\u0F6D-\u0F70\u0F85\u0F98\u0FBD-\u0FC5\u0FC7-\u0FFF\u104A-\u104F\u109E\u109F\u10C6\u10C8-\u10CC\u10CE\u10CF\u10FB\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u1360-\u137F\u1390-\u139F\u13F6\u13F7\u13FE-\u1400\u166D\u166E\u1680\u169B-\u169F\u16EB-\u16ED\u16F9-\u16FF\u170D\u1715-\u171F\u1735-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17D4-\u17D6\u17D8-\u17DB\u17DE\u17DF\u17EA-\u180A\u180E\u180F\u181A-\u181F\u1879-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191F\u192C-\u192F\u193C-\u1945\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DA-\u19FF\u1A1C-\u1A1F\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1AA6\u1AA8-\u1AAF\u1AC1-\u1AFF\u1B4C-\u1B4F\u1B5A-\u1B6A\u1B74-\u1B7F\u1BF4-\u1BFF\u1C38-\u1C3F\u1C4A-\u1C4C\u1C7E\u1C7F\u1C89-\u1C8F\u1CBB\u1CBC\u1CC0-\u1CCF\u1CD3\u1CFB-\u1CFF\u1DFA\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FBD\u1FBF-\u1FC1\u1FC5\u1FCD-\u1FCF\u1FD4\u1FD5\u1FDC-\u1FDF\u1FED-\u1FF1\u1FF5\u1FFD-\u203E\u2041-\u2053\u2055-\u2070\u2072-\u207E\u2080-\u208F\u209D-\u20CF\u20F1-\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F-\u215F\u2189-\u24B5\u24EA-\u2BFF\u2C2F\u2C5F\u2CE5-\u2CEA\u2CF4-\u2CFF\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D70-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E00-\u2E2E\u2E30-\u3004\u3008-\u3020\u3030\u3036\u3037\u303D-\u3040\u3097\u3098\u309B\u309C\u30A0\u30FB\u3100-\u3104\u3130\u318F-\u319F\u31C0-\u31EF\u3200-\u33FF\u4DC0-\u4DFF\u9FFD-\u9FFF\uA48D-\uA4CF\uA4FE\uA4FF\uA60D-\uA60F\uA62C-\uA63F\uA673\uA67E\uA6F2-\uA716\uA720\uA721\uA789\uA78A\uA7C0\uA7C1\uA7CB-\uA7F4\uA828-\uA82B\uA82D-\uA83F\uA874-\uA87F\uA8C6-\uA8CF\uA8DA-\uA8DF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA954-\uA95F\uA97D-\uA97F\uA9C1-\uA9CE\uA9DA-\uA9DF\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A-\uAA5F\uAA77-\uAA79\uAAC3-\uAADA\uAADE\uAADF\uAAF0\uAAF1\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F\uAB5B\uAB6A-\uAB6F\uABEB\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uD7FF\uE000-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB29\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBB2-\uFBD2\uFD3E-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFC-\uFDFF\uFE10-\uFE1F\uFE30-\uFE32\uFE35-\uFE4C\uFE50-\uFE6F\uFE75\uFEFD-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF3E\uFF40\uFF5B-\uFF65\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFFF]|\uD800[\uDC0C\uDC27\uDC3B\uDC3E\uDC4E\uDC4F\uDC5E-\uDC7F\uDCFB-\uDD3F\uDD75-\uDDFC\uDDFE-\uDE7F\uDE9D-\uDE9F\uDED1-\uDEDF\uDEE1-\uDEFF\uDF20-\uDF2C\uDF4B-\uDF4F\uDF7B-\uDF7F\uDF9E\uDF9F\uDFC4-\uDFC7\uDFD0\uDFD6-\uDFFF]|\uD801[\uDC9E\uDC9F\uDCAA-\uDCAF\uDCD4-\uDCD7\uDCFC-\uDCFF\uDD28-\uDD2F\uDD64-\uDDFF\uDF37-\uDF3F\uDF56-\uDF5F\uDF68-\uDFFF]|\uD802[\uDC06\uDC07\uDC09\uDC36\uDC39-\uDC3B\uDC3D\uDC3E\uDC56-\uDC5F\uDC77-\uDC7F\uDC9F-\uDCDF\uDCF3\uDCF6-\uDCFF\uDD16-\uDD1F\uDD3A-\uDD7F\uDDB8-\uDDBD\uDDC0-\uDDFF\uDE04\uDE07-\uDE0B\uDE14\uDE18\uDE36\uDE37\uDE3B-\uDE3E\uDE40-\uDE5F\uDE7D-\uDE7F\uDE9D-\uDEBF\uDEC8\uDEE7-\uDEFF\uDF36-\uDF3F\uDF56-\uDF5F\uDF73-\uDF7F\uDF92-\uDFFF]|\uD803[\uDC49-\uDC7F\uDCB3-\uDCBF\uDCF3-\uDCFF\uDD28-\uDD2F\uDD3A-\uDE7F\uDEAA\uDEAD-\uDEAF\uDEB2-\uDEFF\uDF1D-\uDF26\uDF28-\uDF2F\uDF51-\uDFAF\uDFC5-\uDFDF\uDFF7-\uDFFF]|\uD804[\uDC47-\uDC65\uDC70-\uDC7E\uDCBB-\uDCCF\uDCE9-\uDCEF\uDCFA-\uDCFF\uDD35\uDD40-\uDD43\uDD48-\uDD4F\uDD74\uDD75\uDD77-\uDD7F\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDFF\uDE12\uDE38-\uDE3D\uDE3F-\uDE7F\uDE87\uDE89\uDE8E\uDE9E\uDEA9-\uDEAF\uDEEB-\uDEEF\uDEFA-\uDEFF\uDF04\uDF0D\uDF0E\uDF11\uDF12\uDF29\uDF31\uDF34\uDF3A\uDF45\uDF46\uDF49\uDF4A\uDF4E\uDF4F\uDF51-\uDF56\uDF58-\uDF5C\uDF64\uDF65\uDF6D-\uDF6F\uDF75-\uDFFF]|\uD805[\uDC4B-\uDC4F\uDC5A-\uDC5D\uDC62-\uDC7F\uDCC6\uDCC8-\uDCCF\uDCDA-\uDD7F\uDDB6\uDDB7\uDDC1-\uDDD7\uDDDE-\uDDFF\uDE41-\uDE43\uDE45-\uDE4F\uDE5A-\uDE7F\uDEB9-\uDEBF\uDECA-\uDEFF\uDF1B\uDF1C\uDF2C-\uDF2F\uDF3A-\uDFFF]|\uD806[\uDC3B-\uDC9F\uDCEA-\uDCFE\uDD07\uDD08\uDD0A\uDD0B\uDD14\uDD17\uDD36\uDD39\uDD3A\uDD44-\uDD4F\uDD5A-\uDD9F\uDDA8\uDDA9\uDDD8\uDDD9\uDDE2\uDDE5-\uDDFF\uDE3F-\uDE46\uDE48-\uDE4F\uDE9A-\uDE9C\uDE9E-\uDEBF\uDEF9-\uDFFF]|\uD807[\uDC09\uDC37\uDC41-\uDC4F\uDC5A-\uDC71\uDC90\uDC91\uDCA8\uDCB7-\uDCFF\uDD07\uDD0A\uDD37-\uDD39\uDD3B\uDD3E\uDD48-\uDD4F\uDD5A-\uDD5F\uDD66\uDD69\uDD8F\uDD92\uDD99-\uDD9F\uDDAA-\uDEDF\uDEF7-\uDFAF\uDFB1-\uDFFF]|\uD808[\uDF9A-\uDFFF]|\uD809[\uDC6F-\uDC7F\uDD44-\uDFFF]|[\uD80A\uD80B\uD80E-\uD810\uD812-\uD819\uD824-\uD82B\uD82D\uD82E\uD830-\uD833\uD837\uD839\uD83D\uD83F\uD87B-\uD87D\uD87F\uD885-\uDB3F\uDB41-\uDBFF][\uDC00-\uDFFF]|\uD80D[\uDC2F-\uDFFF]|\uD811[\uDE47-\uDFFF]|\uD81A[\uDE39-\uDE3F\uDE5F\uDE6A-\uDECF\uDEEE\uDEEF\uDEF5-\uDEFF\uDF37-\uDF3F\uDF44-\uDF4F\uDF5A-\uDF62\uDF78-\uDF7C\uDF90-\uDFFF]|\uD81B[\uDC00-\uDE3F\uDE80-\uDEFF\uDF4B-\uDF4E\uDF88-\uDF8E\uDFA0-\uDFDF\uDFE2\uDFE5-\uDFEF\uDFF2-\uDFFF]|\uD821[\uDFF8-\uDFFF]|\uD823[\uDCD6-\uDCFF\uDD09-\uDFFF]|\uD82C[\uDD1F-\uDD4F\uDD53-\uDD63\uDD68-\uDD6F\uDEFC-\uDFFF]|\uD82F[\uDC6B-\uDC6F\uDC7D-\uDC7F\uDC89-\uDC8F\uDC9A-\uDC9C\uDC9F-\uDFFF]|\uD834[\uDC00-\uDD64\uDD6A-\uDD6C\uDD73-\uDD7A\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDE41\uDE45-\uDFFF]|\uD835[\uDC55\uDC9D\uDCA0\uDCA1\uDCA3\uDCA4\uDCA7\uDCA8\uDCAD\uDCBA\uDCBC\uDCC4\uDD06\uDD0B\uDD0C\uDD15\uDD1D\uDD3A\uDD3F\uDD45\uDD47-\uDD49\uDD51\uDEA6\uDEA7\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3\uDFCC\uDFCD]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85-\uDE9A\uDEA0\uDEB0-\uDFFF]|\uD838[\uDC07\uDC19\uDC1A\uDC22\uDC25\uDC2B-\uDCFF\uDD2D-\uDD2F\uDD3E\uDD3F\uDD4A-\uDD4D\uDD4F-\uDEBF\uDEFA-\uDFFF]|\uD83A[\uDCC5-\uDCCF\uDCD7-\uDCFF\uDD4C-\uDD4F\uDD5A-\uDFFF]|\uD83B[\uDC00-\uDDFF\uDE04\uDE20\uDE23\uDE25\uDE26\uDE28\uDE33\uDE38\uDE3A\uDE3C-\uDE41\uDE43-\uDE46\uDE48\uDE4A\uDE4C\uDE50\uDE53\uDE55\uDE56\uDE58\uDE5A\uDE5C\uDE5E\uDE60\uDE63\uDE65\uDE66\uDE6B\uDE73\uDE78\uDE7D\uDE7F\uDE8A\uDE9C-\uDEA0\uDEA4\uDEAA\uDEBC-\uDFFF]|\uD83C[\uDC00-\uDD2F\uDD4A-\uDD4F\uDD6A-\uDD6F\uDD8A-\uDFFF]|\uD83E[\uDC00-\uDFEF\uDFFA-\uDFFF]|\uD869[\uDEDE-\uDEFF]|\uD86D[\uDF35-\uDF3F]|\uD86E[\uDC1E\uDC1F]|\uD873[\uDEA2-\uDEAF]|\uD87A[\uDFE1-\uDFFF]|\uD87E[\uDE1E-\uDFFF]|\uD884[\uDF4B-\uDFFF]|\uDB40[\uDC00-\uDCFF\uDDF0-\uDFFF]/g,qn=Object.hasOwnProperty,Jn=class{constructor(){this.occurrences,this.reset()}slug(e,t){let n=this,r=Yn(e,t===!0),i=r;for(;qn.call(n.occurrences,r);)n.occurrences[i]++,r=i+`-`+n.occurrences[i];return n.occurrences[r]=0,r}reset(){this.occurrences=Object.create(null)}};function Yn(e,t){return typeof e==`string`?(t||(e=e.toLowerCase()),e.replace(Kn,``).replace(/ /g,`-`)):``}var Xn=/^(#{2,4})\s+(.+)$/gm;function Zn(e){let t=new Jn,n=new RegExp(Xn.source,Xn.flags);return Array.from(e.matchAll(n)).map(e=>{let n=e[1].length,r=e[2].trim();return{depth:n,slug:t.slug(r),text:r}})}var Qn={rootMargin:`-20% 0% -70% 0%`,threshold:0},$n=`h2[id], h3[id], h4[id]`;function er(e){let[t,n]=(0,y.useState)(null);return(0,y.useEffect)(()=>{let e=null,t=setTimeout(()=>{let t=document.querySelectorAll($n);t.length!==0&&(e=new IntersectionObserver(e=>{let t=e.filter(e=>e.isIntersecting);if(t.length>0){let e=t.reduce((e,t)=>t.boundingClientRect.top>=e.boundingClientRect.top?e:t);n(e.target.id)}},Qn),t.forEach(t=>e.observe(t)))},100);return()=>{clearTimeout(t),e?.disconnect()}},[e]),t}function tr(e,t){return t.reduce((e,t)=>e[t]?.subheadings??[],e)}function nr(e,t,n){if(t.length===0)return e.concat(n);let[r,...i]=t;return e.map((e,t)=>{if(t!==r)return e;let a=nr(e.subheadings,i,n);return Object.assign({},e,{subheadings:a})})}function rr(e){return e.reduce((e,t)=>{let n=Object.assign({},t,{subheadings:[]}),r=n.depth===2?[]:e.paths[n.depth-1];if(!r)return e;let i=tr(e.toc,r).length,a=r.concat(i);return{toc:nr(e.toc,r,n),paths:Object.assign({},e.paths,{[n.depth]:a})}},{toc:[],paths:{}}).toc}var ir=/`([^`]+)`/g;function ar(e){let t=Array.from(e.matchAll(ir)).reduce((t,n)=>{let r=t.lastIndex,i=n.index>r?[{text:e.slice(r,n.index),isCode:!1}]:[];return r=n.index+n[0].length,{parts:t.parts.concat(i,{text:n[1],isCode:!0}),lastIndex:r}},{parts:[],lastIndex:0}),n=t.lastIndex<e.length?[{text:e.slice(t.lastIndex),isCode:!1}]:[],r=t.parts.concat(n);return r.length===0?[{text:e,isCode:!1}]:r}var or=`block text-sm transition-colors border-l-2 pl-4 -ml-0.5 font-spline-sans-mono`,sr=`text-[#1D4ED8] font-medium border-[#1D4ED8]`,cr=`hover:text-[#1D4ED8] border-transparent`;function lr(e,t=!1){return`${or} ${t?`py-0.5`:`py-1`} ${e?sr:`${t?`text-base-content/60`:`text-base-content/70`} ${cr}`}`}function ur(e){let t=document.getElementById(e);return t?(t.scrollIntoView({behavior:`smooth`,block:`start`}),history.pushState(null,``,`#${e}`),!0):!1}function dr({headings:e}){let t=rr(e||[]),n=er(e?.length||0),r=(0,y.useCallback)((e,t)=>{ur(t)&&e.preventDefault()},[]);return t.length===0?null:(0,D.jsxs)(`nav`,{className:`sticky top-28 w-64`,"aria-label":`Table of contents`,children:[(0,D.jsx)(fr,{}),(0,D.jsx)(pr,{toc:t,activeId:n,onClickLink:r})]})}function fr(){return(0,D.jsx)(`h2`,{className:`mb-3 text-xs font-semibold text-base-content/60 uppercase tracking-wider font-spline-sans-mono`,children:`On this page`})}function pr({toc:e,activeId:t,onClickLink:n}){return(0,D.jsx)(`ul`,{className:`space-y-2.5`,children:e.map(e=>(0,D.jsx)(mr,{heading:e,activeId:t,onClickLink:n},e.slug))})}function mr({heading:e,activeId:t,onClickLink:n}){let r=t===e.slug,i=e.subheadings.length>0;return(0,D.jsxs)(`li`,{children:[(0,D.jsx)(hr,{slug:e.slug,text:e.text,isActive:r,onClickLink:n}),i&&(0,D.jsx)(gr,{subheadings:e.subheadings,activeId:t,onClickLink:n})]})}function hr({slug:e,text:t,isActive:n,isSubheading:r=!1,onClickLink:i}){let a=ar(t);return(0,D.jsx)(`a`,{href:`#${e}`,onClick:t=>i(t,e),className:lr(n,r),children:a.map((e,t)=>e.isCode?(0,D.jsx)(`code`,{className:`text-xs px-1 py-0.5 rounded bg-base-content/10`,children:e.text},t):(0,D.jsx)(`span`,{children:e.text},t))})}function gr({subheadings:e,activeId:t,onClickLink:n}){return(0,D.jsx)(`ul`,{className:`mt-2 space-y-2 ml-3`,children:e.map(e=>(0,D.jsx)(`li`,{children:(0,D.jsx)(hr,{slug:e.slug,text:e.text,isActive:t===e.slug,isSubheading:!0,onClickLink:n})},e.slug))})}var _r=_({id:`copy`,initial:`idle`,states:{idle:{on:{COPY:`copied`}},copied:{after:{2e3:`idle`}}}}),vr=e=>e?(0,D.jsx)(Bt,{className:`h-4 w-4 text-green-500`}):(0,D.jsx)(Ut,{className:`h-4 w-4`}),yr=async e=>{try{return await navigator.clipboard.writeText(e),!0}catch{return!1}};function br({code:e}){let[t,n]=v(_r),r=t.matches(`copied`),i=async()=>{await yr(e)&&n({type:`COPY`})},a=r?`Copied!`:`Copy code`,o=vr(r);return(0,D.jsx)(`button`,{type:`button`,className:`flex items-center justify-center h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer`,onClick:i,"aria-label":a,children:o})}var xr=[`javascript`,`js`,`typescript`,`ts`,`jsx`,`tsx`,`bash`,`shellscript`,`json`,`yaml`,`markdown`,`text`],Sr={js:`javascript`,ts:`typescript`},Cr=e=>Sr[e]||e,wr={wrapper:`not-prose shiki-wrapper relative group overflow-hidden rounded-md border border-border/70 bg-card/85 backdrop-blur`,header:`shiki-header flex items-center justify-between gap-3 border-b border-border/70 bg-muted/55 px-3 py-2`,pre:`overflow-x-auto px-2 py-2 text-[13px] leading-5`,content:`[&_.shiki]:!overflow-visible [&_.shiki]:!bg-transparent [&_pre]:!m-0 [&_pre]:!border-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:!bg-transparent [&_code]:!p-0`},Tr=[`bg-rose-400`,`bg-amber-400`,`bg-emerald-400`],Er=128,Dr=null,K=new Map;function Or(){return Dr||=U(()=>import(`./highlighter-BXDqwenT.js`).then(e=>e.createCodeHighlighter()),__vite__mapDeps([14,15,2])),Dr}var kr=e=>{let t=Cr(e);return xr.includes(t)?t:`text`},Ar=e=>{let t=K.get(e);if(t)return K.delete(e),K.set(e,t),t},jr=(e,t)=>{if(K.size>=Er){let e=K.keys().next().value;e!==void 0&&K.delete(e)}K.set(e,t)},Mr=(e,t,n)=>{let r=kr(t),i=JSON.stringify([e,r,n]),a=Ar(i);if(a)return a;let o=Or().then(t=>t.codeToHtml(e,r,n)).catch(e=>{throw K.delete(i),e});return jr(i,o),o};function Nr({code:e,lang:t=`text`,showLineNumbers:n=!1}){let r=(0,y.use)(Mr(e,t,n));return(0,D.jsx)(`div`,{className:wr.content,dangerouslySetInnerHTML:{__html:r}})}function Pr({code:e,lang:t=`text`,title:n,showLineNumbers:r=!1,showLanguage:i=!0,showCopy:a=!0,className:o}){let s=!!(n||i||a),c=a?(0,D.jsx)(br,{code:e}):null;return(0,D.jsxs)(`div`,{className:Et(wr.wrapper,r&&`show-line-numbers`,o),children:[s&&(0,D.jsxs)(`div`,{className:wr.header,children:[(0,D.jsxs)(`div`,{className:`flex min-w-0 items-center gap-3`,children:[(0,D.jsx)(`div`,{className:`flex items-center gap-1.5`,"aria-hidden":`true`,children:Tr.map(e=>(0,D.jsx)(`span`,{className:Et(`h-2.5 w-2.5 rounded-full ring-1 ring-black/5`,e)},e))}),(0,D.jsxs)(`div`,{className:`flex min-w-0 items-center gap-2`,children:[n&&(0,D.jsx)(`span`,{className:`truncate text-xs font-medium text-base-content/70`,children:n}),i&&t&&t!==`text`&&(0,D.jsx)(`span`,{className:`font-mono text-xs text-base-content/50`,children:t})]})]}),c]}),(0,D.jsx)(`div`,{className:wr.pre,children:(0,D.jsx)(y.Suspense,{fallback:(0,D.jsx)(`pre`,{className:`text-sm leading-relaxed`,children:(0,D.jsx)(`code`,{children:e})}),children:(0,D.jsx)(Nr,{code:e,lang:t,showLineNumbers:r})})})]})}function Fr({href:e,children:t,className:n}){if(!e)return(0,D.jsx)(`a`,{className:n,children:t});if(e.startsWith(`http`)||e.startsWith(`//`))return(0,D.jsx)(`a`,{href:e,className:n,target:`_blank`,rel:`noopener noreferrer`,children:t});if(e.startsWith(`/docs/`)){let r=e.replace(`/docs/`,``);return(0,D.jsx)(s,{to:`/docs/$slug/`,params:{slug:r},className:n,children:t})}return(0,D.jsx)(`a`,{href:e,className:n,children:t})}function Ir({level:e,id:t,children:n,...r}){if(!t)return(0,D.jsx)(e,{...r,children:n});let i=`#${t}`;return(0,D.jsx)(e,{...r,id:t,children:(0,D.jsxs)(`a`,{href:i,className:`group text-inherit no-underline`,children:[n,(0,D.jsx)(Wt,{"aria-hidden":`true`,className:`ml-2 inline-block h-[0.8em] w-[0.8em] align-baseline opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60`})]})})}var Lr=e=>function(t){return(0,D.jsx)(Ir,{...t,level:e})},Rr=(0,y.lazy)(()=>U(()=>import(`./Mermaid-pamgRpeF.js`).then(e=>({default:e.Mermaid})),__vite__mapDeps([16,2,1,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]))),zr=Lr(`h1`),Br=Lr(`h2`),Vr=Lr(`h3`),Hr=Lr(`h4`),Ur=Lr(`h5`),Wr=Lr(`h6`);function Gr(e){return typeof e==`string`?e:Array.isArray(e)?e.map(Gr).join(``):e&&typeof e==`object`&&`props`in e?Gr(e.props?.children):``}function Kr({chart:e}){return(0,D.jsx)(y.Suspense,{fallback:(0,D.jsx)(`div`,{className:`my-6 flex justify-center animate-pulse`,children:(0,D.jsx)(`div`,{className:`h-32 w-full max-w-md bg-base-content/10 rounded`})}),children:(0,D.jsx)(Rr,{chart:e})})}function qr({children:e,...t}){let n=t[`data-mermaid-content`],r=t[`data-language`];if(r===`mermaid`&&n)return(0,D.jsx)(Kr,{chart:n});let i=e,a=i?.props?.[`data-mermaid-content`],o=i?.props?.[`data-language`];if(o===`mermaid`&&a)return(0,D.jsx)(Kr,{chart:a});let s=((i?.props?.className??``).match(/language-(\S+)/)?.[1]??o??r??`text`).replace(/^language-/,``),c=Gr(i?.props?.children??e);return s===`mermaid`?(0,D.jsx)(Kr,{chart:c}):(0,D.jsx)(`div`,{className:`not-prose my-4`,children:(0,D.jsx)(Pr,{code:c,lang:s,showCopy:!1,showLanguage:!1,showLineNumbers:!0})})}var Jr={Mermaid:Kr,pre:qr,a:Fr,h1:zr,h2:Br,h3:Vr,h4:Hr,h5:Ur,h6:Wr,p:`p`,code:`code`,span:`span`,strong:`strong`,em:`em`,ul:`ul`,ol:`ol`,li:`li`,img:`img`};function Yr(e){let t=e.match(/docs\/([^/]+)$/);return t?t[1]:`introduction`}function Xr(e){let t,n,r,i;if(G.forEach((t,n)=>{let a=t.items.findIndex(t=>t.href.endsWith(`/${e}`));a!==-1&&(r=n,i=a)}),r===void 0||i===void 0)return{prevItem:t,nextItem:n};if(i>0)t=G[r].items[i-1];else if(r>0){let e=G[r-1];t=e.items[e.items.length-1]}return i<G[r].items.length-1?n=G[r].items[i+1]:r<G.length-1&&(n=G[r+1].items[0]),{prevItem:t,nextItem:n}}function Zr({prevItem:e,nextItem:t}){return(0,D.jsxs)(`nav`,{className:`flex gap-7`,children:[e?.href&&(0,D.jsx)(s,{to:`/docs/$slug/`,params:{slug:Yr(e.href)},preload:`intent`,className:`mr-auto flex`,children:(0,D.jsxs)(`button`,{className:`btn rounded-full bg-base-100 border border-base-content/10 text-base-content/80 shadow-sm shadow-base-content/5 hover:bg-base-content/5 hover:text-[#1D4ED8] transition-all`,children:[(0,D.jsx)(Vt,{className:`w-6 h-6`}),(0,D.jsx)(`span`,{className:`text-xs md:text-sm font-medium`,children:e.title})]})}),t?.href&&(0,D.jsx)(s,{to:`/docs/$slug/`,params:{slug:Yr(t.href)},preload:`intent`,className:`ml-auto flex`,children:(0,D.jsxs)(`button`,{className:`btn rounded-full bg-base-100 border border-base-content/10 text-base-content/80 shadow-sm shadow-base-content/5 hover:bg-base-content/5 hover:text-[#1D4ED8] transition-all`,children:[(0,D.jsx)(`span`,{className:`text-xs md:text-sm font-medium`,children:t.title}),(0,D.jsx)(Ht,{className:`w-6 h-6`})]})})]})}var Qr=`/pastoralist/assets/katex.min-BsN2iI2U.css`;function $r(){let{slug:e}=h({from:`/docs/$slug`}),t=yn(e);if(!t)return(0,D.jsx)(l,{to:`/docs/$slug/`,params:{slug:`introduction`}});let n=xn(e),r=bn(e),i=r?Zn(r):[],{prevItem:a,nextItem:o}=Xr(e);return(0,D.jsxs)(`section`,{className:`flex flex-col lg:flex-row p-4 sm:p-6 md:p-10 md:pt-10 font-spline-sans-mono gap-8`,children:[(0,D.jsx)(ei,{enabled:t.usesMath}),(0,D.jsxs)(`article`,{className:`flex flex-col w-full max-w-[600px]`,children:[(0,D.jsx)(ti,{title:t.title}),(0,D.jsxs)(`section`,{className:`docs-prose prose prose-sm sm:prose-base md:prose-md mb-10 max-w-none prose-pre:max-w-[90vw] prose-pre:overflow-x-auto`,children:[(0,D.jsxs)(`header`,{children:[(0,D.jsx)(`h1`,{children:t.title}),(0,D.jsx)(`p`,{children:t.description})]}),(0,D.jsx)(ni,{Content:n})]}),(0,D.jsx)(Zr,{prevItem:a,nextItem:o})]}),(0,D.jsx)(`aside`,{className:`hidden xl:block pl-8`,children:(0,D.jsx)(dr,{headings:i})})]})}function ei({enabled:e}){return e?(0,D.jsx)(`link`,{rel:`stylesheet`,href:Qr,precedence:`low`}):null}function ti({title:e}){return(0,D.jsx)(`nav`,{className:`text-base breadcrumbs pt-0 pb-4`,children:(0,D.jsxs)(`ul`,{children:[(0,D.jsx)(`li`,{children:(0,D.jsx)(s,{to:`/`,className:`hover:text-primary`,children:`Home`})}),(0,D.jsx)(`li`,{className:`text-primary`,children:e})]})})}function ni({Content:e}){return e?(0,D.jsx)(y.Suspense,{fallback:(0,D.jsx)(`div`,{className:`h-32 animate-pulse rounded bg-base-content/10`}),children:(0,D.jsx)(e,{components:Jr})}):null}var ri=_({id:`copy`,initial:`idle`,states:{idle:{on:{COPY:`copied`}},copied:{after:{800:`idle`}}}}),ii=`flex items-center justify-center size-9 shrink-0 rounded-xl bg-base-100/70 hover:bg-base-200/80 transition-colors cursor-pointer`,ai=`h-5 w-5 pointer-events-none`,oi=`h-6 w-6 pointer-events-none text-green-500`,si=e=>e?(0,D.jsx)(Bt,{className:oi}):(0,D.jsx)(Ut,{className:ai}),ci=async e=>{try{return await navigator.clipboard.writeText(e),!0}catch{return!1}};function li(){let[e,t]=v(ri),n=e.matches(`copied`),r=async e=>{let n=e.currentTarget.closest(`figure, div`)?.querySelector(`code`);!n||!await ci(n.textContent??``)||t({type:`COPY`})},i=n?`Copied!`:`Copy`,a=si(n);return(0,D.jsx)(`button`,{type:`button`,className:ii,onClick:r,"aria-label":i,children:a})}var ui=({children:e,maskSrc:t})=>{let n={WebkitMaskImage:`url(${t})`,maskImage:`url(${t})`,WebkitMaskSize:`contain`,maskSize:`contain`,WebkitMaskRepeat:`no-repeat`,maskRepeat:`no-repeat`,WebkitMaskPosition:`center`,maskPosition:`center`};return(0,D.jsx)(`div`,{style:{position:`relative`,display:`inline-flex`},children:(0,D.jsxs)(`div`,{className:`logo-shine-wrap`,style:n,children:[e,(0,D.jsx)(`div`,{"aria-hidden":`true`,className:`logo-shine-beam`})]})})},di=({size:e,color:t})=>(0,D.jsx)(`svg`,{width:e,height:e,viewBox:`0 0 10 10`,fill:t,"aria-hidden":`true`,style:{filter:`drop-shadow(0 0 3px ${t})`},children:(0,D.jsx)(`path`,{d:`M5 0 L6.2 3.8 L10 5 L6.2 6.2 L5 10 L3.8 6.2 L0 5 L3.8 3.8 Z`})}),fi=[{left:`5%`,top:`4%`,size:12,color:`#fbbf24`,delay:0,duration:3.2},{left:`13%`,top:`1%`,size:7,color:`#c084fc`,delay:1.7,duration:2.8},{left:`20%`,top:`2%`,size:8,color:`#e2e8f0`,delay:1.4,duration:2.7},{left:`32%`,top:`4%`,size:11,color:`#f9a8d4`,delay:.2,duration:3.4},{left:`44%`,top:`3%`,size:10,color:`#93c5fd`,delay:.6,duration:3.5},{left:`57%`,top:`1%`,size:8,color:`#fbbf24`,delay:2.8,duration:2.6},{left:`70%`,top:`5%`,size:14,color:`#fbbf24`,delay:2.1,duration:2.9},{left:`79%`,top:`2%`,size:7,color:`#e2e8f0`,delay:1,duration:3.1},{left:`90%`,top:`7%`,size:9,color:`#c084fc`,delay:.3,duration:3.1},{left:`1%`,top:`14%`,size:8,color:`#93c5fd`,delay:2.2,duration:3},{left:`1%`,top:`25%`,size:11,color:`#f9a8d4`,delay:1.8,duration:2.6},{left:`4%`,top:`38%`,size:7,color:`#fbbf24`,delay:.4,duration:3.5},{left:`3%`,top:`55%`,size:8,color:`#93c5fd`,delay:.5,duration:3.4},{left:`1%`,top:`67%`,size:12,color:`#e2e8f0`,delay:2.6,duration:2.7},{left:`2%`,top:`78%`,size:13,color:`#fbbf24`,delay:2.3,duration:2.8},{left:`4%`,top:`89%`,size:7,color:`#c084fc`,delay:1,duration:3.3},{left:`96%`,top:`16%`,size:8,color:`#f9a8d4`,delay:.6,duration:2.9},{left:`96%`,top:`22%`,size:10,color:`#e2e8f0`,delay:1.1,duration:3},{left:`98%`,top:`35%`,size:7,color:`#fbbf24`,delay:2,duration:3.4},{left:`97%`,top:`48%`,size:13,color:`#c084fc`,delay:.4,duration:3.3},{left:`96%`,top:`62%`,size:8,color:`#93c5fd`,delay:1.5,duration:2.6},{left:`95%`,top:`72%`,size:9,color:`#f9a8d4`,delay:1.9,duration:2.7},{left:`97%`,top:`85%`,size:11,color:`#fbbf24`,delay:.1,duration:3.2},{left:`10%`,top:`12%`,size:9,color:`#e2e8f0`,delay:1.3,duration:2.8},{left:`14%`,top:`18%`,size:7,color:`#fbbf24`,delay:.9,duration:3.6},{left:`25%`,top:`10%`,size:10,color:`#c084fc`,delay:2.4,duration:2.5},{left:`35%`,top:`16%`,size:8,color:`#93c5fd`,delay:.7,duration:3},{left:`74%`,top:`11%`,size:9,color:`#f9a8d4`,delay:1.6,duration:2.7},{left:`82%`,top:`14%`,size:11,color:`#93c5fd`,delay:2.5,duration:2.5},{left:`88%`,top:`20%`,size:7,color:`#fbbf24`,delay:.3,duration:3.3},{left:`7%`,top:`42%`,size:10,color:`#c084fc`,delay:1.2,duration:3.1},{left:`8%`,top:`60%`,size:8,color:`#f9a8d4`,delay:2.7,duration:2.8},{left:`91%`,top:`38%`,size:9,color:`#e2e8f0`,delay:.5,duration:3.4},{left:`92%`,top:`57%`,size:11,color:`#fbbf24`,delay:1.8,duration:2.6},{left:`12%`,top:`74%`,size:7,color:`#93c5fd`,delay:.4,duration:3.2},{left:`18%`,top:`80%`,size:9,color:`#c084fc`,delay:.7,duration:3.2},{left:`28%`,top:`76%`,size:12,color:`#fbbf24`,delay:2.1,duration:2.9},{left:`38%`,top:`88%`,size:12,color:`#e2e8f0`,delay:2,duration:2.8},{left:`48%`,top:`78%`,size:8,color:`#f9a8d4`,delay:1.4,duration:3.5},{left:`58%`,top:`83%`,size:10,color:`#c084fc`,delay:.2,duration:3},{left:`62%`,top:`85%`,size:8,color:`#fbbf24`,delay:1.3,duration:3.5},{left:`72%`,top:`77%`,size:11,color:`#93c5fd`,delay:2.6,duration:2.7},{left:`80%`,top:`82%`,size:11,color:`#f9a8d4`,delay:.2,duration:3.1},{left:`88%`,top:`75%`,size:7,color:`#e2e8f0`,delay:1.7,duration:3.4},{left:`7%`,top:`95%`,size:8,color:`#fbbf24`,delay:2.3,duration:2.6},{left:`10%`,top:`94%`,size:10,color:`#93c5fd`,delay:1.6,duration:2.6},{left:`22%`,top:`97%`,size:7,color:`#c084fc`,delay:.9,duration:3.1},{left:`35%`,top:`95%`,size:9,color:`#e2e8f0`,delay:1.4,duration:2.8},{left:`50%`,top:`96%`,size:7,color:`#c084fc`,delay:.8,duration:3.3},{left:`63%`,top:`94%`,size:11,color:`#f9a8d4`,delay:2,duration:2.9},{left:`75%`,top:`97%`,size:8,color:`#fbbf24`,delay:.5,duration:3.4},{left:`85%`,top:`93%`,size:13,color:`#fbbf24`,delay:2.4,duration:2.9},{left:`93%`,top:`95%`,size:7,color:`#93c5fd`,delay:1.1,duration:3}];function pi(){return(0,D.jsx)(`div`,{"aria-hidden":`true`,className:`pointer-events-none absolute inset-0 overflow-hidden`,style:{zIndex:0},children:fi.map((e,t)=>(0,D.jsx)(r.span,{style:{position:`absolute`,left:e.left,top:e.top},initial:{opacity:0,scale:0,rotate:0},animate:{opacity:[0,1,0],scale:[0,1,0],rotate:[0,135,0]},transition:{duration:e.duration,delay:e.delay,repeat:1/0,ease:`easeInOut`},children:(0,D.jsx)(di,{size:e.size,color:e.color})},t))})}var q={window:`terminal-window`,windowActive:`ring-2 ring-primary ring-offset-2`,windowMaxWidth:`max-w-lg w-full`,header:`terminal-header`,headerWithTabs:`terminal-header flex justify-between items-center`,dotRed:`terminal-dot terminal-dot-red`,dotYellow:`terminal-dot terminal-dot-yellow`,dotGreen:`terminal-dot terminal-dot-green`,dots:`flex gap-2 items-center`,label:`ml-3 text-slate-400 text-xs`,tabs:`terminal-tabs`,tab:`terminal-tab`,tabActive:`terminal-tab active`,content:`terminal-content`,contentPadding:`terminal-content text-sm`,line:`terminal-line`,prefix:`terminal-prefix`,cursor:`cursor`,footer:`terminal-footer`,loader:`terminal-window w-full animate-pulse`,loaderBar:`h-4 bg-base-content/10 rounded`},mi={threshold:.1},hi=`terminal-window max-w-lg w-full my-4`,gi=`380px`,_i=`●`,vi=`✓`,yi=`⬢`,bi=`▲`,xi=`🧑‍🌾`,Si=`🐑`,Ci=[{lines:[{prefix:`$`,text:`pastoralist`,animate:!0},{text:`&nbsp;`},{text:`${xi} Pastoralist`,className:`text-success`},{text:`&nbsp;`},{text:`Updating overrides`,className:`text-base-content/70`,depth:0,isLast:!0,connectors:[]},{text:`${_i} lodash@4.17.21`,className:`text-success`,depth:1,isLast:!1,connectors:[!1]},{text:`Security fix`,className:`text-base-content/70`,depth:2,isLast:!1,connectors:[!0,!0]},{text:`Used by: 1 package`,className:`text-base-content/70`,depth:2,isLast:!0,connectors:[!0,!1]},{text:`${_i} 1 override applied`,className:`text-success`,depth:1,isLast:!0,connectors:[!1]},{text:`${vi} 1 override tracked`,className:`text-success`},{text:`${yi} 1 dependent documented`,className:`text-cyan-400`},{text:`<span class="text-error">■</span> 0 crit · <span class="text-warning">▲</span> 1 high · <span class="text-cyan-400">◆</span> 0 med · <span class="text-success">●</span> 0 low · <span class="text-cyan-400">▸</span> 1 tracked · ○ 0 removed · 10 scanned`,className:`text-base-content/50`},{text:`${vi} The herd is safe! ${Si}`,className:`text-gold`}],pauseAfter:0}],wi=[{lines:[{prefix:`$`,text:`pastoralist`,animate:!0},{text:`&nbsp;`},{text:`${xi} Pastoralist`,className:`text-success`},{text:`&nbsp;`},{text:`Scanning overrides`,className:`text-base-content/70`,depth:0,isLast:!1,connectors:[]},{text:`${_i} lodash@4.17.21`,className:`text-success`,depth:1,isLast:!1,connectors:[!0],delay:30},{text:`Reason: Security fix CVE-2021-23337`,className:`text-base-content/70`,depth:2,isLast:!1,connectors:[!0,!0],delay:20},{text:`Used by: my-app@1.0.0`,className:`text-base-content/70`,depth:2,isLast:!0,connectors:[!0,!1],delay:20},{text:`${bi} minimist@1.2.5`,className:`text-warning`,depth:1,isLast:!0,connectors:[!1],delay:30},{text:`Stale: no package depends on this override`,className:`text-base-content/70`,depth:2,isLast:!0,connectors:[!1,!1],delay:20},{text:`Cleanup`,className:`text-base-content/70`,depth:0,isLast:!0,connectors:[],delay:30},{text:`${_i} Removed 1 stale override`,className:`text-success`,depth:1,isLast:!0,connectors:[!1],delay:20},{text:`<span class="text-error">■</span> 0 crit · <span class="text-warning">▲</span> 0 high · <span class="text-cyan-400">◆</span> 0 med · <span class="text-success">●</span> 0 low · <span class="text-cyan-400">▸</span> 1 tracked · ○ 1 removed · 10 scanned`,className:`text-base-content/50`,delay:40},{text:`${vi} The herd is safe! ${Si}`,className:`text-gold`,delay:30}],pauseAfter:0}];`${xi}`,`${bi}`,`${_i}`,`${_i}`,`${_i}`,`${_i}`,`${vi}`,`${yi}`,`${vi}${Si}`;var Ti=({isActive:e=!1,minHeight:t,fileName:n,tabs:r,activeTab:i,onTabChange:a,hideHeader:o=!1,footer:s,footerClassName:c,children:l,className:u})=>{let d=e?q.windowActive:``,f=Et(u??q.window,`transition-all duration-300`,d),p=t?{minHeight:t}:void 0,m=r&&r.length>0,h=m?q.headerWithTabs:q.header,g=n??`terminal`;return(0,D.jsxs)(`div`,{className:f,style:p,children:[!o&&(0,D.jsxs)(`div`,{className:h,children:[(0,D.jsxs)(`div`,{className:q.dots,children:[(0,D.jsx)(`div`,{className:q.dotRed}),(0,D.jsx)(`div`,{className:q.dotYellow}),(0,D.jsx)(`div`,{className:q.dotGreen}),(0,D.jsx)(`span`,{className:q.label,children:g})]}),m&&(0,D.jsx)(`div`,{className:q.tabs,children:r.map(e=>{let t=e.id===i?q.tabActive:q.tab;return(0,D.jsx)(`button`,{onClick:()=>a?.(e.id),className:t,children:e.label},e.id)})})]}),l,s&&(0,D.jsx)(`div`,{className:Et(q.footer,c),children:s})]})},Ei=(e,t,n)=>{let[r,i]=(0,y.useState)(``);return(0,y.useEffect)(()=>{if(!n){i(``);return}let a=r.length;if(a<e.length){let n=setTimeout(()=>{i(e.slice(0,a+1))},t);return()=>clearTimeout(n)}},[n,r,e,t]),{displayedText:r,isComplete:r.length===e.length&&e.length>0}},Di=(e,t,n)=>{let[r,i]=(0,y.useState)(!1);return(0,y.useEffect)(()=>{if(!e)return;let t=e.animate??!1,r=e.delay??35;if(!t){let e=setTimeout(()=>{n()},r);return()=>clearTimeout(e)}let a=setTimeout(()=>{i(!0)},r);return()=>clearTimeout(a)},[e,n]),{isTyping:r,setIsTyping:i}},Oi=({line:e})=>{let t=e.depth??0;if(t===0)return null;let n=(e.connectors??[]).slice(0,t-1).map((e,t)=>(0,D.jsx)(`span`,{className:`tree-connector ${e?`tree-connector-pipe`:`tree-connector-empty`}`},t)),r=e.isLast?`tree-connector-last`:`tree-connector-mid`;return(0,D.jsxs)(D.Fragment,{children:[n,(0,D.jsx)(`span`,{className:`tree-connector ${r}`})]})},ki=({visibleLines:e,isTyping:t,currentLine:n,displayedText:r})=>(0,D.jsxs)(D.Fragment,{children:[e.map((e,t)=>(0,D.jsxs)(`div`,{className:`${q.line} ${e.className??``}`,children:[e.prefix&&(0,D.jsx)(`span`,{className:q.prefix,children:e.prefix}),(0,D.jsx)(Oi,{line:e}),(0,D.jsx)(`span`,{dangerouslySetInnerHTML:{__html:e.text}})]},t)),t&&n&&(0,D.jsxs)(`div`,{className:`${q.line} ${n.className??``}`,children:[n.prefix&&(0,D.jsx)(`span`,{className:q.prefix,children:n.prefix}),(0,D.jsx)(Oi,{line:n}),(0,D.jsx)(`span`,{dangerouslySetInnerHTML:{__html:r}}),(0,D.jsx)(`span`,{className:q.cursor})]})]}),Ai=(e,t,n)=>{if(e&&!t)return n},ji=({demos:e,loop:t=!0,typingSpeed:n=12,startAnimation:r,shouldAnimate:i=!0,onComplete:a,hideHeader:o=!1,minHeight:s})=>{let[c,l]=(0,y.useState)(0),[u,d]=(0,y.useState)(0),[f,p]=(0,y.useState)([]),[m,h]=(0,y.useState)(!i),[g,_]=(0,y.useState)(!i),v=(0,y.useRef)(null);(0,y.useEffect)(()=>{if(!i){let t=e.flatMap(e=>e.lines);p(t),_(!0),a?.()}},[i,e,a]);let b=e[c],x=b?.lines[u];(0,y.useEffect)(()=>{if(r!==void 0){r&&!m&&h(!0);return}let e=new IntersectionObserver(e=>{e[0]?.isIntersecting&&!m&&h(!0)},mi),t=v.current;return t&&e.observe(t),()=>{t&&e.unobserve(t)}},[m,r]);let S=(0,y.useCallback)(()=>{d(0),p([])},[]),C=(0,y.useCallback)(()=>{let n=c===e.length-1;n&&t?(l(0),S()):n&&!t?(_(!0),a?.()):n||(l(c+1),S())},[c,e.length,t,S,a]),w=(0,y.useCallback)(()=>{let e=u===b.lines.length-1;if(x&&p(e=>e.concat(x)),e){let e=b.pauseAfter??2e3;setTimeout(C,e)}else d(u+1)},[u,b,C,x]),{isTyping:T,setIsTyping:ee}=Di(Ai(m,g,x),f,w),{displayedText:te,isComplete:E}=Ei(x?.text??``,n,T);(0,y.useEffect)(()=>{E&&T&&(ee(!1),w())},[E,T,w,ee]);let ne={visibleLines:f,isTyping:T,currentLine:x,displayedText:te};return o?(0,D.jsx)(`div`,{ref:v,className:`bg-transparent`,children:(0,D.jsx)(`div`,{className:q.content,children:(0,D.jsx)(ki,{...ne})})}):(0,D.jsx)(`div`,{ref:v,children:(0,D.jsx)(Ti,{className:hi,minHeight:s,children:(0,D.jsx)(`div`,{className:q.content,children:(0,D.jsx)(ki,{...ne})})})})},Mi=`pastoralist-hero-animation-seen`,Ni=[`#ff0000`,`#ff8000`,`#ffff00`,`#00ff00`,`#0080ff`,`#8000ff`],Pi=()=>Dt()?!0:sessionStorage.getItem(Mi)===`true`,Fi=e=>_({id:`hero`,initial:e?`done`:`terminalVisible`,states:{idle:{after:{500:`logoVisible`}},logoVisible:{after:{700:`textVisible`}},textVisible:{after:{400:`terminalVisible`}},terminalVisible:{on:{TERMINAL_DONE:`terminalComplete`}},terminalComplete:{after:{1200:`rainbow`}},rainbow:{after:{600:`done`}},done:{}}}),Ii=[.16,1,.3,1],J={section:`relative flex items-start justify-center px-4 md:px-8 pt-6 pb-16 md:pt-8 md:pb-20 overflow-hidden min-h-screen`,article:`max-w-2xl md:max-w-5xl w-full`,logoHeader:`text-center mb-10 md:mb-12`,logo:`mx-auto h-24 w-24 md:h-36 md:w-36`,main:`flex flex-col-reverse gap-10 lg:flex-row lg:items-center lg:gap-10 lg:justify-between`,aside:`mt-6 lg:mt-0 w-full text-left lg:flex-[1.05]`,terminalFrame:`relative mx-auto w-full max-w-lg lg:mx-0`,contentHeader:`text-center lg:max-w-2xl lg:flex-[0.95] lg:text-left`,h1:`text-3xl sm:text-4xl md:text-5xl lg:text-[3.35rem] font-black leading-[1.05] tracking-tight mb-8`,nav:`flex flex-col sm:flex-row items-center sm:items-stretch gap-4 sm:gap-5 justify-center lg:justify-start`,codeBlock:`flex h-12 w-full max-w-md items-center gap-3 rounded-2xl border border-base-content/10 bg-base-100/85 px-3 shadow-sm shadow-base-content/5 backdrop-blur sm:w-auto`,code:`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-[0.95rem] font-medium`},Y={logoAlt:`Pastoralist Logo`,headingStart:`Pastoralist`,headingMid:`tracks, documents, and cleans up your npm dependency overrides`,headingHighlight:`automatically`,emoji:`👍`,command:`bun add -g pastoralist`,docsSlug:`introduction`,buttonText:`Get Started`},Li=[`idle`,`logoVisible`,`textVisible`,`terminalVisible`,`terminalComplete`,`rainbow`,`done`];function Ri(e,t){let n=Li.indexOf(t);return Li.slice(n).some(t=>e.matches(t))}function zi(){let[e]=(0,y.useState)(Pi),t=(0,y.useMemo)(()=>Fi(e),[e]),[n,i]=v(t),a=(0,y.useRef)(null),o=`/pastoralist`,c=o.endsWith(`/`)?o:`/pastoralist/`,l=Ri(n,`logoVisible`),u=Ri(n,`textVisible`),d=Ri(n,`terminalVisible`),f=Ri(n,`terminalComplete`),p=Ri(n,`rainbow`),m=Ri(n,`done`);return(0,y.useEffect)(()=>{let t=a.current;if(e||!p||!t)return;let n=t.getBoundingClientRect(),r={particleCount:100,spread:70,origin:{x:(n.left+n.width/2)/window.innerWidth,y:(n.top+n.height/2)/window.innerHeight},colors:Ni};U(()=>import(`./confetti.module-75bydEUS.js`),[]).then(({default:e})=>e(r)).catch(()=>void 0)},[p,e]),(0,D.jsxs)(`section`,{id:`hero`,className:J.section,children:[(0,D.jsx)(Vi,{}),(0,D.jsx)(pi,{}),(0,D.jsxs)(`article`,{className:J.article,style:{position:`relative`,zIndex:1},children:[(0,D.jsx)(`header`,{className:J.logoHeader,children:(0,D.jsx)(ui,{maskSrc:`${c}pastoralist-logo.svg`,children:(0,D.jsx)(r.img,{src:`${c}pastoralist-logo.svg`,alt:Y.logoAlt,className:J.logo,initial:!e&&{opacity:0,y:16,scale:.75},animate:l?{opacity:1,y:0,scale:1}:void 0,transition:{duration:.5,ease:Ii}})})}),(0,D.jsxs)(`main`,{className:J.main,children:[(0,D.jsx)(r.aside,{className:J.aside,initial:!e&&{opacity:0,x:-32},animate:d?{opacity:1,x:0}:void 0,transition:{duration:.7,ease:Ii},children:(0,D.jsxs)(`div`,{className:J.terminalFrame,children:[(0,D.jsx)(`div`,{className:`pointer-events-none absolute inset-x-8 bottom-2 h-24 rounded-full bg-gradient-to-r from-sky-500/18 via-cyan-400/10 to-emerald-400/16 blur-3xl`,"aria-hidden":`true`}),(0,D.jsx)(ji,{demos:wi,loop:!1,typingSpeed:18,startAnimation:d,shouldAnimate:!e,minHeight:gi,onComplete:()=>{i({type:`TERMINAL_DONE`}),sessionStorage.setItem(Mi,`true`)}})]})}),(0,D.jsxs)(r.header,{className:J.contentHeader,initial:!e&&{opacity:0,y:32},animate:u?{opacity:1,y:0}:void 0,transition:{duration:.7,ease:Ii},children:[(0,D.jsxs)(`h1`,{className:J.h1,children:[(0,D.jsx)(`span`,{className:`font-bold gradient-text`,children:Y.headingStart}),` `,Y.headingMid,f&&(0,D.jsx)(r.span,{ref:a,className:`inline-block ml-2 ${p?`rainbow-text animate-rainbow-bounce`:`text-glow-shimmer animate-slide-in-right`}`,initial:{opacity:0,x:20},animate:{opacity:1,x:0},transition:{duration:.4,ease:`easeOut`},children:Y.headingHighlight}),m&&(0,D.jsx)(`span`,{className:`inline-block animate-thumbs-up`,children:Y.emoji})]}),(0,D.jsxs)(`nav`,{className:J.nav,children:[(0,D.jsx)(s,{to:`/docs/$slug/`,params:{slug:Y.docsSlug},preload:`intent`,children:(0,D.jsxs)(`button`,{className:`btn btn-lg btn-primary rounded-2xl`,children:[Y.buttonText,(0,D.jsx)(zt,{className:`size-4`})]})}),(0,D.jsxs)(`figure`,{className:J.codeBlock,children:[(0,D.jsx)(`code`,{className:J.code,children:Y.command}),(0,D.jsx)(li,{})]})]})]})]})]})]})}var Bi=`polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 150%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)`;function Vi(){return(0,D.jsxs)(`figure`,{className:`absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl`,"aria-hidden":`true`,children:[(0,D.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] block`,style:{clipPath:Bi}}),(0,D.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(100%)] sm:w-[72.1875rem] block`,style:{clipPath:Bi}})]})}var Hi=[`Tracks override dependencies`,`Documents security fixes with CVE references`,`Cleans up orphaned overrides`,`Works with npm, yarn, pnpm, and bun`],Ui={list:`mt-6 divide-y divide-base-content/10 border-y border-base-content/10 text-base-content/80`,item:`flex items-start gap-3 py-3`,icon:`check-icon mt-0.5`};function Wi({isVisible:e}){return(0,D.jsx)(`ul`,{className:Ui.list,children:Hi.map((t,n)=>(0,D.jsxs)(r.li,{className:Ui.item,initial:{opacity:0,x:-8},animate:e?{opacity:1,x:0}:{},transition:{duration:.3,delay:n*.15,ease:`easeOut`},children:[(0,D.jsx)(r.span,{className:Ui.icon,initial:{opacity:0,scale:.5},animate:e?{opacity:1,scale:1}:{},transition:{duration:.3,delay:n*.15,ease:`easeOut`},children:(0,D.jsx)(Bt,{className:`w-5 h-5`})}),(0,D.jsx)(`span`,{children:t})]},t))})}var Gi=[{id:`cli`,label:`CLI Output`},{id:`json`,label:`package.json`}],Ki=`{
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
}`;function qi({line:e}){let t=`${q.line} ${e.className??``}`,n=e.prefix?(0,D.jsx)(`span`,{className:q.prefix,children:e.prefix}):null,r={__html:e.text};return(0,D.jsxs)(`div`,{className:t,children:[n,(0,D.jsx)(Oi,{line:e}),(0,D.jsx)(`span`,{dangerouslySetInnerHTML:r})]})}function Ji(){let e=Ci[0].lines.map((e,t)=>(0,D.jsx)(qi,{line:e},t));return(0,D.jsx)(`div`,{className:q.content,children:(0,D.jsx)(`div`,{className:`space-y-1`,children:e})})}function Yi({shouldAnimate:e,onComplete:t}){return e?(0,D.jsx)(ji,{demos:Ci,loop:!1,typingSpeed:20,shouldAnimate:!0,onComplete:t,hideHeader:!0}):(0,D.jsx)(Ji,{})}function Xi(){return(0,D.jsx)(`div`,{className:q.content,children:(0,D.jsx)(`pre`,{className:`text-sm leading-relaxed text-base-content`,children:(0,D.jsx)(`code`,{children:Ki})})})}function Zi({shouldAnimate:e=!1,onComplete:t=()=>void 0}){let[n,r]=(0,y.useState)(`cli`),i=n===`cli`?(0,D.jsx)(Yi,{shouldAnimate:e,onComplete:t}):(0,D.jsx)(Xi,{});return(0,D.jsx)(Ti,{className:`${q.window} ${q.windowMaxWidth}`,tabs:Gi,activeTab:n,onTabChange:r,minHeight:`350px`,children:i})}var Qi=new Map,$i=new WeakMap,ea=0,ta;function na(e){return e?$i.has(e)?$i.get(e):(ea+=1,$i.set(e,ea.toString()),$i.get(e)):`0`}function ra(e){return Object.keys(e).sort().filter(t=>e[t]!==void 0).map(t=>`${t}_${t===`root`?na(e.root):e[t]}`).toString()}function ia(e){let t=ra(e),n=Qi.get(t);if(!n){let r=new Map,i,a=new IntersectionObserver(t=>{t.forEach(t=>{let n=t.isIntersecting&&i.some(e=>t.intersectionRatio>=e);e.trackVisibility&&t.isVisible===void 0&&(t.isVisible=n),[...r.get(t.target)??[]].forEach(e=>{e(n,t)})})},e);i=a.thresholds||(Array.isArray(e.threshold)?e.threshold:[e.threshold||0]),n={id:t,observer:a,elements:r},Qi.set(t,n)}return n}function aa(e,t,n={},r=ta){if(window.IntersectionObserver===void 0&&r!==void 0){let i=e.getBoundingClientRect();return t(r,{isIntersecting:r,target:e,intersectionRatio:typeof n.threshold==`number`?n.threshold:0,time:0,boundingClientRect:i,intersectionRect:i,rootBounds:i}),()=>{}}let{id:i,observer:a,elements:o}=ia(n),s=o.get(e)||[];o.has(e)||o.set(e,s),s.push(t),a.observe(e);let c=!1;return function(){c||(c=!0,s.splice(s.indexOf(t),1),s.length===0&&(o.delete(e),a.unobserve(e)),o.size===0&&(a.disconnect(),Qi.delete(i)))}}y.Component;var oa=Reflect.get(y,`useInsertionEffect`),sa=oa??y.useEffect;function ca(e){return e?.startsWith(`19.`)||!1}var la=ca(`19.2.8`);function ua(e,{threshold:t,root:n,rootMargin:r,scrollMargin:i,trackVisibility:a,delay:o,fallbackInView:s,skip:c,triggerOnce:l}){let u=y.useRef(e),d=y.useRef({node:null,stop:void 0,owner:null});return oa||(u.current=e),sa(()=>{u.current=e},[e]),y.useCallback(function e(f){let p=d.current;if(!f&&p.owner!==e)return;if(f===p.node)return p.owner=e,la?p.stop:void 0;let m=p.stop;if(p.stop=void 0,m?.(),!f||c){p.node=null,p.owner=f?e:null;return}p.node=f,p.owner=e;let h,g;function _(){h?.(),p.stop===_&&(p.node=null,p.stop=void 0)}return p.stop=_,h=aa(f,(e,t)=>{u.current(e,t,g),g=e,l&&e&&_()},{threshold:t,root:n,rootMargin:r,scrollMargin:i,trackVisibility:a,delay:o},s),p.stop!==_&&h(),la?p.stop:void 0},[Array.isArray(t)?t.toString():t,n,r,i,a,o,s,c,l])}var da=typeof window>`u`?y.useEffect:y.useLayoutEffect;function fa({threshold:e,delay:t,trackVisibility:n,rootMargin:r,scrollMargin:i,root:a,triggerOnce:o,skip:s,initialInView:c,fallbackInView:l,onChange:u}={}){let d=y.useRef(c),[f,p]=y.useState({inView:!!c,entry:void 0}),m=ua((e,t)=>{let n=d.current;d.current=e,!(n===void 0&&!e)&&(p({inView:e,entry:t}),u?.(e,t))},{threshold:e,root:a,rootMargin:r,scrollMargin:i,trackVisibility:n,delay:t,fallbackInView:l,skip:s,triggerOnce:o}),h=y.useRef({node:null,reset:!1}),g=y.useCallback(function(e){e?(h.current.node=e,h.current.reset=!1):h.current.node&&(h.current.node=null,h.current.reset=!0);let t=m(e);if(t)return()=>{t(),h.current.node===e&&(h.current.node=null,h.current.reset=!0)}},[m]);da(()=>{h.current.reset&&(h.current.reset=!1,!(o||s)&&(p({inView:!!c,entry:void 0}),d.current=c))});let _=[g,f.inView,f.entry];return _.ref=_[0],_.inView=_[1],_.entry=_[2],_}function pa(e={}){let{threshold:t=.1,triggerOnce:n=!0,onChange:r}=e,{ref:i,inView:a}=fa({threshold:t,triggerOnce:n,onChange:r,initialInView:Dt()});return{ref:i,isVisible:a}}var ma=`pastoralist-codeblock-animation-seen`,ha=()=>Dt()?!0:sessionStorage.getItem(ma)===`true`,X={section:`py-16 lg:py-24 bg-base-200/50 border-y border-base-content/10`,article:`lg:flex gap-10 items-center max-w-2xl md:max-w-5xl mx-auto px-4 transition-all duration-700 ease-out`,articleVisible:`opacity-100 translate-y-0`,articleHidden:`opacity-0 translate-y-8`,header:`lg:max-w-md flex flex-col justify-center`,h2:`text-3xl lg:text-4xl font-black`,description:`mt-6 text-lg text-base-content/80`,nav:`flex gap-4 mt-8`,aside:`flex-1 mt-8 lg:mt-0`},ga={headingStart:`Simple`,headingEnd:`Override Tracking`,description:`Pastoralist creates an appendix that documents why each override exists. Track which packages depend on each override, detect security fixes, and clean up stale overrides when they're no longer needed.`,learnMoreSlug:`introduction`,githubHref:`https://github.com/yowainwright/pastoralist`};function _a(){let[e,t]=(0,y.useState)(ha),{ref:n,isVisible:r}=pa(),i=e||r;return(0,D.jsx)(`section`,{id:`features`,className:X.section,children:(0,D.jsxs)(`article`,{ref:n,className:`${X.article} ${i?X.articleVisible:X.articleHidden}`,children:[(0,D.jsxs)(`header`,{className:X.header,children:[(0,D.jsxs)(`h2`,{className:X.h2,children:[(0,D.jsx)(`span`,{className:`gradient-text`,children:ga.headingStart}),` `,ga.headingEnd]}),(0,D.jsx)(`p`,{className:X.description,children:ga.description}),(0,D.jsx)(Wi,{isVisible:i}),(0,D.jsxs)(`nav`,{className:X.nav,children:[(0,D.jsx)(s,{to:`/docs/$slug/`,params:{slug:ga.learnMoreSlug},preload:`intent`,className:`btn btn-lg btn-primary rounded-2xl`,children:`Learn More`}),(0,D.jsx)(`a`,{href:ga.githubHref,className:`btn btn-lg btn-ghost rounded-2xl`,children:`View on GitHub`})]})]}),(0,D.jsx)(`aside`,{className:X.aside,children:(0,D.jsx)(Zi,{shouldAnimate:!e&&r,onComplete:()=>{t(!0),sessionStorage.setItem(ma,`true`)}})})]})})}var Z=[{title:`The Problem`,description:`Overrides exist but nobody knows why. Which packages depend on it?`},{title:`Run Pastoralist`,description:`Pastoralist scans your dependencies and documents your overrides.`},{title:`Automatic Documentation`,description:`Now you know why each override exists, what depends on it, and any associated CVEs.`}],va=[`Undocumented overrides`,`Execute pastoralist`,`Pastoralist manages the rest`],ya=5,Q=[`  "pastoralist": {`,`    "appendix": {`,`      "lodash@4.17.21": {`,`        "dependents": {`,`          "express": "^4.18.0"`,`        },`,`        "ledger": {`,`          "reason": "security",`,`          "cve": "CVE-2020-8203"`,`        }`,`      }`,`    }`,`  }`],ba=44+(ya+Q.length)*16,xa=(ya+Q.length)*16,Sa=`pastoralist`;Q.length;var Ca={base:`step cursor-pointer transition-all duration-200 text-base-content`,active:`step-primary [&::before]:!bg-gradient-to-b [&::before]:!from-blue-400 [&::before]:!to-blue-500 [&::before]:shadow-md [&::before]:shadow-blue-500/25 [&::before]:!text-white [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-29px)] [&::before]:!z-[999] [&::after]:!bg-blue-500`,inactive:`[&::before]:text-base-content [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-32px)] [&::before]:!z-[999] [&::after]:!bg-base-300`},wa={before:`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white [background:linear-gradient(to_bottom,var(--color-red-400),var(--color-red-500))] border-2 border-red-600 shadow-md shadow-red-500/25`,cli:`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white [background:linear-gradient(to_bottom,var(--color-blue-400),var(--color-blue-500))] border-2 border-blue-600 shadow-md shadow-blue-500/25`,after:`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white [background:linear-gradient(to_bottom,var(--color-green-400),var(--color-green-500))] border-2 border-green-600 shadow-md shadow-green-500/25`},Ta=/"([^"]+)":/g,Ea=/: "([^"]+)"/g,Da=[`"pastoralist"`,`"appendix"`,`"lodash@`,`"dependents"`,`"express"`,`"ledger"`,`"reason"`,`"cve"`],Oa=e=>Da.some(t=>e.includes(t)),ka=e=>e.replace(Ta,`<span class="text-primary">"$1"</span>:`).replace(Ea,`: <span class="text-success">"$1"</span>`),Aa=({stepNumber:e,title:t,description:n,visible:r,showEmoji:i,verticalCenter:a})=>r?(0,D.jsx)(`div`,{className:`absolute z-10 w-64 right-4 ${a?`top-1/2 -translate-y-1/2`:`top-12`} animate-pop-in`,children:(0,D.jsxs)(`div`,{className:`bg-base-100/95 backdrop-blur-sm border-2 border-blue-600 rounded-lg shadow-xl shadow-blue-500/15 p-4`,children:[(0,D.jsxs)(`div`,{className:`flex items-center gap-2 mb-1`,children:[(0,D.jsx)(`span`,{className:`flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-b from-blue-400 to-blue-500 border-2 border-blue-600 text-white text-sm font-bold shadow-md shadow-blue-500/25`,children:e}),(0,D.jsx)(`span`,{className:`font-bold text-base-content`,children:t})]}),(0,D.jsxs)(`div`,{className:`text-sm text-base-content/70 ml-8`,children:[n,i&&(0,D.jsx)(`span`,{className:`inline-block ml-1 animate-bounce-once`,children:`⚡`})]})]})}):null,ja=({isActive:e})=>(0,D.jsx)(Ti,{isActive:e,fileName:`package.json`,children:(0,D.jsxs)(`div`,{className:q.contentPadding,style:{height:`auto`},children:[(0,D.jsx)(`div`,{className:`${q.line} text-base-content/50`,children:`{`}),(0,D.jsxs)(`div`,{className:q.line,children:[`  `,(0,D.jsx)(`span`,{className:`text-primary`,children:`"overrides"`}),`: `,`{`]}),(0,D.jsxs)(`div`,{className:q.line,children:[`    `,(0,D.jsx)(`span`,{className:`text-primary`,children:`"lodash"`}),`:`,` `,(0,D.jsx)(`span`,{className:`text-success`,children:`"4.17.21"`})]}),(0,D.jsx)(`div`,{className:q.line,children:`  }`}),(0,D.jsx)(`div`,{className:`${q.line} text-base-content/50`,children:`}`})]})}),Ma=({isActive:e,typedCommand:t,phase:n,showSpinner:r,showSuccess:i})=>{let a=n===`step2`;return(0,D.jsx)(Ti,{isActive:e,children:(0,D.jsxs)(`div`,{className:`${q.contentPadding}`,style:{height:`auto`,padding:`0.75rem 1rem`},children:[(0,D.jsxs)(`div`,{className:q.line,children:[(0,D.jsx)(`span`,{className:q.prefix,children:`$`}),(0,D.jsx)(`span`,{children:t}),a&&(0,D.jsx)(`span`,{className:q.cursor})]}),r&&(0,D.jsxs)(`div`,{className:`${q.line} text-cyan-400`,children:[(0,D.jsx)(`span`,{className:`inline-block animate-spin mr-2`,children:`⠋`}),`Scanning overrides...`]}),i&&(0,D.jsx)(`div`,{className:`${q.line} text-success`,children:`└── The herd is safe! 🐑`})]})})},Na=({line:e,isAdded:t=!1,className:n})=>{let r=t?`terminal-line json-added`:`terminal-line`,i=n?`${r} ${n}`:r;if(!Oa(e))return(0,D.jsx)(`div`,{className:i,children:e});let a=ka(e);return(0,D.jsx)(`div`,{className:i,dangerouslySetInnerHTML:{__html:a}})},Pa=({isActive:e,appendixLines:t})=>{let n=Q.slice(0,t),r=Q.slice(t),i=t>0;return(0,D.jsx)(Ti,{isActive:e,fileName:`package.json`,minHeight:`${ba}px`,children:(0,D.jsxs)(`div`,{className:q.contentPadding,style:{minHeight:`${xa}px`},children:[(0,D.jsx)(`div`,{className:`${q.line} text-base-content/50`,children:`{`}),(0,D.jsxs)(`div`,{className:q.line,children:[`  `,(0,D.jsx)(`span`,{className:`text-primary`,children:`"overrides"`}),`: `,`{`]}),(0,D.jsxs)(`div`,{className:q.line,children:[`    `,(0,D.jsx)(`span`,{className:`text-primary`,children:`"lodash"`}),`:`,` `,(0,D.jsx)(`span`,{className:`text-success`,children:`"4.17.21"`})]}),(0,D.jsxs)(`div`,{className:q.line,children:[`  }`,i&&`,`]}),n.map((e,t)=>(0,D.jsx)(Na,{line:e,isAdded:!0},t)),r.map((e,t)=>(0,D.jsx)(Na,{line:e,isAdded:!0,className:`invisible`},`hidden-${t}`)),(0,D.jsx)(`div`,{className:`${q.line} text-base-content/50`,children:`}`})]})})},Fa=(e,t)=>e===3&&t===`complete`,Ia=(e,t,n)=>e>t||Fa(t,n),La=({activeStep:e,phase:t,onStepClick:n})=>(0,D.jsx)(`ul`,{className:`steps w-full`,children:va.map((r,i)=>{let a=i+1,o=Ia(e,a,t),s=e>=a?Ca.active:Ca.inactive,c=o?`✓`:a;return(0,D.jsx)(`li`,{className:`${Ca.base} ${s}`,onClick:()=>n(a),"data-content":c,children:r},i)})});function Ra(e,t){let[n,r]=(0,y.useState)(`idle`),[i,a]=(0,y.useState)(``),[o,s]=(0,y.useState)(!1),[c,l]=(0,y.useState)(!1),[u,d]=(0,y.useState)(0),[f,p]=(0,y.useState)(0),[m,h]=(0,y.useState)(!1),[g,_]=(0,y.useState)(!1),[v,b]=(0,y.useState)(!1),x=(0,y.useRef)(!1),S=(0,y.useRef)(null),C=(0,y.useRef)(null),w=(0,y.useCallback)(()=>{S.current&&=(clearInterval(S.current),null)},[]),T=(0,y.useCallback)(e=>{let n=e;S.current=setInterval(()=>{n<Q.length?(d(n+1),n++):(w(),r(`complete`),b(!0),t?.(),setTimeout(()=>{h(!0)},100))},25)},[w]),ee=(0,y.useCallback)(()=>{r(`step2`),p(2);let e=0;S.current=setInterval(()=>{e<11?(a(Sa.slice(0,e+1)),e++):(w(),setTimeout(()=>{r(`checking`),s(!0),setTimeout(()=>{s(!1),l(!0),setTimeout(()=>{r(`step3`),p(3),T(0)},200)},350)},60))},10)},[w,T]),te=(0,y.useCallback)(()=>{w(),a(``),s(!1),l(!1),d(0),h(!1)},[w]),E=(0,y.useCallback)(()=>{te(),r(`step1`),p(1),setTimeout(()=>{ee()},400)},[te,ee]),ne=(0,y.useCallback)(()=>{let e=C.current;if(!g||!e)return;_(!1);let{phase:t,typedCommand:n,appendixLines:i}=e;if(C.current=null,t===`step2`&&n.length<11){let e=n.length;S.current=setInterval(()=>{e<11?(a(Sa.slice(0,e+1)),e++):(w(),setTimeout(()=>{r(`checking`),s(!0),setTimeout(()=>{s(!1),l(!0),setTimeout(()=>{r(`step3`),p(3),T(0)},200)},350)},60))},10)}else{if(!(t===`step3`&&i<Q.length))return;T(i)}},[g,w,T]),{ref:re}=fa({threshold:.3,onChange:t=>{t&&e&&(x.current?g&&ne():(x.current=!0,E()))}});(0,y.useEffect)(()=>{!e&&!x.current&&(x.current=!0,r(`complete`),a(Sa),d(Q.length),p(3),b(!0),h(!0),l(!0))},[e]);let D=e=>{w(),C.current={phase:n,typedCommand:i,appendixLines:u},_(!0),b(!1),p(e);let t={1:`step1`,2:`step2`,3:`step3`}[e];t&&r(t)},O=e=>g?f===e:f>=e||v;return{containerRef:re,phase:n,typedCommand:i,showSpinner:o,showSuccess:c,appendixLines:u,activeStep:f,showLightning:m,showAllPopovers:v,isStep1Active:O(1),isStep2Active:O(2),isStep3Active:O(3),handleStepClick:D}}function za({shouldAnimate:e=!0,onComplete:t}){let{containerRef:n,phase:r,typedCommand:i,showSpinner:a,showSuccess:o,appendixLines:s,activeStep:c,showLightning:l,isStep1Active:u,isStep2Active:d,isStep3Active:f,handleStepClick:p}=Ra(e,t);return(0,D.jsxs)(`div`,{ref:n,className:`flex flex-col gap-6`,children:[(0,D.jsx)(La,{activeStep:c,phase:r,onStepClick:p}),(0,D.jsx)(`div`,{className:`h-6 w-px bg-primary/20 mx-auto`}),(0,D.jsxs)(`div`,{className:`grid md:grid-cols-2 gap-6 lg:gap-8`,children:[(0,D.jsxs)(`div`,{className:`flex flex-col gap-4`,children:[(0,D.jsxs)(`div`,{className:`relative flex flex-col`,children:[(0,D.jsx)(Aa,{stepNumber:1,title:Z[0].title,description:Z[0].description,visible:u}),(0,D.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,D.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Undocumented overrides`}),(0,D.jsx)(`span`,{className:wa.before,children:`Before`})]}),(0,D.jsx)(ja,{isActive:u})]}),(0,D.jsxs)(`div`,{className:`relative`,children:[(0,D.jsx)(Aa,{stepNumber:2,title:Z[1].title,description:Z[1].description,visible:d}),(0,D.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,D.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Execute the pastoralist cli`}),(0,D.jsx)(`span`,{className:wa.cli,children:`CLI`})]}),(0,D.jsx)(Ma,{isActive:d,typedCommand:i,phase:r,showSpinner:a,showSuccess:o})]})]}),(0,D.jsxs)(`div`,{className:`relative flex flex-col`,children:[(0,D.jsx)(Aa,{stepNumber:3,title:Z[2].title,description:Z[2].description,visible:f,showEmoji:l,verticalCenter:!0}),(0,D.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,D.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Documented overrides`}),(0,D.jsx)(`span`,{className:wa.after,children:`After`})]}),(0,D.jsx)(Pa,{isActive:f,appendixLines:s})]})]})]})}function Ba(){return(0,D.jsxs)(`div`,{className:`flex flex-col gap-6`,children:[(0,D.jsx)(`ul`,{className:`steps w-full`,children:va.map((e,t)=>(0,D.jsx)(`li`,{className:`step cursor-pointer transition-all duration-200 text-base-content step-primary [&::before]:!bg-gradient-to-b [&::before]:!from-blue-400 [&::before]:!to-blue-500 [&::before]:shadow-md [&::before]:shadow-blue-500/25 [&::before]:!text-white [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-29px)] [&::before]:!z-[999] [&::after]:!bg-blue-500`,"data-content":`✓`,children:e},t))}),(0,D.jsx)(`div`,{className:`h-6 w-px bg-primary/20 mx-auto`}),(0,D.jsxs)(`div`,{className:`grid md:grid-cols-2 gap-6 lg:gap-8`,children:[(0,D.jsxs)(`div`,{className:`flex flex-col gap-4`,children:[(0,D.jsxs)(`div`,{className:`relative flex flex-col`,children:[(0,D.jsx)(Aa,{stepNumber:1,title:Z[0].title,description:Z[0].description,visible:!0}),(0,D.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,D.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Undocumented overrides`}),(0,D.jsx)(`span`,{className:`badge badge-lg text-white bg-gradient-to-b from-red-400 to-red-500 border-2 border-red-600 shadow-md shadow-red-500/25 p-2`,children:`Before`})]}),(0,D.jsx)(ja,{isActive:!0})]}),(0,D.jsxs)(`div`,{className:`relative`,children:[(0,D.jsx)(Aa,{stepNumber:2,title:Z[1].title,description:Z[1].description,visible:!0}),(0,D.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,D.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Execute the pastoralist cli`}),(0,D.jsx)(`span`,{className:`badge badge-lg text-white bg-gradient-to-b from-blue-400 to-blue-500 border-2 border-blue-600 shadow-md shadow-blue-500/25 p-2`,children:`CLI`})]}),(0,D.jsx)(Ma,{isActive:!0,typedCommand:Sa,phase:`complete`,showSpinner:!1,showSuccess:!0})]})]}),(0,D.jsxs)(`div`,{className:`relative flex flex-col`,children:[(0,D.jsx)(Aa,{stepNumber:3,title:Z[2].title,description:Z[2].description,visible:!0,showEmoji:!0,verticalCenter:!0}),(0,D.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,D.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Documented overrides`}),(0,D.jsx)(`span`,{className:`badge badge-lg text-white bg-gradient-to-b from-green-400 to-green-500 border-2 border-green-600 shadow-md shadow-green-500/25 p-2`,children:`After`})]}),(0,D.jsx)(Pa,{isActive:!0,appendixLines:Q.length})]})]})]})}var Va=`pastoralist-transform-animation-seen`,Ha=()=>Dt()?!0:sessionStorage.getItem(Va)===`true`,Ua=()=>sessionStorage.setItem(Va,`true`);function Wa({isStatic:e}){return e?(0,D.jsx)(Ba,{}):(0,D.jsx)(za,{shouldAnimate:!0,onComplete:Ua})}var Ga=`polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 150%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)`,Ka={section:`relative py-16 lg:py-24 overflow-hidden`,article:`max-w-2xl md:max-w-6xl mx-auto px-4`,header:`text-center mb-10 transition-all duration-700 ease-out`,headerVisible:`opacity-100 translate-y-0`,headerHidden:`opacity-0 translate-y-8`,h2:`text-3xl lg:text-4xl font-black text-base-content`,description:`mt-4 text-lg text-base-content/80 max-w-2xl mx-auto`},qa={headingStart:`See the`,headingHighlight:`Transformation`,description:`Pastoralist reads your overrides and creates a detailed appendix documenting why each one exists, who depends on it, and any security context.`};function Ja(){let[e]=(0,y.useState)(Ha),{ref:t,isVisible:n}=pa();return(0,D.jsxs)(`section`,{id:`demo`,className:Ka.section,children:[(0,D.jsx)(Ya,{}),(0,D.jsxs)(`article`,{className:Ka.article,children:[(0,D.jsxs)(`header`,{ref:t,className:`${Ka.header} ${n?Ka.headerVisible:Ka.headerHidden}`,children:[(0,D.jsxs)(`h2`,{className:Ka.h2,children:[qa.headingStart,` `,(0,D.jsx)(`span`,{className:`gradient-text`,children:qa.headingHighlight})]}),(0,D.jsx)(`p`,{className:Ka.description,children:qa.description})]}),(0,D.jsx)(Wa,{isStatic:e})]})]})}function Ya(){return(0,D.jsxs)(`figure`,{className:`absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl`,"aria-hidden":`true`,children:[(0,D.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] block`,style:{clipPath:Ga}}),(0,D.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(100%)] sm:w-[72.1875rem] block`,style:{clipPath:Ga}})]})}var Xa=`get-started`,Za={heading:`Ready to`,headingHighlight:`get started`,command:`bun add -g pastoralist`,buttonText:`Learn More`,docsSlug:`introduction`},$={section:`py-16 lg:py-24 border-t border-base-content/10`,article:`max-w-2xl md:max-w-6xl mx-auto px-4 text-center`,articleVisible:`animate-in fade-in slide-in-from-bottom-4 duration-700`,articleHidden:`opacity-0`,heading:`text-2xl lg:text-3xl font-black text-base-content mb-6`,nav:`flex flex-col justify-center items-center gap-4`,codeBlock:`flex h-12 w-fit items-center gap-3 rounded-2xl border border-base-content/10 bg-base-100/85 px-3 shadow-sm shadow-base-content/5 backdrop-blur`,code:`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-[0.95rem] font-medium`,button:`btn btn-lg btn-primary rounded-2xl`};function Qa({id:e=Xa}){let{ref:t,isVisible:n}=pa(),r=`${$.article} ${n?$.articleVisible:$.articleHidden}`;return(0,D.jsx)(`section`,{id:e,className:$.section,children:(0,D.jsxs)(`article`,{ref:t,className:r,children:[(0,D.jsxs)(`h3`,{className:$.heading,children:[Za.heading,` `,(0,D.jsx)(`span`,{className:`gradient-text`,children:Za.headingHighlight}),`?`]}),(0,D.jsxs)(`nav`,{className:$.nav,children:[(0,D.jsxs)(`figure`,{className:$.codeBlock,children:[(0,D.jsx)(`code`,{className:$.code,children:Za.command}),(0,D.jsx)(li,{})]}),(0,D.jsx)(s,{to:`/docs/$slug/`,params:{slug:Za.docsSlug},preload:`intent`,children:(0,D.jsxs)(`button`,{className:$.button,children:[Za.buttonText,(0,D.jsx)(zt,{className:`size-4`})]})})]})]})})}function $a(){return(0,D.jsxs)(D.Fragment,{children:[(0,D.jsx)(zi,{}),(0,D.jsx)(_a,{}),(0,D.jsx)(Ja,{}),(0,D.jsx)(Qa,{})]})}var eo=d({component:()=>(0,D.jsx)(o,{})}),to=p({getParentRoute:()=>eo,path:`/`,component:()=>(0,D.jsx)(Gn,{children:(0,D.jsx)($a,{})})}),no=p({getParentRoute:()=>eo,path:`/docs/$slug`,component:()=>(0,D.jsx)(Un,{children:(0,D.jsx)($r,{})})}),ro=eo.addChildren([to,no]),io=()=>c({routeTree:ro,basepath:`/pastoralist`,trailingSlash:`always`});function ao(){let e=document.getElementById(`root`);if(!e)throw Error(`Missing root element`);return e}var oo=io(),so=ao(),co=so.dataset.prerendered===`true`,lo=co?(0,D.jsx)(m,{router:oo}):(0,D.jsx)(f,{router:oo});function uo(){return(0,y.useEffect)(()=>Ot(so),[]),(0,D.jsx)(y.StrictMode,{children:(0,D.jsx)(kt,{children:lo})})}var fo=(0,D.jsx)(uo,{});co?(0,A.hydrateRoot)(so,fo):(0,A.createRoot)(so).render(fo);export{U as n,Cr as t};
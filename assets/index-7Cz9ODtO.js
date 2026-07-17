const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/highlighter-DEnE3vq8.js","assets/shiki-L-j4fbjb.js","assets/rolldown-runtime-CNC7AqOf.js","assets/Mermaid-xJpD7Bw_.js","assets/motion-5NLLYCXy.js","assets/chunk-Y2CYZVJY-DsF7k-Jl.js","assets/src-CCXVwcXM.js","assets/chunk-WYO6CB5R-DtaxU3jl.js","assets/chunk-ICXQ74PX-Bd-uJA77.js","assets/dist-BH9bKIvu.js","assets/chunk-VAUOI2AC-CjQGsDp7.js","assets/chunk-ZIRB5QZD-C6fEPe3t.js","assets/chunk-C7G6YPKG-BMtMbALk.js","assets/chunk-OGEWGWER-Dja8zIVR.js","assets/chunk-HOUHSVGY-DRditE-b.js","assets/chunk-Q4XR5HBZ-DsrZztSm.js","assets/chunk-ZGVPDNZ5-ryh4BN0t.js","assets/rough.esm-CSKSodPl.js","assets/chunk-7BUUIJ7U-Bb538aSH.js","assets/chunk-52WLFC77-B2TcbQB9.js","assets/line-CS_d2GbV.js","assets/path-BWPyau1x.js","assets/array-BifhSqXX.js","assets/chunk-FWX5IMBZ-D8iXfKxK.js"])))=>i.map(i=>d[i]);
import{a as e,r as t}from"./rolldown-runtime-CNC7AqOf.js";import{n,r,t as i}from"./motion-5NLLYCXy.js";import{n as a,t as o}from"./react-vendor-CEfYWcR2.js";import{a as s,c,i as l,l as u,n as d,o as f,r as p,s as m,t as h,u as g}from"./router-C1u6H8Eh.js";import{t as _}from"./fuse-WWRhtdKf.js";import{n as v,t as y}from"./state-8U2RuCIR.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var b=e(r(),1),x={};function S(e,t){let n=b.useRef(x);return n.current===x&&(n.current=e(t)),n}var C=typeof document<`u`?b.useLayoutEffect:()=>{},w=[];function T(e){b.useEffect(e,w)}var E=0,ee=class e{static create(){return new e}currentId=E;start(e,t){this.clear(),this.currentId=setTimeout(()=>{this.currentId=E,t()},e)}isStarted(){return this.currentId!==E}clear=()=>{this.currentId!==E&&(clearTimeout(this.currentId),this.currentId=E)};disposeEffect=()=>this.clear};function te(){let e=S(ee.create).current;return T(e.disposeEffect),e}function ne(e,t){let n=[`mouse`,`pen`];return t||n.push(``,void 0),n.includes(e)}function re(e,t){return t!=null&&!ne(t)?0:typeof e==`function`?e():e}function D(e,t,n){let r=re(e,n);return typeof r==`number`?r:r?.[t]}var O=n(),k=b.createContext({hasProvider:!1,timeoutMs:0,delayRef:{current:0},initialDelayRef:{current:0},timeout:new ee,currentIdRef:{current:null},currentContextRef:{current:null}});function ie(e){let{children:t,delay:n,timeoutMs:r=0}=e,i=b.useRef(n),a=b.useRef(n),o=b.useRef(null),s=b.useRef(null),c=te();return C(()=>{if(a.current=n,!o.current){i.current=n;return}i.current={open:D(i.current,`open`),close:D(n,`close`)}},[n,o,i,a]),(0,O.jsx)(k.Provider,{value:b.useMemo(()=>({hasProvider:!0,delayRef:i,initialDelayRef:a,currentIdRef:o,timeoutMs:r,currentContextRef:s,timeout:c}),[r,c]),children:t})}var ae=b.createContext(void 0),A=function(e){let{delay:t,closeDelay:n,timeout:r=400}=e,i=b.useMemo(()=>({delay:t,closeDelay:n}),[t,n]),a=b.useMemo(()=>({open:t,close:n}),[t,n]);return(0,O.jsx)(ae.Provider,{value:i,children:(0,O.jsx)(ie,{delay:a,timeoutMs:r,children:e.children})})},oe=o();function se(e){var t,n,r=``;if(typeof e==`string`||typeof e==`number`)r+=e;else if(typeof e==`object`)if(Array.isArray(e)){var i=e.length;for(t=0;t<i;t++)e[t]&&(n=se(e[t]))&&(r&&(r+=` `),r+=n)}else for(n in e)e[n]&&(r&&(r+=` `),r+=n);return r}function ce(){for(var e,t,n=0,r=``,i=arguments.length;n<i;n++)(e=arguments[n])&&(t=se(e))&&(r&&(r+=` `),r+=t);return r}var le=(e,t)=>{let n=Array(e.length+t.length);for(let t=0;t<e.length;t++)n[t]=e[t];for(let r=0;r<t.length;r++)n[e.length+r]=t[r];return n},j=(e,t)=>({classGroupId:e,validator:t}),M=(e=new Map,t=null,n)=>({nextPart:e,validators:t,classGroupId:n}),ue=`-`,de=[],N=`arbitrary..`,fe=e=>{let t=he(e),{conflictingClassGroups:n,conflictingClassGroupModifiers:r}=e;return{getClassGroupId:e=>{if(e.startsWith(`[`)&&e.endsWith(`]`))return me(e);let n=e.split(ue);return pe(n,+(n[0]===``&&n.length>1),t)},getConflictingClassGroupIds:(e,t)=>{if(t){let t=r[e],i=n[e];return t?i?le(i,t):t:i||de}return n[e]||de}}},pe=(e,t,n)=>{if(e.length-t===0)return n.classGroupId;let r=e[t],i=n.nextPart.get(r);if(i){let n=pe(e,t+1,i);if(n)return n}let a=n.validators;if(a===null)return;let o=t===0?e.join(ue):e.slice(t).join(ue),s=a.length;for(let e=0;e<s;e++){let t=a[e];if(t.validator(o))return t.classGroupId}},me=e=>e.slice(1,-1).indexOf(`:`)===-1?void 0:(()=>{let t=e.slice(1,-1),n=t.indexOf(`:`),r=t.slice(0,n);return r?N+r:void 0})(),he=e=>{let{theme:t,classGroups:n}=e;return ge(n,t)},ge=(e,t)=>{let n=M();for(let r in e){let i=e[r];_e(i,n,r,t)}return n},_e=(e,t,n,r)=>{let i=e.length;for(let a=0;a<i;a++){let i=e[a];ve(i,t,n,r)}},ve=(e,t,n,r)=>{if(typeof e==`string`){ye(e,t,n);return}if(typeof e==`function`){be(e,t,n,r);return}xe(e,t,n,r)},ye=(e,t,n)=>{let r=e===``?t:Se(t,e);r.classGroupId=n},be=(e,t,n,r)=>{if(Ce(e)){_e(e(r),t,n,r);return}t.validators===null&&(t.validators=[]),t.validators.push(j(n,e))},xe=(e,t,n,r)=>{let i=Object.entries(e),a=i.length;for(let e=0;e<a;e++){let[a,o]=i[e];_e(o,Se(t,a),n,r)}},Se=(e,t)=>{let n=e,r=t.split(ue),i=r.length;for(let e=0;e<i;e++){let t=r[e],i=n.nextPart.get(t);i||(i=M(),n.nextPart.set(t,i)),n=i}return n},Ce=e=>`isThemeGetter`in e&&e.isThemeGetter===!0,we=e=>{if(e<1)return{get:()=>void 0,set:()=>{}};let t=0,n=Object.create(null),r=Object.create(null),i=(i,a)=>{n[i]=a,t++,t>e&&(t=0,r=n,n=Object.create(null))};return{get(e){let t=n[e];if(t!==void 0)return t;if((t=r[e])!==void 0)return i(e,t),t},set(e,t){e in n?n[e]=t:i(e,t)}}},Te=`!`,Ee=`:`,De=[],Oe=(e,t,n,r,i)=>({modifiers:e,hasImportantModifier:t,baseClassName:n,maybePostfixModifierPosition:r,isExternal:i}),ke=e=>{let{prefix:t,experimentalParseClassName:n}=e,r=e=>{let t=[],n=0,r=0,i=0,a,o=e.length;for(let s=0;s<o;s++){let o=e[s];if(n===0&&r===0){if(o===Ee){t.push(e.slice(i,s)),i=s+1;continue}if(o===`/`){a=s;continue}}o===`[`?n++:o===`]`?n--:o===`(`?r++:o===`)`&&r--}let s=t.length===0?e:e.slice(i),c=s,l=!1;s.endsWith(Te)?(c=s.slice(0,-1),l=!0):s.startsWith(Te)&&(c=s.slice(1),l=!0);let u=a&&a>i?a-i:void 0;return Oe(t,l,c,u)};if(t){let e=t+Ee,n=r;r=t=>t.startsWith(e)?n(t.slice(e.length)):Oe(De,!1,t,void 0,!0)}if(n){let e=r;r=t=>n({className:t,parseClassName:e})}return r},Ae=e=>{let t=new Map;return e.orderSensitiveModifiers.forEach((e,n)=>{t.set(e,1e6+n)}),e=>{let n=[],r=[];for(let i=0;i<e.length;i++){let a=e[i],o=a[0]===`[`,s=t.has(a);o||s?(r.length>0&&(r.sort(),n.push(...r),r=[]),n.push(a)):r.push(a)}return r.length>0&&(r.sort(),n.push(...r)),n}},je=e=>({cache:we(e.cacheSize),parseClassName:ke(e),sortModifiers:Ae(e),postfixLookupClassGroupIds:Me(e),...fe(e)}),Me=e=>{let t=Object.create(null),n=e.postfixLookupClassGroups;if(n)for(let e=0;e<n.length;e++)t[n[e]]=!0;return t},Ne=/\s+/,Pe=(e,t)=>{let{parseClassName:n,getClassGroupId:r,getConflictingClassGroupIds:i,sortModifiers:a,postfixLookupClassGroupIds:o}=t,s=[],c=e.trim().split(Ne),l=``;for(let e=c.length-1;e>=0;--e){let t=c[e],{isExternal:u,modifiers:d,hasImportantModifier:f,baseClassName:p,maybePostfixModifierPosition:m}=n(t);if(u){l=t+(l.length>0?` `+l:l);continue}let h=!!m,g;if(h){g=r(p.substring(0,m));let e=g&&o[g]?r(p):void 0;e&&e!==g&&(g=e,h=!1)}else g=r(p);if(!g){if(!h){l=t+(l.length>0?` `+l:l);continue}if(g=r(p),!g){l=t+(l.length>0?` `+l:l);continue}h=!1}let _=d.length===0?``:d.length===1?d[0]:a(d).join(`:`),v=f?_+Te:_,y=v+g;if(s.indexOf(y)>-1)continue;s.push(y);let b=i(g,h);for(let e=0;e<b.length;++e){let t=b[e];s.push(v+t)}l=t+(l.length>0?` `+l:l)}return l},Fe=(...e)=>{let t=0,n,r,i=``;for(;t<e.length;)(n=e[t++])&&(r=Ie(n))&&(i&&(i+=` `),i+=r);return i},Ie=e=>{if(typeof e==`string`)return e;let t,n=``;for(let r=0;r<e.length;r++)e[r]&&(t=Ie(e[r]))&&(n&&(n+=` `),n+=t);return n},Le=(e,...t)=>{let n,r,i,a,o=o=>(n=je(t.reduce((e,t)=>t(e),e())),r=n.cache.get,i=n.cache.set,a=s,s(o)),s=e=>{let t=r(e);if(t)return t;let a=Pe(e,n);return i(e,a),a};return a=o,(...e)=>a(Fe(...e))},Re=[],P=e=>{let t=t=>t[e]||Re;return t.isThemeGetter=!0,t},ze=/^\[(?:(\w[\w-]*):)?(.+)\]$/i,Be=/^\((?:(\w[\w-]*):)?(.+)\)$/i,Ve=/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/,He=/^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,Ue=/\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,We=/^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/,Ge=/^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,Ke=/^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,F=e=>Ve.test(e),I=e=>!!e&&!Number.isNaN(Number(e)),L=e=>!!e&&Number.isInteger(Number(e)),qe=e=>e.endsWith(`%`)&&I(e.slice(0,-1)),R=e=>He.test(e),Je=()=>!0,Ye=e=>Ue.test(e)&&!We.test(e),Xe=()=>!1,Ze=e=>Ge.test(e),Qe=e=>Ke.test(e),$e=e=>!z(e)&&!B(e),et=e=>e.startsWith(`@container`)&&(e[10]===`/`&&e[11]!==void 0||e[11]===`s`&&e[16]!==void 0&&e.startsWith(`-size/`,10)||e[11]===`n`&&e[18]!==void 0&&e.startsWith(`-normal/`,10)),tt=e=>V(e,yt,Xe),z=e=>ze.test(e),nt=e=>V(e,bt,Ye),rt=e=>V(e,xt,I),it=e=>V(e,Ct,Je),at=e=>V(e,St,Xe),ot=e=>V(e,_t,Xe),st=e=>V(e,vt,Qe),ct=e=>V(e,wt,Ze),B=e=>Be.test(e),lt=e=>gt(e,bt),ut=e=>gt(e,St),dt=e=>gt(e,_t),ft=e=>gt(e,yt),pt=e=>gt(e,vt),mt=e=>gt(e,wt,!0),ht=e=>gt(e,Ct,!0),V=(e,t,n)=>{let r=ze.exec(e);return r?r[1]?t(r[1]):n(r[2]):!1},gt=(e,t,n=!1)=>{let r=Be.exec(e);return r?r[1]?t(r[1]):n:!1},_t=e=>e===`position`||e===`percentage`,vt=e=>e===`image`||e===`url`,yt=e=>e===`length`||e===`size`||e===`bg-size`,bt=e=>e===`length`,xt=e=>e===`number`,St=e=>e===`family-name`,Ct=e=>e===`number`||e===`weight`,wt=e=>e===`shadow`,Tt=Le(()=>{let e=P(`color`),t=P(`font`),n=P(`text`),r=P(`font-weight`),i=P(`tracking`),a=P(`leading`),o=P(`breakpoint`),s=P(`container`),c=P(`spacing`),l=P(`radius`),u=P(`shadow`),d=P(`inset-shadow`),f=P(`text-shadow`),p=P(`drop-shadow`),m=P(`blur`),h=P(`perspective`),g=P(`aspect`),_=P(`ease`),v=P(`animate`),y=()=>[`auto`,`avoid`,`all`,`avoid-page`,`page`,`left`,`right`,`column`],b=()=>[`center`,`top`,`bottom`,`left`,`right`,`top-left`,`left-top`,`top-right`,`right-top`,`bottom-right`,`right-bottom`,`bottom-left`,`left-bottom`],x=()=>[...b(),B,z],S=()=>[`auto`,`hidden`,`clip`,`visible`,`scroll`],C=()=>[`auto`,`contain`,`none`],w=()=>[B,z,c],T=()=>[F,`full`,`auto`,...w()],E=()=>[L,`none`,`subgrid`,B,z],ee=()=>[`auto`,{span:[`full`,L,B,z]},L,B,z],te=()=>[L,`auto`,B,z],ne=()=>[`auto`,`min`,`max`,`fr`,B,z],re=()=>[`start`,`end`,`center`,`between`,`around`,`evenly`,`stretch`,`baseline`,`center-safe`,`end-safe`],D=()=>[`start`,`end`,`center`,`stretch`,`center-safe`,`end-safe`],O=()=>[`auto`,...w()],k=()=>[F,`auto`,`full`,`dvw`,`dvh`,`lvw`,`lvh`,`svw`,`svh`,`min`,`max`,`fit`,...w()],ie=()=>[F,`screen`,`full`,`dvw`,`lvw`,`svw`,`min`,`max`,`fit`,...w()],ae=()=>[F,`screen`,`full`,`lh`,`dvh`,`lvh`,`svh`,`min`,`max`,`fit`,...w()],A=()=>[e,B,z],oe=()=>[...b(),dt,ot,{position:[B,z]}],se=()=>[`no-repeat`,{repeat:[``,`x`,`y`,`space`,`round`]}],ce=()=>[`auto`,`cover`,`contain`,ft,tt,{size:[B,z]}],le=()=>[qe,lt,nt],j=()=>[``,`none`,`full`,l,B,z],M=()=>[``,I,lt,nt],ue=()=>[`solid`,`dashed`,`dotted`,`double`],de=()=>[`normal`,`multiply`,`screen`,`overlay`,`darken`,`lighten`,`color-dodge`,`color-burn`,`hard-light`,`soft-light`,`difference`,`exclusion`,`hue`,`saturation`,`color`,`luminosity`],N=()=>[I,qe,dt,ot],fe=()=>[``,`none`,m,B,z],pe=()=>[`none`,I,B,z],me=()=>[`none`,I,B,z],he=()=>[I,B,z],ge=()=>[F,`full`,...w()];return{cacheSize:500,theme:{animate:[`spin`,`ping`,`pulse`,`bounce`],aspect:[`video`],blur:[R],breakpoint:[R],color:[Je],container:[R],"drop-shadow":[R],ease:[`in`,`out`,`in-out`],font:[$e],"font-weight":[`thin`,`extralight`,`light`,`normal`,`medium`,`semibold`,`bold`,`extrabold`,`black`],"inset-shadow":[R],leading:[`none`,`tight`,`snug`,`normal`,`relaxed`,`loose`],perspective:[`dramatic`,`near`,`normal`,`midrange`,`distant`,`none`],radius:[R],shadow:[R],spacing:[`px`,I],text:[R],"text-shadow":[R],tracking:[`tighter`,`tight`,`normal`,`wide`,`wider`,`widest`]},classGroups:{aspect:[{aspect:[`auto`,`square`,F,z,B,g]}],container:[`container`],"container-type":[{"@container":[``,`normal`,`size`,B,z]}],"container-named":[et],columns:[{columns:[I,z,B,s]}],"break-after":[{"break-after":y()}],"break-before":[{"break-before":y()}],"break-inside":[{"break-inside":[`auto`,`avoid`,`avoid-page`,`avoid-column`]}],"box-decoration":[{"box-decoration":[`slice`,`clone`]}],box:[{box:[`border`,`content`]}],display:[`block`,`inline-block`,`inline`,`flex`,`inline-flex`,`table`,`inline-table`,`table-caption`,`table-cell`,`table-column`,`table-column-group`,`table-footer-group`,`table-header-group`,`table-row-group`,`table-row`,`flow-root`,`grid`,`inline-grid`,`contents`,`list-item`,`hidden`],sr:[`sr-only`,`not-sr-only`],float:[{float:[`right`,`left`,`none`,`start`,`end`]}],clear:[{clear:[`left`,`right`,`both`,`none`,`start`,`end`]}],isolation:[`isolate`,`isolation-auto`],"object-fit":[{object:[`contain`,`cover`,`fill`,`none`,`scale-down`]}],"object-position":[{object:x()}],overflow:[{overflow:S()}],"overflow-x":[{"overflow-x":S()}],"overflow-y":[{"overflow-y":S()}],overscroll:[{overscroll:C()}],"overscroll-x":[{"overscroll-x":C()}],"overscroll-y":[{"overscroll-y":C()}],position:[`static`,`fixed`,`absolute`,`relative`,`sticky`],inset:[{inset:T()}],"inset-x":[{"inset-x":T()}],"inset-y":[{"inset-y":T()}],start:[{"inset-s":T(),start:T()}],end:[{"inset-e":T(),end:T()}],"inset-bs":[{"inset-bs":T()}],"inset-be":[{"inset-be":T()}],top:[{top:T()}],right:[{right:T()}],bottom:[{bottom:T()}],left:[{left:T()}],visibility:[`visible`,`invisible`,`collapse`],z:[{z:[L,`auto`,B,z]}],basis:[{basis:[F,`full`,`auto`,s,...w()]}],"flex-direction":[{flex:[`row`,`row-reverse`,`col`,`col-reverse`]}],"flex-wrap":[{flex:[`nowrap`,`wrap`,`wrap-reverse`]}],flex:[{flex:[I,F,`auto`,`initial`,`none`,z]}],grow:[{grow:[``,I,B,z]}],shrink:[{shrink:[``,I,B,z]}],order:[{order:[L,`first`,`last`,`none`,B,z]}],"grid-cols":[{"grid-cols":E()}],"col-start-end":[{col:ee()}],"col-start":[{"col-start":te()}],"col-end":[{"col-end":te()}],"grid-rows":[{"grid-rows":E()}],"row-start-end":[{row:ee()}],"row-start":[{"row-start":te()}],"row-end":[{"row-end":te()}],"grid-flow":[{"grid-flow":[`row`,`col`,`dense`,`row-dense`,`col-dense`]}],"auto-cols":[{"auto-cols":ne()}],"auto-rows":[{"auto-rows":ne()}],gap:[{gap:w()}],"gap-x":[{"gap-x":w()}],"gap-y":[{"gap-y":w()}],"justify-content":[{justify:[...re(),`normal`]}],"justify-items":[{"justify-items":[...D(),`normal`]}],"justify-self":[{"justify-self":[`auto`,...D()]}],"align-content":[{content:[`normal`,...re()]}],"align-items":[{items:[...D(),{baseline:[``,`last`]}]}],"align-self":[{self:[`auto`,...D(),{baseline:[``,`last`]}]}],"place-content":[{"place-content":re()}],"place-items":[{"place-items":[...D(),`baseline`]}],"place-self":[{"place-self":[`auto`,...D()]}],p:[{p:w()}],px:[{px:w()}],py:[{py:w()}],ps:[{ps:w()}],pe:[{pe:w()}],pbs:[{pbs:w()}],pbe:[{pbe:w()}],pt:[{pt:w()}],pr:[{pr:w()}],pb:[{pb:w()}],pl:[{pl:w()}],m:[{m:O()}],mx:[{mx:O()}],my:[{my:O()}],ms:[{ms:O()}],me:[{me:O()}],mbs:[{mbs:O()}],mbe:[{mbe:O()}],mt:[{mt:O()}],mr:[{mr:O()}],mb:[{mb:O()}],ml:[{ml:O()}],"space-x":[{"space-x":w()}],"space-x-reverse":[`space-x-reverse`],"space-y":[{"space-y":w()}],"space-y-reverse":[`space-y-reverse`],size:[{size:k()}],"inline-size":[{inline:[`auto`,...ie()]}],"min-inline-size":[{"min-inline":[`auto`,...ie()]}],"max-inline-size":[{"max-inline":[`none`,...ie()]}],"block-size":[{block:[`auto`,...ae()]}],"min-block-size":[{"min-block":[`auto`,...ae()]}],"max-block-size":[{"max-block":[`none`,...ae()]}],w:[{w:[s,`screen`,...k()]}],"min-w":[{"min-w":[s,`screen`,`none`,...k()]}],"max-w":[{"max-w":[s,`screen`,`none`,`prose`,{screen:[o]},...k()]}],h:[{h:[`screen`,`lh`,...k()]}],"min-h":[{"min-h":[`screen`,`lh`,`none`,...k()]}],"max-h":[{"max-h":[`screen`,`lh`,...k()]}],"font-size":[{text:[`base`,n,lt,nt]}],"font-smoothing":[`antialiased`,`subpixel-antialiased`],"font-style":[`italic`,`not-italic`],"font-weight":[{font:[r,ht,it]}],"font-stretch":[{"font-stretch":[`ultra-condensed`,`extra-condensed`,`condensed`,`semi-condensed`,`normal`,`semi-expanded`,`expanded`,`extra-expanded`,`ultra-expanded`,qe,z]}],"font-family":[{font:[ut,at,t]}],"font-features":[{"font-features":[z]}],"fvn-normal":[`normal-nums`],"fvn-ordinal":[`ordinal`],"fvn-slashed-zero":[`slashed-zero`],"fvn-figure":[`lining-nums`,`oldstyle-nums`],"fvn-spacing":[`proportional-nums`,`tabular-nums`],"fvn-fraction":[`diagonal-fractions`,`stacked-fractions`],tracking:[{tracking:[i,B,z]}],"line-clamp":[{"line-clamp":[I,`none`,B,rt]}],leading:[{leading:[a,...w()]}],"list-image":[{"list-image":[`none`,B,z]}],"list-style-position":[{list:[`inside`,`outside`]}],"list-style-type":[{list:[`disc`,`decimal`,`none`,B,z]}],"text-alignment":[{text:[`left`,`center`,`right`,`justify`,`start`,`end`]}],"placeholder-color":[{placeholder:A()}],"text-color":[{text:A()}],"text-decoration":[`underline`,`overline`,`line-through`,`no-underline`],"text-decoration-style":[{decoration:[...ue(),`wavy`]}],"text-decoration-thickness":[{decoration:[I,`from-font`,`auto`,B,nt]}],"text-decoration-color":[{decoration:A()}],"underline-offset":[{"underline-offset":[I,`auto`,B,z]}],"text-transform":[`uppercase`,`lowercase`,`capitalize`,`normal-case`],"text-overflow":[`truncate`,`text-ellipsis`,`text-clip`],"text-wrap":[{text:[`wrap`,`nowrap`,`balance`,`pretty`]}],indent:[{indent:w()}],"tab-size":[{tab:[L,B,z]}],"vertical-align":[{align:[`baseline`,`top`,`middle`,`bottom`,`text-top`,`text-bottom`,`sub`,`super`,B,z]}],whitespace:[{whitespace:[`normal`,`nowrap`,`pre`,`pre-line`,`pre-wrap`,`break-spaces`]}],break:[{break:[`normal`,`words`,`all`,`keep`]}],wrap:[{wrap:[`break-word`,`anywhere`,`normal`]}],hyphens:[{hyphens:[`none`,`manual`,`auto`]}],content:[{content:[`none`,B,z]}],"bg-attachment":[{bg:[`fixed`,`local`,`scroll`]}],"bg-clip":[{"bg-clip":[`border`,`padding`,`content`,`text`]}],"bg-origin":[{"bg-origin":[`border`,`padding`,`content`]}],"bg-position":[{bg:oe()}],"bg-repeat":[{bg:se()}],"bg-size":[{bg:ce()}],"bg-image":[{bg:[`none`,{linear:[{to:[`t`,`tr`,`r`,`br`,`b`,`bl`,`l`,`tl`]},L,B,z],radial:[``,B,z],conic:[L,B,z]},pt,st]}],"bg-color":[{bg:A()}],"gradient-from-pos":[{from:le()}],"gradient-via-pos":[{via:le()}],"gradient-to-pos":[{to:le()}],"gradient-from":[{from:A()}],"gradient-via":[{via:A()}],"gradient-to":[{to:A()}],rounded:[{rounded:j()}],"rounded-s":[{"rounded-s":j()}],"rounded-e":[{"rounded-e":j()}],"rounded-t":[{"rounded-t":j()}],"rounded-r":[{"rounded-r":j()}],"rounded-b":[{"rounded-b":j()}],"rounded-l":[{"rounded-l":j()}],"rounded-ss":[{"rounded-ss":j()}],"rounded-se":[{"rounded-se":j()}],"rounded-ee":[{"rounded-ee":j()}],"rounded-es":[{"rounded-es":j()}],"rounded-tl":[{"rounded-tl":j()}],"rounded-tr":[{"rounded-tr":j()}],"rounded-br":[{"rounded-br":j()}],"rounded-bl":[{"rounded-bl":j()}],"border-w":[{border:M()}],"border-w-x":[{"border-x":M()}],"border-w-y":[{"border-y":M()}],"border-w-s":[{"border-s":M()}],"border-w-e":[{"border-e":M()}],"border-w-bs":[{"border-bs":M()}],"border-w-be":[{"border-be":M()}],"border-w-t":[{"border-t":M()}],"border-w-r":[{"border-r":M()}],"border-w-b":[{"border-b":M()}],"border-w-l":[{"border-l":M()}],"divide-x":[{"divide-x":M()}],"divide-x-reverse":[`divide-x-reverse`],"divide-y":[{"divide-y":M()}],"divide-y-reverse":[`divide-y-reverse`],"border-style":[{border:[...ue(),`hidden`,`none`]}],"divide-style":[{divide:[...ue(),`hidden`,`none`]}],"border-color":[{border:A()}],"border-color-x":[{"border-x":A()}],"border-color-y":[{"border-y":A()}],"border-color-s":[{"border-s":A()}],"border-color-e":[{"border-e":A()}],"border-color-bs":[{"border-bs":A()}],"border-color-be":[{"border-be":A()}],"border-color-t":[{"border-t":A()}],"border-color-r":[{"border-r":A()}],"border-color-b":[{"border-b":A()}],"border-color-l":[{"border-l":A()}],"divide-color":[{divide:A()}],"outline-style":[{outline:[...ue(),`none`,`hidden`]}],"outline-offset":[{"outline-offset":[I,B,z]}],"outline-w":[{outline:[``,I,lt,nt]}],"outline-color":[{outline:A()}],shadow:[{shadow:[``,`none`,u,mt,ct]}],"shadow-color":[{shadow:A()}],"inset-shadow":[{"inset-shadow":[`none`,d,mt,ct]}],"inset-shadow-color":[{"inset-shadow":A()}],"ring-w":[{ring:M()}],"ring-w-inset":[`ring-inset`],"ring-color":[{ring:A()}],"ring-offset-w":[{"ring-offset":[I,nt]}],"ring-offset-color":[{"ring-offset":A()}],"inset-ring-w":[{"inset-ring":M()}],"inset-ring-color":[{"inset-ring":A()}],"text-shadow":[{"text-shadow":[`none`,f,mt,ct]}],"text-shadow-color":[{"text-shadow":A()}],opacity:[{opacity:[I,B,z]}],"mix-blend":[{"mix-blend":[...de(),`plus-darker`,`plus-lighter`]}],"bg-blend":[{"bg-blend":de()}],"mask-clip":[{"mask-clip":[`border`,`padding`,`content`,`fill`,`stroke`,`view`]},`mask-no-clip`],"mask-composite":[{mask:[`add`,`subtract`,`intersect`,`exclude`]}],"mask-image-linear-pos":[{"mask-linear":[I]}],"mask-image-linear-from-pos":[{"mask-linear-from":N()}],"mask-image-linear-to-pos":[{"mask-linear-to":N()}],"mask-image-linear-from-color":[{"mask-linear-from":A()}],"mask-image-linear-to-color":[{"mask-linear-to":A()}],"mask-image-t-from-pos":[{"mask-t-from":N()}],"mask-image-t-to-pos":[{"mask-t-to":N()}],"mask-image-t-from-color":[{"mask-t-from":A()}],"mask-image-t-to-color":[{"mask-t-to":A()}],"mask-image-r-from-pos":[{"mask-r-from":N()}],"mask-image-r-to-pos":[{"mask-r-to":N()}],"mask-image-r-from-color":[{"mask-r-from":A()}],"mask-image-r-to-color":[{"mask-r-to":A()}],"mask-image-b-from-pos":[{"mask-b-from":N()}],"mask-image-b-to-pos":[{"mask-b-to":N()}],"mask-image-b-from-color":[{"mask-b-from":A()}],"mask-image-b-to-color":[{"mask-b-to":A()}],"mask-image-l-from-pos":[{"mask-l-from":N()}],"mask-image-l-to-pos":[{"mask-l-to":N()}],"mask-image-l-from-color":[{"mask-l-from":A()}],"mask-image-l-to-color":[{"mask-l-to":A()}],"mask-image-x-from-pos":[{"mask-x-from":N()}],"mask-image-x-to-pos":[{"mask-x-to":N()}],"mask-image-x-from-color":[{"mask-x-from":A()}],"mask-image-x-to-color":[{"mask-x-to":A()}],"mask-image-y-from-pos":[{"mask-y-from":N()}],"mask-image-y-to-pos":[{"mask-y-to":N()}],"mask-image-y-from-color":[{"mask-y-from":A()}],"mask-image-y-to-color":[{"mask-y-to":A()}],"mask-image-radial":[{"mask-radial":[B,z]}],"mask-image-radial-from-pos":[{"mask-radial-from":N()}],"mask-image-radial-to-pos":[{"mask-radial-to":N()}],"mask-image-radial-from-color":[{"mask-radial-from":A()}],"mask-image-radial-to-color":[{"mask-radial-to":A()}],"mask-image-radial-shape":[{"mask-radial":[`circle`,`ellipse`]}],"mask-image-radial-size":[{"mask-radial":[{closest:[`side`,`corner`],farthest:[`side`,`corner`]}]}],"mask-image-radial-pos":[{"mask-radial-at":b()}],"mask-image-conic-pos":[{"mask-conic":[I]}],"mask-image-conic-from-pos":[{"mask-conic-from":N()}],"mask-image-conic-to-pos":[{"mask-conic-to":N()}],"mask-image-conic-from-color":[{"mask-conic-from":A()}],"mask-image-conic-to-color":[{"mask-conic-to":A()}],"mask-mode":[{mask:[`alpha`,`luminance`,`match`]}],"mask-origin":[{"mask-origin":[`border`,`padding`,`content`,`fill`,`stroke`,`view`]}],"mask-position":[{mask:oe()}],"mask-repeat":[{mask:se()}],"mask-size":[{mask:ce()}],"mask-type":[{"mask-type":[`alpha`,`luminance`]}],"mask-image":[{mask:[`none`,B,z]}],filter:[{filter:[``,`none`,B,z]}],blur:[{blur:fe()}],brightness:[{brightness:[I,B,z]}],contrast:[{contrast:[I,B,z]}],"drop-shadow":[{"drop-shadow":[``,`none`,p,mt,ct]}],"drop-shadow-color":[{"drop-shadow":A()}],grayscale:[{grayscale:[``,I,B,z]}],"hue-rotate":[{"hue-rotate":[I,B,z]}],invert:[{invert:[``,I,B,z]}],saturate:[{saturate:[I,B,z]}],sepia:[{sepia:[``,I,B,z]}],"backdrop-filter":[{"backdrop-filter":[``,`none`,B,z]}],"backdrop-blur":[{"backdrop-blur":fe()}],"backdrop-brightness":[{"backdrop-brightness":[I,B,z]}],"backdrop-contrast":[{"backdrop-contrast":[I,B,z]}],"backdrop-grayscale":[{"backdrop-grayscale":[``,I,B,z]}],"backdrop-hue-rotate":[{"backdrop-hue-rotate":[I,B,z]}],"backdrop-invert":[{"backdrop-invert":[``,I,B,z]}],"backdrop-opacity":[{"backdrop-opacity":[I,B,z]}],"backdrop-saturate":[{"backdrop-saturate":[I,B,z]}],"backdrop-sepia":[{"backdrop-sepia":[``,I,B,z]}],"border-collapse":[{border:[`collapse`,`separate`]}],"border-spacing":[{"border-spacing":w()}],"border-spacing-x":[{"border-spacing-x":w()}],"border-spacing-y":[{"border-spacing-y":w()}],"table-layout":[{table:[`auto`,`fixed`]}],caption:[{caption:[`top`,`bottom`]}],transition:[{transition:[``,`all`,`colors`,`opacity`,`shadow`,`transform`,`none`,B,z]}],"transition-behavior":[{transition:[`normal`,`discrete`]}],duration:[{duration:[I,`initial`,B,z]}],ease:[{ease:[`linear`,`initial`,_,B,z]}],delay:[{delay:[I,B,z]}],animate:[{animate:[`none`,v,B,z]}],backface:[{backface:[`hidden`,`visible`]}],perspective:[{perspective:[h,B,z]}],"perspective-origin":[{"perspective-origin":x()}],rotate:[{rotate:pe()}],"rotate-x":[{"rotate-x":pe()}],"rotate-y":[{"rotate-y":pe()}],"rotate-z":[{"rotate-z":pe()}],scale:[{scale:me()}],"scale-x":[{"scale-x":me()}],"scale-y":[{"scale-y":me()}],"scale-z":[{"scale-z":me()}],"scale-3d":[`scale-3d`],skew:[{skew:he()}],"skew-x":[{"skew-x":he()}],"skew-y":[{"skew-y":he()}],transform:[{transform:[B,z,``,`none`,`gpu`,`cpu`]}],"transform-origin":[{origin:x()}],"transform-style":[{transform:[`3d`,`flat`]}],translate:[{translate:ge()}],"translate-x":[{"translate-x":ge()}],"translate-y":[{"translate-y":ge()}],"translate-z":[{"translate-z":ge()}],"translate-none":[`translate-none`],zoom:[{zoom:[L,B,z]}],accent:[{accent:A()}],appearance:[{appearance:[`none`,`auto`]}],"caret-color":[{caret:A()}],"color-scheme":[{scheme:[`normal`,`dark`,`light`,`light-dark`,`only-dark`,`only-light`]}],cursor:[{cursor:[`auto`,`default`,`pointer`,`wait`,`text`,`move`,`help`,`not-allowed`,`none`,`context-menu`,`progress`,`cell`,`crosshair`,`vertical-text`,`alias`,`copy`,`no-drop`,`grab`,`grabbing`,`all-scroll`,`col-resize`,`row-resize`,`n-resize`,`e-resize`,`s-resize`,`w-resize`,`ne-resize`,`nw-resize`,`se-resize`,`sw-resize`,`ew-resize`,`ns-resize`,`nesw-resize`,`nwse-resize`,`zoom-in`,`zoom-out`,B,z]}],"field-sizing":[{"field-sizing":[`fixed`,`content`]}],"pointer-events":[{"pointer-events":[`auto`,`none`]}],resize:[{resize:[`none`,``,`y`,`x`]}],"scroll-behavior":[{scroll:[`auto`,`smooth`]}],"scrollbar-thumb-color":[{"scrollbar-thumb":A()}],"scrollbar-track-color":[{"scrollbar-track":A()}],"scrollbar-gutter":[{"scrollbar-gutter":[`auto`,`stable`,`both`]}],"scrollbar-w":[{scrollbar:[`auto`,`thin`,`none`]}],"scroll-m":[{"scroll-m":w()}],"scroll-mx":[{"scroll-mx":w()}],"scroll-my":[{"scroll-my":w()}],"scroll-ms":[{"scroll-ms":w()}],"scroll-me":[{"scroll-me":w()}],"scroll-mbs":[{"scroll-mbs":w()}],"scroll-mbe":[{"scroll-mbe":w()}],"scroll-mt":[{"scroll-mt":w()}],"scroll-mr":[{"scroll-mr":w()}],"scroll-mb":[{"scroll-mb":w()}],"scroll-ml":[{"scroll-ml":w()}],"scroll-p":[{"scroll-p":w()}],"scroll-px":[{"scroll-px":w()}],"scroll-py":[{"scroll-py":w()}],"scroll-ps":[{"scroll-ps":w()}],"scroll-pe":[{"scroll-pe":w()}],"scroll-pbs":[{"scroll-pbs":w()}],"scroll-pbe":[{"scroll-pbe":w()}],"scroll-pt":[{"scroll-pt":w()}],"scroll-pr":[{"scroll-pr":w()}],"scroll-pb":[{"scroll-pb":w()}],"scroll-pl":[{"scroll-pl":w()}],"snap-align":[{snap:[`start`,`end`,`center`,`align-none`]}],"snap-stop":[{snap:[`normal`,`always`]}],"snap-type":[{snap:[`none`,`x`,`y`,`both`]}],"snap-strictness":[{snap:[`mandatory`,`proximity`]}],touch:[{touch:[`auto`,`none`,`manipulation`]}],"touch-x":[{"touch-pan":[`x`,`left`,`right`]}],"touch-y":[{"touch-pan":[`y`,`up`,`down`]}],"touch-pz":[`touch-pinch-zoom`],select:[{select:[`none`,`text`,`all`,`auto`]}],"will-change":[{"will-change":[`auto`,`scroll`,`contents`,`transform`,B,z]}],fill:[{fill:[`none`,...A()]}],"stroke-w":[{stroke:[I,lt,nt,rt]}],stroke:[{stroke:[`none`,...A()]}],"forced-color-adjust":[{"forced-color-adjust":[`auto`,`none`]}]},conflictingClassGroups:{"container-named":[`container-type`],overflow:[`overflow-x`,`overflow-y`],overscroll:[`overscroll-x`,`overscroll-y`],inset:[`inset-x`,`inset-y`,`inset-bs`,`inset-be`,`start`,`end`,`top`,`right`,`bottom`,`left`],"inset-x":[`right`,`left`],"inset-y":[`top`,`bottom`],flex:[`basis`,`grow`,`shrink`],gap:[`gap-x`,`gap-y`],p:[`px`,`py`,`ps`,`pe`,`pbs`,`pbe`,`pt`,`pr`,`pb`,`pl`],px:[`pr`,`pl`],py:[`pt`,`pb`],m:[`mx`,`my`,`ms`,`me`,`mbs`,`mbe`,`mt`,`mr`,`mb`,`ml`],mx:[`mr`,`ml`],my:[`mt`,`mb`],size:[`w`,`h`],"font-size":[`leading`],"fvn-normal":[`fvn-ordinal`,`fvn-slashed-zero`,`fvn-figure`,`fvn-spacing`,`fvn-fraction`],"fvn-ordinal":[`fvn-normal`],"fvn-slashed-zero":[`fvn-normal`],"fvn-figure":[`fvn-normal`],"fvn-spacing":[`fvn-normal`],"fvn-fraction":[`fvn-normal`],"line-clamp":[`display`,`overflow`],rounded:[`rounded-s`,`rounded-e`,`rounded-t`,`rounded-r`,`rounded-b`,`rounded-l`,`rounded-ss`,`rounded-se`,`rounded-ee`,`rounded-es`,`rounded-tl`,`rounded-tr`,`rounded-br`,`rounded-bl`],"rounded-s":[`rounded-ss`,`rounded-es`],"rounded-e":[`rounded-se`,`rounded-ee`],"rounded-t":[`rounded-tl`,`rounded-tr`],"rounded-r":[`rounded-tr`,`rounded-br`],"rounded-b":[`rounded-br`,`rounded-bl`],"rounded-l":[`rounded-tl`,`rounded-bl`],"border-spacing":[`border-spacing-x`,`border-spacing-y`],"border-w":[`border-w-x`,`border-w-y`,`border-w-s`,`border-w-e`,`border-w-bs`,`border-w-be`,`border-w-t`,`border-w-r`,`border-w-b`,`border-w-l`],"border-w-x":[`border-w-r`,`border-w-l`],"border-w-y":[`border-w-t`,`border-w-b`],"border-color":[`border-color-x`,`border-color-y`,`border-color-s`,`border-color-e`,`border-color-bs`,`border-color-be`,`border-color-t`,`border-color-r`,`border-color-b`,`border-color-l`],"border-color-x":[`border-color-r`,`border-color-l`],"border-color-y":[`border-color-t`,`border-color-b`],translate:[`translate-x`,`translate-y`,`translate-none`],"translate-none":[`translate`,`translate-x`,`translate-y`,`translate-z`],"scroll-m":[`scroll-mx`,`scroll-my`,`scroll-ms`,`scroll-me`,`scroll-mbs`,`scroll-mbe`,`scroll-mt`,`scroll-mr`,`scroll-mb`,`scroll-ml`],"scroll-mx":[`scroll-mr`,`scroll-ml`],"scroll-my":[`scroll-mt`,`scroll-mb`],"scroll-p":[`scroll-px`,`scroll-py`,`scroll-ps`,`scroll-pe`,`scroll-pbs`,`scroll-pbe`,`scroll-pt`,`scroll-pr`,`scroll-pb`,`scroll-pl`],"scroll-px":[`scroll-pr`,`scroll-pl`],"scroll-py":[`scroll-pt`,`scroll-pb`],touch:[`touch-x`,`touch-y`,`touch-pz`],"touch-x":[`touch`],"touch-y":[`touch`],"touch-pz":[`touch`]},conflictingClassGroupModifiers:{"font-size":[`leading`]},postfixLookupClassGroups:[`container-type`],orderSensitiveModifiers:[`*`,`**`,`after`,`backdrop`,`before`,`details-content`,`file`,`first-letter`,`first-line`,`marker`,`placeholder`,`selection`]}});function Et(...e){return Tt(ce(e))}function Dt(){return typeof document>`u`||document.getElementById(`root`)?.dataset.prerendered===`true`}function Ot(e){delete e.dataset.prerendered}function kt({delay:e=0,...t}){return(0,O.jsx)(A,{"data-slot":`tooltip-provider`,delay:e,...t})}var At=(...e)=>e.filter((e,t,n)=>!!e&&e.trim()!==``&&n.indexOf(e)===t).join(` `).trim(),jt=e=>e.replace(/([a-z0-9])([A-Z])/g,`$1-$2`).toLowerCase(),Mt=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,t,n)=>n?n.toUpperCase():t.toLowerCase()),Nt=e=>{let t=Mt(e);return t.charAt(0).toUpperCase()+t.slice(1)},Pt={xmlns:`http://www.w3.org/2000/svg`,width:24,height:24,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:2,strokeLinecap:`round`,strokeLinejoin:`round`},Ft=e=>{for(let t in e)if(t.startsWith(`aria-`)||t===`role`||t===`title`)return!0;return!1},It=(0,b.createContext)({}),Lt=()=>(0,b.useContext)(It),Rt=(0,b.forwardRef)(({color:e,size:t,strokeWidth:n,absoluteStrokeWidth:r,className:i=``,children:a,iconNode:o,...s},c)=>{let{size:l=24,strokeWidth:u=2,absoluteStrokeWidth:d=!1,color:f=`currentColor`,className:p=``}=Lt()??{},m=r??d?Number(n??u)*24/Number(t??l):n??u;return(0,b.createElement)(`svg`,{ref:c,...Pt,width:t??l??Pt.width,height:t??l??Pt.height,stroke:e??f,strokeWidth:m,className:At(`lucide`,p,i),...!a&&!Ft(s)&&{"aria-hidden":`true`},...s},[...o.map(([e,t])=>(0,b.createElement)(e,t)),...Array.isArray(a)?a:[a]])}),H=(e,t)=>{let n=(0,b.forwardRef)(({className:n,...r},i)=>(0,b.createElement)(Rt,{ref:i,iconNode:t,className:At(`lucide-${jt(Nt(e))}`,`lucide-${e}`,n),...r}));return n.displayName=Nt(e),n},zt=H(`arrow-right`,[[`path`,{d:`M5 12h14`,key:`1ays0h`}],[`path`,{d:`m12 5 7 7-7 7`,key:`xquz4c`}]]),Bt=H(`check`,[[`path`,{d:`M20 6 9 17l-5-5`,key:`1gmf2c`}]]),Vt=H(`chevron-left`,[[`path`,{d:`m15 18-6-6 6-6`,key:`1wnfg3`}]]),Ht=H(`chevron-right`,[[`path`,{d:`m9 18 6-6-6-6`,key:`mthhwq`}]]),Ut=H(`copy`,[[`rect`,{width:`14`,height:`14`,x:`8`,y:`8`,rx:`2`,ry:`2`,key:`17jyea`}],[`path`,{d:`M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2`,key:`zix9uf`}]]),Wt=H(`menu`,[[`path`,{d:`M4 5h16`,key:`1tepv9`}],[`path`,{d:`M4 12h16`,key:`1lakjw`}],[`path`,{d:`M4 19h16`,key:`1djgab`}]]),Gt=H(`moon`,[[`path`,{d:`M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401`,key:`kfwtm`}]]),Kt=H(`search`,[[`path`,{d:`m21 21-4.34-4.34`,key:`14j7rj`}],[`circle`,{cx:`11`,cy:`11`,r:`8`,key:`4ej97u`}]]),qt=H(`sun`,[[`circle`,{cx:`12`,cy:`12`,r:`4`,key:`4exip2`}],[`path`,{d:`M12 2v2`,key:`tus03m`}],[`path`,{d:`M12 20v2`,key:`1lh1kg`}],[`path`,{d:`m4.93 4.93 1.41 1.41`,key:`149t6j`}],[`path`,{d:`m17.66 17.66 1.41 1.41`,key:`ptbguv`}],[`path`,{d:`M2 12h2`,key:`1t8f8n`}],[`path`,{d:`M20 12h2`,key:`1q8mjw`}],[`path`,{d:`m6.34 17.66-1.41 1.41`,key:`1m8zz5`}],[`path`,{d:`m19.07 4.93-1.41 1.41`,key:`1shlcs`}]]),Jt=H(`Github`,[[`path`,{d:`M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4`,key:`tonef`}],[`path`,{d:`M9 18c-4.51 2-5-2-7-2`,key:`9comsn`}]]),Yt=`/pastoralist`,Xt=Yt.endsWith(`/`)?Yt:`/pastoralist/`;function Zt(){return(0,O.jsxs)(`footer`,{className:`w-full px-4 sm:px-6 md:px-10 xl:px-28 py-6 sm:py-7 border-t border-base-content/10 flex flex-col gap-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center`,children:[(0,O.jsx)(`div`,{className:`flex items-center justify-center sm:justify-start gap-2 order-3 sm:order-1`,children:(0,O.jsxs)(`p`,{className:`text-sm sm:text-base text-center sm:text-left`,children:[`Copyright © `,new Date().getFullYear(),` - All rights reserved`]})}),(0,O.jsx)(`div`,{className:`flex items-center justify-center gap-2 order-1 sm:order-2`,children:(0,O.jsx)(c,{to:`/`,className:`hover:opacity-80 transition-opacity`,children:(0,O.jsx)(`img`,{src:`${Xt}pastoralist-logo.svg`,alt:`Pastoralist Logo`,className:`h-12 w-12`})})}),(0,O.jsx)(`nav`,{className:`flex justify-center sm:justify-end order-2 sm:order-3`,children:(0,O.jsx)(`div`,{className:`grid grid-flow-col gap-4`,children:(0,O.jsx)(`a`,{className:`btn btn-ghost btn-circle flex items-center justify-center`,href:`https://github.com/yowainwright/pastoralist`,"aria-label":`GitHub`,target:`_blank`,rel:`noopener noreferrer`,children:(0,O.jsx)(Jt,{className:`h-5 w-5`})})})})]})}function Qt(){let[e,t]=(0,b.useState)(()=>{if(typeof window>`u`)return`lofi`;let e=localStorage.getItem(`theme`);return e===`lofi`||e===`night`?e:window.matchMedia(`(prefers-color-scheme: dark)`).matches?`night`:`lofi`});return(0,b.useEffect)(()=>{document.documentElement.setAttribute(`data-theme`,e),localStorage.setItem(`theme`,e)},[e]),{theme:e,setTheme:t,toggle:()=>t(e=>e===`lofi`?`night`:`lofi`)}}var $t=t({default:()=>tn});function en(e){let t={code:`code`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)(t.h2,{id:`nested-overrides-transitive-dependencies`,children:`Nested Overrides (Transitive Dependencies)`}),`
`,(0,O.jsx)(t.p,{children:`Pastoralist supports npm's nested override syntax for overriding transitive dependencies (dependencies of dependencies).`}),`
`,(0,O.jsx)(t.h3,{id:`how-it-works`,children:`How It Works`}),`
`,(0,O.jsx)(t.p,{children:`When you need to override a transitive dependency, you can use nested overrides:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "dependencies": {
    "pg": "^8.13.1"
  },
  "overrides": {
    "pg": {
      "pg-types": "^4.0.1"
    }
  }
}
`})}),`
`,(0,O.jsxs)(t.p,{children:[`This tells npm to use `,(0,O.jsx)(t.code,{children:`pg-types@^4.0.1`}),` whenever it's required by the `,(0,O.jsx)(t.code,{children:`pg`}),` package, regardless of what version `,(0,O.jsx)(t.code,{children:`pg`}),` actually specifies.`]}),`
`,(0,O.jsx)(t.h3,{id:`multiple-nested-overrides`,children:`Multiple Nested Overrides`}),`
`,(0,O.jsx)(t.p,{children:`You can override multiple transitive dependencies:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsx)(t.h3,{id:`tracking-in-appendix`,children:`Tracking in Appendix`}),`
`,(0,O.jsxs)(t.p,{children:[`Nested overrides are tracked with a special notation in the appendix. Each entry
still gets a `,(0,O.jsx)(t.code,{children:`ledger`}),` recording when it was added:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsx)(t.h3,{id:`workspace-support`,children:`Workspace Support`}),`
`,(0,O.jsxs)(t.p,{children:[`In monorepos, nested overrides in workspace packages are also tracked. For example,
`,(0,O.jsx)(t.code,{children:`packages/app/package.json`}),` might contain:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "overrides": {
    "pg": {
      "pg-types": "^4.0.1"
    }
  }
}
`})}),`
`,(0,O.jsxs)(t.p,{children:[`Pastoralist will detect and manage these nested overrides across all workspace packages when using the `,(0,O.jsx)(t.code,{children:`--depPaths`}),` option.`]}),`
`,(0,O.jsx)(t.h2,{id:`patch-support`,children:`Patch Support`}),`
`,(0,O.jsxs)(t.p,{children:[`Pastoralist automatically detects and tracks patches created by tools like `,(0,O.jsx)(t.code,{children:`patch-package`}),`.`]}),`
`,(0,O.jsx)(t.h3,{id:`how-it-works-1`,children:`How It Works`}),`
`,(0,O.jsxs)(t.p,{children:[`When you have patches in your `,(0,O.jsx)(t.code,{children:`patches/`}),` directory:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{children:`patches/
├── lodash+4.17.21.patch
├── express+4.18.0.patch
└── react+18.2.0.patch
`})}),`
`,(0,O.jsx)(t.p,{children:`Pastoralist will track them in the appendix:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsx)(t.h3,{id:`unused-patch-detection`,children:`Unused Patch Detection`}),`
`,(0,O.jsx)(t.p,{children:`When a dependency is removed, pastoralist alerts you:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{children:`🐑 Found 2 potentially unused patch files:
  - patches/old-package+1.0.0.patch
  - patches/removed-dep+2.0.0.patch
Consider removing these patches if the packages are no longer used.
`})}),`
`,(0,O.jsx)(`a`,{href:`https://stackblitz.com/fork/github/yowainwright/pastoralist/tree/main/tests/sandboxes/patches?title=Pastoralist%20Patches&file=README.md&startScript=demo&view=editor`,target:`_blank`,rel:`noopener noreferrer`,children:(0,O.jsx)(`img`,{src:`https://developer.stackblitz.com/img/open_in_stackblitz.svg`,alt:`Open in StackBlitz`})}),`
`,(0,O.jsx)(t.h2,{id:`peerdependencies-support`,children:`PeerDependencies Support`}),`
`,(0,O.jsxs)(t.p,{children:[`Pastoralist considers `,(0,O.jsx)(t.code,{children:`peerDependencies`}),` when tracking override usage.`]}),`
`,(0,O.jsx)(t.h3,{id:`example`,children:`Example`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "peerDependencies": {
    "react": "^17.0.0 || ^18.0.0"
  },
  "overrides": {
    "react": "18.2.0"
  }
}
`})}),`
`,(0,O.jsx)(t.p,{children:`The appendix will reflect peer dependency requirements:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsx)(t.h2,{id:`smart-cleanup`,children:`Smart Cleanup`}),`
`,(0,O.jsx)(t.p,{children:`Pastoralist identifies overrides that are no longer needed and can remove them
when you explicitly opt in.`}),`
`,(0,O.jsxs)(t.h3,{id:`removal-with---remove-unused`,children:[`Removal with `,(0,O.jsx)(t.code,{children:`--remove-unused`})]}),`
`,(0,O.jsx)(t.p,{children:`When a dependency is updated and no longer needs an override:`}),`
`,(0,O.jsx)(t.p,{children:(0,O.jsx)(t.strong,{children:`Before:`})}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "dependencies": {
    "lodash": "^4.17.0"
  },
  "overrides": {
    "lodash": "4.17.21"
  }
}
`})}),`
`,(0,O.jsx)(t.p,{children:(0,O.jsxs)(t.strong,{children:[`After updating lodash to 4.17.21 and running `,(0,O.jsx)(t.code,{children:`pastoralist --remove-unused`}),`:`]})}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "dependencies": {
    "lodash": "^4.17.21"
  },
  "overrides": {}
}
`})}),`
`,(0,O.jsx)(`a`,{href:`https://stackblitz.com/fork/github/yowainwright/pastoralist/tree/main/tests/sandboxes/cleanup?title=Pastoralist%20Cleanup&file=README.md&startScript=demo&view=editor`,target:`_blank`,rel:`noopener noreferrer`,children:(0,O.jsx)(`img`,{src:`https://developer.stackblitz.com/img/open_in_stackblitz.svg`,alt:`Open in StackBlitz`})}),`
`,(0,O.jsx)(t.h3,{id:`unused-override-detection`,children:`Unused Override Detection`}),`
`,(0,O.jsxs)(t.p,{children:[`When an override exists but no package in your project depends on it, Pastoralist labels it as `,(0,O.jsx)(t.code,{children:`(unused override)`}),` in the appendix:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsx)(t.p,{children:`Pastoralist displays a notice when unused overrides are detected:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{children:`|  1 unused override detected. Run with --remove-unused to clean up.  |
`})}),`
`,(0,O.jsxs)(t.p,{children:[`To remove them, run with the `,(0,O.jsx)(t.code,{children:`--remove-unused`}),` flag:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`pastoralist --remove-unused
`})}),`
`,(0,O.jsxs)(t.p,{children:[`This removes both the override from `,(0,O.jsx)(t.code,{children:`overrides`}),` and its entry from the appendix.`]}),`
`,(0,O.jsx)(t.h3,{id:`protecting-overrides-from-removal`,children:`Protecting Overrides from Removal`}),`
`,(0,O.jsxs)(t.p,{children:[`Set `,(0,O.jsx)(t.code,{children:`keep: true`}),` on a ledger entry to prevent `,(0,O.jsx)(t.code,{children:`--remove-unused`}),` from ever removing it:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "lodash@4.17.21": {
    "ledger": {
      "addedDate": "2026-05-30T00:00:00.000Z",
      "keep": true
    }
  }
}
`})}),`
`,(0,O.jsxs)(t.p,{children:[`For time- or version-bounded protection, use a `,(0,O.jsx)(t.code,{children:`KeepConstraint`}),`:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsxs)(t.p,{children:[`Once the condition is met, `,(0,O.jsx)(t.code,{children:`--remove-unused`}),` can treat the override as removable
again.`]}),`
`,(0,O.jsx)(t.h3,{id:`transitive-dependency-tracking`,children:`Transitive Dependency Tracking`}),`
`,(0,O.jsx)(t.p,{children:`Pastoralist tracks overrides needed by transitive dependencies:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsx)(t.h2,{id:`fuzzy-version-matching`,children:`Fuzzy Version Matching`}),`
`,(0,O.jsx)(t.p,{children:`Pastoralist uses version-range matching to determine if overrides are needed.`}),`
`,(0,O.jsx)(t.h3,{id:`how-it-works-2`,children:`How It Works`}),`
`,(0,O.jsx)(t.p,{children:`Given these dependencies:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "dependencies": {
    "express": "^4.18.0"
  }
}
`})}),`
`,(0,O.jsx)(t.p,{children:`And this override:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "overrides": {
    "express": "4.18.2"
  }
}
`})}),`
`,(0,O.jsxs)(t.p,{children:[`Pastoralist understands that `,(0,O.jsx)(t.code,{children:`^4.18.0`}),` could resolve to `,(0,O.jsx)(t.code,{children:`4.18.2`}),` naturally, so the override might not be necessary unless it's fixing a specific issue.`]}),`
`,(0,O.jsx)(t.h2,{id:`appendix-cleanup`,children:`Appendix Cleanup`}),`
`,(0,O.jsxs)(t.p,{children:[`Pastoralist keeps appendix entries while an override is still tracked. When you
run with `,(0,O.jsx)(t.code,{children:`--remove-unused`}),`, it removes both the override and the matching
appendix entry.`]}),`
`,(0,O.jsx)(t.h3,{id:`example-scenario`,children:`Example Scenario`}),`
`,(0,O.jsxs)(t.ol,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`Initial state`}),`: Override with appendix`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`Dependency removed`}),`: Pastoralist reports the override as unused`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`Cleanup run`}),`: `,(0,O.jsx)(t.code,{children:`--remove-unused`}),` removes the override and appendix entry`]}),`
`]}),`
`,(0,O.jsxs)(t.p,{children:[`Use ledger `,(0,O.jsx)(t.code,{children:`reason`}),` and `,(0,O.jsx)(t.code,{children:`keep`}),` fields for override decisions that should stay
reviewable until a specific cleanup condition is met.`]}),`
`,(0,O.jsx)(t.h2,{id:`multi-format-support`,children:`Multi-Format Support`}),`
`,(0,O.jsx)(t.p,{children:`Pastoralist reads the override field your package manager already uses:`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`npm and Bun`}),`: `,(0,O.jsx)(t.code,{children:`overrides`})]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`pnpm`}),`: `,(0,O.jsx)(t.code,{children:`pnpm.overrides`})]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`Yarn`}),`: `,(0,O.jsx)(t.code,{children:`resolutions`})]}),`
`]}),`
`,(0,O.jsx)(t.p,{children:`When it writes changes, it preserves the existing override field when one is
present. If a security fix creates the first override field in a project,
Pastoralist chooses the field that matches the detected package manager.`}),`
`,(0,O.jsx)(t.h3,{id:`format-example`,children:`Format Example`}),`
`,(0,O.jsx)(t.p,{children:`Yarn resolutions:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "resolutions": {
    "package-a": "1.0.0",
    "**/package-b": "2.0.0"
  }
}
`})}),`
`,(0,O.jsx)(t.p,{children:`The equivalent npm or Bun override shape:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "overrides": {
    "package-a": "1.0.0",
    "package-b": "2.0.0"
  }
}
`})}),`
`,(0,O.jsx)(t.h2,{id:`debug-mode-insights`,children:`Debug Mode Insights`}),`
`,(0,O.jsxs)(t.p,{children:[`Debug mode (`,(0,O.jsx)(t.code,{children:`--debug`}),`) provides detailed information:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{children:`🐑 pastoralist checking herd...
[DEBUG] Reading package.json from /path/to/package.json
[DEBUG] Found 3 overrides
[DEBUG] Analyzing dependency tree...
[DEBUG] lodash@4.17.21 required by:
  - express@4.18.0 (wants lodash@^4.17.0)
  - custom-utils@1.0.0 (wants lodash@~4.17.0)
[DEBUG] Writing updated package.json
✅ pastoralist the herd is safe!
`})}),`
`,(0,O.jsx)(t.h2,{id:`integration-with-other-tools`,children:`Integration with Other Tools`}),`
`,(0,O.jsx)(t.h3,{id:`patch-package`,children:`patch-package`}),`
`,(0,O.jsxs)(t.p,{children:[`Pastoralist complements `,(0,O.jsx)(t.code,{children:`patch-package`}),` by tracking which overrides have associated patches:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Apply a patch
npx patch-package lodash

# Run pastoralist to update tracking
npx pastoralist
`})}),`
`,(0,O.jsx)(t.h3,{id:`npm-check-updates`,children:`npm-check-updates`}),`
`,(0,O.jsxs)(t.p,{children:[`Use with `,(0,O.jsx)(t.code,{children:`npm-check-updates`}),` to manage both regular updates and overrides:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Update dependencies
npx npm-check-updates -u

# Update override tracking
npx pastoralist
`})}),`
`,(0,O.jsx)(t.h3,{id:`renovatedependabot`,children:`Renovate/Dependabot`}),`
`,(0,O.jsx)(t.p,{children:`Configure automated tools to run pastoralist after updates:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "postUpgradeTasks": {
    "commands": ["npm install", "npx pastoralist"],
    "fileFilters": ["package.json"]
  }
}
`})}),`
`,(0,O.jsx)(t.h2,{id:`custom-workflows`,children:`Custom Workflows`}),`
`,(0,O.jsx)(t.h3,{id:`override-policies`,children:`Override Policies`}),`
`,(0,O.jsx)(t.p,{children:`Create policies for when overrides should be used:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-javascript`,children:`// scripts/check-override-policy.js
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
`})}),`
`,(0,O.jsx)(t.h3,{id:`appendix-analysis`,children:`Appendix Analysis`}),`
`,(0,O.jsx)(t.p,{children:`Extract insights from the appendix:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-javascript`,children:`const pkg = require("./package.json");
const appendix = pkg.pastoralist?.appendix || {};

// Find overrides with most dependents
const overrideImpact = Object.entries(appendix)
  .map(([override, info]) => ({
    override,
    dependentCount: Object.keys(info.dependents || {}).length,
  }))
  .sort((a, b) => b.dependentCount - a.dependentCount);

console.log("Highest impact overrides:", overrideImpact.slice(0, 5));
`})}),`
`,(0,O.jsx)(t.h2,{id:`best-practices`,children:`Best Practices`}),`
`,(0,O.jsxs)(t.ol,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`Regular Updates`}),`: Run pastoralist on install, scheduled CI, or dependency-update PRs`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`Review Patches`}),`: Check for upstream fixes when dependencies update`]}),`
`]})]})}function tn(e={}){let{wrapper:t}=e.components||{};return t?(0,O.jsx)(t,{...e,children:(0,O.jsx)(en,{...e})}):en(e)}var nn=t({default:()=>an});function rn(e){let t={a:`a`,code:`code`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)(t.p,{children:`Pastoralist provides both a CLI interface and a Node.js API for programmatic usage.`}),`
`,(0,O.jsxs)(t.p,{children:[`:::tip[Configuration Files]
Most CLI options can be configured using config files. See the `,(0,O.jsx)(t.a,{href:`/docs/configuration`,children:`Configuration`}),` documentation for details on using `,(0,O.jsx)(t.code,{children:`.pastoralistrc`}),`, `,(0,O.jsx)(t.code,{children:`pastoralist.config.js`}),`, or `,(0,O.jsx)(t.code,{children:`package.json`}),` for persistent settings.
:::`]}),`
`,(0,O.jsx)(t.h2,{id:`cli`,children:`CLI`}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist`,children:(0,O.jsx)(t.code,{children:`pastoralist`})}),`
`,(0,O.jsx)(t.p,{children:`Run pastoralist on the current directory's package.json.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist
`})}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist-doctor`,children:(0,O.jsx)(t.code,{children:`pastoralist doctor`})}),`
`,(0,O.jsxs)(t.p,{children:[`Run a read-only setup and override health check. This command enables dry-run
summary mode and does not modify `,(0,O.jsx)(t.code,{children:`package.json`}),`.`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist doctor
`})}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist-onboard`,children:(0,O.jsx)(t.code,{children:`pastoralist onboard`})}),`
`,(0,O.jsx)(t.p,{children:`Print a first-run onboarding checklist with initial local usage, agent setup,
and GitHub Action setup.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist onboard
`})}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist---path-path`,children:(0,O.jsx)(t.code,{children:`pastoralist --path <path>`})}),`
`,(0,O.jsx)(t.p,{children:`Run pastoralist on a specific package.json file.`}),`
`,(0,O.jsx)(t.p,{children:(0,O.jsx)(t.strong,{children:`params:`})}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`<path>`}),`: path to a package.json file`]}),`
`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Run on a specific package
npx pastoralist --path packages/app/package.json

# Run on a nested project
npx pastoralist --path ./nested/project/package.json
`})}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist---deppaths-paths`,children:(0,O.jsx)(t.code,{children:`pastoralist --depPaths [paths...]`})}),`
`,(0,O.jsx)(t.p,{children:`Run pastoralist on multiple package.json files using glob patterns.`}),`
`,(0,O.jsx)(t.p,{children:(0,O.jsx)(t.strong,{children:`params:`})}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`[paths...]`}),`: array of glob patterns`]}),`
`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Run on all packages in monorepo
npx pastoralist --depPaths "packages/*/package.json"

# Run on multiple directories
npx pastoralist --depPaths "packages/*/package.json" "apps/*/package.json"
`})}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist---ignore-patterns`,children:(0,O.jsx)(t.code,{children:`pastoralist --ignore [patterns...]`})}),`
`,(0,O.jsx)(t.p,{children:`Exclude files matching glob patterns.`}),`
`,(0,O.jsx)(t.p,{children:(0,O.jsx)(t.strong,{children:`params:`})}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`[patterns...]`}),`: array of glob patterns to ignore`]}),`
`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Ignore test directories
npx pastoralist --ignore "**/test/**" "**/dist/**"

# Ignore specific packages
npx pastoralist --depPaths "**/*package.json" --ignore "**/node_modules/**" "**/legacy/**"
`})}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist---root-root`,children:(0,O.jsx)(t.code,{children:`pastoralist --root <root>`})}),`
`,(0,O.jsx)(t.p,{children:`Set the root directory for all operations.`}),`
`,(0,O.jsx)(t.p,{children:(0,O.jsx)(t.strong,{children:`params:`})}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`<root>`}),`: root directory path`]}),`
`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Run from different directory
npx pastoralist --root /path/to/project

# Combine with other options
npx pastoralist --root ../my-project --path package.json
`})}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist-init`,children:(0,O.jsx)(t.code,{children:`pastoralist init`})}),`
`,(0,O.jsx)(t.p,{children:`Initialize configuration with the guided setup. The wizard can configure
workspace paths, security scanning, and where the configuration should be saved.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Start interactive setup
npx pastoralist init
`})}),`
`,(0,O.jsx)(t.p,{children:`When run, this will:`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[`Detect `,(0,O.jsx)(t.code,{children:`workspaces`}),` entries from `,(0,O.jsx)(t.code,{children:`package.json`})]}),`
`,(0,O.jsxs)(t.li,{children:[`Prompt for `,(0,O.jsx)(t.code,{children:`depPaths: "workspace"`}),` or custom package globs`]}),`
`,(0,O.jsx)(t.li,{children:`Offer security provider and severity threshold setup`}),`
`,(0,O.jsxs)(t.li,{children:[`Save configuration to `,(0,O.jsx)(t.code,{children:`package.json`}),` or a supported config file`]}),`
`]}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist---init-agent-skill`,children:(0,O.jsx)(t.code,{children:`pastoralist --init agent-skill`})}),`
`,(0,O.jsxs)(t.p,{children:[`Install the bundled Pastoralist agent skill into `,(0,O.jsx)(t.code,{children:`.agents/skills/pastoralist`}),`.`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --init agent-skill
`})}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.code,{children:`pastoralist init agent-skill`}),` is also supported.`]}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist---interactive`,children:(0,O.jsx)(t.code,{children:`pastoralist --interactive`})}),`
`,(0,O.jsxs)(t.p,{children:[`Review security fixes interactively. Use this with `,(0,O.jsx)(t.code,{children:`--checkSecurity`}),` when you
want to approve fixes instead of applying everything with `,(0,O.jsx)(t.code,{children:`--forceSecurityRefactor`}),`.`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Review security fixes before applying them
npx pastoralist --checkSecurity --interactive
`})}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist---debug`,children:(0,O.jsx)(t.code,{children:`pastoralist --debug`})}),`
`,(0,O.jsx)(t.p,{children:`Enable detailed debug output.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --debug
`})}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist---dry-run`,children:(0,O.jsx)(t.code,{children:`pastoralist --dry-run`})}),`
`,(0,O.jsx)(t.p,{children:`Preview changes without modifying package.json.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --dry-run
`})}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist---outputformat-json`,children:(0,O.jsx)(t.code,{children:`pastoralist --outputFormat json`})}),`
`,(0,O.jsx)(t.p,{children:`Return machine-readable output for CI or custom tooling.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --summary --outputFormat json
`})}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist---quiet`,children:(0,O.jsx)(t.code,{children:`pastoralist --quiet`})}),`
`,(0,O.jsx)(t.p,{children:`Quiet mode for CI pipelines. Outputs minimal text and uses exit codes.`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsx)(t.li,{children:`Exit 0: No vulnerabilities found`}),`
`,(0,O.jsx)(t.li,{children:`Exit 1: Vulnerabilities detected`}),`
`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --quiet --checkSecurity
`})}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist---summary`,children:(0,O.jsx)(t.code,{children:`pastoralist --summary`})}),`
`,(0,O.jsx)(t.p,{children:`Display metrics table after run.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --summary
`})}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist---setup-hook`,children:(0,O.jsx)(t.code,{children:`pastoralist --setup-hook`})}),`
`,(0,O.jsx)(t.p,{children:`Add pastoralist to your postinstall script automatically.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --setup-hook
`})}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist-setup-local-dev`,children:(0,O.jsx)(t.code,{children:`pastoralist-setup-local-dev`})}),`
`,(0,O.jsx)(t.p,{children:`Set up local agent config, selected skills, and selected local hooks.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx -p pastoralist pastoralist-setup-local-dev --dry-run
npx -p pastoralist pastoralist-setup-local-dev --skills all --hooks git,postinstall
`})}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist---remove-unused`,children:(0,O.jsx)(t.code,{children:`pastoralist --remove-unused`})}),`
`,(0,O.jsx)(t.p,{children:`Remove overrides that no package in your project depends on. When Pastoralist detects unused overrides during a run, it displays a notice suggesting this flag.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --remove-unused
`})}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist---checksecurity`,children:(0,O.jsx)(t.code,{children:`pastoralist --checkSecurity`})}),`
`,(0,O.jsx)(t.p,{children:`Enable security vulnerability scanning.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity
`})}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist---securityprovider-provider`,children:(0,O.jsx)(t.code,{children:`pastoralist --securityProvider <provider...>`})}),`
`,(0,O.jsxs)(t.p,{children:[`Choose one or more security providers. Supported values are `,(0,O.jsx)(t.code,{children:`osv`}),`, `,(0,O.jsx)(t.code,{children:`github`}),`,
`,(0,O.jsx)(t.code,{children:`npm`}),`, `,(0,O.jsx)(t.code,{children:`snyk`}),`, `,(0,O.jsx)(t.code,{children:`socket`}),`, and `,(0,O.jsx)(t.code,{children:`spektion`}),`.`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity --securityProvider osv npm
`})}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist---forcesecurityrefactor`,children:(0,O.jsx)(t.code,{children:`pastoralist --forceSecurityRefactor`})}),`
`,(0,O.jsx)(t.p,{children:`Apply security override fixes without prompting.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity --forceSecurityRefactor
`})}),`
`,(0,O.jsx)(t.h3,{id:`pastoralist---strict`,children:(0,O.jsx)(t.code,{children:`pastoralist --strict`})}),`
`,(0,O.jsx)(t.p,{children:`Fail when a security provider, network request, or API call cannot complete.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity --strict
`})}),`
`,(0,O.jsx)(t.h3,{id:`cache-options`,children:`Cache Options`}),`
`,(0,O.jsx)(t.p,{children:`Control provider cache behavior for security checks.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --checkSecurity --cache-dir .cache/pastoralist
npx pastoralist --checkSecurity --cache-ttl 3600
npx pastoralist --checkSecurity --no-cache
npx pastoralist --checkSecurity --refresh-cache
`})}),`
`,(0,O.jsx)(t.h2,{id:`nodejs-api`,children:`Node.js API`}),`
`,(0,O.jsx)(t.h3,{id:`installation`,children:`Installation`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npm install pastoralist
`})}),`
`,(0,O.jsx)(t.h3,{id:`updateoptions`,children:(0,O.jsx)(t.code,{children:`update(options)`})}),`
`,(0,O.jsxs)(t.p,{children:[`Update `,(0,O.jsx)(t.code,{children:`package.json`}),` overrides and the appendix. Each appendix entry includes a
`,(0,O.jsx)(t.code,{children:`ledger`}),` with at least `,(0,O.jsx)(t.code,{children:`addedDate`}),`; security metadata is added when security
checks run. This is a low-level API: pass the parsed `,(0,O.jsx)(t.code,{children:`package.json`}),` as `,(0,O.jsx)(t.code,{children:`config`}),`.
The CLI handles config loading for normal command-line use. `,(0,O.jsx)(t.code,{children:`update()`}),` is
synchronous and returns an `,(0,O.jsx)(t.code,{children:`UpdateContext`}),`, so the examples below intentionally
do not use `,(0,O.jsx)(t.code,{children:`await`}),`.`]}),`
`,(0,O.jsx)(t.p,{children:(0,O.jsx)(t.strong,{children:`params:`})}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`options`}),`: configuration object`,`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`path`}),`: path to package.json (default: './package.json')`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`config`}),`: parsed package.json content`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`depPaths`}),`: array of glob patterns for multiple files`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`ignore`}),`: array of glob patterns to ignore`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`root`}),`: root directory path`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`debug`}),`: enable debug logging`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`dryRun`}),`: preview changes without writing package.json`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`summary`}),`: include summary metrics`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`removeUnused`}),`: remove overrides with no active dependents`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`checkSecurity`}),`: enable security checks`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`securityProvider`}),`: security provider to use`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`forceSecurityRefactor`}),`: apply security fixes without prompting`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`strict`}),`: fail on security provider errors`]}),`
`]}),`
`]}),`
`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-javascript`,children:`import { resolveJSON, update } from "pastoralist";

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
`})}),`
`,(0,O.jsx)(t.h3,{id:`loggerconfig`,children:(0,O.jsx)(t.code,{children:`logger(config)`})}),`
`,(0,O.jsx)(t.p,{children:`Create a logger instance for custom debugging.`}),`
`,(0,O.jsx)(t.p,{children:(0,O.jsx)(t.strong,{children:`params:`})}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`config`}),`: logger configuration`,`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`file`}),`: source file name`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`isLogging`}),`: enable/disable logging`]}),`
`]}),`
`]}),`
`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-javascript`,children:`import { logger } from "pastoralist";

// Create logger
const log = logger({
  file: "my-script.js",
  isLogging: true,
});

// Use logger
log.debug("starting action", "method-name", { data: "value" });
log.error("unexpected error", "method-name", { error: err });
`})}),`
`,(0,O.jsx)(t.h2,{id:`examples`,children:`Examples`}),`
`,(0,O.jsx)(t.h3,{id:`build-tool-integration`,children:`Build Tool Integration`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-javascript`,children:`import { resolveJSON, update } from "pastoralist";

const path = "./package.json";
const config = resolveJSON(path);

// Ensure overrides are up-to-date before building
if (config) {
  update({ config, path });
  console.log("Package overrides verified");
}
`})}),`
`,(0,O.jsx)(t.h3,{id:`workspace-automation`,children:`Workspace Automation`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-javascript`,children:`import { resolveJSON, update } from "pastoralist";
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
`})}),`
`,(0,O.jsx)(t.h3,{id:`cicd-validation`,children:`CI/CD Validation`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-javascript`,children:`import { resolveJSON, update } from "pastoralist";
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
`})}),`
`,(0,O.jsx)(t.h3,{id:`custom-logger`,children:`Custom Logger`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-javascript`,children:`import { logger, resolveJSON, update } from "pastoralist";

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
`})}),`
`,(0,O.jsx)(t.h3,{id:`error-handling`,children:`Error Handling`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-javascript`,children:`import { resolveJSON, update } from "pastoralist";

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
`})}),`
`,(0,O.jsx)(t.h2,{id:`environment-variables`,children:`Environment Variables`}),`
`,(0,O.jsx)(t.h3,{id:`debugtrue`,children:(0,O.jsx)(t.code,{children:`DEBUG=true`})}),`
`,(0,O.jsx)(t.p,{children:`Enable debug output (equivalent to --debug flag).`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`DEBUG=true npx pastoralist
`})}),`
`,(0,O.jsx)(t.h2,{id:`typescript`,children:`TypeScript`}),`
`,(0,O.jsx)(t.p,{children:`Pastoralist includes full TypeScript support.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-typescript`,children:`import { resolveJSON, update, type Options } from "pastoralist";

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
`})})]})}function an(e={}){let{wrapper:t}=e.components||{};return t?(0,O.jsx)(t,{...e,children:(0,O.jsx)(rn,{...e})}):rn(e)}var on=t({default:()=>cn});function sn(e){let t={code:`code`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components},{Mermaid:n}=t;return n||ln(`Mermaid`,!0),(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)(t.h2,{id:`how-pastoralist-works`,children:`How Pastoralist Works`}),`
`,(0,O.jsx)(n,{chart:`flowchart LR
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
    style Chill fill:#e8f5e9`}),`
`,(0,O.jsxs)(t.p,{children:[`Pastoralist reads the root `,(0,O.jsx)(t.code,{children:`package.json`}),`, maps each override or resolution into
a `,(0,O.jsx)(t.code,{children:`pastoralist.appendix`}),` entry, and records when the entry was created in its
`,(0,O.jsx)(t.code,{children:`ledger`}),`. Patches created by tools such as `,(0,O.jsx)(t.code,{children:`patch-package`}),` are detected and
tracked on the same entry.`]}),`
`,(0,O.jsxs)(t.p,{children:[`If an override or resolution is no longer needed, Pastoralist marks the appendix
entry as unused and prints a cleanup notice. The override and its appendix entry
are removed only when you run with `,(0,O.jsx)(t.code,{children:`--remove-unused`}),`. Patch files are reported
as potentially unused; Pastoralist does not delete patch files for you.`]}),`
`,(0,O.jsx)(t.p,{children:`You manage the override or resolution field; Pastoralist manages the appendix.`}),`
`,(0,O.jsx)(t.h3,{id:`workspace-support`,children:`Workspace Support`}),`
`,(0,O.jsx)(t.p,{children:`In workspace/monorepo setups, Pastoralist:`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsx)(t.li,{children:`Reads the root package.json or project manifest file`}),`
`,(0,O.jsxs)(t.li,{children:[`Maps overrides, resolutions, and patches to the `,(0,O.jsx)(t.code,{children:`pastoralist.appendix`}),`, with a
`,(0,O.jsx)(t.code,{children:`ledger`}),` entry recording when each override was added`]}),`
`,(0,O.jsxs)(t.li,{children:[`Reads workspace package manifests when `,(0,O.jsx)(t.code,{children:`depPaths`}),` or `,(0,O.jsx)(t.code,{children:`workspaces`}),` are configured`]}),`
`,(0,O.jsx)(t.li,{children:`Writes the consolidated appendix to the target package.json, usually the root`}),`
`]}),`
`,(0,O.jsx)(t.h2,{id:`simple-project-architecture`,children:`Simple Project Architecture`}),`
`,(0,O.jsx)(t.p,{children:`Standard single-package project with overrides:`}),`
`,(0,O.jsx)(n,{chart:`flowchart TD
    PkgJson[package.json] --> Pastoralist[Pastoralist]
    NodeModules[node_modules] --> Pastoralist
    Pastoralist --> UpdatedPkg[Updated package.json with appendix]

    style PkgJson fill:#e3f2fd
    style Pastoralist fill:#f3e5f5
    style UpdatedPkg fill:#e8f5e9`}),`
`,(0,O.jsx)(t.h2,{id:`monorepo-architecture`,children:`Monorepo Architecture`}),`
`,(0,O.jsx)(t.p,{children:`Complex workspace setup with shared overrides:`}),`
`,(0,O.jsx)(n,{chart:`flowchart TD
    Root[Root package.json] --> Pastoralist[Pastoralist]
    WS1[Workspace A] --> Pastoralist
    WS2[Workspace B] --> Pastoralist
    Pastoralist --> Output[Root package.json with consolidated appendix]

    style Root fill:#e3f2fd
    style Pastoralist fill:#f3e5f5
    style Output fill:#e8f5e9`}),`
`,(0,O.jsx)(t.h2,{id:`what-are-overrides-resolutions-and-patches`,children:`What Are Overrides, Resolutions, and Patches?`}),`
`,(0,O.jsx)(t.h3,{id:`overrides-npm`,children:`Overrides (npm)`}),`
`,(0,O.jsx)(t.p,{children:`Overrides allow you to replace a package version in your dependency tree with a different version. This is npm's way of handling dependency conflicts:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "overrides": {
    "foo": "1.0.0",
    "bar": {
      "baz": "1.0.0"
    }
  }
}
`})}),`
`,(0,O.jsx)(t.h3,{id:`resolutions-yarn`,children:`Resolutions (Yarn)`}),`
`,(0,O.jsx)(t.p,{children:`Resolutions serve the same purpose for Yarn users, allowing you to force specific versions:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "resolutions": {
    "foo": "1.0.0",
    "**/bar/baz": "1.0.0"
  }
}
`})}),`
`,(0,O.jsx)(t.h3,{id:`patches`,children:`Patches`}),`
`,(0,O.jsxs)(t.p,{children:[`Patches are custom modifications to node_modules packages, typically created with tools like `,(0,O.jsx)(t.code,{children:`patch-package`}),`. Pastoralist automatically detects and tracks these patches.`]}),`
`,(0,O.jsx)(t.h2,{id:`object-anatomy`,children:`Object Anatomy`}),`
`,(0,O.jsx)(t.p,{children:`The Pastoralist object in your package.json provides full transparency into what's being managed:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsx)(t.h3,{id:`appendix-properties`,children:`Appendix Properties`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`appendix key`}),`: The package and override version, such as `,(0,O.jsx)(t.code,{children:`minimist@1.2.8`})]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`dependents`}),`: Direct, workspace, or transitive packages that still require the override`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`patches`}),`: Patch files associated with the package, when any are detected`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`ledger`}),`: Always present on entries written by current Pastoralist. Holds
`,(0,O.jsx)(t.code,{children:`addedDate`}),`, optional `,(0,O.jsx)(t.code,{children:`reason`}),` and `,(0,O.jsx)(t.code,{children:`source`}),`, security metadata (`,(0,O.jsx)(t.code,{children:`securityProvider`}),`,
`,(0,O.jsx)(t.code,{children:`cves`}),`, `,(0,O.jsx)(t.code,{children:`cveDetails`}),`, `,(0,O.jsx)(t.code,{children:`severity`}),`, `,(0,O.jsx)(t.code,{children:`vulnerableRange`}),`, `,(0,O.jsx)(t.code,{children:`patchedVersion`}),`), and
optional `,(0,O.jsx)(t.code,{children:`keep`}),` constraints`]}),`
`]}),`
`,(0,O.jsx)(t.h2,{id:`nested-override-architecture`,children:`Nested Override Architecture`}),`
`,(0,O.jsx)(t.p,{children:`How nested overrides work for transitive dependencies:`}),`
`,(0,O.jsx)(n,{chart:`flowchart TD
    App[Your App] --> ParentPkg[Parent Package]
    ParentPkg --> NestedDep[Nested Dependency]
    Override[Override in package.json] -.->|Forces version| NestedDep

    style App fill:#e3f2fd
    style Override fill:#fff3cd
    style NestedDep fill:#e8f5e9`}),`
`,(0,O.jsx)(t.h2,{id:`design-decisions`,children:`Design Decisions`}),`
`,(0,O.jsx)(t.h3,{id:`synchronous-io`,children:`Synchronous I/O`}),`
`,(0,O.jsx)(t.p,{children:`Pastoralist uses sync file I/O intentionally. As a CLI tool, predictable execution and simple debugging outweigh async benefits.`}),`
`,(0,O.jsx)(t.h3,{id:`caching`,children:`Caching`}),`
`,(0,O.jsxs)(t.p,{children:[`Two caches avoid redundant work: `,(0,O.jsx)(t.code,{children:`jsonCache`}),` (parsed package.json files) and `,(0,O.jsx)(t.code,{children:`dependencyTreeCache`}),` (npm ls output). Caches persist across `,(0,O.jsx)(t.code,{children:`update()`}),` calls - pass `,(0,O.jsx)(t.code,{children:`clearCache: true`}),` to reset.`]}),`
`,(0,O.jsx)(t.h3,{id:`rate-limiting`,children:`Rate Limiting`}),`
`,(0,O.jsx)(t.p,{children:`npm registry requests are limited to 5 concurrent to avoid rate limits during security scans.`}),`
`,(0,O.jsx)(t.h2,{id:`dependency-resolution-flow`,children:`Dependency Resolution Flow`}),`
`,(0,O.jsx)(t.p,{children:`Complete flow of how dependencies are resolved with overrides:`}),`
`,(0,O.jsx)(n,{chart:`flowchart TD
    Install[npm install] --> ReadPkg[Read package.json]
    ReadPkg --> CheckOverrides{Overrides exist?}
    CheckOverrides -->|Yes| ApplyOverrides[Apply overrides to dependency tree]
    CheckOverrides -->|No| NormalInstall[Normal install]
    ApplyOverrides --> UpdateLock[Update lock file]
    NormalInstall --> UpdateLock
    UpdateLock --> Done[✓ Dependencies installed]

    style Install fill:#e3f2fd
    style ApplyOverrides fill:#fff3cd
    style Done fill:#e8f5e9`})]})}function cn(e={}){let{wrapper:t}=e.components||{};return t?(0,O.jsx)(t,{...e,children:(0,O.jsx)(sn,{...e})}):sn(e)}function ln(e,t){throw Error(`Expected `+(t?`component`:`object`)+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}var un=t({default:()=>fn});function dn(e){let t={a:`a`,code:`code`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,pre:`pre`,ul:`ul`,...e.components};return(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)(t.h2,{id:`quick-start`,children:`Quick Start`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Create a test project
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
`})}),`
`,(0,O.jsx)(t.h2,{id:`how-it-works`,children:`How It Works`}),`
`,(0,O.jsx)(t.h3,{id:`before-pastoralist`,children:`Before Pastoralist`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "dependencies": {
    "express": "^4.18.0"
  },
  "overrides": {
    "qs": "6.11.2"
  }
}
`})}),`
`,(0,O.jsx)(t.h3,{id:`after-pastoralist`,children:`After Pastoralist`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsx)(t.h3,{id:`cleanup`,children:`Cleanup`}),`
`,(0,O.jsxs)(t.p,{children:[`When dependencies no longer need an override, Pastoralist labels it as unused.
Run with `,(0,O.jsx)(t.code,{children:`--remove-unused`}),` to remove the override and appendix entry:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --remove-unused
`})}),`
`,(0,O.jsx)(t.h2,{id:`setup`,children:`Setup`}),`
`,(0,O.jsx)(t.h3,{id:`install`,children:`Install`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npm install --save-dev pastoralist
`})}),`
`,(0,O.jsx)(t.h3,{id:`add-to-postinstall`,children:`Add to postinstall`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
`})}),`
`,(0,O.jsx)(t.h3,{id:`for-monorepos`,children:`For Monorepos`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Root package
pastoralist

# Specific workspace
pastoralist --path packages/app/package.json
`})}),`
`,(0,O.jsx)(t.h2,{id:`common-use-cases`,children:`Common Use Cases`}),`
`,(0,O.jsx)(t.h3,{id:`security-patches`,children:`Security Patches`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsx)(t.p,{children:`Pastoralist keeps the security context with the override so you can remove it
when upstream dependencies no longer need it.`}),`
`,(0,O.jsx)(t.h3,{id:`version-conflicts`,children:`Version Conflicts`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsx)(t.p,{children:`The appendix shows which packages aren't ready for React 18.`}),`
`,(0,O.jsx)(t.h3,{id:`api-usage`,children:`API Usage`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-javascript`,children:`import { resolveJSON, update } from "pastoralist";

const path = "./package.json";
const config = resolveJSON(path);

if (config) {
  update({ config, path });
}
`})}),`
`,(0,O.jsx)(t.h2,{id:`try-it-now`,children:`Try It Now`}),`
`,(0,O.jsx)(`a`,{href:`https://stackblitz.com/fork/github/yowainwright/pastoralist/tree/main/tests/sandboxes/basic-overrides?title=Pastoralist%20Basic%20Overrides&file=README.md&startScript=demo&view=editor`,target:`_blank`,rel:`noopener noreferrer`,children:(0,O.jsx)(`img`,{src:`https://developer.stackblitz.com/img/open_in_stackblitz.svg`,alt:`Open in StackBlitz`})}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.a,{href:`/docs/introduction`,children:`Open Interactive Demos`}),` to see pastoralist in action!`]}),`
`,(0,O.jsx)(t.h2,{id:`resources`,children:`Resources`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsx)(t.li,{children:(0,O.jsx)(t.a,{href:`https://github.com/yowainwright/pastoralist`,children:`GitHub`})}),`
`,(0,O.jsx)(t.li,{children:(0,O.jsx)(t.a,{href:`https://www.npmjs.com/package/pastoralist`,children:`npm`})}),`
`,(0,O.jsx)(t.li,{children:(0,O.jsx)(t.a,{href:`https://github.com/yowainwright/pastoralist/issues`,children:`Issues & Questions`})}),`
`]})]})}function fn(e={}){let{wrapper:t}=e.components||{};return t?(0,O.jsx)(t,{...e,children:(0,O.jsx)(dn,{...e})}):dn(e)}var pn=t({default:()=>hn});function mn(e){let t={code:`code`,em:`em`,h2:`h2`,h3:`h3`,h4:`h4`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...e.components};return(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)(t.p,{children:`For most projects, start small: enable workspace scanning only if you have
workspaces, and enable security checks only where you want advisory data.`}),`
`,(0,O.jsx)(t.h2,{id:`configuration-files`,children:`Configuration Files`}),`
`,(0,O.jsx)(t.p,{children:`Pastoralist searches for configuration files in this order (first found wins):`}),`
`,(0,O.jsxs)(t.ol,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`.pastoralistrc`}),` (JSON format)`]}),`
`,(0,O.jsx)(t.li,{children:(0,O.jsx)(t.code,{children:`.pastoralistrc.json`})}),`
`,(0,O.jsx)(t.li,{children:(0,O.jsx)(t.code,{children:`pastoralist.json`})}),`
`,(0,O.jsx)(t.li,{children:(0,O.jsx)(t.code,{children:`pastoralist.config.cjs`})}),`
`,(0,O.jsx)(t.li,{children:(0,O.jsx)(t.code,{children:`pastoralist.config.js`})}),`
`,(0,O.jsx)(t.li,{children:(0,O.jsx)(t.code,{children:`pastoralist.config.mjs`})}),`
`]}),`
`,(0,O.jsx)(t.p,{children:`All external config files use the same top-level Pastoralist settings. Choose
the filename by format and convention:`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`.pastoralistrc`}),`: extensionless rc file parsed as JSON`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`.pastoralistrc.json`}),`: explicit JSON rc file, and the JSON option created by
`,(0,O.jsx)(t.code,{children:`pastoralist init`})]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`pastoralist.json`}),`: visible non-dotfile JSON config`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`pastoralist.config.cjs`}),`: CommonJS module with `,(0,O.jsx)(t.code,{children:`module.exports`})]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`pastoralist.config.js`}),`: JavaScript config. CommonJS exports are accepted;
otherwise it is imported as a module`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.code,{children:`pastoralist.config.mjs`}),`: ESM module with `,(0,O.jsx)(t.code,{children:`export default`})]}),`
`]}),`
`,(0,O.jsxs)(t.p,{children:[`Use `,(0,O.jsx)(t.code,{children:`pastoralist.json`}),`, not `,(0,O.jsx)(t.code,{children:`.pastoralist.json`}),`.`]}),`
`,(0,O.jsx)(t.h3,{id:`example-configurations`,children:`Example Configurations`}),`
`,(0,O.jsx)(t.h4,{id:`minimal-configuration`,children:`Minimal Configuration`}),`
`,(0,O.jsx)(t.p,{children:`Enable security checks with defaults:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "checkSecurity": true,
  "depPaths": "workspace",
  "security": {
    "provider": "osv"
  }
}
`})}),`
`,(0,O.jsx)(t.h4,{id:`pastoralistrcjson`,children:(0,O.jsx)(t.code,{children:`.pastoralistrc.json`})}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "checkSecurity": true,
  "depPaths": "workspace",
  "security": {
    "provider": "osv",
    "severityThreshold": "medium"
  }
}
`})}),`
`,(0,O.jsx)(t.h4,{id:`pastoralistconfigjs`,children:(0,O.jsx)(t.code,{children:`pastoralist.config.js`})}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-js`,children:`module.exports = {
  depPaths: ["packages/*/package.json", "apps/*/package.json"],
  checkSecurity: true,
  security: {
    provider: "osv",
    severityThreshold: "high",
    excludePackages: ["@types/*"],
  },
};
`})}),`
`,(0,O.jsx)(t.h4,{id:`pastoralistconfigmjs`,children:(0,O.jsx)(t.code,{children:`pastoralist.config.mjs`})}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-js`,children:`export default {
  checkSecurity: true,
  depPaths: "workspace",
  security: {
    provider: "osv",
    severityThreshold: "critical",
  },
};
`})}),`
`,(0,O.jsx)(t.h2,{id:`configuration-priority`,children:`Configuration Priority`}),`
`,(0,O.jsxs)(t.p,{children:[`When both external config files and `,(0,O.jsx)(t.code,{children:`package.json`}),` configuration exist, they are merged with `,(0,O.jsx)(t.code,{children:`package.json`}),` taking precedence:`]}),`
`,(0,O.jsxs)(t.ol,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`External config`}),` provides base settings`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:(0,O.jsx)(t.code,{children:`package.json`})}),` overrides top-level fields`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`Nested objects`}),` (like `,(0,O.jsx)(t.code,{children:`security`}),`) are deep merged`]}),`
`]}),`
`,(0,O.jsx)(t.h3,{id:`example-config-merging`,children:`Example: Config Merging`}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.code,{children:`.pastoralistrc.json`}),`:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "checkSecurity": true,
  "depPaths": "workspace",
  "security": {
    "provider": "osv",
    "severityThreshold": "medium"
  }
}
`})}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.code,{children:`package.json`}),`:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "pastoralist": {
    "security": {
      "severityThreshold": "high"
    }
  }
}
`})}),`
`,(0,O.jsx)(t.p,{children:`Effective configuration:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "checkSecurity": true,
  "depPaths": "workspace",
  "security": {
    "provider": "osv",
    "severityThreshold": "high"
  }
}
`})}),`
`,(0,O.jsx)(t.h2,{id:`configuration-options`,children:`Configuration Options`}),`
`,(0,O.jsx)(t.h3,{id:`top-level-options`,children:`Top-Level Options`}),`
`,(0,O.jsxs)(t.table,{children:[(0,O.jsx)(t.thead,{children:(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.th,{children:`Option`}),(0,O.jsx)(t.th,{children:`Type`}),(0,O.jsx)(t.th,{children:`Description`})]})}),(0,O.jsxs)(t.tbody,{children:[(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`checkSecurity`})}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`boolean`})}),(0,O.jsx)(t.td,{children:`Enable security vulnerability scanning`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`compactAppendix`})}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`boolean`})}),(0,O.jsxs)(t.td,{children:[`Collapse routine appendix entries to `,(0,O.jsx)(t.code,{children:`{ addedDate }`}),`; entries with security info, patches, or active `,(0,O.jsx)(t.code,{children:`keep`}),` constraints stay expanded`]})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`depPaths`})}),(0,O.jsxs)(t.td,{children:[(0,O.jsx)(t.code,{children:`"workspace"`}),` | `,(0,O.jsx)(t.code,{children:`"workspaces"`}),` | `,(0,O.jsx)(t.code,{children:`string[]`})]}),(0,O.jsx)(t.td,{children:`Paths to scan for dependencies in monorepos`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`appendix`})}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`object`})}),(0,O.jsx)(t.td,{children:`Auto-generated dependency tracking (managed by Pastoralist)`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`overridePaths`})}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`object`})}),(0,O.jsx)(t.td,{children:`Manual override tracking for specific paths`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`resolutionPaths`})}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`object`})}),(0,O.jsx)(t.td,{children:`Manual resolution tracking for specific paths`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`security`})}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`object`})}),(0,O.jsx)(t.td,{children:`Security scanning configuration`})]})]})]}),`
`,(0,O.jsx)(t.h3,{id:`security-configuration`,children:`Security Configuration`}),`
`,(0,O.jsxs)(t.p,{children:[`The `,(0,O.jsx)(t.code,{children:`security`}),` object supports the following options:`]}),`
`,(0,O.jsxs)(t.table,{children:[(0,O.jsx)(t.thead,{children:(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.th,{children:`Option`}),(0,O.jsx)(t.th,{children:`Type`}),(0,O.jsx)(t.th,{children:`Description`})]})}),(0,O.jsxs)(t.tbody,{children:[(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`enabled`})}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`boolean`})}),(0,O.jsx)(t.td,{children:`Enable/disable security checks`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`provider`})}),(0,O.jsxs)(t.td,{children:[(0,O.jsx)(t.code,{children:`"osv"`}),` | `,(0,O.jsx)(t.code,{children:`"github"`}),` | `,(0,O.jsx)(t.code,{children:`"snyk"`}),` | `,(0,O.jsx)(t.code,{children:`"npm"`}),` | `,(0,O.jsx)(t.code,{children:`"socket"`}),` | `,(0,O.jsx)(t.code,{children:`"spektion"`}),` | array`]}),(0,O.jsx)(t.td,{children:`Security provider or providers to use`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`autoFix`})}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`boolean`})}),(0,O.jsx)(t.td,{children:`Automatically apply security fixes`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`interactive`})}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`boolean`})}),(0,O.jsx)(t.td,{children:`Use interactive mode for security fixes`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`securityProviderToken`})}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`string`})}),(0,O.jsx)(t.td,{children:`API token for providers that require authentication. Prefer provider environment variables; use this only for controlled config that will not be committed.`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`severityThreshold`})}),(0,O.jsxs)(t.td,{children:[(0,O.jsx)(t.code,{children:`"low"`}),` | `,(0,O.jsx)(t.code,{children:`"medium"`}),` | `,(0,O.jsx)(t.code,{children:`"high"`}),` | `,(0,O.jsx)(t.code,{children:`"critical"`})]}),(0,O.jsx)(t.td,{children:`Minimum severity level to report`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`excludePackages`})}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`string[]`})}),(0,O.jsx)(t.td,{children:`Packages to exclude from security checks`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`hasWorkspaceSecurityChecks`})}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`boolean`})}),(0,O.jsx)(t.td,{children:`Include workspace packages in security scans`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`strict`})}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`boolean`})}),(0,O.jsx)(t.td,{children:`Fail when a security provider cannot complete`})]})]})]}),`
`,(0,O.jsx)(t.h2,{id:`packagejson-configuration`,children:`Package.json Configuration`}),`
`,(0,O.jsxs)(t.p,{children:[`You can configure Pastoralist directly in your `,(0,O.jsx)(t.code,{children:`package.json`}),`:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsx)(t.h2,{id:`monorepo-configuration`,children:`Monorepo Configuration`}),`
`,(0,O.jsxs)(t.p,{children:[`For monorepos, use `,(0,O.jsx)(t.code,{children:`depPaths`}),` to specify which package.json files to scan:`]}),`
`,(0,O.jsx)(t.h3,{id:`using-workspace`,children:`Using "workspace"`}),`
`,(0,O.jsxs)(t.p,{children:[`The simplest approach for monorepos with a `,(0,O.jsx)(t.code,{children:`workspaces`}),` field:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "workspaces": ["packages/*", "apps/*"],
  "pastoralist": {
    "depPaths": "workspace"
  }
}
`})}),`
`,(0,O.jsxs)(t.p,{children:[`This automatically scans all workspace packages defined in your `,(0,O.jsx)(t.code,{children:`workspaces`}),` field.
`,(0,O.jsx)(t.code,{children:`"workspaces"`}),` is accepted as an alias.`]}),`
`,(0,O.jsx)(t.h3,{id:`using-custom-paths`,children:`Using Custom Paths`}),`
`,(0,O.jsx)(t.p,{children:`For more control, specify custom glob patterns:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "pastoralist": {
    "depPaths": ["packages/*/package.json", "apps/*/package.json"]
  }
}
`})}),`
`,(0,O.jsx)(t.h2,{id:`security-tracking`,children:`Security Tracking`}),`
`,(0,O.jsxs)(t.p,{children:[`Every appendix entry gets a `,(0,O.jsx)(t.code,{children:`ledger`}),` with at least `,(0,O.jsx)(t.code,{children:`addedDate`}),`. When a security
provider detects a fix, Pastoralist adds CVE, severity, provider, and
vulnerable-range metadata to the same ledger:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsx)(t.h3,{id:`ledger-fields`,children:`Ledger Fields`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:(0,O.jsx)(t.code,{children:`addedDate`})}),`: ISO timestamp recorded when the entry was first written. Always present`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:(0,O.jsx)(t.code,{children:`reason`})}),`: Why the override was needed (e.g., security issue description)`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:(0,O.jsx)(t.code,{children:`source`})}),`: How the entry was created — `,(0,O.jsx)(t.code,{children:`"manual"`}),` or `,(0,O.jsx)(t.code,{children:`"security"`})]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:(0,O.jsx)(t.code,{children:`securityChecked`})}),`: Whether a security check was performed`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:(0,O.jsx)(t.code,{children:`securityCheckDate`})}),`: When the last security check occurred`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:(0,O.jsx)(t.code,{children:`securityCheckResult`})}),`: Result of the last check — `,(0,O.jsx)(t.code,{children:`"clean"`}),`, `,(0,O.jsx)(t.code,{children:`"error"`}),`, or `,(0,O.jsx)(t.code,{children:`"skipped"`})]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:(0,O.jsx)(t.code,{children:`securityProvider`})}),`: Which provider detected the vulnerability`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:(0,O.jsx)(t.code,{children:`cves`})}),`: All CVE identifiers related to this vulnerability`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:(0,O.jsx)(t.code,{children:`cveDetails`})}),`: Per-CVE objects with `,(0,O.jsx)(t.code,{children:`cve`}),`, `,(0,O.jsx)(t.code,{children:`severity`}),`, and `,(0,O.jsx)(t.code,{children:`patchedVersion`})]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:(0,O.jsx)(t.code,{children:`severity`})}),`: Highest severity across all CVEs (`,(0,O.jsx)(t.code,{children:`low`}),`, `,(0,O.jsx)(t.code,{children:`medium`}),`, `,(0,O.jsx)(t.code,{children:`high`}),`, `,(0,O.jsx)(t.code,{children:`critical`}),`)`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:(0,O.jsx)(t.code,{children:`vulnerableRange`})}),`: Semver range that is affected`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:(0,O.jsx)(t.code,{children:`patchedVersion`})}),`: Version that resolves the vulnerability`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:(0,O.jsx)(t.code,{children:`keep`})}),`: Prevent `,(0,O.jsx)(t.code,{children:`--remove-unused`}),` from removing this entry. Set to `,(0,O.jsx)(t.code,{children:`true`}),` or a `,(0,O.jsx)(t.code,{children:`KeepConstraint`}),` object`]}),`
`]}),`
`,(0,O.jsxs)(t.h3,{id:`keeping-overrides-with-keep`,children:[`Keeping Overrides with `,(0,O.jsx)(t.code,{children:`keep`})]}),`
`,(0,O.jsxs)(t.p,{children:[`To pin an override so `,(0,O.jsx)(t.code,{children:`--remove-unused`}),` never removes it, set `,(0,O.jsx)(t.code,{children:`keep: true`}),` on the ledger:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "ledger": {
    "addedDate": "2026-05-30T00:00:00.000Z",
    "keep": true
  }
}
`})}),`
`,(0,O.jsxs)(t.p,{children:[`For time-bounded or version-bounded keeps, use a `,(0,O.jsx)(t.code,{children:`KeepConstraint`}),` object:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "ledger": {
    "addedDate": "2026-05-30T00:00:00.000Z",
    "keep": {
      "reason": "Waiting for upstream patch",
      "until": "2027-06-01",
      "untilVersion": "4.18.0"
    }
  }
}
`})}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.code,{children:`KeepConstraint`}),` fields:`]}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:(0,O.jsx)(t.code,{children:`reason`})}),` `,(0,O.jsx)(t.em,{children:`(required)`}),`: Why this override is being kept`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:(0,O.jsx)(t.code,{children:`until`})}),`: ISO date after which the keep is considered expired`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:(0,O.jsx)(t.code,{children:`untilVersion`})}),`: Semver. The keep expires once the root dependency meets or exceeds this version`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:(0,O.jsx)(t.code,{children:`reviewBy`})}),`: Freeform field for tracking who should review the decision`]}),`
`]}),`
`,(0,O.jsx)(t.p,{children:`This allows you to see at a glance which packages were overridden due to security issues and when they were last verified.`}),`
`,(0,O.jsx)(t.h2,{id:`best-practices`,children:`Best Practices`}),`
`,(0,O.jsxs)(t.ol,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsxs)(t.strong,{children:[`Use `,(0,O.jsx)(t.code,{children:`depPaths: "workspace"`})]}),` for most monorepos`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`Enable security checks`}),` in CI with `,(0,O.jsx)(t.code,{children:`--checkSecurity`})]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`Commit config files`}),` to version control`]}),`
`]}),`
`,(0,O.jsx)(t.h2,{id:`javascript-config-files`,children:`JavaScript Config Files`}),`
`,(0,O.jsxs)(t.p,{children:[`Use `,(0,O.jsx)(t.code,{children:`pastoralist.config.cjs`}),` for CommonJS or `,(0,O.jsx)(t.code,{children:`pastoralist.config.mjs`}),` for ESM:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-js`,children:`export default {
  checkSecurity: true,
  depPaths: "workspace",
  security: {
    provider: "osv",
    severityThreshold: "high",
  },
};
`})}),`
`,(0,O.jsx)(t.p,{children:`TypeScript config files are not loaded directly. Use JSON, CJS, JS, or MJS
config files.`}),`
`,(0,O.jsx)(t.h2,{id:`environment-specific-configuration`,children:`Environment-Specific Configuration`}),`
`,(0,O.jsx)(t.p,{children:`You can use JavaScript config files to provide environment-specific settings:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-js`,children:`// pastoralist.config.js
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
`})}),`
`,(0,O.jsx)(t.h2,{id:`migration-from-cli-flags`,children:`Migration from CLI Flags`}),`
`,(0,O.jsx)(t.p,{children:`If you're currently using CLI flags, you can migrate to config files:`}),`
`,(0,O.jsx)(t.h3,{id:`before-cli-flags`,children:`Before (CLI flags)`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`pastoralist --checkSecurity --depPaths "packages/*/package.json"
`})}),`
`,(0,O.jsx)(t.h3,{id:`after-config-file`,children:`After (config file)`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "checkSecurity": true,
  "depPaths": ["packages/*/package.json"]
}
`})}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`pastoralist
`})}),`
`,(0,O.jsx)(t.p,{children:`CLI flags still work and will override config file settings.`})]})}function hn(e={}){let{wrapper:t}=e.components||{};return t?(0,O.jsx)(t,{...e,children:(0,O.jsx)(mn,{...e})}):mn(e)}var gn=t({default:()=>vn});function _n(e){let t={code:`code`,h2:`h2`,h3:`h3`,p:`p`,pre:`pre`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,...e.components};return(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)(t.h2,{id:`quick-start`,children:`Quick Start`}),`
`,(0,O.jsx)(t.h3,{id:`basic-pr-check`,children:`Basic PR Check`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-yaml`,children:`name: Override Check
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
`})}),`
`,(0,O.jsxs)(t.p,{children:[`The action enables OSV security scanning by default. Set
`,(0,O.jsx)(t.code,{children:`check-security: false`}),` when you only want to validate override tracking.`]}),`
`,(0,O.jsx)(t.h3,{id:`scheduled-maintenance-with-pr-creation`,children:`Scheduled Maintenance with PR Creation`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-yaml`,children:`name: Override Maintenance
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
`})}),`
`,(0,O.jsx)(t.h2,{id:`modes`,children:`Modes`}),`
`,(0,O.jsxs)(t.table,{children:[(0,O.jsx)(t.thead,{children:(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.th,{children:`Mode`}),(0,O.jsx)(t.th,{children:`Description`})]})}),(0,O.jsxs)(t.tbody,{children:[(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`check`})}),(0,O.jsx)(t.td,{children:`Validate only - reports issues without modifying files`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`update`})}),(0,O.jsx)(t.td,{children:`Modify package.json (default) - you handle commits`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`pr`})}),(0,O.jsx)(t.td,{children:`Create pull request with changes automatically`})]})]})]}),`
`,(0,O.jsx)(t.h3,{id:`check-mode`,children:`Check Mode`}),`
`,(0,O.jsx)(t.p,{children:`Runs pastoralist in dry-run mode. Reports issues without modifying files.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-yaml`,children:`- uses: yowainwright/pastoralist@v1
  with:
    mode: check
`})}),`
`,(0,O.jsx)(t.h3,{id:`update-mode-default`,children:`Update Mode (Default)`}),`
`,(0,O.jsxs)(t.p,{children:[`Runs pastoralist and modifies `,(0,O.jsx)(t.code,{children:`package.json`}),`. Use when you want to handle commits yourself.`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-yaml`,children:`- uses: actions/checkout@v7

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
`})}),`
`,(0,O.jsx)(t.h3,{id:`pr-mode`,children:`PR Mode`}),`
`,(0,O.jsxs)(t.p,{children:[`Runs pastoralist and creates a PR if changes are needed. Ideal for scheduled workflows.
Use this mode with `,(0,O.jsx)(t.code,{children:`contents: write`}),` and `,(0,O.jsx)(t.code,{children:`pull-requests: write`}),` workflow
permissions.`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-yaml`,children:`- uses: yowainwright/pastoralist@v1
  with:
    mode: pr
    pr-title: "fix(security): update vulnerable overrides"
`})}),`
`,(0,O.jsx)(t.h2,{id:`inputs`,children:`Inputs`}),`
`,(0,O.jsxs)(t.table,{children:[(0,O.jsx)(t.thead,{children:(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.th,{children:`Input`}),(0,O.jsx)(t.th,{children:`Description`}),(0,O.jsx)(t.th,{children:`Default`})]})}),(0,O.jsxs)(t.tbody,{children:[(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`mode`})}),(0,O.jsxs)(t.td,{children:[`Operation mode: `,(0,O.jsx)(t.code,{children:`check`}),`, `,(0,O.jsx)(t.code,{children:`update`}),`, or `,(0,O.jsx)(t.code,{children:`pr`})]}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`update`})})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`check-security`})}),(0,O.jsx)(t.td,{children:`Enable security scanning`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`true`})})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`security-provider`})}),(0,O.jsxs)(t.td,{children:[`Provider: `,(0,O.jsx)(t.code,{children:`osv`}),`, `,(0,O.jsx)(t.code,{children:`github`}),`, `,(0,O.jsx)(t.code,{children:`npm`}),`, `,(0,O.jsx)(t.code,{children:`snyk`}),`, `,(0,O.jsx)(t.code,{children:`socket`}),`, `,(0,O.jsx)(t.code,{children:`spektion`})]}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`osv`})})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`security-token`})}),(0,O.jsx)(t.td,{children:`Token for security provider`}),(0,O.jsx)(t.td,{children:`-`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`auto-fix`})}),(0,O.jsx)(t.td,{children:`Apply security fixes automatically when the action can write`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`true`})})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`dry-run`})}),(0,O.jsx)(t.td,{children:`Preview changes only`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`false`})})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`root-dir`})}),(0,O.jsx)(t.td,{children:`Project root directory`}),(0,O.jsx)(t.td,{children:`-`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`dep-paths`})}),(0,O.jsx)(t.td,{children:`Workspace patterns (space-separated)`}),(0,O.jsx)(t.td,{children:`-`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`config`})}),(0,O.jsxs)(t.td,{children:[`Deprecated; config files are auto-detected from `,(0,O.jsx)(t.code,{children:`root-dir`})]}),(0,O.jsx)(t.td,{children:`-`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`fail-on-security`})}),(0,O.jsx)(t.td,{children:`Fail if vulnerabilities found`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`true`})})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`fail-on-unused`})}),(0,O.jsx)(t.td,{children:`Fail if unused overrides found`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`false`})})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`silent`})}),(0,O.jsx)(t.td,{children:`Deprecated compatibility input; ignored with a warning`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`false`})})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`debug`})}),(0,O.jsx)(t.td,{children:`Enable debug logging`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`false`})})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`pr-title`})}),(0,O.jsx)(t.td,{children:`PR title (mode: pr)`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`chore(deps): update dependency overrides`})})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`pr-body`})}),(0,O.jsx)(t.td,{children:`PR body (mode: pr)`}),(0,O.jsx)(t.td,{children:`Auto-generated`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`pr-branch`})}),(0,O.jsx)(t.td,{children:`PR branch name (mode: pr)`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`pastoralist/updates`})})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`pr-labels`})}),(0,O.jsx)(t.td,{children:`PR labels (space-separated)`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`dependencies`})})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`github-token`})}),(0,O.jsx)(t.td,{children:`GitHub token for PR creation`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`GITHUB_TOKEN`})})]})]})]}),`
`,(0,O.jsx)(t.h2,{id:`outputs`,children:`Outputs`}),`
`,(0,O.jsxs)(t.table,{children:[(0,O.jsx)(t.thead,{children:(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.th,{children:`Output`}),(0,O.jsx)(t.th,{children:`Description`})]})}),(0,O.jsxs)(t.tbody,{children:[(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`has-security-issues`})}),(0,O.jsxs)(t.td,{children:[(0,O.jsx)(t.code,{children:`true`}),` if vulnerabilities were found`]})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`has-unused-overrides`})}),(0,O.jsxs)(t.td,{children:[(0,O.jsx)(t.code,{children:`true`}),` if unused overrides detected`]})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`updated`})}),(0,O.jsxs)(t.td,{children:[(0,O.jsx)(t.code,{children:`true`}),` if package.json was modified`]})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`security-count`})}),(0,O.jsx)(t.td,{children:`Number of security vulnerabilities found`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`unused-count`})}),(0,O.jsx)(t.td,{children:`Number of unused overrides detected`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`override-count`})}),(0,O.jsx)(t.td,{children:`Number of tracked overrides`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`pr-url`})}),(0,O.jsx)(t.td,{children:`URL of created PR (mode: pr only)`})]})]})]}),`
`,(0,O.jsx)(t.h2,{id:`examples`,children:`Examples`}),`
`,(0,O.jsx)(t.h3,{id:`pr-check-with-security-gate`,children:`PR Check with Security Gate`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-yaml`,children:`name: Override Security
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
`})}),`
`,(0,O.jsx)(t.h3,{id:`monorepo-support`,children:`Monorepo Support`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-yaml`,children:`- uses: yowainwright/pastoralist@v1
  with:
    dep-paths: "packages/*/package.json apps/*/package.json"
`})}),`
`,(0,O.jsx)(t.h3,{id:`using-github-security-provider`,children:`Using GitHub Security Provider`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-yaml`,children:`- uses: yowainwright/pastoralist@v1
  with:
    security-provider: github
    security-token: \${{ secrets.GITHUB_TOKEN }}
`})}),`
`,(0,O.jsx)(t.h3,{id:`conditional-pr-on-vulnerabilities`,children:`Conditional PR on Vulnerabilities`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-yaml`,children:`- uses: yowainwright/pastoralist@v1
  id: pastoralist
  with:
    mode: check

- name: Create security PR
  if: steps.pastoralist.outputs.has-security-issues == 'true'
  run: |
    # Custom PR logic here
`})}),`
`,(0,O.jsx)(t.h3,{id:`weekly-maintenance-with-slack-notification`,children:`Weekly Maintenance with Slack Notification`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-yaml`,children:`name: Weekly Override Maintenance
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
`})}),`
`,(0,O.jsx)(t.h2,{id:`permissions`,children:`Permissions`}),`
`,(0,O.jsxs)(t.p,{children:[`For `,(0,O.jsx)(t.code,{children:`mode: pr`}),`, the action needs write permissions:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-yaml`,children:`permissions:
  contents: write
  pull-requests: write
`})}),`
`,(0,O.jsx)(t.h2,{id:`security-providers`,children:`Security Providers`}),`
`,(0,O.jsxs)(t.table,{children:[(0,O.jsx)(t.thead,{children:(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.th,{children:`Provider`}),(0,O.jsx)(t.th,{children:`Auth`}),(0,O.jsx)(t.th,{children:`Notes`})]})}),(0,O.jsxs)(t.tbody,{children:[(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`osv`})}),(0,O.jsx)(t.td,{children:`None`}),(0,O.jsx)(t.td,{children:`Open Source Vulnerabilities database (default)`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`npm`})}),(0,O.jsx)(t.td,{children:`None`}),(0,O.jsx)(t.td,{children:`Uses the detected package manager's audit command`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`github`})}),(0,O.jsx)(t.td,{children:`Required`}),(0,O.jsxs)(t.td,{children:[`Reads Dependabot alerts; pass `,(0,O.jsx)(t.code,{children:`GITHUB_TOKEN`}),` or rely on an authenticated `,(0,O.jsx)(t.code,{children:`gh`}),` CLI session`]})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`snyk`})}),(0,O.jsx)(t.td,{children:`Required`}),(0,O.jsxs)(t.td,{children:[`Requires `,(0,O.jsx)(t.code,{children:`SNYK_TOKEN`}),` [EXPERIMENTAL]`]})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`socket`})}),(0,O.jsx)(t.td,{children:`Required`}),(0,O.jsxs)(t.td,{children:[`Requires `,(0,O.jsx)(t.code,{children:`SOCKET_SECURITY_API_KEY`}),` [EXPERIMENTAL]`]})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`spektion`})}),(0,O.jsx)(t.td,{children:`Required`}),(0,O.jsxs)(t.td,{children:[`Requires `,(0,O.jsx)(t.code,{children:`SPEKTION_API_KEY`}),` [EXPERIMENTAL]`]})]})]})]})]})}function vn(e={}){let{wrapper:t}=e.components||{};return t?(0,O.jsx)(t,{...e,children:(0,O.jsx)(_n,{...e})}):_n(e)}var yn=t({default:()=>xn});function bn(e){let t={a:`a`,code:`code`,h2:`h2`,li:`li`,p:`p`,pre:`pre`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...e.components};return(0,O.jsxs)(O.Fragment,{children:[(0,O.jsxs)(`div`,{className:`flex flex-wrap gap-2 mb-8`,children:[(0,O.jsx)(`a`,{href:`https://www.npmjs.com/package/pastoralist`,target:`_blank`,rel:`noopener noreferrer`,children:(0,O.jsx)(`img`,{src:`https://img.shields.io/npm/v/pastoralist.svg`,alt:`npm version`})}),(0,O.jsx)(`a`,{href:`https://www.npmjs.com/package/pastoralist`,target:`_blank`,rel:`noopener noreferrer`,children:(0,O.jsx)(`img`,{src:`https://img.shields.io/npm/dm/pastoralist.svg`,alt:`npm downloads`})}),(0,O.jsx)(`a`,{href:`https://github.com/yowainwright/pastoralist`,target:`_blank`,rel:`noopener noreferrer`,children:(0,O.jsx)(`img`,{src:`https://img.shields.io/github/stars/yowainwright/pastoralist?style=social`,alt:`GitHub stars`})}),(0,O.jsx)(`a`,{href:`https://www.typescriptlang.org/`,target:`_blank`,rel:`noopener noreferrer`,children:(0,O.jsx)(`img`,{src:`https://img.shields.io/badge/TypeScript-types%20included-blue`,alt:`TypeScript types included`})})]}),`
`,(0,O.jsx)(t.p,{children:`Pastoralist is the audit trail for package manager overrides.`}),`
`,(0,O.jsxs)(t.p,{children:[`If your project uses `,(0,O.jsx)(t.code,{children:`overrides`}),`, `,(0,O.jsx)(t.code,{children:`pnpm.overrides`}),`, or `,(0,O.jsx)(t.code,{children:`resolutions`}),`,
Pastoralist records why each entry exists, which packages still need it, and
when it can be removed. It can also connect security fixes, patch files,
workspace packages, and CI checks to the same record.`]}),`
`,(0,O.jsx)(t.h2,{id:`why-this-matters`,children:`Why This Matters`}),`
`,(0,O.jsx)(t.p,{children:`Overrides usually start with a good reason:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "overrides": {
    "lodash": "4.17.21"
  }
}
`})}),`
`,(0,O.jsx)(t.p,{children:`Months later, the context is gone. Was it a security fix? A transitive bug? Who
still needs it? Is it safe to remove? The override should stay as the package
manager instruction; the appendix carries the review detail:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsx)(t.p,{children:`The override controls the installed version. The appendix explains why that
control exists, who still depends on it, what scanner or reviewer justified it,
and what condition makes it removable.`}),`
`,(0,O.jsx)(t.h2,{id:`what-pastoralist-handles`,children:`What Pastoralist Handles`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[`Tracks npm and Bun `,(0,O.jsx)(t.code,{children:`overrides`}),`, pnpm `,(0,O.jsx)(t.code,{children:`pnpm.overrides`}),`, and Yarn
`,(0,O.jsx)(t.code,{children:`resolutions`})]}),`
`,(0,O.jsx)(t.li,{children:`Shows which direct or workspace packages still depend on each override`}),`
`,(0,O.jsxs)(t.li,{children:[`Removes stale overrides with `,(0,O.jsx)(t.code,{children:`--remove-unused`})]}),`
`,(0,O.jsxs)(t.li,{children:[`Links `,(0,O.jsx)(t.code,{children:`patch-package`}),` files to the overrides they support`]}),`
`,(0,O.jsx)(t.li,{children:`Checks security advisories with OSV, GitHub Dependabot alerts, npm audit,
Snyk, Socket, or Spektion`}),`
`,(0,O.jsxs)(t.li,{children:[`Supports monorepos through `,(0,O.jsx)(t.code,{children:`workspaces`}),`, `,(0,O.jsx)(t.code,{children:`depPaths`}),`, `,(0,O.jsx)(t.code,{children:`overridePaths`}),`, and
`,(0,O.jsx)(t.code,{children:`resolutionPaths`})]}),`
`,(0,O.jsxs)(t.li,{children:[`Provides CI-friendly output with `,(0,O.jsx)(t.code,{children:`--dry-run`}),`, `,(0,O.jsx)(t.code,{children:`--quiet`}),`, `,(0,O.jsx)(t.code,{children:`--summary`}),`, and
`,(0,O.jsx)(t.code,{children:`--outputFormat json`})]}),`
`]}),`
`,(0,O.jsx)(t.h2,{id:`at-a-glance`,children:`At A Glance`}),`
`,(0,O.jsxs)(t.table,{children:[(0,O.jsx)(t.thead,{children:(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.th,{children:`Area`}),(0,O.jsx)(t.th,{children:`Details`})]})}),(0,O.jsxs)(t.tbody,{children:[(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:`Package managers`}),(0,O.jsx)(t.td,{children:`npm, pnpm, Yarn, Bun`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:`Runtime`}),(0,O.jsx)(t.td,{children:`Node 20+`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:`Security default`}),(0,O.jsx)(t.td,{children:`OSV, no token required`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:`Optional providers`}),(0,O.jsx)(t.td,{children:`GitHub, npm audit, Snyk, Socket, Spektion`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:`Monorepos`}),(0,O.jsxs)(t.td,{children:[`Auto-detects `,(0,O.jsx)(t.code,{children:`workspaces`}),`; accepts explicit package globs`]})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:`CI`}),(0,O.jsx)(t.td,{children:`CLI flags plus a GitHub Action`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:`Test surface`}),(0,O.jsx)(t.td,{children:`1,700+ test cases across unit, integration, and e2e fixtures`})]})]})]}),`
`,(0,O.jsx)(t.h2,{id:`when-to-use-it`,children:`When To Use It`}),`
`,(0,O.jsx)(t.p,{children:`Use Pastoralist when your project has overrides that need a durable reason, a
regular cleanup path, or a security audit trail.`}),`
`,(0,O.jsx)(t.p,{children:`It is designed to sit beside tools such as npm audit, Dependabot, Renovate,
patch-package, syncpack, and depcheck. Those tools find or apply dependency
changes. Pastoralist keeps the resulting overrides from becoming invisible
technical debt.`}),`
`,(0,O.jsx)(t.h2,{id:`start-here`,children:`Start Here`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npm install pastoralist --save-dev
npx pastoralist init
`})}),`
`,(0,O.jsxs)(t.p,{children:[`Then add it to `,(0,O.jsx)(t.code,{children:`postinstall`}),`:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
`})}),`
`,(0,O.jsxs)(t.p,{children:[`Continue with the `,(0,O.jsx)(t.a,{href:`/docs/setup`,children:`setup guide`}),`, or try a sandbox:`]}),`
`,(0,O.jsx)(`a`,{href:`https://stackblitz.com/fork/github/yowainwright/pastoralist/tree/main/tests/sandboxes/basic-overrides?title=Pastoralist%20Basic%20Overrides&file=README.md&startScript=demo&view=editor`,target:`_blank`,rel:`noopener noreferrer`,children:(0,O.jsx)(`img`,{src:`https://developer.stackblitz.com/img/open_in_stackblitz.svg`,alt:`Open in StackBlitz`})})]})}function xn(e={}){let{wrapper:t}=e.components||{};return t?(0,O.jsx)(t,{...e,children:(0,O.jsx)(bn,{...e})}):bn(e)}var Sn=t({default:()=>wn});function Cn(e){let t={code:`code`,h2:`h2`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,...e.components};return(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)(t.p,{children:`Use onboarding when you are adding Pastoralist to a repo for the first time or
when you want a repeatable setup path for contributors and agents.`}),`
`,(0,O.jsx)(t.h2,{id:`start-read-only`,children:`Start Read-Only`}),`
`,(0,O.jsx)(t.p,{children:`Check the current project without writing files:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist doctor
`})}),`
`,(0,O.jsx)(t.p,{children:`Print the full checklist from the CLI:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist onboard
`})}),`
`,(0,O.jsx)(t.h2,{id:`add-project-setup`,children:`Add Project Setup`}),`
`,(0,O.jsx)(t.p,{children:`Install Pastoralist and create the initial config:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npm install pastoralist --save-dev
npx pastoralist init
`})}),`
`,(0,O.jsx)(t.p,{children:`Update the appendix once the config is in place:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist
`})}),`
`,(0,O.jsx)(t.p,{children:`Keep it current after dependency installs:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --setup-hook
`})}),`
`,(0,O.jsx)(t.h2,{id:`add-agent-setup`,children:`Add Agent Setup`}),`
`,(0,O.jsx)(t.p,{children:`Install only the bundled Pastoralist skill:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --init agent-skill
`})}),`
`,(0,O.jsx)(t.p,{children:`Preview local dev setup before writing files:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx -p pastoralist pastoralist-setup-local-dev --dry-run
`})}),`
`,(0,O.jsx)(t.p,{children:`Set up agent config, bundled skills, and local hooks:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx -p pastoralist pastoralist-setup-local-dev --skills all --hooks git,postinstall
`})}),`
`,(0,O.jsx)(t.p,{children:`The local dev setup script auto-detects Codex or Claude when possible. You can
pin the target explicitly:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx -p pastoralist pastoralist-setup-local-dev --agent codex
npx -p pastoralist pastoralist-setup-local-dev --agent claude
`})}),`
`,(0,O.jsx)(t.h2,{id:`copypaste-prompts`,children:`Copy/Paste Prompts`}),`
`,(0,O.jsx)(t.p,{children:`Use this prompt when you want an agent to do the setup:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-text`,children:`Set up Pastoralist in this repository.
Start with \`npx pastoralist doctor\` and inspect the current package manager setup.
Run \`npx -p pastoralist pastoralist-setup-local-dev --dry-run\` before writing files.
Configure the Pastoralist skill, local agent config, GitHub Action, and postinstall hook only when appropriate.
Keep changes scoped to setup files, docs, and tests.
`})}),`
`,(0,O.jsx)(t.p,{children:`Use this prompt when you want an agent to review an existing setup:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-text`,children:`Review this repository's Pastoralist setup.
Run \`npx pastoralist --dry-run\` and summarize stale overrides, security checks, and missing setup.
Do not remove overrides unless \`npx pastoralist --remove-unused --dry-run\` shows they are unused.
If setup is missing, propose the smallest script, skill, hook, or GitHub Action change.
`})}),`
`,(0,O.jsx)(t.h2,{id:`agent-setup-loop`,children:`Agent Setup Loop`}),`
`,(0,O.jsx)(t.p,{children:`Use this loop when an agent owns the setup:`}),`
`,(0,O.jsxs)(t.ol,{children:[`
`,(0,O.jsxs)(t.li,{children:[`Run `,(0,O.jsx)(t.code,{children:`npx pastoralist doctor`}),`.`]}),`
`,(0,O.jsxs)(t.li,{children:[`Run `,(0,O.jsx)(t.code,{children:`npx -p pastoralist pastoralist-setup-local-dev --dry-run`}),`.`]}),`
`,(0,O.jsx)(t.li,{children:`Apply the smallest needed setup command.`}),`
`,(0,O.jsxs)(t.li,{children:[`Run `,(0,O.jsx)(t.code,{children:`npx pastoralist --dry-run`}),`.`]}),`
`,(0,O.jsx)(t.li,{children:`Report changed files and remaining manual steps.`}),`
`]}),`
`,(0,O.jsx)(t.h2,{id:`add-ci`,children:`Add CI`}),`
`,(0,O.jsxs)(t.p,{children:[`Create `,(0,O.jsx)(t.code,{children:`.github/workflows/pastoralist.yml`}),`:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-yaml`,children:`name: Override Check
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
`})}),`
`,(0,O.jsx)(t.h2,{id:`verify`,children:`Verify`}),`
`,(0,O.jsx)(t.p,{children:`Use these commands before merging setup changes:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --dry-run
npx pastoralist --summary
npx pastoralist --checkSecurity
`})})]})}function wn(e={}){let{wrapper:t}=e.components||{};return t?(0,O.jsx)(t,{...e,children:(0,O.jsx)(Cn,{...e})}):Cn(e)}var Tn=t({default:()=>Dn});function En(e){let t={a:`a`,code:`code`,h2:`h2`,h3:`h3`,h4:`h4`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...e.components};return(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)(t.p,{children:`Pastoralist can check dependencies against security providers and connect fixes
to the same appendix used for override tracking.`}),`
`,(0,O.jsx)(t.h2,{id:`overview`,children:`Overview`}),`
`,(0,O.jsx)(t.p,{children:`Security checks scan your dependencies, report vulnerable packages, and can
suggest or apply package manager overrides when a safe version is available. The
appendix keeps the CVE, provider, severity, patched version, and reason with the
override.`}),`
`,(0,O.jsx)(t.h2,{id:`quick-start`,children:`Quick Start`}),`
`,(0,O.jsx)(t.h3,{id:`basic-check`,children:`Basic Check`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Check for vulnerabilities and display a report
pastoralist --checkSecurity
`})}),`
`,(0,O.jsx)(t.h3,{id:`auto-fix`,children:`Auto Fix`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Automatically apply security fixes
pastoralist --checkSecurity --forceSecurityRefactor
`})}),`
`,(0,O.jsx)(t.h3,{id:`interactive`,children:`Interactive`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Choose which fixes to apply
pastoralist --checkSecurity --interactive
`})}),`
`,(0,O.jsx)(t.h3,{id:`workspaces`,children:`Workspaces`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Include workspace packages in the scan
pastoralist --checkSecurity --hasWorkspaceSecurityChecks
`})}),`
`,(0,O.jsx)(`a`,{href:`https://stackblitz.com/fork/github/yowainwright/pastoralist/tree/main/tests/sandboxes/security-scan?title=Pastoralist%20Security%20Scan&file=README.md&startScript=demo&view=editor`,target:`_blank`,rel:`noopener noreferrer`,children:(0,O.jsx)(`img`,{src:`https://developer.stackblitz.com/img/open_in_stackblitz.svg`,alt:`Open in StackBlitz`})}),`
`,(0,O.jsx)(t.h2,{id:`configuration`,children:`Configuration`}),`
`,(0,O.jsxs)(t.p,{children:[`You can configure security settings in your `,(0,O.jsx)(t.code,{children:`package.json`}),`:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "pastoralist": {
    "security": {
      "enabled": false,
      "provider": "osv",
      "autoFix": false,
      "interactive": false,
      "hasWorkspaceSecurityChecks": false,
      "severityThreshold": "medium",
      "excludePackages": []
    }
  }
}
`})}),`
`,(0,O.jsx)(t.h3,{id:`configuration-options`,children:`Configuration Options`}),`
`,(0,O.jsxs)(t.table,{children:[(0,O.jsx)(t.thead,{children:(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.th,{children:`Option`}),(0,O.jsx)(t.th,{children:`Type`}),(0,O.jsx)(t.th,{children:`Default`}),(0,O.jsx)(t.th,{children:`Description`})]})}),(0,O.jsxs)(t.tbody,{children:[(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`enabled`})}),(0,O.jsx)(t.td,{children:`boolean`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`false`})}),(0,O.jsx)(t.td,{children:`Enable automatic security checks when running pastoralist`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`provider`})}),(0,O.jsx)(t.td,{children:`string or array`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`"osv"`})}),(0,O.jsxs)(t.td,{children:[`Provider: `,(0,O.jsx)(t.code,{children:`"osv"`}),`, `,(0,O.jsx)(t.code,{children:`"github"`}),`, `,(0,O.jsx)(t.code,{children:`"npm"`}),`, `,(0,O.jsx)(t.code,{children:`"snyk"`}),` [EXPERIMENTAL], `,(0,O.jsx)(t.code,{children:`"socket"`}),` [EXPERIMENTAL], `,(0,O.jsx)(t.code,{children:`"spektion"`}),` [EXPERIMENTAL]`]})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`autoFix`})}),(0,O.jsx)(t.td,{children:`boolean`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`false`})}),(0,O.jsx)(t.td,{children:`Automatically apply security fixes without prompting`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`interactive`})}),(0,O.jsx)(t.td,{children:`boolean`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`false`})}),(0,O.jsx)(t.td,{children:`Use interactive mode to select which fixes to apply`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`securityProviderToken`})}),(0,O.jsx)(t.td,{children:`string`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`""`})}),(0,O.jsx)(t.td,{children:`Authentication token for providers that require it. Prefer provider environment variables; use this only for controlled config that will not be committed.`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`hasWorkspaceSecurityChecks`})}),(0,O.jsx)(t.td,{children:`boolean`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`false`})}),(0,O.jsx)(t.td,{children:`Include workspace packages in security scan`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`severityThreshold`})}),(0,O.jsx)(t.td,{children:`string`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`"medium"`})}),(0,O.jsx)(t.td,{children:`Minimum severity level to report (low, medium, high, critical)`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`excludePackages`})}),(0,O.jsx)(t.td,{children:`array`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`[]`})}),(0,O.jsx)(t.td,{children:`List of package names to exclude from security checks`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`strict`})}),(0,O.jsx)(t.td,{children:`boolean`}),(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`false`})}),(0,O.jsx)(t.td,{children:`Fail when a provider cannot complete`})]})]})]}),`
`,(0,O.jsx)(t.h2,{id:`cli-options`,children:`CLI Options`}),`
`,(0,O.jsxs)(t.table,{children:[(0,O.jsx)(t.thead,{children:(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.th,{children:`Option`}),(0,O.jsx)(t.th,{children:`Description`})]})}),(0,O.jsxs)(t.tbody,{children:[(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`--checkSecurity`})}),(0,O.jsx)(t.td,{children:`Enable security vulnerability checking`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`--forceSecurityRefactor`})}),(0,O.jsx)(t.td,{children:`Automatically apply security fixes without prompting`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`--securityProvider <provider>`})}),(0,O.jsx)(t.td,{children:`Specify one or more security providers`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`--securityProviderToken <token>`})}),(0,O.jsx)(t.td,{children:`Provide an authentication token for one-off/local use`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`--interactive`})}),(0,O.jsx)(t.td,{children:`Use interactive mode to select fixes`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`--hasWorkspaceSecurityChecks`})}),(0,O.jsx)(t.td,{children:`Include workspace packages in the security scan`})]}),(0,O.jsxs)(t.tr,{children:[(0,O.jsx)(t.td,{children:(0,O.jsx)(t.code,{children:`--strict`})}),(0,O.jsx)(t.td,{children:`Fail on provider, network, or API errors`})]})]})]}),`
`,(0,O.jsx)(t.h3,{id:`token-handling`,children:`Token Handling`}),`
`,(0,O.jsxs)(t.p,{children:[`Set provider tokens with environment variables whenever possible:
`,(0,O.jsx)(t.code,{children:`GITHUB_TOKEN`}),`, `,(0,O.jsx)(t.code,{children:`SNYK_TOKEN`}),`, `,(0,O.jsx)(t.code,{children:`SOCKET_SECURITY_API_KEY`}),`, or `,(0,O.jsx)(t.code,{children:`SPEKTION_API_KEY`}),`.
`,(0,O.jsx)(t.code,{children:`securityProviderToken`}),` remains available for controlled local or generated
config, but do not commit real tokens to the repository.`]}),`
`,(0,O.jsx)(t.h2,{id:`release-assurance`,children:`Release Assurance`}),`
`,(0,O.jsx)(t.p,{children:`Pastoralist npm releases are published from GitHub Actions with npm provenance.
The release workflow also packs the npm tarball before publishing and creates a
GitHub artifact attestation for that exact tarball.`}),`
`,(0,O.jsx)(t.p,{children:`You can inspect provenance on the npm package page and verify registry
signatures from your own project:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npm audit signatures
`})}),`
`,(0,O.jsx)(t.p,{children:`These checks prove where the package was built and which artifact was published.
They do not prove the code is bug-free, so the project also runs CI, CodeQL,
OpenSSF Scorecard, dependency update policy checks, and unit, integration, and
e2e tests.`}),`
`,(0,O.jsx)(t.h2,{id:`security-providers`,children:`Security Providers`}),`
`,(0,O.jsx)(t.h3,{id:`osv-open-source-vulnerabilities`,children:`OSV (Open Source Vulnerabilities)`}),`
`,(0,O.jsx)(t.p,{children:`Free and requires no token.`}),`
`,(0,O.jsxs)(t.p,{children:[`The `,(0,O.jsx)(t.a,{href:`https://osv.dev/`,children:`OSV database`}),` is a distributed vulnerability database for open source, created by Google and the open source community.`]}),`
`,(0,O.jsx)(t.h3,{id:`github-provider`,children:`GitHub Provider`}),`
`,(0,O.jsx)(t.p,{children:`Requires a token but provides more in-depth security awareness, including transitive dependencies.`}),`
`,(0,O.jsx)(t.p,{children:`The GitHub provider uses Dependabot alerts to check for vulnerabilities. This provider queries GitHub's Dependabot API for your repository.`}),`
`,(0,O.jsx)(t.h4,{id:`setup`,children:`Setup`}),`
`,(0,O.jsx)(t.p,{children:`The GitHub provider supports two authentication methods:`}),`
`,(0,O.jsx)(t.p,{children:(0,O.jsx)(t.strong,{children:`Option 1: GitHub CLI (Recommended)`})}),`
`,(0,O.jsxs)(t.p,{children:[`If you have the `,(0,O.jsx)(t.a,{href:`https://cli.github.com/`,children:`GitHub CLI`}),` installed and authenticated, no additional setup is required:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Install and authenticate gh CLI
gh auth login

# Run pastoralist with GitHub provider
pastoralist --checkSecurity --securityProvider github
`})}),`
`,(0,O.jsx)(t.p,{children:(0,O.jsx)(t.strong,{children:`Option 2: Personal Access Token`})}),`
`,(0,O.jsx)(t.p,{children:`If you don't have the GitHub CLI, you can provide a GitHub token:`}),`
`,(0,O.jsxs)(t.ol,{children:[`
`,(0,O.jsxs)(t.li,{children:[`Create a personal access token at `,(0,O.jsx)(t.a,{href:`https://github.com/settings/tokens`,children:`https://github.com/settings/tokens`}),` with `,(0,O.jsx)(t.code,{children:`repo`}),` scope`]}),`
`,(0,O.jsxs)(t.li,{children:[`Set the token as an environment variable:`,`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`export GITHUB_TOKEN=your_token_here
`})}),`
`]}),`
`,(0,O.jsxs)(t.li,{children:[`Or pass it via CLI in one-off/local use:`,`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`pastoralist --checkSecurity --securityProvider github --securityProviderToken your_token_here
`})}),`
`]}),`
`]}),`
`,(0,O.jsx)(t.h4,{id:`cicd-permissions`,children:`CI/CD Permissions`}),`
`,(0,O.jsx)(t.p,{children:`When using the GitHub provider in CI workflows, you need to:`}),`
`,(0,O.jsxs)(t.ol,{children:[`
`,(0,O.jsx)(t.li,{children:(0,O.jsx)(t.strong,{children:`Add workflow permissions:`})}),`
`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-yaml`,children:`permissions:
  contents: read
  vulnerability-alerts: read
`})}),`
`,(0,O.jsxs)(t.ol,{start:`2`,children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`Enable Dependabot alerts`}),` in your repository: Settings → Code security and analysis → Dependabot alerts`]}),`
`]}),`
`,(0,O.jsx)(t.p,{children:`If permissions are insufficient, Pastoralist will display a warning with guidance and continue (your workflow won't fail).`}),`
`,(0,O.jsx)(t.h3,{id:`npm-audit-provider`,children:`npm Audit Provider`}),`
`,(0,O.jsx)(t.p,{children:`Runs the current package manager's audit command and converts the result into
Pastoralist security alerts.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`pastoralist --checkSecurity --securityProvider npm
`})}),`
`,(0,O.jsx)(t.p,{children:`This provider uses the package manager detected for the project: npm, Yarn,
pnpm, or Bun.`}),`
`,(0,O.jsx)(t.h3,{id:`snyk-provider-experimental`,children:`Snyk Provider [EXPERIMENTAL]`}),`
`,(0,O.jsxs)(t.p,{children:[`:::caution[Experimental]
The Snyk provider is experimental and may have breaking changes. Report issues at `,(0,O.jsx)(t.a,{href:`https://github.com/yowainwright/pastoralist/issues`,children:`https://github.com/yowainwright/pastoralist/issues`}),`
:::`]}),`
`,(0,O.jsx)(t.p,{children:`Requires the Snyk CLI and API authentication token.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Set your Snyk token
export SNYK_TOKEN=your_token_here

# Run with Snyk provider
pastoralist --checkSecurity --securityProvider snyk
`})}),`
`,(0,O.jsx)(t.h3,{id:`socket-provider-experimental`,children:`Socket Provider [EXPERIMENTAL]`}),`
`,(0,O.jsxs)(t.p,{children:[`:::caution[Experimental]
The Socket provider is experimental and may have breaking changes. Report issues at `,(0,O.jsx)(t.a,{href:`https://github.com/yowainwright/pastoralist/issues`,children:`https://github.com/yowainwright/pastoralist/issues`}),`
:::`]}),`
`,(0,O.jsx)(t.p,{children:`Requires the Socket CLI and API key.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Set your Socket API key
export SOCKET_SECURITY_API_KEY=your_key_here

# Run with Socket provider
pastoralist --checkSecurity --securityProvider socket
`})}),`
`,(0,O.jsx)(t.h3,{id:`spektion-provider-experimental`,children:`Spektion Provider [EXPERIMENTAL]`}),`
`,(0,O.jsxs)(t.p,{children:[`:::caution[Experimental]
The Spektion provider is experimental and may have breaking changes. Report issues at `,(0,O.jsx)(t.a,{href:`https://github.com/yowainwright/pastoralist/issues`,children:`https://github.com/yowainwright/pastoralist/issues`}),`
:::`]}),`
`,(0,O.jsx)(t.p,{children:`Requires a Spektion API key.`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Set your Spektion API key
export SPEKTION_API_KEY=your_key_here

# Run with Spektion provider
pastoralist --checkSecurity --securityProvider spektion
`})}),`
`,(0,O.jsx)(t.h2,{id:`cve-tracking-in-the-ledger`,children:`CVE Tracking in the Ledger`}),`
`,(0,O.jsxs)(t.p,{children:[`Every appendix entry has a `,(0,O.jsx)(t.code,{children:`ledger`}),`. When a security provider detects a fix,
Pastoralist adds CVE, severity, provider, and vulnerable-range metadata to that
ledger alongside the `,(0,O.jsx)(t.code,{children:`addedDate`}),`:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsxs)(t.p,{children:[`Multiple CVEs from the same package are aggregated — `,(0,O.jsx)(t.code,{children:`cveDetails`}),` gives per-CVE granularity (severity and patched version per identifier), while `,(0,O.jsx)(t.code,{children:`cves`}),` is the deduplicated flat list for quick reference.`]}),`
`,(0,O.jsxs)(t.h2,{id:`keeping-security-overrides-with-keep`,children:[`Keeping Security Overrides with `,(0,O.jsx)(t.code,{children:`keep`})]}),`
`,(0,O.jsxs)(t.p,{children:[`By default, `,(0,O.jsx)(t.code,{children:`--remove-unused`}),` will remove overrides whose dependents no longer require them. For security overrides you want to retain regardless, set `,(0,O.jsx)(t.code,{children:`keep`}),` on the ledger:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "ledger": {
    "addedDate": "2026-05-30T00:00:00.000Z",
    "cves": ["CVE-2024-12345"],
    "keep": true
  }
}
`})}),`
`,(0,O.jsxs)(t.p,{children:[`For expiring keeps, use a `,(0,O.jsx)(t.code,{children:`KeepConstraint`}),` object:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "ledger": {
    "addedDate": "2026-05-30T00:00:00.000Z",
    "cves": ["CVE-2024-12345"],
    "keep": {
      "reason": "Waiting for upstream patch",
      "untilVersion": "4.18.0"
    }
  }
}
`})}),`
`,(0,O.jsxs)(t.p,{children:[`Once the root dependency reaches `,(0,O.jsx)(t.code,{children:`4.18.0`}),`, the keep is considered expired and `,(0,O.jsx)(t.code,{children:`--remove-unused`}),` will treat it as removable again.`]}),`
`,(0,O.jsx)(t.h2,{id:`how-it-works`,children:`How It Works`}),`
`,(0,O.jsxs)(t.ol,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`Scanning`}),`: Pastoralist extracts all dependencies from your `,(0,O.jsx)(t.code,{children:`package.json`}),` (and optionally workspace packages)`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`Checking`}),`: Dependencies are checked against the configured provider or providers`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`Reporting`}),`: Vulnerable packages are displayed with severity levels and available fixes`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`Fixing`}),`: If fixes are available, Pastoralist can:`,`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsx)(t.li,{children:`Display them for review`}),`
`,(0,O.jsxs)(t.li,{children:[`Apply them automatically (with `,(0,O.jsx)(t.code,{children:`--forceSecurityRefactor`}),`)`]}),`
`,(0,O.jsxs)(t.li,{children:[`Let you choose interactively (with `,(0,O.jsx)(t.code,{children:`--interactive`}),`)`]}),`
`]}),`
`]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`Applying`}),`: Selected fixes are added to your `,(0,O.jsx)(t.code,{children:`package.json`}),` overrides section with full CVE context in the ledger`]}),`
`]}),`
`,(0,O.jsx)(t.h2,{id:`example-output`,children:`Example Output`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-text`,children:`pastoralist checking for security vulnerabilities...

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
`})}),`
`,(0,O.jsx)(t.h2,{id:`performance-considerations`,children:`Performance Considerations`}),`
`,(0,O.jsx)(t.p,{children:`:::caution[Performance Impact]`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[`Security scanning is `,(0,O.jsx)(t.strong,{children:`disabled by default`}),` to maintain fast performance`]}),`
`,(0,O.jsxs)(t.li,{children:[`Workspace scanning is `,(0,O.jsx)(t.strong,{children:`opt-in`}),` via the `,(0,O.jsx)(t.code,{children:`hasWorkspaceSecurityChecks`}),` option`]}),`
`,(0,O.jsx)(t.li,{children:`The OSV provider is optimized for batch queries`}),`
`,(0,O.jsx)(t.li,{children:`Provider results can be cached using the CLI cache options`}),`
`,(0,O.jsx)(t.li,{children:`Results are processed in parallel when possible
:::`}),`
`]}),`
`,(0,O.jsx)(t.h2,{id:`limitations`,children:`Limitations`}),`
`,(0,O.jsx)(t.p,{children:`:::note[Current Limitations]`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsx)(t.li,{children:`Security checks focus on npm ecosystem packages`}),`
`,(0,O.jsx)(t.li,{children:`Some providers require credentials or local CLI access`}),`
`,(0,O.jsx)(t.li,{children:`Some vulnerabilities may not have available fixes
:::`}),`
`]}),`
`,(0,O.jsx)(t.h2,{id:`troubleshooting`,children:`Troubleshooting`}),`
`,(0,O.jsx)(t.h3,{id:`no-vulnerabilities-found-when-expected`,children:`No vulnerabilities found when expected`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsx)(t.li,{children:`Ensure you're using the latest version of pastoralist`}),`
`,(0,O.jsx)(t.li,{children:`Check that your dependencies are correctly specified in package.json`}),`
`,(0,O.jsxs)(t.li,{children:[`Try running with `,(0,O.jsx)(t.code,{children:`--debug`}),` to see detailed logs`]}),`
`]}),`
`,(0,O.jsx)(t.h3,{id:`fixes-not-being-applied`,children:`Fixes not being applied`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsx)(t.li,{children:`Verify you have write permissions to package.json`}),`
`,(0,O.jsx)(t.li,{children:`Check for existing overrides that might conflict`}),`
`,(0,O.jsx)(t.li,{children:`Ensure the package manager supports overrides`}),`
`]}),`
`,(0,O.jsx)(t.h3,{id:`performance-issues`,children:`Performance issues`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsx)(t.li,{children:`Disable workspace scanning if not needed`}),`
`,(0,O.jsxs)(t.li,{children:[`Consider excluding large dependency trees with `,(0,O.jsx)(t.code,{children:`excludePackages`})]}),`
`,(0,O.jsx)(t.li,{children:`Use severity threshold to limit results`}),`
`]}),`
`,(0,O.jsx)(t.h3,{id:`github-provider-shows-security-check-skipped`,children:`GitHub provider shows "security check skipped"`}),`
`,(0,O.jsx)(t.p,{children:`This happens when the GitHub API can't access Dependabot alerts. To fix:`}),`
`,(0,O.jsxs)(t.ol,{children:[`
`,(0,O.jsxs)(t.li,{children:[`Add `,(0,O.jsx)(t.code,{children:`vulnerability-alerts: read`}),` permission to your workflow`]}),`
`,(0,O.jsx)(t.li,{children:`Enable Dependabot alerts in Settings → Code security and analysis`}),`
`,(0,O.jsxs)(t.li,{children:[`Ensure the `,(0,O.jsx)(t.code,{children:`GITHUB_TOKEN`}),` is available in your workflow`]}),`
`]}),`
`,(0,O.jsx)(t.p,{children:`Pastoralist will show specific guidance in the warning message.`}),`
`,(0,O.jsx)(t.h2,{id:`example-cicd-integration`,children:`Example: CI/CD Integration`}),`
`,(0,O.jsx)(t.h3,{id:`github-actions`,children:`GitHub Actions`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-yaml`,children:`name: Security Check
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
`})}),`
`,(0,O.jsx)(t.p,{children:`For OSV provider (no permissions needed):`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-yaml`,children:`name: Security Check
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v6.4.0
      - run: npm install
      - run: npx pastoralist --checkSecurity
`})}),`
`,(0,O.jsx)(t.h3,{id:`gitlab-ci`,children:`GitLab CI`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-yaml`,children:`security:
  script:
    - npm install
    - npx pastoralist --checkSecurity
  only:
    - main
    - merge_requests
`})})]})}function Dn(e={}){let{wrapper:t}=e.components||{};return t?(0,O.jsx)(t,{...e,children:(0,O.jsx)(En,{...e})}):En(e)}var On=t({default:()=>An});function kn(e){let t={a:`a`,code:`code`,h2:`h2`,p:`p`,pre:`pre`,...e.components};return(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)(t.h2,{id:`install`,children:`Install`}),`
`,(0,O.jsx)(t.p,{children:`Add Pastoralist as a dev dependency:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npm install pastoralist --save-dev
`})}),`
`,(0,O.jsx)(t.p,{children:`Other package managers work too:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`pnpm add pastoralist --save-dev
yarn add pastoralist --dev
bun add pastoralist --dev
`})}),`
`,(0,O.jsx)(t.h2,{id:`initialize`,children:`Initialize`}),`
`,(0,O.jsx)(t.p,{children:`Run a read-only setup and override health check first:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist doctor
`})}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.code,{children:`doctor`}),` runs in dry-run summary mode, so it shows current override health
without modifying `,(0,O.jsx)(t.code,{children:`package.json`}),`.`]}),`
`,(0,O.jsx)(t.p,{children:`Print the full first-run checklist when you want local setup, agent setup, and
CI setup in one place:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist onboard
`})}),`
`,(0,O.jsx)(t.p,{children:`Install the Pastoralist agent skill in a repo:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --init agent-skill
`})}),`
`,(0,O.jsx)(t.p,{children:`Set up local dev with selected skills and hooks:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx -p pastoralist pastoralist-setup-local-dev --skills all --hooks git,postinstall
`})}),`
`,(0,O.jsx)(t.p,{children:`Run the guided setup:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist init
`})}),`
`,(0,O.jsxs)(t.p,{children:[`The initializer can detect workspace packages, ask whether security checks
should run, and save the configuration in `,(0,O.jsx)(t.code,{children:`package.json`}),` or a config file.`]}),`
`,(0,O.jsx)(t.p,{children:`For a simple project, you can also run Pastoralist directly:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist
`})}),`
`,(0,O.jsxs)(t.p,{children:[`It will scan your package manager overrides or resolutions, update the
`,(0,O.jsx)(t.code,{children:`pastoralist.appendix`}),`, and leave unrelated package fields alone.`]}),`
`,(0,O.jsx)(t.h2,{id:`add-the-install-hook`,children:`Add The Install Hook`}),`
`,(0,O.jsx)(t.p,{children:`Most projects should run Pastoralist after dependency installs:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
`})}),`
`,(0,O.jsx)(t.p,{children:`Pastoralist can add that hook automatically:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --setup-hook
`})}),`
`,(0,O.jsx)(t.h2,{id:`verify-changes`,children:`Verify Changes`}),`
`,(0,O.jsx)(t.p,{children:`Preview the package.json update before writing anything:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --dry-run
`})}),`
`,(0,O.jsx)(t.p,{children:`Print summary metrics for CI or release checks:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --summary
`})}),`
`,(0,O.jsx)(t.p,{children:`Remove overrides that no package still depends on:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --remove-unused
`})}),`
`,(0,O.jsx)(t.h2,{id:`common-starting-config`,children:`Common Starting Config`}),`
`,(0,O.jsx)(t.p,{children:`For a workspace project with OSV security checks:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsxs)(t.p,{children:[`Next, read `,(0,O.jsx)(t.a,{href:`/docs/configuration`,children:`Configuration`}),` for all options or
`,(0,O.jsx)(t.a,{href:`/docs/workspaces`,children:`Workspaces & Monorepos`}),` for monorepo setup.`]})]})}function An(e={}){let{wrapper:t}=e.components||{};return t?(0,O.jsx)(t,{...e,children:(0,O.jsx)(kn,{...e})}):kn(e)}var jn=t({default:()=>Nn});function Mn(e){let t={a:`a`,code:`code`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)(t.h2,{id:`frequently-asked-questions`,children:`Frequently Asked Questions`}),`
`,(0,O.jsx)(t.h3,{id:`what-is-pastoralist`,children:`What is pastoralist?`}),`
`,(0,O.jsxs)(t.p,{children:[`Pastoralist manages npm and Bun `,(0,O.jsx)(t.code,{children:`overrides`}),`, pnpm `,(0,O.jsx)(t.code,{children:`pnpm.overrides`}),`, and Yarn
`,(0,O.jsx)(t.code,{children:`resolutions`}),` by creating an appendix that documents why each override exists
and which packages depend on it.`]}),`
`,(0,O.jsx)(t.h3,{id:`why-do-i-need-pastoralist`,children:`Why do I need pastoralist?`}),`
`,(0,O.jsx)(t.p,{children:`Without pastoralist, it's easy to forget why an override was added, which
packages still need it, or whether it's safe to remove.`}),`
`,(0,O.jsx)(t.h3,{id:`does-pastoralist-work-with-yarn-pnpm-and-bun`,children:`Does pastoralist work with Yarn, pnpm, and Bun?`}),`
`,(0,O.jsx)(t.p,{children:`Yes. Pastoralist reads and writes the override field your package manager uses:`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`npm and Bun`}),`: `,(0,O.jsx)(t.code,{children:`overrides`})]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`pnpm`}),`: `,(0,O.jsx)(t.code,{children:`pnpm.overrides`})]}),`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.strong,{children:`Yarn`}),`: `,(0,O.jsx)(t.code,{children:`resolutions`})]}),`
`]}),`
`,(0,O.jsx)(t.h3,{id:`is-pastoralist-safe-to-use`,children:`Is pastoralist safe to use?`}),`
`,(0,O.jsx)(t.p,{children:`Pastoralist is designed to keep changes reviewable:`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[`Only modifies override/resolution fields and the `,(0,O.jsx)(t.code,{children:`pastoralist`}),` section of package.json`]}),`
`,(0,O.jsx)(t.li,{children:`Normalizes package.json output to two-space JSON`}),`
`,(0,O.jsx)(t.li,{children:`Leaves changes visible in git so you can review or revert them`}),`
`,(0,O.jsx)(t.li,{children:`Creates a temporary backup before security auto-fix writes package.json`}),`
`]}),`
`,(0,O.jsx)(t.h3,{id:`when-should-overrides-be-used`,children:`When should overrides be used?`}),`
`,(0,O.jsx)(t.p,{children:`Use overrides for:`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsx)(t.li,{children:`Security patches before upstream updates`}),`
`,(0,O.jsx)(t.li,{children:`Compatibility issues between packages`}),`
`,(0,O.jsx)(t.li,{children:`Bug fixes not yet released`}),`
`,(0,O.jsx)(t.li,{children:`Temporary workarounds`}),`
`]}),`
`,(0,O.jsx)(t.h2,{id:`common-issues`,children:`Common Issues`}),`
`,(0,O.jsx)(t.h3,{id:`overrides-not-being-removed`,children:`Overrides Not Being Removed`}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.strong,{children:`Problem:`}),` Pastoralist isn't removing overrides that seem unnecessary.`]}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.strong,{children:`Solution:`}),` The override might still be needed by a transitive dependency. Run with debug mode to see why:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --debug
`})}),`
`,(0,O.jsx)(t.p,{children:`Look for output showing which packages require the override.`}),`
`,(0,O.jsx)(t.h3,{id:`packagejson-formatting-changes`,children:`Package.json Formatting Changes`}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.strong,{children:`Problem:`}),` Pastoralist changes the formatting of my package.json.`]}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.strong,{children:`Solution:`}),` Pastoralist rewrites `,(0,O.jsx)(t.code,{children:`package.json`}),` as two-space JSON. If you see unexpected changes:`]}),`
`,(0,O.jsxs)(t.ol,{children:[`
`,(0,O.jsx)(t.li,{children:`Ensure you're using the latest version`}),`
`,(0,O.jsxs)(t.li,{children:[`Check if you have a `,(0,O.jsx)(t.code,{children:`.prettierrc`}),` or `,(0,O.jsx)(t.code,{children:`.editorconfig`}),` that might conflict`]}),`
`,(0,O.jsx)(t.li,{children:`Consider running a formatter after pastoralist`}),`
`]}),`
`,(0,O.jsx)(t.h3,{id:`patches-not-detected`,children:`Patches Not Detected`}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.strong,{children:`Problem:`}),` My patch files aren't being tracked in the appendix.`]}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.strong,{children:`Solution:`}),` Ensure patches follow the standard naming convention:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{children:`patches/
├── package-name+1.0.0.patch    # Correct
├── package-name@1.0.0.patch    # Incorrect
└── custom-patch.patch          # Won't be detected
`})}),`
`,(0,O.jsx)(t.h3,{id:`performance-issues`,children:`Performance Issues`}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.strong,{children:`Problem:`}),` Pastoralist takes a long time to run.`]}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.strong,{children:`Solution:`}),` For large monorepos:`]}),`
`,(0,O.jsxs)(t.ol,{children:[`
`,(0,O.jsx)(t.li,{children:`Run on specific packages instead of all at once`}),`
`,(0,O.jsxs)(t.li,{children:[`Use `,(0,O.jsx)(t.code,{children:`--ignore`}),` to skip unnecessary directories`]}),`
`,(0,O.jsx)(t.li,{children:`Run packages in parallel:`}),`
`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Instead of
pastoralist --depPaths "**/*package.json"

# Try
find . -name "package.json" -not -path "*/node_modules/*" | \\
  xargs -P 4 -I {} npx pastoralist --path {}
`})}),`
`,(0,O.jsx)(t.h3,{id:`monorepo-override-conflicts`,children:`Monorepo Override Conflicts`}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.strong,{children:`Problem:`}),` Different packages in my monorepo need different versions.`]}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.strong,{children:`Solution:`}),` Use package-specific overrides:`]}),`
`,(0,O.jsx)(t.p,{children:`Root package.json can hold shared security patches:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "overrides": {
    "minimist": "1.2.8"
  }
}
`})}),`
`,(0,O.jsx)(t.p,{children:`Packages can hold their own compatibility requirements:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "overrides": {
    "react": "17.0.2"
  }
}
`})}),`
`,(0,O.jsx)(t.h3,{id:`ci-failures`,children:`CI Failures`}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.strong,{children:`Problem:`}),` CI fails saying package.json was modified.`]}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.strong,{children:`Solution:`}),` Run pastoralist locally and commit the changes:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist
git add package.json
git commit -m "Update override appendix"
`})}),`
`,(0,O.jsx)(t.p,{children:`Then add to your CI check:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-yaml`,children:`- run: npx pastoralist
- run: git diff --exit-code package.json
`})}),`
`,(0,O.jsx)(t.h2,{id:`debug-mode`,children:`Debug Mode`}),`
`,(0,O.jsx)(t.p,{children:`Enable debug mode for detailed information:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx pastoralist --debug
`})}),`
`,(0,O.jsx)(t.p,{children:`Debug output includes:`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsx)(t.li,{children:`Package resolution paths`}),`
`,(0,O.jsx)(t.li,{children:`Dependency tree analysis`}),`
`,(0,O.jsx)(t.li,{children:`Override usage detection`}),`
`,(0,O.jsx)(t.li,{children:`File operation details`}),`
`]}),`
`,(0,O.jsx)(t.h2,{id:`error-messages`,children:`Error Messages`}),`
`,(0,O.jsx)(t.h3,{id:`cannot-find-packagejson`,children:`"Cannot find package.json"`}),`
`,(0,O.jsx)(t.p,{children:`Pastoralist can't locate your package.json. Solutions:`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsx)(t.li,{children:`Run from project root`}),`
`,(0,O.jsxs)(t.li,{children:[`Use `,(0,O.jsx)(t.code,{children:`--path`}),` to specify location`]}),`
`,(0,O.jsx)(t.li,{children:`Check file permissions`}),`
`]}),`
`,(0,O.jsx)(t.h3,{id:`invalid-packagejson`,children:`"Invalid package.json"`}),`
`,(0,O.jsx)(t.p,{children:`Your package.json has syntax errors. Validate with:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`npx json package.json
`})}),`
`,(0,O.jsx)(t.h3,{id:`no-overrides-found`,children:`"No overrides found"`}),`
`,(0,O.jsx)(t.p,{children:`This is normal if you don't have any overrides. Pastoralist will:`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsx)(t.li,{children:`Clean up any existing appendix`}),`
`,(0,O.jsx)(t.li,{children:`Exit successfully`}),`
`]}),`
`,(0,O.jsx)(t.h2,{id:`best-practices`,children:`Best Practices`}),`
`,(0,O.jsx)(t.h3,{id:`1-regular-updates`,children:`1. Regular Updates`}),`
`,(0,O.jsx)(t.p,{children:`Run pastoralist regularly:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
`})}),`
`,(0,O.jsx)(t.h3,{id:`2-document-override-reasons`,children:`2. Document Override Reasons`}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.code,{children:`package.json`}),` does not support comments. Every appendix entry has a `,(0,O.jsx)(t.code,{children:`ledger`}),`;
add a `,(0,O.jsx)(t.code,{children:`reason`}),` to it (or provide manual reasons when you generate the appendix):`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsx)(t.h3,{id:`3-monitor-patch-files`,children:`3. Monitor Patch Files`}),`
`,(0,O.jsx)(t.p,{children:`When you see this warning:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{children:`🐑 Found potentially unused patch files:
  - patches/old-package+1.0.0.patch
`})}),`
`,(0,O.jsx)(t.p,{children:`Review and remove unused patches to keep your repo clean.`}),`
`,(0,O.jsx)(t.h2,{id:`getting-help`,children:`Getting Help`}),`
`,(0,O.jsx)(t.h3,{id:`resources`,children:`Resources`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[(0,O.jsx)(t.a,{href:`https://github.com/yowainwright/pastoralist/issues`,children:`GitHub Issues`}),` - Report bugs & ask questions`]}),`
`]}),`
`,(0,O.jsx)(t.h3,{id:`before-filing-an-issue`,children:`Before Filing an Issue`}),`
`,(0,O.jsxs)(t.ol,{children:[`
`,(0,O.jsx)(t.li,{children:`Update to the latest version`}),`
`,(0,O.jsxs)(t.li,{children:[`Run with `,(0,O.jsx)(t.code,{children:`--debug`}),` flag`]}),`
`,(0,O.jsx)(t.li,{children:`Check existing issues`}),`
`,(0,O.jsx)(t.li,{children:`Provide minimal reproduction`}),`
`]}),`
`,(0,O.jsx)(t.h3,{id:`issue-template`,children:`Issue Template`}),`
`,(0,O.jsx)(t.p,{children:`When reporting issues, include:`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsx)(t.li,{children:`Pastoralist version`}),`
`,(0,O.jsx)(t.li,{children:`Node.js version`}),`
`,(0,O.jsx)(t.li,{children:`Package manager (npm/yarn/pnpm)`}),`
`,(0,O.jsx)(t.li,{children:`Relevant package.json sections`}),`
`,(0,O.jsx)(t.li,{children:`Debug output`}),`
`]}),`
`,(0,O.jsx)(t.h2,{id:`migration-help`,children:`Migration Help`}),`
`,(0,O.jsx)(t.h3,{id:`from-manual-management`,children:`From Manual Management`}),`
`,(0,O.jsx)(t.p,{children:`If you're tracking overrides manually in docs or issue trackers, Pastoralist will:`}),`
`,(0,O.jsxs)(t.ol,{children:[`
`,(0,O.jsxs)(t.li,{children:[`Document all current overrides in `,(0,O.jsx)(t.code,{children:`pastoralist.appendix`})]}),`
`,(0,O.jsx)(t.li,{children:`Track their usage going forward`}),`
`,(0,O.jsxs)(t.li,{children:[`Flag unused overrides and remove them when you run with `,(0,O.jsx)(t.code,{children:`--remove-unused`})]}),`
`]}),`
`,(0,O.jsx)(t.h2,{id:`advanced-debugging`,children:`Advanced Debugging`}),`
`,(0,O.jsx)(t.h3,{id:`trace-dependency-paths`,children:`Trace Dependency Paths`}),`
`,(0,O.jsx)(t.p,{children:`To understand why an override is needed:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-javascript`,children:`// debug-override.js
import { resolveJSON, update } from "pastoralist";

const path = "./package.json";
const config = resolveJSON(path);

if (config) {
  update({ config, debug: true, path });
}

// Check the debug output for dependency paths
`})}),`
`,(0,O.jsx)(t.h3,{id:`analyze-appendix`,children:`Analyze Appendix`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-javascript`,children:`// analyze-appendix.js
import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
const appendix = pkg.pastoralist?.appendix || {};

console.log("Override Report:");
Object.entries(appendix).forEach(([override, info]) => {
  console.log(\`\\n\${override}:\`);
  console.log("  Dependents:", Object.keys(info.dependents || {}));
  console.log("  Patches:", info.patches || "none");
});
`})})]})}function Nn(e={}){let{wrapper:t}=e.components||{};return t?(0,O.jsx)(t,{...e,children:(0,O.jsx)(Mn,{...e})}):Mn(e)}var Pn=t({default:()=>In});function Fn(e){let t={code:`code`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)(t.p,{children:`Pastoralist works with workspace and monorepo setups. This guide covers how to
track root-level overrides while still showing which workspace packages depend
on them.`}),`
`,(0,O.jsx)(`a`,{href:`https://stackblitz.com/fork/github/yowainwright/pastoralist/tree/main/tests/sandboxes/monorepo?title=Pastoralist%20Monorepo&file=README.md&startScript=demo&view=editor`,target:`_blank`,rel:`noopener noreferrer`,children:(0,O.jsx)(`img`,{src:`https://developer.stackblitz.com/img/open_in_stackblitz.svg`,alt:`Open in StackBlitz`})}),`
`,(0,O.jsx)(t.h2,{id:`how-pastoralist-works-in-workspaces`,children:`How Pastoralist Works in Workspaces`}),`
`,(0,O.jsxs)(t.p,{children:[`Pastoralist updates one target `,(0,O.jsx)(t.code,{children:`package.json`}),`, usually the workspace root. When
`,(0,O.jsx)(t.code,{children:`depPaths`}),` is configured, it also reads workspace package manifests so the root
appendix can show which packages still need each override.`]}),`
`,(0,O.jsxs)(t.p,{children:[`You can also run it against an individual workspace package with `,(0,O.jsx)(t.code,{children:`--path`}),` when
that package owns its own override field.`]}),`
`,(0,O.jsx)(t.h2,{id:`configuration-methods`,children:`Configuration Methods`}),`
`,(0,O.jsx)(t.p,{children:`Pastoralist provides multiple ways to configure workspace scanning in monorepos:`}),`
`,(0,O.jsx)(t.h3,{id:`method-1-deppaths-in-packagejson-recommended`,children:`Method 1: depPaths in package.json (Recommended)`}),`
`,(0,O.jsxs)(t.p,{children:[`Configure dependency paths directly in your `,(0,O.jsx)(t.code,{children:`package.json`}),` for workspace
tracking:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsxs)(t.strong,{children:[`Using `,(0,O.jsx)(t.code,{children:`"workspace"`}),` string`]}),` - Pastoralist automatically uses all packages defined in your `,(0,O.jsx)(t.code,{children:`workspaces`}),` field. The appendix only appears in the root; workspace packages stay clean.`]}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.strong,{children:`Using array of paths`}),` - Specify custom paths to scan:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "pastoralist": {
    "depPaths": ["packages/app-a/package.json", "packages/app-b/package.json"]
  }
}
`})}),`
`,(0,O.jsxs)(t.p,{children:[`After running `,(0,O.jsx)(t.code,{children:`pastoralist`}),`, your root package.json will contain:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsxs)(t.p,{children:[`The workspace packages (`,(0,O.jsx)(t.code,{children:`packages/*/package.json`}),` and `,(0,O.jsx)(t.code,{children:`apps/*/package.json`}),`) remain clean without any pastoralist appendix.`]}),`
`,(0,O.jsx)(t.h3,{id:`method-2-cli-deppaths-flag`,children:`Method 2: CLI depPaths Flag`}),`
`,(0,O.jsx)(t.p,{children:`Specify paths at runtime:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Scan specific paths
pastoralist --depPaths "packages/*/package.json" "apps/*/package.json"

# CLI flags override package.json configuration
pastoralist --depPaths "packages/app-a/package.json"
`})}),`
`,(0,O.jsx)(t.h3,{id:`method-3-guided-configuration`,children:`Method 3: Guided Configuration`}),`
`,(0,O.jsx)(t.p,{children:`Pastoralist offers guided configuration for monorepo setups:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Initialize with guided setup
pastoralist init
`})}),`
`,(0,O.jsx)(t.p,{children:`The initializer can:`}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsxs)(t.li,{children:[`Detect `,(0,O.jsx)(t.code,{children:`workspaces`}),` entries from `,(0,O.jsx)(t.code,{children:`package.json`})]}),`
`,(0,O.jsxs)(t.li,{children:[`Let you choose `,(0,O.jsx)(t.code,{children:`depPaths: "workspace"`}),` or custom package globs`]}),`
`,(0,O.jsxs)(t.li,{children:[`Save configuration to `,(0,O.jsx)(t.code,{children:`package.json`}),` or a supported config file`]}),`
`,(0,O.jsx)(t.li,{children:`Optionally configure security scanning`}),`
`]}),`
`,(0,O.jsx)(t.h2,{id:`basic-usage`,children:`Basic Usage`}),`
`,(0,O.jsx)(t.h3,{id:`running-on-root-package`,children:`Running on Root Package`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Run on the root package.json
pastoralist
`})}),`
`,(0,O.jsxs)(t.p,{children:[`This will manage overrides in your root `,(0,O.jsx)(t.code,{children:`package.json`}),`, which affect all workspaces.`]}),`
`,(0,O.jsx)(t.h3,{id:`running-on-workspace-packages`,children:`Running on Workspace Packages`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Run on a specific workspace package
pastoralist --path packages/app-a/package.json

# Or navigate to the package
cd packages/app-a
pastoralist
`})}),`
`,(0,O.jsx)(t.h2,{id:`common-patterns`,children:`Common Patterns`}),`
`,(0,O.jsx)(t.h3,{id:`pattern-1-root-level-overrides`,children:`Pattern 1: Root-Level Overrides`}),`
`,(0,O.jsx)(t.p,{children:`Most monorepos use root-level overrides that apply to all workspaces:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "name": "my-monorepo",
  "workspaces": ["packages/*"],
  "overrides": {
    "lodash": "4.17.21",
    "react": "18.2.0"
  }
}
`})}),`
`,(0,O.jsx)(t.p,{children:`Run pastoralist at the root:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`pastoralist
`})}),`
`,(0,O.jsx)(t.h3,{id:`pattern-2-package-specific-overrides`,children:`Pattern 2: Package-Specific Overrides`}),`
`,(0,O.jsx)(t.p,{children:`Some packages may need their own overrides:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "name": "legacy-app",
  "overrides": {
    "react": "17.0.2"
  }
}
`})}),`
`,(0,O.jsx)(t.p,{children:`Run pastoralist for this package:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`pastoralist --path packages/legacy-app/package.json
`})}),`
`,(0,O.jsx)(t.h3,{id:`pattern-3-automated-workspace-management`,children:`Pattern 3: Automated Workspace Management`}),`
`,(0,O.jsxs)(t.p,{children:[`Most workspaces should avoid running Pastoralist separately in every package.
Keep shared overrides at the root and let `,(0,O.jsx)(t.code,{children:`depPaths`}),` read workspace manifests:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "workspaces": ["packages/*", "apps/*"],
  "pastoralist": {
    "depPaths": "workspace"
  },
  "scripts": {
    "pastoralist": "pastoralist"
  }
}
`})}),`
`,(0,O.jsxs)(t.p,{children:[`Use `,(0,O.jsx)(t.code,{children:`--path`}),` only for workspace packages that intentionally own their own
override field.`]}),`
`,(0,O.jsx)(t.h2,{id:`integration-strategies`,children:`Integration Strategies`}),`
`,(0,O.jsx)(t.h3,{id:`strategy-1-centralized-management-with-deppaths-recommended`,children:`Strategy 1: Centralized Management with depPaths (Recommended)`}),`
`,(0,O.jsxs)(t.p,{children:[`Keep all overrides in the root `,(0,O.jsx)(t.code,{children:`package.json`}),` and use `,(0,O.jsx)(t.code,{children:`depPaths`}),` configuration:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsx)(t.h3,{id:`strategy-2-distributed-management`,children:`Strategy 2: Distributed Management`}),`
`,(0,O.jsx)(t.p,{children:`Allow packages to manage their own overrides only when those overrides are
package-specific:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "overrides": {
    "react": "17.0.2"
  },
  "scripts": {
    "pastoralist": "pastoralist --path package.json"
  }
}
`})}),`
`,(0,O.jsx)(t.h3,{id:`strategy-3-hybrid-approach`,children:`Strategy 3: Hybrid Approach`}),`
`,(0,O.jsx)(t.p,{children:`Combine root overrides with package-specific ones:`}),`
`,(0,O.jsx)(t.p,{children:`Root overrides can hold shared security patches:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "overrides": {
    "minimist": "1.2.8"
  }
}
`})}),`
`,(0,O.jsx)(t.p,{children:`Package overrides can hold feature-specific constraints:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "overrides": {
    "react": "17.0.2"
  }
}
`})}),`
`,(0,O.jsx)(t.h2,{id:`package-manager-examples`,children:`Package Manager Examples`}),`
`,(0,O.jsx)(t.h3,{id:`npm-workspaces`,children:`npm Workspaces`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "name": "my-npm-workspace",
  "workspaces": ["packages/*", "apps/*"],
  "pastoralist": {
    "depPaths": "workspace"
  },
  "scripts": {
    "check-overrides": "pastoralist --dry-run"
  }
}
`})}),`
`,(0,O.jsx)(t.h3,{id:`pnpm-workspace`,children:`pnpm Workspace`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-yaml`,children:`# pnpm-workspace.yaml
packages:
  - "packages/*"
  - "apps/*"
`})}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
  "pastoralist": {
    "depPaths": "workspace"
  },
  "scripts": {
    "check-overrides": "pastoralist --dry-run"
  }
}
`})}),`
`,(0,O.jsx)(t.h3,{id:`yarn-workspaces`,children:`Yarn Workspaces`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-json`,children:`{
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
`})}),`
`,(0,O.jsx)(t.h2,{id:`best-practices`,children:`Best Practices`}),`
`,(0,O.jsx)(t.h3,{id:`cicd-integration`,children:`CI/CD Integration`}),`
`,(0,O.jsx)(t.p,{children:`Ensure overrides are valid in CI:`}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-yaml`,children:`- name: Validate overrides
  run: |
    npx pastoralist
    git diff --exit-code package.json
`})}),`
`,(0,O.jsx)(t.h2,{id:`troubleshooting`,children:`Troubleshooting`}),`
`,(0,O.jsx)(t.h3,{id:`issue-overrides-not-applied`,children:`Issue: Overrides Not Applied`}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.strong,{children:`Symptom:`}),` Workspace packages don't respect root overrides`]}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.strong,{children:`Solution:`}),` Ensure you're using a package manager that supports workspace overrides:`]}),`
`,(0,O.jsxs)(t.ul,{children:[`
`,(0,O.jsx)(t.li,{children:`npm 8.3+ ✅`}),`
`,(0,O.jsx)(t.li,{children:`yarn 1.x (use resolutions) ✅`}),`
`,(0,O.jsx)(t.li,{children:`pnpm (use pnpm.overrides) ✅`}),`
`]}),`
`,(0,O.jsx)(t.h3,{id:`issue-duplicate-appendix-entries`,children:`Issue: Duplicate Appendix Entries`}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.strong,{children:`Symptom:`}),` Same override tracked in multiple package.json files`]}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.strong,{children:`Solution:`}),` If the override is shared, move it to the root package and use
`,(0,O.jsx)(t.code,{children:`depPaths: "workspace"`}),`. If each package owns a different override, separate
appendixes are expected.`]}),`
`,(0,O.jsx)(t.h3,{id:`issue-performance-in-large-monorepos`,children:`Issue: Performance in Large Monorepos`}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.strong,{children:`Symptom:`}),` Pastoralist takes long to run across many packages`]}),`
`,(0,O.jsxs)(t.p,{children:[(0,O.jsx)(t.strong,{children:`Solution:`}),` First prefer `,(0,O.jsx)(t.code,{children:`depPaths: "workspace"`}),` so one root run reads the
workspace manifests. If you must scan packages individually, make sure your file
search excludes `,(0,O.jsx)(t.code,{children:`node_modules`}),`:`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`# Using GNU parallel for package-owned override fields
find . -name "node_modules" -prune -o -name "package.json" -print | \\
  parallel "pastoralist --path {}"
`})}),`
`,(0,O.jsx)(t.h2,{id:`migration-guide`,children:`Migration Guide`}),`
`,(0,O.jsx)(t.h3,{id:`moving-to-centralized-overrides`,children:`Moving to Centralized Overrides`}),`
`,(0,O.jsxs)(t.ol,{children:[`
`,(0,O.jsx)(t.li,{children:`Collect all overrides:`}),`
`]}),`
`,(0,O.jsx)(t.pre,{children:(0,O.jsx)(t.code,{className:`language-bash`,children:`find . -name "package.json" -not -path "*/node_modules/*" \\
  -exec jq '.overrides // {}' {} \\; | jq -s 'add'
`})}),`
`,(0,O.jsxs)(t.ol,{start:`2`,children:[`
`,(0,O.jsx)(t.li,{children:`Add to root package.json`}),`
`,(0,O.jsx)(t.li,{children:`Remove from individual packages`}),`
`,(0,O.jsx)(t.li,{children:`Run pastoralist at root`}),`
`]}),`
`,(0,O.jsx)(t.h3,{id:`splitting-overrides`,children:`Splitting Overrides`}),`
`,(0,O.jsxs)(t.ol,{children:[`
`,(0,O.jsx)(t.li,{children:`Identify package-specific needs`}),`
`,(0,O.jsx)(t.li,{children:`Move relevant overrides to packages`}),`
`,(0,O.jsx)(t.li,{children:`Run pastoralist on each package`}),`
`,(0,O.jsx)(t.li,{children:`Update CI/CD scripts`}),`
`]})]})}function In(e={}){let{wrapper:t}=e.components||{};return t?(0,O.jsx)(t,{...e,children:(0,O.jsx)(Fn,{...e})}):Fn(e)}var Ln=`---
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
`,Rn=`---
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
`,zn=`---
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
`,Bn=`---
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
`,Vn=`---
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
- **\`reason\`**: Why the override was needed (e.g., security issue description)
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
`,Hn=`---
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
`,Un=`---
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
  <a href="https://github.com/yowainwright/pastoralist" target="_blank" rel="noopener noreferrer">
    <img
      src="https://img.shields.io/github/stars/yowainwright/pastoralist?style=social"
      alt="GitHub stars"
    />
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
`,Wn=`---
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
`,Gn=`---
title: Security Vulnerability Detection
description: Detect and fix security vulnerabilities in your dependencies
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
`,Kn=`---
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
`,qn=`---
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
`,Jn=`---
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
`,Yn=[{slug:`introduction`,title:`Introduction to Pastoralist`,description:`Pastoralist keeps dependency overrides explainable, current, and removable`},{slug:`setup`,title:`Setup`,description:`Install Pastoralist and keep your override appendix current`},{slug:`onboarding`,title:`Onboarding`,description:`First-run checklist for local use, agent setup, and CI`},{slug:`security`,title:`Security Vulnerability Detection`,description:`Detect and fix security vulnerabilities in your dependencies`},{slug:`workspaces`,title:`Workspaces & Monorepos`,description:`Using pastoralist in workspace and monorepo environments`},{slug:`advanced-features`,title:`Advanced Features`,description:`Advanced cleanup, patch tracking, and override management workflows`},{slug:`codelab`,title:`Interactive Tutorial`,description:`Learn pastoralist step-by-step`},{slug:`api-reference`,title:`API Reference`,description:`Complete reference for pastoralist CLI and Node.js API`},{slug:`architecture`,title:`Architecture`,description:`Deep dive into how Pastoralist works, including overrides, resolutions, patches, and the object anatomy`},{slug:`troubleshooting`,title:`Troubleshooting & FAQ`,description:`Common issues and frequently asked questions`},{slug:`configuration`,title:`Configuration`,description:`Configure Pastoralist with package.json, rc files, or JavaScript config files`},{slug:`github-action`,title:`GitHub Action`,description:`Automated dependency override management for CI/CD`}],Xn=Object.assign({"./docs/advanced-features.mdx":$t,"./docs/api-reference.mdx":nn,"./docs/architecture.mdx":on,"./docs/codelab.mdx":un,"./docs/configuration.mdx":pn,"./docs/github-action.mdx":gn,"./docs/introduction.mdx":yn,"./docs/onboarding.mdx":Sn,"./docs/security.mdx":Tn,"./docs/setup.mdx":On,"./docs/troubleshooting.mdx":jn,"./docs/workspaces.mdx":Pn}),Zn=Object.assign({"./docs/advanced-features.mdx":Ln,"./docs/api-reference.mdx":Rn,"./docs/architecture.mdx":zn,"./docs/codelab.mdx":Bn,"./docs/configuration.mdx":Vn,"./docs/github-action.mdx":Hn,"./docs/introduction.mdx":Un,"./docs/onboarding.mdx":Wn,"./docs/security.mdx":Gn,"./docs/setup.mdx":Kn,"./docs/troubleshooting.mdx":qn,"./docs/workspaces.mdx":Jn});function Qn(e){return Yn.find(t=>t.slug===e)}function $n(e){return Zn[`./docs/${e}.mdx`]}function er(e){return Xn[`./docs/${e}.mdx`]?.default}function tr(){return Yn}var nr=e(a(),1),rr=(e,t)=>{let n=(0,b.useMemo)(()=>new _(e,{keys:[`title`,`description`,`content`],threshold:.3}),[e]);return(0,b.useMemo)(()=>t?n.search(t).slice(0,5).map(e=>e.item):[],[n,t])},ir=(e,t)=>{(0,b.useEffect)(()=>{let n=n=>{(n.metaKey||n.ctrlKey)&&n.key===`k`&&(n.preventDefault(),e()),n.key===`Escape`&&t()};return document.addEventListener(`keydown`,n),()=>document.removeEventListener(`keydown`,n)},[t,e])};function ar({iconOnly:e,onOpen:t}){return e?(0,O.jsxs)(`button`,{onClick:t,className:`btn btn-sm btn-ghost gap-1`,"aria-label":`Search (⌘K)`,children:[(0,O.jsx)(Kt,{className:`h-4 w-4`}),(0,O.jsx)(`kbd`,{className:`hidden rounded bg-base-200 px-1.5 py-0.5 text-xs font-medium text-base-content/60 lg:inline-flex`,children:`⌘K`})]}):(0,O.jsxs)(`button`,{onClick:t,className:`flex min-w-[200px] items-center gap-2 rounded-lg bg-base-200/50 px-3 py-1.5 text-sm text-base-content/60 transition-colors hover:bg-base-200 md:min-w-[300px]`,children:[(0,O.jsx)(Kt,{className:`h-4 w-4`}),(0,O.jsx)(`span`,{children:`Search documentation...`})]})}function or({onSelect:e}){return(0,O.jsxs)(`nav`,{className:`space-y-1 p-4`,"aria-label":`Recent documentation`,children:[(0,O.jsx)(`p`,{className:`px-2 text-xs font-medium uppercase text-base-content/40`,children:`Recent`}),(0,O.jsx)(c,{to:`/docs/$slug/`,params:{slug:`introduction`},onClick:e,className:`block rounded-lg px-3 py-2 text-sm hover:bg-base-200/50`,children:`Introduction to Pastoralist`}),(0,O.jsx)(c,{to:`/docs/$slug/`,params:{slug:`setup`},onClick:e,className:`block rounded-lg px-3 py-2 text-sm hover:bg-base-200/50`,children:`Setup Guide`})]})}function sr({query:e,results:t,onSelect:n}){return e?t.length===0?(0,O.jsx)(`p`,{className:`p-8 text-center text-base-content/60`,children:`No results found`}):(0,O.jsx)(`ul`,{className:`space-y-1 p-2`,children:t.map(e=>(0,O.jsx)(`li`,{children:(0,O.jsxs)(c,{to:`/docs/$slug/`,params:{slug:e.slug},onClick:n,className:`block rounded-lg px-4 py-3 transition-colors hover:bg-base-200/50`,children:[(0,O.jsx)(`strong`,{className:`block`,children:e.title}),(0,O.jsx)(`span`,{className:`mt-0.5 block text-sm text-base-content/60`,children:e.description})]})},e.slug))}):(0,O.jsx)(or,{onSelect:n})}function cr({query:e,results:t,inputRef:n,onQueryChange:r,onClose:i}){return(0,nr.createPortal)((0,O.jsx)(`div`,{className:`fixed inset-0 z-[101] bg-black/60 p-4 pt-[10vh] backdrop-blur-sm`,onClick:i,children:(0,O.jsxs)(`section`,{className:`mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-2xl`,onClick:e=>e.stopPropagation(),children:[(0,O.jsxs)(`label`,{className:`flex items-center border-b border-base-content/10 p-4`,children:[(0,O.jsx)(Kt,{className:`mr-3 h-5 w-5 text-[#1D4ED8]`}),(0,O.jsx)(`input`,{ref:n,value:e,onChange:e=>r(e.target.value),placeholder:`Search documentation...`,className:`flex-1 bg-transparent text-lg outline-none`})]}),(0,O.jsx)(`div`,{className:`max-h-[60vh] overflow-y-auto`,children:(0,O.jsx)(sr,{query:e,results:t,onSelect:i})})]})}),document.body)}function lr({searchData:e,iconOnly:t=!1}){let[n,r]=(0,b.useState)(!1),[i,a]=(0,b.useState)(``),o=(0,b.useRef)(null),s=rr(e,i),c=(0,b.useCallback)(()=>r(!0),[]),l=(0,b.useCallback)(()=>{r(!1),a(``)},[]);return ir(c,l),(0,b.useEffect)(()=>{n&&o.current?.focus()},[n]),(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)(ar,{iconOnly:t,onOpen:c}),n?(0,O.jsx)(cr,{query:i,results:s,inputRef:o,onQueryChange:a,onClose:l}):null]})}var ur=[{title:`Docs`,href:`/docs/introduction`,preload:`intent`}];function dr(){let{theme:e,toggle:t}=Qt(),n=d().pathname,r=tr().map(e=>({title:e.title,description:e.description,content:``,slug:e.slug})),i=`btn btn-sm btn-ghost swap swap-rotate btn-square ${e===`night`?`swap-active`:``}`,a=e=>e.includes(`/docs`)?n.includes(`/docs`):n===e,o=e=>`rounded-lg hover:text-[#1D4ED8] hover:bg-[#1D4ED8]/10 transition flex ${a(e)?`text-[#1D4ED8] bg-[#1D4ED8]/10`:``}`;return(0,O.jsx)(`header`,{className:`fixed top-0 z-[1000] w-full`,children:(0,O.jsxs)(`nav`,{className:`grid h-[68px] w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 border-b border-base-content/10 bg-base-100/80 px-2 py-2 backdrop-blur-3xl sm:gap-2 sm:px-4`,children:[(0,O.jsxs)(`div`,{className:`flex min-w-0 items-center gap-1 justify-self-start`,children:[(0,O.jsx)(`label`,{htmlFor:`my-drawer-2`,className:`btn btn-sm btn-ghost btn-square lg:hidden`,"aria-label":`toggle sidebar`,children:(0,O.jsx)(Wt,{className:`h-4 w-4`})}),(0,O.jsx)(c,{to:`/`,preload:`intent`,className:`btn btn-ghost min-w-0 px-1.5 sm:px-2`,children:(0,O.jsx)(`h1`,{className:`gradient-text truncate text-lg font-bold sm:text-2xl`,children:`Pastoralist`})})]}),(0,O.jsx)(`div`,{className:`justify-self-center`}),(0,O.jsxs)(`div`,{className:`flex items-center gap-1 justify-self-end`,children:[ur.map(e=>(0,O.jsx)(c,{to:e.href,preload:`intent`,className:`btn btn-sm btn-ghost hidden sm:flex ${o(e.href)}`,children:e.title},e.href)),(0,O.jsx)(lr,{searchData:r,iconOnly:!0}),(0,O.jsx)(`a`,{className:`btn btn-sm btn-ghost btn-square`,href:`https://github.com/yowainwright/pastoralist`,"aria-label":`github`,children:(0,O.jsx)(Jt,{className:`h-4 w-4`})}),(0,O.jsxs)(`button`,{"aria-label":`theme-toggle`,onClick:t,className:i,children:[(0,O.jsx)(qt,{className:`w-4 h-4 swap-off`}),(0,O.jsx)(Gt,{className:`w-4 h-4 swap-on`})]})]})]})})}function fr(e){let t=`/pastoralist`;return e===``?t.endsWith(`/`)?t.slice(0,-1):t:(t.endsWith(`/`)?t:`/pastoralist/`)+(e.startsWith(`/`)?e.slice(1):e)}function U(e){return fr(`docs/${e}`)}var W=[{title:`Getting Started`,items:[{title:`Introduction`,href:U(`introduction`)},{title:`Setup`,href:U(`setup`)},{title:`Onboarding`,href:U(`onboarding`)}]},{title:`Features`,items:[{title:`Security Scanning`,href:U(`security`)},{title:`Workspaces & Monorepos`,href:U(`workspaces`)},{title:`Advanced Features`,href:U(`advanced-features`)}]},{title:`Codelabs`,items:[{title:`Basic Usage`,href:U(`codelab`)}]},{title:`Reference`,items:[{title:`API Reference`,href:U(`api-reference`)},{title:`GitHub Action`,href:U(`github-action`)},{title:`Architecture`,href:U(`architecture`)},{title:`Troubleshooting & FAQ`,href:U(`troubleshooting`)}]}],pr=(e,t)=>e.map((e,n)=>n===t?!e:e);function mr({onClose:e=()=>void 0}){let t=d().pathname,[n,r]=(0,b.useState)(()=>W.map(()=>!0)),i=e=>{r(t=>pr(t,e))},a=W.map((e,r)=>(0,O.jsx)(hr,{section:e,isOpen:n[r],onToggle:()=>i(r),pathname:t},e.title));return(0,O.jsxs)(`aside`,{className:`drawer-side`,children:[(0,O.jsx)(`label`,{htmlFor:`my-drawer-2`,className:`drawer-overlay lg:hidden bg-transparent`,onClick:e}),(0,O.jsx)(`nav`,{className:`w-64 bg-base-100 z-20 sticky top-[68px] h-[calc(100vh-68px)] overflow-y-auto border-r border-base-content/10`,children:(0,O.jsx)(`section`,{className:`px-3 pt-2 space-y-3`,children:a})})]})}function hr({section:e,isOpen:t,onToggle:n,pathname:r}){let i=`sidebar-content ${t?``:`hidden`}`,a=`w-4 h-4 transition-transform duration-200 ${t?`rotate-90`:``}`;return(0,O.jsxs)(`article`,{className:`sidebar-section`,children:[(0,O.jsxs)(`button`,{className:`sidebar-toggle w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-base-content/70 uppercase tracking-normal font-spline-sans-mono hover:text-base-content transition-colors`,"aria-expanded":t,onClick:n,children:[(0,O.jsx)(`span`,{children:e.title}),(0,O.jsx)(Ht,{className:a})]}),(0,O.jsx)(`nav`,{className:i,children:(0,O.jsx)(`ul`,{className:`ml-2 mt-1 border-l-2 border-base-content/10 space-y-0.5 py-1`,children:e.items.map(e=>(0,O.jsx)(gr,{item:e,pathname:r},e.href))})})]})}function gr({item:e,pathname:t}){let n=_r(e.href),r=t.endsWith(`/docs/${n}`);return(0,O.jsx)(`li`,{children:(0,O.jsx)(c,{to:`/docs/$slug/`,params:{slug:n},preload:`intent`,className:`block ml-0 pl-4 pr-3 py-2 text-sm transition-colors relative ${r?`text-[#1D4ED8] bg-[#1D4ED8]/10 font-medium before:absolute before:left-[-2px] before:top-0 before:bottom-0 before:w-0.5 before:bg-[#1D4ED8]`:`text-base-content/80 hover:text-[#1D4ED8] hover:bg-base-content/5`}`,children:(0,O.jsx)(`span`,{className:`flex items-center justify-between`,children:e.title})})})}function _r(e){let t=e.match(/docs\/([^/]+)$/);return t?t[1]:`introduction`}function vr({children:e}){let[t,n]=(0,b.useState)(!1);return(0,O.jsxs)(`section`,{className:`flex flex-col min-h-screen relative`,children:[(0,O.jsx)(yr,{}),(0,O.jsx)(dr,{}),(0,O.jsxs)(`main`,{className:`drawer lg:drawer-open flex-1 relative`,children:[(0,O.jsx)(`input`,{id:`my-drawer-2`,type:`checkbox`,className:`drawer-toggle`,checked:t,onChange:e=>{n(e.target.checked)}}),(0,O.jsx)(`section`,{className:`drawer-content flex flex-col pt-[68px]`,children:(0,O.jsx)(`article`,{className:`flex-1`,children:e})}),(0,O.jsx)(mr,{onClose:()=>n(!1)})]}),(0,O.jsx)(Zt,{})]})}function yr(){return(0,O.jsxs)(`figure`,{className:`absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl pointer-events-none`,"aria-hidden":`true`,children:[(0,O.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] block`,style:{clipPath:`polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 150%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)`}}),(0,O.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(100%)] sm:w-[72.1875rem] block`,style:{clipPath:`polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 150%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)`}})]})}function br({children:e}){return(0,O.jsxs)(`section`,{className:`flex flex-col min-h-screen relative`,children:[(0,O.jsx)(dr,{}),(0,O.jsxs)(`main`,{className:`drawer flex-1 relative`,children:[(0,O.jsx)(`input`,{id:`my-drawer-2`,type:`checkbox`,className:`drawer-toggle`}),(0,O.jsx)(`section`,{className:`drawer-content flex flex-col pt-[68px]`,children:(0,O.jsx)(`article`,{className:`flex-1`,children:e})}),(0,O.jsx)(mr,{})]}),(0,O.jsx)(Zt,{})]})}var xr=/[\0-\x1F!-,\.\/:-@\[-\^`\{-\xA9\xAB-\xB4\xB6-\xB9\xBB-\xBF\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0378\u0379\u037E\u0380-\u0385\u0387\u038B\u038D\u03A2\u03F6\u0482\u0530\u0557\u0558\u055A-\u055F\u0589-\u0590\u05BE\u05C0\u05C3\u05C6\u05C8-\u05CF\u05EB-\u05EE\u05F3-\u060F\u061B-\u061F\u066A-\u066D\u06D4\u06DD\u06DE\u06E9\u06FD\u06FE\u0700-\u070F\u074B\u074C\u07B2-\u07BF\u07F6-\u07F9\u07FB\u07FC\u07FE\u07FF\u082E-\u083F\u085C-\u085F\u086B-\u089F\u08B5\u08C8-\u08D2\u08E2\u0964\u0965\u0970\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09F2-\u09FB\u09FD\u09FF\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF0-\u0AF8\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B54\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B70\u0B72-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BF0-\u0BFF\u0C0D\u0C11\u0C29\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5B-\u0C5F\u0C64\u0C65\u0C70-\u0C7F\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0CFF\u0D0D\u0D11\u0D45\u0D49\u0D4F-\u0D53\u0D58-\u0D5E\u0D64\u0D65\u0D70-\u0D79\u0D80\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DE5\u0DF0\u0DF1\u0DF4-\u0E00\u0E3B-\u0E3F\u0E4F\u0E5A-\u0E80\u0E83\u0E85\u0E8B\u0EA4\u0EA6\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F01-\u0F17\u0F1A-\u0F1F\u0F2A-\u0F34\u0F36\u0F38\u0F3A-\u0F3D\u0F48\u0F6D-\u0F70\u0F85\u0F98\u0FBD-\u0FC5\u0FC7-\u0FFF\u104A-\u104F\u109E\u109F\u10C6\u10C8-\u10CC\u10CE\u10CF\u10FB\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u1360-\u137F\u1390-\u139F\u13F6\u13F7\u13FE-\u1400\u166D\u166E\u1680\u169B-\u169F\u16EB-\u16ED\u16F9-\u16FF\u170D\u1715-\u171F\u1735-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17D4-\u17D6\u17D8-\u17DB\u17DE\u17DF\u17EA-\u180A\u180E\u180F\u181A-\u181F\u1879-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191F\u192C-\u192F\u193C-\u1945\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DA-\u19FF\u1A1C-\u1A1F\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1AA6\u1AA8-\u1AAF\u1AC1-\u1AFF\u1B4C-\u1B4F\u1B5A-\u1B6A\u1B74-\u1B7F\u1BF4-\u1BFF\u1C38-\u1C3F\u1C4A-\u1C4C\u1C7E\u1C7F\u1C89-\u1C8F\u1CBB\u1CBC\u1CC0-\u1CCF\u1CD3\u1CFB-\u1CFF\u1DFA\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FBD\u1FBF-\u1FC1\u1FC5\u1FCD-\u1FCF\u1FD4\u1FD5\u1FDC-\u1FDF\u1FED-\u1FF1\u1FF5\u1FFD-\u203E\u2041-\u2053\u2055-\u2070\u2072-\u207E\u2080-\u208F\u209D-\u20CF\u20F1-\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F-\u215F\u2189-\u24B5\u24EA-\u2BFF\u2C2F\u2C5F\u2CE5-\u2CEA\u2CF4-\u2CFF\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D70-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E00-\u2E2E\u2E30-\u3004\u3008-\u3020\u3030\u3036\u3037\u303D-\u3040\u3097\u3098\u309B\u309C\u30A0\u30FB\u3100-\u3104\u3130\u318F-\u319F\u31C0-\u31EF\u3200-\u33FF\u4DC0-\u4DFF\u9FFD-\u9FFF\uA48D-\uA4CF\uA4FE\uA4FF\uA60D-\uA60F\uA62C-\uA63F\uA673\uA67E\uA6F2-\uA716\uA720\uA721\uA789\uA78A\uA7C0\uA7C1\uA7CB-\uA7F4\uA828-\uA82B\uA82D-\uA83F\uA874-\uA87F\uA8C6-\uA8CF\uA8DA-\uA8DF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA954-\uA95F\uA97D-\uA97F\uA9C1-\uA9CE\uA9DA-\uA9DF\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A-\uAA5F\uAA77-\uAA79\uAAC3-\uAADA\uAADE\uAADF\uAAF0\uAAF1\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F\uAB5B\uAB6A-\uAB6F\uABEB\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uD7FF\uE000-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB29\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBB2-\uFBD2\uFD3E-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFC-\uFDFF\uFE10-\uFE1F\uFE30-\uFE32\uFE35-\uFE4C\uFE50-\uFE6F\uFE75\uFEFD-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF3E\uFF40\uFF5B-\uFF65\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFFF]|\uD800[\uDC0C\uDC27\uDC3B\uDC3E\uDC4E\uDC4F\uDC5E-\uDC7F\uDCFB-\uDD3F\uDD75-\uDDFC\uDDFE-\uDE7F\uDE9D-\uDE9F\uDED1-\uDEDF\uDEE1-\uDEFF\uDF20-\uDF2C\uDF4B-\uDF4F\uDF7B-\uDF7F\uDF9E\uDF9F\uDFC4-\uDFC7\uDFD0\uDFD6-\uDFFF]|\uD801[\uDC9E\uDC9F\uDCAA-\uDCAF\uDCD4-\uDCD7\uDCFC-\uDCFF\uDD28-\uDD2F\uDD64-\uDDFF\uDF37-\uDF3F\uDF56-\uDF5F\uDF68-\uDFFF]|\uD802[\uDC06\uDC07\uDC09\uDC36\uDC39-\uDC3B\uDC3D\uDC3E\uDC56-\uDC5F\uDC77-\uDC7F\uDC9F-\uDCDF\uDCF3\uDCF6-\uDCFF\uDD16-\uDD1F\uDD3A-\uDD7F\uDDB8-\uDDBD\uDDC0-\uDDFF\uDE04\uDE07-\uDE0B\uDE14\uDE18\uDE36\uDE37\uDE3B-\uDE3E\uDE40-\uDE5F\uDE7D-\uDE7F\uDE9D-\uDEBF\uDEC8\uDEE7-\uDEFF\uDF36-\uDF3F\uDF56-\uDF5F\uDF73-\uDF7F\uDF92-\uDFFF]|\uD803[\uDC49-\uDC7F\uDCB3-\uDCBF\uDCF3-\uDCFF\uDD28-\uDD2F\uDD3A-\uDE7F\uDEAA\uDEAD-\uDEAF\uDEB2-\uDEFF\uDF1D-\uDF26\uDF28-\uDF2F\uDF51-\uDFAF\uDFC5-\uDFDF\uDFF7-\uDFFF]|\uD804[\uDC47-\uDC65\uDC70-\uDC7E\uDCBB-\uDCCF\uDCE9-\uDCEF\uDCFA-\uDCFF\uDD35\uDD40-\uDD43\uDD48-\uDD4F\uDD74\uDD75\uDD77-\uDD7F\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDFF\uDE12\uDE38-\uDE3D\uDE3F-\uDE7F\uDE87\uDE89\uDE8E\uDE9E\uDEA9-\uDEAF\uDEEB-\uDEEF\uDEFA-\uDEFF\uDF04\uDF0D\uDF0E\uDF11\uDF12\uDF29\uDF31\uDF34\uDF3A\uDF45\uDF46\uDF49\uDF4A\uDF4E\uDF4F\uDF51-\uDF56\uDF58-\uDF5C\uDF64\uDF65\uDF6D-\uDF6F\uDF75-\uDFFF]|\uD805[\uDC4B-\uDC4F\uDC5A-\uDC5D\uDC62-\uDC7F\uDCC6\uDCC8-\uDCCF\uDCDA-\uDD7F\uDDB6\uDDB7\uDDC1-\uDDD7\uDDDE-\uDDFF\uDE41-\uDE43\uDE45-\uDE4F\uDE5A-\uDE7F\uDEB9-\uDEBF\uDECA-\uDEFF\uDF1B\uDF1C\uDF2C-\uDF2F\uDF3A-\uDFFF]|\uD806[\uDC3B-\uDC9F\uDCEA-\uDCFE\uDD07\uDD08\uDD0A\uDD0B\uDD14\uDD17\uDD36\uDD39\uDD3A\uDD44-\uDD4F\uDD5A-\uDD9F\uDDA8\uDDA9\uDDD8\uDDD9\uDDE2\uDDE5-\uDDFF\uDE3F-\uDE46\uDE48-\uDE4F\uDE9A-\uDE9C\uDE9E-\uDEBF\uDEF9-\uDFFF]|\uD807[\uDC09\uDC37\uDC41-\uDC4F\uDC5A-\uDC71\uDC90\uDC91\uDCA8\uDCB7-\uDCFF\uDD07\uDD0A\uDD37-\uDD39\uDD3B\uDD3E\uDD48-\uDD4F\uDD5A-\uDD5F\uDD66\uDD69\uDD8F\uDD92\uDD99-\uDD9F\uDDAA-\uDEDF\uDEF7-\uDFAF\uDFB1-\uDFFF]|\uD808[\uDF9A-\uDFFF]|\uD809[\uDC6F-\uDC7F\uDD44-\uDFFF]|[\uD80A\uD80B\uD80E-\uD810\uD812-\uD819\uD824-\uD82B\uD82D\uD82E\uD830-\uD833\uD837\uD839\uD83D\uD83F\uD87B-\uD87D\uD87F\uD885-\uDB3F\uDB41-\uDBFF][\uDC00-\uDFFF]|\uD80D[\uDC2F-\uDFFF]|\uD811[\uDE47-\uDFFF]|\uD81A[\uDE39-\uDE3F\uDE5F\uDE6A-\uDECF\uDEEE\uDEEF\uDEF5-\uDEFF\uDF37-\uDF3F\uDF44-\uDF4F\uDF5A-\uDF62\uDF78-\uDF7C\uDF90-\uDFFF]|\uD81B[\uDC00-\uDE3F\uDE80-\uDEFF\uDF4B-\uDF4E\uDF88-\uDF8E\uDFA0-\uDFDF\uDFE2\uDFE5-\uDFEF\uDFF2-\uDFFF]|\uD821[\uDFF8-\uDFFF]|\uD823[\uDCD6-\uDCFF\uDD09-\uDFFF]|\uD82C[\uDD1F-\uDD4F\uDD53-\uDD63\uDD68-\uDD6F\uDEFC-\uDFFF]|\uD82F[\uDC6B-\uDC6F\uDC7D-\uDC7F\uDC89-\uDC8F\uDC9A-\uDC9C\uDC9F-\uDFFF]|\uD834[\uDC00-\uDD64\uDD6A-\uDD6C\uDD73-\uDD7A\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDE41\uDE45-\uDFFF]|\uD835[\uDC55\uDC9D\uDCA0\uDCA1\uDCA3\uDCA4\uDCA7\uDCA8\uDCAD\uDCBA\uDCBC\uDCC4\uDD06\uDD0B\uDD0C\uDD15\uDD1D\uDD3A\uDD3F\uDD45\uDD47-\uDD49\uDD51\uDEA6\uDEA7\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3\uDFCC\uDFCD]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85-\uDE9A\uDEA0\uDEB0-\uDFFF]|\uD838[\uDC07\uDC19\uDC1A\uDC22\uDC25\uDC2B-\uDCFF\uDD2D-\uDD2F\uDD3E\uDD3F\uDD4A-\uDD4D\uDD4F-\uDEBF\uDEFA-\uDFFF]|\uD83A[\uDCC5-\uDCCF\uDCD7-\uDCFF\uDD4C-\uDD4F\uDD5A-\uDFFF]|\uD83B[\uDC00-\uDDFF\uDE04\uDE20\uDE23\uDE25\uDE26\uDE28\uDE33\uDE38\uDE3A\uDE3C-\uDE41\uDE43-\uDE46\uDE48\uDE4A\uDE4C\uDE50\uDE53\uDE55\uDE56\uDE58\uDE5A\uDE5C\uDE5E\uDE60\uDE63\uDE65\uDE66\uDE6B\uDE73\uDE78\uDE7D\uDE7F\uDE8A\uDE9C-\uDEA0\uDEA4\uDEAA\uDEBC-\uDFFF]|\uD83C[\uDC00-\uDD2F\uDD4A-\uDD4F\uDD6A-\uDD6F\uDD8A-\uDFFF]|\uD83E[\uDC00-\uDFEF\uDFFA-\uDFFF]|\uD869[\uDEDE-\uDEFF]|\uD86D[\uDF35-\uDF3F]|\uD86E[\uDC1E\uDC1F]|\uD873[\uDEA2-\uDEAF]|\uD87A[\uDFE1-\uDFFF]|\uD87E[\uDE1E-\uDFFF]|\uD884[\uDF4B-\uDFFF]|\uDB40[\uDC00-\uDCFF\uDDF0-\uDFFF]/g,Sr=Object.hasOwnProperty,Cr=class{constructor(){this.occurrences,this.reset()}slug(e,t){let n=this,r=wr(e,t===!0),i=r;for(;Sr.call(n.occurrences,r);)n.occurrences[i]++,r=i+`-`+n.occurrences[i];return n.occurrences[r]=0,r}reset(){this.occurrences=Object.create(null)}};function wr(e,t){return typeof e==`string`?(t||(e=e.toLowerCase()),e.replace(xr,``).replace(/ /g,`-`)):``}var Tr=/^(#{2,4})\s+(.+)$/gm;function Er(e){let t=new Cr,n=new RegExp(Tr.source,Tr.flags);return Array.from(e.matchAll(n)).map(e=>{let n=e[1].length,r=e[2].trim();return{depth:n,slug:t.slug(r),text:r}})}var Dr={rootMargin:`-20% 0% -70% 0%`,threshold:0},Or=`h2[id], h3[id], h4[id]`;function kr(e){let[t,n]=(0,b.useState)(null);return(0,b.useEffect)(()=>{let e=null,t=setTimeout(()=>{let t=document.querySelectorAll(Or);t.length!==0&&(e=new IntersectionObserver(e=>{let t=e.filter(e=>e.isIntersecting);if(t.length>0){let e=t.reduce((e,t)=>t.boundingClientRect.top>=e.boundingClientRect.top?e:t);n(e.target.id)}},Dr),t.forEach(t=>e.observe(t)))},100);return()=>{clearTimeout(t),e?.disconnect()}},[e]),t}function Ar(e,t){return t.reduce((e,t)=>e[t]?.subheadings??[],e)}function jr(e,t,n){if(t.length===0)return e.concat(n);let[r,...i]=t;return e.map((e,t)=>{if(t!==r)return e;let a=jr(e.subheadings,i,n);return Object.assign({},e,{subheadings:a})})}function Mr(e){return e.reduce((e,t)=>{let n=Object.assign({},t,{subheadings:[]}),r=n.depth===2?[]:e.paths[n.depth-1];if(!r)return e;let i=Ar(e.toc,r).length,a=r.concat(i);return{toc:jr(e.toc,r,n),paths:Object.assign({},e.paths,{[n.depth]:a})}},{toc:[],paths:{}}).toc}var Nr=/`([^`]+)`/g;function Pr(e){let t=Array.from(e.matchAll(Nr)).reduce((t,n)=>{let r=t.lastIndex,i=n.index>r?[{text:e.slice(r,n.index),isCode:!1}]:[];return r=n.index+n[0].length,{parts:t.parts.concat(i,{text:n[1],isCode:!0}),lastIndex:r}},{parts:[],lastIndex:0}),n=t.lastIndex<e.length?[{text:e.slice(t.lastIndex),isCode:!1}]:[],r=t.parts.concat(n);return r.length===0?[{text:e,isCode:!1}]:r}var Fr=`block text-sm transition-colors border-l-2 pl-4 -ml-0.5 font-spline-sans-mono`,Ir=`text-[#1D4ED8] font-medium border-[#1D4ED8]`,Lr=`hover:text-[#1D4ED8] border-transparent`;function Rr(e,t=!1){return`${Fr} ${t?`py-0.5`:`py-1`} ${e?Ir:`${t?`text-base-content/60`:`text-base-content/70`} ${Lr}`}`}function zr(e){let t=document.getElementById(e);return t?(t.scrollIntoView({behavior:`smooth`,block:`start`}),history.pushState(null,``,`#${e}`),!0):!1}function Br({headings:e}){let t=Mr(e||[]),n=kr(e?.length||0),r=(0,b.useCallback)((e,t)=>{zr(t)&&e.preventDefault()},[]);return t.length===0?null:(0,O.jsxs)(`nav`,{className:`sticky top-28 w-64`,"aria-label":`Table of contents`,children:[(0,O.jsx)(Vr,{}),(0,O.jsx)(Hr,{toc:t,activeId:n,onClickLink:r})]})}function Vr(){return(0,O.jsx)(`h2`,{className:`mb-3 text-xs font-semibold text-base-content/60 uppercase tracking-wider font-spline-sans-mono`,children:`On this page`})}function Hr({toc:e,activeId:t,onClickLink:n}){return(0,O.jsx)(`ul`,{className:`space-y-2.5`,children:e.map(e=>(0,O.jsx)(Ur,{heading:e,activeId:t,onClickLink:n},e.slug))})}function Ur({heading:e,activeId:t,onClickLink:n}){let r=t===e.slug,i=e.subheadings.length>0;return(0,O.jsxs)(`li`,{children:[(0,O.jsx)(Wr,{slug:e.slug,text:e.text,isActive:r,onClickLink:n}),i&&(0,O.jsx)(Gr,{subheadings:e.subheadings,activeId:t,onClickLink:n})]})}function Wr({slug:e,text:t,isActive:n,isSubheading:r=!1,onClickLink:i}){let a=Pr(t);return(0,O.jsx)(`a`,{href:`#${e}`,onClick:t=>i(t,e),className:Rr(n,r),children:a.map((e,t)=>e.isCode?(0,O.jsx)(`code`,{className:`text-xs px-1 py-0.5 rounded bg-base-content/10`,children:e.text},t):(0,O.jsx)(`span`,{children:e.text},t))})}function Gr({subheadings:e,activeId:t,onClickLink:n}){return(0,O.jsx)(`ul`,{className:`mt-2 space-y-2 ml-3`,children:e.map(e=>(0,O.jsx)(`li`,{children:(0,O.jsx)(Wr,{slug:e.slug,text:e.text,isActive:t===e.slug,isSubheading:!0,onClickLink:n})},e.slug))})}var Kr=v({id:`copy`,initial:`idle`,states:{idle:{on:{COPY:`copied`}},copied:{after:{2e3:`idle`}}}}),qr=e=>e?(0,O.jsx)(Bt,{className:`h-4 w-4 text-green-500`}):(0,O.jsx)(Ut,{className:`h-4 w-4`}),Jr=async e=>{try{return await navigator.clipboard.writeText(e),!0}catch{return!1}};function Yr({code:e}){let[t,n]=y(Kr),r=t.matches(`copied`);return(0,O.jsx)(`button`,{type:`button`,className:`flex items-center justify-center h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer`,onClick:async()=>{await Jr(e)&&n({type:`COPY`})},"aria-label":r?`Copied!`:`Copy code`,children:qr(r)})}var Xr=[`javascript`,`js`,`typescript`,`ts`,`jsx`,`tsx`,`bash`,`shellscript`,`json`,`yaml`,`markdown`,`text`],Zr={js:`javascript`,ts:`typescript`},Qr=e=>Zr[e]||e,$r={wrapper:`not-prose shiki-wrapper relative group overflow-hidden rounded-md border border-border/70 bg-card/85 backdrop-blur`,header:`shiki-header flex items-center justify-between gap-3 border-b border-border/70 bg-muted/55 px-3 py-2`,pre:`overflow-x-auto px-2 py-2 text-[13px] leading-5`,content:`[&_.shiki]:!overflow-visible [&_.shiki]:!bg-transparent [&_pre]:!m-0 [&_pre]:!border-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:!bg-transparent [&_code]:!p-0`},ei=`modulepreload`,ti=function(e){return`/pastoralist/`+e},ni={},ri=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?import.meta.resolve(e):new URL(e,import.meta.url).href}r=o(t.map(t=>{if(t=ti(t,n),t=s(t),t in ni)return;ni[t]=!0;let r=t.endsWith(`.css`);for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}let i=document.createElement(`link`);if(i.rel=r?`stylesheet`:ei,r||(i.as=`script`),i.crossOrigin=``,i.href=t,a&&i.setAttribute(`nonce`,a),document.head.appendChild(i),r)return new Promise((e,n)=>{i.addEventListener(`load`,e),i.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},ii=[`bg-rose-400`,`bg-amber-400`,`bg-emerald-400`],ai=128,oi=null,G=new Map;function si(){return oi||=ri(()=>import(`./highlighter-DEnE3vq8.js`).then(e=>e.createCodeHighlighter()),__vite__mapDeps([0,1,2])),oi}var ci=e=>{let t=Qr(e);return Xr.includes(t)?t:`text`},li=e=>{let t=G.get(e);if(t)return G.delete(e),G.set(e,t),t},ui=(e,t)=>{if(G.size>=ai){let e=G.keys().next().value;e!==void 0&&G.delete(e)}G.set(e,t)},di=(e,t,n)=>{let r=ci(t),i=JSON.stringify([e,r,n]),a=li(i);if(a)return a;let o=si().then(t=>t.codeToHtml(e,r,n)).catch(e=>{throw G.delete(i),e});return ui(i,o),o};function fi({code:e,lang:t=`text`,showLineNumbers:n=!1}){let r=(0,b.use)(di(e,t,n));return(0,O.jsx)(`div`,{className:$r.content,dangerouslySetInnerHTML:{__html:r}})}function pi({code:e,lang:t=`text`,title:n,showLineNumbers:r=!1,showLanguage:i=!0,showCopy:a=!0,className:o}){let s=!!(n||i||a),c=a?(0,O.jsx)(Yr,{code:e}):null;return(0,O.jsxs)(`div`,{className:Et($r.wrapper,r&&`show-line-numbers`,o),children:[s&&(0,O.jsxs)(`div`,{className:$r.header,children:[(0,O.jsxs)(`div`,{className:`flex min-w-0 items-center gap-3`,children:[(0,O.jsx)(`div`,{className:`flex items-center gap-1.5`,"aria-hidden":`true`,children:ii.map(e=>(0,O.jsx)(`span`,{className:Et(`h-2.5 w-2.5 rounded-full ring-1 ring-black/5`,e)},e))}),(0,O.jsxs)(`div`,{className:`flex min-w-0 items-center gap-2`,children:[n&&(0,O.jsx)(`span`,{className:`truncate text-xs font-medium text-base-content/70`,children:n}),i&&t&&t!==`text`&&(0,O.jsx)(`span`,{className:`font-mono text-xs text-base-content/50`,children:t})]})]}),c]}),(0,O.jsx)(`div`,{className:$r.pre,children:(0,O.jsx)(b.Suspense,{fallback:(0,O.jsx)(`pre`,{className:`text-sm leading-relaxed`,children:(0,O.jsx)(`code`,{children:e})}),children:(0,O.jsx)(fi,{code:e,lang:t,showLineNumbers:r})})})]})}function mi({href:e,children:t,className:n}){return e?e.startsWith(`http`)||e.startsWith(`//`)?(0,O.jsx)(`a`,{href:e,className:n,target:`_blank`,rel:`noopener noreferrer`,children:t}):e.startsWith(`/docs/`)?(0,O.jsx)(c,{to:`/docs/$slug/`,params:{slug:e.replace(`/docs/`,``)},className:n,children:t}):(0,O.jsx)(`a`,{href:e,className:n,children:t}):(0,O.jsx)(`a`,{className:n,children:t})}var hi=(0,b.lazy)(()=>ri(()=>import(`./Mermaid-xJpD7Bw_.js`).then(e=>({default:e.Mermaid})),__vite__mapDeps([3,2,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23])));function gi(e){return typeof e==`string`?e:Array.isArray(e)?e.map(gi).join(``):e&&typeof e==`object`&&`props`in e?gi(e.props?.children):``}function _i({chart:e}){return(0,O.jsx)(b.Suspense,{fallback:(0,O.jsx)(`div`,{className:`my-6 flex justify-center animate-pulse`,children:(0,O.jsx)(`div`,{className:`h-32 w-full max-w-md bg-base-content/10 rounded`})}),children:(0,O.jsx)(hi,{chart:e})})}function vi({children:e,...t}){let n=t[`data-mermaid-content`],r=t[`data-language`];if(r===`mermaid`&&n)return(0,O.jsx)(_i,{chart:n});let i=e,a=i?.props?.[`data-mermaid-content`],o=i?.props?.[`data-language`];if(o===`mermaid`&&a)return(0,O.jsx)(_i,{chart:a});let s=((i?.props?.className??``).match(/language-(\S+)/)?.[1]??o??r??`text`).replace(/^language-/,``),c=gi(i?.props?.children??e);return s===`mermaid`?(0,O.jsx)(_i,{chart:c}):(0,O.jsx)(`div`,{className:`not-prose my-4`,children:(0,O.jsx)(pi,{code:c,lang:s,showCopy:!1,showLanguage:!1,showLineNumbers:!0})})}var yi={Mermaid:_i,pre:vi,a:mi,h1:`h1`,h2:`h2`,h3:`h3`,h4:`h4`,h5:`h5`,h6:`h6`,p:`p`,code:`code`,span:`span`,strong:`strong`,em:`em`,ul:`ul`,ol:`ol`,li:`li`,img:`img`};function bi(e){let t=e.match(/docs\/([^/]+)$/);return t?t[1]:`introduction`}function xi(e){let t,n,r,i;if(W.forEach((t,n)=>{let a=t.items.findIndex(t=>t.href.endsWith(`/${e}`));a!==-1&&(r=n,i=a)}),r===void 0||i===void 0)return{prevItem:t,nextItem:n};if(i>0)t=W[r].items[i-1];else if(r>0){let e=W[r-1];t=e.items[e.items.length-1]}return i<W[r].items.length-1?n=W[r].items[i+1]:r<W.length-1&&(n=W[r+1].items[0]),{prevItem:t,nextItem:n}}function Si({prevItem:e,nextItem:t}){return(0,O.jsxs)(`nav`,{className:`flex gap-7`,children:[e?.href&&(0,O.jsx)(c,{to:`/docs/$slug/`,params:{slug:bi(e.href)},preload:`intent`,className:`mr-auto flex`,children:(0,O.jsxs)(`button`,{className:`btn rounded-full bg-base-100 border border-base-content/10 text-base-content/80 shadow-sm shadow-base-content/5 hover:bg-base-content/5 hover:text-[#1D4ED8] transition-all`,children:[(0,O.jsx)(Vt,{className:`w-6 h-6`}),(0,O.jsx)(`span`,{className:`text-xs md:text-sm font-medium`,children:e.title})]})}),t?.href&&(0,O.jsx)(c,{to:`/docs/$slug/`,params:{slug:bi(t.href)},preload:`intent`,className:`ml-auto flex`,children:(0,O.jsxs)(`button`,{className:`btn rounded-full bg-base-100 border border-base-content/10 text-base-content/80 shadow-sm shadow-base-content/5 hover:bg-base-content/5 hover:text-[#1D4ED8] transition-all`,children:[(0,O.jsx)(`span`,{className:`text-xs md:text-sm font-medium`,children:t.title}),(0,O.jsx)(Ht,{className:`w-6 h-6`})]})})]})}function Ci(){let{slug:e}=g({from:`/docs/$slug`}),t=Qn(e);if(!t)return(0,O.jsx)(u,{to:`/docs/$slug/`,params:{slug:`introduction`}});let n=er(e),r=$n(e),i=r?Er(r):[],{prevItem:a,nextItem:o}=xi(e);return(0,O.jsxs)(`section`,{className:`flex flex-col lg:flex-row p-4 sm:p-6 md:p-10 md:pt-10 font-spline-sans-mono gap-8`,children:[(0,O.jsxs)(`article`,{className:`flex flex-col w-full max-w-[600px]`,children:[(0,O.jsx)(wi,{title:t.title}),(0,O.jsxs)(`section`,{className:`docs-prose prose prose-sm sm:prose-base md:prose-md mb-10 max-w-none prose-pre:max-w-[90vw] prose-pre:overflow-x-auto`,children:[(0,O.jsxs)(`header`,{children:[(0,O.jsx)(`h1`,{children:t.title}),(0,O.jsx)(`p`,{children:t.description})]}),(0,O.jsx)(Ti,{Content:n})]}),(0,O.jsx)(Si,{prevItem:a,nextItem:o})]}),(0,O.jsx)(`aside`,{className:`hidden xl:block pl-8`,children:(0,O.jsx)(Br,{headings:i})})]})}function wi({title:e}){return(0,O.jsx)(`nav`,{className:`text-base breadcrumbs pt-0 pb-4`,children:(0,O.jsxs)(`ul`,{children:[(0,O.jsx)(`li`,{children:(0,O.jsx)(c,{to:`/`,className:`hover:text-primary`,children:`Home`})}),(0,O.jsx)(`li`,{className:`text-primary`,children:e})]})})}function Ti({Content:e}){return e?(0,O.jsx)(e,{components:yi}):null}var Ei=v({id:`copy`,initial:`idle`,states:{idle:{on:{COPY:`copied`}},copied:{after:{800:`idle`}}}}),Di=`flex items-center justify-center size-9 shrink-0 rounded-xl bg-base-100/70 hover:bg-base-200/80 transition-colors cursor-pointer`,Oi=`h-5 w-5 pointer-events-none`,ki=`h-6 w-6 pointer-events-none text-green-500`,Ai=e=>e?(0,O.jsx)(Bt,{className:ki}):(0,O.jsx)(Ut,{className:Oi}),ji=async e=>{try{return await navigator.clipboard.writeText(e),!0}catch{return!1}};function Mi(){let[e,t]=y(Ei),n=e.matches(`copied`),r=async e=>{let n=e.currentTarget.closest(`figure, div`)?.querySelector(`code`);!n||!await ji(n.textContent??``)||t({type:`COPY`})},i=n?`Copied!`:`Copy`,a=Ai(n);return(0,O.jsx)(`button`,{type:`button`,className:Di,onClick:r,"aria-label":i,children:a})}var Ni=({children:e,maskSrc:t})=>(0,O.jsx)(`div`,{style:{position:`relative`,display:`inline-flex`},children:(0,O.jsxs)(`div`,{className:`logo-shine-wrap`,style:{WebkitMaskImage:`url(${t})`,maskImage:`url(${t})`,WebkitMaskSize:`contain`,maskSize:`contain`,WebkitMaskRepeat:`no-repeat`,maskRepeat:`no-repeat`,WebkitMaskPosition:`center`,maskPosition:`center`},children:[e,(0,O.jsx)(`div`,{"aria-hidden":`true`,className:`logo-shine-beam`})]})}),Pi=({size:e,color:t})=>(0,O.jsx)(`svg`,{width:e,height:e,viewBox:`0 0 10 10`,fill:t,"aria-hidden":`true`,style:{filter:`drop-shadow(0 0 3px ${t})`},children:(0,O.jsx)(`path`,{d:`M5 0 L6.2 3.8 L10 5 L6.2 6.2 L5 10 L3.8 6.2 L0 5 L3.8 3.8 Z`})}),Fi=[{left:`5%`,top:`4%`,size:12,color:`#fbbf24`,delay:0,duration:3.2},{left:`13%`,top:`1%`,size:7,color:`#c084fc`,delay:1.7,duration:2.8},{left:`20%`,top:`2%`,size:8,color:`#e2e8f0`,delay:1.4,duration:2.7},{left:`32%`,top:`4%`,size:11,color:`#f9a8d4`,delay:.2,duration:3.4},{left:`44%`,top:`3%`,size:10,color:`#93c5fd`,delay:.6,duration:3.5},{left:`57%`,top:`1%`,size:8,color:`#fbbf24`,delay:2.8,duration:2.6},{left:`70%`,top:`5%`,size:14,color:`#fbbf24`,delay:2.1,duration:2.9},{left:`79%`,top:`2%`,size:7,color:`#e2e8f0`,delay:1,duration:3.1},{left:`90%`,top:`7%`,size:9,color:`#c084fc`,delay:.3,duration:3.1},{left:`1%`,top:`14%`,size:8,color:`#93c5fd`,delay:2.2,duration:3},{left:`1%`,top:`25%`,size:11,color:`#f9a8d4`,delay:1.8,duration:2.6},{left:`4%`,top:`38%`,size:7,color:`#fbbf24`,delay:.4,duration:3.5},{left:`3%`,top:`55%`,size:8,color:`#93c5fd`,delay:.5,duration:3.4},{left:`1%`,top:`67%`,size:12,color:`#e2e8f0`,delay:2.6,duration:2.7},{left:`2%`,top:`78%`,size:13,color:`#fbbf24`,delay:2.3,duration:2.8},{left:`4%`,top:`89%`,size:7,color:`#c084fc`,delay:1,duration:3.3},{left:`96%`,top:`16%`,size:8,color:`#f9a8d4`,delay:.6,duration:2.9},{left:`96%`,top:`22%`,size:10,color:`#e2e8f0`,delay:1.1,duration:3},{left:`98%`,top:`35%`,size:7,color:`#fbbf24`,delay:2,duration:3.4},{left:`97%`,top:`48%`,size:13,color:`#c084fc`,delay:.4,duration:3.3},{left:`96%`,top:`62%`,size:8,color:`#93c5fd`,delay:1.5,duration:2.6},{left:`95%`,top:`72%`,size:9,color:`#f9a8d4`,delay:1.9,duration:2.7},{left:`97%`,top:`85%`,size:11,color:`#fbbf24`,delay:.1,duration:3.2},{left:`10%`,top:`12%`,size:9,color:`#e2e8f0`,delay:1.3,duration:2.8},{left:`14%`,top:`18%`,size:7,color:`#fbbf24`,delay:.9,duration:3.6},{left:`25%`,top:`10%`,size:10,color:`#c084fc`,delay:2.4,duration:2.5},{left:`35%`,top:`16%`,size:8,color:`#93c5fd`,delay:.7,duration:3},{left:`74%`,top:`11%`,size:9,color:`#f9a8d4`,delay:1.6,duration:2.7},{left:`82%`,top:`14%`,size:11,color:`#93c5fd`,delay:2.5,duration:2.5},{left:`88%`,top:`20%`,size:7,color:`#fbbf24`,delay:.3,duration:3.3},{left:`7%`,top:`42%`,size:10,color:`#c084fc`,delay:1.2,duration:3.1},{left:`8%`,top:`60%`,size:8,color:`#f9a8d4`,delay:2.7,duration:2.8},{left:`91%`,top:`38%`,size:9,color:`#e2e8f0`,delay:.5,duration:3.4},{left:`92%`,top:`57%`,size:11,color:`#fbbf24`,delay:1.8,duration:2.6},{left:`12%`,top:`74%`,size:7,color:`#93c5fd`,delay:.4,duration:3.2},{left:`18%`,top:`80%`,size:9,color:`#c084fc`,delay:.7,duration:3.2},{left:`28%`,top:`76%`,size:12,color:`#fbbf24`,delay:2.1,duration:2.9},{left:`38%`,top:`88%`,size:12,color:`#e2e8f0`,delay:2,duration:2.8},{left:`48%`,top:`78%`,size:8,color:`#f9a8d4`,delay:1.4,duration:3.5},{left:`58%`,top:`83%`,size:10,color:`#c084fc`,delay:.2,duration:3},{left:`62%`,top:`85%`,size:8,color:`#fbbf24`,delay:1.3,duration:3.5},{left:`72%`,top:`77%`,size:11,color:`#93c5fd`,delay:2.6,duration:2.7},{left:`80%`,top:`82%`,size:11,color:`#f9a8d4`,delay:.2,duration:3.1},{left:`88%`,top:`75%`,size:7,color:`#e2e8f0`,delay:1.7,duration:3.4},{left:`7%`,top:`95%`,size:8,color:`#fbbf24`,delay:2.3,duration:2.6},{left:`10%`,top:`94%`,size:10,color:`#93c5fd`,delay:1.6,duration:2.6},{left:`22%`,top:`97%`,size:7,color:`#c084fc`,delay:.9,duration:3.1},{left:`35%`,top:`95%`,size:9,color:`#e2e8f0`,delay:1.4,duration:2.8},{left:`50%`,top:`96%`,size:7,color:`#c084fc`,delay:.8,duration:3.3},{left:`63%`,top:`94%`,size:11,color:`#f9a8d4`,delay:2,duration:2.9},{left:`75%`,top:`97%`,size:8,color:`#fbbf24`,delay:.5,duration:3.4},{left:`85%`,top:`93%`,size:13,color:`#fbbf24`,delay:2.4,duration:2.9},{left:`93%`,top:`95%`,size:7,color:`#93c5fd`,delay:1.1,duration:3}];function Ii(){return(0,O.jsx)(`div`,{"aria-hidden":`true`,className:`pointer-events-none absolute inset-0 overflow-hidden`,style:{zIndex:0},children:Fi.map((e,t)=>(0,O.jsx)(i.span,{style:{position:`absolute`,left:e.left,top:e.top},initial:{opacity:0,scale:0,rotate:0},animate:{opacity:[0,1,0],scale:[0,1,0],rotate:[0,135,0]},transition:{duration:e.duration,delay:e.delay,repeat:1/0,ease:`easeInOut`},children:(0,O.jsx)(Pi,{size:e.size,color:e.color})},t))})}var K={window:`terminal-window`,windowActive:`ring-2 ring-primary ring-offset-2`,windowMaxWidth:`max-w-lg w-full`,header:`terminal-header`,headerWithTabs:`terminal-header flex justify-between items-center`,dotRed:`terminal-dot terminal-dot-red`,dotYellow:`terminal-dot terminal-dot-yellow`,dotGreen:`terminal-dot terminal-dot-green`,dots:`flex gap-2 items-center`,label:`ml-3 text-slate-400 text-xs`,tabs:`terminal-tabs`,tab:`terminal-tab`,tabActive:`terminal-tab active`,content:`terminal-content`,contentPadding:`terminal-content text-sm`,line:`terminal-line`,prefix:`terminal-prefix`,cursor:`cursor`,footer:`terminal-footer`,loader:`terminal-window w-full animate-pulse`,loaderBar:`h-4 bg-base-content/10 rounded`},Li={threshold:.1},Ri=`terminal-window max-w-lg w-full my-4`,zi=`380px`,q=`●`,Bi=`✓`,Vi=`⬢`,Hi=`▲`,Ui=`🧑‍🌾`,Wi=`🐑`,Gi=[{lines:[{prefix:`$`,text:`pastoralist`,animate:!0},{text:`&nbsp;`},{text:`${Ui} Pastoralist`,className:`text-success`},{text:`&nbsp;`},{text:`Updating overrides`,className:`text-base-content/70`,depth:0,isLast:!0,connectors:[]},{text:`${q} lodash@4.17.21`,className:`text-success`,depth:1,isLast:!1,connectors:[!1]},{text:`Security fix`,className:`text-base-content/70`,depth:2,isLast:!1,connectors:[!0,!0]},{text:`Used by: 1 package`,className:`text-base-content/70`,depth:2,isLast:!0,connectors:[!0,!1]},{text:`${q} 1 override applied`,className:`text-success`,depth:1,isLast:!0,connectors:[!1]},{text:`${Bi} 1 override tracked`,className:`text-success`},{text:`${Vi} 1 dependent documented`,className:`text-cyan-400`},{text:`<span class="text-error">■</span> 0 crit · <span class="text-warning">▲</span> 1 high · <span class="text-cyan-400">◆</span> 0 med · <span class="text-success">●</span> 0 low · <span class="text-cyan-400">▸</span> 1 tracked · ○ 0 removed · 10 scanned`,className:`text-base-content/50`},{text:`${Bi} The herd is safe! ${Wi}`,className:`text-gold`}],pauseAfter:0}],Ki=[{lines:[{prefix:`$`,text:`pastoralist`,animate:!0},{text:`&nbsp;`},{text:`${Ui} Pastoralist`,className:`text-success`},{text:`&nbsp;`},{text:`Scanning overrides`,className:`text-base-content/70`,depth:0,isLast:!1,connectors:[]},{text:`${q} lodash@4.17.21`,className:`text-success`,depth:1,isLast:!1,connectors:[!0],delay:30},{text:`Reason: Security fix CVE-2021-23337`,className:`text-base-content/70`,depth:2,isLast:!1,connectors:[!0,!0],delay:20},{text:`Used by: my-app@1.0.0`,className:`text-base-content/70`,depth:2,isLast:!0,connectors:[!0,!1],delay:20},{text:`${Hi} minimist@1.2.5`,className:`text-warning`,depth:1,isLast:!0,connectors:[!1],delay:30},{text:`Stale: no package depends on this override`,className:`text-base-content/70`,depth:2,isLast:!0,connectors:[!1,!1],delay:20},{text:`Cleanup`,className:`text-base-content/70`,depth:0,isLast:!0,connectors:[],delay:30},{text:`${q} Removed 1 stale override`,className:`text-success`,depth:1,isLast:!0,connectors:[!1],delay:20},{text:`<span class="text-error">■</span> 0 crit · <span class="text-warning">▲</span> 0 high · <span class="text-cyan-400">◆</span> 0 med · <span class="text-success">●</span> 0 low · <span class="text-cyan-400">▸</span> 1 tracked · ○ 1 removed · 10 scanned`,className:`text-base-content/50`,delay:40},{text:`${Bi} The herd is safe! ${Wi}`,className:`text-gold`,delay:30}],pauseAfter:0}];`${Ui}`,`${Hi}`,`${q}`,`${q}`,`${q}`,`${q}`,`${Bi}`,`${Vi}`,`${Bi}${Wi}`;var qi=({isActive:e=!1,minHeight:t,fileName:n,tabs:r,activeTab:i,onTabChange:a,hideHeader:o=!1,footer:s,footerClassName:c,children:l,className:u})=>{let d=e?K.windowActive:``,f=Et(u??K.window,`transition-all duration-300`,d),p=t?{minHeight:t}:void 0,m=r&&r.length>0,h=m?K.headerWithTabs:K.header,g=n??`terminal`;return(0,O.jsxs)(`div`,{className:f,style:p,children:[!o&&(0,O.jsxs)(`div`,{className:h,children:[(0,O.jsxs)(`div`,{className:K.dots,children:[(0,O.jsx)(`div`,{className:K.dotRed}),(0,O.jsx)(`div`,{className:K.dotYellow}),(0,O.jsx)(`div`,{className:K.dotGreen}),(0,O.jsx)(`span`,{className:K.label,children:g})]}),m&&(0,O.jsx)(`div`,{className:K.tabs,children:r.map(e=>(0,O.jsx)(`button`,{onClick:()=>a?.(e.id),className:e.id===i?K.tabActive:K.tab,children:e.label},e.id))})]}),l,s&&(0,O.jsx)(`div`,{className:Et(K.footer,c),children:s})]})},Ji=(e,t,n)=>{let[r,i]=(0,b.useState)(``);return(0,b.useEffect)(()=>{if(!n){i(``);return}let a=r.length;if(a<e.length){let n=setTimeout(()=>{i(e.slice(0,a+1))},t);return()=>clearTimeout(n)}},[n,r,e,t]),{displayedText:r,isComplete:r.length===e.length&&e.length>0}},Yi=(e,t,n)=>{let[r,i]=(0,b.useState)(!1);return(0,b.useEffect)(()=>{if(!e)return;let t=e.animate??!1,r=e.delay??35;if(!t){let e=setTimeout(()=>{n()},r);return()=>clearTimeout(e)}let a=setTimeout(()=>{i(!0)},r);return()=>clearTimeout(a)},[e,n]),{isTyping:r,setIsTyping:i}},Xi=({line:e})=>{let t=e.depth??0;return t===0?null:(0,O.jsxs)(O.Fragment,{children:[(e.connectors??[]).slice(0,t-1).map((e,t)=>(0,O.jsx)(`span`,{className:`tree-connector ${e?`tree-connector-pipe`:`tree-connector-empty`}`},t)),(0,O.jsx)(`span`,{className:`tree-connector ${e.isLast?`tree-connector-last`:`tree-connector-mid`}`})]})},Zi=({visibleLines:e,isTyping:t,currentLine:n,displayedText:r})=>(0,O.jsxs)(O.Fragment,{children:[e.map((e,t)=>(0,O.jsxs)(`div`,{className:`${K.line} ${e.className??``}`,children:[e.prefix&&(0,O.jsx)(`span`,{className:K.prefix,children:e.prefix}),(0,O.jsx)(Xi,{line:e}),(0,O.jsx)(`span`,{dangerouslySetInnerHTML:{__html:e.text}})]},t)),t&&n&&(0,O.jsxs)(`div`,{className:`${K.line} ${n.className??``}`,children:[n.prefix&&(0,O.jsx)(`span`,{className:K.prefix,children:n.prefix}),(0,O.jsx)(Xi,{line:n}),(0,O.jsx)(`span`,{dangerouslySetInnerHTML:{__html:r}}),(0,O.jsx)(`span`,{className:K.cursor})]})]}),Qi=(e,t,n)=>{if(e&&!t)return n},$i=({demos:e,loop:t=!0,typingSpeed:n=12,startAnimation:r,shouldAnimate:i=!0,onComplete:a,hideHeader:o=!1,minHeight:s})=>{let[c,l]=(0,b.useState)(0),[u,d]=(0,b.useState)(0),[f,p]=(0,b.useState)([]),[m,h]=(0,b.useState)(!i),[g,_]=(0,b.useState)(!i),v=(0,b.useRef)(null);(0,b.useEffect)(()=>{if(!i){let t=e.flatMap(e=>e.lines);p(t),_(!0),a?.()}},[i,e,a]);let y=e[c],x=y?.lines[u];(0,b.useEffect)(()=>{if(r!==void 0){r&&!m&&h(!0);return}let e=new IntersectionObserver(e=>{e[0]?.isIntersecting&&!m&&h(!0)},Li),t=v.current;return t&&e.observe(t),()=>{t&&e.unobserve(t)}},[m,r]);let S=(0,b.useCallback)(()=>{d(0),p([])},[]),C=(0,b.useCallback)(()=>{let n=c===e.length-1;n&&t?(l(0),S()):n&&!t?(_(!0),a?.()):n||(l(c+1),S())},[c,e.length,t,S,a]),w=(0,b.useCallback)(()=>{let e=u===y.lines.length-1;if(x&&p(e=>e.concat(x)),e){let e=y.pauseAfter??2e3;setTimeout(C,e)}else d(u+1)},[u,y,C,x]),{isTyping:T,setIsTyping:E}=Yi(Qi(m,g,x),f,w),{displayedText:ee,isComplete:te}=Ji(x?.text??``,n,T);(0,b.useEffect)(()=>{te&&T&&(E(!1),w())},[te,T,w,E]);let ne={visibleLines:f,isTyping:T,currentLine:x,displayedText:ee};return o?(0,O.jsx)(`div`,{ref:v,className:`bg-transparent`,children:(0,O.jsx)(`div`,{className:K.content,children:(0,O.jsx)(Zi,{...ne})})}):(0,O.jsx)(`div`,{ref:v,children:(0,O.jsx)(qi,{className:Ri,minHeight:s,children:(0,O.jsx)(`div`,{className:K.content,children:(0,O.jsx)(Zi,{...ne})})})})},ea=`pastoralist-hero-animation-seen`,ta=[`#ff0000`,`#ff8000`,`#ffff00`,`#00ff00`,`#0080ff`,`#8000ff`],na=()=>Dt()?!0:sessionStorage.getItem(ea)===`true`,ra=e=>v({id:`hero`,initial:e?`done`:`terminalVisible`,states:{idle:{after:{500:`logoVisible`}},logoVisible:{after:{700:`textVisible`}},textVisible:{after:{400:`terminalVisible`}},terminalVisible:{on:{TERMINAL_DONE:`terminalComplete`}},terminalComplete:{after:{1200:`rainbow`}},rainbow:{after:{600:`done`}},done:{}}}),ia=[.16,1,.3,1],J={section:`relative flex items-start justify-center px-4 md:px-8 pt-6 pb-16 md:pt-8 md:pb-20 overflow-hidden min-h-screen`,article:`max-w-2xl md:max-w-5xl w-full`,logoHeader:`text-center mb-10 md:mb-12`,logo:`mx-auto h-24 w-24 md:h-36 md:w-36`,main:`flex flex-col-reverse gap-10 lg:flex-row lg:items-center lg:gap-10 lg:justify-between`,aside:`mt-6 lg:mt-0 w-full text-left lg:flex-[1.05]`,terminalFrame:`relative mx-auto w-full max-w-lg lg:mx-0`,contentHeader:`text-center lg:max-w-2xl lg:flex-[0.95] lg:text-left`,h1:`text-3xl sm:text-4xl md:text-5xl lg:text-[3.35rem] font-black leading-[1.05] tracking-tight mb-8`,nav:`flex flex-col sm:flex-row items-center sm:items-stretch gap-4 sm:gap-5 justify-center lg:justify-start`,codeBlock:`flex h-12 w-full max-w-md items-center gap-3 rounded-2xl border border-base-content/10 bg-base-100/85 px-3 shadow-sm shadow-base-content/5 backdrop-blur sm:w-auto`,code:`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-[0.95rem] font-medium`},Y={logoAlt:`Pastoralist Logo`,headingStart:`Pastoralist`,headingMid:`tracks, documents, and cleans up your npm dependency overrides`,headingHighlight:`automatically`,emoji:`👍`,command:`bun add -g pastoralist`,docsSlug:`introduction`,buttonText:`Get Started`},aa=[`idle`,`logoVisible`,`textVisible`,`terminalVisible`,`terminalComplete`,`rainbow`,`done`];function oa(e,t){let n=aa.indexOf(t);return aa.slice(n).some(t=>e.matches(t))}function sa(){let[e]=(0,b.useState)(na),[t,n]=y((0,b.useMemo)(()=>ra(e),[e])),r=(0,b.useRef)(null),a=`/pastoralist`,o=a.endsWith(`/`)?a:`/pastoralist/`,s=oa(t,`logoVisible`),l=oa(t,`textVisible`),u=oa(t,`terminalVisible`),d=oa(t,`terminalComplete`),f=oa(t,`rainbow`),p=oa(t,`done`);return(0,b.useEffect)(()=>{let t=r.current;if(e||!f||!t)return;let n=t.getBoundingClientRect(),i={particleCount:100,spread:70,origin:{x:(n.left+n.width/2)/window.innerWidth,y:(n.top+n.height/2)/window.innerHeight},colors:ta};ri(()=>import(`./confetti.module-cSqhLIxa.js`),[]).then(({default:e})=>e(i)).catch(()=>void 0)},[f,e]),(0,O.jsxs)(`section`,{id:`hero`,className:J.section,children:[(0,O.jsx)(la,{}),(0,O.jsx)(Ii,{}),(0,O.jsxs)(`article`,{className:J.article,style:{position:`relative`,zIndex:1},children:[(0,O.jsx)(`header`,{className:J.logoHeader,children:(0,O.jsx)(Ni,{maskSrc:`${o}pastoralist-logo.svg`,children:(0,O.jsx)(i.img,{src:`${o}pastoralist-logo.svg`,alt:Y.logoAlt,className:J.logo,initial:!e&&{opacity:0,y:16,scale:.75},animate:s?{opacity:1,y:0,scale:1}:void 0,transition:{duration:.5,ease:ia}})})}),(0,O.jsxs)(`main`,{className:J.main,children:[(0,O.jsx)(i.aside,{className:J.aside,initial:!e&&{opacity:0,x:-32},animate:u?{opacity:1,x:0}:void 0,transition:{duration:.7,ease:ia},children:(0,O.jsxs)(`div`,{className:J.terminalFrame,children:[(0,O.jsx)(`div`,{className:`pointer-events-none absolute inset-x-8 bottom-2 h-24 rounded-full bg-gradient-to-r from-sky-500/18 via-cyan-400/10 to-emerald-400/16 blur-3xl`,"aria-hidden":`true`}),(0,O.jsx)($i,{demos:Ki,loop:!1,typingSpeed:18,startAnimation:u,shouldAnimate:!e,minHeight:zi,onComplete:()=>{n({type:`TERMINAL_DONE`}),sessionStorage.setItem(ea,`true`)}})]})}),(0,O.jsxs)(i.header,{className:J.contentHeader,initial:!e&&{opacity:0,y:32},animate:l?{opacity:1,y:0}:void 0,transition:{duration:.7,ease:ia},children:[(0,O.jsxs)(`h1`,{className:J.h1,children:[(0,O.jsx)(`span`,{className:`font-bold gradient-text`,children:Y.headingStart}),` `,Y.headingMid,d&&(0,O.jsx)(i.span,{ref:r,className:`inline-block ml-2 ${f?`rainbow-text animate-rainbow-bounce`:`text-glow-shimmer animate-slide-in-right`}`,initial:{opacity:0,x:20},animate:{opacity:1,x:0},transition:{duration:.4,ease:`easeOut`},children:Y.headingHighlight}),p&&(0,O.jsx)(`span`,{className:`inline-block animate-thumbs-up`,children:Y.emoji})]}),(0,O.jsxs)(`nav`,{className:J.nav,children:[(0,O.jsx)(c,{to:`/docs/$slug/`,params:{slug:Y.docsSlug},preload:`intent`,children:(0,O.jsxs)(`button`,{className:`btn btn-lg btn-primary rounded-2xl`,children:[Y.buttonText,(0,O.jsx)(zt,{className:`size-4`})]})}),(0,O.jsxs)(`figure`,{className:J.codeBlock,children:[(0,O.jsx)(`code`,{className:J.code,children:Y.command}),(0,O.jsx)(Mi,{})]})]})]})]})]})]})}var ca=`polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 150%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)`;function la(){return(0,O.jsxs)(`figure`,{className:`absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl`,"aria-hidden":`true`,children:[(0,O.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] block`,style:{clipPath:ca}}),(0,O.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(100%)] sm:w-[72.1875rem] block`,style:{clipPath:ca}})]})}var ua=[`Tracks override dependencies`,`Documents security fixes with CVE references`,`Cleans up orphaned overrides`,`Works with npm, yarn, pnpm, and bun`],da={list:`mt-6 divide-y divide-base-content/10 border-y border-base-content/10 text-base-content/80`,item:`flex items-start gap-3 py-3`,icon:`check-icon mt-0.5`};function fa({isVisible:e}){return(0,O.jsx)(`ul`,{className:da.list,children:ua.map((t,n)=>(0,O.jsxs)(i.li,{className:da.item,initial:{opacity:0,x:-8},animate:e?{opacity:1,x:0}:{},transition:{duration:.3,delay:n*.15,ease:`easeOut`},children:[(0,O.jsx)(i.span,{className:da.icon,initial:{opacity:0,scale:.5},animate:e?{opacity:1,scale:1}:{},transition:{duration:.3,delay:n*.15,ease:`easeOut`},children:(0,O.jsx)(Bt,{className:`w-5 h-5`})}),(0,O.jsx)(`span`,{children:t})]},t))})}var pa=[{id:`cli`,label:`CLI Output`},{id:`json`,label:`package.json`}],ma=`{
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
}`;function ha({line:e}){let t=`${K.line} ${e.className??``}`,n=e.prefix?(0,O.jsx)(`span`,{className:K.prefix,children:e.prefix}):null,r={__html:e.text};return(0,O.jsxs)(`div`,{className:t,children:[n,(0,O.jsx)(Xi,{line:e}),(0,O.jsx)(`span`,{dangerouslySetInnerHTML:r})]})}function ga(){let e=Gi[0].lines.map((e,t)=>(0,O.jsx)(ha,{line:e},t));return(0,O.jsx)(`div`,{className:K.content,children:(0,O.jsx)(`div`,{className:`space-y-1`,children:e})})}function _a({shouldAnimate:e,onComplete:t}){return e?(0,O.jsx)($i,{demos:Gi,loop:!1,typingSpeed:20,shouldAnimate:!0,onComplete:t,hideHeader:!0}):(0,O.jsx)(ga,{})}function va(){return(0,O.jsx)(`div`,{className:K.content,children:(0,O.jsx)(`pre`,{className:`text-sm leading-relaxed text-base-content`,children:(0,O.jsx)(`code`,{children:ma})})})}function ya({shouldAnimate:e=!1,onComplete:t=()=>void 0}){let[n,r]=(0,b.useState)(`cli`),i=n===`cli`?(0,O.jsx)(_a,{shouldAnimate:e,onComplete:t}):(0,O.jsx)(va,{});return(0,O.jsx)(qi,{className:`${K.window} ${K.windowMaxWidth}`,tabs:pa,activeTab:n,onTabChange:r,minHeight:`350px`,children:i})}var ba=new Map,xa=new WeakMap,Sa=0,Ca;function wa(e){return e?xa.has(e)?xa.get(e):(Sa+=1,xa.set(e,Sa.toString()),xa.get(e)):`0`}function Ta(e){return Object.keys(e).sort().filter(t=>e[t]!==void 0).map(t=>`${t}_${t===`root`?wa(e.root):e[t]}`).toString()}function Ea(e){let t=Ta(e),n=ba.get(t);if(!n){let r=new Map,i,a=new IntersectionObserver(t=>{t.forEach(t=>{let n=t.isIntersecting&&i.some(e=>t.intersectionRatio>=e);e.trackVisibility&&t.isVisible===void 0&&(t.isVisible=n),[...r.get(t.target)??[]].forEach(e=>{e(n,t)})})},e);i=a.thresholds||(Array.isArray(e.threshold)?e.threshold:[e.threshold||0]),n={id:t,observer:a,elements:r},ba.set(t,n)}return n}function Da(e,t,n={},r=Ca){if(window.IntersectionObserver===void 0&&r!==void 0){let i=e.getBoundingClientRect();return t(r,{isIntersecting:r,target:e,intersectionRatio:typeof n.threshold==`number`?n.threshold:0,time:0,boundingClientRect:i,intersectionRect:i,rootBounds:i}),()=>{}}let{id:i,observer:a,elements:o}=Ea(n),s=o.get(e)||[];return o.has(e)||o.set(e,s),s.push(t),a.observe(e),function(){s.splice(s.indexOf(t),1),s.length===0&&(o.delete(e),a.unobserve(e)),o.size===0&&(a.disconnect(),ba.delete(i))}}b.Component;function Oa({threshold:e,delay:t,trackVisibility:n,rootMargin:r,scrollMargin:i,root:a,triggerOnce:o,skip:s,initialInView:c,fallbackInView:l,onChange:u}={}){let[d,f]=b.useState(null),p=b.useRef(u),m=b.useRef(c),[h,g]=b.useState({inView:!!c,entry:void 0});p.current=u,b.useEffect(()=>{if(m.current===void 0&&(m.current=c),s||!d)return;let u;return u=Da(d,(e,t)=>{let n=m.current;m.current=e,!(n===void 0&&!e)&&(g({inView:e,entry:t}),p.current&&p.current(e,t),t.isIntersecting&&o&&u&&(u(),u=void 0))},{root:a,rootMargin:r,scrollMargin:i,threshold:e,trackVisibility:n,delay:t},l),()=>{u&&u()}},[Array.isArray(e)?e.toString():e,d,a,r,i,o,s,n,l,t]);let _=h.entry?.target,v=b.useRef(void 0);!d&&_&&!o&&!s&&v.current!==_&&(v.current=_,g({inView:!!c,entry:void 0}),m.current=c);let y=[f,h.inView,h.entry];return y.ref=y[0],y.inView=y[1],y.entry=y[2],y}(`useInsertionEffect`in b?b.useInsertionEffect:void 0)??b.useLayoutEffect??b.useEffect;function ka(e={}){let{threshold:t=.1,triggerOnce:n=!0,onChange:r}=e,{ref:i,inView:a}=Oa({threshold:t,triggerOnce:n,onChange:r,initialInView:Dt()});return{ref:i,isVisible:a}}var Aa=`pastoralist-codeblock-animation-seen`,ja=()=>Dt()?!0:sessionStorage.getItem(Aa)===`true`,X={section:`py-16 lg:py-24 bg-base-200/50 border-y border-base-content/10`,article:`lg:flex gap-10 items-center max-w-2xl md:max-w-5xl mx-auto px-4 transition-all duration-700 ease-out`,articleVisible:`opacity-100 translate-y-0`,articleHidden:`opacity-0 translate-y-8`,header:`lg:max-w-md flex flex-col justify-center`,h2:`text-3xl lg:text-4xl font-black`,description:`mt-6 text-lg text-base-content/80`,nav:`flex gap-4 mt-8`,aside:`flex-1 mt-8 lg:mt-0`},Ma={headingStart:`Simple`,headingEnd:`Override Tracking`,description:`Pastoralist creates an appendix that documents why each override exists. Track which packages depend on each override, detect security fixes, and clean up stale overrides when they're no longer needed.`,learnMoreSlug:`introduction`,githubHref:`https://github.com/yowainwright/pastoralist`};function Na(){let[e,t]=(0,b.useState)(ja),{ref:n,isVisible:r}=ka(),i=e||r;return(0,O.jsx)(`section`,{id:`features`,className:X.section,children:(0,O.jsxs)(`article`,{ref:n,className:`${X.article} ${i?X.articleVisible:X.articleHidden}`,children:[(0,O.jsxs)(`header`,{className:X.header,children:[(0,O.jsxs)(`h2`,{className:X.h2,children:[(0,O.jsx)(`span`,{className:`gradient-text`,children:Ma.headingStart}),` `,Ma.headingEnd]}),(0,O.jsx)(`p`,{className:X.description,children:Ma.description}),(0,O.jsx)(fa,{isVisible:i}),(0,O.jsxs)(`nav`,{className:X.nav,children:[(0,O.jsx)(c,{to:`/docs/$slug/`,params:{slug:Ma.learnMoreSlug},preload:`intent`,className:`btn btn-lg btn-primary rounded-2xl`,children:`Learn More`}),(0,O.jsx)(`a`,{href:Ma.githubHref,className:`btn btn-lg btn-ghost rounded-2xl`,children:`View on GitHub`})]})]}),(0,O.jsx)(`aside`,{className:X.aside,children:(0,O.jsx)(ya,{shouldAnimate:!e&&r,onComplete:()=>{t(!0),sessionStorage.setItem(Aa,`true`)}})})]})})}var Z=[{title:`The Problem`,description:`Overrides exist but nobody knows why. Which packages depend on it?`},{title:`Run Pastoralist`,description:`Pastoralist scans your dependencies and documents your overrides.`},{title:`Automatic Documentation`,description:`Now you know why each override exists, what depends on it, and any associated CVEs.`}],Pa=[`Undocumented overrides`,`Execute pastoralist`,`Pastoralist manages the rest`],Fa=5,Q=[`  "pastoralist": {`,`    "appendix": {`,`      "lodash@4.17.21": {`,`        "dependents": {`,`          "express": "^4.18.0"`,`        },`,`        "ledger": {`,`          "reason": "security",`,`          "cve": "CVE-2020-8203"`,`        }`,`      }`,`    }`,`  }`],Ia=44+(Fa+Q.length)*16,La=(Fa+Q.length)*16,Ra=`pastoralist`;Q.length;var za={base:`step cursor-pointer transition-all duration-200 text-base-content`,active:`step-primary [&::before]:!bg-gradient-to-b [&::before]:!from-blue-400 [&::before]:!to-blue-500 [&::before]:shadow-md [&::before]:shadow-blue-500/25 [&::before]:!text-white [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-29px)] [&::before]:!z-[999] [&::after]:!bg-blue-500`,inactive:`[&::before]:text-base-content [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-32px)] [&::before]:!z-[999] [&::after]:!bg-base-300`},Ba={before:`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white [background:linear-gradient(to_bottom,var(--color-red-400),var(--color-red-500))] border-2 border-red-600 shadow-md shadow-red-500/25`,cli:`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white [background:linear-gradient(to_bottom,var(--color-blue-400),var(--color-blue-500))] border-2 border-blue-600 shadow-md shadow-blue-500/25`,after:`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white [background:linear-gradient(to_bottom,var(--color-green-400),var(--color-green-500))] border-2 border-green-600 shadow-md shadow-green-500/25`},Va=/"([^"]+)":/g,Ha=/: "([^"]+)"/g,Ua=[`"pastoralist"`,`"appendix"`,`"lodash@`,`"dependents"`,`"express"`,`"ledger"`,`"reason"`,`"cve"`],Wa=e=>Ua.some(t=>e.includes(t)),Ga=e=>e.replace(Va,`<span class="text-primary">"$1"</span>:`).replace(Ha,`: <span class="text-success">"$1"</span>`),Ka=({stepNumber:e,title:t,description:n,visible:r,showEmoji:i,verticalCenter:a})=>r?(0,O.jsx)(`div`,{className:`absolute z-10 w-64 right-4 ${a?`top-1/2 -translate-y-1/2`:`top-12`} animate-pop-in`,children:(0,O.jsxs)(`div`,{className:`bg-base-100/95 backdrop-blur-sm border-2 border-blue-600 rounded-lg shadow-xl shadow-blue-500/15 p-4`,children:[(0,O.jsxs)(`div`,{className:`flex items-center gap-2 mb-1`,children:[(0,O.jsx)(`span`,{className:`flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-b from-blue-400 to-blue-500 border-2 border-blue-600 text-white text-sm font-bold shadow-md shadow-blue-500/25`,children:e}),(0,O.jsx)(`span`,{className:`font-bold text-base-content`,children:t})]}),(0,O.jsxs)(`div`,{className:`text-sm text-base-content/70 ml-8`,children:[n,i&&(0,O.jsx)(`span`,{className:`inline-block ml-1 animate-bounce-once`,children:`⚡`})]})]})}):null,qa=({isActive:e})=>(0,O.jsx)(qi,{isActive:e,fileName:`package.json`,children:(0,O.jsxs)(`div`,{className:K.contentPadding,style:{height:`auto`},children:[(0,O.jsx)(`div`,{className:`${K.line} text-base-content/50`,children:`{`}),(0,O.jsxs)(`div`,{className:K.line,children:[`  `,(0,O.jsx)(`span`,{className:`text-primary`,children:`"overrides"`}),`: `,`{`]}),(0,O.jsxs)(`div`,{className:K.line,children:[`    `,(0,O.jsx)(`span`,{className:`text-primary`,children:`"lodash"`}),`:`,` `,(0,O.jsx)(`span`,{className:`text-success`,children:`"4.17.21"`})]}),(0,O.jsx)(`div`,{className:K.line,children:`  }`}),(0,O.jsx)(`div`,{className:`${K.line} text-base-content/50`,children:`}`})]})}),Ja=({isActive:e,typedCommand:t,phase:n,showSpinner:r,showSuccess:i})=>{let a=n===`step2`;return(0,O.jsx)(qi,{isActive:e,children:(0,O.jsxs)(`div`,{className:`${K.contentPadding}`,style:{height:`auto`,padding:`0.75rem 1rem`},children:[(0,O.jsxs)(`div`,{className:K.line,children:[(0,O.jsx)(`span`,{className:K.prefix,children:`$`}),(0,O.jsx)(`span`,{children:t}),a&&(0,O.jsx)(`span`,{className:K.cursor})]}),r&&(0,O.jsxs)(`div`,{className:`${K.line} text-cyan-400`,children:[(0,O.jsx)(`span`,{className:`inline-block animate-spin mr-2`,children:`⠋`}),`Scanning overrides...`]}),i&&(0,O.jsx)(`div`,{className:`${K.line} text-success`,children:`└── The herd is safe! 🐑`})]})})},Ya=({line:e,isAdded:t=!1,className:n})=>{let r=t?`terminal-line json-added`:`terminal-line`,i=n?`${r} ${n}`:r;return Wa(e)?(0,O.jsx)(`div`,{className:i,dangerouslySetInnerHTML:{__html:Ga(e)}}):(0,O.jsx)(`div`,{className:i,children:e})},Xa=({isActive:e,appendixLines:t})=>{let n=Q.slice(0,t),r=Q.slice(t),i=t>0;return(0,O.jsx)(qi,{isActive:e,fileName:`package.json`,minHeight:`${Ia}px`,children:(0,O.jsxs)(`div`,{className:K.contentPadding,style:{minHeight:`${La}px`},children:[(0,O.jsx)(`div`,{className:`${K.line} text-base-content/50`,children:`{`}),(0,O.jsxs)(`div`,{className:K.line,children:[`  `,(0,O.jsx)(`span`,{className:`text-primary`,children:`"overrides"`}),`: `,`{`]}),(0,O.jsxs)(`div`,{className:K.line,children:[`    `,(0,O.jsx)(`span`,{className:`text-primary`,children:`"lodash"`}),`:`,` `,(0,O.jsx)(`span`,{className:`text-success`,children:`"4.17.21"`})]}),(0,O.jsxs)(`div`,{className:K.line,children:[`  }`,i&&`,`]}),n.map((e,t)=>(0,O.jsx)(Ya,{line:e,isAdded:!0},t)),r.map((e,t)=>(0,O.jsx)(Ya,{line:e,isAdded:!0,className:`invisible`},`hidden-${t}`)),(0,O.jsx)(`div`,{className:`${K.line} text-base-content/50`,children:`}`})]})})},Za=(e,t)=>e===3&&t===`complete`,Qa=(e,t,n)=>e>t||Za(t,n),$a=({activeStep:e,phase:t,onStepClick:n})=>(0,O.jsx)(`ul`,{className:`steps w-full`,children:Pa.map((r,i)=>{let a=i+1,o=Qa(e,a,t),s=e>=a?za.active:za.inactive,c=o?`✓`:a;return(0,O.jsx)(`li`,{className:`${za.base} ${s}`,onClick:()=>n(a),"data-content":c,children:r},i)})});function eo(e,t){let[n,r]=(0,b.useState)(`idle`),[i,a]=(0,b.useState)(``),[o,s]=(0,b.useState)(!1),[c,l]=(0,b.useState)(!1),[u,d]=(0,b.useState)(0),[f,p]=(0,b.useState)(0),[m,h]=(0,b.useState)(!1),[g,_]=(0,b.useState)(!1),[v,y]=(0,b.useState)(!1),x=(0,b.useRef)(!1),S=(0,b.useRef)(null),C=(0,b.useRef)(null),w=(0,b.useCallback)(()=>{S.current&&=(clearInterval(S.current),null)},[]),T=(0,b.useCallback)(e=>{let n=e;S.current=setInterval(()=>{n<Q.length?(d(n+1),n++):(w(),r(`complete`),y(!0),t?.(),setTimeout(()=>{h(!0)},100))},25)},[w]),E=(0,b.useCallback)(()=>{r(`step2`),p(2);let e=0;S.current=setInterval(()=>{e<11?(a(Ra.slice(0,e+1)),e++):(w(),setTimeout(()=>{r(`checking`),s(!0),setTimeout(()=>{s(!1),l(!0),setTimeout(()=>{r(`step3`),p(3),T(0)},200)},350)},60))},10)},[w,T]),ee=(0,b.useCallback)(()=>{w(),a(``),s(!1),l(!1),d(0),h(!1)},[w]),te=(0,b.useCallback)(()=>{ee(),r(`step1`),p(1),setTimeout(()=>{E()},400)},[ee,E]),ne=(0,b.useCallback)(()=>{let e=C.current;if(!g||!e)return;_(!1);let{phase:t,typedCommand:n,appendixLines:i}=e;if(C.current=null,t===`step2`&&n.length<11){let e=n.length;S.current=setInterval(()=>{e<11?(a(Ra.slice(0,e+1)),e++):(w(),setTimeout(()=>{r(`checking`),s(!0),setTimeout(()=>{s(!1),l(!0),setTimeout(()=>{r(`step3`),p(3),T(0)},200)},350)},60))},10)}else{if(!(t===`step3`&&i<Q.length))return;T(i)}},[g,w,T]),{ref:re}=Oa({threshold:.3,onChange:t=>{t&&e&&(x.current?g&&ne():(x.current=!0,te()))}});(0,b.useEffect)(()=>{!e&&!x.current&&(x.current=!0,r(`complete`),a(Ra),d(Q.length),p(3),y(!0),h(!0),l(!0))},[e]);let D=e=>{w(),C.current={phase:n,typedCommand:i,appendixLines:u},_(!0),y(!1),p(e);let t={1:`step1`,2:`step2`,3:`step3`}[e];t&&r(t)},O=e=>g?f===e:f>=e||v;return{containerRef:re,phase:n,typedCommand:i,showSpinner:o,showSuccess:c,appendixLines:u,activeStep:f,showLightning:m,showAllPopovers:v,isStep1Active:O(1),isStep2Active:O(2),isStep3Active:O(3),handleStepClick:D}}function to({shouldAnimate:e=!0,onComplete:t}){let{containerRef:n,phase:r,typedCommand:i,showSpinner:a,showSuccess:o,appendixLines:s,activeStep:c,showLightning:l,isStep1Active:u,isStep2Active:d,isStep3Active:f,handleStepClick:p}=eo(e,t);return(0,O.jsxs)(`div`,{ref:n,className:`flex flex-col gap-6`,children:[(0,O.jsx)($a,{activeStep:c,phase:r,onStepClick:p}),(0,O.jsx)(`div`,{className:`h-6 w-px bg-primary/20 mx-auto`}),(0,O.jsxs)(`div`,{className:`grid md:grid-cols-2 gap-6 lg:gap-8`,children:[(0,O.jsxs)(`div`,{className:`flex flex-col gap-4`,children:[(0,O.jsxs)(`div`,{className:`relative flex flex-col`,children:[(0,O.jsx)(Ka,{stepNumber:1,title:Z[0].title,description:Z[0].description,visible:u}),(0,O.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,O.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Undocumented overrides`}),(0,O.jsx)(`span`,{className:Ba.before,children:`Before`})]}),(0,O.jsx)(qa,{isActive:u})]}),(0,O.jsxs)(`div`,{className:`relative`,children:[(0,O.jsx)(Ka,{stepNumber:2,title:Z[1].title,description:Z[1].description,visible:d}),(0,O.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,O.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Execute the pastoralist cli`}),(0,O.jsx)(`span`,{className:Ba.cli,children:`CLI`})]}),(0,O.jsx)(Ja,{isActive:d,typedCommand:i,phase:r,showSpinner:a,showSuccess:o})]})]}),(0,O.jsxs)(`div`,{className:`relative flex flex-col`,children:[(0,O.jsx)(Ka,{stepNumber:3,title:Z[2].title,description:Z[2].description,visible:f,showEmoji:l,verticalCenter:!0}),(0,O.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,O.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Documented overrides`}),(0,O.jsx)(`span`,{className:Ba.after,children:`After`})]}),(0,O.jsx)(Xa,{isActive:f,appendixLines:s})]})]})]})}function no(){return(0,O.jsxs)(`div`,{className:`flex flex-col gap-6`,children:[(0,O.jsx)(`ul`,{className:`steps w-full`,children:Pa.map((e,t)=>(0,O.jsx)(`li`,{className:`step cursor-pointer transition-all duration-200 text-base-content step-primary [&::before]:!bg-gradient-to-b [&::before]:!from-blue-400 [&::before]:!to-blue-500 [&::before]:shadow-md [&::before]:shadow-blue-500/25 [&::before]:!text-white [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-29px)] [&::before]:!z-[999] [&::after]:!bg-blue-500`,"data-content":`✓`,children:e},t))}),(0,O.jsx)(`div`,{className:`h-6 w-px bg-primary/20 mx-auto`}),(0,O.jsxs)(`div`,{className:`grid md:grid-cols-2 gap-6 lg:gap-8`,children:[(0,O.jsxs)(`div`,{className:`flex flex-col gap-4`,children:[(0,O.jsxs)(`div`,{className:`relative flex flex-col`,children:[(0,O.jsx)(Ka,{stepNumber:1,title:Z[0].title,description:Z[0].description,visible:!0}),(0,O.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,O.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Undocumented overrides`}),(0,O.jsx)(`span`,{className:`badge badge-lg text-white bg-gradient-to-b from-red-400 to-red-500 border-2 border-red-600 shadow-md shadow-red-500/25 p-2`,children:`Before`})]}),(0,O.jsx)(qa,{isActive:!0})]}),(0,O.jsxs)(`div`,{className:`relative`,children:[(0,O.jsx)(Ka,{stepNumber:2,title:Z[1].title,description:Z[1].description,visible:!0}),(0,O.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,O.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Execute the pastoralist cli`}),(0,O.jsx)(`span`,{className:`badge badge-lg text-white bg-gradient-to-b from-blue-400 to-blue-500 border-2 border-blue-600 shadow-md shadow-blue-500/25 p-2`,children:`CLI`})]}),(0,O.jsx)(Ja,{isActive:!0,typedCommand:Ra,phase:`complete`,showSpinner:!1,showSuccess:!0})]})]}),(0,O.jsxs)(`div`,{className:`relative flex flex-col`,children:[(0,O.jsx)(Ka,{stepNumber:3,title:Z[2].title,description:Z[2].description,visible:!0,showEmoji:!0,verticalCenter:!0}),(0,O.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,O.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Documented overrides`}),(0,O.jsx)(`span`,{className:`badge badge-lg text-white bg-gradient-to-b from-green-400 to-green-500 border-2 border-green-600 shadow-md shadow-green-500/25 p-2`,children:`After`})]}),(0,O.jsx)(Xa,{isActive:!0,appendixLines:Q.length})]})]})]})}var ro=`pastoralist-transform-animation-seen`,io=()=>Dt()?!0:sessionStorage.getItem(ro)===`true`,ao=()=>sessionStorage.setItem(ro,`true`);function oo({isStatic:e}){return e?(0,O.jsx)(no,{}):(0,O.jsx)(to,{shouldAnimate:!0,onComplete:ao})}var so=`polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 150%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)`,co={section:`relative py-16 lg:py-24 overflow-hidden`,article:`max-w-2xl md:max-w-6xl mx-auto px-4`,header:`text-center mb-10 transition-all duration-700 ease-out`,headerVisible:`opacity-100 translate-y-0`,headerHidden:`opacity-0 translate-y-8`,h2:`text-3xl lg:text-4xl font-black text-base-content`,description:`mt-4 text-lg text-base-content/80 max-w-2xl mx-auto`},lo={headingStart:`See the`,headingHighlight:`Transformation`,description:`Pastoralist reads your overrides and creates a detailed appendix documenting why each one exists, who depends on it, and any security context.`};function uo(){let[e]=(0,b.useState)(io),{ref:t,isVisible:n}=ka();return(0,O.jsxs)(`section`,{id:`demo`,className:co.section,children:[(0,O.jsx)(fo,{}),(0,O.jsxs)(`article`,{className:co.article,children:[(0,O.jsxs)(`header`,{ref:t,className:`${co.header} ${n?co.headerVisible:co.headerHidden}`,children:[(0,O.jsxs)(`h2`,{className:co.h2,children:[lo.headingStart,` `,(0,O.jsx)(`span`,{className:`gradient-text`,children:lo.headingHighlight})]}),(0,O.jsx)(`p`,{className:co.description,children:lo.description})]}),(0,O.jsx)(oo,{isStatic:e})]})]})}function fo(){return(0,O.jsxs)(`figure`,{className:`absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl`,"aria-hidden":`true`,children:[(0,O.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] block`,style:{clipPath:so}}),(0,O.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(100%)] sm:w-[72.1875rem] block`,style:{clipPath:so}})]})}var po=`get-started`,mo={heading:`Ready to`,headingHighlight:`get started`,command:`bun add -g pastoralist`,buttonText:`Learn More`,docsSlug:`introduction`},$={section:`py-16 lg:py-24 border-t border-base-content/10`,article:`max-w-2xl md:max-w-6xl mx-auto px-4 text-center`,articleVisible:`animate-in fade-in slide-in-from-bottom-4 duration-700`,articleHidden:`opacity-0`,heading:`text-2xl lg:text-3xl font-black text-base-content mb-6`,nav:`flex flex-col justify-center items-center gap-4`,codeBlock:`flex h-12 w-fit items-center gap-3 rounded-2xl border border-base-content/10 bg-base-100/85 px-3 shadow-sm shadow-base-content/5 backdrop-blur`,code:`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-[0.95rem] font-medium`,button:`btn btn-lg btn-primary rounded-2xl`};function ho({id:e=po}){let{ref:t,isVisible:n}=ka(),r=`${$.article} ${n?$.articleVisible:$.articleHidden}`;return(0,O.jsx)(`section`,{id:e,className:$.section,children:(0,O.jsxs)(`article`,{ref:t,className:r,children:[(0,O.jsxs)(`h3`,{className:$.heading,children:[mo.heading,` `,(0,O.jsx)(`span`,{className:`gradient-text`,children:mo.headingHighlight}),`?`]}),(0,O.jsxs)(`nav`,{className:$.nav,children:[(0,O.jsxs)(`figure`,{className:$.codeBlock,children:[(0,O.jsx)(`code`,{className:$.code,children:mo.command}),(0,O.jsx)(Mi,{})]}),(0,O.jsx)(c,{to:`/docs/$slug/`,params:{slug:mo.docsSlug},preload:`intent`,children:(0,O.jsxs)(`button`,{className:$.button,children:[mo.buttonText,(0,O.jsx)(zt,{className:`size-4`})]})})]})]})})}function go(){return(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)(sa,{}),(0,O.jsx)(Na,{}),(0,O.jsx)(uo,{}),(0,O.jsx)(ho,{})]})}var _o=f({component:()=>(0,O.jsx)(s,{})}),vo=m({getParentRoute:()=>_o,path:`/`,component:()=>(0,O.jsx)(br,{children:(0,O.jsx)(go,{})})}),yo=m({getParentRoute:()=>_o,path:`/docs/$slug`,component:()=>(0,O.jsx)(vr,{children:(0,O.jsx)(Ci,{})})}),bo=_o.addChildren([vo,yo]),xo=()=>l({routeTree:bo,basepath:`/pastoralist`,trailingSlash:`always`});function So(){let e=document.getElementById(`root`);if(!e)throw Error(`Missing root element`);return e}var Co=xo(),wo=So(),To=wo.dataset.prerendered===`true`,Eo=To?(0,O.jsx)(h,{router:Co}):(0,O.jsx)(p,{router:Co});function Do(){return(0,b.useEffect)(()=>Ot(wo),[]),(0,O.jsx)(b.StrictMode,{children:(0,O.jsx)(kt,{children:Eo})})}var Oo=(0,O.jsx)(Do,{});To?(0,oe.hydrateRoot)(wo,Oo):(0,oe.createRoot)(wo).render(Oo);export{Qr as n,ri as t};
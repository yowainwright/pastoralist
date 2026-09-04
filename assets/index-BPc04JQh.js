const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/advanced-features-CDE-Hxko.js","assets/motion-L-CozVln.js","assets/rolldown-runtime-hePW80VL.js","assets/api-reference-BQ1CCMH2.js","assets/architecture-C6zN_q65.js","assets/codelab-AynkhyfN.js","assets/configuration-CIpSXfjW.js","assets/github-action-dc7u3fKw.js","assets/introduction-B8QY1pGr.js","assets/onboarding-BlVYGcIb.js","assets/security-DM0nmaDr.js","assets/setup-KcFQ4b7q.js","assets/troubleshooting-_KQA4d4F.js","assets/workspaces-D2igqyXP.js","assets/highlighter-8YLJHKgu.js","assets/shiki-BzV0Wj0L.js","assets/Mermaid-BvY_EFCH.js","assets/chunk-Y2CYZVJY-DsF7k-Jl.js","assets/src-B6xuSHsQ.js","assets/chunk-DU6HZSFF--Bm43uPP.js","assets/chunk-75Z2AOVW-WUygEAMf.js","assets/dist-v5Q1xZ2K.js","assets/chunk-PWAF6VOD-qDzXN1uz.js","assets/chunk-GMAD6QVW-DzCtSB8N.js","assets/chunk-P2QGCYS3-BDPySrk3.js","assets/chunk-4HAMMTFA-DO52W_6L.js","assets/rough.esm-Dy-Kn_BL.js","assets/chunk-GVQU2GXP-DW_dH0h-.js","assets/chunk-OSK3NFVY-7nvqMdJl.js","assets/line-BPilMZ2h.js","assets/path-fybaL0A-.js","assets/array-BifhSqXX.js","assets/graphlib-DS17s2tU.js","assets/chunk-L3NEJ4N5-C_n7NdPG.js"])))=>i.map(i=>d[i]);
import{r as e}from"./rolldown-runtime-hePW80VL.js";import{n as t,r as n,t as r}from"./motion-L-CozVln.js";import{n as i,t as a}from"./react-vendor-DvK5wWAH.js";import{a as o,c as s,i as c,l,n as u,o as d,r as f,s as p,t as m,u as h}from"./router-D5xBgYxp.js";import{t as g}from"./fuse-COMZIxA7.js";import{n as _,t as v}from"./state-CDQk7VAF.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var y=e(n(),1),b={};function x(e,t){let n=y.useRef(b);return n.current===b&&(n.current=e(t)),n}var S=Object.freeze([]);Object.freeze({});var C=typeof document<`u`?y.useLayoutEffect:()=>{};function w(e){y.useEffect(e,S)}var T=0,E=class e{static create(){return new e}currentId=T;start(e,t){this.clear(),this.currentId=setTimeout(()=>{this.currentId=T,t()},e)}isStarted(){return this.currentId!==T}clear=()=>{this.currentId!==T&&(clearTimeout(this.currentId),this.currentId=T)};disposeEffect=()=>this.clear};function D(){let e=x(E.create).current;return w(e.disposeEffect),e}function O(e,t){let n=[`mouse`,`pen`];return t||n.push(``,void 0),n.includes(e)}function ee(e,t){return t!=null&&!O(t)?0:typeof e==`function`?e():e}function te(e,t,n){let r=ee(e,n);return typeof r==`number`?r:r?.[t]}var k=t(),A=y.createContext({hasProvider:!1,timeoutMs:0,delayRef:{current:0},initialDelayRef:{current:0},timeout:new E,currentIdRef:{current:null},currentContextRef:{current:null}});function j(e){let{children:t,delay:n,timeoutMs:r=0}=e,i=y.useRef(n),a=y.useRef(n),o=y.useRef(null),s=y.useRef(null),c=D();return C(()=>{if(a.current=n,!o.current){i.current=n;return}i.current={open:te(i.current,`open`),close:te(n,`close`)}},[n,o,i,a]),(0,k.jsx)(A.Provider,{value:y.useMemo(()=>({hasProvider:!0,delayRef:i,initialDelayRef:a,currentIdRef:o,timeoutMs:r,currentContextRef:s,timeout:c}),[r,c]),children:t})}var ne=y.createContext(void 0),re=function(e){let{delay:t,closeDelay:n,timeout:r=400}=e,i=y.useMemo(()=>({open:t,close:n}),[t,n]);return(0,k.jsx)(ne.Provider,{value:t,children:(0,k.jsx)(j,{delay:i,timeoutMs:r,children:e.children})})},M=a();function ie(e){var t,n,r=``;if(typeof e==`string`||typeof e==`number`)r+=e;else if(typeof e==`object`){if(Array.isArray(e)){var i=e.length;for(t=0;t<i;t++)e[t]&&(n=ie(e[t]))&&(r&&(r+=` `),r+=n)}else for(n in e)e[n]&&(r&&(r+=` `),r+=n)}return r}function ae(){for(var e,t,n=0,r=``,i=arguments.length;n<i;n++)(e=arguments[n])&&(t=ie(e))&&(r&&(r+=` `),r+=t);return r}var oe=(e,t)=>{let n=Array(e.length+t.length);for(let t=0;t<e.length;t++)n[t]=e[t];for(let r=0;r<t.length;r++)n[e.length+r]=t[r];return n},se=(e,t)=>({classGroupId:e,validator:t}),N=(e=new Map,t=null,n)=>({nextPart:e,validators:t,classGroupId:n}),P=`-`,ce=[],le=`arbitrary..`,F=e=>{let t=fe(e),{conflictingClassGroups:n,conflictingClassGroupModifiers:r}=e;return{getClassGroupId:e=>{if(e.startsWith(`[`)&&e.endsWith(`]`))return de(e);let n=e.split(P);return ue(n,+(n[0]===``&&n.length>1),t)},getConflictingClassGroupIds:(e,t)=>{if(t){let t=r[e],i=n[e];return t?i?oe(i,t):t:i||ce}return n[e]||ce}}},ue=(e,t,n)=>{if(e.length-t===0)return n.classGroupId;let r=e[t],i=n.nextPart.get(r);if(i){let n=ue(e,t+1,i);if(n)return n}let a=n.validators;if(a===null)return;let o=t===0?e.join(P):e.slice(t).join(P),s=a.length;for(let e=0;e<s;e++){let t=a[e];if(t.validator(o))return t.classGroupId}},de=e=>e.slice(1,-1).indexOf(`:`)===-1?void 0:(()=>{let t=e.slice(1,-1),n=t.indexOf(`:`),r=t.slice(0,n);return r?le+r:void 0})(),fe=e=>{let{theme:t,classGroups:n}=e;return pe(n,t)},pe=(e,t)=>{let n=N();for(let r in e){let i=e[r];me(i,n,r,t)}return n},me=(e,t,n,r)=>{let i=e.length;for(let a=0;a<i;a++){let i=e[a];he(i,t,n,r)}},he=(e,t,n,r)=>{if(typeof e==`string`){ge(e,t,n);return}if(typeof e==`function`){_e(e,t,n,r);return}ve(e,t,n,r)},ge=(e,t,n)=>{let r=e===``?t:ye(t,e);r.classGroupId=n},_e=(e,t,n,r)=>{if(be(e)){me(e(r),t,n,r);return}t.validators===null&&(t.validators=[]),t.validators.push(se(n,e))},ve=(e,t,n,r)=>{let i=Object.entries(e),a=i.length;for(let e=0;e<a;e++){let[a,o]=i[e];me(o,ye(t,a),n,r)}},ye=(e,t)=>{let n=e,r=t.split(P),i=r.length;for(let e=0;e<i;e++){let t=r[e],i=n.nextPart.get(t);i||(i=N(),n.nextPart.set(t,i)),n=i}return n},be=e=>`isThemeGetter`in e&&e.isThemeGetter===!0,xe=e=>{if(e<1)return{get:()=>void 0,set:()=>{}};let t=0,n=Object.create(null),r=Object.create(null),i=(i,a)=>{n[i]=a,t++,t>e&&(t=0,r=n,n=Object.create(null))};return{get(e){let t=n[e];if(t!==void 0)return t;if((t=r[e])!==void 0)return i(e,t),t},set(e,t){e in n?n[e]=t:i(e,t)}}},Se=`!`,Ce=`:`,we=[],Te=(e,t,n,r,i)=>({modifiers:e,hasImportantModifier:t,baseClassName:n,maybePostfixModifierPosition:r,isExternal:i}),Ee=e=>{let{prefix:t,experimentalParseClassName:n}=e,r=e=>{let t=[],n=0,r=0,i=0,a,o=e.length;for(let s=0;s<o;s++){let o=e[s];if(n===0&&r===0){if(o===Ce){t.push(e.slice(i,s)),i=s+1;continue}if(o===`/`){a=s;continue}}o===`[`?n++:o===`]`?n--:o===`(`?r++:o===`)`&&r--}let s=t.length===0?e:e.slice(i),c=s,l=!1;s.endsWith(Se)?(c=s.slice(0,-1),l=!0):s.startsWith(Se)&&(c=s.slice(1),l=!0);let u=a&&a>i?a-i:void 0;return Te(t,l,c,u)};if(t){let e=t+Ce,n=r;r=t=>t.startsWith(e)?n(t.slice(e.length)):Te(we,!1,t,void 0,!0)}if(n){let e=r;r=t=>n({className:t,parseClassName:e})}return r},De=e=>{let t=new Map;return e.orderSensitiveModifiers.forEach((e,n)=>{t.set(e,1e6+n)}),e=>{let n=[],r=[];for(let i=0;i<e.length;i++){let a=e[i],o=a[0]===`[`,s=t.has(a);o||s?(r.length>0&&(r.sort(),n.push(...r),r=[]),n.push(a)):r.push(a)}return r.length>0&&(r.sort(),n.push(...r)),n}},Oe=e=>({cache:xe(e.cacheSize),parseClassName:Ee(e),sortModifiers:De(e),postfixLookupClassGroupIds:ke(e),...F(e)}),ke=e=>{let t=Object.create(null),n=e.postfixLookupClassGroups;if(n)for(let e=0;e<n.length;e++)t[n[e]]=!0;return t},Ae=/\s+/,je=(e,t)=>{let{parseClassName:n,getClassGroupId:r,getConflictingClassGroupIds:i,sortModifiers:a,postfixLookupClassGroupIds:o}=t,s=[],c=e.trim().split(Ae),l=``;for(let e=c.length-1;e>=0;--e){let t=c[e],{isExternal:u,modifiers:d,hasImportantModifier:f,baseClassName:p,maybePostfixModifierPosition:m}=n(t);if(u){l=t+(l.length>0?` `+l:l);continue}let h=!!m,g;if(h){g=r(p.substring(0,m));let e=g&&o[g]?r(p):void 0;e&&e!==g&&(g=e,h=!1)}else g=r(p);if(!g){if(!h){l=t+(l.length>0?` `+l:l);continue}if(g=r(p),!g){l=t+(l.length>0?` `+l:l);continue}h=!1}let _=d.length===0?``:d.length===1?d[0]:a(d).join(`:`),v=f?_+Se:_,y=v+g;if(s.indexOf(y)>-1)continue;s.push(y);let b=i(g,h);for(let e=0;e<b.length;++e){let t=b[e];s.push(v+t)}l=t+(l.length>0?` `+l:l)}return l},Me=(...e)=>{let t=0,n,r,i=``;for(;t<e.length;)(n=e[t++])&&(r=Ne(n))&&(i&&(i+=` `),i+=r);return i},Ne=e=>{if(typeof e==`string`)return e;let t,n=``;for(let r=0;r<e.length;r++)e[r]&&(t=Ne(e[r]))&&(n&&(n+=` `),n+=t);return n},Pe=(e,...t)=>{let n,r,i,a,o=o=>(n=Oe(t.reduce((e,t)=>t(e),e())),r=n.cache.get,i=n.cache.set,a=s,s(o)),s=e=>{let t=r(e);if(t)return t;let a=je(e,n);return i(e,a),a};return a=o,(...e)=>a(Me(...e))},Fe=[],I=e=>{let t=t=>t[e]||Fe;return t.isThemeGetter=!0,t},Ie=/^\[(?:(\w[\w-]*):)?(.+)\]$/i,Le=/^\((?:(\w[\w-]*):)?(.+)\)$/i,Re=/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/,ze=/^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,Be=/\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,Ve=/^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/,He=/^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,Ue=/^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,L=e=>Re.test(e),R=e=>!!e&&!Number.isNaN(Number(e)),z=e=>!!e&&Number.isInteger(Number(e)),We=e=>e.endsWith(`%`)&&R(e.slice(0,-1)),B=e=>ze.test(e),Ge=()=>!0,Ke=e=>Be.test(e)&&!Ve.test(e),qe=()=>!1,Je=e=>He.test(e),Ye=e=>Ue.test(e),Xe=e=>!V(e)&&!H(e),Ze=e=>e.startsWith(`@container`)&&(e[10]===`/`&&e[11]!==void 0||e[11]===`s`&&e[16]!==void 0&&e.startsWith(`-size/`,10)||e[11]===`n`&&e[18]!==void 0&&e.startsWith(`-normal/`,10)),Qe=e=>U(e,gt,qe),V=e=>Ie.test(e),$e=e=>U(e,_t,Ke),et=e=>U(e,vt,R),tt=e=>U(e,bt,Ge),nt=e=>U(e,yt,qe),rt=e=>U(e,mt,qe),it=e=>U(e,ht,Ye),at=e=>U(e,xt,Je),H=e=>Le.test(e),ot=e=>pt(e,_t),st=e=>pt(e,yt),ct=e=>pt(e,mt),lt=e=>pt(e,gt),ut=e=>pt(e,ht),dt=e=>pt(e,xt,!0),ft=e=>pt(e,bt,!0),U=(e,t,n)=>{let r=Ie.exec(e);return r?r[1]?t(r[1]):n(r[2]):!1},pt=(e,t,n=!1)=>{let r=Le.exec(e);return r?r[1]?t(r[1]):n:!1},mt=e=>e===`position`||e===`percentage`,ht=e=>e===`image`||e===`url`,gt=e=>e===`length`||e===`size`||e===`bg-size`,_t=e=>e===`length`,vt=e=>e===`number`,yt=e=>e===`family-name`,bt=e=>e===`number`||e===`weight`,xt=e=>e===`shadow`,St=Pe(()=>{let e=I(`color`),t=I(`font`),n=I(`text`),r=I(`font-weight`),i=I(`tracking`),a=I(`leading`),o=I(`breakpoint`),s=I(`container`),c=I(`spacing`),l=I(`radius`),u=I(`shadow`),d=I(`inset-shadow`),f=I(`text-shadow`),p=I(`drop-shadow`),m=I(`blur`),h=I(`perspective`),g=I(`aspect`),_=I(`ease`),v=I(`animate`),y=()=>[`auto`,`avoid`,`all`,`avoid-page`,`page`,`left`,`right`,`column`],b=()=>[`center`,`top`,`bottom`,`left`,`right`,`top-left`,`left-top`,`top-right`,`right-top`,`bottom-right`,`right-bottom`,`bottom-left`,`left-bottom`],x=()=>[...b(),H,V],S=()=>[`auto`,`hidden`,`clip`,`visible`,`scroll`],C=()=>[`auto`,`contain`,`none`],w=()=>[H,V,c],T=()=>[L,`full`,`auto`,...w()],E=()=>[z,`none`,`subgrid`,H,V],D=()=>[`auto`,{span:[`full`,z,H,V]},z,H,V],O=()=>[z,`auto`,H,V],ee=()=>[`auto`,`min`,`max`,`fr`,H,V],te=()=>[`start`,`end`,`center`,`between`,`around`,`evenly`,`stretch`,`baseline`,`center-safe`,`end-safe`],k=()=>[`start`,`end`,`center`,`stretch`,`center-safe`,`end-safe`],A=()=>[`auto`,...w()],j=()=>[L,`auto`,`full`,`dvw`,`dvh`,`lvw`,`lvh`,`svw`,`svh`,`min`,`max`,`fit`,...w()],ne=()=>[L,`screen`,`full`,`dvw`,`lvw`,`svw`,`min`,`max`,`fit`,...w()],re=()=>[L,`screen`,`full`,`lh`,`dvh`,`lvh`,`svh`,`min`,`max`,`fit`,...w()],M=()=>[e,H,V],ie=()=>[...b(),ct,rt,{position:[H,V]}],ae=()=>[`no-repeat`,{repeat:[``,`x`,`y`,`space`,`round`]}],oe=()=>[`auto`,`cover`,`contain`,lt,Qe,{size:[H,V]}],se=()=>[We,ot,$e],N=()=>[``,`none`,`full`,l,H,V],P=()=>[``,R,ot,$e],ce=()=>[`solid`,`dashed`,`dotted`,`double`],le=()=>[`normal`,`multiply`,`screen`,`overlay`,`darken`,`lighten`,`color-dodge`,`color-burn`,`hard-light`,`soft-light`,`difference`,`exclusion`,`hue`,`saturation`,`color`,`luminosity`],F=()=>[R,We,ct,rt],ue=()=>[``,`none`,m,H,V],de=()=>[`none`,R,H,V],fe=()=>[`none`,R,H,V],pe=()=>[R,H,V],me=()=>[L,`full`,...w()];return{cacheSize:500,theme:{animate:[`spin`,`ping`,`pulse`,`bounce`],aspect:[`video`],blur:[B],breakpoint:[B],color:[Ge],container:[B],"drop-shadow":[B],ease:[`in`,`out`,`in-out`],font:[Xe],"font-weight":[`thin`,`extralight`,`light`,`normal`,`medium`,`semibold`,`bold`,`extrabold`,`black`],"inset-shadow":[B],leading:[`none`,`tight`,`snug`,`normal`,`relaxed`,`loose`],perspective:[`dramatic`,`near`,`normal`,`midrange`,`distant`,`none`],radius:[B],shadow:[B],spacing:[`px`,R],text:[B],"text-shadow":[B],tracking:[`tighter`,`tight`,`normal`,`wide`,`wider`,`widest`]},classGroups:{aspect:[{aspect:[`auto`,`square`,L,V,H,g]}],container:[`container`],"container-type":[{"@container":[``,`normal`,`size`,H,V]}],"container-named":[Ze],columns:[{columns:[R,V,H,s]}],"break-after":[{"break-after":y()}],"break-before":[{"break-before":y()}],"break-inside":[{"break-inside":[`auto`,`avoid`,`avoid-page`,`avoid-column`]}],"box-decoration":[{"box-decoration":[`slice`,`clone`]}],box:[{box:[`border`,`content`]}],display:[`block`,`inline-block`,`inline`,`flex`,`inline-flex`,`table`,`inline-table`,`table-caption`,`table-cell`,`table-column`,`table-column-group`,`table-footer-group`,`table-header-group`,`table-row-group`,`table-row`,`flow-root`,`grid`,`inline-grid`,`contents`,`list-item`,`hidden`],sr:[`sr-only`,`not-sr-only`],float:[{float:[`right`,`left`,`none`,`start`,`end`]}],clear:[{clear:[`left`,`right`,`both`,`none`,`start`,`end`]}],isolation:[`isolate`,`isolation-auto`],"object-fit":[{object:[`contain`,`cover`,`fill`,`none`,`scale-down`]}],"object-position":[{object:x()}],overflow:[{overflow:S()}],"overflow-x":[{"overflow-x":S()}],"overflow-y":[{"overflow-y":S()}],overscroll:[{overscroll:C()}],"overscroll-x":[{"overscroll-x":C()}],"overscroll-y":[{"overscroll-y":C()}],position:[`static`,`fixed`,`absolute`,`relative`,`sticky`],inset:[{inset:T()}],"inset-x":[{"inset-x":T()}],"inset-y":[{"inset-y":T()}],start:[{"inset-s":T(),start:T()}],end:[{"inset-e":T(),end:T()}],"inset-bs":[{"inset-bs":T()}],"inset-be":[{"inset-be":T()}],top:[{top:T()}],right:[{right:T()}],bottom:[{bottom:T()}],left:[{left:T()}],visibility:[`visible`,`invisible`,`collapse`],z:[{z:[z,`auto`,H,V]}],basis:[{basis:[L,`full`,`auto`,s,...w()]}],"flex-direction":[{flex:[`row`,`row-reverse`,`col`,`col-reverse`]}],"flex-wrap":[{flex:[`nowrap`,`wrap`,`wrap-reverse`]}],flex:[{flex:[R,L,`auto`,`initial`,`none`,V]}],grow:[{grow:[``,R,H,V]}],shrink:[{shrink:[``,R,H,V]}],order:[{order:[z,`first`,`last`,`none`,H,V]}],"grid-cols":[{"grid-cols":E()}],"col-start-end":[{col:D()}],"col-start":[{"col-start":O()}],"col-end":[{"col-end":O()}],"grid-rows":[{"grid-rows":E()}],"row-start-end":[{row:D()}],"row-start":[{"row-start":O()}],"row-end":[{"row-end":O()}],"grid-flow":[{"grid-flow":[`row`,`col`,`dense`,`row-dense`,`col-dense`]}],"auto-cols":[{"auto-cols":ee()}],"auto-rows":[{"auto-rows":ee()}],gap:[{gap:w()}],"gap-x":[{"gap-x":w()}],"gap-y":[{"gap-y":w()}],"justify-content":[{justify:[...te(),`normal`]}],"justify-items":[{"justify-items":[...k(),`normal`]}],"justify-self":[{"justify-self":[`auto`,...k()]}],"align-content":[{content:[`normal`,...te()]}],"align-items":[{items:[...k(),{baseline:[``,`last`]}]}],"align-self":[{self:[`auto`,...k(),{baseline:[``,`last`]}]}],"place-content":[{"place-content":te()}],"place-items":[{"place-items":[...k(),`baseline`]}],"place-self":[{"place-self":[`auto`,...k()]}],p:[{p:w()}],px:[{px:w()}],py:[{py:w()}],ps:[{ps:w()}],pe:[{pe:w()}],pbs:[{pbs:w()}],pbe:[{pbe:w()}],pt:[{pt:w()}],pr:[{pr:w()}],pb:[{pb:w()}],pl:[{pl:w()}],m:[{m:A()}],mx:[{mx:A()}],my:[{my:A()}],ms:[{ms:A()}],me:[{me:A()}],mbs:[{mbs:A()}],mbe:[{mbe:A()}],mt:[{mt:A()}],mr:[{mr:A()}],mb:[{mb:A()}],ml:[{ml:A()}],"space-x":[{"space-x":w()}],"space-x-reverse":[`space-x-reverse`],"space-y":[{"space-y":w()}],"space-y-reverse":[`space-y-reverse`],size:[{size:j()}],"inline-size":[{inline:[`auto`,...ne()]}],"min-inline-size":[{"min-inline":[`auto`,...ne()]}],"max-inline-size":[{"max-inline":[`none`,...ne()]}],"block-size":[{block:[`auto`,...re()]}],"min-block-size":[{"min-block":[`auto`,...re()]}],"max-block-size":[{"max-block":[`none`,...re()]}],w:[{w:[s,`screen`,...j()]}],"min-w":[{"min-w":[s,`screen`,`none`,...j()]}],"max-w":[{"max-w":[s,`screen`,`none`,`prose`,{screen:[o]},...j()]}],h:[{h:[`screen`,`lh`,...j()]}],"min-h":[{"min-h":[`screen`,`lh`,`none`,...j()]}],"max-h":[{"max-h":[`screen`,`lh`,...j()]}],"font-size":[{text:[`base`,n,ot,$e]}],"font-smoothing":[`antialiased`,`subpixel-antialiased`],"font-style":[`italic`,`not-italic`],"font-weight":[{font:[r,ft,tt]}],"font-stretch":[{"font-stretch":[`ultra-condensed`,`extra-condensed`,`condensed`,`semi-condensed`,`normal`,`semi-expanded`,`expanded`,`extra-expanded`,`ultra-expanded`,We,V]}],"font-family":[{font:[st,nt,t]}],"font-features":[{"font-features":[V]}],"fvn-normal":[`normal-nums`],"fvn-ordinal":[`ordinal`],"fvn-slashed-zero":[`slashed-zero`],"fvn-figure":[`lining-nums`,`oldstyle-nums`],"fvn-spacing":[`proportional-nums`,`tabular-nums`],"fvn-fraction":[`diagonal-fractions`,`stacked-fractions`],tracking:[{tracking:[i,H,V]}],"line-clamp":[{"line-clamp":[R,`none`,H,et]}],leading:[{leading:[a,...w()]}],"list-image":[{"list-image":[`none`,H,V]}],"list-style-position":[{list:[`inside`,`outside`]}],"list-style-type":[{list:[`disc`,`decimal`,`none`,H,V]}],"text-alignment":[{text:[`left`,`center`,`right`,`justify`,`start`,`end`]}],"placeholder-color":[{placeholder:M()}],"text-color":[{text:M()}],"text-decoration":[`underline`,`overline`,`line-through`,`no-underline`],"text-decoration-style":[{decoration:[...ce(),`wavy`]}],"text-decoration-thickness":[{decoration:[R,`from-font`,`auto`,H,$e]}],"text-decoration-color":[{decoration:M()}],"underline-offset":[{"underline-offset":[R,`auto`,H,V]}],"text-transform":[`uppercase`,`lowercase`,`capitalize`,`normal-case`],"text-overflow":[`truncate`,`text-ellipsis`,`text-clip`],"text-wrap":[{text:[`wrap`,`nowrap`,`balance`,`pretty`]}],indent:[{indent:w()}],"tab-size":[{tab:[z,H,V]}],"vertical-align":[{align:[`baseline`,`top`,`middle`,`bottom`,`text-top`,`text-bottom`,`sub`,`super`,H,V]}],whitespace:[{whitespace:[`normal`,`nowrap`,`pre`,`pre-line`,`pre-wrap`,`break-spaces`]}],break:[{break:[`normal`,`words`,`all`,`keep`]}],wrap:[{wrap:[`break-word`,`anywhere`,`normal`]}],hyphens:[{hyphens:[`none`,`manual`,`auto`]}],content:[{content:[`none`,H,V]}],"bg-attachment":[{bg:[`fixed`,`local`,`scroll`]}],"bg-clip":[{"bg-clip":[`border`,`padding`,`content`,`text`]}],"bg-origin":[{"bg-origin":[`border`,`padding`,`content`]}],"bg-position":[{bg:ie()}],"bg-repeat":[{bg:ae()}],"bg-size":[{bg:oe()}],"bg-image":[{bg:[`none`,{linear:[{to:[`t`,`tr`,`r`,`br`,`b`,`bl`,`l`,`tl`]},z,H,V],radial:[``,H,V],conic:[z,H,V]},ut,it]}],"bg-color":[{bg:M()}],"gradient-from-pos":[{from:se()}],"gradient-via-pos":[{via:se()}],"gradient-to-pos":[{to:se()}],"gradient-from":[{from:M()}],"gradient-via":[{via:M()}],"gradient-to":[{to:M()}],rounded:[{rounded:N()}],"rounded-s":[{"rounded-s":N()}],"rounded-e":[{"rounded-e":N()}],"rounded-t":[{"rounded-t":N()}],"rounded-r":[{"rounded-r":N()}],"rounded-b":[{"rounded-b":N()}],"rounded-l":[{"rounded-l":N()}],"rounded-ss":[{"rounded-ss":N()}],"rounded-se":[{"rounded-se":N()}],"rounded-ee":[{"rounded-ee":N()}],"rounded-es":[{"rounded-es":N()}],"rounded-tl":[{"rounded-tl":N()}],"rounded-tr":[{"rounded-tr":N()}],"rounded-br":[{"rounded-br":N()}],"rounded-bl":[{"rounded-bl":N()}],"border-w":[{border:P()}],"border-w-x":[{"border-x":P()}],"border-w-y":[{"border-y":P()}],"border-w-s":[{"border-s":P()}],"border-w-e":[{"border-e":P()}],"border-w-bs":[{"border-bs":P()}],"border-w-be":[{"border-be":P()}],"border-w-t":[{"border-t":P()}],"border-w-r":[{"border-r":P()}],"border-w-b":[{"border-b":P()}],"border-w-l":[{"border-l":P()}],"divide-x":[{"divide-x":P()}],"divide-x-reverse":[`divide-x-reverse`],"divide-y":[{"divide-y":P()}],"divide-y-reverse":[`divide-y-reverse`],"border-style":[{border:[...ce(),`hidden`,`none`]}],"divide-style":[{divide:[...ce(),`hidden`,`none`]}],"border-color":[{border:M()}],"border-color-x":[{"border-x":M()}],"border-color-y":[{"border-y":M()}],"border-color-s":[{"border-s":M()}],"border-color-e":[{"border-e":M()}],"border-color-bs":[{"border-bs":M()}],"border-color-be":[{"border-be":M()}],"border-color-t":[{"border-t":M()}],"border-color-r":[{"border-r":M()}],"border-color-b":[{"border-b":M()}],"border-color-l":[{"border-l":M()}],"divide-color":[{divide:M()}],"outline-style":[{outline:[...ce(),`none`,`hidden`]}],"outline-offset":[{"outline-offset":[R,H,V]}],"outline-w":[{outline:[``,R,ot,$e]}],"outline-color":[{outline:M()}],shadow:[{shadow:[``,`none`,u,dt,at]}],"shadow-color":[{shadow:M()}],"inset-shadow":[{"inset-shadow":[`none`,d,dt,at]}],"inset-shadow-color":[{"inset-shadow":M()}],"ring-w":[{ring:P()}],"ring-w-inset":[`ring-inset`],"ring-color":[{ring:M()}],"ring-offset-w":[{"ring-offset":[R,$e]}],"ring-offset-color":[{"ring-offset":M()}],"inset-ring-w":[{"inset-ring":P()}],"inset-ring-color":[{"inset-ring":M()}],"text-shadow":[{"text-shadow":[`none`,f,dt,at]}],"text-shadow-color":[{"text-shadow":M()}],opacity:[{opacity:[R,H,V]}],"mix-blend":[{"mix-blend":[...le(),`plus-darker`,`plus-lighter`]}],"bg-blend":[{"bg-blend":le()}],"mask-clip":[{"mask-clip":[`border`,`padding`,`content`,`fill`,`stroke`,`view`]},`mask-no-clip`],"mask-composite":[{mask:[`add`,`subtract`,`intersect`,`exclude`]}],"mask-image-linear-pos":[{"mask-linear":[R]}],"mask-image-linear-from-pos":[{"mask-linear-from":F()}],"mask-image-linear-to-pos":[{"mask-linear-to":F()}],"mask-image-linear-from-color":[{"mask-linear-from":M()}],"mask-image-linear-to-color":[{"mask-linear-to":M()}],"mask-image-t-from-pos":[{"mask-t-from":F()}],"mask-image-t-to-pos":[{"mask-t-to":F()}],"mask-image-t-from-color":[{"mask-t-from":M()}],"mask-image-t-to-color":[{"mask-t-to":M()}],"mask-image-r-from-pos":[{"mask-r-from":F()}],"mask-image-r-to-pos":[{"mask-r-to":F()}],"mask-image-r-from-color":[{"mask-r-from":M()}],"mask-image-r-to-color":[{"mask-r-to":M()}],"mask-image-b-from-pos":[{"mask-b-from":F()}],"mask-image-b-to-pos":[{"mask-b-to":F()}],"mask-image-b-from-color":[{"mask-b-from":M()}],"mask-image-b-to-color":[{"mask-b-to":M()}],"mask-image-l-from-pos":[{"mask-l-from":F()}],"mask-image-l-to-pos":[{"mask-l-to":F()}],"mask-image-l-from-color":[{"mask-l-from":M()}],"mask-image-l-to-color":[{"mask-l-to":M()}],"mask-image-x-from-pos":[{"mask-x-from":F()}],"mask-image-x-to-pos":[{"mask-x-to":F()}],"mask-image-x-from-color":[{"mask-x-from":M()}],"mask-image-x-to-color":[{"mask-x-to":M()}],"mask-image-y-from-pos":[{"mask-y-from":F()}],"mask-image-y-to-pos":[{"mask-y-to":F()}],"mask-image-y-from-color":[{"mask-y-from":M()}],"mask-image-y-to-color":[{"mask-y-to":M()}],"mask-image-radial":[{"mask-radial":[H,V]}],"mask-image-radial-from-pos":[{"mask-radial-from":F()}],"mask-image-radial-to-pos":[{"mask-radial-to":F()}],"mask-image-radial-from-color":[{"mask-radial-from":M()}],"mask-image-radial-to-color":[{"mask-radial-to":M()}],"mask-image-radial-shape":[{"mask-radial":[`circle`,`ellipse`]}],"mask-image-radial-size":[{"mask-radial":[{closest:[`side`,`corner`],farthest:[`side`,`corner`]}]}],"mask-image-radial-pos":[{"mask-radial-at":b()}],"mask-image-conic-pos":[{"mask-conic":[R]}],"mask-image-conic-from-pos":[{"mask-conic-from":F()}],"mask-image-conic-to-pos":[{"mask-conic-to":F()}],"mask-image-conic-from-color":[{"mask-conic-from":M()}],"mask-image-conic-to-color":[{"mask-conic-to":M()}],"mask-mode":[{mask:[`alpha`,`luminance`,`match`]}],"mask-origin":[{"mask-origin":[`border`,`padding`,`content`,`fill`,`stroke`,`view`]}],"mask-position":[{mask:ie()}],"mask-repeat":[{mask:ae()}],"mask-size":[{mask:oe()}],"mask-type":[{"mask-type":[`alpha`,`luminance`]}],"mask-image":[{mask:[`none`,H,V]}],filter:[{filter:[``,`none`,H,V]}],blur:[{blur:ue()}],brightness:[{brightness:[R,H,V]}],contrast:[{contrast:[R,H,V]}],"drop-shadow":[{"drop-shadow":[``,`none`,p,dt,at]}],"drop-shadow-color":[{"drop-shadow":M()}],grayscale:[{grayscale:[``,R,H,V]}],"hue-rotate":[{"hue-rotate":[R,H,V]}],invert:[{invert:[``,R,H,V]}],saturate:[{saturate:[R,H,V]}],sepia:[{sepia:[``,R,H,V]}],"backdrop-filter":[{"backdrop-filter":[``,`none`,H,V]}],"backdrop-blur":[{"backdrop-blur":ue()}],"backdrop-brightness":[{"backdrop-brightness":[R,H,V]}],"backdrop-contrast":[{"backdrop-contrast":[R,H,V]}],"backdrop-grayscale":[{"backdrop-grayscale":[``,R,H,V]}],"backdrop-hue-rotate":[{"backdrop-hue-rotate":[R,H,V]}],"backdrop-invert":[{"backdrop-invert":[``,R,H,V]}],"backdrop-opacity":[{"backdrop-opacity":[R,H,V]}],"backdrop-saturate":[{"backdrop-saturate":[R,H,V]}],"backdrop-sepia":[{"backdrop-sepia":[``,R,H,V]}],"border-collapse":[{border:[`collapse`,`separate`]}],"border-spacing":[{"border-spacing":w()}],"border-spacing-x":[{"border-spacing-x":w()}],"border-spacing-y":[{"border-spacing-y":w()}],"table-layout":[{table:[`auto`,`fixed`]}],caption:[{caption:[`top`,`bottom`]}],transition:[{transition:[``,`all`,`colors`,`opacity`,`shadow`,`transform`,`none`,H,V]}],"transition-behavior":[{transition:[`normal`,`discrete`]}],duration:[{duration:[R,`initial`,H,V]}],ease:[{ease:[`linear`,`initial`,_,H,V]}],delay:[{delay:[R,H,V]}],animate:[{animate:[`none`,v,H,V]}],backface:[{backface:[`hidden`,`visible`]}],perspective:[{perspective:[h,H,V]}],"perspective-origin":[{"perspective-origin":x()}],rotate:[{rotate:de()}],"rotate-x":[{"rotate-x":de()}],"rotate-y":[{"rotate-y":de()}],"rotate-z":[{"rotate-z":de()}],scale:[{scale:fe()}],"scale-x":[{"scale-x":fe()}],"scale-y":[{"scale-y":fe()}],"scale-z":[{"scale-z":fe()}],"scale-3d":[`scale-3d`],skew:[{skew:pe()}],"skew-x":[{"skew-x":pe()}],"skew-y":[{"skew-y":pe()}],transform:[{transform:[H,V,``,`none`,`gpu`,`cpu`]}],"transform-origin":[{origin:x()}],"transform-style":[{transform:[`3d`,`flat`]}],translate:[{translate:me()}],"translate-x":[{"translate-x":me()}],"translate-y":[{"translate-y":me()}],"translate-z":[{"translate-z":me()}],"translate-none":[`translate-none`],zoom:[{zoom:[z,H,V]}],accent:[{accent:M()}],appearance:[{appearance:[`none`,`auto`]}],"caret-color":[{caret:M()}],"color-scheme":[{scheme:[`normal`,`dark`,`light`,`light-dark`,`only-dark`,`only-light`]}],cursor:[{cursor:[`auto`,`default`,`pointer`,`wait`,`text`,`move`,`help`,`not-allowed`,`none`,`context-menu`,`progress`,`cell`,`crosshair`,`vertical-text`,`alias`,`copy`,`no-drop`,`grab`,`grabbing`,`all-scroll`,`col-resize`,`row-resize`,`n-resize`,`e-resize`,`s-resize`,`w-resize`,`ne-resize`,`nw-resize`,`se-resize`,`sw-resize`,`ew-resize`,`ns-resize`,`nesw-resize`,`nwse-resize`,`zoom-in`,`zoom-out`,H,V]}],"field-sizing":[{"field-sizing":[`fixed`,`content`]}],"pointer-events":[{"pointer-events":[`auto`,`none`]}],resize:[{resize:[`none`,``,`y`,`x`]}],"scroll-behavior":[{scroll:[`auto`,`smooth`]}],"scrollbar-thumb-color":[{"scrollbar-thumb":M()}],"scrollbar-track-color":[{"scrollbar-track":M()}],"scrollbar-gutter":[{"scrollbar-gutter":[`auto`,`stable`,`both`]}],"scrollbar-w":[{scrollbar:[`auto`,`thin`,`none`]}],"scroll-m":[{"scroll-m":w()}],"scroll-mx":[{"scroll-mx":w()}],"scroll-my":[{"scroll-my":w()}],"scroll-ms":[{"scroll-ms":w()}],"scroll-me":[{"scroll-me":w()}],"scroll-mbs":[{"scroll-mbs":w()}],"scroll-mbe":[{"scroll-mbe":w()}],"scroll-mt":[{"scroll-mt":w()}],"scroll-mr":[{"scroll-mr":w()}],"scroll-mb":[{"scroll-mb":w()}],"scroll-ml":[{"scroll-ml":w()}],"scroll-p":[{"scroll-p":w()}],"scroll-px":[{"scroll-px":w()}],"scroll-py":[{"scroll-py":w()}],"scroll-ps":[{"scroll-ps":w()}],"scroll-pe":[{"scroll-pe":w()}],"scroll-pbs":[{"scroll-pbs":w()}],"scroll-pbe":[{"scroll-pbe":w()}],"scroll-pt":[{"scroll-pt":w()}],"scroll-pr":[{"scroll-pr":w()}],"scroll-pb":[{"scroll-pb":w()}],"scroll-pl":[{"scroll-pl":w()}],"snap-align":[{snap:[`start`,`end`,`center`,`align-none`]}],"snap-stop":[{snap:[`normal`,`always`]}],"snap-type":[{snap:[`none`,`x`,`y`,`both`]}],"snap-strictness":[{snap:[`mandatory`,`proximity`]}],touch:[{touch:[`auto`,`none`,`manipulation`]}],"touch-x":[{"touch-pan":[`x`,`left`,`right`]}],"touch-y":[{"touch-pan":[`y`,`up`,`down`]}],"touch-pz":[`touch-pinch-zoom`],select:[{select:[`none`,`text`,`all`,`auto`]}],"will-change":[{"will-change":[`auto`,`scroll`,`contents`,`transform`,H,V]}],fill:[{fill:[`none`,...M()]}],"stroke-w":[{stroke:[R,ot,$e,et]}],stroke:[{stroke:[`none`,...M()]}],"forced-color-adjust":[{"forced-color-adjust":[`auto`,`none`]}]},conflictingClassGroups:{"container-named":[`container-type`],overflow:[`overflow-x`,`overflow-y`],overscroll:[`overscroll-x`,`overscroll-y`],inset:[`inset-x`,`inset-y`,`inset-bs`,`inset-be`,`start`,`end`,`top`,`right`,`bottom`,`left`],"inset-x":[`right`,`left`],"inset-y":[`top`,`bottom`],flex:[`basis`,`grow`,`shrink`],gap:[`gap-x`,`gap-y`],p:[`px`,`py`,`ps`,`pe`,`pbs`,`pbe`,`pt`,`pr`,`pb`,`pl`],px:[`pr`,`pl`],py:[`pt`,`pb`],m:[`mx`,`my`,`ms`,`me`,`mbs`,`mbe`,`mt`,`mr`,`mb`,`ml`],mx:[`mr`,`ml`],my:[`mt`,`mb`],size:[`w`,`h`],"font-size":[`leading`],"fvn-normal":[`fvn-ordinal`,`fvn-slashed-zero`,`fvn-figure`,`fvn-spacing`,`fvn-fraction`],"fvn-ordinal":[`fvn-normal`],"fvn-slashed-zero":[`fvn-normal`],"fvn-figure":[`fvn-normal`],"fvn-spacing":[`fvn-normal`],"fvn-fraction":[`fvn-normal`],"line-clamp":[`display`,`overflow`],rounded:[`rounded-s`,`rounded-e`,`rounded-t`,`rounded-r`,`rounded-b`,`rounded-l`,`rounded-ss`,`rounded-se`,`rounded-ee`,`rounded-es`,`rounded-tl`,`rounded-tr`,`rounded-br`,`rounded-bl`],"rounded-s":[`rounded-ss`,`rounded-es`],"rounded-e":[`rounded-se`,`rounded-ee`],"rounded-t":[`rounded-tl`,`rounded-tr`],"rounded-r":[`rounded-tr`,`rounded-br`],"rounded-b":[`rounded-br`,`rounded-bl`],"rounded-l":[`rounded-tl`,`rounded-bl`],"border-spacing":[`border-spacing-x`,`border-spacing-y`],"border-w":[`border-w-x`,`border-w-y`,`border-w-s`,`border-w-e`,`border-w-bs`,`border-w-be`,`border-w-t`,`border-w-r`,`border-w-b`,`border-w-l`],"border-w-x":[`border-w-r`,`border-w-l`],"border-w-y":[`border-w-t`,`border-w-b`],"border-color":[`border-color-x`,`border-color-y`,`border-color-s`,`border-color-e`,`border-color-bs`,`border-color-be`,`border-color-t`,`border-color-r`,`border-color-b`,`border-color-l`],"border-color-x":[`border-color-r`,`border-color-l`],"border-color-y":[`border-color-t`,`border-color-b`],translate:[`translate-x`,`translate-y`,`translate-none`],"translate-none":[`translate`,`translate-x`,`translate-y`,`translate-z`],"scroll-m":[`scroll-mx`,`scroll-my`,`scroll-ms`,`scroll-me`,`scroll-mbs`,`scroll-mbe`,`scroll-mt`,`scroll-mr`,`scroll-mb`,`scroll-ml`],"scroll-mx":[`scroll-mr`,`scroll-ml`],"scroll-my":[`scroll-mt`,`scroll-mb`],"scroll-p":[`scroll-px`,`scroll-py`,`scroll-ps`,`scroll-pe`,`scroll-pbs`,`scroll-pbe`,`scroll-pt`,`scroll-pr`,`scroll-pb`,`scroll-pl`],"scroll-px":[`scroll-pr`,`scroll-pl`],"scroll-py":[`scroll-pt`,`scroll-pb`],touch:[`touch-x`,`touch-y`,`touch-pz`],"touch-x":[`touch`],"touch-y":[`touch`],"touch-pz":[`touch`]},conflictingClassGroupModifiers:{"font-size":[`leading`]},postfixLookupClassGroups:[`container-type`],orderSensitiveModifiers:[`*`,`**`,`after`,`backdrop`,`before`,`details-content`,`file`,`first-letter`,`first-line`,`marker`,`placeholder`,`selection`]}}),Ct=e=>e?.dataset.prerendered===`true`;function wt(...e){return St(ae(e))}function Tt(){return typeof document>`u`||Ct(document.getElementById(`root`))}function Et(e){delete e.dataset.prerendered}function Dt({delay:e=0,...t}){return(0,k.jsx)(re,{"data-slot":`tooltip-provider`,delay:e,...t})}var Ot=(...e)=>e.filter((e,t,n)=>!!e&&e.trim()!==``&&n.indexOf(e)===t).join(` `).trim(),kt=e=>e.replace(/([a-z0-9])([A-Z])/g,`$1-$2`).toLowerCase(),At=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,t,n)=>n?n.toUpperCase():t.toLowerCase()),jt=e=>{let t=At(e);return t.charAt(0).toUpperCase()+t.slice(1)},Mt={xmlns:`http://www.w3.org/2000/svg`,width:24,height:24,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:2,strokeLinecap:`round`,strokeLinejoin:`round`},Nt=e=>{for(let t in e)if(t.startsWith(`aria-`)||t===`role`||t===`title`)return!0;return!1},Pt=(0,y.createContext)({}),Ft=()=>(0,y.useContext)(Pt),It=(0,y.forwardRef)(({color:e,size:t,strokeWidth:n,absoluteStrokeWidth:r,className:i=``,children:a,iconNode:o,...s},c)=>{let{size:l=24,strokeWidth:u=2,absoluteStrokeWidth:d=!1,color:f=`currentColor`,className:p=``}=Ft()??{},m=r??d?Number(n??u)*24/Number(t??l):n??u;return(0,y.createElement)(`svg`,{ref:c,...Mt,width:t??l??Mt.width,height:t??l??Mt.height,stroke:e??f,strokeWidth:m,className:Ot(`lucide`,p,i),...!a&&!Nt(s)&&{"aria-hidden":`true`},...s},[...o.map(([e,t])=>(0,y.createElement)(e,t)),...Array.isArray(a)?a:[a]])}),W=(e,t)=>{let n=(0,y.forwardRef)(({className:n,...r},i)=>(0,y.createElement)(It,{ref:i,iconNode:t,className:Ot(`lucide-${kt(jt(e))}`,`lucide-${e}`,n),...r}));return n.displayName=jt(e),n},Lt=W(`arrow-right`,[[`path`,{d:`M5 12h14`,key:`1ays0h`}],[`path`,{d:`m12 5 7 7-7 7`,key:`xquz4c`}]]),Rt=W(`check`,[[`path`,{d:`M20 6 9 17l-5-5`,key:`1gmf2c`}]]),zt=W(`chevron-left`,[[`path`,{d:`m15 18-6-6 6-6`,key:`1wnfg3`}]]),Bt=W(`chevron-right`,[[`path`,{d:`m9 18 6-6-6-6`,key:`mthhwq`}]]),Vt=W(`copy`,[[`rect`,{width:`14`,height:`14`,x:`8`,y:`8`,rx:`2`,ry:`2`,key:`17jyea`}],[`path`,{d:`M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2`,key:`zix9uf`}]]),Ht=W(`link`,[[`path`,{d:`M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71`,key:`1cjeqo`}],[`path`,{d:`M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71`,key:`19qd67`}]]),Ut=W(`loader-circle`,[[`path`,{d:`M21 12a9 9 0 1 1-6.219-8.56`,key:`13zald`}]]),Wt=W(`menu`,[[`path`,{d:`M4 5h16`,key:`1tepv9`}],[`path`,{d:`M4 12h16`,key:`1lakjw`}],[`path`,{d:`M4 19h16`,key:`1djgab`}]]),Gt=W(`moon`,[[`path`,{d:`M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401`,key:`kfwtm`}]]),Kt=W(`search`,[[`path`,{d:`m21 21-4.34-4.34`,key:`14j7rj`}],[`circle`,{cx:`11`,cy:`11`,r:`8`,key:`4ej97u`}]]),qt=W(`sun`,[[`circle`,{cx:`12`,cy:`12`,r:`4`,key:`4exip2`}],[`path`,{d:`M12 2v2`,key:`tus03m`}],[`path`,{d:`M12 20v2`,key:`1lh1kg`}],[`path`,{d:`m4.93 4.93 1.41 1.41`,key:`149t6j`}],[`path`,{d:`m17.66 17.66 1.41 1.41`,key:`ptbguv`}],[`path`,{d:`M2 12h2`,key:`1t8f8n`}],[`path`,{d:`M20 12h2`,key:`1q8mjw`}],[`path`,{d:`m6.34 17.66-1.41 1.41`,key:`1m8zz5`}],[`path`,{d:`m19.07 4.93-1.41 1.41`,key:`1shlcs`}]]),Jt=W(`Github`,[[`path`,{d:`M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4`,key:`tonef`}],[`path`,{d:`M9 18c-4.51 2-5-2-7-2`,key:`9comsn`}]]),Yt=`/pastoralist`,Xt=Yt.endsWith(`/`)?Yt:Yt+`/`;function Zt(){return(0,k.jsxs)(`footer`,{className:`w-full px-4 sm:px-6 md:px-10 xl:px-28 py-6 sm:py-7 border-t border-base-content/10 flex flex-col gap-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center`,children:[(0,k.jsx)(`div`,{className:`flex items-center justify-center sm:justify-start gap-2 order-3 sm:order-1`,children:(0,k.jsxs)(`p`,{className:`text-sm sm:text-base text-center sm:text-left`,children:[`Copyright © `,new Date().getFullYear(),` - All rights reserved`]})}),(0,k.jsx)(`div`,{className:`flex items-center justify-center gap-2 order-1 sm:order-2`,children:(0,k.jsx)(s,{to:`/`,className:`hover:opacity-80 transition-opacity`,children:(0,k.jsx)(`img`,{src:`${Xt}pastoralist-logo.svg`,alt:`Pastoralist Logo`,className:`h-12 w-12`})})}),(0,k.jsx)(`nav`,{className:`flex justify-center sm:justify-end order-2 sm:order-3`,children:(0,k.jsx)(`div`,{className:`grid grid-flow-col gap-4`,children:(0,k.jsx)(`a`,{className:`btn btn-ghost btn-circle flex items-center justify-center`,href:`https://github.com/yowainwright/pastoralist`,"aria-label":`GitHub`,target:`_blank`,rel:`noopener noreferrer`,children:(0,k.jsx)(Jt,{className:`h-5 w-5`})})})})]})}function Qt(){let[e,t]=(0,y.useState)(()=>{if(typeof window>`u`)return`lofi`;let e=localStorage.getItem(`theme`);return e===`lofi`||e===`night`?e:window.matchMedia(`(prefers-color-scheme: dark)`).matches?`night`:`lofi`});return(0,y.useEffect)(()=>{document.documentElement.setAttribute(`data-theme`,e),localStorage.setItem(`theme`,e)},[e]),{theme:e,setTheme:t,toggle:()=>t(e=>e===`lofi`?`night`:`lofi`)}}var $t=`---
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
`,en=`---
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

\`pastoralist onboarding\` and \`pastoralist --onboard\` are aliases.

### \`pastoralist --path <path>\`

> Type: **\`string\`**
> Default: \`"package.json"\`

Run Pastoralist on a specific \`package.json\` file.

\`\`\`diff
 npx pastoralist
+npx pastoralist --path packages/app/package.json
+npx pastoralist --path ./nested/project/package.json
\`\`\`

### \`pastoralist --depPaths [paths...]\`

> Type: **\`string[]\`**
> Default: unset

Read dependency data from multiple \`package.json\` files using glob patterns.

\`\`\`diff
 npx pastoralist
+npx pastoralist --depPaths "packages/*/package.json"
+npx pastoralist --depPaths "packages/*/package.json" "apps/*/package.json"
\`\`\`

### \`pastoralist --ignore [patterns...]\`

> Type: **\`string[]\`**
> Default: \`[]\`

Exclude files matching glob patterns.

\`\`\`diff
 npx pastoralist
+npx pastoralist --ignore "**/test/**" "**/dist/**"
+npx pastoralist --depPaths "**/package.json" --ignore "**/node_modules/**" "**/legacy/**"
\`\`\`

### \`pastoralist --root <root>\`

> Type: **\`string\`**
> Default: derived from \`--path\` or the current working directory

Set the root directory for all operations.

\`\`\`diff
 npx pastoralist
+npx pastoralist --root /path/to/project
+npx pastoralist --root ../my-project --path package.json
\`\`\`

### \`pastoralist init\`

Initialize configuration with the guided setup. The wizard can configure
workspace paths, security scanning, and where the configuration should be saved.

\`\`\`diff
+npx pastoralist init
\`\`\`

\`pastoralist init config\` and \`pastoralist --init config\` run the same config
wizard.

When run, this will:

- Detect \`workspaces\` entries from \`package.json\`
- Prompt for \`depPaths: "workspace"\` or custom package globs
- Offer security provider and severity threshold setup
- Save configuration to \`package.json\` or a supported config file

### \`pastoralist --init agent-skill\`

Install the bundled Pastoralist agent skill into \`.agents/skills/pastoralist\`.

\`\`\`diff
+npx pastoralist --init agent-skill
\`\`\`

\`pastoralist init agent-skill\` is also supported.

### \`pastoralist --interactive\`

Review security fixes interactively. Use this with \`--checkSecurity\` when you
want to approve fixes instead of applying everything with \`--forceSecurityRefactor\`.

\`\`\`diff
 npx pastoralist --checkSecurity
+npx pastoralist --checkSecurity --interactive
\`\`\`

### \`pastoralist --debug\`

Enable detailed debug output.

\`\`\`diff
 npx pastoralist
+npx pastoralist --debug
\`\`\`

### \`pastoralist --dry-run\`

Preview changes without modifying \`package.json\`.

\`\`\`diff
 npx pastoralist
+npx pastoralist --dry-run
\`\`\`

### \`pastoralist --outputFormat json\`

Return machine-readable output for CI or custom tooling.

\`\`\`diff
 npx pastoralist --summary
+npx pastoralist --summary --outputFormat json
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

### \`pastoralist --quiet\`

Quiet mode for CI pipelines. Outputs minimal text and uses exit codes.

- Exit 0: No vulnerabilities found
- Exit 1: Vulnerabilities detected

\`\`\`diff
 npx pastoralist --checkSecurity
+npx pastoralist --quiet --checkSecurity
\`\`\`

### \`pastoralist --summary\`

Display metrics after run.

\`\`\`diff
 npx pastoralist
+npx pastoralist --summary
\`\`\`

### \`pastoralist --setup-hook\`

Add Pastoralist to your \`postinstall\` script automatically.

\`\`\`diff
 npx pastoralist
+npx pastoralist --setup-hook
\`\`\`

### \`pnpm run setup:local-dev\`

Set up local agent config, selected skills, and selected local hooks.

\`\`\`diff
+pnpm run setup:local-dev -- --dry-run
+pnpm run setup:local-dev -- --skills all --hooks git,postinstall
\`\`\`

### \`pastoralist --remove-unused\`

Remove overrides that no package in your project depends on. When Pastoralist detects unused overrides during a run, it suggests this flag.

\`\`\`diff
 npx pastoralist
+npx pastoralist --remove-unused
\`\`\`

### \`pastoralist --checkSecurity\`

Enable security vulnerability scanning.

\`\`\`diff
 npx pastoralist
+npx pastoralist --checkSecurity
\`\`\`

### \`pastoralist --securityProvider <provider...>\`

Choose one or more security providers. Supported values are \`osv\`, \`github\`,
\`npm\`, \`snyk\`, \`socket\`, and \`spektion\`.

\`\`\`diff
 npx pastoralist --checkSecurity
+npx pastoralist --checkSecurity --securityProvider osv npm
\`\`\`

### \`pastoralist --securityProviderToken <token>\`

Pass a provider token without writing it to config. Prefer environment variables
for committed workflows.

\`\`\`diff
 npx pastoralist --checkSecurity --securityProvider github
+npx pastoralist --checkSecurity --securityProvider github --securityProviderToken "$GITHUB_TOKEN"
\`\`\`

### \`pastoralist --hasWorkspaceSecurityChecks\`

Include workspace package manifests in security scans when workspaces are
configured.

\`\`\`diff
 npx pastoralist --checkSecurity
+npx pastoralist --checkSecurity --hasWorkspaceSecurityChecks
\`\`\`

### \`pastoralist --forceSecurityRefactor\`

Apply security override fixes without prompting.

\`\`\`diff
 npx pastoralist --checkSecurity
+npx pastoralist --checkSecurity --forceSecurityRefactor
\`\`\`

### \`pastoralist --promptForReasons\`

Prompt for ledger reasons when Pastoralist adds manual override records.

\`\`\`diff
 npx pastoralist
+npx pastoralist --promptForReasons
\`\`\`

### \`pastoralist --strict\`

Fail when a security provider, network request, or API call cannot complete.

\`\`\`diff
 npx pastoralist --checkSecurity
+npx pastoralist --checkSecurity --strict
\`\`\`

### \`pastoralist --cache-dir <path>\`

> Type: **\`string\`**
> Default: \`node_modules/.cache/pastoralist/\`

Store provider cache data in a custom directory.

\`\`\`diff
 npx pastoralist --checkSecurity
+npx pastoralist --checkSecurity --cache-dir .cache/pastoralist
\`\`\`

### \`pastoralist --cache-ttl <seconds>\`

> Type: **\`number\`**
> Default: provider default

Override the provider cache TTL.

\`\`\`diff
 npx pastoralist --checkSecurity
+npx pastoralist --checkSecurity --cache-ttl 3600
\`\`\`

### \`pastoralist --no-cache\`

Bypass cache reads and writes for a security run.

\`\`\`diff
 npx pastoralist --checkSecurity
+npx pastoralist --checkSecurity --no-cache
\`\`\`

### \`pastoralist --refresh-cache\`

Bypass cache reads and write fresh provider results.

\`\`\`diff
 npx pastoralist --checkSecurity
+npx pastoralist --checkSecurity --refresh-cache
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
`,tn=`---
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
`,nn=`---
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
`,rn=`---
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
`,an=`---
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
`,on=`---
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

If your project uses npm or Bun \`overrides\`, pnpm \`pnpm.overrides\`, or Yarn
\`resolutions\`, Pastoralist records why each entry exists, which packages still
need it, and when it can be removed. It can also connect security fixes, patch
files, workspace packages, and CI checks to the same record.

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
| Runtime            | Node 20.19+                                                  |
| Security default   | OSV, no token required                                       |
| Optional providers | GitHub, npm audit, Snyk, Socket, Spektion                    |
| Monorepos          | Auto-detects \`workspaces\`; accepts explicit package globs    |
| CI                 | CLI flags plus a GitHub Action                               |
| Test surface       | 2,000+ test cases across unit, integration, and e2e fixtures |

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
  href="https://stackblitz.com/github/yowainwright/pastoralist/tree/main/tests/sandboxes/basic-overrides?title=Pastoralist%20Basic%20Overrides&file=README.md&startScript=demo&view=editor"
  target="_blank"
  rel="noopener noreferrer"
>
  <img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" alt="Open in StackBlitz" />
</a>
`,sn=`---
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
`,cn=`---
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
`,ln=`---
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
pnpm run setup:local-dev -- --skills all --hooks git,postinstall
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

Read [Configuration](/docs/configuration) for all options or
[Workspaces & Monorepos](/docs/workspaces) for monorepo setup.
`,un=`---
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
`,dn=`---
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
`,fn=[{slug:`introduction`,title:`Introduction to Pastoralist`,description:`Pastoralist keeps dependency overrides explainable, current, and removable`},{slug:`setup`,title:`Setup`,description:`Install Pastoralist and keep your override appendix current`},{slug:`onboarding`,title:`Onboarding`,description:`First-run checklist for local use, agent setup, and CI`},{slug:`security`,title:`Security Vulnerability Detection`,description:`Detect vulnerabilities and select lowest-risk dependency portfolios`,usesMath:!0},{slug:`workspaces`,title:`Workspaces & Monorepos`,description:`Using pastoralist in workspace and monorepo environments`},{slug:`advanced-features`,title:`Advanced Features`,description:`Advanced cleanup, patch tracking, and override management workflows`},{slug:`codelab`,title:`Interactive Tutorial`,description:`Learn Pastoralist step by step`},{slug:`api-reference`,title:`API Reference`,description:`Complete reference for pastoralist CLI and Node.js API`},{slug:`architecture`,title:`Architecture`,description:`How Pastoralist reads overrides, writes the appendix, tracks patches, and handles cleanup`},{slug:`troubleshooting`,title:`Troubleshooting & FAQ`,description:`Common issues and frequently asked questions`},{slug:`configuration`,title:`Configuration`,description:`Configure Pastoralist with package.json, rc files, or JavaScript config files`},{slug:`github-action`,title:`GitHub Action`,description:`Automated dependency override management for CI`}],pn=`modulepreload`,mn=function(e){return`/pastoralist/`+e},hn={},G=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?import.meta.resolve(e):new URL(e,import.meta.url).href}r=o(t.map(t=>{if(t=mn(t,n),t=s(t),t in hn)return;hn[t]=!0;let r=t.endsWith(`.css`);for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}let i=document.createElement(`link`);if(i.rel=r?`stylesheet`:pn,r||(i.as=`script`),i.crossOrigin=``,i.href=t,a&&i.setAttribute(`nonce`,a),document.head.appendChild(i),r)return new Promise((e,n)=>{i.addEventListener(`load`,e),i.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},gn=Object.fromEntries(Object.entries(Object.assign({"./docs/advanced-features.mdx":()=>G(()=>import(`./advanced-features-CDE-Hxko.js`),__vite__mapDeps([0,1,2])),"./docs/api-reference.mdx":()=>G(()=>import(`./api-reference-BQ1CCMH2.js`),__vite__mapDeps([3,1,2])),"./docs/architecture.mdx":()=>G(()=>import(`./architecture-C6zN_q65.js`),__vite__mapDeps([4,1,2])),"./docs/codelab.mdx":()=>G(()=>import(`./codelab-AynkhyfN.js`),__vite__mapDeps([5,1,2])),"./docs/configuration.mdx":()=>G(()=>import(`./configuration-CIpSXfjW.js`),__vite__mapDeps([6,1,2])),"./docs/github-action.mdx":()=>G(()=>import(`./github-action-dc7u3fKw.js`),__vite__mapDeps([7,1,2])),"./docs/introduction.mdx":()=>G(()=>import(`./introduction-B8QY1pGr.js`),__vite__mapDeps([8,1,2])),"./docs/onboarding.mdx":()=>G(()=>import(`./onboarding-BlVYGcIb.js`),__vite__mapDeps([9,1,2])),"./docs/security.mdx":()=>G(()=>import(`./security-DM0nmaDr.js`),__vite__mapDeps([10,1,2])),"./docs/setup.mdx":()=>G(()=>import(`./setup-KcFQ4b7q.js`),__vite__mapDeps([11,1,2])),"./docs/troubleshooting.mdx":()=>G(()=>import(`./troubleshooting-_KQA4d4F.js`),__vite__mapDeps([12,1,2])),"./docs/workspaces.mdx":()=>G(()=>import(`./workspaces-D2igqyXP.js`),__vite__mapDeps([13,1,2]))})).map(([e,t])=>[e,(0,y.lazy)(t)])),_n=Object.assign({"./docs/advanced-features.mdx":$t,"./docs/api-reference.mdx":en,"./docs/architecture.mdx":tn,"./docs/codelab.mdx":nn,"./docs/configuration.mdx":rn,"./docs/github-action.mdx":an,"./docs/introduction.mdx":on,"./docs/onboarding.mdx":sn,"./docs/security.mdx":cn,"./docs/setup.mdx":ln,"./docs/troubleshooting.mdx":un,"./docs/workspaces.mdx":dn});function vn(e){return fn.find(t=>t.slug===e)}function yn(e){return _n[`./docs/${e}.mdx`]}function bn(e){return gn[`./docs/${e}.mdx`]}function xn(){return fn}var Sn=(e,t)=>e.map(e=>{let n=t(e.slug)??``;return{title:e.title,description:e.description,content:n,slug:e.slug}}),Cn=e=>new g(e,{keys:[`title`,`description`,`content`],threshold:.3,ignoreLocation:!0}),wn=(e,t)=>{let n=t.trim();return n?e.search(n).slice(0,5).map(e=>e.item):[]},Tn=e(i(),1),En=(e,t)=>{let n=(0,y.useMemo)(()=>Cn(e),[e]);return(0,y.useMemo)(()=>wn(n,t),[t,n])},Dn=(e,t)=>{(0,y.useEffect)(()=>{let n=n=>{(n.metaKey||n.ctrlKey)&&n.key===`k`&&(n.preventDefault(),e()),n.key===`Escape`&&t()};return document.addEventListener(`keydown`,n),()=>document.removeEventListener(`keydown`,n)},[t,e])};function On({iconOnly:e,onOpen:t}){return e?(0,k.jsxs)(`button`,{onClick:t,className:`btn btn-sm btn-ghost gap-1`,"aria-label":`Search (⌘K)`,children:[(0,k.jsx)(Kt,{className:`h-4 w-4`}),(0,k.jsx)(`kbd`,{className:`hidden rounded bg-base-200 px-1.5 py-0.5 text-xs font-medium text-base-content/60 lg:inline-flex`,children:`⌘K`})]}):(0,k.jsxs)(`button`,{onClick:t,className:`flex min-w-[200px] items-center gap-2 rounded-lg bg-base-200/50 px-3 py-1.5 text-sm text-base-content/60 transition-colors hover:bg-base-200 md:min-w-[300px]`,children:[(0,k.jsx)(Kt,{className:`h-4 w-4`}),(0,k.jsx)(`span`,{children:`Search documentation...`})]})}function kn({onSelect:e}){return(0,k.jsxs)(`nav`,{className:`space-y-1 p-4`,"aria-label":`Recent documentation`,children:[(0,k.jsx)(`p`,{className:`px-2 text-xs font-medium uppercase text-base-content/40`,children:`Recent`}),(0,k.jsx)(s,{to:`/docs/$slug/`,params:{slug:`introduction`},onClick:e,className:`block rounded-lg px-3 py-2 text-sm hover:bg-base-200/50`,children:`Introduction to Pastoralist`}),(0,k.jsx)(s,{to:`/docs/$slug/`,params:{slug:`setup`},onClick:e,className:`block rounded-lg px-3 py-2 text-sm hover:bg-base-200/50`,children:`Setup Guide`})]})}function An({query:e,results:t,onSelect:n}){return e?t.length===0?(0,k.jsx)(`p`,{className:`p-8 text-center text-base-content/60`,children:`No results found`}):(0,k.jsx)(`ul`,{className:`space-y-1 p-2`,children:t.map(e=>(0,k.jsx)(`li`,{children:(0,k.jsxs)(s,{to:`/docs/$slug/`,params:{slug:e.slug},onClick:n,className:`block rounded-lg px-4 py-3 transition-colors hover:bg-base-200/50`,children:[(0,k.jsx)(`strong`,{className:`block`,children:e.title}),(0,k.jsx)(`span`,{className:`mt-0.5 block text-sm text-base-content/60`,children:e.description})]})},e.slug))}):(0,k.jsx)(kn,{onSelect:n})}function jn({query:e,results:t,inputRef:n,onQueryChange:r,onClose:i}){return(0,Tn.createPortal)((0,k.jsx)(`div`,{className:`fixed inset-0 z-[101] bg-black/60 p-4 pt-[10vh] backdrop-blur-sm`,onClick:i,children:(0,k.jsxs)(`section`,{className:`mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-base-content/10 bg-base-100 shadow-2xl`,onClick:e=>e.stopPropagation(),children:[(0,k.jsxs)(`label`,{className:`flex items-center border-b border-base-content/10 p-4`,children:[(0,k.jsx)(Kt,{className:`mr-3 h-5 w-5 text-[#1D4ED8]`}),(0,k.jsx)(`input`,{ref:n,value:e,onChange:e=>r(e.target.value),placeholder:`Search documentation...`,className:`flex-1 bg-transparent text-lg outline-none`})]}),(0,k.jsx)(`div`,{className:`max-h-[60vh] overflow-y-auto`,children:(0,k.jsx)(An,{query:e,results:t,onSelect:i})})]})}),document.body)}function Mn({searchData:e,iconOnly:t=!1}){let[n,r]=(0,y.useState)(!1),[i,a]=(0,y.useState)(``),o=(0,y.useRef)(null),s=En(e,i),c=(0,y.useCallback)(()=>r(!0),[]),l=(0,y.useCallback)(()=>{r(!1),a(``)},[]);return Dn(c,l),(0,y.useEffect)(()=>{n&&o.current?.focus()},[n]),(0,k.jsxs)(k.Fragment,{children:[(0,k.jsx)(On,{iconOnly:t,onOpen:c}),n?(0,k.jsx)(jn,{query:i,results:s,inputRef:o,onQueryChange:a,onClose:l}):null]})}var Nn=[{title:`Docs`,href:`/docs/introduction`,preload:`intent`}],Pn=Sn(xn(),yn);function Fn(){let{theme:e,toggle:t}=Qt(),n=u().pathname,r=`btn btn-sm btn-ghost swap swap-rotate btn-square ${e===`night`?`swap-active`:``}`,i=e=>e.includes(`/docs`)?n.includes(`/docs`):n===e,a=e=>`rounded-lg hover:text-[#1D4ED8] hover:bg-[#1D4ED8]/10 transition flex ${i(e)?`text-[#1D4ED8] bg-[#1D4ED8]/10`:``}`;return(0,k.jsx)(`header`,{className:`fixed top-0 z-[1000] w-full`,children:(0,k.jsxs)(`nav`,{className:`grid h-[68px] w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 border-b border-base-content/10 bg-base-100/80 px-2 py-2 backdrop-blur-3xl sm:gap-2 sm:px-4`,children:[(0,k.jsxs)(`div`,{className:`flex min-w-0 items-center gap-1 justify-self-start`,children:[(0,k.jsx)(`label`,{htmlFor:`my-drawer-2`,className:`btn btn-sm btn-ghost btn-square lg:hidden`,"aria-label":`toggle sidebar`,children:(0,k.jsx)(Wt,{className:`h-4 w-4`})}),(0,k.jsx)(s,{to:`/`,preload:`intent`,className:`btn btn-ghost min-w-0 px-1.5 sm:px-2`,children:(0,k.jsx)(`h1`,{className:`gradient-text truncate text-lg font-bold sm:text-2xl`,children:`Pastoralist`})})]}),(0,k.jsx)(`div`,{className:`justify-self-center`}),(0,k.jsxs)(`div`,{className:`flex items-center gap-1 justify-self-end`,children:[Nn.map(e=>(0,k.jsx)(s,{to:e.href,preload:`intent`,className:`btn btn-sm btn-ghost hidden sm:flex ${a(e.href)}`,children:e.title},e.href)),(0,k.jsx)(Mn,{searchData:Pn,iconOnly:!0}),(0,k.jsx)(`a`,{className:`btn btn-sm btn-ghost btn-square`,href:`https://github.com/yowainwright/pastoralist`,"aria-label":`github`,children:(0,k.jsx)(Jt,{className:`h-4 w-4`})}),(0,k.jsxs)(`button`,{"aria-label":`theme-toggle`,onClick:t,className:r,children:[(0,k.jsx)(qt,{className:`w-4 h-4 swap-off`}),(0,k.jsx)(Gt,{className:`w-4 h-4 swap-on`})]})]})]})})}function In(e){let t=`/pastoralist`;return e===``?t.endsWith(`/`)?t.slice(0,-1):t:(t.endsWith(`/`)?t:t+`/`)+(e.startsWith(`/`)?e.slice(1):e)}function K(e){return In(`docs/${e}`)}var q=[{title:`Getting Started`,items:[{title:`Introduction`,href:K(`introduction`)},{title:`Setup`,href:K(`setup`)},{title:`Onboarding`,href:K(`onboarding`)}]},{title:`Features`,items:[{title:`Security Scanning`,href:K(`security`)},{title:`Workspaces & Monorepos`,href:K(`workspaces`)},{title:`Advanced Features`,href:K(`advanced-features`)}]},{title:`Codelabs`,items:[{title:`Basic Usage`,href:K(`codelab`)}]},{title:`Reference`,items:[{title:`API Reference`,href:K(`api-reference`)},{title:`GitHub Action`,href:K(`github-action`)},{title:`Architecture`,href:K(`architecture`)},{title:`Troubleshooting & FAQ`,href:K(`troubleshooting`)}]}],Ln=(e,t)=>e.map((e,n)=>n===t?!e:e);function Rn({onClose:e=()=>void 0}){let t=u().pathname,[n,r]=(0,y.useState)(()=>q.map(()=>!0)),i=e=>{r(t=>Ln(t,e))},a=q.map((e,r)=>(0,k.jsx)(zn,{section:e,isOpen:n[r],onToggle:()=>i(r),pathname:t},e.title));return(0,k.jsxs)(`aside`,{className:`drawer-side`,children:[(0,k.jsx)(`label`,{htmlFor:`my-drawer-2`,className:`drawer-overlay lg:hidden bg-transparent`,onClick:e}),(0,k.jsx)(`nav`,{className:`w-64 bg-base-100 z-20 sticky top-[68px] h-[calc(100vh-68px)] overflow-y-auto border-r border-base-content/10`,children:(0,k.jsx)(`section`,{className:`px-3 pt-2 space-y-3`,children:a})})]})}function zn({section:e,isOpen:t,onToggle:n,pathname:r}){let i=`sidebar-content ${t?``:`hidden`}`,a=`w-4 h-4 transition-transform duration-200 ${t?`rotate-90`:``}`;return(0,k.jsxs)(`article`,{className:`sidebar-section`,children:[(0,k.jsxs)(`button`,{className:`sidebar-toggle w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-base-content/70 uppercase tracking-normal font-spline-sans-mono hover:text-base-content transition-colors`,"aria-expanded":t,onClick:n,children:[(0,k.jsx)(`span`,{children:e.title}),(0,k.jsx)(Bt,{className:a})]}),(0,k.jsx)(`nav`,{className:i,children:(0,k.jsx)(`ul`,{className:`ml-2 mt-1 border-l-2 border-base-content/10 space-y-0.5 py-1`,children:e.items.map(e=>(0,k.jsx)(Bn,{item:e,pathname:r},e.href))})})]})}function Bn({item:e,pathname:t}){let n=Hn(e.href),r=Vn(t,n);return(0,k.jsx)(`li`,{children:(0,k.jsx)(s,{to:`/docs/$slug/`,params:{slug:n},preload:`intent`,className:`block ml-0 pl-4 pr-3 py-2 text-sm transition-colors relative ${r?`text-[#1D4ED8] bg-[#1D4ED8]/10 font-medium before:absolute before:left-[-2px] before:top-0 before:bottom-0 before:w-0.5 before:bg-[#1D4ED8]`:`text-base-content/80 hover:text-[#1D4ED8] hover:bg-base-content/5`}`,children:(0,k.jsx)(`span`,{className:`flex items-center justify-between`,children:e.title})})})}function Vn(e,t){return e.replace(/\/+$/,``).endsWith(`/docs/${t}`)}function Hn(e){let t=e.match(/docs\/([^/]+)$/);return t?t[1]:`introduction`}var Un={shell:`relative flex min-h-screen flex-col`,main:`drawer lg:drawer-open relative min-h-[calc(100vh-68px)] flex-1`,drawerContent:`drawer-content flex min-h-[calc(100vh-68px)] flex-col pt-[68px]`,article:`flex min-h-[calc(100vh-68px)] flex-1 flex-col`};function Wn({children:e}){let[t,n]=(0,y.useState)(!1);return(0,k.jsxs)(`section`,{className:Un.shell,children:[(0,k.jsx)(Fn,{}),(0,k.jsxs)(`main`,{className:Un.main,children:[(0,k.jsx)(`input`,{id:`my-drawer-2`,type:`checkbox`,className:`drawer-toggle`,checked:t,onChange:e=>{n(e.target.checked)}}),(0,k.jsx)(`section`,{className:Un.drawerContent,children:(0,k.jsx)(`article`,{className:Un.article,children:e})}),(0,k.jsx)(Rn,{onClose:()=>n(!1)})]}),(0,k.jsx)(Zt,{})]})}function Gn({children:e}){return(0,k.jsxs)(`section`,{className:`flex flex-col min-h-screen relative`,children:[(0,k.jsx)(Fn,{}),(0,k.jsxs)(`main`,{className:`drawer flex-1 relative`,children:[(0,k.jsx)(`input`,{id:`my-drawer-2`,type:`checkbox`,className:`drawer-toggle`}),(0,k.jsx)(`section`,{className:`drawer-content flex flex-col pt-[68px]`,children:(0,k.jsx)(`article`,{className:`flex-1`,children:e})}),(0,k.jsx)(Rn,{})]}),(0,k.jsx)(Zt,{})]})}var Kn=/[\0-\x1F!-,\.\/:-@\[-\^`\{-\xA9\xAB-\xB4\xB6-\xB9\xBB-\xBF\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0378\u0379\u037E\u0380-\u0385\u0387\u038B\u038D\u03A2\u03F6\u0482\u0530\u0557\u0558\u055A-\u055F\u0589-\u0590\u05BE\u05C0\u05C3\u05C6\u05C8-\u05CF\u05EB-\u05EE\u05F3-\u060F\u061B-\u061F\u066A-\u066D\u06D4\u06DD\u06DE\u06E9\u06FD\u06FE\u0700-\u070F\u074B\u074C\u07B2-\u07BF\u07F6-\u07F9\u07FB\u07FC\u07FE\u07FF\u082E-\u083F\u085C-\u085F\u086B-\u089F\u08B5\u08C8-\u08D2\u08E2\u0964\u0965\u0970\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09F2-\u09FB\u09FD\u09FF\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF0-\u0AF8\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B54\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B70\u0B72-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BF0-\u0BFF\u0C0D\u0C11\u0C29\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5B-\u0C5F\u0C64\u0C65\u0C70-\u0C7F\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0CFF\u0D0D\u0D11\u0D45\u0D49\u0D4F-\u0D53\u0D58-\u0D5E\u0D64\u0D65\u0D70-\u0D79\u0D80\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DE5\u0DF0\u0DF1\u0DF4-\u0E00\u0E3B-\u0E3F\u0E4F\u0E5A-\u0E80\u0E83\u0E85\u0E8B\u0EA4\u0EA6\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F01-\u0F17\u0F1A-\u0F1F\u0F2A-\u0F34\u0F36\u0F38\u0F3A-\u0F3D\u0F48\u0F6D-\u0F70\u0F85\u0F98\u0FBD-\u0FC5\u0FC7-\u0FFF\u104A-\u104F\u109E\u109F\u10C6\u10C8-\u10CC\u10CE\u10CF\u10FB\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u1360-\u137F\u1390-\u139F\u13F6\u13F7\u13FE-\u1400\u166D\u166E\u1680\u169B-\u169F\u16EB-\u16ED\u16F9-\u16FF\u170D\u1715-\u171F\u1735-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17D4-\u17D6\u17D8-\u17DB\u17DE\u17DF\u17EA-\u180A\u180E\u180F\u181A-\u181F\u1879-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191F\u192C-\u192F\u193C-\u1945\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DA-\u19FF\u1A1C-\u1A1F\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1AA6\u1AA8-\u1AAF\u1AC1-\u1AFF\u1B4C-\u1B4F\u1B5A-\u1B6A\u1B74-\u1B7F\u1BF4-\u1BFF\u1C38-\u1C3F\u1C4A-\u1C4C\u1C7E\u1C7F\u1C89-\u1C8F\u1CBB\u1CBC\u1CC0-\u1CCF\u1CD3\u1CFB-\u1CFF\u1DFA\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FBD\u1FBF-\u1FC1\u1FC5\u1FCD-\u1FCF\u1FD4\u1FD5\u1FDC-\u1FDF\u1FED-\u1FF1\u1FF5\u1FFD-\u203E\u2041-\u2053\u2055-\u2070\u2072-\u207E\u2080-\u208F\u209D-\u20CF\u20F1-\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F-\u215F\u2189-\u24B5\u24EA-\u2BFF\u2C2F\u2C5F\u2CE5-\u2CEA\u2CF4-\u2CFF\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D70-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E00-\u2E2E\u2E30-\u3004\u3008-\u3020\u3030\u3036\u3037\u303D-\u3040\u3097\u3098\u309B\u309C\u30A0\u30FB\u3100-\u3104\u3130\u318F-\u319F\u31C0-\u31EF\u3200-\u33FF\u4DC0-\u4DFF\u9FFD-\u9FFF\uA48D-\uA4CF\uA4FE\uA4FF\uA60D-\uA60F\uA62C-\uA63F\uA673\uA67E\uA6F2-\uA716\uA720\uA721\uA789\uA78A\uA7C0\uA7C1\uA7CB-\uA7F4\uA828-\uA82B\uA82D-\uA83F\uA874-\uA87F\uA8C6-\uA8CF\uA8DA-\uA8DF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA954-\uA95F\uA97D-\uA97F\uA9C1-\uA9CE\uA9DA-\uA9DF\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A-\uAA5F\uAA77-\uAA79\uAAC3-\uAADA\uAADE\uAADF\uAAF0\uAAF1\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F\uAB5B\uAB6A-\uAB6F\uABEB\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uD7FF\uE000-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB29\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBB2-\uFBD2\uFD3E-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFC-\uFDFF\uFE10-\uFE1F\uFE30-\uFE32\uFE35-\uFE4C\uFE50-\uFE6F\uFE75\uFEFD-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF3E\uFF40\uFF5B-\uFF65\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFFF]|\uD800[\uDC0C\uDC27\uDC3B\uDC3E\uDC4E\uDC4F\uDC5E-\uDC7F\uDCFB-\uDD3F\uDD75-\uDDFC\uDDFE-\uDE7F\uDE9D-\uDE9F\uDED1-\uDEDF\uDEE1-\uDEFF\uDF20-\uDF2C\uDF4B-\uDF4F\uDF7B-\uDF7F\uDF9E\uDF9F\uDFC4-\uDFC7\uDFD0\uDFD6-\uDFFF]|\uD801[\uDC9E\uDC9F\uDCAA-\uDCAF\uDCD4-\uDCD7\uDCFC-\uDCFF\uDD28-\uDD2F\uDD64-\uDDFF\uDF37-\uDF3F\uDF56-\uDF5F\uDF68-\uDFFF]|\uD802[\uDC06\uDC07\uDC09\uDC36\uDC39-\uDC3B\uDC3D\uDC3E\uDC56-\uDC5F\uDC77-\uDC7F\uDC9F-\uDCDF\uDCF3\uDCF6-\uDCFF\uDD16-\uDD1F\uDD3A-\uDD7F\uDDB8-\uDDBD\uDDC0-\uDDFF\uDE04\uDE07-\uDE0B\uDE14\uDE18\uDE36\uDE37\uDE3B-\uDE3E\uDE40-\uDE5F\uDE7D-\uDE7F\uDE9D-\uDEBF\uDEC8\uDEE7-\uDEFF\uDF36-\uDF3F\uDF56-\uDF5F\uDF73-\uDF7F\uDF92-\uDFFF]|\uD803[\uDC49-\uDC7F\uDCB3-\uDCBF\uDCF3-\uDCFF\uDD28-\uDD2F\uDD3A-\uDE7F\uDEAA\uDEAD-\uDEAF\uDEB2-\uDEFF\uDF1D-\uDF26\uDF28-\uDF2F\uDF51-\uDFAF\uDFC5-\uDFDF\uDFF7-\uDFFF]|\uD804[\uDC47-\uDC65\uDC70-\uDC7E\uDCBB-\uDCCF\uDCE9-\uDCEF\uDCFA-\uDCFF\uDD35\uDD40-\uDD43\uDD48-\uDD4F\uDD74\uDD75\uDD77-\uDD7F\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDFF\uDE12\uDE38-\uDE3D\uDE3F-\uDE7F\uDE87\uDE89\uDE8E\uDE9E\uDEA9-\uDEAF\uDEEB-\uDEEF\uDEFA-\uDEFF\uDF04\uDF0D\uDF0E\uDF11\uDF12\uDF29\uDF31\uDF34\uDF3A\uDF45\uDF46\uDF49\uDF4A\uDF4E\uDF4F\uDF51-\uDF56\uDF58-\uDF5C\uDF64\uDF65\uDF6D-\uDF6F\uDF75-\uDFFF]|\uD805[\uDC4B-\uDC4F\uDC5A-\uDC5D\uDC62-\uDC7F\uDCC6\uDCC8-\uDCCF\uDCDA-\uDD7F\uDDB6\uDDB7\uDDC1-\uDDD7\uDDDE-\uDDFF\uDE41-\uDE43\uDE45-\uDE4F\uDE5A-\uDE7F\uDEB9-\uDEBF\uDECA-\uDEFF\uDF1B\uDF1C\uDF2C-\uDF2F\uDF3A-\uDFFF]|\uD806[\uDC3B-\uDC9F\uDCEA-\uDCFE\uDD07\uDD08\uDD0A\uDD0B\uDD14\uDD17\uDD36\uDD39\uDD3A\uDD44-\uDD4F\uDD5A-\uDD9F\uDDA8\uDDA9\uDDD8\uDDD9\uDDE2\uDDE5-\uDDFF\uDE3F-\uDE46\uDE48-\uDE4F\uDE9A-\uDE9C\uDE9E-\uDEBF\uDEF9-\uDFFF]|\uD807[\uDC09\uDC37\uDC41-\uDC4F\uDC5A-\uDC71\uDC90\uDC91\uDCA8\uDCB7-\uDCFF\uDD07\uDD0A\uDD37-\uDD39\uDD3B\uDD3E\uDD48-\uDD4F\uDD5A-\uDD5F\uDD66\uDD69\uDD8F\uDD92\uDD99-\uDD9F\uDDAA-\uDEDF\uDEF7-\uDFAF\uDFB1-\uDFFF]|\uD808[\uDF9A-\uDFFF]|\uD809[\uDC6F-\uDC7F\uDD44-\uDFFF]|[\uD80A\uD80B\uD80E-\uD810\uD812-\uD819\uD824-\uD82B\uD82D\uD82E\uD830-\uD833\uD837\uD839\uD83D\uD83F\uD87B-\uD87D\uD87F\uD885-\uDB3F\uDB41-\uDBFF][\uDC00-\uDFFF]|\uD80D[\uDC2F-\uDFFF]|\uD811[\uDE47-\uDFFF]|\uD81A[\uDE39-\uDE3F\uDE5F\uDE6A-\uDECF\uDEEE\uDEEF\uDEF5-\uDEFF\uDF37-\uDF3F\uDF44-\uDF4F\uDF5A-\uDF62\uDF78-\uDF7C\uDF90-\uDFFF]|\uD81B[\uDC00-\uDE3F\uDE80-\uDEFF\uDF4B-\uDF4E\uDF88-\uDF8E\uDFA0-\uDFDF\uDFE2\uDFE5-\uDFEF\uDFF2-\uDFFF]|\uD821[\uDFF8-\uDFFF]|\uD823[\uDCD6-\uDCFF\uDD09-\uDFFF]|\uD82C[\uDD1F-\uDD4F\uDD53-\uDD63\uDD68-\uDD6F\uDEFC-\uDFFF]|\uD82F[\uDC6B-\uDC6F\uDC7D-\uDC7F\uDC89-\uDC8F\uDC9A-\uDC9C\uDC9F-\uDFFF]|\uD834[\uDC00-\uDD64\uDD6A-\uDD6C\uDD73-\uDD7A\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDE41\uDE45-\uDFFF]|\uD835[\uDC55\uDC9D\uDCA0\uDCA1\uDCA3\uDCA4\uDCA7\uDCA8\uDCAD\uDCBA\uDCBC\uDCC4\uDD06\uDD0B\uDD0C\uDD15\uDD1D\uDD3A\uDD3F\uDD45\uDD47-\uDD49\uDD51\uDEA6\uDEA7\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3\uDFCC\uDFCD]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85-\uDE9A\uDEA0\uDEB0-\uDFFF]|\uD838[\uDC07\uDC19\uDC1A\uDC22\uDC25\uDC2B-\uDCFF\uDD2D-\uDD2F\uDD3E\uDD3F\uDD4A-\uDD4D\uDD4F-\uDEBF\uDEFA-\uDFFF]|\uD83A[\uDCC5-\uDCCF\uDCD7-\uDCFF\uDD4C-\uDD4F\uDD5A-\uDFFF]|\uD83B[\uDC00-\uDDFF\uDE04\uDE20\uDE23\uDE25\uDE26\uDE28\uDE33\uDE38\uDE3A\uDE3C-\uDE41\uDE43-\uDE46\uDE48\uDE4A\uDE4C\uDE50\uDE53\uDE55\uDE56\uDE58\uDE5A\uDE5C\uDE5E\uDE60\uDE63\uDE65\uDE66\uDE6B\uDE73\uDE78\uDE7D\uDE7F\uDE8A\uDE9C-\uDEA0\uDEA4\uDEAA\uDEBC-\uDFFF]|\uD83C[\uDC00-\uDD2F\uDD4A-\uDD4F\uDD6A-\uDD6F\uDD8A-\uDFFF]|\uD83E[\uDC00-\uDFEF\uDFFA-\uDFFF]|\uD869[\uDEDE-\uDEFF]|\uD86D[\uDF35-\uDF3F]|\uD86E[\uDC1E\uDC1F]|\uD873[\uDEA2-\uDEAF]|\uD87A[\uDFE1-\uDFFF]|\uD87E[\uDE1E-\uDFFF]|\uD884[\uDF4B-\uDFFF]|\uDB40[\uDC00-\uDCFF\uDDF0-\uDFFF]/g,qn=Object.hasOwnProperty,Jn=class{constructor(){this.occurrences,this.reset()}slug(e,t){let n=this,r=Yn(e,t===!0),i=r;for(;qn.call(n.occurrences,r);)n.occurrences[i]++,r=i+`-`+n.occurrences[i];return n.occurrences[r]=0,r}reset(){this.occurrences=Object.create(null)}};function Yn(e,t){return typeof e==`string`?(t||(e=e.toLowerCase()),e.replace(Kn,``).replace(/ /g,`-`)):``}var Xn=/^(#{2,4})\s+(.+)$/gm;function Zn(e){let t=new Jn,n=new RegExp(Xn.source,Xn.flags);return Array.from(e.matchAll(n)).map(e=>{let n=e[1].length,r=e[2].trim();return{depth:n,slug:t.slug(r),text:r}})}var Qn={rootMargin:`-20% 0% -70% 0%`,threshold:0},$n=`h2[id], h3[id], h4[id]`,er=88;function tr(e,t=!1){let n=e[0];return n?t?e.at(-1)?.id??n.id:e.filter(e=>e.getBoundingClientRect().top<=er).at(-1)?.id??n.id:null}var nr=(e,t)=>{let n=new Set(t);return()=>Array.from(e.querySelectorAll($n)).filter(({id:e})=>n.has(e))},rr=(e,t)=>{let{body:n,documentElement:r}=e.ownerDocument;return t.getComputedStyle(n).overflowY===`visible`?r:n},ir=(e,t,n,r)=>{let i,a=()=>t.scrollTop+t.clientHeight>=t.scrollHeight-1;return{update:()=>{i!==void 0&&e.cancelAnimationFrame(i),i=e.requestAnimationFrame(()=>{i=void 0,r(tr(n(),a()))})},cancel:()=>{i!==void 0&&e.cancelAnimationFrame(i)}}};function ar(e,t,n){let r=e.current;if(!r||t.length===0)return;let i=r.ownerDocument.defaultView;if(!i)return;let a=nr(r,t),o=a();if(o.length<t.length)return;let s=rr(r,i),c=ir(i,s,a,n),l=new IntersectionObserver(c.update,Qn);return c.update(),s.addEventListener(`scroll`,c.update,{passive:!0}),i.addEventListener(`resize`,c.update),o.forEach(e=>l.observe(e)),()=>{l.disconnect(),s.removeEventListener(`scroll`,c.update),i.removeEventListener(`resize`,c.update),c.cancel()}}function or(e,t){let[n,r]=(0,y.useState)(null),i=t.join(`,`);return(0,y.useEffect)(()=>{if(r(null),t.length===0)return;let n=ar(e,t,r);if(n)return n;let i=e.current;if(!i)return;let a=new MutationObserver(()=>{n=ar(e,t,r),n&&a.disconnect()});return a.observe(i,{childList:!0,subtree:!0}),()=>{a.disconnect(),n?.()}},[e,i]),n}function sr(e,t){return t.reduce((e,t)=>e[t]?.subheadings??[],e)}function cr(e,t,n){if(t.length===0)return e.concat(n);let[r,...i]=t;return e.map((e,t)=>{if(t!==r)return e;let a=cr(e.subheadings,i,n);return Object.assign({},e,{subheadings:a})})}function lr(e){return e.reduce((e,t)=>{let n=Object.assign({},t,{subheadings:[]}),r=n.depth===2?[]:e.paths[n.depth-1];if(!r)return e;let i=sr(e.toc,r).length,a=r.concat(i);return{toc:cr(e.toc,r,n),paths:Object.assign({},e.paths,{[n.depth]:a})}},{toc:[],paths:{}}).toc}var ur=/`([^`]+)`/g;function dr(e){let t=Array.from(e.matchAll(ur)).reduce((t,n)=>{let r=t.lastIndex,i=n.index>r?[{text:e.slice(r,n.index),isCode:!1}]:[];return r=n.index+n[0].length,{parts:t.parts.concat(i,{text:n[1],isCode:!0}),lastIndex:r}},{parts:[],lastIndex:0}),n=t.lastIndex<e.length?[{text:e.slice(t.lastIndex),isCode:!1}]:[],r=t.parts.concat(n);return r.length===0?[{text:e,isCode:!1}]:r}var fr=`block text-sm transition-colors border-l-2 pl-4 -ml-0.5 font-spline-sans-mono`,pr=`text-[#1D4ED8] font-medium border-[#1D4ED8]`,mr=`hover:text-[#1D4ED8] border-transparent`;function hr(e,t=!1){return`${fr} ${t?`py-0.5`:`py-1`} ${e?pr:`${t?`text-base-content/60`:`text-base-content/70`} ${mr}`}`}function gr(e,t){let n=e?Array.from(e.querySelectorAll($n)).find(e=>e.id===t):void 0;return n?(n.scrollIntoView({behavior:`smooth`,block:`start`}),history.pushState(null,``,`#${t}`),!0):!1}function _r({headings:e,contentRef:t}){let n=e??[],r=lr(n),i=or(t,n.map(({slug:e})=>e)),a=(0,y.useCallback)((e,n)=>{gr(t.current,n)&&e.preventDefault()},[t]);return r.length===0?null:(0,k.jsxs)(`nav`,{className:`sticky top-28 w-64`,"aria-label":`Table of contents`,children:[(0,k.jsx)(vr,{}),(0,k.jsx)(yr,{toc:r,activeId:i,onClickLink:a})]})}function vr(){return(0,k.jsx)(`h2`,{className:`mb-3 text-xs font-semibold text-base-content/60 uppercase tracking-wider font-spline-sans-mono`,children:`On this page`})}function yr({toc:e,activeId:t,onClickLink:n}){return(0,k.jsx)(`ul`,{className:`space-y-2.5`,children:e.map(e=>(0,k.jsx)(br,{heading:e,activeId:t,onClickLink:n},e.slug))})}function br({heading:e,activeId:t,onClickLink:n}){let r=t===e.slug,i=e.subheadings.length>0;return(0,k.jsxs)(`li`,{children:[(0,k.jsx)(xr,{slug:e.slug,text:e.text,isActive:r,onClickLink:n}),i&&(0,k.jsx)(Sr,{subheadings:e.subheadings,activeId:t,onClickLink:n})]})}function xr({slug:e,text:t,isActive:n,isSubheading:r=!1,onClickLink:i}){let a=dr(t);return(0,k.jsx)(`a`,{href:`#${e}`,onClick:t=>i(t,e),className:hr(n,r),children:a.map((e,t)=>e.isCode?(0,k.jsx)(`code`,{className:`text-xs px-1 py-0.5 rounded bg-base-content/10`,children:e.text},t):(0,k.jsx)(`span`,{children:e.text},t))})}function Sr({subheadings:e,activeId:t,onClickLink:n}){return(0,k.jsx)(`ul`,{className:`mt-2 space-y-2 ml-3`,children:e.map(e=>(0,k.jsx)(`li`,{children:(0,k.jsx)(xr,{slug:e.slug,text:e.text,isActive:t===e.slug,isSubheading:!0,onClickLink:n})},e.slug))})}var Cr=_({id:`copy`,initial:`idle`,states:{idle:{on:{COPY:`copied`}},copied:{after:{2e3:`idle`}}}}),wr=e=>e?(0,k.jsx)(Rt,{className:`h-4 w-4 text-green-500`}):(0,k.jsx)(Vt,{className:`h-4 w-4`}),Tr=async e=>{try{return await navigator.clipboard.writeText(e),!0}catch{return!1}};function Er({code:e}){let[t,n]=v(Cr),r=t.matches(`copied`),i=async()=>{await Tr(e)&&n({type:`COPY`})},a=r?`Copied!`:`Copy code`,o=wr(r);return(0,k.jsx)(`button`,{type:`button`,className:`flex items-center justify-center h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer`,onClick:i,"aria-label":a,children:o})}var Dr=[`javascript`,`js`,`typescript`,`ts`,`jsx`,`tsx`,`bash`,`shellscript`,`json`,`jsonc`,`yaml`,`markdown`,`text`],Or={js:`javascript`,ts:`typescript`},kr=new Set([`bash`,`console`,`plaintext`,`shell`,`shellscript`,`sh`,`terminal`,`text`]),Ar=e=>Or[e]||e,jr=e=>e.replace(/\r?\n$/,``),Mr=e=>{let t=Ar(e.trim().toLowerCase());return!kr.has(t)},Nr={wrapper:`not-prose shiki-wrapper relative group w-full min-w-0 max-w-full overflow-hidden rounded-md border border-border/70 bg-card/85 backdrop-blur`,header:`shiki-header flex items-center justify-between gap-3 border-b border-border/70 bg-muted/55 px-3 py-2`,pre:`max-w-full overflow-x-auto px-2 py-2 text-[13px] leading-5`,content:`max-w-full [&_.shiki]:!overflow-visible [&_.shiki]:!bg-transparent [&_pre]:!m-0 [&_pre]:!max-w-full [&_pre]:!border-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:!bg-transparent [&_code]:!p-0`},Pr=[`bg-rose-400`,`bg-amber-400`,`bg-emerald-400`],Fr=128,Ir=null,Lr=new Map;function Rr(){return Ir||=G(()=>import(`./highlighter-8YLJHKgu.js`).then(e=>e.createCodeHighlighter()),__vite__mapDeps([14,15,2])),Ir}var zr=e=>{let t=Ar(e);return Dr.includes(t)?t:`text`},Br=e=>{let t=Lr.get(e);if(t)return Lr.delete(e),Lr.set(e,t),t},Vr=(e,t)=>{if(Lr.size>=Fr){let e=Lr.keys().next().value;e!==void 0&&Lr.delete(e)}Lr.set(e,t)},Hr=(e,t,n)=>{let r=zr(t),i=JSON.stringify([e,r,n]),a=Br(i);if(a)return a;let o=Rr().then(t=>t.codeToHtml(e,r,n)).catch(e=>{throw Lr.delete(i),e});return Vr(i,o),o};function Ur({code:e,lang:t=`text`,showLineNumbers:n=!1}){let r=jr(e),i=(0,y.use)(Hr(r,t,n));return(0,k.jsx)(`div`,{className:Nr.content,dangerouslySetInnerHTML:{__html:i}})}function Wr({line:e}){return(0,k.jsx)(`span`,{className:`line`,children:(0,k.jsx)(`span`,{children:e||`\xA0`})})}function Gr({code:e}){let t=e.split(`
`);return(0,k.jsx)(`div`,{className:Nr.content,children:(0,k.jsx)(`pre`,{className:`shiki`,children:(0,k.jsx)(`code`,{children:t.map((e,t)=>(0,k.jsx)(Wr,{line:e},t))})})})}function Kr({code:e,lang:t=`text`,title:n,showLineNumbers:r=!1,showLanguage:i=!0,showCopy:a=!0,className:o}){let s=jr(e),c=r&&Mr(t),l=!!(n||i||a),u=a?(0,k.jsx)(Er,{code:s}):null;return(0,k.jsxs)(`div`,{className:wt(Nr.wrapper,c&&`show-line-numbers`,o),children:[l&&(0,k.jsxs)(`div`,{className:Nr.header,children:[(0,k.jsxs)(`div`,{className:`flex min-w-0 items-center gap-3`,children:[(0,k.jsx)(`div`,{className:`flex items-center gap-1.5`,"aria-hidden":`true`,children:Pr.map(e=>(0,k.jsx)(`span`,{className:wt(`h-2.5 w-2.5 rounded-full ring-1 ring-black/5`,e)},e))}),(0,k.jsxs)(`div`,{className:`flex min-w-0 items-center gap-2`,children:[n&&(0,k.jsx)(`span`,{className:`truncate text-xs font-medium text-base-content/70`,children:n}),i&&t&&t!==`text`&&(0,k.jsx)(`span`,{className:`font-mono text-xs text-base-content/50`,children:t})]})]}),u]}),(0,k.jsx)(`div`,{className:Nr.pre,children:(0,k.jsx)(y.Suspense,{fallback:(0,k.jsx)(Gr,{code:s}),children:(0,k.jsx)(Ur,{code:s,lang:t,showLineNumbers:c})})})]})}function qr({href:e,children:t,className:n}){if(!e)return(0,k.jsx)(`a`,{className:n,children:t});if(e.startsWith(`http`)||e.startsWith(`//`))return(0,k.jsx)(`a`,{href:e,className:n,target:`_blank`,rel:`noopener noreferrer`,children:t});if(e.startsWith(`/docs/`)){let r=e.replace(`/docs/`,``);return(0,k.jsx)(s,{to:`/docs/$slug/`,params:{slug:r},className:n,children:t})}return(0,k.jsx)(`a`,{href:e,className:n,children:t})}function Jr({level:e,id:t,children:n,...r}){if(!t)return(0,k.jsx)(e,{...r,children:n});let i=`#${t}`;return(0,k.jsx)(e,{...r,id:t,children:(0,k.jsxs)(`a`,{href:i,className:`group text-inherit no-underline`,children:[n,(0,k.jsx)(Ht,{"aria-hidden":`true`,className:`ml-2 inline-block h-[0.8em] w-[0.8em] align-baseline opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60`})]})})}var Yr=e=>function(t){return(0,k.jsx)(Jr,{...t,level:e})},Xr=(0,y.lazy)(()=>G(()=>import(`./Mermaid-BvY_EFCH.js`).then(e=>({default:e.Mermaid})),__vite__mapDeps([16,2,1,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33]))),Zr=Yr(`h1`),Qr=Yr(`h2`),$r=Yr(`h3`),ei=Yr(`h4`),ti=Yr(`h5`),ni=Yr(`h6`);function ri(e){return typeof e==`string`?e:Array.isArray(e)?e.map(ri).join(``):e&&typeof e==`object`&&`props`in e?ri(e.props?.children):``}function ii({chart:e}){return(0,k.jsx)(y.Suspense,{fallback:(0,k.jsx)(`div`,{className:`my-6 flex min-h-64 items-center justify-center animate-pulse`,children:(0,k.jsx)(`div`,{className:`h-48 w-full max-w-lg rounded bg-base-content/10`})}),children:(0,k.jsx)(Xr,{chart:e})})}function ai({children:e,...t}){let n=t[`data-mermaid-content`],r=t[`data-language`];if(r===`mermaid`&&n)return(0,k.jsx)(ii,{chart:n});let i=e,a=i?.props?.[`data-mermaid-content`],o=i?.props?.[`data-language`];if(o===`mermaid`&&a)return(0,k.jsx)(ii,{chart:a});let s=((i?.props?.className??``).match(/language-(\S+)/)?.[1]??o??r??`text`).replace(/^language-/,``),c=ri(i?.props?.children??e);return s===`mermaid`?(0,k.jsx)(ii,{chart:c}):(0,k.jsx)(`div`,{className:`not-prose my-4 min-w-0 max-w-full overflow-hidden`,children:(0,k.jsx)(Kr,{code:c,lang:s,showCopy:!1,showLanguage:!1,showLineNumbers:!0})})}var oi={Mermaid:ii,pre:ai,a:qr,h1:Zr,h2:Qr,h3:$r,h4:ei,h5:ti,h6:ni,p:`p`,code:`code`,span:`span`,strong:`strong`,em:`em`,ul:`ul`,ol:`ol`,li:`li`,img:`img`};function si(e){let t=e.match(/docs\/([^/]+)$/);return t?t[1]:`introduction`}function ci(e){let t,n,r,i;if(q.forEach((t,n)=>{let a=t.items.findIndex(t=>t.href.endsWith(`/${e}`));a!==-1&&(r=n,i=a)}),r===void 0||i===void 0)return{prevItem:t,nextItem:n};if(i>0)t=q[r].items[i-1];else if(r>0){let e=q[r-1];t=e.items[e.items.length-1]}return i<q[r].items.length-1?n=q[r].items[i+1]:r<q.length-1&&(n=q[r+1].items[0]),{prevItem:t,nextItem:n}}function li({prevItem:e,nextItem:t}){return(0,k.jsxs)(`nav`,{className:`flex gap-7`,children:[e?.href&&(0,k.jsx)(s,{to:`/docs/$slug/`,params:{slug:si(e.href)},preload:`intent`,className:`mr-auto flex`,children:(0,k.jsxs)(`button`,{className:`btn rounded-full bg-base-100 border border-base-content/10 text-base-content/80 shadow-sm shadow-base-content/5 hover:bg-base-content/5 hover:text-[#1D4ED8] transition-all`,children:[(0,k.jsx)(zt,{className:`w-6 h-6`}),(0,k.jsx)(`span`,{className:`text-xs md:text-sm font-medium`,children:e.title})]})}),t?.href&&(0,k.jsx)(s,{to:`/docs/$slug/`,params:{slug:si(t.href)},preload:`intent`,className:`ml-auto flex`,children:(0,k.jsxs)(`button`,{className:`btn rounded-full bg-base-100 border border-base-content/10 text-base-content/80 shadow-sm shadow-base-content/5 hover:bg-base-content/5 hover:text-[#1D4ED8] transition-all`,children:[(0,k.jsx)(`span`,{className:`text-xs md:text-sm font-medium`,children:t.title}),(0,k.jsx)(Bt,{className:`w-6 h-6`})]})})]})}var ui=`/pastoralist/assets/katex.min-BsN2iI2U.css`,di={page:`relative mx-auto grid min-h-[calc(100vh-68px)] w-full max-w-[1120px] grid-cols-1 gap-8 overflow-x-clip px-4 py-6 font-spline-sans-mono sm:px-6 md:px-10 md:py-10 lg:px-12 xl:grid-cols-[minmax(0,680px)_240px] xl:gap-16 xl:px-16 2xl:max-w-[1240px] 2xl:grid-cols-[minmax(0,720px)_260px] 2xl:gap-20 2xl:px-20`,article:`flex w-[calc(100vw-2rem)] min-w-0 max-w-full flex-1 flex-col sm:w-full`,content:`docs-prose prose prose-sm sm:prose-base md:prose-md mb-10 min-h-[calc(100vh-220px)] w-full min-w-0 max-w-full break-words prose-pre:max-w-full prose-pre:overflow-x-auto [&>*]:max-w-full`,loading:`not-prose flex min-h-[calc(100vh-220px)] w-full items-center justify-center rounded-md border border-base-content/10 bg-base-100/70`};function fi(){let{slug:e}=h({from:`/docs/$slug`}),t=(0,y.useRef)(null),n=vn(e);if((0,y.useEffect)(()=>{let e=window.location.hash.slice(1);if(!(e.length>0))return;let n=t.current;if(!n)return;let r,i=()=>{let t=Array.from(n.querySelectorAll(`[id]`)).find(t=>t.id===e);return t?(r=window.requestAnimationFrame(()=>t.scrollIntoView({block:`start`})),!0):!1},a=new MutationObserver(()=>{i()&&a.disconnect()});return i()||a.observe(n,{childList:!0,subtree:!0}),()=>{a.disconnect(),r!==void 0&&window.cancelAnimationFrame(r)}},[t,e]),!n)return(0,k.jsx)(l,{to:`/docs/$slug/`,params:{slug:`introduction`}});let r=bn(e),i=yn(e),a=i?Zn(i):[],{prevItem:o,nextItem:s}=ci(e);return(0,k.jsxs)(`section`,{className:di.page,children:[(0,k.jsx)(pi,{enabled:n.usesMath}),(0,k.jsxs)(`article`,{className:di.article,children:[(0,k.jsx)(mi,{title:n.title}),(0,k.jsxs)(`section`,{ref:t,className:di.content,children:[(0,k.jsxs)(`header`,{children:[(0,k.jsx)(`h1`,{children:n.title}),(0,k.jsx)(`p`,{children:n.description})]}),(0,k.jsx)(hi,{Content:r})]}),(0,k.jsx)(li,{prevItem:o,nextItem:s})]}),(0,k.jsx)(`aside`,{className:`hidden xl:block`,children:(0,k.jsx)(_r,{headings:a,contentRef:t},e)})]})}function pi({enabled:e}){return e?(0,k.jsx)(`link`,{rel:`stylesheet`,href:ui,precedence:`low`}):null}function mi({title:e}){return(0,k.jsx)(`nav`,{className:`text-base breadcrumbs pt-0 pb-4`,children:(0,k.jsxs)(`ul`,{children:[(0,k.jsx)(`li`,{children:(0,k.jsx)(s,{to:`/`,className:`hover:text-primary`,children:`Home`})}),(0,k.jsx)(`li`,{className:`text-primary`,children:e})]})})}function hi({Content:e}){return e?(0,k.jsx)(y.Suspense,{fallback:(0,k.jsx)(gi,{}),children:(0,k.jsx)(e,{components:oi})}):null}function gi(){return(0,k.jsx)(`div`,{className:di.loading,role:`status`,"aria-label":`Loading documentation`,children:(0,k.jsx)(Ut,{className:`size-8 animate-spin text-primary`,"aria-hidden":`true`})})}var _i=_({id:`copy`,initial:`idle`,states:{idle:{on:{COPY:`copied`}},copied:{after:{800:`idle`}}}}),vi=`flex items-center justify-center size-9 shrink-0 rounded-xl bg-base-100/70 hover:bg-base-200/80 transition-colors cursor-pointer`,yi=`h-5 w-5 pointer-events-none`,bi=`h-6 w-6 pointer-events-none text-green-500`,xi=e=>e?(0,k.jsx)(Rt,{className:bi}):(0,k.jsx)(Vt,{className:yi}),Si=async e=>{try{return await navigator.clipboard.writeText(e),!0}catch{return!1}};function Ci(){let[e,t]=v(_i),n=e.matches(`copied`),r=async e=>{let n=e.currentTarget.closest(`figure, div`)?.querySelector(`code`);!n||!await Si(n.textContent??``)||t({type:`COPY`})},i=n?`Copied!`:`Copy`,a=xi(n);return(0,k.jsx)(`button`,{type:`button`,className:vi,onClick:r,"aria-label":i,children:a})}var wi=new Map,Ti=new WeakMap,Ei=0,Di;function Oi(e){return e?Ti.has(e)?Ti.get(e):(Ei+=1,Ti.set(e,Ei.toString()),Ti.get(e)):`0`}function ki(e){return Object.keys(e).sort().filter(t=>e[t]!==void 0).map(t=>`${t}_${t===`root`?Oi(e.root):e[t]}`).toString()}function Ai(e){let t=ki(e),n=wi.get(t);if(!n){let r=new Map,i,a=new IntersectionObserver(t=>{t.forEach(t=>{let n=t.isIntersecting&&i.some(e=>t.intersectionRatio>=e);e.trackVisibility&&t.isVisible===void 0&&(t.isVisible=n),[...r.get(t.target)??[]].forEach(e=>{e(n,t)})})},e);i=a.thresholds||(Array.isArray(e.threshold)?e.threshold:[e.threshold||0]),n={id:t,observer:a,elements:r},wi.set(t,n)}return n}function ji(e,t,n={},r=Di){if(window.IntersectionObserver===void 0&&r!==void 0){let i=e.getBoundingClientRect();return t(r,{isIntersecting:r,target:e,intersectionRatio:typeof n.threshold==`number`?n.threshold:0,time:0,boundingClientRect:i,intersectionRect:i,rootBounds:i}),()=>{}}let{id:i,observer:a,elements:o}=Ai(n),s=o.get(e)||[];o.has(e)||o.set(e,s),s.push(t),a.observe(e);let c=!1;return function(){c||(c=!0,s.splice(s.indexOf(t),1),s.length===0&&(o.delete(e),a.unobserve(e)),o.size===0&&(a.disconnect(),wi.delete(i)))}}y.Component;var Mi=Reflect.get(y,`useInsertionEffect`),Ni=Mi??y.useEffect;function Pi(e){return e?.startsWith(`19.`)||!1}var Fi=Pi(`19.2.8`);function Ii(e,{threshold:t,root:n,rootMargin:r,scrollMargin:i,trackVisibility:a,delay:o,fallbackInView:s,skip:c,triggerOnce:l}){let u=y.useRef(e),d=y.useRef({node:null,stop:void 0,owner:null});return Mi||(u.current=e),Ni(()=>{u.current=e},[e]),y.useCallback(function e(f){let p=d.current;if(!f&&p.owner!==e)return;if(f===p.node)return p.owner=e,Fi?p.stop:void 0;let m=p.stop;if(p.stop=void 0,m?.(),!f||c){p.node=null,p.owner=f?e:null;return}p.node=f,p.owner=e;let h,g;function _(){h?.(),p.stop===_&&(p.node=null,p.stop=void 0)}return p.stop=_,h=ji(f,(e,t)=>{u.current(e,t,g),g=e,l&&e&&_()},{threshold:t,root:n,rootMargin:r,scrollMargin:i,trackVisibility:a,delay:o},s),p.stop!==_&&h(),Fi?p.stop:void 0},[Array.isArray(t)?t.toString():t,n,r,i,a,o,s,c,l])}var Li=typeof window>`u`?y.useEffect:y.useLayoutEffect;function Ri({threshold:e,delay:t,trackVisibility:n,rootMargin:r,scrollMargin:i,root:a,triggerOnce:o,skip:s,initialInView:c,fallbackInView:l,onChange:u}={}){let d=y.useRef(c),[f,p]=y.useState({inView:!!c,entry:void 0}),m=Ii((e,t)=>{let n=d.current;d.current=e,!(n===void 0&&!e)&&(p({inView:e,entry:t}),u?.(e,t))},{threshold:e,root:a,rootMargin:r,scrollMargin:i,trackVisibility:n,delay:t,fallbackInView:l,skip:s,triggerOnce:o}),h=y.useRef({node:null,reset:!1}),g=y.useCallback(function(e){e?(h.current.node=e,h.current.reset=!1):h.current.node&&(h.current.node=null,h.current.reset=!0);let t=m(e);if(t)return()=>{t(),h.current.node===e&&(h.current.node=null,h.current.reset=!0)}},[m]);Li(()=>{h.current.reset&&(h.current.reset=!1,!(o||s)&&(p({inView:!!c,entry:void 0}),d.current=c))});let _=[g,f.inView,f.entry];return _.ref=_[0],_.inView=_[1],_.entry=_[2],_}function zi(e={}){let{threshold:t=.1,triggerOnce:n=!0,initialInView:r,onChange:i}=e,{ref:a,inView:o}=Ri({threshold:t,triggerOnce:n,onChange:i,initialInView:r??Tt()});return{ref:a,isVisible:o}}function Bi(){let[e,t]=(0,y.useState)(!1);return(0,y.useEffect)(()=>{t(!0)},[]),e}var Vi=({children:e,maskSrc:t})=>{let n={WebkitMaskImage:`url(${t})`,maskImage:`url(${t})`,WebkitMaskSize:`contain`,maskSize:`contain`,WebkitMaskRepeat:`no-repeat`,maskRepeat:`no-repeat`,WebkitMaskPosition:`center`,maskPosition:`center`};return(0,k.jsx)(`div`,{style:{position:`relative`,display:`inline-flex`},children:(0,k.jsxs)(`div`,{className:`logo-shine-wrap`,style:n,children:[e,(0,k.jsx)(`div`,{"aria-hidden":`true`,className:`logo-shine-beam`})]})})},Hi=({size:e,color:t})=>(0,k.jsx)(`svg`,{width:e,height:e,viewBox:`0 0 10 10`,fill:t,"aria-hidden":`true`,style:{filter:`drop-shadow(0 0 3px ${t})`},children:(0,k.jsx)(`path`,{d:`M5 0 L6.2 3.8 L10 5 L6.2 6.2 L5 10 L3.8 6.2 L0 5 L3.8 3.8 Z`})}),Ui=[{left:`5%`,top:`4%`,size:12,color:`#fbbf24`,delay:0,duration:3.2},{left:`13%`,top:`1%`,size:7,color:`#c084fc`,delay:1.7,duration:2.8},{left:`20%`,top:`2%`,size:8,color:`#e2e8f0`,delay:1.4,duration:2.7},{left:`32%`,top:`4%`,size:11,color:`#f9a8d4`,delay:.2,duration:3.4},{left:`44%`,top:`3%`,size:10,color:`#93c5fd`,delay:.6,duration:3.5},{left:`57%`,top:`1%`,size:8,color:`#fbbf24`,delay:2.8,duration:2.6},{left:`70%`,top:`5%`,size:14,color:`#fbbf24`,delay:2.1,duration:2.9},{left:`79%`,top:`2%`,size:7,color:`#e2e8f0`,delay:1,duration:3.1},{left:`90%`,top:`7%`,size:9,color:`#c084fc`,delay:.3,duration:3.1},{left:`1%`,top:`14%`,size:8,color:`#93c5fd`,delay:2.2,duration:3},{left:`1%`,top:`25%`,size:11,color:`#f9a8d4`,delay:1.8,duration:2.6},{left:`4%`,top:`38%`,size:7,color:`#fbbf24`,delay:.4,duration:3.5},{left:`3%`,top:`55%`,size:8,color:`#93c5fd`,delay:.5,duration:3.4},{left:`1%`,top:`67%`,size:12,color:`#e2e8f0`,delay:2.6,duration:2.7},{left:`2%`,top:`78%`,size:13,color:`#fbbf24`,delay:2.3,duration:2.8},{left:`4%`,top:`89%`,size:7,color:`#c084fc`,delay:1,duration:3.3},{left:`96%`,top:`16%`,size:8,color:`#f9a8d4`,delay:.6,duration:2.9},{left:`96%`,top:`22%`,size:10,color:`#e2e8f0`,delay:1.1,duration:3},{left:`98%`,top:`35%`,size:7,color:`#fbbf24`,delay:2,duration:3.4},{left:`97%`,top:`48%`,size:13,color:`#c084fc`,delay:.4,duration:3.3},{left:`96%`,top:`62%`,size:8,color:`#93c5fd`,delay:1.5,duration:2.6},{left:`95%`,top:`72%`,size:9,color:`#f9a8d4`,delay:1.9,duration:2.7},{left:`97%`,top:`85%`,size:11,color:`#fbbf24`,delay:.1,duration:3.2},{left:`10%`,top:`12%`,size:9,color:`#e2e8f0`,delay:1.3,duration:2.8},{left:`14%`,top:`18%`,size:7,color:`#fbbf24`,delay:.9,duration:3.6},{left:`25%`,top:`10%`,size:10,color:`#c084fc`,delay:2.4,duration:2.5},{left:`35%`,top:`16%`,size:8,color:`#93c5fd`,delay:.7,duration:3},{left:`74%`,top:`11%`,size:9,color:`#f9a8d4`,delay:1.6,duration:2.7},{left:`82%`,top:`14%`,size:11,color:`#93c5fd`,delay:2.5,duration:2.5},{left:`88%`,top:`20%`,size:7,color:`#fbbf24`,delay:.3,duration:3.3},{left:`7%`,top:`42%`,size:10,color:`#c084fc`,delay:1.2,duration:3.1},{left:`8%`,top:`60%`,size:8,color:`#f9a8d4`,delay:2.7,duration:2.8},{left:`91%`,top:`38%`,size:9,color:`#e2e8f0`,delay:.5,duration:3.4},{left:`92%`,top:`57%`,size:11,color:`#fbbf24`,delay:1.8,duration:2.6},{left:`12%`,top:`74%`,size:7,color:`#93c5fd`,delay:.4,duration:3.2},{left:`18%`,top:`80%`,size:9,color:`#c084fc`,delay:.7,duration:3.2},{left:`28%`,top:`76%`,size:12,color:`#fbbf24`,delay:2.1,duration:2.9},{left:`38%`,top:`88%`,size:12,color:`#e2e8f0`,delay:2,duration:2.8},{left:`48%`,top:`78%`,size:8,color:`#f9a8d4`,delay:1.4,duration:3.5},{left:`58%`,top:`83%`,size:10,color:`#c084fc`,delay:.2,duration:3},{left:`62%`,top:`85%`,size:8,color:`#fbbf24`,delay:1.3,duration:3.5},{left:`72%`,top:`77%`,size:11,color:`#93c5fd`,delay:2.6,duration:2.7},{left:`80%`,top:`82%`,size:11,color:`#f9a8d4`,delay:.2,duration:3.1},{left:`88%`,top:`75%`,size:7,color:`#e2e8f0`,delay:1.7,duration:3.4},{left:`7%`,top:`95%`,size:8,color:`#fbbf24`,delay:2.3,duration:2.6},{left:`10%`,top:`94%`,size:10,color:`#93c5fd`,delay:1.6,duration:2.6},{left:`22%`,top:`97%`,size:7,color:`#c084fc`,delay:.9,duration:3.1},{left:`35%`,top:`95%`,size:9,color:`#e2e8f0`,delay:1.4,duration:2.8},{left:`50%`,top:`96%`,size:7,color:`#c084fc`,delay:.8,duration:3.3},{left:`63%`,top:`94%`,size:11,color:`#f9a8d4`,delay:2,duration:2.9},{left:`75%`,top:`97%`,size:8,color:`#fbbf24`,delay:.5,duration:3.4},{left:`85%`,top:`93%`,size:13,color:`#fbbf24`,delay:2.4,duration:2.9},{left:`93%`,top:`95%`,size:7,color:`#93c5fd`,delay:1.1,duration:3}];function Wi(){return(0,k.jsx)(`div`,{"aria-hidden":`true`,className:`pointer-events-none absolute inset-0 overflow-hidden`,style:{zIndex:0},children:Ui.map((e,t)=>(0,k.jsx)(r.span,{style:{position:`absolute`,left:e.left,top:e.top},initial:{opacity:0,scale:0,rotate:0},animate:{opacity:[0,1,0],scale:[0,1,0],rotate:[0,135,0]},transition:{duration:e.duration,delay:e.delay,repeat:1/0,ease:`easeInOut`},children:(0,k.jsx)(Hi,{size:e.size,color:e.color})},t))})}var J={window:`terminal-window`,windowActive:`ring-2 ring-primary ring-offset-2`,windowMaxWidth:`max-w-lg w-full`,header:`terminal-header`,headerWithTabs:`terminal-header flex justify-between items-center`,dotRed:`terminal-dot terminal-dot-red`,dotYellow:`terminal-dot terminal-dot-yellow`,dotGreen:`terminal-dot terminal-dot-green`,dots:`flex gap-2 items-center`,label:`ml-3 text-slate-400 text-xs`,tabs:`terminal-tabs`,tab:`terminal-tab`,tabActive:`terminal-tab active`,content:`terminal-content`,contentPadding:`terminal-content text-sm`,line:`terminal-line`,prefix:`terminal-prefix`,cursor:`cursor`,footer:`terminal-footer`,loader:`terminal-window w-full animate-pulse`,loaderBar:`h-4 bg-base-content/10 rounded`},Gi=e=>Number.isFinite(e)?Math.max(0,e):0,Ki=(e,t)=>Gi(t??e.delay??35),qi={threshold:.1},Ji=`terminal-window max-w-lg w-full my-4`,Yi=`380px`,Xi=`●`,Zi=`✓`,Qi=`⬢`,$i=`▲`,ea=`🧑‍🌾`,ta=`🐑`,na=[{lines:[{prefix:`$`,text:`pastoralist`,animate:!0},{text:`&nbsp;`},{text:`${ea} Pastoralist`,className:`text-success`},{text:`&nbsp;`},{text:`Updating overrides`,className:`text-base-content/70`,depth:0,isLast:!0,connectors:[]},{text:`${Xi} lodash@4.17.21`,className:`text-success`,depth:1,isLast:!1,connectors:[!1]},{text:`Security fix`,className:`text-base-content/70`,depth:2,isLast:!1,connectors:[!0,!0]},{text:`Used by: 1 package`,className:`text-base-content/70`,depth:2,isLast:!0,connectors:[!0,!1]},{text:`${Xi} 1 override applied`,className:`text-success`,depth:1,isLast:!0,connectors:[!1]},{text:`${Zi} 1 override tracked`,className:`text-success`},{text:`${Qi} 1 dependent documented`,className:`text-cyan-400`},{text:`<span class="text-error">■</span> 0 crit · <span class="text-warning">▲</span> 1 high · <span class="text-cyan-400">◆</span> 0 med · <span class="text-success">●</span> 0 low · <span class="text-cyan-400">▸</span> 1 tracked · ○ 0 removed · 10 scanned`,className:`text-base-content/50`},{text:`${Zi} The herd is safe! ${ta}`,className:`text-gold`}],pauseAfter:0}],ra=[{lines:[{prefix:`$`,text:`pastoralist`,animate:!0},{text:`&nbsp;`},{text:`${ea} Pastoralist`,className:`text-success`},{text:`&nbsp;`},{text:`Scanning overrides`,className:`text-base-content/70`,depth:0,isLast:!1,connectors:[]},{text:`${Xi} lodash@4.17.21`,className:`text-success`,depth:1,isLast:!1,connectors:[!0],delay:30},{text:`Reason: Security fix CVE-2021-23337`,className:`text-base-content/70`,depth:2,isLast:!1,connectors:[!0,!0],delay:20},{text:`Used by: my-app@1.0.0`,className:`text-base-content/70`,depth:2,isLast:!0,connectors:[!0,!1],delay:20},{text:`${$i} minimist@1.2.5`,className:`text-warning`,depth:1,isLast:!0,connectors:[!1],delay:30},{text:`Stale: no package depends on this override`,className:`text-base-content/70`,depth:2,isLast:!0,connectors:[!1,!1],delay:20},{text:`Cleanup`,className:`text-base-content/70`,depth:0,isLast:!0,connectors:[],delay:30},{text:`${Xi} Removed 1 stale override`,className:`text-success`,depth:1,isLast:!0,connectors:[!1],delay:20},{text:`<span class="text-error">■</span> 0 crit · <span class="text-warning">▲</span> 0 high · <span class="text-cyan-400">◆</span> 0 med · <span class="text-success">●</span> 0 low · <span class="text-cyan-400">▸</span> 1 tracked · ○ 1 removed · 10 scanned`,className:`text-base-content/50`,delay:40},{text:`${Zi} The herd is safe! ${ta}`,className:`text-gold`,delay:30}],pauseAfter:0}];`${ea}`,`${$i}`,`${Xi}`,`${Xi}`,`${Xi}`,`${Xi}`,`${Zi}`,`${Qi}`,`${Zi}${ta}`;var ia=({isActive:e=!1,height:t,minHeight:n,fileName:r,tabs:i,activeTab:a,onTabChange:o,hideHeader:s=!1,footer:c,footerClassName:l,children:u,className:d})=>{let f=e?J.windowActive:``,p=wt(d??J.window,`transition-shadow duration-300`,f),m=t||n?{height:t,minHeight:n}:void 0,h=i&&i.length>0,g=h?J.headerWithTabs:J.header,_=r??`terminal`;return(0,k.jsxs)(`div`,{className:p,style:m,children:[!s&&(0,k.jsxs)(`div`,{className:g,children:[(0,k.jsxs)(`div`,{className:J.dots,children:[(0,k.jsx)(`div`,{className:J.dotRed}),(0,k.jsx)(`div`,{className:J.dotYellow}),(0,k.jsx)(`div`,{className:J.dotGreen}),(0,k.jsx)(`span`,{className:J.label,children:_})]}),h&&(0,k.jsx)(`div`,{className:J.tabs,children:i.map(e=>{let t=e.id===a?J.tabActive:J.tab;return(0,k.jsx)(`button`,{onClick:()=>o?.(e.id),className:t,children:e.label},e.id)})})]}),u,c&&(0,k.jsx)(`div`,{className:wt(J.footer,l),children:c})]})},aa=(e,t,n)=>{let[r,i]=(0,y.useState)(``);return(0,y.useEffect)(()=>{if(!n){i(``);return}let a=r.length;if(a<e.length){let n=setTimeout(()=>{i(e.slice(0,a+1))},t);return()=>clearTimeout(n)}},[n,r,e,t]),{displayedText:r,isComplete:r.length===e.length&&e.length>0}},oa=(e,t,n)=>{let[r,i]=(0,y.useState)(!1);return(0,y.useEffect)(()=>{if(!e)return;let r=e.animate??!1,a=Ki(e,t);if(!r){let e=setTimeout(()=>{n()},a);return()=>clearTimeout(e)}let o=setTimeout(()=>{i(!0)},a);return()=>clearTimeout(o)},[e,n,t]),{isTyping:r,setIsTyping:i}},sa=({line:e})=>{let t=e.depth??0;if(t===0)return null;let n=(e.connectors??[]).slice(0,t-1).map((e,t)=>(0,k.jsx)(`span`,{className:`tree-connector ${e?`tree-connector-pipe`:`tree-connector-empty`}`},t)),r=e.isLast?`tree-connector-last`:`tree-connector-mid`;return(0,k.jsxs)(k.Fragment,{children:[n,(0,k.jsx)(`span`,{className:`tree-connector ${r}`})]})},ca=({visibleLines:e,isTyping:t,currentLine:n,displayedText:r,animateLines:i,reserveCursor:a})=>{let o=i?`terminal-line-enter`:``;return(0,k.jsxs)(k.Fragment,{children:[e.map((e,t)=>(0,k.jsxs)(`div`,{className:`${J.line} ${o} ${e.className??``}`,children:[e.prefix&&(0,k.jsx)(`span`,{className:J.prefix,children:e.prefix}),(0,k.jsx)(sa,{line:e}),(0,k.jsx)(`span`,{dangerouslySetInnerHTML:{__html:e.text}}),a&&(0,k.jsx)(`span`,{className:`${J.cursor} invisible !animate-none`})]},t)),t&&n&&(0,k.jsxs)(`div`,{className:`${J.line} ${n.className??``}`,children:[n.prefix&&(0,k.jsx)(`span`,{className:J.prefix,children:n.prefix}),(0,k.jsx)(sa,{line:n}),(0,k.jsx)(`span`,{dangerouslySetInnerHTML:{__html:r}}),(0,k.jsx)(`span`,{className:J.cursor})]})]})},la=({demos:e,lineProps:t})=>(0,k.jsxs)(`div`,{className:`${J.content} terminal-content-layered min-h-0 flex-1`,children:[e.map((e,t)=>(0,k.jsx)(`div`,{className:`terminal-content-sizer`,"aria-hidden":`true`,children:(0,k.jsx)(ca,{visibleLines:e.lines,isTyping:!1,currentLine:void 0,displayedText:``,animateLines:!1,reserveCursor:!0})},t)),(0,k.jsx)(`div`,{className:`terminal-content-output`,children:(0,k.jsx)(ca,{...t})})]}),ua=(e,t,n)=>{if(e&&!t)return n},da=({demos:e,loop:t=!0,typingSpeed:n=12,timing:r,startAnimation:i,shouldAnimate:a=!0,onComplete:o,hideHeader:s=!1,minHeight:c})=>{let[l,u]=(0,y.useState)(0),[d,f]=(0,y.useState)(0),[p,m]=(0,y.useState)([]),[h,g]=(0,y.useState)(!a),[_,v]=(0,y.useState)(!a),b=(0,y.useRef)(null),x=(0,y.useRef)(null);(0,y.useEffect)(()=>()=>{x.current&&clearTimeout(x.current)},[]),(0,y.useEffect)(()=>{if(!a){let t=e.flatMap(e=>e.lines);m(t),v(!0),o?.()}},[a,e,o]);let S=e[l],C=S?.lines[d];(0,y.useEffect)(()=>{if(i!==void 0){i&&!h&&g(!0);return}let e=new IntersectionObserver(e=>{e[0]?.isIntersecting&&!h&&g(!0)},qi),t=b.current;return t&&e.observe(t),()=>{t&&e.unobserve(t)}},[h,i]);let w=(0,y.useCallback)(()=>{f(0),m([])},[]),T=(0,y.useCallback)(()=>{let n=l===e.length-1;n&&t?(u(0),w()):n&&!t?(v(!0),o?.()):n||(u(l+1),w())},[l,e.length,t,w,o]),E=(0,y.useCallback)(()=>{let e=d===S.lines.length-1;if(C&&m(e=>e.concat(C)),e){let e=S.pauseAfter??2e3;x.current=setTimeout(T,e)}else f(d+1)},[d,S,T,C]),{isTyping:D,setIsTyping:O}=oa(ua(h,_,C),r,E),{displayedText:ee,isComplete:te}=aa(C?.text??``,n,D);(0,y.useEffect)(()=>{te&&D&&(O(!1),E())},[te,D,E,O]);let A=(0,k.jsx)(la,{demos:e,lineProps:{visibleLines:p,isTyping:D,currentLine:C,displayedText:ee,animateLines:a&&h}});return s?(0,k.jsx)(`div`,{ref:b,className:`bg-transparent`,children:A}):(0,k.jsx)(`div`,{ref:b,children:(0,k.jsx)(ia,{className:Ji,height:c,minHeight:c,children:A})})},fa=`pastoralist-hero-animation-seen`,pa=[`#ff0000`,`#ff8000`,`#ffff00`,`#00ff00`,`#0080ff`,`#8000ff`],ma=()=>sessionStorage.getItem(fa)===`true`,ha=e=>_({id:`hero`,initial:e?`done`:`terminalVisible`,states:{idle:{after:{500:`logoVisible`}},logoVisible:{after:{700:`textVisible`}},textVisible:{after:{400:`terminalVisible`}},terminalVisible:{on:{TERMINAL_DONE:`terminalComplete`}},terminalComplete:{after:{500:`rainbow`}},rainbow:{after:{700:`done`}},done:{}}}),ga=[.16,1,.3,1],_a=[0,.45,.78,1],va=[1,1.14,.98,1],ya=[0,12,-4,0],ba=[1,1.18,.96,1],xa={opacity:0,x:-18,scale:1},Sa={opacity:1,x:0,scale:1},Ca={opacity:1,x:0,scale:va},wa={opacity:0,scale:.75,rotate:-18},Ta={opacity:1,scale:1,rotate:0},Ea={opacity:1,rotate:ya,scale:ba},Da={duration:.4,ease:ga},Oa={duration:.62,ease:ga,times:_a},ka={duration:.2,ease:`easeOut`},Aa={duration:.72,ease:ga,times:_a},Y={section:`relative flex items-start justify-center px-4 md:px-8 pt-6 pb-16 md:pt-8 md:pb-20 overflow-hidden min-h-screen`,article:`max-w-2xl md:max-w-5xl w-full`,logoHeader:`text-center mb-10 md:mb-12`,logo:`mx-auto h-24 w-24 md:h-36 md:w-36`,main:`flex flex-col-reverse gap-10 lg:flex-row lg:items-center lg:gap-10 lg:justify-between`,aside:`mt-6 lg:mt-0 w-full text-left lg:flex-[1.05]`,terminalFrame:`relative mx-auto w-full max-w-lg lg:mx-0`,contentHeader:`text-center lg:max-w-2xl lg:flex-[0.95] lg:text-left`,h1:`text-3xl sm:text-4xl md:text-5xl lg:text-[3.35rem] font-black leading-[1.05] tracking-tight mb-8`,nav:`flex flex-col sm:flex-row items-center sm:items-stretch gap-4 sm:gap-5 justify-center lg:justify-start`,codeBlock:`flex h-12 w-full max-w-md items-center gap-3 rounded-2xl border border-base-content/10 bg-base-100/85 px-3 shadow-sm shadow-base-content/5 backdrop-blur sm:w-auto`,code:`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-[0.95rem] font-medium`},ja={logoAlt:`Pastoralist Logo`,headingStart:`Pastoralist`,headingMid:`tracks, documents, and cleans up your npm dependency overrides`,headingHighlight:`automatically`,emoji:`👍`,command:`npm install -g pastoralist`,docsSlug:`introduction`,buttonText:`Get Started`},Ma=[`idle`,`logoVisible`,`textVisible`,`terminalVisible`,`terminalComplete`,`rainbow`,`done`];function Na(e,t){let n=Ma.indexOf(t);return Ma.slice(n).some(t=>e.matches(t))}function Pa(e,t){return e?Ca:t?Sa:xa}function Fa(e,t){return e?Ea:t?Ta:wa}function Ia(e){return e?Oa:Da}function La(e){return e?Aa:ka}function Ra({showComplete:e}){let[t]=(0,y.useState)(()=>e||ma()),n=(0,y.useMemo)(()=>ha(t),[t]),[i,a]=v(n),o=(0,y.useRef)(null),c=`/pastoralist`,l=c.endsWith(`/`)?c:c+`/`,u=Na(i,`logoVisible`),d=Na(i,`textVisible`),f=Na(i,`terminalVisible`),p=Na(i,`terminalComplete`),m=Na(i,`rainbow`),h=i.matches(`rainbow`),g=Na(i,`done`),_=p,b=`inline-block ${m?`rainbow-text`:`text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.65),0_0_18px_rgba(0,0,0,0.35)]`} ${g?`[animation:gradient-shimmer_3.2s_ease-in-out_1.4s_infinite]`:``}`,x=Pa(h,p),S=Ia(h),C=Fa(h,_),w=La(h);return(0,y.useEffect)(()=>{let e=o.current;if(t||!m||!e)return;let n=e.getBoundingClientRect(),r={particleCount:100,spread:70,origin:{x:(n.left+n.width/2)/window.innerWidth,y:(n.top+n.height/2)/window.innerHeight},colors:pa};G(()=>import(`./confetti.module-75bydEUS.js`),[]).then(({default:e})=>e(r)).catch(()=>void 0)},[m,t]),(0,k.jsxs)(`section`,{id:`hero`,className:Y.section,children:[(0,k.jsx)(Va,{}),(0,k.jsx)(Wi,{}),(0,k.jsxs)(`article`,{className:Y.article,style:{position:`relative`,zIndex:1},children:[(0,k.jsx)(`header`,{className:Y.logoHeader,children:(0,k.jsx)(Vi,{maskSrc:`${l}pastoralist-logo.svg`,children:(0,k.jsx)(r.img,{src:`${l}pastoralist-logo.svg`,alt:ja.logoAlt,className:Y.logo,initial:!t&&{opacity:0,y:16,scale:.75},animate:u?{opacity:1,y:0,scale:1}:void 0,transition:{duration:.5,ease:ga}})})}),(0,k.jsxs)(`main`,{className:Y.main,children:[(0,k.jsx)(r.aside,{className:Y.aside,initial:!t&&{opacity:0,x:-32},animate:f?{opacity:1,x:0}:void 0,transition:{duration:.7,ease:ga},children:(0,k.jsxs)(`div`,{className:Y.terminalFrame,children:[(0,k.jsx)(`div`,{className:`pointer-events-none absolute inset-x-8 bottom-2 h-24 rounded-full bg-gradient-to-r from-sky-500/18 via-cyan-400/10 to-emerald-400/16 blur-3xl`,"aria-hidden":`true`}),(0,k.jsx)(da,{demos:ra,loop:!1,typingSpeed:18,startAnimation:f,shouldAnimate:!t,minHeight:Yi,onComplete:()=>{let e={type:`TERMINAL_DONE`};i.can(e)&&(a(e),sessionStorage.setItem(fa,`true`))}})]})}),(0,k.jsxs)(r.header,{className:Y.contentHeader,initial:!t&&{opacity:0,y:32},animate:d?{opacity:1,y:0}:void 0,transition:{duration:.7,ease:ga},children:[(0,k.jsxs)(`h1`,{className:Y.h1,children:[(0,k.jsx)(`span`,{className:`font-bold gradient-text`,children:ja.headingStart}),` `,ja.headingMid,(0,k.jsxs)(`span`,{className:`ml-2 inline-flex items-baseline gap-1 whitespace-nowrap align-baseline`,children:[(0,k.jsx)(r.span,{ref:o,className:b,initial:!t&&xa,animate:x,transition:S,"aria-hidden":!p,children:ja.headingHighlight}),(0,k.jsx)(r.span,{className:`inline-block origin-[50%_80%]`,initial:!t&&wa,animate:C,transition:w,"aria-hidden":!_,children:ja.emoji})]})]}),(0,k.jsxs)(`nav`,{className:Y.nav,children:[(0,k.jsx)(s,{to:`/docs/$slug/`,params:{slug:ja.docsSlug},preload:`intent`,children:(0,k.jsxs)(`button`,{className:`btn btn-lg btn-primary rounded-2xl whitespace-nowrap`,children:[ja.buttonText,(0,k.jsx)(Lt,{className:`size-4`})]})}),(0,k.jsxs)(`figure`,{className:Y.codeBlock,children:[(0,k.jsx)(`code`,{className:Y.code,children:ja.command}),(0,k.jsx)(Ci,{})]})]})]})]})]})]})}function za(){let e=Bi(),t=Tt()&&!e;return(0,k.jsx)(Ra,{showComplete:t},t?`static`:`interactive`)}var Ba=`polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 150%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)`;function Va(){return(0,k.jsxs)(`figure`,{className:`absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl`,"aria-hidden":`true`,children:[(0,k.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] block`,style:{clipPath:Ba}}),(0,k.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(100%)] sm:w-[72.1875rem] block`,style:{clipPath:Ba}})]})}var Ha=[`Tracks override dependencies`,`Documents security fixes with CVE references`,`Cleans up orphaned overrides`,`Works with npm, yarn, pnpm, and bun`],Ua={list:`mt-6 divide-y divide-base-content/10 border-y border-base-content/10 text-base-content/80`,item:`flex items-start gap-3 py-3`,icon:`check-icon mt-0.5`};function Wa({isVisible:e}){return(0,k.jsx)(`ul`,{className:Ua.list,children:Ha.map((t,n)=>(0,k.jsxs)(r.li,{className:Ua.item,initial:{opacity:0,x:-8},animate:e?{opacity:1,x:0}:{},transition:{duration:.3,delay:n*.15,ease:`easeOut`},children:[(0,k.jsx)(r.span,{className:Ua.icon,initial:{opacity:0,scale:.5},animate:e?{opacity:1,scale:1}:{},transition:{duration:.3,delay:n*.15,ease:`easeOut`},children:(0,k.jsx)(Rt,{className:`w-5 h-5`})}),(0,k.jsx)(`span`,{children:t})]},t))})}var Ga=[{id:`cli`,label:`CLI Output`},{id:`json`,label:`package.json`}],Ka=`{
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
}`;function qa({line:e}){let t=`${J.line} ${e.className??``}`,n=e.prefix?(0,k.jsx)(`span`,{className:J.prefix,children:e.prefix}):null,r={__html:e.text};return(0,k.jsxs)(`div`,{className:t,children:[n,(0,k.jsx)(sa,{line:e}),(0,k.jsx)(`span`,{dangerouslySetInnerHTML:r})]})}function Ja(){let e=na[0].lines.map((e,t)=>(0,k.jsx)(qa,{line:e},t));return(0,k.jsx)(`div`,{className:J.content,children:(0,k.jsx)(`div`,{className:`space-y-1`,children:e})})}function Ya({shouldAnimate:e,onComplete:t}){return e?(0,k.jsx)(da,{demos:na,loop:!1,typingSpeed:20,shouldAnimate:!0,onComplete:t,hideHeader:!0}):(0,k.jsx)(Ja,{})}function Xa(){return(0,k.jsx)(`div`,{className:J.content,children:(0,k.jsx)(y.Suspense,{fallback:(0,k.jsx)(`pre`,{className:`text-sm leading-relaxed text-base-content`,children:(0,k.jsx)(`code`,{children:Ka})}),children:(0,k.jsx)(Ur,{code:Ka,lang:`json`})})})}function Za({shouldAnimate:e=!1,onComplete:t=()=>void 0}){let[n,r]=(0,y.useState)(`cli`),i=n===`cli`?(0,k.jsx)(Ya,{shouldAnimate:e,onComplete:t}):(0,k.jsx)(Xa,{});return(0,k.jsx)(ia,{className:`${J.window} ${J.windowMaxWidth}`,tabs:Ga,activeTab:n,onTabChange:r,minHeight:`350px`,children:i})}var Qa=`pastoralist-codeblock-animation-seen`,$a=()=>sessionStorage.getItem(Qa)===`true`,X={section:`py-16 lg:py-24 bg-base-200/50 border-y border-base-content/10`,article:`lg:flex gap-10 items-center max-w-2xl md:max-w-5xl mx-auto px-4 transition-all duration-700 ease-out`,articleVisible:`opacity-100 translate-y-0`,articleHidden:`opacity-0 translate-y-8`,header:`lg:max-w-md flex flex-col justify-center`,h2:`text-3xl lg:text-4xl font-black`,description:`mt-6 text-lg text-base-content/80`,nav:`flex gap-4 mt-8`,aside:`flex-1 mt-8 lg:mt-0`},eo={headingStart:`Simple`,headingEnd:`Override Tracking`,description:`Pastoralist creates an appendix that documents why each override exists. Track which packages depend on each override, detect security fixes, and clean up stale overrides when they're no longer needed.`,learnMoreSlug:`introduction`,githubHref:`https://github.com/yowainwright/pastoralist`};function to({showComplete:e}){let[t,n]=(0,y.useState)(()=>e||$a()),{ref:r,isVisible:i}=zi({initialInView:e}),a=t||i;return(0,k.jsx)(`section`,{id:`features`,className:X.section,children:(0,k.jsxs)(`article`,{ref:r,className:`${X.article} ${a?X.articleVisible:X.articleHidden}`,children:[(0,k.jsxs)(`header`,{className:X.header,children:[(0,k.jsxs)(`h2`,{className:X.h2,children:[(0,k.jsx)(`span`,{className:`gradient-text`,children:eo.headingStart}),` `,eo.headingEnd]}),(0,k.jsx)(`p`,{className:X.description,children:eo.description}),(0,k.jsx)(Wa,{isVisible:a}),(0,k.jsxs)(`nav`,{className:X.nav,children:[(0,k.jsx)(s,{to:`/docs/$slug/`,params:{slug:eo.learnMoreSlug},preload:`intent`,className:`btn btn-lg btn-primary rounded-2xl`,children:`Learn More`}),(0,k.jsx)(`a`,{href:eo.githubHref,className:`btn btn-lg btn-ghost rounded-2xl`,children:`View on GitHub`})]})]}),(0,k.jsx)(`aside`,{className:X.aside,children:(0,k.jsx)(Za,{shouldAnimate:!t&&i,onComplete:()=>{n(!0),sessionStorage.setItem(Qa,`true`)}})})]})})}function no(){let e=Bi(),t=Tt()&&!e;return(0,k.jsx)(to,{showComplete:t},t?`static`:`interactive`)}var Z=[{title:`The Problem`,description:`Overrides exist but nobody knows why. Which packages depend on it?`},{title:`Run Pastoralist`,description:`Pastoralist scans your dependencies and documents your overrides.`},{title:`Automatic Documentation`,description:`Now you know why each override exists, what depends on it, and any associated CVEs.`}],ro=[`Undocumented overrides`,`Execute pastoralist`,`Pastoralist manages the rest`],io=5,Q=[`  "pastoralist": {`,`    "appendix": {`,`      "lodash@4.17.21": {`,`        "dependents": {`,`          "express": "^4.18.0"`,`        },`,`        "ledger": {`,`          "reason": "security",`,`          "cve": "CVE-2020-8203"`,`        }`,`      }`,`    }`,`  }`],ao=44+(io+Q.length)*16,oo=(io+Q.length)*16,so=`pastoralist`;Q.length;var co={base:`step cursor-pointer transition-all duration-200 text-base-content`,active:`step-primary [&::before]:!bg-gradient-to-b [&::before]:!from-blue-400 [&::before]:!to-blue-500 [&::before]:shadow-md [&::before]:shadow-blue-500/25 [&::before]:!text-white [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-29px)] [&::before]:!z-[999] [&::after]:!bg-blue-500`,inactive:`[&::before]:text-base-content [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-32px)] [&::before]:!z-[999] [&::after]:!bg-base-300`},lo={before:`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white [background:linear-gradient(to_bottom,var(--color-red-400),var(--color-red-500))] border-2 border-red-600 shadow-md shadow-red-500/25`,cli:`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white [background:linear-gradient(to_bottom,var(--color-blue-400),var(--color-blue-500))] border-2 border-blue-600 shadow-md shadow-blue-500/25`,after:`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white [background:linear-gradient(to_bottom,var(--color-green-400),var(--color-green-500))] border-2 border-green-600 shadow-md shadow-green-500/25`},uo=/"([^"]+)":/g,fo=/: "([^"]+)"/g,po=[`"pastoralist"`,`"appendix"`,`"lodash@`,`"dependents"`,`"express"`,`"ledger"`,`"reason"`,`"cve"`],mo=e=>po.some(t=>e.includes(t)),ho=e=>e.replace(uo,`<span class="text-primary">"$1"</span>:`).replace(fo,`: <span class="text-success">"$1"</span>`),go=({stepNumber:e,title:t,description:n,visible:r,showEmoji:i,verticalCenter:a})=>r?(0,k.jsx)(`div`,{className:`absolute z-10 w-64 right-4 ${a?`top-1/2 -translate-y-1/2`:`top-12`} animate-pop-in`,children:(0,k.jsxs)(`div`,{className:`bg-base-100/95 backdrop-blur-sm border-2 border-blue-600 rounded-lg shadow-xl shadow-blue-500/15 p-4`,children:[(0,k.jsxs)(`div`,{className:`flex items-center gap-2 mb-1`,children:[(0,k.jsx)(`span`,{className:`flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-b from-blue-400 to-blue-500 border-2 border-blue-600 text-white text-sm font-bold shadow-md shadow-blue-500/25`,children:e}),(0,k.jsx)(`span`,{className:`font-bold text-base-content`,children:t})]}),(0,k.jsxs)(`div`,{className:`text-sm text-base-content/70 ml-8`,children:[n,i&&(0,k.jsx)(`span`,{className:`inline-block ml-1 animate-bounce-once`,children:`⚡`})]})]})}):null,_o=({isActive:e})=>(0,k.jsx)(ia,{isActive:e,fileName:`package.json`,children:(0,k.jsxs)(`div`,{className:J.contentPadding,style:{height:`auto`},children:[(0,k.jsx)(`div`,{className:`${J.line} text-base-content/50`,children:`{`}),(0,k.jsxs)(`div`,{className:J.line,children:[`  `,(0,k.jsx)(`span`,{className:`text-primary`,children:`"overrides"`}),`: `,`{`]}),(0,k.jsxs)(`div`,{className:J.line,children:[`    `,(0,k.jsx)(`span`,{className:`text-primary`,children:`"lodash"`}),`:`,` `,(0,k.jsx)(`span`,{className:`text-success`,children:`"4.17.21"`})]}),(0,k.jsx)(`div`,{className:J.line,children:`  }`}),(0,k.jsx)(`div`,{className:`${J.line} text-base-content/50`,children:`}`})]})}),vo=({isActive:e,typedCommand:t,phase:n,showSpinner:r,showSuccess:i})=>{let a=n===`step2`;return(0,k.jsx)(ia,{isActive:e,children:(0,k.jsxs)(`div`,{className:`${J.contentPadding}`,style:{height:`auto`,padding:`0.75rem 1rem`},children:[(0,k.jsxs)(`div`,{className:J.line,children:[(0,k.jsx)(`span`,{className:J.prefix,children:`$`}),(0,k.jsx)(`span`,{children:t}),a&&(0,k.jsx)(`span`,{className:J.cursor})]}),r&&(0,k.jsxs)(`div`,{className:`${J.line} text-cyan-400`,children:[(0,k.jsx)(`span`,{className:`inline-block animate-spin mr-2`,children:`⠋`}),`Scanning overrides...`]}),i&&(0,k.jsx)(`div`,{className:`${J.line} text-success`,children:`└── The herd is safe! 🐑`})]})})},yo=({line:e,isAdded:t=!1,className:n})=>{let r=t?`terminal-line json-added`:`terminal-line`,i=n?`${r} ${n}`:r;if(!mo(e))return(0,k.jsx)(`div`,{className:i,children:e});let a=ho(e);return(0,k.jsx)(`div`,{className:i,dangerouslySetInnerHTML:{__html:a}})},bo=({isActive:e,appendixLines:t})=>{let n=Q.slice(0,t),r=Q.slice(t),i=t>0;return(0,k.jsx)(ia,{isActive:e,fileName:`package.json`,minHeight:`${ao}px`,children:(0,k.jsxs)(`div`,{className:J.contentPadding,style:{minHeight:`${oo}px`},children:[(0,k.jsx)(`div`,{className:`${J.line} text-base-content/50`,children:`{`}),(0,k.jsxs)(`div`,{className:J.line,children:[`  `,(0,k.jsx)(`span`,{className:`text-primary`,children:`"overrides"`}),`: `,`{`]}),(0,k.jsxs)(`div`,{className:J.line,children:[`    `,(0,k.jsx)(`span`,{className:`text-primary`,children:`"lodash"`}),`:`,` `,(0,k.jsx)(`span`,{className:`text-success`,children:`"4.17.21"`})]}),(0,k.jsxs)(`div`,{className:J.line,children:[`  }`,i&&`,`]}),n.map((e,t)=>(0,k.jsx)(yo,{line:e,isAdded:!0},t)),r.map((e,t)=>(0,k.jsx)(yo,{line:e,isAdded:!0,className:`invisible`},`hidden-${t}`)),(0,k.jsx)(`div`,{className:`${J.line} text-base-content/50`,children:`}`})]})})},xo=(e,t)=>e===3&&t===`complete`,So=(e,t,n)=>e>t||xo(t,n),Co=({activeStep:e,phase:t,onStepClick:n})=>(0,k.jsx)(`ul`,{className:`steps w-full`,children:ro.map((r,i)=>{let a=i+1,o=So(e,a,t),s=e>=a?co.active:co.inactive,c=o?`✓`:a;return(0,k.jsx)(`li`,{className:`${co.base} ${s}`,onClick:()=>n(a),"data-content":c,children:r},i)})});function wo(e,t){let[n,r]=(0,y.useState)(`idle`),[i,a]=(0,y.useState)(``),[o,s]=(0,y.useState)(!1),[c,l]=(0,y.useState)(!1),[u,d]=(0,y.useState)(0),[f,p]=(0,y.useState)(0),[m,h]=(0,y.useState)(!1),[g,_]=(0,y.useState)(!1),[v,b]=(0,y.useState)(!1),x=(0,y.useRef)(!1),S=(0,y.useRef)(null),C=(0,y.useRef)(null),w=(0,y.useCallback)(()=>{S.current&&=(clearInterval(S.current),null)},[]),T=(0,y.useCallback)(e=>{let n=e;S.current=setInterval(()=>{n<Q.length?(d(n+1),n++):(w(),r(`complete`),b(!0),t?.(),setTimeout(()=>{h(!0)},100))},25)},[w]),E=(0,y.useCallback)(()=>{r(`step2`),p(2);let e=0;S.current=setInterval(()=>{e<11?(a(so.slice(0,e+1)),e++):(w(),setTimeout(()=>{r(`checking`),s(!0),setTimeout(()=>{s(!1),l(!0),setTimeout(()=>{r(`step3`),p(3),T(0)},200)},350)},60))},10)},[w,T]),D=(0,y.useCallback)(()=>{w(),a(``),s(!1),l(!1),d(0),h(!1)},[w]),O=(0,y.useCallback)(()=>{D(),r(`step1`),p(1),setTimeout(()=>{E()},400)},[D,E]),ee=(0,y.useCallback)(()=>{let e=C.current;if(!g||!e)return;_(!1);let{phase:t,typedCommand:n,appendixLines:i}=e;if(C.current=null,t===`step2`&&n.length<11){let e=n.length;S.current=setInterval(()=>{e<11?(a(so.slice(0,e+1)),e++):(w(),setTimeout(()=>{r(`checking`),s(!0),setTimeout(()=>{s(!1),l(!0),setTimeout(()=>{r(`step3`),p(3),T(0)},200)},350)},60))},10)}else{if(!(t===`step3`&&i<Q.length))return;T(i)}},[g,w,T]),{ref:te}=Ri({threshold:.3,onChange:t=>{t&&e&&(x.current?g&&ee():(x.current=!0,O()))}});(0,y.useEffect)(()=>{!e&&!x.current&&(x.current=!0,r(`complete`),a(so),d(Q.length),p(3),b(!0),h(!0),l(!0))},[e]);let k=e=>{w(),C.current={phase:n,typedCommand:i,appendixLines:u},_(!0),b(!1),p(e);let t={1:`step1`,2:`step2`,3:`step3`}[e];t&&r(t)},A=e=>g?f===e:f>=e||v;return{containerRef:te,phase:n,typedCommand:i,showSpinner:o,showSuccess:c,appendixLines:u,activeStep:f,showLightning:m,showAllPopovers:v,isStep1Active:A(1),isStep2Active:A(2),isStep3Active:A(3),handleStepClick:k}}function To({shouldAnimate:e=!0,onComplete:t}){let{containerRef:n,phase:r,typedCommand:i,showSpinner:a,showSuccess:o,appendixLines:s,activeStep:c,showLightning:l,isStep1Active:u,isStep2Active:d,isStep3Active:f,handleStepClick:p}=wo(e,t);return(0,k.jsxs)(`div`,{ref:n,className:`flex flex-col gap-6`,children:[(0,k.jsx)(Co,{activeStep:c,phase:r,onStepClick:p}),(0,k.jsx)(`div`,{className:`h-6 w-px bg-primary/20 mx-auto`}),(0,k.jsxs)(`div`,{className:`grid md:grid-cols-2 gap-6 lg:gap-8`,children:[(0,k.jsxs)(`div`,{className:`flex flex-col gap-4`,children:[(0,k.jsxs)(`div`,{className:`relative flex flex-col`,children:[(0,k.jsx)(go,{stepNumber:1,title:Z[0].title,description:Z[0].description,visible:u}),(0,k.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,k.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Undocumented overrides`}),(0,k.jsx)(`span`,{className:lo.before,children:`Before`})]}),(0,k.jsx)(_o,{isActive:u})]}),(0,k.jsxs)(`div`,{className:`relative`,children:[(0,k.jsx)(go,{stepNumber:2,title:Z[1].title,description:Z[1].description,visible:d}),(0,k.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,k.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Execute the pastoralist cli`}),(0,k.jsx)(`span`,{className:lo.cli,children:`CLI`})]}),(0,k.jsx)(vo,{isActive:d,typedCommand:i,phase:r,showSpinner:a,showSuccess:o})]})]}),(0,k.jsxs)(`div`,{className:`relative flex flex-col`,children:[(0,k.jsx)(go,{stepNumber:3,title:Z[2].title,description:Z[2].description,visible:f,showEmoji:l,verticalCenter:!0}),(0,k.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,k.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Documented overrides`}),(0,k.jsx)(`span`,{className:lo.after,children:`After`})]}),(0,k.jsx)(bo,{isActive:f,appendixLines:s})]})]})]})}function Eo(){return(0,k.jsxs)(`div`,{className:`flex flex-col gap-6`,children:[(0,k.jsx)(`ul`,{className:`steps w-full`,children:ro.map((e,t)=>(0,k.jsx)(`li`,{className:`step cursor-pointer transition-all duration-200 text-base-content step-primary [&::before]:!bg-gradient-to-b [&::before]:!from-blue-400 [&::before]:!to-blue-500 [&::before]:shadow-md [&::before]:shadow-blue-500/25 [&::before]:!text-white [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-29px)] [&::before]:!z-[999] [&::after]:!bg-blue-500`,"data-content":`✓`,children:e},t))}),(0,k.jsx)(`div`,{className:`h-6 w-px bg-primary/20 mx-auto`}),(0,k.jsxs)(`div`,{className:`grid md:grid-cols-2 gap-6 lg:gap-8`,children:[(0,k.jsxs)(`div`,{className:`flex flex-col gap-4`,children:[(0,k.jsxs)(`div`,{className:`relative flex flex-col`,children:[(0,k.jsx)(go,{stepNumber:1,title:Z[0].title,description:Z[0].description,visible:!0}),(0,k.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,k.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Undocumented overrides`}),(0,k.jsx)(`span`,{className:`badge badge-lg text-white bg-gradient-to-b from-red-400 to-red-500 border-2 border-red-600 shadow-md shadow-red-500/25 p-2`,children:`Before`})]}),(0,k.jsx)(_o,{isActive:!0})]}),(0,k.jsxs)(`div`,{className:`relative`,children:[(0,k.jsx)(go,{stepNumber:2,title:Z[1].title,description:Z[1].description,visible:!0}),(0,k.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,k.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Execute the pastoralist cli`}),(0,k.jsx)(`span`,{className:`badge badge-lg text-white bg-gradient-to-b from-blue-400 to-blue-500 border-2 border-blue-600 shadow-md shadow-blue-500/25 p-2`,children:`CLI`})]}),(0,k.jsx)(vo,{isActive:!0,typedCommand:so,phase:`complete`,showSpinner:!1,showSuccess:!0})]})]}),(0,k.jsxs)(`div`,{className:`relative flex flex-col`,children:[(0,k.jsx)(go,{stepNumber:3,title:Z[2].title,description:Z[2].description,visible:!0,showEmoji:!0,verticalCenter:!0}),(0,k.jsxs)(`div`,{className:`flex items-center gap-2 mb-3`,children:[(0,k.jsx)(`span`,{className:`text-base-content/60 text-sm`,children:`Documented overrides`}),(0,k.jsx)(`span`,{className:`badge badge-lg text-white bg-gradient-to-b from-green-400 to-green-500 border-2 border-green-600 shadow-md shadow-green-500/25 p-2`,children:`After`})]}),(0,k.jsx)(bo,{isActive:!0,appendixLines:Q.length})]})]})]})}var Do=`pastoralist-transform-animation-seen`,Oo=()=>sessionStorage.getItem(Do)===`true`,ko=()=>sessionStorage.setItem(Do,`true`);function Ao({isStatic:e}){return e?(0,k.jsx)(Eo,{}):(0,k.jsx)(To,{shouldAnimate:!0,onComplete:ko})}var jo=`polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 150%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)`,Mo={section:`relative py-16 lg:py-24 overflow-hidden`,article:`max-w-2xl md:max-w-6xl mx-auto px-4`,header:`text-center mb-10 transition-all duration-700 ease-out`,headerVisible:`opacity-100 translate-y-0`,headerHidden:`opacity-0 translate-y-8`,h2:`text-3xl lg:text-4xl font-black text-base-content`,description:`mt-4 text-lg text-base-content/80 max-w-2xl mx-auto`},No={headingStart:`See the`,headingHighlight:`Transformation`,description:`Pastoralist reads your overrides and creates a detailed appendix documenting why each one exists, who depends on it, and any security context.`};function Po({showComplete:e}){let[t]=(0,y.useState)(()=>e||Oo()),{ref:n,isVisible:r}=zi({initialInView:e});return(0,k.jsxs)(`section`,{id:`demo`,className:Mo.section,children:[(0,k.jsx)(Io,{}),(0,k.jsxs)(`article`,{className:Mo.article,children:[(0,k.jsxs)(`header`,{ref:n,className:`${Mo.header} ${r?Mo.headerVisible:Mo.headerHidden}`,children:[(0,k.jsxs)(`h2`,{className:Mo.h2,children:[No.headingStart,` `,(0,k.jsx)(`span`,{className:`gradient-text`,children:No.headingHighlight})]}),(0,k.jsx)(`p`,{className:Mo.description,children:No.description})]}),(0,k.jsx)(Ao,{isStatic:t})]})]})}function Fo(){let e=Bi(),t=Tt()&&!e;return(0,k.jsx)(Po,{showComplete:t},t?`static`:`interactive`)}function Io(){return(0,k.jsxs)(`figure`,{className:`absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl`,"aria-hidden":`true`,children:[(0,k.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] block`,style:{clipPath:jo}}),(0,k.jsx)(`span`,{className:`hero-blob relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] sm:left-[calc(100%)] sm:w-[72.1875rem] block`,style:{clipPath:jo}})]})}var Lo=`get-started`,Ro={heading:`Ready to`,headingHighlight:`get started`,command:`npm install -g pastoralist`,buttonText:`Learn More`,docsSlug:`introduction`},$={section:`py-16 lg:py-24 border-t border-base-content/10`,article:`max-w-2xl md:max-w-6xl mx-auto px-4 text-center`,articleVisible:`animate-in fade-in slide-in-from-bottom-4 duration-700`,articleHidden:`opacity-0`,heading:`text-2xl lg:text-3xl font-black text-base-content mb-6`,nav:`flex flex-col justify-center items-center gap-4`,codeBlock:`flex h-12 w-fit items-center gap-3 rounded-2xl border border-base-content/10 bg-base-100/85 px-3 shadow-sm shadow-base-content/5 backdrop-blur`,code:`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-[0.95rem] font-medium`,button:`btn btn-lg btn-primary rounded-2xl`};function zo({id:e,showComplete:t}){let{ref:n,isVisible:r}=zi({initialInView:t}),i=`${$.article} ${r?$.articleVisible:$.articleHidden}`;return(0,k.jsx)(`section`,{id:e,className:$.section,children:(0,k.jsxs)(`article`,{ref:n,className:i,children:[(0,k.jsxs)(`h3`,{className:$.heading,children:[Ro.heading,` `,(0,k.jsx)(`span`,{className:`gradient-text`,children:Ro.headingHighlight}),`?`]}),(0,k.jsxs)(`nav`,{className:$.nav,children:[(0,k.jsxs)(`figure`,{className:$.codeBlock,children:[(0,k.jsx)(`code`,{className:$.code,children:Ro.command}),(0,k.jsx)(Ci,{})]}),(0,k.jsx)(s,{to:`/docs/$slug/`,params:{slug:Ro.docsSlug},preload:`intent`,children:(0,k.jsxs)(`button`,{className:$.button,children:[Ro.buttonText,(0,k.jsx)(Lt,{className:`size-4`})]})})]})]})})}function Bo({id:e=Lo}){let t=Bi(),n=Tt()&&!t;return(0,k.jsx)(zo,{id:e,showComplete:n},n?`static`:`interactive`)}function Vo(){return(0,k.jsxs)(k.Fragment,{children:[(0,k.jsx)(za,{}),(0,k.jsx)(no,{}),(0,k.jsx)(Fo,{}),(0,k.jsx)(Bo,{})]})}var Ho=d({component:()=>(0,k.jsx)(o,{})}),Uo=p({getParentRoute:()=>Ho,path:`/`,component:()=>(0,k.jsx)(Gn,{children:(0,k.jsx)(Vo,{})})}),Wo=p({getParentRoute:()=>Ho,path:`/docs/$slug`,component:()=>(0,k.jsx)(Wn,{children:(0,k.jsx)(fi,{})})}),Go=Ho.addChildren([Uo,Wo]),Ko=()=>c({routeTree:Go,basepath:`/pastoralist`,trailingSlash:`always`});function qo(){let e=document.getElementById(`root`);if(!e)throw Error(`Missing root element`);return e}var Jo=Ko(),Yo=qo(),Xo=Yo.dataset.prerendered===`true`,Zo=Xo?(0,k.jsx)(m,{router:Jo}):(0,k.jsx)(f,{router:Jo});function Qo(){return(0,y.useEffect)(()=>Et(Yo),[]),(0,k.jsx)(y.StrictMode,{children:(0,k.jsx)(Dt,{children:Zo})})}var $o=(0,k.jsx)(Qo,{});Xo?(0,M.hydrateRoot)(Yo,$o):(0,M.createRoot)(Yo).render($o);export{G as n,Ar as t};
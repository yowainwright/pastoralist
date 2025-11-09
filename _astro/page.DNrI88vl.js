const k="modulepreload",y=function(n){return"/pastoralist/"+n},g={},v=function(c,d,u){let l=Promise.resolve();if(d&&d.length>0){let r=function(t){return Promise.all(t.map(a=>Promise.resolve(a).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const e=document.querySelector("meta[property=csp-nonce]"),i=e?.nonce||e?.getAttribute("nonce");l=r(d.map(t=>{if(t=y(t),t in g)return;g[t]=!0;const a=t.endsWith(".css"),m=a?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${t}"]${m}`))return;const s=document.createElement("link");if(s.rel=a?"stylesheet":k,a||(s.as="script"),s.crossOrigin="",s.href=t,i&&s.setAttribute("nonce",i),document.head.appendChild(s),a)return new Promise((f,b)=>{s.addEventListener("load",f),s.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${t}`)))})}))}function o(r){const e=new Event("vite:preloadError",{cancelable:!0});if(e.payload=r,window.dispatchEvent(e),!e.defaultPrevented)throw r}return l.then(r=>{for(const e of r||[])e.status==="rejected"&&o(e.reason);return c().catch(o)})},h=()=>document.querySelectorAll("pre.mermaid").length>0;h()?(console.log("[astro-mermaid] Mermaid diagrams detected, loading mermaid.js..."),v(()=>import("./mermaid.core.z3BBIh_V.js").then(n=>n.bD),[]).then(async({default:n})=>{const c=[];if(c&&c.length>0){console.log("[astro-mermaid] Registering",c.length,"icon packs");const o=c.map(r=>({name:r.name,loader:new Function("return "+r.loader)()}));await n.registerIconPacks(o)}const d={startOnLoad:!1,theme:"default"},u={light:"default",dark:"dark"};async function l(){console.log("[astro-mermaid] Initializing mermaid diagrams...");const o=document.querySelectorAll("pre.mermaid");if(console.log("[astro-mermaid] Found",o.length,"mermaid diagrams"),o.length===0)return;let r=d.theme;{const e=document.documentElement.getAttribute("data-theme"),i=document.body.getAttribute("data-theme");r=u[e||i]||d.theme,console.log("[astro-mermaid] Using theme:",r,"from",e?"html":"body")}n.initialize({...d,theme:r,gitGraph:{mainBranchName:"main",showCommitLabel:!0,showBranches:!0,rotateCommitLabel:!0}});for(const e of o){if(e.hasAttribute("data-processed"))continue;e.hasAttribute("data-diagram")||e.setAttribute("data-diagram",e.textContent||"");const i=e.getAttribute("data-diagram")||"",t="mermaid-"+Math.random().toString(36).slice(2,11);console.log("[astro-mermaid] Rendering diagram:",t);try{const a=document.getElementById(t);a&&a.remove();const{svg:m}=await n.render(t,i);e.innerHTML=m,e.setAttribute("data-processed","true"),console.log("[astro-mermaid] Successfully rendered diagram:",t)}catch(a){console.error("[astro-mermaid] Mermaid rendering error for diagram:",t,a),e.innerHTML=`<div style="color: red; padding: 1rem; border: 1px solid red; border-radius: 0.5rem;">
            <strong>Error rendering diagram:</strong><br/>
            ${a.message||"Unknown error"}
          </div>`,e.setAttribute("data-processed","true")}}}l();{const o=new MutationObserver(r=>{for(const e of r)e.type==="attributes"&&e.attributeName==="data-theme"&&(document.querySelectorAll("pre.mermaid[data-processed]").forEach(i=>{i.removeAttribute("data-processed")}),l())});o.observe(document.documentElement,{attributes:!0,attributeFilter:["data-theme"]}),o.observe(document.body,{attributes:!0,attributeFilter:["data-theme"]})}document.addEventListener("astro:after-swap",()=>{h()&&l()})}).catch(n=>{console.error("[astro-mermaid] Failed to load mermaid:",n)})):console.log("[astro-mermaid] No mermaid diagrams found on this page, skipping mermaid.js load");const p=document.createElement("style");p.textContent=`
            /* Prevent layout shifts by setting minimum height */
            pre.mermaid {
              display: flex;
              justify-content: center;
              align-items: center;
              margin: 2rem 0;
              padding: 1rem;
              background-color: transparent;
              border: none;
              overflow: auto;
              min-height: 200px; /* Prevent layout shift */
              position: relative;
            }
            
            /* Loading state with skeleton loader */
            pre.mermaid:not([data-processed]) {
              background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
              background-size: 200% 100%;
              animation: shimmer 1.5s infinite;
            }
            
            /* Dark mode skeleton loader */
            [data-theme="dark"] pre.mermaid:not([data-processed]) {
              background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
              background-size: 200% 100%;
            }
            
            @keyframes shimmer {
              0% {
                background-position: -200% 0;
              }
              100% {
                background-position: 200% 0;
              }
            }
            
            /* Show processed diagrams with smooth transition */
            pre.mermaid[data-processed] {
              animation: none;
              background: transparent;
              min-height: auto; /* Allow natural height after render */
            }
            
            /* Ensure responsive sizing for mermaid SVGs */
            pre.mermaid svg {
              max-width: 100%;
              height: auto;
            }
            
            /* Optional: Add subtle background for better visibility */
            @media (prefers-color-scheme: dark) {
              pre.mermaid[data-processed] {
                background-color: rgba(255, 255, 255, 0.02);
                border-radius: 0.5rem;
              }
            }
            
            @media (prefers-color-scheme: light) {
              pre.mermaid[data-processed] {
                background-color: rgba(0, 0, 0, 0.02);
                border-radius: 0.5rem;
              }
            }
            
            /* Respect user's color scheme preference */
            [data-theme="dark"] pre.mermaid[data-processed] {
              background-color: rgba(255, 255, 255, 0.02);
              border-radius: 0.5rem;
            }
            
            [data-theme="light"] pre.mermaid[data-processed] {
              background-color: rgba(0, 0, 0, 0.02);
              border-radius: 0.5rem;
            }
          `;document.head.appendChild(p);export{v as _};

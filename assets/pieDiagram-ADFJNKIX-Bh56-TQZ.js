import{a as s,g as U,s as H,b as K,c as Q,x as V,v as Z,l as w,d as j,H as q,M as J,O as X,P as G,Q as Y,f as ee,B as te,R as ae,K as re}from"./mermaid-GIUnprOp.js";import{p as ie}from"./chunk-4BX2VUAB-JNdmXYpc.js";import{p as se}from"./treemap-KMMF4GRG-WqCjEEml.js";import"./react-vendor-C6WxKkic.js";import"./_baseUniq-DOAIVzMX.js";import"./_basePickBy-u-yMkPrR.js";import"./clone-BKWTxzKr.js";var le=re.pie,D={sections:new Map,showData:!1},g=D.sections,C=D.showData,oe=structuredClone(le),ne=s(()=>structuredClone(oe),"getConfig"),ce=s(()=>{g=new Map,C=D.showData,te()},"clear"),de=s(({label:e,value:a})=>{if(a<0)throw new Error(`"${e}" has invalid value: ${a}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);g.has(e)||(g.set(e,a),w.debug(`added new section: ${e}, with value: ${a}`))},"addSection"),pe=s(()=>g,"getSections"),ge=s(e=>{C=e},"setShowData"),ue=s(()=>C,"getShowData"),M={getConfig:ne,clear:ce,setDiagramTitle:Z,getDiagramTitle:V,setAccTitle:Q,getAccTitle:K,setAccDescription:H,getAccDescription:U,addSection:de,getSections:pe,setShowData:ge,getShowData:ue},fe=s((e,a)=>{ie(e,a),a.setShowData(e.showData),e.sections.map(a.addSection)},"populateDb"),he={parse:s(async e=>{const a=await se("pie",e);w.debug(a),fe(a,M)},"parse")},me=s(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,"getStyles"),ve=me,Se=s(e=>{const a=[...e.values()].reduce((r,l)=>r+l,0),$=[...e.entries()].map(([r,l])=>({label:r,value:l})).filter(r=>r.value/a*100>=1).sort((r,l)=>l.value-r.value);return ae().value(r=>r.value)($)},"createPieArcs"),xe=s((e,a,$,y)=>{w.debug(`rendering pie chart
`+e);const r=y.db,l=j(),T=q(r.getConfig(),l.pie),A=40,o=18,d=4,c=450,u=c,f=J(a),n=f.append("g");n.attr("transform","translate("+u/2+","+c/2+")");const{themeVariables:i}=l;let[b]=X(i.pieOuterStrokeWidth);b??=2;const E=T.textPosition,p=Math.min(u,c)/2-A,O=G().innerRadius(0).outerRadius(p),P=G().innerRadius(p*E).outerRadius(p*E);n.append("circle").attr("cx",0).attr("cy",0).attr("r",p+b/2).attr("class","pieOuterCircle");const h=r.getSections(),R=Se(h),W=[i.pie1,i.pie2,i.pie3,i.pie4,i.pie5,i.pie6,i.pie7,i.pie8,i.pie9,i.pie10,i.pie11,i.pie12];let m=0;h.forEach(t=>{m+=t});const _=R.filter(t=>(t.data.value/m*100).toFixed(0)!=="0"),v=Y(W);n.selectAll("mySlices").data(_).enter().append("path").attr("d",O).attr("fill",t=>v(t.data.label)).attr("class","pieCircle"),n.selectAll("mySlices").data(_).enter().append("text").text(t=>(t.data.value/m*100).toFixed(0)+"%").attr("transform",t=>"translate("+P.centroid(t)+")").style("text-anchor","middle").attr("class","slice"),n.append("text").text(r.getDiagramTitle()).attr("x",0).attr("y",-400/2).attr("class","pieTitleText");const k=[...h.entries()].map(([t,x])=>({label:t,value:x})),S=n.selectAll(".legend").data(k).enter().append("g").attr("class","legend").attr("transform",(t,x)=>{const F=o+d,L=F*k.length/2,N=12*o,B=x*F-L;return"translate("+N+","+B+")"});S.append("rect").attr("width",o).attr("height",o).style("fill",t=>v(t.label)).style("stroke",t=>v(t.label)),S.append("text").attr("x",o+d).attr("y",o-d).text(t=>r.getShowData()?`${t.label} [${t.value}]`:t.label);const I=Math.max(...S.selectAll("text").nodes().map(t=>t?.getBoundingClientRect().width??0)),z=u+A+o+d+I;f.attr("viewBox",`0 0 ${z} ${c}`),ee(f,c,z,T.useMaxWidth)},"draw"),we={draw:xe},Ee={parser:he,db:M,renderer:we,styles:ve};export{Ee as diagram};

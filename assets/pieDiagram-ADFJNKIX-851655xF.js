import{_ as s,g as U,s as Q,a as V,b as Z,v as j,t as q,l as w,c as H,G as J,L as K,N as X,O as G,P as Y,e as ee,A as te,Q as ae,I as re}from"./mermaid-CEea_onn.js";import{p as ie}from"./chunk-4BX2VUAB-CdVeoU0U.js";import{p as se}from"./treemap-KMMF4GRG-OG5M3vlh.js";import"./react-vendor-Cgg2GOmP.js";import"./_baseUniq-C4fKDTYZ.js";import"./_basePickBy-BoyVjwpg.js";import"./clone-B1qVJIex.js";var le=re.pie,D={sections:new Map,showData:!1},g=D.sections,C=D.showData,oe=structuredClone(le),ne=s(()=>structuredClone(oe),"getConfig"),ce=s(()=>{g=new Map,C=D.showData,te()},"clear"),de=s(({label:e,value:a})=>{if(a<0)throw new Error(`"${e}" has invalid value: ${a}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);g.has(e)||(g.set(e,a),w.debug(`added new section: ${e}, with value: ${a}`))},"addSection"),pe=s(()=>g,"getSections"),ge=s(e=>{C=e},"setShowData"),ue=s(()=>C,"getShowData"),O={getConfig:ne,clear:ce,setDiagramTitle:q,getDiagramTitle:j,setAccTitle:Z,getAccTitle:V,setAccDescription:Q,getAccDescription:U,addSection:de,getSections:pe,setShowData:ge,getShowData:ue},fe=s((e,a)=>{ie(e,a),a.setShowData(e.showData),e.sections.map(a.addSection)},"populateDb"),he={parse:s(async e=>{const a=await se("pie",e);w.debug(a),fe(a,O)},"parse")},me=s(e=>`
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
`+e);const r=y.db,l=H(),T=J(r.getConfig(),l.pie),A=40,o=18,d=4,c=450,u=c,f=K(a),n=f.append("g");n.attr("transform","translate("+u/2+","+c/2+")");const{themeVariables:i}=l;let[b]=X(i.pieOuterStrokeWidth);b??=2;const _=T.textPosition,p=Math.min(u,c)/2-A,P=G().innerRadius(0).outerRadius(p),W=G().innerRadius(p*_).outerRadius(p*_);n.append("circle").attr("cx",0).attr("cy",0).attr("r",p+b/2).attr("class","pieOuterCircle");const h=r.getSections(),I=Se(h),L=[i.pie1,i.pie2,i.pie3,i.pie4,i.pie5,i.pie6,i.pie7,i.pie8,i.pie9,i.pie10,i.pie11,i.pie12];let m=0;h.forEach(t=>{m+=t});const E=I.filter(t=>(t.data.value/m*100).toFixed(0)!=="0"),v=Y(L);n.selectAll("mySlices").data(E).enter().append("path").attr("d",P).attr("fill",t=>v(t.data.label)).attr("class","pieCircle"),n.selectAll("mySlices").data(E).enter().append("text").text(t=>(t.data.value/m*100).toFixed(0)+"%").attr("transform",t=>"translate("+W.centroid(t)+")").style("text-anchor","middle").attr("class","slice"),n.append("text").text(r.getDiagramTitle()).attr("x",0).attr("y",-400/2).attr("class","pieTitleText");const k=[...h.entries()].map(([t,x])=>({label:t,value:x})),S=n.selectAll(".legend").data(k).enter().append("g").attr("class","legend").attr("transform",(t,x)=>{const F=o+d,N=F*k.length/2,R=12*o,B=x*F-N;return"translate("+R+","+B+")"});S.append("rect").attr("width",o).attr("height",o).style("fill",t=>v(t.label)).style("stroke",t=>v(t.label)),S.append("text").attr("x",o+d).attr("y",o-d).text(t=>r.getShowData()?`${t.label} [${t.value}]`:t.label);const M=Math.max(...S.selectAll("text").nodes().map(t=>t?.getBoundingClientRect().width??0)),z=u+A+o+d+M;f.attr("viewBox",`0 0 ${z} ${c}`),ee(f,c,z,T.useMaxWidth)},"draw"),we={draw:xe},_e={parser:he,db:O,renderer:we,styles:ve};export{_e as diagram};

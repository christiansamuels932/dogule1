import{i as ie,h as at,l as rt,a as it,d as lt,u as ot,b as st,c as ut}from"./httpClient-DjHBoopU.js";import{listKunden as dt}from"./kunden-C6XP8HlP.js";import{listHunde as ct}from"./hunde-Dx71O5cK.js";import{l as ht}from"./kurse-CXcv8my8.js";import{l as pt}from"./trainer-CMPfZSZF.js";import{c as Y,d as M,a as ae,e as z,f as mt,b}from"./components-CDhMLcLx.js";import{r as ft}from"./client-D-w1T_rz.js";import"./index-CgsI8pK7.js";const we="zertifikate",kt=["kundeId","hundId","kursId","ausstellungsdatum","kursOrtSnapshot","kursInhaltTheorieSnapshot","kursInhaltPraxisSnapshot","trainer1NameSnapshot"],je={code:"",kundeId:"",hundId:"",kursId:"",kundeNameSnapshot:"",kundeGeschlechtSnapshot:"",hundNameSnapshot:"",hundRasseSnapshot:"",hundGeschlechtSnapshot:"",kursTitelSnapshot:"",kursDatumSnapshot:"",kursOrtSnapshot:"",kursInhaltTheorieSnapshot:"",kursInhaltPraxisSnapshot:"",ausstellungsdatum:"",trainer1NameSnapshot:"",trainer1TitelSnapshot:"",trainer2NameSnapshot:"",trainer2TitelSnapshot:"",bemerkungen:""},Qe=(e={})=>({...je,...e}),ge=(e={})=>({id:"",createdAt:"",updatedAt:"",...je,...e});let ne=0;const St=(e=[])=>{const n=(Array.isArray(e)?e:[]).reduce((t,a)=>{const r=((a==null?void 0:a.code)||"").match(/Z-(\d+)/);if(!r)return t;const o=Number.parseInt(r[1],10);return Number.isFinite(o)&&o>t?o:t},0);return ne=Math.max(ne,n),ne+=1,`Z-${String(ne).padStart(3,"0")}`};function Ve(e={}){if(!(e.trainer1TitelSnapshot||"").toString().trim()){const t=new Error("TRAINER_TITEL_REQUIRED");throw t.code="TRAINER_TITEL_REQUIRED",t}const n=kt.filter(t=>!(e[t]||"").toString().trim());if(n.length){const t=new Error("Zertifikat enthält fehlende Pflichtfelder");throw t.code="ZERTIFIKAT_REQUIRED",t.missing=n,t}if((e.trainer2NameSnapshot||"").toString().trim()&&!(e.trainer2TitelSnapshot||"").toString().trim()){const t=new Error("TRAINER_TITEL_REQUIRED");throw t.code="TRAINER_TITEL_REQUIRED",t}}async function Te(e){return ie()?at("zertifikate"):(await rt(we,e)).map(ge)}async function We(e,n){return ie()?it("zertifikate",e):(await Te(n)).find(a=>a.id===e)||null}async function bt(e={},n){const t=Qe(e);if(!t.code){const r=await Te(n);t.code=St(r)}if(Ve(t),ie())return st("zertifikate",t);const a=await ut(we,t,n);return ge(a)}async function wt(e,n={},t){if(ie())return lt("zertifikate",e,n);const a=await ot(we,e,Qe(n),t);return a&&Ve(a),a?ge(a):null}const gt=new URL(""+new URL("zertifikat_bg_a4_300dpi-BNHHMhv3.png",import.meta.url).href,import.meta.url).href,X={textColor:"#232323",minScale:.85,blocks:{participantLine1:{x:18,y:33.2,w:64,h:3,fontSize:11.5,align:"center"},kundeName:{x:18,y:34,w:64,h:5,fontSize:17.5,weight:700,align:"center",color:"#2f5ea8"},participantLine3:{x:18,y:37,w:64,h:3,fontSize:11.5,align:"center"},hundLine:{x:18,y:38.4,w:64,h:3.5,fontSize:11.8,weight:700,align:"center",color:"#2f5ea8"},kursTitelTop:{x:18,y:22.4,w:64,h:4,fontSize:22.8,weight:700,align:"center",color:"#2f5ea8"},kursTeilnahmeSatz:{x:16,y:39.7,w:68,h:4,fontSize:11.5,align:"center"},kursTheorie:{x:19.2,y:46.8,w:36,h:12,fontSize:10.8,lineHeight:1.35,maxLines:6},kursPraxis:{x:53.7,y:46.8,w:36,h:12,fontSize:10.8,lineHeight:1.35,maxLines:6},gratulationSatz:{x:16,y:56.2,w:68,h:3,fontSize:11.5,align:"center"},ausstellungsdatum:{x:18,y:57.9,w:64,h:3,fontSize:10.8,align:"center"},trainer1Name:{x:13.9,y:60.2,w:25,h:3,fontSize:12,weight:700,align:"center"},trainer1Titel:{x:13.9,y:63,w:25,h:3,fontSize:10.5,align:"center"},trainer2Name:{x:60.5,y:60.2,w:25,h:3,fontSize:12,weight:700,align:"center"},trainer2Titel:{x:60.5,y:63,w:25,h:3,fontSize:10.5,align:"center"},zertifikatId:{x:4,y:96.5,w:92,h:2.2,fontSize:8.5,align:"center",color:"#ffffff",opacity:.8}}},Tt=["code","kundeNameSnapshot","hundNameSnapshot","hundRasseSnapshot","hundGeschlechtSnapshot","kursTitelSnapshot","kursDatumSnapshot","kursOrtSnapshot","kursInhaltTheorieSnapshot","kursInhaltPraxisSnapshot","ausstellungsdatum","trainer1NameSnapshot","trainer1TitelSnapshot"];function C(e=""){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function yt(e){const n=String(e||"").trim().toLowerCase();return n||""}function It(e){const n=yt(e);return n==="weiblich"?"Hundeführerin":n==="männlich"?"Hundeführer":"Hundeführerin"}function Ye(e={}){const n=Tt.filter(t=>!(e[t]||"").toString().trim());return(e.trainer2NameSnapshot||"").toString().trim()&&((e.trainer2TitelSnapshot||"").toString().trim()||n.push("trainer2TitelSnapshot")),n}function vt(e={}){const n=e.kundeNameSnapshot||"—",t=Et([e.hundRasseSnapshot,e.hundGeschlechtSnapshot,e.hundNameSnapshot]),a=e.kursTitelSnapshot||"—",r=It(e.kundeGeschlechtSnapshot),o=Ae(e.kursInhaltTheorieSnapshot),s=Ae(e.kursInhaltPraxisSnapshot),i=zt(e.ausstellungsdatum);return`<!doctype html>
  <html lang="de">
    <head>
      <meta charset="utf-8" />
      <title>Zertifikat_${C(e.code||"")}.pdf</title>
      <style>
        @page { size: A4; margin: 0; }
        * { box-sizing: border-box; }
        body {
          font-family: "Times New Roman", Georgia, serif;
          color: ${X.textColor};
          margin: 0;
          background: #ffffff;
        }
        .page {
          position: relative;
          width: 210mm;
          height: 297mm;
          background: url("${gt}") no-repeat center top;
          background-size: cover;
        }
        .text-block {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          white-space: normal;
          word-break: normal;
          overflow-wrap: break-word;
          overflow: hidden;
        }
        .text-left {
          justify-content: flex-start;
          text-align: left;
        }
        .kurs-sentence span[data-inline] {
          font-weight: 700;
        }
        .kurs-list {
          position: absolute;
          margin: 0;
          padding: 0 0 0 14px;
          list-style: disc;
          white-space: normal;
          word-break: normal;
          overflow-wrap: break-word;
          overflow: hidden;
        }
        .kurs-list li {
          margin: 0;
          padding: 0;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="text-block" data-fit="text" style="${v("participantLine1")}">
          ${C("Hiermit bestätigen wir, dass")}
        </div>
        <div class="text-block" data-fit="text" style="${v("kundeName")}">
          ${C(n)}
        </div>
        <div class="text-block" data-fit="text" style="${v("participantLine3")}">
          ${C("mit dem")}
        </div>
        <div class="text-block" data-fit="text" style="${v("hundLine")}">
          ${C(t||"—")}
        </div>
        <div class="text-block" data-fit="inline" style="${v("kursTitelTop")}">
          <span data-inline>${C(a)}</span>
        </div>
        <div class="text-block" data-fit="text" style="${v("kursTeilnahmeSatz")}">
          ${C(`am Kurs "${a}" erfolgreich teilgenommen hat.`)}
        </div>
        <ul class="kurs-list" data-fit="list" style="${v("kursTheorie",!0)}">
          ${Be(o,X.blocks.kursTheorie.maxLines)}
        </ul>
        <ul class="kurs-list" data-fit="list" style="${v("kursPraxis",!0)}">
          ${Be(s,X.blocks.kursPraxis.maxLines)}
        </ul>
        <div class="text-block" data-fit="text" style="${v("gratulationSatz")}">
          ${C(`Wir gratulieren der ${r} zu dieser Leistung und danken für das Engagement.`)}
        </div>
        <div class="text-block" data-fit="text" style="${v("ausstellungsdatum")}">
          ${C(`Döttingen, ${i}`)}
        </div>
        <div class="text-block" data-fit="text" style="${v("trainer1Name")}">
          ${C(e.trainer1NameSnapshot||"—")}
        </div>
        <div class="text-block" data-fit="text" style="${v("trainer1Titel")}">
          ${C(e.trainer1TitelSnapshot||"")}
        </div>
        <div class="text-block" data-fit="text" style="${v("trainer2Name")}">
          ${C(e.trainer2NameSnapshot||"")}
        </div>
        <div class="text-block" data-fit="text" style="${v("trainer2Titel")}">
          ${C(e.trainer2TitelSnapshot||"")}
        </div>
        <div class="text-block" data-fit="text" style="${v("zertifikatId")}">
          ${C(`Zertifikat-ID: ${e.id||"—"}`)}
        </div>
      </div>
      <script>
        const minScale = ${X.minScale};
        const fitNodes = Array.from(document.querySelectorAll("[data-fit]"));

        const setFontSize = (node, size) => {
          node.style.fontSize = size + "px";
        };

        const truncateText = (node) => {
          const fullText = node.dataset.fullText || node.textContent || "";
          node.dataset.fullText = fullText;
          let low = 0;
          let high = fullText.length;
          let best = fullText;
          while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const candidate = fullText.slice(0, mid).trim() + (mid < fullText.length ? "…" : "");
            node.textContent = candidate;
            if (node.scrollHeight <= node.clientHeight + 1) {
              best = candidate;
              low = mid + 1;
            } else {
              high = mid - 1;
            }
          }
          node.textContent = best;
        };

        const truncateInline = (node) => {
          const target = node.querySelector("[data-inline]");
          if (!target) {
            truncateText(node);
            return;
          }
          const fullText = target.dataset.fullText || target.textContent || "";
          target.dataset.fullText = fullText;
          let low = 0;
          let high = fullText.length;
          let best = fullText;
          while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const candidate = fullText.slice(0, mid).trim() + (mid < fullText.length ? "…" : "");
            target.textContent = candidate;
            if (node.scrollHeight <= node.clientHeight + 1) {
              best = candidate;
              low = mid + 1;
            } else {
              high = mid - 1;
            }
          }
          target.textContent = best;
        };

        const truncateList = (node) => {
          const items = Array.from(node.querySelectorAll("li"));
          if (!items.length) return;
          while (node.scrollHeight > node.clientHeight + 1 && items.length > 1) {
            const last = items.pop();
            last?.remove();
          }
          const lastItem = items[items.length - 1];
          if (lastItem && node.scrollHeight > node.clientHeight + 1) {
            const fullText = lastItem.dataset.fullText || lastItem.textContent || "";
            lastItem.dataset.fullText = fullText;
            let low = 0;
            let high = fullText.length;
            let best = fullText;
            while (low <= high) {
              const mid = Math.floor((low + high) / 2);
              const candidate = fullText.slice(0, mid).trim() + (mid < fullText.length ? "…" : "");
              lastItem.textContent = candidate;
              if (node.scrollHeight <= node.clientHeight + 1) {
                best = candidate;
                low = mid + 1;
              } else {
                high = mid - 1;
              }
            }
            lastItem.textContent = best;
          }
        };

        const fitNode = (node) => {
          const baseSize = parseFloat(getComputedStyle(node).fontSize);
          const minSize = baseSize * minScale;
          let size = baseSize;
          while (node.scrollHeight > node.clientHeight + 1 && size > minSize + 0.1) {
            size -= baseSize * 0.03;
            setFontSize(node, size);
          }
          if (node.scrollHeight > node.clientHeight + 1) {
            const type = node.dataset.fit;
            if (type === "inline") truncateInline(node);
            else if (type === "list") truncateList(node);
            else truncateText(node);
          }
        };

        const runFit = () => {
          fitNodes.forEach((node) => fitNode(node));
        };

        window.addEventListener("load", () => {
          runFit();
          setTimeout(runFit, 100);
        });
      <\/script>
    </body>
  </html>`}function Ct(e={}){const n=Ye(e);if(n.length){const i=new Error("Missing certificate fields");throw i.missing=n,i}const t=vt(e),a=new Blob([t],{type:"text/html;charset=utf-8"}),r=URL.createObjectURL(a),o=window.open(r,"_blank");if(!o){const i=new Error("Popup blocked");throw i.code="POPUP_BLOCKED",i}o.focus();const s=()=>{URL.revokeObjectURL(r)};o.addEventListener("load",()=>{try{window.setTimeout(()=>{o.print()},300)}finally{window.setTimeout(s,1e3)}})}function Ae(e=""){return String(e||"").split(/\r?\n/).map(n=>n.trim()).filter(Boolean)}function Et(e=[]){return e.map(n=>String(n||"").trim()).filter(Boolean).join(" · ")}function zt(e){if(!e)return"—";const n=new Date(e);if(Number.isNaN(n.getTime()))return String(e);const t=String(n.getDate()).padStart(2,"0"),a=String(n.getMonth()+1).padStart(2,"0"),r=String(n.getFullYear());return`${t}.${a}.${r}`}function Be(e=[],n=6){const t=(Array.isArray(e)?e:[]).map(r=>r.trim()).filter(Boolean),a=t.slice(0,n);return t.length>n&&a.length&&(a[a.length-1]=`${a[a.length-1]}…`),a.map(r=>`<li>${C(r)}</li>`).join("")}function v(e,n=!1){const t=X.blocks[e],a=t.weight||400,r=t.lineHeight||1.2,o=[`left:${t.x}%`,`top:${t.y}%`,`width:${t.w}%`,`height:${t.h}%`,`font-size:${t.fontSize}pt`,`font-weight:${a}`,`line-height:${r}`];return n&&o.push("text-align:left"),t.color&&o.push(`color:${t.color}`),t.opacity!==void 0&&o.push(`opacity:${t.opacity}`),o.join(";")}function Wt(e,n={}){var s,i;if(!e)return;e.innerHTML="",(s=e.scrollTo)==null||s.call(e,{top:0,behavior:"auto"});const{mode:t,detailId:a}=Lt(n==null?void 0:n.segments),r=document.createElement("section");r.className="dogule-section zertifikate-section";const o=document.createElement("h1");o.textContent="Zertifikate",o.tabIndex=-1,r.appendChild(o),t==="list"?(r.appendChild(Y({title:"Übersicht",subtitle:"",level:2})),He(r)):t==="create"?(r.appendChild(Y({title:"Zertifikat erstellen",subtitle:"",level:2})),Je(r)):t==="detail"?(r.appendChild(Y({title:"Zertifikat",subtitle:"Details",level:2})),Nt(r,a)):t==="edit"?(r.appendChild(Y({title:"Zertifikat bearbeiten",subtitle:"",level:2})),Mt(r,a)):(r.appendChild(Y({title:"Übersicht",subtitle:"",level:2})),He(r)),e.appendChild(r),(i=o.focus)==null||i.call(o)}function Lt(e=[]){const n=Array.isArray(e)?e.filter(Boolean):[];return n.length?n[0]==="new"?{mode:"create",detailId:null}:n[1]==="edit"?{mode:"edit",detailId:n[0]||null}:{mode:"detail",detailId:n[0]||null}:{mode:"list",detailId:null}}function xt(){const e=typeof window<"u"&&window.location.hash||"",n=e.indexOf("?");return n===-1?new URLSearchParams:new URLSearchParams(e.slice(n+1))}async function He(e){const n=document.createElement("div");n.className="module-actions";const t=M({label:"Zertifikat erstellen",variant:"primary",onClick:()=>{window.location.hash="#/zertifikate/new"}});n.appendChild(t),e.appendChild(n);const a=ae({eyebrow:"",title:"Zertifikate",body:"",footer:""}),r=a.querySelector(".ui-card")||a.firstElementChild,o=r.querySelector(".ui-card__body");o.innerHTML="";const s=document.createElement("div");s.className="zertifikate-export-status",o.appendChild(s),o.appendChild(z("Lade Zertifikate...",{variant:"info",role:"status"})),e.appendChild(r);let i=[];try{i=await Te()}catch(c){console.error("[ZERTIFIKATE_LIST_FAIL]",c),o.innerHTML="",o.appendChild(z("Fehler beim Laden der Daten.",{variant:"warn",role:"alert"}));return}if(!Array.isArray(i)||!i.length){o.innerHTML="";const c=mt("Keine Zertifikate vorhanden.","");o.appendChild(c);return}o.innerHTML="";const u=document.createElement("div");u.className="kunden-list-scroll";const S=document.createElement("table");S.className="kunden-list-table";const m=document.createElement("thead"),f=document.createElement("tr");["Code","Kunde","Hund","Kurs","Kursdatum","Ausstellungsdatum"].forEach(c=>{const p=document.createElement("th");p.textContent=c,f.appendChild(p)}),m.appendChild(f);const T=document.createElement("tbody");i.forEach(c=>{const p=document.createElement("tr");p.addEventListener("click",E=>{var y;(y=E.target)!=null&&y.closest("a")||(window.location.hash=`#/zertifikate/${c.id}`)}),p.appendChild(G(c.code||"–",!0,c.id)),p.appendChild(G(c.kundeNameSnapshot||"–")),p.appendChild(G(c.hundNameSnapshot||"–")),p.appendChild(G(c.kursTitelSnapshot||"–")),p.appendChild(G(c.kursDatumSnapshot||"–")),p.appendChild(G(c.ausstellungsdatum||"–")),T.appendChild(p)}),S.append(m,T),u.appendChild(S),o.appendChild(u)}function G(e,n=!1,t=""){const a=document.createElement("td");if(n){const r=document.createElement("a");r.href=`#/zertifikate/${t}`,r.textContent=e||"–",a.appendChild(r)}else a.textContent=e||"–";return a}async function Nt(e,n){const t=Ge("Stammdaten"),a=t==null?void 0:t.querySelector(".ui-card__body"),r=Ge("Aktionen"),o=r==null?void 0:r.querySelector(".ui-card__body"),s=document.createElement("div");s.className="module-actions";const i=document.createElement("div");if(i.className="zertifikate-export-status",o&&(o.innerHTML="",o.append(s,i)),a&&(a.innerHTML="",a.appendChild(z("Lade Zertifikat...",{variant:"info",role:"status"}))),t&&e.appendChild(t),r&&e.appendChild(r),!n){a&&(a.innerHTML="",a.appendChild(z("Keine Zertifikat-ID angegeben.",{variant:"warn",role:"alert"}))),s.append(M({label:"Zur Übersicht",variant:"quiet",onClick:()=>{window.location.hash="#/zertifikate"}}));return}let u=null;try{u=await We(n)}catch(c){console.error("[ZERTIFIKATE_DETAIL_LOAD_FAIL]",c),a&&(a.innerHTML="",a.appendChild(z("Fehler beim Laden der Daten.",{variant:"warn",role:"alert"}))),s.append(M({label:"Zur Übersicht",variant:"quiet",onClick:()=>{window.location.hash="#/zertifikate"}}));return}if(!u){a&&(a.innerHTML="",a.appendChild(z("Zertifikat nicht gefunden.",{variant:"warn",role:"alert"}))),s.append(M({label:"Zur Übersicht",variant:"quiet",onClick:()=>{window.location.hash="#/zertifikate"}}));return}const S=e.querySelector(".ui-section__subtitle");if(S&&(S.textContent=u.code||"Details",S.hidden=!S.textContent),a){a.innerHTML="";const c=[{label:"ID",value:u.id},{label:"Code",value:u.code},{label:"Kunde",value:et(u.kundeNameSnapshot,u.kundeGeschlechtSnapshot)},{label:"Kunde Geschlecht",value:re(u.kundeGeschlechtSnapshot)},{label:"Hund",value:u.hundNameSnapshot},{label:"Hund Rasse",value:u.hundRasseSnapshot},{label:"Hund Geschlecht",value:re(u.hundGeschlechtSnapshot)},{label:"Kurs",value:u.kursTitelSnapshot},{label:"Kurs Datum",value:u.kursDatumSnapshot},{label:"Kurs Ort",value:u.kursOrtSnapshot},{label:"Kursinhalt Theorie",value:u.kursInhaltTheorieSnapshot},{label:"Kursinhalt Praxis",value:u.kursInhaltPraxisSnapshot},{label:"Trainer 1",value:ee(u.trainer1NameSnapshot,u.trainer1TitelSnapshot)},{label:"Trainer 2",value:ee(u.trainer2NameSnapshot,u.trainer2TitelSnapshot)},{label:"Ausstellungsdatum",value:u.ausstellungsdatum},{label:"Bemerkungen",value:u.bemerkungen},{label:"Erstellt am",value:Ue(u.createdAt)},{label:"Aktualisiert am",value:Ue(u.updatedAt)}];a.appendChild(Kt(c))}const m=M({label:"Bearbeiten",variant:"secondary"});m.type="button",m.addEventListener("click",()=>{window.confirm("Achtung: Bearbeiten überschreibt die gespeicherten Snapshot-Daten. Fortfahren?")&&(window.location.hash=`#/zertifikate/${u.id}/edit`)});const f=M({label:"PDF export",variant:"secondary"});f.type="button",f.disabled=!1,f.addEventListener("click",()=>{i.innerHTML="",i.appendChild(z("PDF wird vorbereitet...",{variant:"info",role:"status"}));try{const c=Ye(u);if(c.length){i.appendChild(z(`PDF kann nicht erstellt werden. Fehlende Felder: ${c.join(", ")}.`,{variant:"warn",role:"alert"}));return}Ct(u)}catch(c){const p=(c==null?void 0:c.code)==="POPUP_BLOCKED"?"PDF-Fenster wurde blockiert. Bitte Pop-ups erlauben.":"PDF-Generierung fehlgeschlagen.";i.appendChild(z(p,{variant:"warn",role:"alert"})),console.error("[ZERTIFIKAT_PDF_FAIL]",c)}});const T=M({label:"Zur Übersicht",variant:"quiet",onClick:()=>{window.location.hash="#/zertifikate"}});s.append(m,f,T)}function J(e,n=[]){const t=document.createElement("div"),a=document.createElement("h3");a.textContent=e,t.appendChild(a);const r=document.createElement("dl");return r.className="zertifikate-detail-list",n.forEach(([o,s])=>{const i=document.createElement("dt");i.textContent=o;const u=document.createElement("dd");u.textContent=s||"–",r.append(i,u)}),t.appendChild(r),t}async function Je(e,{mode:n="create",existing:t=null}={}){var xe,Ne,Me,_e,$e,De,Re,qe;const a=ae({eyebrow:"",title:"Zertifikat erstellen",body:"",footer:""}),r=a.querySelector(".ui-card")||a.firstElementChild,o=r.querySelector(".ui-card__body");o.innerHTML="";const s=document.createElement("div");s.className="zertifikate-form-status",o.appendChild(s);const i=document.createElement("form");if(i.noValidate=!0,i.className="zertifikate-form",i.id="zertifikate-create-form",o.appendChild(i),n==="edit"&&t){const d=b({id:"zertifikate-id",label:"Zertifikat-ID",control:"input",type:"text",value:t.id||"",required:!1}),k=d.querySelector("input");k.name="zertifikatId",k.disabled=!0,(xe=d.querySelector(".ui-form-row__hint"))==null||xe.classList.add("sr-only"),i.appendChild(d);const I=b({id:"zertifikate-code",label:"Code",control:"input",type:"text",value:t.code||"",required:!1}),h=I.querySelector("input");h.name="code",h.disabled=!0,(Ne=I.querySelector(".ui-form-row__hint"))==null||Ne.classList.add("sr-only"),i.appendChild(I)}const u=ae({eyebrow:"",title:"Vorschau (Snapshot)",body:"",footer:""}),S=u.querySelector(".ui-card")||u.firstElementChild,m=S.querySelector(".ui-card__body"),[f,T,c,p]=await Promise.all([dt().catch(()=>[]),ct().catch(()=>[]),ht().catch(()=>[]),pt().catch(()=>[])]),E=xt(),y={kundeId:(t==null?void 0:t.kundeId)||E.get("kundeId")||"",hundId:(t==null?void 0:t.hundId)||E.get("hundId")||"",kursId:(t==null?void 0:t.kursId)||E.get("kursId")||"",kursDatumSnapshot:(t==null?void 0:t.kursDatumSnapshot)||E.get("kursDatumSnapshot")||"",kursOrtSnapshot:(t==null?void 0:t.kursOrtSnapshot)||E.get("kursOrtSnapshot")||"Vorhard Döttingen"},l={},L=b({id:"zertifikate-kunde-search",label:"Kunde suchen",control:"input",type:"search",placeholder:"Name, Code oder E-Mail",required:!1}),x=L.querySelector("input");x.name="kundeSearch",(Me=L.querySelector(".ui-form-row__hint"))==null||Me.classList.add("sr-only"),i.appendChild(L);const N=b({id:"zertifikate-kunde",label:"Kunde*",control:"select",required:!0,options:Fe(f,y.kundeId,"")}),_=N.querySelector("select");_.name="kundeId",l.kundeId={input:_,hint:N.querySelector(".ui-form-row__hint")},i.appendChild(N);const g=b({id:"zertifikate-hund",label:"Hund*",control:"select",required:!0,options:Pe(T,y.kundeId,y.hundId)}),U=g.querySelector("select");U.name="hundId",l.hundId={input:U,hint:g.querySelector(".ui-form-row__hint")},i.appendChild(g);const q=b({id:"zertifikate-kurs",label:"Kurs*",control:"select",required:!0,options:Rt(c,y.kursId)}),j=q.querySelector("select");j.name="kursId",l.kursId={input:j,hint:q.querySelector(".ui-form-row__hint")},i.appendChild(q);const A=b({id:"zertifikate-kurs-datum",label:"Kurs Datum*",control:"input",type:"date",required:!0}),B=A.querySelector("input");B.name="kursDatumSnapshot",B.value=y.kursDatumSnapshot,l.kursDatumSnapshot={input:B,hint:A.querySelector(".ui-form-row__hint")},i.appendChild(A);const H=b({id:"zertifikate-kurs-ort",label:"Kurs Ort*",control:"input",type:"text",required:!0,value:y.kursOrtSnapshot}),Q=H.querySelector("input");Q.name="kursOrtSnapshot",l.kursOrtSnapshot={input:Q,hint:H.querySelector(".ui-form-row__hint")},i.appendChild(H);const K=b({id:"zertifikate-trainer1",label:"Trainer 1*",control:"select",required:!0,options:Ze(p,"")}),V=K.querySelector("select");V.name="trainer1Id",l.trainer1Id={input:V,hint:K.querySelector(".ui-form-row__hint")},i.appendChild(K);const O=b({id:"zertifikate-trainer1-mode",label:"Trainer 1 manuell",control:"input",type:"checkbox"}),W=O.querySelector("input");W.name="trainer1Manual",(_e=O.querySelector(".ui-form-row__hint"))==null||_e.classList.add("sr-only"),l.trainer1Manual={input:W,hint:null},i.appendChild(O);const F=b({id:"zertifikate-trainer1-name",label:"Trainer 1 Name*",control:"input",type:"text",placeholder:"z. B. Martina Frei"}),P=F.querySelector("input");P.name="trainer1NameManual",P.disabled=!0,l.trainer1NameManual={input:P,hint:F.querySelector(".ui-form-row__hint")},i.appendChild(F);const Z=b({id:"zertifikate-trainer1-titel",label:"Trainer 1 Titel",control:"input",type:"text",placeholder:"z. B. Dipl. Hundetrainer:in"}),le=Z.querySelector("input");le.name="trainer1TitelManual",le.disabled=!0,($e=Z.querySelector(".ui-form-row__hint"))==null||$e.classList.add("sr-only"),l.trainer1TitelManual={input:le,hint:null},i.appendChild(Z);const oe=b({id:"zertifikate-trainer2",label:"Trainer 2",control:"select",required:!1,options:Ze(p,"")}),ye=oe.querySelector("select");ye.name="trainer2Id",l.trainer2Id={input:ye,hint:oe.querySelector(".ui-form-row__hint")},i.appendChild(oe);const se=b({id:"zertifikate-trainer2-mode",label:"Trainer 2 manuell",control:"input",type:"checkbox"}),Ie=se.querySelector("input");Ie.name="trainer2Manual",(De=se.querySelector(".ui-form-row__hint"))==null||De.classList.add("sr-only"),l.trainer2Manual={input:Ie,hint:null},i.appendChild(se);const ue=b({id:"zertifikate-trainer2-name",label:"Trainer 2 Name",control:"input",type:"text",placeholder:"z. B. Jonas Graf"}),de=ue.querySelector("input");de.name="trainer2NameManual",de.disabled=!0,(Re=ue.querySelector(".ui-form-row__hint"))==null||Re.classList.add("sr-only"),l.trainer2NameManual={input:de,hint:null},i.appendChild(ue);const ce=b({id:"zertifikate-trainer2-titel",label:"Trainer 2 Titel",control:"input",type:"text",placeholder:"z. B. Dipl. Hundetrainer:in"}),he=ce.querySelector("input");he.name="trainer2TitelManual",he.disabled=!0,(qe=ce.querySelector(".ui-form-row__hint"))==null||qe.classList.add("sr-only"),l.trainer2TitelManual={input:he,hint:null},i.appendChild(ce);const pe=b({id:"zertifikate-ausstellungsdatum",label:"Ausstellungsdatum*",control:"input",type:"date",required:!0}),me=pe.querySelector("input");me.name="ausstellungsdatum",me.value=(t==null?void 0:t.ausstellungsdatum)||Ot(),l.ausstellungsdatum={input:me,hint:pe.querySelector(".ui-form-row__hint")},i.appendChild(pe);const fe=b({id:"zertifikate-bemerkungen",label:"Bemerkungen",control:"textarea",required:!1}),ke=fe.querySelector("textarea");ke.name="bemerkungen",ke.value=(t==null?void 0:t.bemerkungen)||"",l.bemerkungen={input:ke,hint:fe.querySelector(".ui-form-row__hint")},i.appendChild(fe);const ve=r.querySelector(".ui-card__footer"),Se=document.createElement("div");Se.className="module-actions";const $=M({label:n==="edit"?"Speichern":"Erstellen",variant:"primary"});$.type="button",$.setAttribute("form",i.id);const tt=M({label:"Abbrechen",variant:"quiet",onClick:()=>{window.location.hash="#/zertifikate"}});Se.append($,tt),ve.innerHTML="",ve.appendChild(Se);const D=()=>{const d=Ke(l,{kunden:f,hunde:T,kurse:c,trainer:p});m.innerHTML="",m.appendChild(J("Kunde",[["Name",et(d.kundeNameSnapshot,d.kundeGeschlechtSnapshot)],["Geschlecht",re(d.kundeGeschlechtSnapshot)]])),m.appendChild(J("Hund",[["Name",d.hundNameSnapshot||"–"],["Rasse",d.hundRasseSnapshot||"–"],["Geschlecht",re(d.hundGeschlechtSnapshot)]])),m.appendChild(J("Kurs",[["Titel",d.kursTitelSnapshot||"–"],["Datum",d.kursDatumSnapshot||"–"],["Ort",d.kursOrtSnapshot||"–"]])),m.appendChild(J("Trainer",[["Trainer 1",ee(d.trainer1NameSnapshot,d.trainer1TitelSnapshot)],["Trainer 2",ee(d.trainer2NameSnapshot,d.trainer2TitelSnapshot)]])),m.appendChild(J("Ausstellung",[["Ausstellungsdatum",d.ausstellungsdatum||"–"],["Bemerkungen",d.bemerkungen||"–"]]))},te=(d,k,I,h)=>{const w=!!d.input.checked;k.input.disabled=w,I.input.disabled=!w,h.input.disabled=!w,w?k.input.value="":(I.input.value="",h.input.value="")};l.trainer1Manual.input.addEventListener("change",()=>{te(l.trainer1Manual,l.trainer1Id,l.trainer1NameManual,l.trainer1TitelManual),D()}),l.trainer2Manual.input.addEventListener("change",()=>{te(l.trainer2Manual,l.trainer2Id,l.trainer2NameManual,l.trainer2TitelManual),D()});const Ce=()=>{var h;const d=l.kundeId.input.value||"",k=l.hundId.input.value||"",I=Pe(T,d,k);Oe(l.hundId.input,I,k),l.hundId.input.value||(l.hundId.input.value=((h=I.find(w=>w.value))==null?void 0:h.value)||"")},Ee=()=>{const d=(x.value||"").trim().toLowerCase(),k=l.kundeId.input.value||"",I=Fe(f,k,d);Oe(l.kundeId.input,I,k)};x.addEventListener("input",()=>{Ee()});const ze=()=>{const d=c.find(k=>k.id===l.kursId.input.value)||null;d&&!l.kursDatumSnapshot.input.value&&(l.kursDatumSnapshot.input.value=d.date||""),d&&l.kursOrtSnapshot.input.value==="Vorhard Döttingen"&&(l.kursOrtSnapshot.input.value=d.ort||d.location||l.kursOrtSnapshot.input.value)};l.kundeId.input.addEventListener("change",()=>{Ce(),D()}),l.kursId.input.addEventListener("change",()=>{ze(),D()}),[l.hundId,l.kursId,l.kursDatumSnapshot,l.kursOrtSnapshot,l.trainer1Id,l.trainer2Id,l.ausstellungsdatum].forEach(d=>{d.input.addEventListener("change",D)}),[l.trainer1NameManual,l.trainer1TitelManual,l.trainer2NameManual,l.trainer2TitelManual].forEach(d=>{d.input.addEventListener("input",D)}),l.bemerkungen.input.addEventListener("input",D),Ee(),ze(),te(l.trainer1Manual,l.trainer1Id,l.trainer1NameManual,l.trainer1TitelManual),te(l.trainer2Manual,l.trainer2Id,l.trainer2NameManual,l.trainer2TitelManual),Ce(),D();const Le=async d=>{d!=null&&d.preventDefault&&d.preventDefault(),s.innerHTML="";const k=$t(l),I=_t(k,{kurse:c,trainer:p});if(Dt(l,I),Object.keys(I).length){const h=Object.values(I).filter(Boolean).join(" "),w=h?`Bitte prüfen: ${h}`:"Bitte prüfe die Pflichtfelder.";s.appendChild(z(w,{variant:"warn",role:"alert"}));return}$.disabled=!0,$.textContent=n==="edit"?"Speichere ...":"Erstelle ...";try{const h=Ke(l,{kunden:f,hunde:T,kurse:c,trainer:p}),w={code:(t==null?void 0:t.code)||"",kundeId:k.kundeId,hundId:k.hundId,kursId:k.kursId,kundeNameSnapshot:h.kundeNameSnapshot,kundeGeschlechtSnapshot:h.kundeGeschlechtSnapshot,hundNameSnapshot:h.hundNameSnapshot,hundRasseSnapshot:h.hundRasseSnapshot,hundGeschlechtSnapshot:h.hundGeschlechtSnapshot,kursTitelSnapshot:h.kursTitelSnapshot,kursDatumSnapshot:k.kursDatumSnapshot,kursOrtSnapshot:k.kursOrtSnapshot,kursInhaltTheorieSnapshot:h.kursInhaltTheorieSnapshot,kursInhaltPraxisSnapshot:h.kursInhaltPraxisSnapshot,ausstellungsdatum:k.ausstellungsdatum,trainer1NameSnapshot:h.trainer1NameSnapshot,trainer1TitelSnapshot:h.trainer1TitelSnapshot,trainer2NameSnapshot:h.trainer2NameSnapshot,trainer2TitelSnapshot:h.trainer2TitelSnapshot,bemerkungen:k.bemerkungen};if(n==="edit")await wt(t.id,w),window.location.hash=`#/zertifikate/${t.id}`;else{const R=await bt(w);if(!(R!=null&&R.id))throw new Error("create_failed");try{const be=f.find(nt=>nt.id===w.kundeId)||{};await ft({eventType:"certificate_delivery",zertifikatId:R.id,kundeId:w.kundeId,hundId:w.hundId,recipientEmail:be.email||""})}catch(be){console.warn("[ZERTIFIKAT_AUTOMATION_SKIP]",be)}window.location.hash=`#/zertifikate/${R.id}`}}catch(h){console.error("[ZERTIFIKAT_CREATE_FAIL]",h);const w=Array.isArray(h==null?void 0:h.missing)?h.missing.join(", "):"",R=(h==null?void 0:h.code)==="TRAINER_TITEL_REQUIRED"?"Trainer-Titel fehlt. Bitte Titel ergänzen.":w?`Zertifikat konnte nicht erstellt werden. Fehlende Felder: ${w}.`:"Zertifikat konnte nicht erstellt werden.";s.appendChild(z(R,{variant:"warn",role:"alert"})),$.disabled=!1,$.textContent=n==="edit"?"Speichern":"Erstellen"}};i.addEventListener("submit",Le),$.addEventListener("click",Le),e.appendChild(r),e.appendChild(S)}async function Mt(e,n){const t=z("Achtung: Änderungen überschreiben die gespeicherten Snapshot-Daten.",{variant:"warn",role:"alert"});e.appendChild(t);const a=await We(n);if(!a){e.appendChild(z("Zertifikat nicht gefunden.",{variant:"warn",role:"alert"}));return}const r=document.createElement("div");e.appendChild(r),await Je(r,{mode:"edit",existing:a})}function Ke(e,{kunden:n=[],hunde:t=[],kurse:a=[],trainer:r=[]}={}){var T,c,p,E,y,l,L,x,N,_;const o=n.find(g=>g.id===e.kundeId.input.value)||null,s=t.find(g=>g.id===e.hundId.input.value)||null,i=a.find(g=>g.id===e.kursId.input.value)||null,u=!!((c=(T=e.trainer1Manual)==null?void 0:T.input)!=null&&c.checked),S=!!((E=(p=e.trainer2Manual)==null?void 0:p.input)!=null&&E.checked),m=u?null:r.find(g=>g.id===e.trainer1Id.input.value)||null,f=S?null:r.find(g=>g.id===e.trainer2Id.input.value)||null;return{kundeNameSnapshot:Xe(o),kundeGeschlechtSnapshot:(o==null?void 0:o.geschlecht)||"",hundNameSnapshot:(s==null?void 0:s.name)||"",hundRasseSnapshot:(s==null?void 0:s.rasse)||"",hundGeschlechtSnapshot:(s==null?void 0:s.geschlecht)||"",kursTitelSnapshot:(i==null?void 0:i.title)||"",kursDatumSnapshot:((L=(l=(y=e.kursDatumSnapshot)==null?void 0:y.input)==null?void 0:l.value)==null?void 0:L.trim())||(i==null?void 0:i.date)||"",kursOrtSnapshot:((_=(N=(x=e.kursOrtSnapshot)==null?void 0:x.input)==null?void 0:N.value)==null?void 0:_.trim())||(i==null?void 0:i.ort)||(i==null?void 0:i.location)||"",kursInhaltTheorieSnapshot:((i==null?void 0:i.inhaltTheorie)||"").trim(),kursInhaltPraxisSnapshot:((i==null?void 0:i.inhaltPraxis)||"").trim(),ausstellungsdatum:e.ausstellungsdatum.input.value||"",trainer1NameSnapshot:u?e.trainer1NameManual.input.value.trim():(m==null?void 0:m.name)||"",trainer1TitelSnapshot:u?e.trainer1TitelManual.input.value.trim():(m==null?void 0:m.titel)||"",trainer2NameSnapshot:S?e.trainer2NameManual.input.value.trim()||null:(f==null?void 0:f.name)||null,trainer2TitelSnapshot:S?e.trainer2TitelManual.input.value.trim()||null:(f==null?void 0:f.titel)||null,bemerkungen:e.bemerkungen.input.value||""}}function _t(e={},{kurse:n=[],trainer:t=[]}={}){const a={};e.kundeId||(a.kundeId="Bitte Kunde auswählen."),e.hundId||(a.hundId="Bitte Hund auswählen."),e.kursId||(a.kursId="Bitte Kurs auswählen."),e.kursDatumSnapshot||(a.kursDatumSnapshot="Bitte Kurs Datum angeben."),e.kursOrtSnapshot||(a.kursOrtSnapshot="Bitte Kurs Ort angeben.");const r=Array.isArray(n)?n.find(i=>i.id===e.kursId):null,o=((r==null?void 0:r.inhaltTheorie)||"").trim(),s=((r==null?void 0:r.inhaltPraxis)||"").trim();if(e.kursId&&!o&&(a.kursInhaltTheorieSnapshot="Kursinhalt Theorie fehlt. Bitte Kurs aktualisieren."),e.kursId&&!s&&(a.kursInhaltPraxisSnapshot="Kursinhalt Praxis fehlt. Bitte Kurs aktualisieren."),e.trainer1Manual)e.trainer1NameManual||(a.trainer1NameManual="Bitte Trainername eingeben."),e.trainer1TitelManual||(a.trainer1TitelManual="Trainer-Titel erforderlich.");else if(!e.trainer1Id)a.trainer1Id="Bitte Trainer auswählen.";else{const i=Array.isArray(t)&&e.trainer1Id?t.find(u=>u.id===e.trainer1Id):null;i!=null&&i.titel||(a.trainer1Id="Trainer-Titel fehlt. Bitte Trainer ergänzen.")}if(e.trainer2Manual)e.trainer2NameManual&&!e.trainer2TitelManual&&(a.trainer2TitelManual="Trainer-Titel erforderlich.");else if(e.trainer2Id){const i=Array.isArray(t)&&e.trainer2Id?t.find(u=>u.id===e.trainer2Id):null;i!=null&&i.titel||(a.trainer2Id="Trainer-Titel fehlt. Bitte Trainer ergänzen.")}return e.ausstellungsdatum||(a.ausstellungsdatum="Bitte Datum angeben."),a}function $t(e={}){var n,t,a,r,o,s,i,u,S,m,f,T,c,p,E,y,l,L,x,N,_,g,U,q,j,A,B,H,Q,K,V,O,W,F,P,Z;return{kundeId:((t=(n=e.kundeId)==null?void 0:n.input)==null?void 0:t.value)||"",hundId:((r=(a=e.hundId)==null?void 0:a.input)==null?void 0:r.value)||"",kursId:((s=(o=e.kursId)==null?void 0:o.input)==null?void 0:s.value)||"",kursDatumSnapshot:((S=(u=(i=e.kursDatumSnapshot)==null?void 0:i.input)==null?void 0:u.value)==null?void 0:S.trim())||"",kursOrtSnapshot:((T=(f=(m=e.kursOrtSnapshot)==null?void 0:m.input)==null?void 0:f.value)==null?void 0:T.trim())||"",trainer1Id:((p=(c=e.trainer1Id)==null?void 0:c.input)==null?void 0:p.value)||"",trainer2Id:((y=(E=e.trainer2Id)==null?void 0:E.input)==null?void 0:y.value)||"",trainer1Manual:!!((L=(l=e.trainer1Manual)==null?void 0:l.input)!=null&&L.checked),trainer2Manual:!!((N=(x=e.trainer2Manual)==null?void 0:x.input)!=null&&N.checked),trainer1NameManual:((U=(g=(_=e.trainer1NameManual)==null?void 0:_.input)==null?void 0:g.value)==null?void 0:U.trim())||"",trainer1TitelManual:((A=(j=(q=e.trainer1TitelManual)==null?void 0:q.input)==null?void 0:j.value)==null?void 0:A.trim())||"",trainer2NameManual:((Q=(H=(B=e.trainer2NameManual)==null?void 0:B.input)==null?void 0:H.value)==null?void 0:Q.trim())||"",trainer2TitelManual:((O=(V=(K=e.trainer2TitelManual)==null?void 0:K.input)==null?void 0:V.value)==null?void 0:O.trim())||"",ausstellungsdatum:((F=(W=e.ausstellungsdatum)==null?void 0:W.input)==null?void 0:F.value)||"",bemerkungen:((Z=(P=e.bemerkungen)==null?void 0:P.input)==null?void 0:Z.value)||""}}function Dt(e={},n={}){Object.entries(e).forEach(([t,a])=>{const r=a.hint,o=!!n[t];r&&(r.textContent=o?n[t]:"",r.classList.toggle("sr-only",!o)),a.input&&a.input.setAttribute("aria-invalid",o?"true":"false")})}function Oe(e,n,t){e.innerHTML="",n.forEach(a=>{const r=document.createElement("option");r.value=a.value,r.textContent=a.label,r.selected=a.value===t,e.appendChild(r)})}function Fe(e=[],n="",t=""){const a=[{value:"",label:"Bitte wählen"}],r=String(t||"").trim().toLowerCase(),o=(Array.isArray(e)?e:[]).filter(s=>r?[s.code,s.kundenCode,s.vorname,s.nachname,s.email].filter(Boolean).join(" ").toLowerCase().includes(r):!0).map(s=>({value:s.id,label:qt(s)}));return[...a,...o].map(s=>({...s,selected:s.value===n}))}function Pe(e=[],n="",t=""){const a=(Array.isArray(e)?e:[]).filter(s=>!n||s.kundenId===n),r=[{value:"",label:n?"Bitte wählen":"Bitte zuerst Kunde wählen"}],o=a.map(s=>({value:s.id,label:At(s)}));return[...r,...o].map(s=>({...s,selected:s.value===t}))}function Rt(e=[],n=""){const t=[{value:"",label:"Bitte wählen"}],a=(Array.isArray(e)?e:[]).map(r=>({value:r.id,label:Bt(r)}));return[...t,...a].map(r=>({...r,selected:r.value===n}))}function Ze(e=[],n=""){const t=[{value:"",label:"Bitte wählen"}],a=(Array.isArray(e)?e:[]).map(r=>({value:r.id,label:ee(r.name,r.titel,r.code)}));return[...t,...a].map(r=>({...r,selected:r.value===n}))}function Xe(e){return e?`${e.vorname||""} ${e.nachname||""}`.trim():""}function qt(e){if(!e)return"–";const n=e.code||e.kundenCode||e.id||"",t=Xe(e)||"Unbenannt";return n?`${n} – ${t}`:t}function At(e){if(!e)return"–";const n=e.code||e.id||"",t=e.name||e.rufname||"Unbenannt";return n?`${n} – ${t}`:t}function Bt(e){if(!e)return"–";const n=e.code||e.id||"",t=e.date?` (${e.date})`:"",a=e.title||"Kurs";return n?`${n} – ${a}${t}`:`${a}${t}`}function ee(e="",n="",t=""){const a=e||"",r=t?` (${t})`:"",o=n?`, ${n}`:"";return!a&&!n&&!t?"–":`${a}${o}${r}`.trim()}function re(e){const n=String(e||"").trim().toLowerCase();return n?n==="weiblich"?"Weiblich":n==="männlich"?"Männlich":e:"Unbekannt"}function et(e,n){const t=e||"–",a=String(n||"").trim().toLowerCase();return a==="weiblich"?`Kundin ${t}`:a==="männlich"?`Kunde ${t}`:`Kunde ${t}`}function Ge(e="",n=""){const t=ae({eyebrow:n,title:e,body:"",footer:""});return t.querySelector(".ui-card")||t.firstElementChild}function Ue(e){if(!e)return"–";const n=new Date(e);return Number.isNaN(n.getTime())?"–":n.toLocaleString("de-CH",{dateStyle:"medium",timeStyle:"short"})}function Ht(e){return e==null?"–":(typeof e=="string"?e.trim():String(e))||"–"}function Kt(e=[]){const n=document.createElement("dl");return n.className="kunden-details",e.forEach(({label:t,value:a,render:r})=>{const o=document.createElement("dt");o.textContent=t;const s=document.createElement("dd");typeof r=="function"?s.appendChild(r()):s.textContent=Ht(a),n.append(o,s)}),n}function Ot(){return new Date().toISOString().slice(0,10)}export{Wt as initModule};

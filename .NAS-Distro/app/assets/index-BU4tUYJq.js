import{l as We,g as Oe,u as Qe,c as Ye}from"./zertifikate-ChY5kSXF.js";import{l as Je}from"./kunden-63v7XQcn.js";import{l as Xe}from"./hunde-CJGiv6MT.js";import{l as et,a as tt}from"./kurse-gdQsC4RC.js";import{l as nt}from"./trainer-8iLmEAPu.js";import{e as M,d as fe,b as z,a as at,f as g}from"./components-CSbXQ3V_.js";import{r as Re,g as Pe}from"./backgrounds-CbNqBOSU.js";import{r as rt}from"./client-DzzQSn2i.js";import"./httpClient-DC058eq3.js";import"./index-DsEBn-tT.js";const J={textColor:"#232323",minScale:.85,blocks:{participantLine1:{x:18,y:33.2,w:64,h:3,fontSize:11.5,align:"center"},kundeName:{x:18,y:34,w:64,h:5,fontSize:17.5,weight:700,align:"center",color:"#2f5ea8"},participantLine3:{x:18,y:37,w:64,h:3,fontSize:11.5,align:"center"},hundLine:{x:18,y:38.4,w:64,h:3.5,fontSize:11.8,weight:700,align:"center",color:"#2f5ea8"},kursTitelTop:{x:18,y:22.4,w:64,h:4,fontSize:22.8,weight:700,align:"center",color:"#2f5ea8"},kursTeilnahmeSatz:{x:16,y:39.7,w:68,h:4,fontSize:11.5,align:"center"},kursTheorie:{x:15.9,y:46.8,w:36,h:12,fontSize:10.8,lineHeight:1.35,maxLines:6},kursPraxis:{x:50.4,y:46.8,w:36,h:12,fontSize:10.8,lineHeight:1.35,maxLines:6},gratulationSatz:{x:16,y:56.2,w:68,h:3,fontSize:11.5,align:"center"},ausstellungsdatum:{x:18,y:57.9,w:64,h:3,fontSize:10.8,align:"center"},trainer1Name:{x:13.9,y:60.2,w:25,h:3,fontSize:12,weight:700,align:"center"},trainer1Titel:{x:13.9,y:63,w:25,h:3,fontSize:10.5,align:"center"},trainer2Name:{x:60.5,y:60.2,w:25,h:3,fontSize:12,weight:700,align:"center"},trainer2Titel:{x:60.5,y:63,w:25,h:3,fontSize:10.5,align:"center"},zertifikatId:{x:4,y:96.5,w:92,h:2.2,fontSize:8.5,align:"center",color:"#ffffff",opacity:.8}}},it=["code","kundeNameSnapshot","hundNameSnapshot","hundRasseSnapshot","hundGeschlechtSnapshot","kursTitelSnapshot","kursDatumSnapshot","kursOrtSnapshot","kursInhaltTheorieSnapshot","kursInhaltPraxisSnapshot","zertifikatHintergrund","ausstellungsdatum","trainer1NameSnapshot","trainer1TitelSnapshot"];function C(e=""){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function lt(e){const n=String(e||"").trim().toLowerCase();return n||""}function ot(e){const n=lt(e);return n==="weiblich"?"Hundeführerin":n==="männlich"?"Hundeführer":"Hundeführerin"}function Fe(e={}){const n=it.filter(a=>!(e[a]||"").toString().trim());return!Re(e.zertifikatHintergrund||"")&&!n.includes("zertifikatHintergrund")&&n.push("zertifikatHintergrund"),(e.trainer2NameSnapshot||"").toString().trim()&&((e.trainer2TitelSnapshot||"").toString().trim()||n.push("trainer2TitelSnapshot")),n}function ut(e={}){const n=e.kundeNameSnapshot||"—",t=dt([e.hundRasseSnapshot,e.hundGeschlechtSnapshot,e.hundNameSnapshot]),a=e.kursTitelSnapshot||"—",r=ot(e.kundeGeschlechtSnapshot),u=Me(e.kursInhaltTheorieSnapshot),l=Me(e.kursInhaltPraxisSnapshot),o=ct(e.ausstellungsdatum),s=Re(e.zertifikatHintergrund||"");return`<!doctype html>
  <html lang="de">
    <head>
      <meta charset="utf-8" />
      <title>Zertifikat_${C(e.code||"")}.pdf</title>
      <style>
        @page { size: A4; margin: 0; }
        * { box-sizing: border-box; }
        body {
          font-family: "Times New Roman", Georgia, serif;
          color: ${J.textColor};
          margin: 0;
          background: #ffffff;
        }
        .page {
          position: relative;
          width: 210mm;
          height: 297mm;
          background: url("${s}") no-repeat center top;
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
          ${$e(u,J.blocks.kursTheorie.maxLines)}
        </ul>
        <ul class="kurs-list" data-fit="list" style="${v("kursPraxis",!0)}">
          ${$e(l,J.blocks.kursPraxis.maxLines)}
        </ul>
        <div class="text-block" data-fit="text" style="${v("gratulationSatz")}">
          ${C(`Wir gratulieren der ${r} zu dieser Leistung und danken für das Engagement.`)}
        </div>
        <div class="text-block" data-fit="text" style="${v("ausstellungsdatum")}">
          ${C(`Döttingen, ${o}`)}
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
        const minScale = ${J.minScale};
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
  </html>`}function st(e={}){const n=Fe(e);if(n.length){const o=new Error("Missing certificate fields");throw o.missing=n,o}const t=ut(e),a=new Blob([t],{type:"text/html;charset=utf-8"}),r=URL.createObjectURL(a),u=window.open(r,"_blank");if(!u){const o=new Error("Popup blocked");throw o.code="POPUP_BLOCKED",o}u.focus();const l=()=>{URL.revokeObjectURL(r)};u.addEventListener("load",()=>{try{window.setTimeout(()=>{u.print()},300)}finally{window.setTimeout(l,1e3)}})}function Me(e=""){return String(e||"").split(/\r?\n/).map(n=>n.trim()).filter(Boolean)}function dt(e=[]){return e.map(n=>String(n||"").trim()).filter(Boolean).join(" · ")}function ct(e){if(!e)return"—";const n=new Date(e);if(Number.isNaN(n.getTime()))return String(e);const t=String(n.getDate()).padStart(2,"0"),a=String(n.getMonth()+1).padStart(2,"0"),r=String(n.getFullYear());return`${t}.${a}.${r}`}function $e(e=[],n=6){const t=(Array.isArray(e)?e:[]).map(r=>r.trim()).filter(Boolean),a=t.slice(0,n);return t.length>n&&a.length&&(a[a.length-1]=`${a[a.length-1]}…`),a.map(r=>`<li>${C(r)}</li>`).join("")}function v(e,n=!1){const t=J.blocks[e],a=t.weight||400,r=t.lineHeight||1.2,u=[`left:${t.x}%`,`top:${t.y}%`,`width:${t.w}%`,`height:${t.h}%`,`font-size:${t.fontSize}pt`,`font-weight:${a}`,`line-height:${r}`];return n&&u.push("text-align:left"),t.color&&u.push(`color:${t.color}`),t.opacity!==void 0&&u.push(`opacity:${t.opacity}`),u.join(";")}function Ht(e,n={}){var l,o;if(!e)return;e.innerHTML="",(l=e.scrollTo)==null||l.call(e,{top:0,behavior:"auto"});const{mode:t,detailId:a}=ht(n==null?void 0:n.segments),r=document.createElement("section");r.className="dogule-section zertifikate-section",t==="list"?_e(r):t==="create"?Ze(r):t==="detail"?mt(r,a):t==="edit"?ft(r,a):_e(r),e.appendChild(r);const u=r.querySelector("h1, h2");(o=u==null?void 0:u.focus)==null||o.call(u)}function ht(e=[]){const n=Array.isArray(e)?e.filter(Boolean).map(t=>String(t).split("?")[0]).filter(Boolean):[];return n.length?n[0]==="new"?{mode:"create",detailId:null}:n[1]==="edit"?{mode:"edit",detailId:n[0]||null}:{mode:"detail",detailId:n[0]||null}:{mode:"list",detailId:null}}function pt(){const e=typeof window<"u"&&window.location.hash||"",n=e.indexOf("?");return n===-1?new URLSearchParams:new URLSearchParams(e.slice(n+1))}async function _e(e){const n=ne("Aktionen"),t=n==null?void 0:n.querySelector(".ui-card__body"),a=document.createElement("div");a.className="module-actions";const r=M({label:"Zertifikat erstellen",variant:"primary",onClick:()=>{window.location.hash="#/zertifikate/new"}});a.appendChild(r),t&&(t.innerHTML="",t.appendChild(a)),n&&e.appendChild(n);const u=fe({eyebrow:"",title:"Zertifikateübersicht",body:"",footer:""}),l=u.querySelector(".ui-card")||u.firstElementChild,o=l.querySelector(".ui-card__body");o.innerHTML="";const s=document.createElement("div");s.className="zertifikate-export-status",o.appendChild(s),o.appendChild(z("Lade Zertifikate...",{variant:"info",role:"status"})),e.appendChild(l);let m=[];try{m=await We()}catch(h){console.error("[ZERTIFIKATE_LIST_FAIL]",h),o.innerHTML="",o.appendChild(z("Fehler beim Laden der Daten.",{variant:"warn",role:"alert"}));return}if(!Array.isArray(m)||!m.length){o.innerHTML="";const h=at("Keine Zertifikate vorhanden.","");o.appendChild(h);return}o.innerHTML="";const f=document.createElement("div");f.className="kunden-list-scroll";const S=document.createElement("table");S.className="kunden-list-table";const p=document.createElement("thead"),b=document.createElement("tr");["Code","Kunde","Hund","Kurs","Kursdatum","Ausstellungsdatum"].forEach(h=>{const i=document.createElement("th");i.textContent=h,b.appendChild(i)}),p.appendChild(b);const w=document.createElement("tbody");m.forEach(h=>{const i=document.createElement("tr");i.addEventListener("click",x=>{var L;(L=x.target)!=null&&L.closest("a")||(window.location.hash=`#/zertifikate/${h.id}`)}),i.appendChild(U(h.code||"–",!0,h.id)),i.appendChild(U(h.kundeNameSnapshot||"–")),i.appendChild(U(h.hundNameSnapshot||"–")),i.appendChild(U(h.kursTitelSnapshot||"–")),i.appendChild(U(h.kursDatumSnapshot||"–")),i.appendChild(U(h.ausstellungsdatum||"–")),w.appendChild(i)}),S.append(p,w),f.appendChild(S),o.appendChild(f)}function U(e,n=!1,t=""){const a=document.createElement("td");if(n){const r=document.createElement("a");r.href=`#/zertifikate/${t}`,r.textContent=e||"–",a.appendChild(r)}else a.textContent=e||"–";return a}async function mt(e,n){const t=ne("Stammdaten"),a=t==null?void 0:t.querySelector(".ui-card__body"),r=ne("Aktionen"),u=r==null?void 0:r.querySelector(".ui-card__body"),l=document.createElement("div");l.className="module-actions";const o=document.createElement("div");if(o.className="zertifikate-export-status",u&&(u.innerHTML="",u.append(l,o)),a&&(a.innerHTML="",a.appendChild(z("Lade Zertifikat...",{variant:"info",role:"status"}))),r&&e.appendChild(r),t&&e.appendChild(t),!n){a&&(a.innerHTML="",a.appendChild(z("Keine Zertifikat-ID angegeben.",{variant:"warn",role:"alert"}))),l.append(M({label:"Zur Übersicht",variant:"quiet",onClick:()=>{window.location.hash="#/zertifikate"}}));return}let s=null;try{s=await Oe(n)}catch(p){console.error("[ZERTIFIKATE_DETAIL_LOAD_FAIL]",p),a&&(a.innerHTML="",a.appendChild(z("Fehler beim Laden der Daten.",{variant:"warn",role:"alert"}))),l.append(M({label:"Zur Übersicht",variant:"quiet",onClick:()=>{window.location.hash="#/zertifikate"}}));return}if(!s){a&&(a.innerHTML="",a.appendChild(z("Zertifikat nicht gefunden.",{variant:"warn",role:"alert"}))),l.append(M({label:"Zur Übersicht",variant:"quiet",onClick:()=>{window.location.hash="#/zertifikate"}}));return}if(a){a.innerHTML="";const p=[{label:"ID",value:s.id},{label:"Code",value:s.code},{label:"Kunde",value:Ue(s.kundeNameSnapshot,s.kundeGeschlechtSnapshot)},{label:"Kunde Geschlecht",value:te(s.kundeGeschlechtSnapshot)},{label:"Hund",value:s.hundNameSnapshot},{label:"Hund Rasse",value:s.hundRasseSnapshot},{label:"Hund Geschlecht",value:te(s.hundGeschlechtSnapshot)},{label:"Kurs",value:s.kursTitelSnapshot},{label:"Kurs Datum",value:s.kursDatumSnapshot},{label:"Kurs Ort",value:s.kursOrtSnapshot},{label:"Kursinhalt Theorie",value:s.kursInhaltTheorieSnapshot},{label:"Kursinhalt Praxis",value:s.kursInhaltPraxisSnapshot},{label:"Trainer 1",value:X(s.trainer1NameSnapshot,s.trainer1TitelSnapshot)},{label:"Trainer 2",value:X(s.trainer2NameSnapshot,s.trainer2TitelSnapshot)},{label:"Ausstellungsdatum",value:s.ausstellungsdatum},{label:"Bemerkungen",value:s.bemerkungen},{label:"Erstellt am",value:Ke(s.createdAt)},{label:"Aktualisiert am",value:Ke(s.updatedAt)}];a.appendChild(vt(p))}const m=M({label:"Bearbeiten",variant:"secondary"});m.type="button",m.addEventListener("click",()=>{window.confirm("Achtung: Bearbeiten überschreibt die gespeicherten Snapshot-Daten. Fortfahren?")&&(window.location.hash=`#/zertifikate/${s.id}/edit`)});const f=M({label:"PDF export",variant:"secondary"});f.type="button",f.disabled=!1,f.addEventListener("click",async()=>{o.innerHTML="",o.appendChild(z("PDF wird vorbereitet...",{variant:"info",role:"status"}));try{let p=null;if(s.kursId)try{p=await tt(s.kursId)}catch(i){console.warn("[ZERTIFIKAT_KURS_LOAD_FAIL]",i)}const b=p?Pe(p):"",w={...s,zertifikatHintergrund:b},h=Fe(w);if(h.length){if(h.includes("zertifikatHintergrund")){o.appendChild(z("Kein Zertifikat-Hintergrund zugewiesen.",{variant:"warn",role:"alert"}));return}o.appendChild(z(`PDF kann nicht erstellt werden. Fehlende Felder: ${h.join(", ")}.`,{variant:"warn",role:"alert"}));return}st(w)}catch(p){const b=(p==null?void 0:p.code)==="POPUP_BLOCKED"?"PDF-Fenster wurde blockiert. Bitte Pop-ups erlauben.":"PDF-Generierung fehlgeschlagen.";o.appendChild(z(b,{variant:"warn",role:"alert"})),console.error("[ZERTIFIKAT_PDF_FAIL]",p)}});const S=M({label:"Zur Übersicht",variant:"quiet",onClick:()=>{window.location.hash="#/zertifikate"}});l.append(m,f,S)}function Y(e,n=[]){const t=document.createElement("div"),a=document.createElement("h3");a.textContent=e,t.appendChild(a);const r=document.createElement("dl");return r.className="zertifikate-detail-list",n.forEach(([u,l])=>{const o=document.createElement("dt");o.textContent=u;const s=document.createElement("dd");s.textContent=l||"–",r.append(o,s)}),t.appendChild(r),t}async function Ze(e,{mode:n="create",existing:t=null}={}){var Ie,ve,Ce,ze,Le,xe,Ne,Ee;const a=ne("Stammdaten"),r=a.querySelector(".ui-card__body");r.innerHTML="";const u=document.createElement("div");u.className="zertifikate-form-status",r.appendChild(u);const l=document.createElement("form");if(l.noValidate=!0,l.className="zertifikate-form",l.id="zertifikate-create-form",r.appendChild(l),n==="edit"&&t){const d=g({id:"zertifikate-id",label:"Zertifikat-ID",control:"input",type:"text",value:t.id||"",required:!1}),k=d.querySelector("input");k.name="zertifikatId",k.disabled=!0,(Ie=d.querySelector(".ui-form-row__hint"))==null||Ie.classList.add("sr-only"),l.appendChild(d);const I=g({id:"zertifikate-code",label:"Code",control:"input",type:"text",value:t.code||"",required:!1}),c=I.querySelector("input");c.name="code",c.disabled=!0,(ve=I.querySelector(".ui-form-row__hint"))==null||ve.classList.add("sr-only"),l.appendChild(I)}const o=fe({eyebrow:"",title:"Vorschau (Snapshot)",body:"",footer:""}),s=o.querySelector(".ui-card")||o.firstElementChild,m=s.querySelector(".ui-card__body"),[f,S,p,b]=await Promise.all([Je().catch(()=>[]),Xe().catch(()=>[]),et().catch(()=>[]),nt().catch(()=>[])]),w=pt(),h={kundeId:(t==null?void 0:t.kundeId)||w.get("kundeId")||"",hundId:(t==null?void 0:t.hundId)||w.get("hundId")||"",kursId:(t==null?void 0:t.kursId)||w.get("kursId")||"",kursDatumSnapshot:(t==null?void 0:t.kursDatumSnapshot)||w.get("kursDatumSnapshot")||"",kursOrtSnapshot:(t==null?void 0:t.kursOrtSnapshot)||w.get("kursOrtSnapshot")||"Vorhard Döttingen"},i={},x=g({id:"zertifikate-kunde-search",label:"Kunde suchen",control:"input",type:"search",placeholder:"Name, Code oder E-Mail",required:!1}),L=x.querySelector("input");L.name="kundeSearch",(Ce=x.querySelector(".ui-form-row__hint"))==null||Ce.classList.add("sr-only"),l.appendChild(x);const N=g({id:"zertifikate-kunde",label:"Kunde*",control:"select",required:!0,options:He(f,h.kundeId,"")}),$=N.querySelector("select");$.name="kundeId",i.kundeId={input:$,hint:N.querySelector(".ui-form-row__hint")},l.appendChild(N);const E=g({id:"zertifikate-hund",label:"Hund*",control:"select",required:!0,options:Be(S,h.kundeId,h.hundId)}),T=E.querySelector("select");T.name="hundId",i.hundId={input:T,hint:E.querySelector(".ui-form-row__hint")},l.appendChild(E);const H=g({id:"zertifikate-kurs",label:"Kurs*",control:"select",required:!0,options:gt(p,h.kursId)}),j=H.querySelector("select");j.name="kursId",i.kursId={input:j,hint:H.querySelector(".ui-form-row__hint")},l.appendChild(H);const B=g({id:"zertifikate-kurs-datum",label:"Kurs Datum*",control:"input",type:"date",required:!0}),A=B.querySelector("input");A.name="kursDatumSnapshot",A.value=h.kursDatumSnapshot,i.kursDatumSnapshot={input:A,hint:B.querySelector(".ui-form-row__hint")},l.appendChild(B);const K=g({id:"zertifikate-kurs-ort",label:"Kurs Ort*",control:"input",type:"text",required:!0,value:h.kursOrtSnapshot}),V=K.querySelector("input");V.name="kursOrtSnapshot",i.kursOrtSnapshot={input:V,hint:K.querySelector(".ui-form-row__hint")},l.appendChild(K);const O=g({id:"zertifikate-trainer1",label:"Trainer 1*",control:"select",required:!0,options:Ae(b,"")}),W=O.querySelector("select");W.name="trainer1Id",i.trainer1Id={input:W,hint:O.querySelector(".ui-form-row__hint")},l.appendChild(O);const R=g({id:"zertifikate-trainer1-mode",label:"Trainer 1 manuell",control:"input",type:"checkbox"}),Q=R.querySelector("input");Q.name="trainer1Manual",(ze=R.querySelector(".ui-form-row__hint"))==null||ze.classList.add("sr-only"),i.trainer1Manual={input:Q,hint:null},l.appendChild(R);const P=g({id:"zertifikate-trainer1-name",label:"Trainer 1 Name*",control:"input",type:"text",placeholder:"z. B. Martina Frei"}),F=P.querySelector("input");F.name="trainer1NameManual",F.disabled=!0,i.trainer1NameManual={input:F,hint:P.querySelector(".ui-form-row__hint")},l.appendChild(P);const Z=g({id:"zertifikate-trainer1-titel",label:"Trainer 1 Titel",control:"input",type:"text",placeholder:"z. B. Dipl. Hundetrainer:in"}),G=Z.querySelector("input");G.name="trainer1TitelManual",G.disabled=!0,(Le=Z.querySelector(".ui-form-row__hint"))==null||Le.classList.add("sr-only"),i.trainer1TitelManual={input:G,hint:null},l.appendChild(Z);const ae=g({id:"zertifikate-trainer2",label:"Trainer 2",control:"select",required:!1,options:Ae(b,"")}),ke=ae.querySelector("select");ke.name="trainer2Id",i.trainer2Id={input:ke,hint:ae.querySelector(".ui-form-row__hint")},l.appendChild(ae);const re=g({id:"zertifikate-trainer2-mode",label:"Trainer 2 manuell",control:"input",type:"checkbox"}),Se=re.querySelector("input");Se.name="trainer2Manual",(xe=re.querySelector(".ui-form-row__hint"))==null||xe.classList.add("sr-only"),i.trainer2Manual={input:Se,hint:null},l.appendChild(re);const ie=g({id:"zertifikate-trainer2-name",label:"Trainer 2 Name",control:"input",type:"text",placeholder:"z. B. Jonas Graf"}),le=ie.querySelector("input");le.name="trainer2NameManual",le.disabled=!0,(Ne=ie.querySelector(".ui-form-row__hint"))==null||Ne.classList.add("sr-only"),i.trainer2NameManual={input:le,hint:null},l.appendChild(ie);const oe=g({id:"zertifikate-trainer2-titel",label:"Trainer 2 Titel",control:"input",type:"text",placeholder:"z. B. Dipl. Hundetrainer:in"}),ue=oe.querySelector("input");ue.name="trainer2TitelManual",ue.disabled=!0,(Ee=oe.querySelector(".ui-form-row__hint"))==null||Ee.classList.add("sr-only"),i.trainer2TitelManual={input:ue,hint:null},l.appendChild(oe);const se=g({id:"zertifikate-ausstellungsdatum",label:"Ausstellungsdatum*",control:"input",type:"date",required:!0}),de=se.querySelector("input");de.name="ausstellungsdatum",de.value=(t==null?void 0:t.ausstellungsdatum)||Ct(),i.ausstellungsdatum={input:de,hint:se.querySelector(".ui-form-row__hint")},l.appendChild(se);const ce=g({id:"zertifikate-bemerkungen",label:"Bemerkungen",control:"textarea",required:!1}),he=ce.querySelector("textarea");he.name="bemerkungen",he.value=(t==null?void 0:t.bemerkungen)||"",i.bemerkungen={input:he,hint:ce.querySelector(".ui-form-row__hint")},l.appendChild(ce);const be=a.querySelector(".ui-card__footer"),pe=document.createElement("div");pe.className="module-actions";const _=M({label:n==="edit"?"Speichern":"Erstellen",variant:"primary"});_.type="button",_.setAttribute("form",l.id);const je=M({label:"Abbrechen",variant:"quiet",onClick:()=>{window.location.hash="#/zertifikate"}});pe.append(_,je),be.innerHTML="",be.appendChild(pe);const q=()=>{const d=qe(i,{kunden:f,hunde:S,kurse:p,trainer:b});m.innerHTML="",m.appendChild(Y("Kunde",[["Name",Ue(d.kundeNameSnapshot,d.kundeGeschlechtSnapshot)],["Geschlecht",te(d.kundeGeschlechtSnapshot)]])),m.appendChild(Y("Hund",[["Name",d.hundNameSnapshot||"–"],["Rasse",d.hundRasseSnapshot||"–"],["Geschlecht",te(d.hundGeschlechtSnapshot)]])),m.appendChild(Y("Kurs",[["Titel",d.kursTitelSnapshot||"–"],["Datum",d.kursDatumSnapshot||"–"],["Ort",d.kursOrtSnapshot||"–"]])),m.appendChild(Y("Trainer",[["Trainer 1",X(d.trainer1NameSnapshot,d.trainer1TitelSnapshot)],["Trainer 2",X(d.trainer2NameSnapshot,d.trainer2TitelSnapshot)]])),m.appendChild(Y("Ausstellung",[["Ausstellungsdatum",d.ausstellungsdatum||"–"],["Bemerkungen",d.bemerkungen||"–"]]))},ee=(d,k,I,c)=>{const y=!!d.input.checked;k.input.disabled=y,I.input.disabled=!y,c.input.disabled=!y,y?k.input.value="":(I.input.value="",c.input.value="")};i.trainer1Manual.input.addEventListener("change",()=>{ee(i.trainer1Manual,i.trainer1Id,i.trainer1NameManual,i.trainer1TitelManual),q()}),i.trainer2Manual.input.addEventListener("change",()=>{ee(i.trainer2Manual,i.trainer2Id,i.trainer2NameManual,i.trainer2TitelManual),q()});const ge=()=>{var c;const d=i.kundeId.input.value||"",k=i.hundId.input.value||"",I=Be(S,d,k);De(i.hundId.input,I,k),i.hundId.input.value||(i.hundId.input.value=((c=I.find(y=>y.value))==null?void 0:c.value)||"")},we=()=>{const d=(L.value||"").trim().toLowerCase(),k=i.kundeId.input.value||"",I=He(f,k,d);De(i.kundeId.input,I,k)};L.addEventListener("input",()=>{we()});const ye=()=>{const d=p.find(k=>k.id===i.kursId.input.value)||null;d&&!i.kursDatumSnapshot.input.value&&(i.kursDatumSnapshot.input.value=d.date||""),d&&i.kursOrtSnapshot.input.value==="Vorhard Döttingen"&&(i.kursOrtSnapshot.input.value=d.ort||d.location||i.kursOrtSnapshot.input.value)};i.kundeId.input.addEventListener("change",()=>{ge(),q()}),i.kursId.input.addEventListener("change",()=>{ye(),q()}),[i.hundId,i.kursId,i.kursDatumSnapshot,i.kursOrtSnapshot,i.trainer1Id,i.trainer2Id,i.ausstellungsdatum].forEach(d=>{d.input.addEventListener("change",q)}),[i.trainer1NameManual,i.trainer1TitelManual,i.trainer2NameManual,i.trainer2TitelManual].forEach(d=>{d.input.addEventListener("input",q)}),i.bemerkungen.input.addEventListener("input",q),we(),ye(),ee(i.trainer1Manual,i.trainer1Id,i.trainer1NameManual,i.trainer1TitelManual),ee(i.trainer2Manual,i.trainer2Id,i.trainer2NameManual,i.trainer2TitelManual),ge(),q();const Te=async d=>{d!=null&&d.preventDefault&&d.preventDefault(),u.innerHTML="";const k=St(i),I=kt(k,{kurse:p,trainer:b});if(bt(i,I),Object.keys(I).length){const c=Object.values(I).filter(Boolean).join(" "),y=c?`Bitte prüfen: ${c}`:"Bitte prüfe die Pflichtfelder.";u.appendChild(z(y,{variant:"warn",role:"alert"}));return}_.disabled=!0,_.textContent=n==="edit"?"Speichere ...":"Erstelle ...";try{const c=qe(i,{kunden:f,hunde:S,kurse:p,trainer:b}),y={code:(t==null?void 0:t.code)||"",kundeId:k.kundeId,hundId:k.hundId,kursId:k.kursId,kundeNameSnapshot:c.kundeNameSnapshot,kundeGeschlechtSnapshot:c.kundeGeschlechtSnapshot,hundNameSnapshot:c.hundNameSnapshot,hundRasseSnapshot:c.hundRasseSnapshot,hundGeschlechtSnapshot:c.hundGeschlechtSnapshot,kursTitelSnapshot:c.kursTitelSnapshot,kursDatumSnapshot:k.kursDatumSnapshot,kursOrtSnapshot:k.kursOrtSnapshot,kursInhaltTheorieSnapshot:c.kursInhaltTheorieSnapshot,kursInhaltPraxisSnapshot:c.kursInhaltPraxisSnapshot,ausstellungsdatum:k.ausstellungsdatum,trainer1NameSnapshot:c.trainer1NameSnapshot,trainer1TitelSnapshot:c.trainer1TitelSnapshot,trainer2NameSnapshot:c.trainer2NameSnapshot,trainer2TitelSnapshot:c.trainer2TitelSnapshot,bemerkungen:k.bemerkungen};if(n==="edit")await Qe(t.id,y),window.location.hash=`#/zertifikate/${t.id}`;else{const D=await Ye(y);if(!(D!=null&&D.id))throw new Error("create_failed");try{const me=f.find(Ve=>Ve.id===y.kundeId)||{};await rt({eventType:"certificate_delivery",zertifikatId:D.id,kundeId:y.kundeId,hundId:y.hundId,recipientEmail:me.email||""})}catch(me){console.warn("[ZERTIFIKAT_AUTOMATION_SKIP]",me)}window.location.hash=`#/zertifikate/${D.id}`}}catch(c){console.error("[ZERTIFIKAT_CREATE_FAIL]",c);const y=Array.isArray(c==null?void 0:c.missing)?c.missing.join(", "):"",D=(c==null?void 0:c.code)==="TRAINER_TITEL_REQUIRED"?"Trainer-Titel fehlt. Bitte Titel ergänzen.":y?`Zertifikat konnte nicht erstellt werden. Fehlende Felder: ${y}.`:"Zertifikat konnte nicht erstellt werden.";u.appendChild(z(D,{variant:"warn",role:"alert"})),_.disabled=!1,_.textContent=n==="edit"?"Speichern":"Erstellen"}};l.addEventListener("submit",Te),_.addEventListener("click",Te),e.appendChild(a),e.appendChild(s)}async function ft(e,n){const t=z("Achtung: Änderungen überschreiben die gespeicherten Snapshot-Daten.",{variant:"warn",role:"alert"});e.appendChild(t);const a=await Oe(n);if(!a){e.appendChild(z("Zertifikat nicht gefunden.",{variant:"warn",role:"alert"}));return}const r=document.createElement("div");e.appendChild(r),await Ze(r,{mode:"edit",existing:a})}function qe(e,{kunden:n=[],hunde:t=[],kurse:a=[],trainer:r=[]}={}){var p,b,w,h,i,x,L,N,$,E;const u=n.find(T=>T.id===e.kundeId.input.value)||null,l=t.find(T=>T.id===e.hundId.input.value)||null,o=a.find(T=>T.id===e.kursId.input.value)||null,s=!!((b=(p=e.trainer1Manual)==null?void 0:p.input)!=null&&b.checked),m=!!((h=(w=e.trainer2Manual)==null?void 0:w.input)!=null&&h.checked),f=s?null:r.find(T=>T.id===e.trainer1Id.input.value)||null,S=m?null:r.find(T=>T.id===e.trainer2Id.input.value)||null;return{kundeNameSnapshot:Ge(u),kundeGeschlechtSnapshot:(u==null?void 0:u.geschlecht)||"",hundNameSnapshot:(l==null?void 0:l.name)||"",hundRasseSnapshot:(l==null?void 0:l.rasse)||"",hundGeschlechtSnapshot:(l==null?void 0:l.geschlecht)||"",kursTitelSnapshot:(o==null?void 0:o.title)||"",kursDatumSnapshot:((L=(x=(i=e.kursDatumSnapshot)==null?void 0:i.input)==null?void 0:x.value)==null?void 0:L.trim())||(o==null?void 0:o.date)||"",kursOrtSnapshot:((E=($=(N=e.kursOrtSnapshot)==null?void 0:N.input)==null?void 0:$.value)==null?void 0:E.trim())||(o==null?void 0:o.ort)||(o==null?void 0:o.location)||"",kursInhaltTheorieSnapshot:((o==null?void 0:o.inhaltTheorie)||"").trim(),kursInhaltPraxisSnapshot:((o==null?void 0:o.inhaltPraxis)||"").trim(),ausstellungsdatum:e.ausstellungsdatum.input.value||"",trainer1NameSnapshot:s?e.trainer1NameManual.input.value.trim():(f==null?void 0:f.name)||"",trainer1TitelSnapshot:s?e.trainer1TitelManual.input.value.trim():(f==null?void 0:f.titel)||"",trainer2NameSnapshot:m?e.trainer2NameManual.input.value.trim()||null:(S==null?void 0:S.name)||null,trainer2TitelSnapshot:m?e.trainer2TitelManual.input.value.trim()||null:(S==null?void 0:S.titel)||null,bemerkungen:e.bemerkungen.input.value||""}}function kt(e={},{kurse:n=[],trainer:t=[]}={}){const a={};e.kundeId||(a.kundeId="Bitte Kunde auswählen."),e.hundId||(a.hundId="Bitte Hund auswählen."),e.kursId||(a.kursId="Bitte Kurs auswählen."),e.kursDatumSnapshot||(a.kursDatumSnapshot="Bitte Kurs Datum angeben."),e.kursOrtSnapshot||(a.kursOrtSnapshot="Bitte Kurs Ort angeben.");const r=Array.isArray(n)?n.find(s=>s.id===e.kursId):null,u=r?Pe(r):"";e.kursId&&r&&!u&&(a.kursId=a.kursId||"Kein Zertifikat-Hintergrund zugewiesen.");const l=((r==null?void 0:r.inhaltTheorie)||"").trim(),o=((r==null?void 0:r.inhaltPraxis)||"").trim();if(e.kursId&&!l&&(a.kursInhaltTheorieSnapshot="Kursinhalt Theorie fehlt. Bitte Kurs aktualisieren."),e.kursId&&!o&&(a.kursInhaltPraxisSnapshot="Kursinhalt Praxis fehlt. Bitte Kurs aktualisieren."),e.trainer1Manual)e.trainer1NameManual||(a.trainer1NameManual="Bitte Trainername eingeben."),e.trainer1TitelManual||(a.trainer1TitelManual="Trainer-Titel erforderlich.");else if(!e.trainer1Id)a.trainer1Id="Bitte Trainer auswählen.";else{const s=Array.isArray(t)&&e.trainer1Id?t.find(m=>m.id===e.trainer1Id):null;s!=null&&s.titel||(a.trainer1Id="Trainer-Titel fehlt. Bitte Trainer ergänzen.")}if(e.trainer2Manual)e.trainer2NameManual&&!e.trainer2TitelManual&&(a.trainer2TitelManual="Trainer-Titel erforderlich.");else if(e.trainer2Id){const s=Array.isArray(t)&&e.trainer2Id?t.find(m=>m.id===e.trainer2Id):null;s!=null&&s.titel||(a.trainer2Id="Trainer-Titel fehlt. Bitte Trainer ergänzen.")}return e.ausstellungsdatum||(a.ausstellungsdatum="Bitte Datum angeben."),a}function St(e={}){var n,t,a,r,u,l,o,s,m,f,S,p,b,w,h,i,x,L,N,$,E,T,H,j,B,A,K,V,O,W,R,Q,P,F,Z,G;return{kundeId:((t=(n=e.kundeId)==null?void 0:n.input)==null?void 0:t.value)||"",hundId:((r=(a=e.hundId)==null?void 0:a.input)==null?void 0:r.value)||"",kursId:((l=(u=e.kursId)==null?void 0:u.input)==null?void 0:l.value)||"",kursDatumSnapshot:((m=(s=(o=e.kursDatumSnapshot)==null?void 0:o.input)==null?void 0:s.value)==null?void 0:m.trim())||"",kursOrtSnapshot:((p=(S=(f=e.kursOrtSnapshot)==null?void 0:f.input)==null?void 0:S.value)==null?void 0:p.trim())||"",trainer1Id:((w=(b=e.trainer1Id)==null?void 0:b.input)==null?void 0:w.value)||"",trainer2Id:((i=(h=e.trainer2Id)==null?void 0:h.input)==null?void 0:i.value)||"",trainer1Manual:!!((L=(x=e.trainer1Manual)==null?void 0:x.input)!=null&&L.checked),trainer2Manual:!!(($=(N=e.trainer2Manual)==null?void 0:N.input)!=null&&$.checked),trainer1NameManual:((H=(T=(E=e.trainer1NameManual)==null?void 0:E.input)==null?void 0:T.value)==null?void 0:H.trim())||"",trainer1TitelManual:((A=(B=(j=e.trainer1TitelManual)==null?void 0:j.input)==null?void 0:B.value)==null?void 0:A.trim())||"",trainer2NameManual:((O=(V=(K=e.trainer2NameManual)==null?void 0:K.input)==null?void 0:V.value)==null?void 0:O.trim())||"",trainer2TitelManual:((Q=(R=(W=e.trainer2TitelManual)==null?void 0:W.input)==null?void 0:R.value)==null?void 0:Q.trim())||"",ausstellungsdatum:((F=(P=e.ausstellungsdatum)==null?void 0:P.input)==null?void 0:F.value)||"",bemerkungen:((G=(Z=e.bemerkungen)==null?void 0:Z.input)==null?void 0:G.value)||""}}function bt(e={},n={}){Object.entries(e).forEach(([t,a])=>{const r=a.hint,u=!!n[t];r&&(r.textContent=u?n[t]:"",r.classList.toggle("sr-only",!u)),a.input&&a.input.setAttribute("aria-invalid",u?"true":"false")})}function De(e,n,t){e.innerHTML="",n.forEach(a=>{const r=document.createElement("option");r.value=a.value,r.textContent=a.label,r.selected=a.value===t,e.appendChild(r)})}function He(e=[],n="",t=""){const a=[{value:"",label:"Bitte wählen"}],r=String(t||"").trim().toLowerCase(),u=(Array.isArray(e)?e:[]).filter(l=>r?[l.code,l.kundenCode,l.vorname,l.nachname,l.email].filter(Boolean).join(" ").toLowerCase().includes(r):!0).map(l=>({value:l.id,label:wt(l)}));return[...a,...u].map(l=>({...l,selected:l.value===n}))}function Be(e=[],n="",t=""){const a=(Array.isArray(e)?e:[]).filter(l=>!n||l.kundenId===n),r=[{value:"",label:n?"Bitte wählen":"Bitte zuerst Kunde wählen"}],u=a.map(l=>({value:l.id,label:yt(l)}));return[...r,...u].map(l=>({...l,selected:l.value===t}))}function gt(e=[],n=""){const t=[{value:"",label:"Bitte wählen"}],a=(Array.isArray(e)?e:[]).map(r=>({value:r.id,label:Tt(r)}));return[...t,...a].map(r=>({...r,selected:r.value===n}))}function Ae(e=[],n=""){const t=[{value:"",label:"Bitte wählen"}],a=(Array.isArray(e)?e:[]).map(r=>({value:r.id,label:X(r.name,r.titel,r.code)}));return[...t,...a].map(r=>({...r,selected:r.value===n}))}function Ge(e){return e?`${e.vorname||""} ${e.nachname||""}`.trim():""}function wt(e){if(!e)return"–";const n=e.code||e.kundenCode||e.id||"",t=Ge(e)||"Unbenannt";return n?`${n} – ${t}`:t}function yt(e){if(!e)return"–";const n=e.code||e.id||"",t=e.name||e.rufname||"Unbenannt";return n?`${n} – ${t}`:t}function Tt(e){if(!e)return"–";const n=e.code||e.id||"",t=e.date?` (${e.date})`:"",a=e.title||"Kurs";return n?`${n} – ${a}${t}`:`${a}${t}`}function X(e="",n="",t=""){const a=e||"",r=t?` (${t})`:"",u=n?`, ${n}`:"";return!a&&!n&&!t?"–":`${a}${u}${r}`.trim()}function te(e){const n=String(e||"").trim().toLowerCase();return n?n==="weiblich"?"Weiblich":n==="männlich"?"Männlich":e:"Unbekannt"}function Ue(e,n){const t=e||"–",a=String(n||"").trim().toLowerCase();return a==="weiblich"?`Kundin ${t}`:a==="männlich"?`Kunde ${t}`:`Kunde ${t}`}function ne(e="",n=""){const t=fe({eyebrow:n,title:e,body:"",footer:""});return t.querySelector(".ui-card")||t.firstElementChild}function Ke(e){if(!e)return"–";const n=new Date(e);return Number.isNaN(n.getTime())?"–":n.toLocaleString("de-CH",{dateStyle:"medium",timeStyle:"short"})}function It(e){return e==null?"–":(typeof e=="string"?e.trim():String(e))||"–"}function vt(e=[]){const n=document.createElement("dl");return n.className="kunden-details",e.forEach(({label:t,value:a,render:r})=>{const u=document.createElement("dt");u.textContent=t;const l=document.createElement("dd");typeof r=="function"?l.appendChild(r()):l.textContent=It(a),n.append(u,l)}),n}function Ct(){return new Date().toISOString().slice(0,10)}export{Ht as initModule};

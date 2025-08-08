import React, { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const escCSV = (v) => `"${String(v ?? "").replaceAll('"','""')}"`;
function toCSV(rows){
  if(!rows?.length) return "";
  const priority = ["advisor_code","project_ref","customer_name","customer_address","customer_email","customer_phone","measure_type","id","createdAt"];
  const all = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const rest = all.filter(h => !priority.includes(h)).sort();
  const headers = [...priority.filter(p=>all.includes(p)), ...rest];
  return [headers.join(","), ...rows.map(r => headers.map(h => escCSV(r[h])).join(","))].join("\n");
}
function downloadFile(filename, content, mime="text/csv"){
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 800);
}
const Label = ({children}) => <div className="label">{children}</div>;

const MEASURES = [
  { id:"vloerisolatie", name:"Vloerisolatie (kruipruimte)", fields:[
    { key:"area_m2", label:"Oppervlakte (m²)", type:"number", required:true },
    { key:"crawl_access", label:"Kruipruimte begaanbaar?", type:"select", options:"Ja;Nee;Beperkt", required:true },
    { key:"crawl_wetness", label:"Kruipruimte droog/nat", type:"select", options:"Droog;Vochtig;Nat" },
    { key:"crawl_height_cm", label:"Hoogte kruipruimte (cm)", type:"number" },
    { key:"pipes_present", label:"Leidingen onder vloer aanwezig", type:"switch" },
    { key:"crawl_hatch_make", label:"Kruipluik maken?", type:"select", options:"Nee;Tijdelijk;Met afwerking in houten vloer" },
    { key:"hatch_replace_insulated", label:"Luik vervangen voor geïsoleerd?", type:"switch" },
    { key:"material", label:"Materiaal", type:"select", options:"PIR;EPS;PUR;Glaswol;Steenwol;Cellulose" },
    { key:"thickness_mm", label:"Dikte (mm)", type:"number" },
    { key:"notes", label:"Bijzonderheden", type:"textarea" },
  ]},
  { id:"gevelisolatie", name:"Gevelisolatie (voorzetwand)", fields:[
    { key:"area_new_m2", label:"Oppervlakte (m²) nieuwbouw", type:"number", required:true },
    { key:"remove_existing", label:"Bestaande voorzetwand verwijderen?", type:"switch" },
    { key:"demo_area_m2", label:"Sloop m² (indien verwijderen)", type:"number" },
    { key:"frame_material", label:"Materiaal frame", type:"select", options:"Hout;Metal stud", required:true },
    { key:"insulation_material", label:"Isolatiemateriaal", type:"select", options:"Gramitherm;Glaswol", required:true },
    { key:"gramitherm_thickness", label:"Dikte (mm) — Gramitherm", type:"select", options:"70;90;120" },
    { key:"glasswool_thickness", label:"Dikte (mm) — Glaswol", type:"select", options:"70;90;120" },
    { key:"power_points", label:"Stroompunten (stuks)", type:"number" },
    { key:"floor_plinth", label:"Vloerplint plaatsen?", type:"switch" },
    { key:"floor_plinth_m1", label:"Vloerplint lengte (m1)", type:"number" },
    { key:"ceiling_plinth", label:"Plafondplint plaatsen?", type:"switch" },
    { key:"ceiling_plinth_m1", label:"Plafondplint lengte (m1)", type:"number" },
    { key:"radiators_reinstall", label:"Radiatoren demonteren + hermonteren?", type:"switch" },
    { key:"radiators_count", label:"Radiatoren (stuks)", type:"number" },
    { key:"windows_count", label:"Kozijnen in gevels (stuks)", type:"number" },
    { key:"jamb_trims_m1", label:"Dagkant betimmering (m1)", type:"number" },
    { key:"window_mouldings_m1", label:"Sierlijsten om kozijnen (m1)", type:"number" },
    { key:"scaffold_needed", label:"Rolsteiger nodig?", type:"switch" },
    { key:"notes", label:"Bijzonderheden", type:"textarea" },
  ]},
  { id:"zoldervloerisolatie", name:"Zoldervloerisolatie", fields:[
    { key:"method", label:"Methode", type:"select", options:"Inblazen;Bovenop los leggen", required:true },
    { key:"overlay_detail", label:"Bovenop: isolatie of ook regelwerk+beplating?", type:"select", options:"Alleen isolatie;Isolatie + regelwerk + beplating" },
    { key:"area_m2", label:"Oppervlakte (m²)", type:"number", required:true },
    { key:"floor_clear", label:"Vloer is vrij (geen spullen)?", type:"switch" },
    { key:"notes", label:"Bijzonderheden", type:"textarea" },
  ]},
  { id:"hellend_dak_binnenuit", name:"Dakisolatie — Hellend (binnenuit, standaard zonder afwerking)", fields:[
    { key:"area_m2", label:"Oppervlakte (m²)", type:"number", required:true },
    { key:"material", label:"Materiaal", type:"select", options:"Gramitherm;Cellulose;Glaswol", required:true },
    { key:"finish_inside", label:"Afwerking toepassen?", type:"switch" },
    { key:"finish_type", label:"Type afwerking", type:"select", options:"Bestaande afwerking;Nieuwe afwerking" },
    { key:"finish_material", label:"Materiaal afwerking", type:"select", options:"Gipsplaten;Elite platen" },
    { key:"finish_dimensions", label:"Afmeting per dakvlak (L x H) + h.o.h. balkmaat", type:"textarea" },
    { key:"demo_needed", label:"Sloopwerk nodig?", type:"switch" },
    { key:"demo_area_m2", label:"Sloop m²", type:"number" },
    { key:"demo_what", label:"Wat slopen?", type:"text" },
    { key:"between_beams", label:"Tussen de balken isoleren", type:"switch" },
    { key:"beams_need_buildup", label:"Balken dik genoeg? zo niet: opdikken", type:"switch" },
    { key:"scaffold_type", label:"Steiger nodig?", type:"select", options:"Geen;Kamersteiger/Rolsteiger;Trapsteiger" },
    { key:"knee_wall_recommended", label:"Knieschot plaatsen (aanbevolen)", type:"switch" },
    { key:"knee_wall_m1", label:"Knieschot lengte (m1)", type:"number" },
    { key:"power_points", label:"Stroompunten aanwezig?", type:"switch" },
    { key:"power_points_count", label:"Aantal stroompunten", type:"number" },
    { key:"ridge_beam_buildup", label:"Nokbalk opdikken?", type:"switch" },
    { key:"around_penetrations", label:"Isoleren rondom doorvoeren?", type:"switch" },
    { key:"attic_access", label:"Toegang zolder", type:"select", options:"Vaste trap;Vlizotrap" },
    { key:"protect_interior", label:"Interieur beschermen met stucloper?", type:"switch" },
    { key:"replace_roof_window", label:"Dakraam vervangen?", type:"switch" },
    { key:"roof_window_size", label:"Dakraam maat", type:"select", options:"55x78;78x98;114x118" },
  ]},
  { id:"plat_dak_buitenaf", name:"Dakisolatie — Plat (buitenaf)", fields:[
    { key:"edge_height_cm", label:"Hoogte dakrand (cm)", type:"number", required:true },
    { key:"area_m2", label:"Oppervlakte (m²)", type:"number", required:true },
    { key:"edge_length_m1", label:"Dakrand lengte (strekkende m)", type:"number", required:true },
    { key:"penetrations", label:"Doorvoeren (stuks)", type:"number" },
    { key:"insulation_thickness_mm", label:"Dikte isolatie (mm)", type:"select", options:"81;142", required:true },
    { key:"ballast_gravel", label:"Ballast grind aanwezig", type:"switch" },
    { key:"roof_cover", label:"Afwerking dakbedekking", type:"select", options:"Bitumen (aanbevolen)*;EPDM;PVC", required:true },
    { key:"notes", label:"Bijzonderheden (lichtkoepels, dakkapellen, obstakels)", type:"textarea" },
  ]},
];

export default function App(){
  return (
    <div className="container">
      <div className="h1">FixjeSubsidie — Basis module</div>
      <div className="muted">Project aanmaken → meerdere maatregelen toevoegen → CSV downloaden</div>
      <hr/>
      <ProjectScreen />
    </div>
  );
}

function ProjectScreen(){
  const [common, setCommon] = useState({});
  const [measures, setMeasures] = useState([]); // {id, defId, data}

  const commonMissing = [
    { key:'advisor_code', label:'Persoonlijke code adviseur' },
    { key:'project_ref', label:'Projectreferentie' },
    { key:'customer_name', label:'Klantnaam' },
  ].filter(f => !common[f.key]);

  const statusComplete = commonMissing.length===0 && measures.length>0 && measures.every(m => isMeasureComplete(m));

  function isMeasureComplete(ms){
    const def = MEASURES.find(d=>d.id===ms.defId);
    if(!def) return false;
    return def.fields.every(f => !f.required || !!ms.data[f.key]);
  }

  const addMeasure = (defId) => { if(defId) setMeasures(m => [{ id: uuidv4(), defId, data: {} }, ...m]); };
  const removeMeasure = (id) => setMeasures(m => m.filter(x=>x.id!==id));
  const setMeasureData = (id, key, value) => setMeasures(m => m.map(x=> x.id===id ? { ...x, data: { ...x.data, [key]: value } } : x));
  const setMeasureDef = (id, defId) => setMeasures(m => m.map(x=> x.id===id ? { ...x, defId, data: {} } : x));

  const rows = useMemo(()=> measures.map(ms => {
    const def = MEASURES.find(d=>d.id===ms.defId);
    return { ...common, measure_type: def?.name, ...ms.data, id: ms.id, createdAt: new Date().toISOString() };
  }), [measures, common]);
  const csv = useMemo(()=> toCSV(rows), [rows]);

  return (
    <div className="grid grid2">
      <div className="card">
        <div className="section-title">Project</div>
        <div>Status: {statusComplete ? <span className="status ok">✅ Compleet</span> : <span className="status warn">⚠️ Onvolledig</span>}</div>
        <div className="grid grid2" style={{marginTop:8}}>
          <div><Label>Persoonlijke code adviseur *</Label><input className="input" value={common.advisor_code||""} onChange={e=>setCommon(p=>({...p, advisor_code:e.target.value}))} /></div>
          <div><Label>Projectreferentie *</Label><input className="input" value={common.project_ref||""} onChange={e=>setCommon(p=>({...p, project_ref:e.target.value}))} /></div>
          <div><Label>Klantnaam *</Label><input className="input" value={common.customer_name||""} onChange={e=>setCommon(p=>({...p, customer_name:e.target.value}))} /></div>
          <div><Label>Adres</Label><input className="input" value={common.customer_address||""} onChange={e=>setCommon(p=>({...p, customer_address:e.target.value}))} /></div>
          <div><Label>E-mail</Label><input className="input" value={common.customer_email||""} onChange={e=>setCommon(p=>({...p, customer_email:e.target.value}))} /></div>
          <div><Label>Telefoon</Label><input className="input" value={common.customer_phone||""} onChange={e=>setCommon(p=>({...p, customer_phone:e.target.value}))} /></div>
          <div style={{gridColumn:"1 / -1"}}><Label>Notities</Label><textarea className="input" value={common.notes||""} onChange={e=>setCommon(p=>({...p, notes:e.target.value}))} /></div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Maatregelen</div>
        <div className="row" style={{marginBottom:8}}>
          <select className="input" onChange={(e)=>{ addMeasure(e.target.value); e.target.value=""; }} defaultValue="">
            <option value="" disabled>Kies maatregel om toe te voegen…</option>
            {MEASURES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <span className="badge">{measures.length} toegevoegd</span>
        </div>
        <div className="list">
          {measures.map(ms => {
            const def = MEASURES.find(d=>d.id===ms.defId);
            return (
              <div className="card" key={ms.id}>
                <div className="row" style={{justifyContent:'space-between', marginBottom:8}}>
                  <strong>{def?.name || "Kies maatregel"}</strong>
                  <div className="row">
                    <select className="input" value={ms.defId} onChange={(e)=> setMeasureDef(ms.id, e.target.value)}>
                      {MEASURES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <button className="btn danger" onClick={()=>removeMeasure(ms.id)}>Verwijder</button>
                  </div>
                </div>
                <div className="grid grid2">
                  {def ? def.fields.map(f => (
                    <div key={f.key} style={{gridColumn: f.type === 'textarea' ? '1 / -1' : 'auto'}}>
                      <Label>{f.label}{f.required ? " *" : ""}</Label>
                      {renderField(f, ms.data[f.key], (val)=> setMeasureData(ms.id, f.key, val))}
                    </div>
                  )) : <div className="muted">Selecteer eerst een maatregel.</div>}
                </div>
              </div>
            );
          })}
          {measures.length===0 && <div className="muted">Nog geen maatregelen toegevoegd. Gebruik de lijst hierboven.</div>}
        </div>
        <div className="row" style={{marginTop:8}}>
          <button className="btn" onClick={()=> downloadFile(`project_${(common.project_ref||'onbekend')}.csv`, csv)} disabled={!statusComplete}>Download project CSV</button>
          {!statusComplete && <div className="muted">Vul eerst alle verplichte velden in.</div>}
        </div>
      </div>
    </div>
  );
}

function renderField(field, value, onChange){
  switch(field.type){
    case "text": return <input className="input" value={value||""} onChange={e=>onChange(e.target.value)} />;
    case "textarea": return <textarea className="input" value={value||""} onChange={e=>onChange(e.target.value)} />;
    case "number": return <input className="input" type="number" value={value||""} onChange={e=>onChange(e.target.value)} />;
    case "select":
      return (
        <select className="input" value={value ?? ""} onChange={e=>onChange(e.target.value)}>
          <option value="" disabled>Maak een keuze…</option>
          {String(field.options||"").split(";").map(o => o.trim()).filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case "switch":
      return (
        <label className="row" style={{gap:6}}>
          <input type="checkbox" checked={!!value} onChange={e=>onChange(e.target.checked)} />
          <span>Ja / Nee</span>
        </label>
      );
    default:
      return <input className="input" value={value||""} onChange={e=>onChange(e.target.value)} />;
  }
}
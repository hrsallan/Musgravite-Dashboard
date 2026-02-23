import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API = "http://localhost:5000/api";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
async function get(path) {
  const r = await fetch(`${API}${path}`);
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

// Hook para buscar dados do backend
function useData(path) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const d = await get(path);
      setData(Array.isArray(d) ? d : []);
    } catch {
      // Não marca como offline aqui — o useAPIStatus cuida disso
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, refetch };
}

// Hook separado que faz PING na /api/status a cada 4s
// → não depende de resultados_analise, então nunca gera falso "offline"
function useAPIStatus() {
  const [online, setOnline] = useState(null); // null = ainda verificando

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3000);
        const r = await fetch(`${API}/status`, { signal: ctrl.signal });
        clearTimeout(timer);
        if (mounted) setOnline(r.ok);
      } catch {
        if (mounted) setOnline(false);
      }
    };

    check();
    const id = setInterval(check, 4000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return online;
}

// ─── CORES POR REGIÃO ─────────────────────────────────────────────────────────
const RC = {
  MANTIQUEIRA:   "#3b82f6",
  "DIVINÓPOLIS": "#10b981",
  "TRIÂNGULO":   "#f59e0b",
};
const rc = (r) => RC[r] || "#64748b";

// ─── ÍCONES SVG ───────────────────────────────────────────────────────────────
const PATHS = {
  dashboard:   "M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9",
  regions:     "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  cities:      "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  upload:      "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
  bar:         "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  table:       "M3 10h18M3 6h18M3 14h18M3 18h18",
  check:       "M5 13l4 4L19 7",
  alert:       "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  refresh:     "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  chevronup:   "M5 15l7-7 7 7",
  chevrondown: "M19 9l-7 7-7-7",
  menu:        "M4 6h16M4 12h16M4 18h16",
  sort:        "M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4",
};

const Icon = ({ name, size = 18, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d={PATHS[name] || ""} />
  </svg>
);

// ─── PRIMITIVOS ───────────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
    <div style={{
      width: 26, height: 26, borderRadius: "50%",
      border: "2px solid #1e3050", borderTop: "2px solid #3b82f6",
      animation: "spin .7s linear infinite",
    }} />
  </div>
);

const Empty = ({ msg }) => (
  <div style={{ textAlign: "center", padding: "36px 0", color: "#2a4060", fontSize: 13 }}>
    <Icon name="table" size={26} color="#152035" style={{ display: "block", margin: "0 auto 10px" }} />
    {msg}
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: "#0d1626", border: "1px solid #152035", borderRadius: 16, padding: 24, ...style }}>
    {children}
  </div>
);

const CardTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: "#c8d8ee" }}>{children}</div>
    {sub && <div style={{ fontSize: 11, color: "#2a4060", marginTop: 3 }}>{sub}</div>}
  </div>
);

const Badge = ({ regiao }) => {
  const color = rc(regiao);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: color + "18", color, fontSize: 10, fontWeight: 700,
      padding: "2px 9px", borderRadius: 99, border: `1px solid ${color}30`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
      {regiao}
    </span>
  );
};

const Metric = ({ label, value, sub, color, icon }) => (
  <div style={{
    background: "#0d1626", border: "1px solid #152035", borderRadius: 16,
    padding: "20px 22px", flex: "1 1 150px",
    transition: "border-color .2s",
  }}
    onMouseEnter={e => e.currentTarget.style.borderColor = color + "60"}
    onMouseLeave={e => e.currentTarget.style.borderColor = "#152035"}>
    <div style={{
      width: 36, height: 36, borderRadius: 10, background: color + "18",
      display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
    }}>
      <Icon name={icon} size={17} color={color} />
    </div>
    <div style={{ fontSize: 26, fontWeight: 800, color: "#e2eaf8", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
      {value}
    </div>
    <div style={{ fontSize: 12, color: "#4a6080", marginTop: 4 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
  </div>
);

// ─── GRÁFICO BARRAS ───────────────────────────────────────────────────────────
const BarChart = ({ data }) => {
  const [hov, setHov] = useState(null);
  if (!data?.length) return <Empty msg="Nenhum dado ainda — faça upload de um relatório" />;
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 24, height: 170 }}>
      {data.map((d, i) => {
        const color = rc(d.regiao);
        const h = Math.max((d.total / max) * 130, 4);
        const isH = hov === i;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, position: "relative" }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
            {isH && (
              <div style={{
                position: "absolute", bottom: h + 38, left: "50%", transform: "translateX(-50%)",
                background: "#0a1220", border: "1px solid #1e3050", borderRadius: 8,
                padding: "5px 12px", whiteSpace: "nowrap", zIndex: 10,
                fontSize: 12, color: "#e2eaf8", fontWeight: 700,
              }}>
                {d.total.toLocaleString("pt-BR")} notas
              </div>
            )}
            <div style={{
              width: "60%", height: h, borderRadius: "6px 6px 0 0",
              background: isH ? color : color + "80",
              boxShadow: isH ? `0 0 20px ${color}55` : "none",
              transition: "all .2s",
            }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: isH ? "#c8d8ee" : "#4a6080", fontWeight: 600 }}>{d.regiao}</div>
              <div style={{ fontSize: 11, color, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                {d.total.toLocaleString("pt-BR")}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── GRÁFICO DONUT ────────────────────────────────────────────────────────────
const DonutChart = ({ data }) => {
  const [hov, setHov] = useState(null);
  if (!data?.length) return <Empty msg="Nenhum dado ainda" />;
  const total = data.reduce((s, d) => s + d.total, 0);
  const R = 54, CX = 68, CY = 68, SW = 20;
  const circ = 2 * Math.PI * R;
  let cum = 0;
  const segs = data.map((d, i) => {
    const pct = total ? d.total / total : 0;
    const off = circ * (1 - cum);
    cum += pct;
    return { ...d, pct, da: `${circ * pct} ${circ * (1 - pct)}`, off, i };
  });
  const hItem = hov !== null ? segs[hov] : null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <svg viewBox="0 0 136 136" style={{ width: 136, height: 136, flexShrink: 0 }}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#152035" strokeWidth={SW} />
        {segs.map(s => (
          <circle key={s.i} cx={CX} cy={CY} r={R} fill="none"
            stroke={rc(s.regiao)} strokeWidth={hov === s.i ? SW + 6 : SW}
            strokeDasharray={s.da} strokeDashoffset={s.off}
            style={{ transform: "rotate(-90deg)", transformOrigin: `${CX}px ${CY}px`, transition: "all .2s", cursor: "pointer" }}
            onMouseEnter={() => setHov(s.i)} onMouseLeave={() => setHov(null)} />
        ))}
        <text x={CX} y={CY - 7} textAnchor="middle" fill="#e2eaf8" fontSize="14" fontWeight="800" fontFamily="system-ui">
          {hItem ? `${(hItem.pct * 100).toFixed(0)}%` : total.toLocaleString("pt-BR")}
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" fill="#4a6080" fontSize="8.5" fontFamily="system-ui" letterSpacing="0.8">
          {hItem ? hItem.regiao.slice(0, 9) : "TOTAL"}
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {segs.map(s => {
          const color = rc(s.regiao);
          return (
            <div key={s.i} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "default" }}
              onMouseEnter={() => setHov(s.i)} onMouseLeave={() => setHov(null)}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", background: color,
                boxShadow: hov === s.i ? `0 0 10px ${color}` : "none", transition: "all .2s",
              }} />
              <span style={{ fontSize: 12, color: hov === s.i ? "#c8d8ee" : "#4a6080" }}>{s.regiao}</span>
              <span style={{ fontSize: 12, color, fontWeight: 800, marginLeft: "auto", paddingLeft: 10, fontVariantNumeric: "tabular-nums" }}>
                {s.total.toLocaleString("pt-BR")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── RANKING ──────────────────────────────────────────────────────────────────
const Ranking = ({ data }) => {
  if (!data?.length) return <Empty msg="Nenhum dado ainda — faça upload de um relatório" />;
  const sorted = [...data].sort((a, b) => b.total - a.total);
  const max = sorted[0].total;
  const tot = sorted.reduce((s, x) => s + x.total, 0);
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {["#", "Região", "Notas", "Participação"].map(h => (
            <th key={h} style={{
              padding: "8px 12px", fontSize: 10, color: "#2a4060", fontWeight: 700,
              textAlign: "left", textTransform: "uppercase", letterSpacing: ".07em",
              borderBottom: "1px solid #0e1c2e",
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((d, i) => {
          const color = rc(d.regiao);
          const pct = tot ? (d.total / tot * 100).toFixed(1) : 0;
          return (
            <tr key={i}
              onMouseEnter={e => e.currentTarget.style.background = "#0e1c2e"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              style={{ transition: "background .15s" }}>
              <td style={{ padding: "13px 12px", borderBottom: "1px solid #0e1c2e18", fontSize: 15 }}>{medals[i] || `#${i + 1}`}</td>
              <td style={{ padding: "13px 12px", borderBottom: "1px solid #0e1c2e18" }}><Badge regiao={d.regiao} /></td>
              <td style={{ padding: "13px 12px", borderBottom: "1px solid #0e1c2e18", color: "#e2eaf8", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                {d.total.toLocaleString("pt-BR")}
              </td>
              <td style={{ padding: "13px 12px", borderBottom: "1px solid #0e1c2e18" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, background: "#0e1c2e", borderRadius: 99, height: 5, maxWidth: 180 }}>
                    <div style={{ width: `${(d.total / max) * 100}%`, height: "100%", background: color, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 11, color, fontWeight: 700, minWidth: 36 }}>{pct}%</span>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

// ─── TABELA CIDADES ───────────────────────────────────────────────────────────
const TabelaCidades = ({ data }) => {
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("TODAS");
  const [sort, setSort]     = useState({ k: "quantidade", d: -1 });
  const [page, setPage]     = useState(0);
  const PER = 10;

  if (!data) return <Spinner />;
  if (!data.length) return <Empty msg="Nenhum resultado ainda. Faça upload de um relatório." />;

  const regioes = ["TODAS", ...Array.from(new Set(data.map(d => d.regiao))).sort()];
  const filtered = data
    .filter(d =>
      (filtro === "TODAS" || d.regiao === filtro) &&
      d.cidade.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (a[sort.k] > b[sort.k] ? sort.d : -sort.d));

  const pages = Math.ceil(filtered.length / PER);
  const paged = filtered.slice(page * PER, page * PER + PER);
  const maxQ  = Math.max(...data.map(d => d.quantidade), 1);
  const totQ  = data.reduce((s, d) => s + d.quantidade, 0);

  const Th = ({ label, k }) => (
    <th onClick={() => { setSort(s => ({ k, d: s.k === k ? -s.d : -1 })); setPage(0); }}
      style={{
        padding: "9px 12px", fontSize: 10, textAlign: "left", cursor: "pointer", userSelect: "none",
        color: sort.k === k ? "#3b82f6" : "#2a4060", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: ".07em", borderBottom: "1px solid #0e1c2e",
      }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {label}
        {sort.k === k
          ? <Icon name={sort.d === -1 ? "chevrondown" : "chevronup"} size={11} color="#3b82f6" />
          : <Icon name="sort" size={9} color="#2a4060" />}
      </span>
    </th>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="Buscar cidade…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          style={{
            flex: 1, minWidth: 200, background: "#080e1a", border: "1px solid #152035",
            borderRadius: 10, color: "#c8d8ee", padding: "8px 14px", fontSize: 13, outline: "none",
          }} />
        <select value={filtro} onChange={e => { setFiltro(e.target.value); setPage(0); }}
          style={{
            background: "#080e1a", border: "1px solid #152035", borderRadius: 10,
            color: "#c8d8ee", padding: "8px 14px", fontSize: 13, outline: "none", cursor: "pointer",
          }}>
          {regioes.map(r => <option key={r} style={{ background: "#0d1626" }}>{r}</option>)}
        </select>
        <span style={{ fontSize: 11, color: "#2a4060" }}>{filtered.length} registros</span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th label="Região" k="regiao" />
              <Th label="Cidade" k="cidade" />
              <Th label="Qtd. Notas" k="quantidade" />
              <th style={{ padding: "9px 12px", borderBottom: "1px solid #0e1c2e", fontSize: 10, color: "#2a4060", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em" }}>Volume</th>
              <th style={{ padding: "9px 12px", borderBottom: "1px solid #0e1c2e", fontSize: 10, color: "#2a4060", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em" }}>% Total</th>
              <Th label="Data Análise" k="data_analise" />
            </tr>
          </thead>
          <tbody>
            {!paged.length
              ? <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#2a4060" }}>Nenhum resultado.</td></tr>
              : paged.map((d, i) => {
                  const color = rc(d.regiao);
                  const pct = (d.quantidade / totQ * 100).toFixed(2);
                  return (
                    <tr key={i}
                      onMouseEnter={e => e.currentTarget.style.background = "#0a1421"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      style={{ transition: "background .1s" }}>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #0e1c2e18" }}><Badge regiao={d.regiao} /></td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #0e1c2e18", color: "#c8d8ee", fontSize: 13 }}>{d.cidade}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #0e1c2e18", color: "#e2eaf8", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                        {d.quantidade.toLocaleString("pt-BR")}
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #0e1c2e18", minWidth: 110 }}>
                        <div style={{ background: "#0e1c2e", borderRadius: 99, height: 5 }}>
                          <div style={{ width: `${(d.quantidade / maxQ) * 100}%`, height: "100%", background: color, borderRadius: 99 }} />
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #0e1c2e18" }}>
                        <span style={{ fontSize: 11, color, fontWeight: 700, background: color + "15", padding: "2px 8px", borderRadius: 99 }}>{pct}%</span>
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #0e1c2e18", color: "#2a4060", fontSize: 12 }}>
                        {d.data_analise ? d.data_analise.split(" ")[0] : "—"}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)} style={{
              width: 28, height: 28, borderRadius: 7, border: "none",
              background: i === page ? "#3b82f6" : "#0e1c2e",
              color: i === page ? "#fff" : "#4a6080",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── UPLOAD PANEL ─────────────────────────────────────────────────────────────
const UploadPanel = ({ onSuccess }) => {
  const [phase, setPhase] = useState("idle"); // idle | drag | sending | ok | err
  const [msg, setMsg]     = useState("");
  const ref = useRef();

  const enviar = async (file) => {
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setPhase("err");
      setMsg("Formato inválido. Use .xlsx, .xls ou .csv.");
      return;
    }

    setPhase("sending");
    setMsg(file.name);

    try {
      // AbortController com timeout de 12s para não travar infinitamente
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);

      const fd = new FormData();
      fd.append("file", file);

      const r = await fetch(`${API}/upload`, {
        method: "POST",
        body: fd,
        signal: ctrl.signal,
      });
      clearTimeout(timer);

      const data = await r.json();
      setPhase("ok");
      setMsg(data.mensagem || `"${file.name}" enviado com sucesso.`);
      // Aguarda 2s para o backend processar em background, depois atualiza dados
      setTimeout(() => onSuccess?.(), 2000);

    } catch (e) {
      if (e.name === "AbortError") {
        setPhase("err");
        setMsg("Tempo limite excedido. Verifique se o backend está rodando em localhost:5000.");
      } else {
        // Falha de rede — backend pode estar offline
        setPhase("err");
        setMsg(`Falha na conexão: ${e.message}. Verifique se o Flask está rodando.`);
      }
    }
  };

  const borderColor = { idle: "#152035", drag: "#3b82f6", sending: "#f59e0b", ok: "#10b981", err: "#f43f5e" }[phase];

  return (
    <div style={{ maxWidth: 580 }}>
      <div
        onClick={() => phase === "idle" && ref.current?.click()}
        onDragOver={e => { e.preventDefault(); if (phase === "idle") setPhase("drag"); }}
        onDragLeave={() => { if (phase === "drag") setPhase("idle"); }}
        onDrop={e => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          setPhase("idle");
          enviar(f);
        }}
        style={{
          border: `2px dashed ${borderColor}`, borderRadius: 16, padding: "44px 24px",
          textAlign: "center", background: phase === "drag" ? "#0d1e36" : "#080e1a",
          cursor: phase === "idle" ? "pointer" : "default", transition: "all .2s",
        }}>
        <input ref={ref} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; enviar(f); }} />

        {phase === "idle" && <>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: "#3b82f618",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
          }}>
            <Icon name="upload" size={22} color="#3b82f6" />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#c8d8ee", marginBottom: 6 }}>
            Arraste o arquivo ou clique para selecionar
          </div>
          <div style={{ fontSize: 12, color: "#2a4060" }}>Suporta .xlsx, .xls, .csv</div>
        </>}

        {phase === "drag" && (
          <div style={{ fontSize: 15, fontWeight: 700, color: "#3b82f6" }}>Solte para enviar</div>
        )}

        {phase === "sending" && <>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", border: "2px solid #1e3050",
            borderTop: "2px solid #f59e0b", animation: "spin .7s linear infinite",
            margin: "0 auto 14px",
          }} />
          <div style={{ fontSize: 13, color: "#f59e0b", marginBottom: 14 }}>Enviando {msg}…</div>
          <div style={{ background: "#152035", borderRadius: 99, height: 4, maxWidth: 240, margin: "0 auto", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#f59e0b", animation: "loadbar 1.1s ease-in-out infinite" }} />
          </div>
        </>}

        {phase === "ok" && <>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", background: "#10b98118",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
          }}>
            <Icon name="check" size={22} color="#10b981" />
          </div>
          <div style={{ fontSize: 13, color: "#10b981", fontWeight: 700, marginBottom: 14 }}>{msg}</div>
          <button onClick={() => { setPhase("idle"); setMsg(""); }} style={{
            background: "transparent", border: "1px solid #152035",
            color: "#4a6080", fontSize: 11, padding: "5px 16px", borderRadius: 99, cursor: "pointer",
          }}>Novo upload</button>
        </>}

        {phase === "err" && <>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", background: "#f43f5e18",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
          }}>
            <Icon name="alert" size={22} color="#f43f5e" />
          </div>
          <div style={{ fontSize: 13, color: "#f43f5e", fontWeight: 600, marginBottom: 14 }}>{msg}</div>
          <button onClick={() => { setPhase("idle"); setMsg(""); }} style={{
            background: "transparent", border: "1px solid #152035",
            color: "#4a6080", fontSize: 11, padding: "5px 16px", borderRadius: 99, cursor: "pointer",
          }}>Tentar novamente</button>
        </>}
      </div>

      <div style={{ marginTop: 14, background: "#080e1a", border: "1px solid #152035", borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 10, color: "#2a4060", fontWeight: 700, letterSpacing: ".06em", marginBottom: 8 }}>ENDPOINT</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "monospace", fontSize: 13 }}>
          <span style={{ background: "#10b98120", color: "#10b981", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800 }}>POST</span>
          <span style={{ color: "#3b82f6" }}>http://localhost:5000/api/upload</span>
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: "#2a4060", lineHeight: 1.8 }}>
          Salva em <code style={{ color: "#3b82f6", background: "#0d1626", padding: "1px 5px", borderRadius: 4 }}>backend/data/uploads/</code> e processa via{" "}
          <code style={{ color: "#3b82f6", background: "#0d1626", padding: "1px 5px", borderRadius: 4 }}>analiseDADOS.processar_arquivo()</code>.{" "}
          Hash SHA-256 evita reprocessamento do mesmo arquivo.
        </div>
      </div>
    </div>
  );
};

// ─── NAVEGAÇÃO ────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard",  icon: "dashboard" },
  { id: "regioes",   label: "Por Região", icon: "regions"   },
  { id: "cidades",   label: "Por Cidade", icon: "cities"    },
  { id: "upload",    label: "Importar",   icon: "upload"    },
];

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [section, setSection] = useState("dashboard");
  const [sidebar, setSidebar] = useState(true);

  const regioes   = useData("/notas/regioes");
  const cidades   = useData("/notas/detalhado");
  const apiOnline = useAPIStatus(); // polling independente — não depende de tabelas existirem

  const totalNotas   = cidades.data?.reduce((s, d) => s + d.quantidade, 0) ?? 0;
  const totalCidades = cidades.data?.length ?? 0;
  const maiorRegiao  = regioes.data?.length
    ? [...regioes.data].sort((a, b) => b.total - a.total)[0]
    : null;

  const onUpload = useCallback(() => {
    setTimeout(() => { regioes.refetch(); cidades.refetch(); }, 2200);
  }, [regioes, cidades]);

  const semDados = !cidades.loading && cidades.data?.length === 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080c14", color: "#c8d8ee", fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800&display=swap');
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes loadbar { 0%{width:0;margin-left:0} 50%{width:55%;margin-left:20%} 100%{width:0;margin-left:100%} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input,select,button { font-family: inherit; }
        input::placeholder { color: #2a4060 !important; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #080c14; }
        ::-webkit-scrollbar-thumb { background: #152035; border-radius: 10px; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebar ? 220 : 60, flexShrink: 0, overflow: "hidden",
        transition: "width .28s cubic-bezier(.4,0,.2,1)",
        background: "#0a1020", borderRight: "1px solid #0e1c2e",
        display: "flex", flexDirection: "column", padding: "20px 0",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px 18px", borderBottom: "1px solid #0e1c2e", marginBottom: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px #3b82f630",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
              <polygon points="12,2 22,8 12,10 2,8"  fill="#ffffff28" stroke="#fff" strokeWidth="1" strokeLinejoin="round"/>
              <polygon points="12,10 22,8 22,16 12,22" fill="#ffffff14" stroke="#fff" strokeWidth="1" strokeLinejoin="round"/>
              <polygon points="12,10 2,8 2,16 12,22"  fill="#ffffff1e" stroke="#fff" strokeWidth="1" strokeLinejoin="round"/>
            </svg>
          </div>
          {sidebar && <span style={{ fontWeight: 800, fontSize: 15, color: "#e2eaf8", whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>Musgravite</span>}
        </div>

        {/* Itens de nav */}
        {NAV.map(n => {
          const active = section === n.id;
          return (
            <button key={n.id} onClick={() => setSection(n.id)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 14px", margin: "1px 8px", borderRadius: 10,
              border: "none", cursor: "pointer",
              background: active ? "#3b82f618" : "transparent",
              borderLeft: active ? "2px solid #3b82f6" : "2px solid transparent",
              color: active ? "#3b82f6" : "#2a4060",
              transition: "all .15s", whiteSpace: "nowrap",
              width: sidebar ? "calc(100% - 16px)" : 44,
              justifyContent: sidebar ? "flex-start" : "center",
            }}>
              <Icon name={n.icon} size={17} color={active ? "#3b82f6" : "#2a4060"} style={{ flexShrink: 0 }} />
              {sidebar && <span style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{n.label}</span>}
            </button>
          );
        })}

        {/* Status da API — baseado no hook de polling, nunca em dados da tabela */}
        {sidebar && (
          <div style={{ marginTop: "auto", padding: "0 14px" }}>
            <div style={{
              background: apiOnline === false ? "#f43f5e0d" : "#10b9810d",
              border: `1px solid ${apiOnline === false ? "#f43f5e20" : "#10b98120"}`,
              borderRadius: 10, padding: "10px 12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: apiOnline === null ? "#4a6080" : apiOnline ? "#10b981" : "#f43f5e",
                  // pulsa quando online
                  boxShadow: apiOnline ? "0 0 6px #10b981" : "none",
                }} />
                <span style={{ fontSize: 11, color: apiOnline === null ? "#4a6080" : apiOnline ? "#10b981" : "#f43f5e", fontWeight: 700 }}>
                  {apiOnline === null ? "Verificando…" : apiOnline ? "API conectada" : "API offline"}
                </span>
              </div>
              <div style={{ fontSize: 10, color: "#2a4060" }}>localhost:5000</div>
            </div>
          </div>
        )}
      </aside>

      {/* ── CONTEÚDO ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        {/* Topbar */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "13px 28px", borderBottom: "1px solid #0e1c2e",
          background: "#080c14", position: "sticky", top: 0, zIndex: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setSidebar(s => !s)} style={{
              background: "#0d1626", border: "1px solid #152035", borderRadius: 9,
              padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center",
            }}>
              <Icon name="menu" size={16} color="#4a6080" />
            </button>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#e2eaf8", letterSpacing: "-0.02em" }}>
                {NAV.find(n => n.id === section)?.label}
              </div>
              <div style={{ fontSize: 11, color: "#2a4060", marginTop: 1 }}>
                Notas fiscais · Mantiqueira · Divinópolis · Triângulo Mineiro
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => { regioes.refetch(); cidades.refetch(); }} style={{
              background: "#0d1626", border: "1px solid #152035", borderRadius: 9,
              padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center",
            }}>
              <Icon name="refresh" size={15} color="#2a4060" />
            </button>
            <button onClick={() => setSection("upload")} style={{
              display: "flex", alignItems: "center", gap: 7,
              background: "#3b82f6", border: "none", borderRadius: 10,
              padding: "8px 16px", color: "#fff", fontSize: 12, fontWeight: 700,
              cursor: "pointer", boxShadow: "0 2px 14px #3b82f630",
            }}>
              <Icon name="upload" size={14} color="#fff" />
              Importar Relatório
            </button>
          </div>
        </header>

        <main style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── DASHBOARD ── */}
          {section === "dashboard" && <>
            {semDados && (
              <div style={{
                background: "#1a1000", border: "1px solid #f59e0b30", borderRadius: 14,
                padding: "14px 18px", display: "flex", alignItems: "center", gap: 12,
              }}>
                <Icon name="alert" size={18} color="#f59e0b" />
                <span style={{ fontSize: 13 }}>
                  <strong style={{ color: "#f59e0b" }}>Nenhuma análise encontrada.</strong>
                  <span style={{ color: "#6a5020" }}> Faça upload de um relatório para visualizar os dados.</span>
                </span>
                <button onClick={() => setSection("upload")} style={{
                  marginLeft: "auto", background: "#f59e0b20", border: "1px solid #f59e0b40",
                  color: "#f59e0b", fontSize: 11, fontWeight: 700, padding: "5px 14px",
                  borderRadius: 99, cursor: "pointer", whiteSpace: "nowrap",
                }}>Importar agora</button>
              </div>
            )}

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Metric label="Total de Notas" icon="bar" color="#3b82f6"
                value={cidades.loading ? "…" : totalNotas.toLocaleString("pt-BR")}
                sub={maiorRegiao ? `Maior: ${maiorRegiao.regiao}` : "Aguardando análise"} />
              <Metric label="Regiões" icon="regions" color="#10b981"
                value={regioes.loading ? "…" : (regioes.data?.length || 3)}
                sub="Mantiqueira · Divinópolis · Triângulo" />
              <Metric label="Cidades com Notas" icon="cities" color="#f59e0b"
                value={cidades.loading ? "…" : totalCidades}
                sub="Municípios de Minas Gerais" />
              <Metric label="Localidades Cadastradas" icon="table" color="#a78bfa"
                value="245" sub="Base de referência no banco" />
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Card style={{ flex: "1 1 280px" }}>
                <CardTitle sub="Volume de notas por região">Distribuição por Região</CardTitle>
                {regioes.loading ? <Spinner /> : <BarChart data={regioes.data} />}
              </Card>
              <Card style={{ flex: "1 1 240px" }}>
                <CardTitle sub="Participação percentual">Composição</CardTitle>
                {regioes.loading ? <Spinner /> : <DonutChart data={regioes.data} />}
              </Card>
            </div>

            <Card>
              <CardTitle sub="Ranking por volume">Ranking de Regiões</CardTitle>
              {regioes.loading ? <Spinner /> : <Ranking data={regioes.data} />}
            </Card>
          </>}

          {/* ── POR REGIÃO ── */}
          {section === "regioes" && <>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Card style={{ flex: "1 1 280px" }}>
                <CardTitle sub="Comparativo entre regiões">Volume por Região</CardTitle>
                {regioes.loading ? <Spinner /> : <BarChart data={regioes.data} />}
              </Card>
              <Card style={{ flex: "1 1 240px" }}>
                <CardTitle sub="Participação percentual">Composição</CardTitle>
                {regioes.loading ? <Spinner /> : <DonutChart data={regioes.data} />}
              </Card>
            </div>
            <Card>
              <CardTitle sub="Ranking completo">Tabela de Regiões</CardTitle>
              {regioes.loading ? <Spinner /> : <Ranking data={regioes.data} />}
            </Card>
          </>}

          {/* ── POR CIDADE ── */}
          {section === "cidades" && (
            <Card>
              <CardTitle sub="Busque, filtre e ordene por município">Por Cidade</CardTitle>
              <TabelaCidades data={cidades.data} />
            </Card>
          )}

          {/* ── UPLOAD ── */}
          {section === "upload" && (
            <Card style={{ maxWidth: 640 }}>
              <CardTitle sub="Envie um relatório .xlsx para atualizar o banco">Importar Relatório</CardTitle>
              <UploadPanel onSuccess={onUpload} />
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}

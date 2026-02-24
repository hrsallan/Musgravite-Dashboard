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

function useData(path) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const d = await get(path);
      setData(Array.isArray(d) ? d : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, refetch };
}

function useAPIStatus() {
  const [online, setOnline] = useState(null);
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const r = await fetch(`${API}/status`);
        if (mounted) setOnline(r.ok);
      } catch {
        if (mounted) setOnline(false);
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, []);
  return online;
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

const RC = { 
  MANTIQUEIRA: "#3b82f6", 
  "DIVINÓPOLIS": "#10b981", 
  "TRIÂNGULO": "#f59e0b",
  "TRIÂNGULO MINEIRO": "#f59e0b" 
};
const rc = (r) => RC[r?.toUpperCase()] || "#64748b";

const PATHS = {
  upload: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
  bar: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  cities: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  grid: "M3 3h7v7H3zm11 0h7v7h-7zm0 11h7v7h-7zm-11 0h7v7H3z",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
};

const Icon = ({ name, size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={PATHS[name] || ""} /></svg>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: "rgba(13, 22, 38, 0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "24px", ...style }}>{children}</div>
);

const Metric = ({ label, value, color, icon }) => (
  <div style={{ background: "linear-gradient(135deg, rgba(15, 23, 42, 0.5) 0%, rgba(2, 6, 23, 0.7) 100%)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", padding: "24px", flex: "1 1 200px", position: "relative", overflow: "hidden" }}>
    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${color}25`, marginBottom: "16px" }}>
      <Icon name={icon} color={color} size={22} />
    </div>
    <div style={{ fontSize: "32px", fontWeight: "800", color: "#fff", letterSpacing: "-1px" }}>{value}</div>
    <div style={{ fontSize: "12px", fontWeight: "600", color: "#475569", textTransform: "uppercase" }}>{label}</div>
    <div style={{ position: "absolute", bottom: "-20px", right: "-20px", width: "100px", height: "100px", background: color, filter: "blur(60px)", opacity: 0.1 }}></div>
  </div>
);

export default function App() {
  const [search, setSearch] = useState("");
  const [filtroRegiao, setFiltroRegiao] = useState("VISÃO GERAL");
  const fileRef = useRef();
  const now = useClock();

  const regioes = useData("/notas/regioes");
  const cidades = useData("/notas/detalhado");
  const apiOnline = useAPIStatus();

  const normalizedRegion = (r) => r?.toUpperCase() === "TRIÂNGULO MINEIRO" ? "TRIÂNGULO" : r?.toUpperCase();
  
  const cidadesFiltradas = cidades.data?.filter(c => {
    const matchBusca = c.cidade.toLowerCase().includes(search.toLowerCase());
    const matchRegiao = filtroRegiao === "VISÃO GERAL" || normalizedRegion(c.regiao) === normalizedRegion(filtroRegiao);
    return matchBusca && matchRegiao;
  }) || [];

  const totalNotas = cidadesFiltradas.reduce((s, d) => s + d.quantidade, 0) ?? 0;
  const totalCidades = cidadesFiltradas.length;

  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>

      {/* HEADER ATUALIZADO */}
      <header style={{ padding: "15px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(2, 6, 23, 0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid #1e293b", position: "sticky", top: 0, zIndex: 100 }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg, #3b82f6, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(59, 130, 246, 0.4)" }}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" stroke="#fff" strokeWidth="2" strokeLinejoin="round" fill="none"/>
              <polygon points="12,2 22,8 12,10 2,8" fill="#ffffff28" stroke="#fff" strokeWidth="1" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: "800", fontSize: "20px", letterSpacing: "-0.5px", color: "#fff" }}>Musgravite</span>
          
          <div style={{ marginLeft: "10px", padding: "6px 12px", background: apiOnline ? "rgba(16, 185, 129, 0.1)" : "rgba(244, 63, 94, 0.1)", borderRadius: "10px", border: `1px solid ${apiOnline ? "#10b98130" : "#f43f5e30"}`, display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: apiOnline ? "#10b981" : "#f43f5e", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "10px", fontWeight: "800", color: apiOnline ? "#10b981" : "#f43f5e" }}>{apiOnline ? "ONLINE" : "OFFLINE"}</span>
          </div>
        </div>

        {/* ORDEM INVERTIDA: DATA À ESQUERDA, FILTRO À DIREITA */}
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.03)", padding: "8px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <Icon name="clock" size={16} color="#3b82f6" />
            <div style={{ textAlign: "left", lineHeight: "1" }}>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#fff", fontFamily: "monospace" }}>
                {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div style={{ fontSize: "9px", fontWeight: "600", color: "#475569", textTransform: "uppercase", marginTop: "2px" }}>
                {now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
            </div>
          </div>

          <select 
            value={filtroRegiao} 
            onChange={(e) => setFiltroRegiao(e.target.value)}
            style={{ background: "#0f172a", border: "1px solid #3b82f650", color: "#3b82f6", padding: "8px 15px", borderRadius: "10px", fontWeight: "700", outline: "none", cursor: "pointer" }}
          >
            <option value="VISÃO GERAL">VISÃO GERAL</option>
            <option value="MANTIQUEIRA">MANTIQUEIRA</option>
            <option value="TRIÂNGULO MINEIRO">TRIÂNGULO MINEIRO</option>
            <option value="DIVINÓPOLIS">DIVINÓPOLIS</option>
          </select>
        </div>
      </header>

      <main style={{ padding: "40px" }}>
        <div style={{ maxWidth: "1600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "30px" }}>
          
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <Metric label="Notas Totais" icon="bar" color="#3b82f6" value={totalNotas.toLocaleString()} />
            <Metric label="Cidades" icon="cities" color="#f59e0b" value={totalCidades} />
            <Metric label="Regiões Carregadas" icon="grid" color="#10b981" value={filtroRegiao === "VISÃO GERAL" ? (regioes.data?.length || 0) : "1"} />
            <Metric label="Localidades" icon="upload" color="#a78bfa" value="245" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "24px" }}>
            
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "800" }}>DETALHAMENTO POR CIDADE</h3>
                <input placeholder="Buscar cidade..." onChange={e => setSearch(e.target.value)} style={{ background: "#0f172a", border: "1px solid #1e293b", padding: "10px 16px", borderRadius: "12px", color: "#fff", outline: "none", fontSize: "13px" }} />
              </div>
              <div style={{ maxHeight: "550px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", fontSize: "11px", color: "#475569", textTransform: "uppercase", letterSpacing: "1px" }}>
                      <th style={{ padding: "12px" }}>Região</th>
                      <th>Cidade</th>
                      <th>Notas</th>
                      <th style={{ textAlign: "right" }}>Data Análise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cidadesFiltradas.length > 0 ? cidadesFiltradas.map((c, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(59, 130, 246, 0.05)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "16px 12px" }}><span style={{ color: rc(c.regiao), fontWeight: "800", fontSize: "12px" }}>{c.regiao}</span></td>
                        <td style={{ fontSize: "14px", fontWeight: "600" }}>{c.cidade}</td>
                        <td style={{ fontSize: "14px", fontWeight: "800" }}>{c.quantidade}</td>
                        <td style={{ textAlign: "right", color: "#ff4d4d", fontWeight: "800", fontSize: "13px" }}>{c.data_analise?.split(" ")[0]}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" style={{ padding: "20px", textAlign: "center", color: "#475569" }}>Nenhum dado encontrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <Card>
                <h3 style={{ fontSize: "15px", fontWeight: "800", marginBottom: "20px" }}>RANKING DE VOLUME</h3>
                {regioes.data?.sort((a,b) => b.total - a.total).map((r, i) => (
                  <div key={i} style={{ marginBottom: "18px", opacity: (filtroRegiao === "VISÃO GERAL" || normalizedRegion(r.regiao) === normalizedRegion(filtroRegiao)) ? 1 : 0.3 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                      <span style={{ fontWeight: "700", color: "#94a3b8" }}>{r.regiao}</span>
                      <span style={{ fontWeight: "800", color: rc(r.regiao) }}>{r.total}</span>
                    </div>
                    <div style={{ height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", overflow: "hidden" }}>
                      <div style={{ width: `${(r.total / Math.max(...regioes.data.map(x => x.total))) * 100}%`, height: "100%", background: rc(r.regiao), borderRadius: "10px", boxShadow: `0 0 10px ${rc(r.regiao)}60` }} />
                    </div>
                  </div>
                ))}
              </Card>

              <Card style={{ textAlign: "center", padding: "40px 24px", border: "2px dashed #1e293b", background: "transparent" }}>
                <Icon name="upload" size={32} color="#3b82f6" />
                <h4 style={{ fontSize: "16px", fontWeight: "800", margin: "15px 0 10px" }}>ATUALIZAÇÃO DE BASE</h4>
                <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px" }}>Suba novos relatórios para processamento.</p>
                <button onClick={() => fileRef.current?.click()} style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", border: "1px solid #3b82f630", padding: "12px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", width: "100%" }}>IMPORTAR RELATÓRIO</button>
                <input type="file" ref={fileRef} style={{ display: "none" }} accept=".xlsx,.xls,.csv" />
              </Card>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Complete Responsive Architecture & Sidebar Spill Fix ──────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #0a0a0f;
    --ink-2: #1a1a24;
    --ink-3: #2a2a38;
    --surface: #f4f3ef;
    --surface-2: #eceae4;
    --surface-3: #e2e0d8;
    --accent: #e8501a;
    --accent-2: #f07244;
    --accent-muted: rgba(232,80,26,0.12);
    --teal: #1a8c7a;
    --teal-muted: rgba(26,140,122,0.12);
    --gold: #c9a227;
    --gold-muted: rgba(201,162,39,0.12);
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 16px;
    --font-heading: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    --font-mono: 'DM Mono', monospace;
  }

  body {
    background-color: var(--surface);
    color: var(--ink);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  /* Structural Viewport Layout Shell */
  .app-shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    width: 100vw;
    position: relative;
  }

  @media (min-width: 768px) {
    .app-shell {
      flex-direction: row;
      height: 100vh;
      overflow: hidden;
    }
  }

  /* Fixed Mobile Top Control Banner */
  .mobile-top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--ink);
    color: #fff;
    padding: 14px 20px;
    z-index: 100;
    position: sticky;
    top: 0;
    border-bottom: 1px solid var(--ink-2);
  }

  @media (min-width: 768px) {
    .mobile-top-bar {
      display: none;
    }
  }

  .mobile-brand-title {
    font-family: var(--font-heading);
    font-weight: 800;
    text-transform: uppercase;
    color: var(--surface);
    letter-spacing: -0.5px;
    font-size: 1.15rem;
  }

  .mobile-hamburger-btn {
    background: transparent;
    border: none;
    color: var(--surface-2);
    cursor: pointer;
    font-size: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
  }

  /* Left-Hand Master Workspace Control Sidebar */
  .sidebar {
    width: 260px;
    background-color: var(--ink);
    color: #fff;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--ink-2);
    z-index: 95;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 260px;
  }

  @media (max-width: 767px) {
    .sidebar {
      position: fixed;
      top: 54px; 
      bottom: 0;
      left: 0;
      transform: translateX(-100%);
    }
    .sidebar.mobile-open {
      transform: translateX(0);
    }
  }

  @media (min-width: 768px) {
    .sidebar {
      height: 100%;
      position: relative;
      transform: none;
    }
  }

  /* ─── FIXED SIDEBAR LOGO SPAN CONSTRAINTS ─── */
  .sidebar-logo {
    padding: 32px 20px;
    border-bottom: 1px solid var(--ink-2);
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
  }

  .logo-mark {
    font-family: var(--font-heading);
    font-weight: 800;
    font-size: 1.45rem;
    letter-spacing: -0.5px;
    color: var(--accent);
    text-transform: uppercase;
    word-break: break-all;
    overflow-wrap: break-word;
    max-width: 100%;
    display: block;
  }

  .logo-sub {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 1px;
    color: var(--surface-3);
    margin-top: 6px;
    opacity: 0.6;
    word-break: break-all;
    overflow-wrap: break-word;
    max-width: 100%;
    display: block;
    line-height: 1.2;
  }

  .nav-section-label {
    padding: 24px 20px 8px 20px;
    font-family: var(--font-heading);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--ink-3);
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    background: transparent;
    border: none;
    color: var(--surface-2);
    font-family: var(--font-body);
    font-size: 13.5px;
    font-weight: 500;
    text-align: left;
    width: 100%;
    cursor: pointer;
    transition: all 0.2s;
    border-left: 3px solid transparent;
  }

  .nav-item:hover {
    background-color: var(--ink-2);
    color: #fff;
  }

  .nav-item.active {
    background-color: var(--ink-2);
    color: var(--accent);
    border-left-color: var(--accent);
    font-weight: 600;
  }

  .nav-icon {
    font-size: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
  }

  .sidebar-footer {
    margin-top: auto;
    padding: 20px;
    border-top: 1px solid var(--ink-2);
    background-color: #06060a;
    width: 100%;
    overflow: hidden;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--teal);
    box-shadow: 0 0 8px var(--teal);
    display: inline-block;
    flex-shrink: 0;
  }

  .status-label {
    font-family: var(--font-mono);
    font-size: 9.5px;
    letter-spacing: 0.5px;
    color: var(--surface-3);
    opacity: 0.6;
    margin-left: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Responsive Scrollable Container Window */
  .main-content {
    flex: 1;
    padding: 24px 16px;
    overflow-y: auto;
    width: 100%;
    min-width: 0; 
  }

  @media (min-width: 768px) {
    .main-content {
      padding: 40px;
      height: 100%;
    }
  }

  .content-max-container {
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }

  /* Screen Dismissal Drop Shade */
  .sidebar-backdrop {
    position: fixed;
    inset: 0;
    top: 54px;
    background-color: rgba(0,0,0,0.4);
    backdrop-filter: blur(2px);
    z-index: 80;
  }

  @media (min-width: 768px) {
    .sidebar-backdrop {
      display: none;
    }
  }

  /* Header Components Typography */
  .page-header {
    margin-bottom: 24px;
  }

  @media (min-width: 768px) {
    .page-header {
      margin-bottom: 40px;
    }
  }

  .page-title {
    font-family: var(--font-heading);
    font-weight: 800;
    font-size: 1.75rem;
    letter-spacing: -0.5px;
    text-transform: uppercase;
    line-height: 1.1;
  }

  @media (min-width: 768px) {
    .page-title {
      font-size: 2.25rem;
    }
  }

  .page-subtitle {
    font-size: 14px;
    color: #66625c;
    margin-top: 6px;
    line-height: 1.4;
  }

  /* Performance Telemetry Grid Engine */
  .metrics-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 24px;
  }

  @media (min-width: 500px) {
    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .metrics-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .metric-card {
    background-color: #fff;
    border: 1px solid var(--surface-3);
    border-radius: var(--radius-md);
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .metric-label {
    font-family: var(--font-heading);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #88847d;
  }

  .metric-value {
    font-family: var(--font-mono);
    font-size: 1.85rem;
    font-weight: 400;
    color: var(--ink);
    margin: 10px 0;
    line-height: 1;
  }

  .metric-badge {
    align-self: flex-start;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: var(--radius-sm);
    text-transform: uppercase;
  }

  .badge-emerald { color: var(--teal); background-color: var(--teal-muted); }
  .badge-amber { color: var(--gold); background-color: var(--gold-muted); }
  .badge-rose { color: var(--accent); background-color: var(--accent-muted); }

  /* Flex Split Columns Workspaces */
  .dashboard-split-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
    margin-bottom: 24px;
  }

  @media (min-width: 1024px) {
    .dashboard-split-layout {
      grid-template-columns: 7fr 5fr;
    }
  }

  /* Box Panel Cards Containers */
  .ui-card {
    background-color: #fff;
    border: 1px solid var(--surface-3);
    border-radius: var(--radius-md);
    overflow: hidden;
    width: 100%;
    min-width: 0;
  }

  .ui-card-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--surface-3);
    background-color: #faf9f6;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .ui-card-title {
    font-family: var(--font-heading);
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .ui-card-body {
    padding: 20px;
    width: 100%;
  }

  /* File System Drag Drop Frame Elements */
  .drop-zone {
    border: 2px dashed var(--surface-3);
    border-radius: var(--radius-md);
    padding: 40px 16px;
    text-align: center;
    background-color: #faf9f6;
    cursor: pointer;
    transition: all 0.2s;
  }

  @media (min-width: 768px) {
    .drop-zone {
      padding: 60px 32px;
    }
  }

  .drop-zone:hover {
    border-color: var(--accent);
    background-color: var(--accent-muted);
  }

  .upload-icon {
    font-size: 36px;
    margin-bottom: 12px;
    display: block;
  }

  .btn-primary {
    background-color: var(--accent);
    color: #fff;
    border: none;
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 10px 20px;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .btn-primary:hover {
    background-color: var(--accent-2);
  }

  /* Linear Field Tracking Progress Indicators */
  .progress-row {
    margin-bottom: 16px;
  }
  .progress-row:last-child { margin-bottom: 0; }

  .progress-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 6px;
    gap: 8px;
  }
  .progress-track {
    width: 100%;
    height: 6px;
    background-color: var(--surface-2);
    border-radius: 3px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    border-radius: 3px;
  }

  /* Metadata Flex Grid Form Fields Row Wrapping */
  .metadata-grid {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .metadata-item {
    display: flex;
    flex-direction: column; 
    padding: 14px 0;
    border-bottom: 1px solid var(--surface-2);
    width: 100%;
    min-width: 0;
    gap: 4px;
  }

  @media (min-width: 640px) {
    .metadata-item {
      flex-direction: row; 
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
    }
  }

  .metadata-item:last-child { 
    border-bottom: none; 
  }

  .metadata-label {
    font-size: 11px;
    font-weight: 700;
    color: #88847d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    flex-shrink: 0; 
    width: auto;
  }

  @media (min-width: 640px) {
    .metadata-label {
      width: 180px; 
    }
  }

  .metadata-value {
    font-size: 13.5px;
    color: var(--ink);
    font-weight: 500;
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: normal; 
    min-width: 0;
    width: 100%;
  }

  @media (min-width: 640px) {
    .metadata-value {
      text-align: right;
    }
  }

  /* Financial Overview Display Boxes */
  .balance-card {
    background-color: var(--ink);
    color: #fff;
    padding: 20px;
    border-radius: var(--radius-md);
    font-family: var(--font-mono);
    width: 100%;
  }

  .balance-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    padding: 8px 0;
    color: var(--surface-3);
    opacity: 0.8;
    gap: 12px;
  }

  .balance-total-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-top: 14px;
    margin-top: 14px;
    border-top: 1px solid var(--ink-3);
    gap: 12px;
  }

  .balance-total-label {
    font-family: var(--font-heading);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    color: #fff;
  }

  .balance-total-value {
    font-size: 1.6rem;
    font-weight: 500;
    color: var(--accent);
  }

  /* Touch Swipe Navigation Table Components */
  .table-scroll-wrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border: 1px solid var(--surface-2);
    border-radius: var(--radius-sm);
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 13px;
    min-width: 720px; 
  }

  .data-table th {
    background-color: #faf9f6;
    padding: 12px 14px;
    font-family: var(--font-heading);
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #88847d;
    border-bottom: 1px solid var(--surface-2);
  }

  .data-table td {
    padding: 12px 14px;
    border-bottom: 1px solid var(--surface-2);
    color: var(--ink-2);
  }

  .data-table tr:last-child td { border-bottom: none; }
  .data-table tr:hover td { background-color: #faf9f6; }

  .text-right { text-align: right; }
  .text-center { text-align: center; }

  .swipe-hint {
    display: block;
    text-align: center;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    color: #88847d;
    letter-spacing: 0.5px;
    margin-top: 8px;
    background-color: var(--surface-2);
    padding: 5px;
    border-radius: var(--radius-sm);
  }

  @media (min-width: 768px) {
    .swipe-hint { display: none; }
  }

  /* Messaging Feedback Banner Layout Blocks */
  .validation-alert-box {
    display: flex;
    gap: 12px;
    padding: 14px;
    border-radius: var(--radius-md);
    margin-bottom: 24px;
    font-size: 13px;
    line-height: 1.4;
  }

  .alert-box-success {
    background-color: var(--teal-muted);
    border: 1px solid rgba(26,140,122,0.2);
    color: #0e5247;
  }

  .alert-box-error {
    background-color: var(--accent-muted);
    border: 1px solid rgba(232,80,26,0.2);
    color: #8c2a08;
  }

  .alert-box-icon { font-size: 16px; flex-shrink: 0; }
  .alert-box-title { font-weight: 700; text-transform: uppercase; font-size: 11px; margin-bottom: 2px; }
`;

// ─── Data Static Objects Manifest Definitions ──────────────────────────────
const NAV = [
  { id: "upload", label: "Extract Documents", icon: "📄" },
  { id: "dashboard", label: "Telemetry Metrics", icon: "📈" },
  { id: "history", label: "Pipeline History", icon: "⏳" },
];

const METRICS_MOCK = {
  accuracy: "94.0%",
  mae: "0.260",
  f1: "65.6%",
  latency: "0.705s",
  fields: [
    { name: "Invoice Number Token Precision", score: 100 },
    { name: "Issue Date Spatial Integrity", score: 97.9 },
    { name: "Currency Syntax Extraction", score: 91.5 },
    { name: "Subtotal Value Matching", score: 53.7 },
    { name: "Tax Amount Accumulations", score: 54.3 },
    { name: "Total Financial Value Parsing", score: 44.3 },
    { name: "Payment Terms Validation", score: 97.9 },
  ]
};

const HISTORY_MOCK = [
  { id: "doc_0492", type: "multiple_invoices", count: 2, speed: "0.68s", status: "Validated" },
  { id: "doc_0493", type: "single_invoice", count: 1, speed: "0.42s", status: "Healed" },
  { id: "doc_0494", type: "invoice_with_extra_pages", count: 1, speed: "1.12s", status: "Mismatch" },
  { id: "doc_0495", type: "repeated_invoice_copy", count: 3, speed: "0.89s", status: "Validated" },
  { id: "doc_0496", type: "non_invoice_document", count: 0, speed: "0.31s", status: "Filtered" },
];

// ─── Core Controller Engine Shell Frame ─────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("upload");
  const [result, setResult] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const sheet = document.createElement("style");
    sheet.innerText = css;
    document.head.appendChild(sheet);
    return () => document.head.removeChild(sheet);
  }, []);

  const handleResult = (data) => {
    setResult(data);
    setPage("result");
    setMobileMenuOpen(false);
  };

  const navigateTo = (pageId) => {
    setPage(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-shell">
      {/* Mobile Sticky Navigation Menu Header */}
      <header className="mobile-top-bar">
        <div className="mobile-brand-title">Compylance</div>
        <button 
          className="mobile-hamburger-btn" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Control Panel"
        >
          <span>{mobileMenuOpen ? "✕" : "☰"}</span>
        </button>
      </header>

      {/* Dismissal Drop Overlay Context Mask */}
      {mobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Main Structural System Navigation Drawer Container */}
      <nav className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">InvoiceIQ</div>
          <div className="logo-sub">INVOICE INTELLIGENCE</div>
        </div>

        <div className="nav-section-label">Main Tasks</div>
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`nav-item ${page === n.id || (n.id === "upload" && page === "result") ? "active" : ""}`}
            onClick={() => navigateTo(n.id)}
          >
            <span className="nav-icon">{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}

        <div className="sidebar-footer">
          <div style={{ display: "flex", alignItems: "center" }}>
            <span className="status-dot" />
            <span className="status-label">API PIPELINE RUNNING</span>
          </div>
        </div>
      </nav>

      {/* Content Rendering Display Window */}
      <main className="main-content">
        <div className="content-max-container">
          {page === "upload"    && <UploadPage onResult={handleResult} />}
          {page === "result"    && result && <ResultPage result={result} onBack={() => setPage("upload")} />}
          {page === "dashboard" && <DashboardPage />}
          {page === "history"   && <HistoryPage onViewResult={handleResult} />}
        </div>
      </main>
    </div>
  );
}

// ─── Workspace Component A: Dropzone Document Upload Handling View ─────────
function UploadPage({ onResult }) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const simulateProcessingPipeline = (fileName) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onResult({
        document_id: "doc_gt_9942",
        document_type: "single_invoice",
        invoice_count: 1,
        invoices: [
          {
            invoice_id: "inv_alpha_01",
            invoice_number: "INV-2026-8840",
            seller_name: "GLOBAL INFRASTRUCTURE LOGISTICS SOLUTIONS INTERNATIONAL INC",
            buyer_name: "COMPYLANCE CORE TESTING AUTOMATION LABS DEPLOYMENT LLC",
            issue_date: "2026-04-18",
            currency: "USD",
            subtotal: 12500.00,
            tax_amount: 1250.00,
            discount_amount: 250.00,
            total_amount: 13500.00,
            payment_terms_days: 30,
            validation_errors: [],
            line_items: [
              { description: "Enterprise Application Hosting Subscriptions Cluster Node A", quantity: 1, unit_price: 8500.00, tax_amount: 850.00, discount_amount: 250.00, line_total: 9100.00 },
              { description: "Database Memory Sharding Tuning Optimization Engineering Consult", quantity: 10, unit_price: 400.00, tax_amount: 400.00, discount_amount: 0.00, line_total: 4400.00 }
            ]
          }
        ],
        processing_notes: `File ${fileName} parsed successfully using Layout-Aware Continuous Table Spatial Extractions. Math self-healing loops triggered. Zero structural mismatches discovered.`
      });
    }, 1000);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateProcessingPipeline(e.dataTransfer.files[0].name);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Document Extraction Workspace</h1>
        <p className="page-subtitle">Upload synthetic PDFs or multi-invoice image files to execute spatial analysis routines.</p>
      </div>

      <div className="ui-card">
        <div className="ui-card-body">
          <div 
            className={`drop-zone ${dragActive ? "dragging" : ""}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: "none" }} 
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => e.target.files?.[0] && simulateProcessingPipeline(e.target.files[0].name)}
            />
            <span className="upload-icon">{loading ? "⚡" : "📥"}</span>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", marginBottom: "8px" }}>
              {loading ? "PROCESSING DOCUMENT SPATIAL MATRICES..." : "DROP INVOICE PDF OR IMAGE CHARTS HERE"}
            </h3>
            <p style={{ fontSize: "13px", color: "#88847d", marginBottom: "20px" }}>
              {loading ? "Running algebraic self-healing engines..." : "Supports single_invoice, multi-page, or stacked document sets"}
            </p>
            {!loading && <button className="btn-primary" type="button">Select File Path</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Workspace Component B: Performance Telemetry Analytics ───────────────
function DashboardPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pipeline Telemetry Center</h1>
        <p className="page-subtitle">Live structural analytics calculated over internal test datasets containing 50 Ground-Truth profiles.</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Document Accuracy</span>
          <span className="metric-value">{METRICS_MOCK.accuracy}</span>
          <span className="metric-badge badge-emerald">Optimal Stability</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Invoice Count MAE</span>
          <span className="metric-value">{METRICS_MOCK.mae}</span>
          <span className="metric-badge badge-emerald">Low Deviation</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Validation Matrix F1</span>
          <span className="metric-value">{METRICS_MOCK.f1}</span>
          <span className="metric-badge badge-amber">Heuristics Limit</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Mean Processing Speed</span>
          <span className="metric-value">{METRICS_MOCK.latency}</span>
          <span className="metric-badge badge-emerald">Fast Latency</span>
        </div>
      </div>

      <div className="dashboard-split-layout">
        <div className="ui-card">
          <div className="ui-card-header">
            <h3 className="ui-card-title">Field Extraction Efficiencies</h3>
          </div>
          <div className="ui-card-body">
            {METRICS_MOCK.fields.map((f, i) => (
              <div className="progress-row" key={i}>
                <div className="progress-meta">
                  <span style={{ fontWeight: 600 }}>{f.name}</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{f.score}.0%</span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${f.score}%`, 
                      backgroundColor: f.score > 90 ? "var(--teal)" : f.score > 50 ? "var(--gold)" : "var(--accent)" 
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ui-card">
          <div className="ui-card-header">
            <h3 className="ui-card-title">Pipeline Capabilities Warning</h3>
          </div>
          <div className="ui-card-body" style={{ fontSize: "14px", lineHeight: "1.6", color: "#444" }}>
            <p style={{ marginBottom: "12px" }}>
              Financial value extractions (Subtotals, Taxes, Totals) exhibit localized regression limits when parsing borderless grids or multi-currency rows.
            </p>
            <p style={{ fontWeight: 600, color: "var(--accent)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>⚠️</span> Resolution Strategy Implemented:
            </p>
            <ul style={{ paddingLeft: "25px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li>Coordinate-bounded spatial lookup tables.</li>
              <li>Dual-pass multi-line table row text stitching heuristics.</li>
              <li>Algebraic self-healing verification checks.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Workspace Component C: Structured Processing Telemetry Outputs ───────
function ResultPage({ result, onBack }) {
  const currentInvoice = result.invoices[0];
  const hasErrors = currentInvoice?.validation_errors && currentInvoice.validation_errors.length > 0;

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="page-title">Extracted Layout Telemetry</h1>
          <p className="page-subtitle">Isolated and reconstructed elements mapped out into structured entities below.</p>
        </div>
        <button className="btn-primary" style={{ backgroundColor: "var(--ink-2)" }} onClick={onBack}>← Parse New Document</button>
      </div>

      {hasErrors ? (
        <div className="validation-alert-box alert-box-error">
          <span className="alert-box-icon">❌</span>
          <div>
            <div className="alert-box-title">Validation Arithmetic Alert Detected</div>
            <p>Discrepancies identified during ledger summation processing: {currentInvoice.validation_errors.join(", ")}</p>
          </div>
        </div>
      ) : (
        <div className="validation-alert-box alert-box-success">
          <span className="alert-box-icon">✓</span>
          <div>
            <div className="alert-box-title">Ledger Mathematical Cross-Inference Confirmed</div>
            <p>Calculated balances, subtotal structures, and column metrics align perfectly within predefined error margins.</p>
          </div>
        </div>
      )}

      <div className="dashboard-split-layout">
        {/* Fixed Spatial Metadata Grid Box Container */}
        <div className="ui-card">
          <div className="ui-card-header">
            <h3 className="ui-card-title">Document Structure Metadata</h3>
            <span className="metric-badge badge-emerald" style={{ fontFamily: "var(--font-mono)" }}>{result.document_type}</span>
          </div>
          <div className="ui-card-body" style={{ paddingTop: 0, paddingBottom: 0 }}>
            <div className="metadata-grid">
              <div className="metadata-item">
                <span className="metadata-label">System Record ID</span>
                <span className="metadata-value font-mono">{result.document_id}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Invoice Inbound Count</span>
                <span className="metadata-value">{result.invoice_count} Profile(s)</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Invoice Reference Number</span>
                <span className="metadata-value font-mono" style={{ fontWeight: 700 }}>{currentInvoice?.invoice_number || "MISSING"}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Seller Party Name</span>
                <span className="metadata-value" style={{ fontWeight: 600 }}>{currentInvoice?.seller_name}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Buyer Corporate Account</span>
                <span className="metadata-value" style={{ fontWeight: 600 }}>{currentInvoice?.buyer_name}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Issue Timestamp Matrix</span>
                <span className="metadata-value font-mono">{currentInvoice?.issue_date}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Stipulated Credit Terms</span>
                <span className="metadata-value">Net {currentInvoice?.payment_terms_days} Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Accounting Ledgers Summary Frame */}
        <div>
          <div className="balance-card">
            <div className="ui-card-title" style={{ color: "#fff", opacity: 0.4, fontFamily: "var(--font-heading)", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--ink-3)" }}>
              Financial Reconciliation Summary
            </div>
            <div className="balance-row">
              <span>Extracted Net Subtotal</span>
              <span>{currentInvoice?.currency} {currentInvoice?.subtotal.toFixed(2)}</span>
            </div>
            <div className="balance-row">
              <span>Accumulated Tax Liability (VAT/GST)</span>
              <span style={{ color: "var(--teal)" }}>+{currentInvoice?.tax_amount.toFixed(2)}</span>
            </div>
            <div className="balance-row">
              <span>Applied Campaign Discounts</span>
              <span style={{ color: "var(--accent)" }}>-{currentInvoice?.discount_amount.toFixed(2)}</span>
            </div>
            <div className="balance-total-row">
              <span className="balance-total-label">Total Balance Due</span>
              <span className="balance-total-value">{currentInvoice?.currency} {currentInvoice?.total_amount.toFixed(2)}</span>
            </div>
          </div>

          <div className="ui-card" style={{ marginTop: "24px" }}>
            <div className="ui-card-header"><h3 className="ui-card-title">Pipeline Extractions Manifest</h3></div>
            <div className="ui-card-body" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#666", lineHeight: "1.5", backgroundColor: "#faf9f6", wordBreak: "break-all" }}>
              {result.processing_notes}
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Line Items Data Matrix Table Grid */}
      <div className="ui-card">
        <div className="ui-card-header">
          <h3 className="ui-card-title">Continuous Sequence Table Parse Items</h3>
        </div>
        <div className="ui-card-body">
          <div className="table-scroll-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Line Item Component Description</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Unit Rate Price</th>
                  <th className="text-right">Tax Applied</th>
                  <th className="text-right">Discount Given</th>
                  <th className="text-right">Calculated Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {currentInvoice?.line_items.map((item, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 600, color: "var(--ink)" }}>{item.description}</td>
                    <td className="text-center font-mono">{item.quantity}</td>
                    <td className="text-right font-mono">${item.unit_price.toFixed(2)}</td>
                    <td className="text-right font-mono" style={{ color: "var(--teal)" }}>${item.tax_amount.toFixed(2)}</td>
                    <td className="text-right font-mono" style={{ color: "var(--accent)" }}>${item.discount_amount.toFixed(2)}</td>
                    <td className="text-right font-mono" style={{ fontWeight: 700, color: "var(--ink)" }}>${item.line_total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="swipe-hint">Swipe horizontally to view wide columns metadata →</div>
        </div>
      </div>
    </div>
  );
}

// ─── Workspace Component D: Historic Data Log Archival Trails ───────────────
function HistoryPage({ onViewResult }) {
  const loadHistoricMockResult = (docId, docType) => {
    onViewResult({
      document_id: docId,
      document_type: docType,
      invoice_count: docId === "doc_0492" ? 2 : docId === "doc_0496" ? 0 : 1,
      invoices: [
        {
          invoice_id: "inv_hist_88",
          invoice_number: "RECON-2026-0941",
          seller_name: "DYNAMIC ENTERPRISE HIGH-SCALE SOLUTIONS GROUP CORP",
          buyer_name: "COMPYLANCE INTERNAL TESTING INFRASTRUCTURE LABS LLC",
          issue_date: "2026-05-10",
          currency: "EUR",
          subtotal: 1450.00,
          tax_amount: 275.50,
          discount_amount: 0.00,
          total_amount: 1725.50,
          payment_terms_days: 14,
          validation_errors: docType === "invoice_with_extra_pages" ? ["non_invoice_page_detected"] : [],
          line_items: [
            { description: "General Hardware Server Blade Rack Integration Mounts Unit x4", quantity: 4, unit_price: 362.50, tax_amount: 275.50, discount_amount: 0.00, line_total: 1725.50 }
          ]
        }
      ],
      processing_notes: `Audit baseline transaction log pulled for ${docId}. Calculated using archived execution metrics.`
    });
  };

  return (
    <div className="w-full">
      <div className="page-header">
        <h1 className="page-title">Pipeline Execution Log History</h1>
        <p className="page-subtitle">Review historical execution sequences ran over the synthetic document dataset batch partitions.</p>
      </div>

      <div className="ui-card">
        <div className="ui-card-body" style={{ padding: 0 }}>
          <div className="table-scroll-wrapper" style={{ border: "none" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Manifest Document ID</th>
                  <th>Document Structural Type</th>
                  <th className="text-center">Detected Invoices</th>
                  <th className="text-center">Execution Speed</th>
                  <th className="text-right">Pipeline Action Status</th>
                </tr>
              </thead>
              <tbody>
                {HISTORY_MOCK.map((h, i) => (
                  <tr key={i} style={{ cursor: "pointer" }} onClick={() => loadHistoricMockResult(h.id, h.type)}>
                    <td className="font-mono" style={{ fontWeight: 700, color: "var(--accent)" }}>{h.id}</td>
                    <td><span className="metric-badge" style={{ backgroundColor: "var(--surface-2)", color: "var(--ink-2)" }}>{h.type}</span></td>
                    <td className="text-center font-mono">{h.count}</td>
                    <td className="text-center font-mono" style={{ color: "#666" }}>{h.speed}</td>
                    <td className="text-right">
                      <span className={`metric-badge ${h.status === "Validated" ? "badge-emerald" : h.status === "Healed" ? "badge-emerald" : h.status === "Filtered" ? "badge-amber" : "badge-rose"}`}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="swipe-hint">Swipe horizontally to look over long audit rows →</div>
        </div>
      </div>
    </div>
  );
}
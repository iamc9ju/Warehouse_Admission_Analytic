import { SidebarNavigation } from "../sidebar-navigation";
import { loadDashboardSnapshot } from "../data/load-dashboard-snapshot";

export default async function WarehousePage() {
  const snapshot = await loadDashboardSnapshot();
  const { dataCatalogRows, etlValidationChecks, lineageEdges, warehouseQueries, warehouseSnapshot } = snapshot;

  return (
    <main className="app-frame">
      <SidebarNavigation activeHref="/warehouse" />

      <section className="workspace" data-page="Warehouse">
        <div className="page-transition" key="Warehouse">
          <section id="overview" className="hero-panel">
            <div>
              <p className="eyebrow">Warehouse Architecture</p>
              <h1>Warehouse, Lineage และ Core Model</h1>
              <p>ตรวจสอบเส้นทางข้อมูลตั้งแต่ Excel source, staging CSV, core facts, governed marts, query contract และ dashboard-ready snapshot</p>
            </div>
          </section>

          <section id="warehouse" className="panel warehouse-panel">
            <div className="panel-title">
              <h2>Warehouse, marts และ lineage ที่ใช้งานจริง</h2>
              <span className="mini-pill">governed DW</span>
            </div>
            <div className="warehouse-flow">
              {[
                ["Source", "Excel admissions files"],
                ["Staging", "PII-safe application rows"],
                ["Core DW", "single fact + dimensions"],
                ["Marts", "year, round, major conversion"],
                ["Dashboard", "interactive BI view"],
              ].map(([title, copy]) => (
                <div key={title}>
                  <strong>{title}</strong>
                  <span>{copy}</span>
                </div>
              ))}
            </div>
            <div className="warehouse-evidence">
              <article className="evidence-card catalog-card">
                <div className="panel-title">
                  <h2>Data catalog evidence</h2>
                  <span className="mini-pill">{warehouseSnapshot.catalogRows} catalog rows</span>
                </div>
                <div className="catalog-table" role="table" aria-label="Warehouse dataset catalog">
                  <div className="catalog-head" role="row">
                    <span>Dataset</span>
                    <span>Layer</span>
                    <span>Grain</span>
                    <span>Evidence</span>
                    <span>Sensitivity</span>
                  </div>
                  {dataCatalogRows.map(([dataset, layer, grain, evidence, sensitivity]) => (
                    <div className="catalog-row" role="row" key={dataset}>
                      <strong>{dataset}</strong>
                      <span>{layer}</span>
                      <span>{grain}</span>
                      <span>{evidence}</span>
                      <span>{sensitivity}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="evidence-card lineage-card">
                <div className="panel-title">
                  <h2>Lineage edges</h2>
                  <span className="mini-pill">{warehouseSnapshot.lineageEdges} edges</span>
                </div>
                <div className="lineage-list">
                  {lineageEdges.map(([from, to, transform]) => (
                    <div key={`${from}-${to}`}>
                      <strong>{from}</strong>
                      <span>{transform}</span>
                      <b>{to}</b>
                    </div>
                  ))}
                </div>
              </article>

              <article className="evidence-card query-card">
                <div className="panel-title">
                  <h2>Dashboard query contract</h2>
                  <span className="mini-pill">{warehouseSnapshot.sourceSystem}</span>
                </div>
                <div className="query-list">
                  {warehouseQueries.map((query) => (
                    <section key={query.name}>
                      <strong>{query.name}</strong>
                      <span>{query.object}</span>
                      <code>{query.sql}</code>
                    </section>
                  ))}
                </div>
              </article>

              <article className="evidence-card validation-card">
                <div className="panel-title">
                  <h2>ETL validation checks</h2>
                  <span className="mini-pill">all pass</span>
                </div>
                <div className="validation-list">
                  {etlValidationChecks.map(([name, evidence, result]) => (
                    <div key={name}>
                      <strong>{name}</strong>
                      <span>{evidence}</span>
                      <b>{result}</b>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

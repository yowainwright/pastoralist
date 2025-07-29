export default function ReviewFlow() {
  return (
    <div className="flow-chart">
      <div className="steps">
        <div className="step">
          <div className="step-number">1</div>
          <h3>Read Package.json</h3>
          <p>Pastoralist reads your package.json file to find overrides, resolutions, and patches</p>
        </div>
        
        <div className="step">
          <div className="step-number">2</div>
          <h3>Track Dependencies</h3>
          <p>Maps all overrides and resolutions to the pastoralist.appendix object</p>
        </div>
        
        <div className="step">
          <div className="step-number">3</div>
          <h3>Detect Changes</h3>
          <p>Monitors for outdated or unnecessary overrides and patches</p>
        </div>
        
        <div className="step">
          <div className="step-number">4</div>
          <h3>Clean Up</h3>
          <p>Removes unused overrides and notifies about unnecessary patches</p>
        </div>
      </div>
      
      <style jsx>{`
        .flow-chart {
          margin: 2rem 0;
        }
        
        .steps {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        }
        
        .step {
          padding: 1.5rem;
          border-radius: 0.5rem;
          background: var(--bg-base-200);
          border: 1px solid var(--border-base-300);
        }
        
        .step-number {
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          background: var(--bg-primary);
          color: var(--text-primary-content);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-bottom: 0.75rem;
        }
        
        .step h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.125rem;
          font-weight: 600;
        }
        
        .step p {
          margin: 0;
          color: var(--text-base-content);
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
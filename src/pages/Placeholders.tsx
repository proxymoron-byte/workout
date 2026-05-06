function Placeholder({ title, step }: { title: string; step: string }) {
  return (
    <main className="page">
      <div className="section">
        <h1>{title}</h1>
      </div>
      <div className="card empty">{step}</div>
    </main>
  );
}

export function Checkups() {
  return <Placeholder title="Checkups" step="Checkup table lands in step 6." />;
}

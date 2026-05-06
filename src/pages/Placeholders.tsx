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

export function Workouts() {
  return <Placeholder title="Workouts" step="Routine library + session player land in steps 2 and 3." />;
}

export function Nutrition() {
  return <Placeholder title="Nutrition" step="Nutrition logging lands in step 4." />;
}

export function Body() {
  return <Placeholder title="Body" step="Weight + cycle tabs land in step 5." />;
}

export function Checkups() {
  return <Placeholder title="Checkups" step="Checkup table lands in step 6." />;
}

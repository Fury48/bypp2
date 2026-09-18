export function RecipeBadge({ a, b, c }: { a: string; b: string; c?: string }) {
  return (
    <div className="recipe-badge">
      {a} × {b}
      {c && <> × {c}</>}
    </div>
  );
}

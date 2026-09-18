export function SignageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="signage">
      <div className="signage__diamond" />
      <div className="signage__frame">
        <h1 className="signage__title">{title}</h1>
        <div className="signage__rule">
          <span className="signage__rule-diamond" />
        </div>
        <p className="signage__subtitle">{subtitle}</p>
      </div>
    </div>
  );
}

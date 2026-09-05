export function Card({ children, style }) {
  return (
    <div className="card" style={style}>
      {children}
    </div>
  );
}

export function CardHeader({ children }) {
  return <div className="card-header">{children}</div>;
}

export function CardBody({ children, className = "" }) {
  return <div className={["card-body", className].filter(Boolean).join(" ")}>{children}</div>;
}

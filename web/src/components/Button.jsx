export function Button({ variant = "default", className = "", ...props }) {
  const classes = ["button", variant === "primary" ? "button-primary" : "", className]
    .filter(Boolean)
    .join(" ");

  return <button className={classes} {...props} />;
}

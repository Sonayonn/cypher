import Link from "next/link";

const sizeMap = {
  sm: { mark: 22, text: "text-base", gap: "gap-1.5" },
  md: { mark: 32, text: "text-2xl", gap: "gap-2" },
  lg: { mark: 44, text: "text-4xl", gap: "gap-2.5" },
  xl: { mark: 60, text: "text-5xl", gap: "gap-3" },
};

export function CypherLogo({
  size = "md",
  asLink = true,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  asLink?: boolean;
}) {
  const { mark, text, gap } = sizeMap[size];

  const inner = (
    <span className={`inline-flex items-center ${gap}`}>
      <CypherMark size={mark} />
      <span
        className={`${text} font-bold tracking-tighter`}
        style={{
          color: "var(--cypher-accent)",
          fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        cypher
      </span>
    </span>
  );

  if (!asLink) return inner;

  return (
    <Link
      href="/"
      className="inline-flex items-center hover:opacity-90 transition-opacity"
      aria-label="Cypher home"
    >
      {inner}
    </Link>
  );
}

export function CypherMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
    >
      {/* Thicker C arc — takes more visual real estate */}
      <path
        d="M 26 9
           A 11 11 0 1 0 26 23
           L 21 19
           A 6 6 0 1 1 21 13 Z"
        fill="var(--cypher-accent)"
      />
      {/* Privacy gap dot — slightly larger and farther out so it reads */}
      <circle cx="24.5" cy="16" r="1.6" fill="var(--cypher-accent)" />
    </svg>
  );
}

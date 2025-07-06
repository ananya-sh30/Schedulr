// components/GridBackground.tsx
const GridBackground = () => (
  <div
    className="absolute inset-0 z-0 pointer-events-none"
    style={{
      backgroundImage: [
        // vertical lines
        `repeating-linear-gradient(
          to right,
          rgba(203,213,225,0.5),
          rgba(203,213,225,0.5) 1px,
          transparent 1px,
          transparent 24px
        )`,
        // horizontal lines
        `repeating-linear-gradient(
          to bottom,
          rgba(203,213,225,0.5),
          rgba(203,213,225,0.5) 1px,
          transparent 1px,
          transparent 24px
        )`,
      ].join(", "),
      maskImage: `linear-gradient(to bottom, black 75%, transparent 100%)`,
      WebkitMaskImage: `linear-gradient(to bottom, black 75%, transparent 100%)`,
    }}
  />
);

export default GridBackground;

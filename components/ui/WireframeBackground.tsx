export function WireframeBackground() {
  return (
    <div
      aria-hidden="true"
      className="wireframe-bg pointer-events-none absolute inset-0 overflow-hidden text-accent"
      style={{
        WebkitMaskImage:
          'linear-gradient(to left, black 0%, black 55%, transparent 95%)',
        maskImage:
          'linear-gradient(to left, black 0%, black 55%, transparent 95%)',
      }}
    >
      {/* Blueprint grid */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.10]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="wf-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wf-grid)" />
      </svg>

      {/* Geometric wireframe cluster (right side) */}
      <svg
        className="absolute right-0 top-1/2 -translate-y-1/2 h-[760px] w-[900px] opacity-[0.32] md:h-[900px] md:w-[1100px]"
        viewBox="0 0 900 760"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="currentColor" strokeWidth="1.25" fill="none">
          {/* Icosahedron */}
          <polygon points="560,90 720,200 660,390 460,390 400,200" />
          <polygon points="560,90 660,390 460,390" />
          <line x1="560" y1="90" x2="560" y2="250" />
          <line x1="400" y1="200" x2="560" y2="250" />
          <line x1="720" y1="200" x2="560" y2="250" />
          <line x1="460" y1="390" x2="560" y2="250" />
          <line x1="660" y1="390" x2="560" y2="250" />

          {/* Cube */}
          <rect x="150" y="430" width="150" height="150" />
          <rect x="200" y="380" width="150" height="150" />
          <line x1="150" y1="430" x2="200" y2="380" />
          <line x1="300" y1="430" x2="350" y2="380" />
          <line x1="150" y1="580" x2="200" y2="530" />
          <line x1="300" y1="580" x2="350" y2="530" />

          {/* Octahedron */}
          <polygon points="770,470 850,560 770,650 690,560" />
          <line x1="770" y1="470" x2="770" y2="650" />
          <line x1="690" y1="560" x2="850" y2="560" />

          {/* Wire globe */}
          <circle cx="430" cy="150" r="85" />
          <ellipse cx="430" cy="150" rx="34" ry="85" />
          <ellipse cx="430" cy="150" rx="85" ry="34" />

          {/* Connecting dashed lines */}
          <line x1="345" y1="455" x2="430" y2="320" strokeDasharray="3 9" />
          <line x1="660" y1="390" x2="690" y2="540" strokeDasharray="3 9" />
          <line x1="515" y1="235" x2="345" y2="430" strokeDasharray="3 9" />

          {/* Vertex nodes */}
          <g fill="currentColor" stroke="none">
            <circle cx="560" cy="90" r="3.5" />
            <circle cx="720" cy="200" r="3.5" />
            <circle cx="660" cy="390" r="3.5" />
            <circle cx="460" cy="390" r="3.5" />
            <circle cx="400" cy="200" r="3.5" />
            <circle cx="560" cy="250" r="3.5" />
            <circle cx="430" cy="150" r="3.5" />
            <circle cx="770" cy="560" r="3.5" />
            <circle cx="225" cy="505" r="3.5" />
          </g>
        </g>
      </svg>
    </div>
  )
}

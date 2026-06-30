import "./ErrorIllustration.css";

export const ErrorIllustration = () => (
  <svg
    className="error-illustration"
    viewBox="0 0 240 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <circle cx="120" cy="120" r="92" stroke="#dbe4ff" strokeWidth="2" strokeDasharray="8 10" />

    <g className="error-illustration__ring">
      <circle cx="120" cy="120" r="74" stroke="#4c6ef5" strokeWidth="1.5" opacity="0.25" />
    </g>

    <g className="error-illustration__orbit">
      <circle cx="120" cy="120" r="5" fill="#748ffc" />
    </g>
    <g className="error-illustration__orbit error-illustration__orbit--delay">
      <circle cx="120" cy="120" r="4" fill="#91a7ff" />
    </g>
    <g className="error-illustration__orbit error-illustration__orbit--delay-2">
      <circle cx="120" cy="120" r="3.5" fill="#bac8ff" />
    </g>

    <g className="error-illustration__card">
      <rect
        x="62"
        y="58"
        width="116"
        height="132"
        rx="18"
        fill="#ffffff"
        stroke="#4c6ef5"
        strokeWidth="3"
      />
      <rect x="78" y="78" width="56" height="8" rx="4" fill="#edf2ff" />
      <rect x="78" y="94" width="84" height="6" rx="3" fill="#edf2ff" />
      <rect x="78" y="108" width="72" height="6" rx="3" fill="#edf2ff" />

      <path
        className="error-illustration__crack"
        d="M88 148 L108 118 L128 156 L148 126"
        stroke="#fa5252"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <g className="error-illustration__mark">
        <circle cx="120" cy="108" r="22" fill="#fff5f5" stroke="#fa5252" strokeWidth="2.5" />
        <path
          d="M120 98v16"
          stroke="#fa5252"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="120" cy="120" r="2.5" fill="#fa5252" />
      </g>
    </g>

    <g className="error-illustration__spark">
      <path d="M34 72l8 8-8 8-8-8z" fill="#ffd43b" opacity="0.85" />
    </g>
    <g className="error-illustration__spark error-illustration__spark--2">
      <path d="M198 176l6 6-6 6-6-6z" fill="#748ffc" opacity="0.8" />
    </g>
    <g className="error-illustration__spark error-illustration__spark--3">
      <circle cx="52" cy="188" r="4" fill="#ff8787" opacity="0.75" />
    </g>
  </svg>
);

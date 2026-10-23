import React from 'react'

export const LaptopIllustration: React.FC = () => {
  return (
    <div
      className="laptop-illustration-wrapper"
      role="img"
      aria-label="Hand-drawn laptop with arm reaching forward from screen"
    >
      <svg
        viewBox="0 0 520 320"
        className="laptop-svg"
        style={{
          width: '100%',
          maxWidth: '460px',
          height: 'auto',
          display: 'block',
          margin: '0 auto',
          overflow: 'visible'
        }}
      >
        <defs>
          {/* Subtle paper grain texture pattern if needed */}
          <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EDE0C8" />
            <stop offset="100%" stopColor="#DFCEAF" />
          </linearGradient>
        </defs>

        {/* --- Background Sparkles & Motion Lines around Laptop --- */}
        <g
          stroke="#11100D"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          {/* Sparkle top-left of laptop */}
          <path d="M 60,65 L 60,85" />
          <path d="M 50,75 L 70,75" />
          <path d="M 53,68 L 67,82" />
          <path d="M 67,68 L 53,82" />

          {/* Tiny sparkle top-right */}
          <path d="M 430,35 Q 430,47 418,47 Q 430,47 430,59 Q 430,47 442,47 Q 430,47 430,35 Z" />

          {/* Energy / Motion lines extending from right of laptop */}
          <path d="M 405,100 C 430,95 455,90 475,85" />
          <path d="M 412,125 C 440,122 468,120 495,118" />
          <path d="M 410,150 C 435,152 460,156 485,162" />

          {/* Small floating doodle dots */}
          <circle cx="85" cy="115" r="3" fill="#11100D" />
          <circle cx="445" cy="180" r="2.5" fill="#11100D" />
        </g>

        {/* --- Sketch Shadow Marks beneath Laptop Base --- */}
        <g stroke="#11100D" strokeWidth="2.2" strokeLinecap="round" opacity="0.85">
          <path d="M 110,270 C 210,274 310,273 400,268" />
          <path d="M 130,277 C 220,280 300,279 380,275" />
          <path d="M 160,284 C 230,286 280,285 340,282" />
        </g>

        {/* --- Laptop Base (Keyboard Deck & Trackpad) --- */}
        {/* Base Bottom Edge / Thickness */}
        <path
          d="M 82,238 L 86,252 C 140,268 330,268 418,248 L 416,234 Z"
          fill="#D7C19E"
          stroke="#11100D"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />

        {/* Base Surface (Perspective Trapzoid) */}
        <polygon
          points="136,188 372,185 418,236 84,239"
          fill="#E6D7BC"
          stroke="#11100D"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Keyboard Keycaps Grid (Illustrated sketch marks) */}
        <g stroke="#11100D" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.8">
          {/* Key row 1 */}
          <path d="M 148,196 L 360,193" />
          {/* Key row 2 */}
          <path d="M 138,206 L 372,203" />
          {/* Key row 3 */}
          <path d="M 126,217 L 385,214" />

          {/* Key column separators */}
          <path d="M 165,195 L 157,216" />
          <path d="M 195,195 L 190,216" />
          <path d="M 225,195 L 223,216" />
          <path d="M 255,195 L 255,216" />
          <path d="M 285,195 L 288,216" />
          <path d="M 315,195 L 320,216" />
          <path d="M 345,194 L 353,215" />
        </g>

        {/* Trackpad */}
        <polygon
          points="218,222 288,221 292,235 214,236"
          fill="#D7C19E"
          stroke="#11100D"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* --- Laptop Screen Housing --- */}
        {/* Back / Outer Lid Shell */}
        <path
          d="M 126,62 C 127,55 133,50 140,49 L 366,45 C 374,45 380,50 381,58 L 373,186 L 135,188 Z"
          fill="#DFCEAF"
          stroke="#11100D"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />

        {/* Inner Screen Display (Warm parchment fill) */}
        <polygon
          points="144,60 364,57 358,176 150,178"
          fill="url(#screenGrad)"
          stroke="#11100D"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />

        {/* Sketchy double-line effect inside screen */}
        <polygon
          points="149,66 358,63 353,171 155,173"
          fill="none"
          stroke="#11100D"
          strokeWidth="1.2"
          strokeDasharray="4 2"
          opacity="0.4"
        />

        {/* Web camera dot at top of bezel */}
        <circle cx="253" cy="53" r="2.2" fill="#11100D" />

        {/* --- Cartoon Arm & Hand Emerging from Screen --- */}
        {/* The arm bursts out of the screen, reaching forward and downward */}
        <g id="emerging-hand-group">
          {/* Screen Portal Rip / Dimension Ripple around the arm */}
          <path
            d="M 215,92 C 205,108 205,130 218,142 C 235,152 260,150 270,136 C 278,122 272,98 255,90"
            fill="#11100D"
            opacity="0.12"
          />

          {/* Sleeve / Cuff right at the screen threshold */}
          <path
            d="M 226,108 C 220,118 222,132 232,138 L 254,136 C 262,130 262,118 256,106 Z"
            fill="#39352B"
            stroke="#11100D"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          {/* White shirt cuff line */}
          <path
            d="M 233,137 C 238,142 248,141 254,136"
            stroke="#FAF9F4"
            strokeWidth="3.2"
            fill="none"
          />

          {/* Forearm (Pale warm skin fill, bold ink outline) */}
          <path
            d="M 234,138 C 236,155 244,180 252,205 C 255,215 258,222 260,230
               L 286,222 C 283,212 280,198 274,175 C 268,155 260,140 254,136 Z"
            fill="#FFFDF7"
            stroke="#11100D"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Hand & Expressive Pointing / Grasping Fingers */}
          {/* Palm base */}
          <path
            d="M 260,230
               C 255,236 248,245 245,255
               C 242,266 248,272 258,268
               C 264,265 270,256 274,248
               L 280,265 C 284,272 292,270 295,262 L 293,246
               L 302,258 C 308,264 315,260 316,252 L 310,238
               L 318,244 C 324,248 330,243 328,236 C 325,225 315,220 286,222 Z"
            fill="#FFFDF7"
            stroke="#11100D"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Thumb detail */}
          <path
            d="M 252,238 C 242,242 232,248 235,256 C 238,262 248,258 255,250"
            fill="#FFFDF7"
            stroke="#11100D"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Knuckle and crease sketch marks */}
          <path
            d="M 266,242 C 272,245 278,244 284,240"
            stroke="#11100D"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 276,232 C 280,235 285,234 290,231"
            stroke="#11100D"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Little energy / action lines near the reaching hand */}
          <g stroke="#11100D" strokeWidth="2.2" strokeLinecap="round" fill="none">
            <path d="M 226,260 Q 218,268 214,275" />
            <path d="M 334,246 Q 344,250 354,252" />
            <path d="M 318,270 Q 325,278 332,284" />
          </g>
        </g>
      </svg>
    </div>
  )
}

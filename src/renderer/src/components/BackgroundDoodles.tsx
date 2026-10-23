import React from 'react'

export const BackgroundDoodles: React.FC = () => {
  return (
    <div
      className="background-doodles-container"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0
      }}
    >
      {/* Upper-Left Corner Grid Doodle */}
      <svg
        className="doodle-top-left"
        viewBox="0 0 260 260"
        style={{
          position: 'absolute',
          top: -25,
          left: -25,
          width: '280px',
          height: '280px'
        }}
      >
        <g
          stroke="#11100D"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          {/* Slanted vertical-ish lines */}
          <path d="M 45,0 C 48,60 52,140 58,210" />
          <path d="M 85,0 C 90,70 94,155 102,230" />
          <path d="M 125,0 C 130,80 133,165 140,245" stroke="#7C4A3A" strokeWidth="2.5" />
          <path d="M 165,0 C 172,75 176,170 182,240" />
          <path d="M 205,0 C 210,65 214,145 220,215" />

          {/* Crossing diagonal lines */}
          <path d="M 0,55 C 65,58 145,66 220,78" />
          <path d="M 0,95 C 75,102 160,110 240,122" />
          <path d="M 0,140 C 70,148 150,158 230,172" stroke="#5E6338" strokeWidth="2.4" />
          <path d="M 0,185 C 60,192 135,204 210,222" />
          <path d="M 0,225 C 50,230 110,242 180,260" />
        </g>
      </svg>

      {/* Lower-Right Corner Slanted Grid Doodle */}
      <svg
        className="doodle-bottom-right"
        viewBox="0 0 280 280"
        style={{
          position: 'absolute',
          bottom: -30,
          right: -30,
          width: '300px',
          height: '300px'
        }}
      >
        <g
          stroke="#11100D"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          {/* Angled intersecting grid */}
          <path d="M 50,280 C 80,210 130,130 210,50" />
          <path d="M 90,280 C 125,205 175,120 260,35" />
          <path d="M 135,280 C 170,195 220,110 295,30" stroke="#7C4A3A" strokeWidth="2.3" />
          <path d="M 180,280 C 210,210 255,135 310,60" />

          {/* Crossing strokes */}
          <path d="M 280,60 C 210,95 130,150 45,230" />
          <path d="M 280,105 C 205,145 125,200 35,275" />
          <path d="M 280,150 C 215,185 150,235 70,295" />
          <path d="M 280,195 C 230,225 180,265 110,310" />
        </g>
      </svg>

      {/* Upper-Right Corner Accent Marks */}
      <svg
        viewBox="0 0 100 80"
        style={{
          position: 'absolute',
          top: '30px',
          right: '50px',
          width: '70px',
          height: '56px'
        }}
      >
        <g stroke="#11100D" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d="M 15,20 Q 30,15 45,18" />
          <path d="M 25,38 Q 45,35 65,40" />
          <path d="M 18,56 Q 35,52 52,58" />
        </g>
      </svg>

      {/* Left Mid-Canvas Starbursts and Sparkles */}
      <svg
        viewBox="0 0 120 240"
        style={{
          position: 'absolute',
          top: '25%',
          left: '3%',
          width: '80px',
          height: '160px'
        }}
      >
        <g stroke="#11100D" strokeWidth="2.2" strokeLinecap="round" fill="none">
          {/* Sparkle 1 */}
          <path d="M 40,30 L 40,55" />
          <path d="M 27,42 L 53,42" />
          <path d="M 31,34 L 49,50" />
          <path d="M 49,34 L 31,50" />

          {/* Little cross doodle */}
          <path d="M 70,95 L 70,110" />
          <path d="M 62,102 L 78,102" />

          {/* Outlined four-point sparkle */}
          <path d="M 45,160 Q 45,175 30,175 Q 45,175 45,190 Q 45,175 60,175 Q 45,175 45,160 Z" />
        </g>
      </svg>

      {/* Right Mid-Canvas Sparkles */}
      <svg
        viewBox="0 0 120 240"
        style={{
          position: 'absolute',
          top: '28%',
          right: '4%',
          width: '85px',
          height: '170px'
        }}
      >
        <g stroke="#11100D" strokeWidth="2.2" strokeLinecap="round" fill="none">
          {/* Starburst */}
          <path d="M 60,40 L 60,70" />
          <path d="M 45,55 L 75,55" />
          <path d="M 50,45 L 70,65" />
          <path d="M 70,45 L 50,65" />

          {/* Tiny scribble circles */}
          <circle cx="35" cy="115" r="4" strokeWidth="1.8" />
          <circle cx="85" cy="135" r="3" strokeWidth="1.8" />

          {/* Four-point star */}
          <path d="M 65,165 Q 65,180 50,180 Q 65,180 65,195 Q 65,180 80,180 Q 65,180 65,165 Z" />
        </g>
      </svg>
    </div>
  )
}

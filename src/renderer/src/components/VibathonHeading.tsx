import React from 'react'

export const VibathonHeading: React.FC = () => {
  return (
    <div className="vibathon-heading-wrapper" aria-label="Our Vibathon">
      {/* Left Flourish Strokes */}
      <svg className="heading-flourish left" viewBox="0 0 50 30" aria-hidden="true">
        <g stroke="#11100D" strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d="M 42,6 Q 22,14 6,18" />
          <path d="M 45,16 Q 28,21 14,24" />
          <path d="M 38,24 Q 26,27 18,28" />
        </g>
      </svg>

      <h1 className="vibathon-heading-text">OUR PERSONA&apos;S</h1>

      {/* Right Flourish Strokes */}
      <svg className="heading-flourish right" viewBox="0 0 50 30" aria-hidden="true">
        <g stroke="#11100D" strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d="M 8,6 Q 28,14 44,18" />
          <path d="M 5,16 Q 22,21 36,24" />
          <path d="M 12,24 Q 24,27 32,28" />
        </g>
      </svg>
    </div>
  )
}

/* global React */

// Brand mark — transparent background, plum cart with plum pill resting inside.
function BrandMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block', flexShrink: 0 }}>
      {/* shopping cart — line art in plum */}
      <g stroke="#6B4FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M11 18 L17 18 L21 41 L48 41 L52 22 L23 22"/>
        <circle cx="25" cy="50" r="3.6"/>
        <path d="M22.4 50 H27.6"/>
        <circle cx="44" cy="50" r="3.6"/>
        <path d="M41.4 50 H46.6"/>
      </g>

      {/* pill — tilted -35°, plum solid + lighter plum half */}
      <g transform="translate(36 28) rotate(-35)">
        <rect x="-12" y="-5.4" width="24" height="10.8" rx="5.4" fill="#6B4FFF"/>
        <path d="M-12 -5.4 L0 -5.4 L0 5.4 L-12 5.4 A5.4 5.4 0 0 1 -12 -5.4 Z" fill="#A89BFF"/>
        <line x1="0" y1="-5.4" x2="0" y2="5.4" stroke="#6B4FFF" strokeWidth="1.4"/>
        <ellipse cx="-7" cy="-2" rx="3" ry="0.9" fill="#FFFFFF" opacity="0.5"/>
      </g>
    </svg>
  );
}

function BrandLockup({ markSize = 44, vertical = false, variant = 'full' }) {
  // 'desk' variant: compact product lockup — small mark, tight typography stack
  if (variant === 'desk') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
        <BrandMark size={markSize}/>
        <div style={{
          width: 1, alignSelf: 'stretch',
          background: 'var(--line-2)',
          margin: '4px 0',
        }}/>
        <div style={{ lineHeight: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            fontWeight: 600,
            color: '#6B4FFF',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}>
            DPS
          </div>
          <div style={{
            fontFamily: 'var(--sans)',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-0.03em',
          }}>
            Desk<span style={{ color: '#6B4FFF' }}>.</span>
          </div>
        </div>
      </div>
    );
  }

  // Full lockup: "Digital Pharma / Solutions" — for marketing surfaces
  const titleSize = markSize * 0.40;
  const eyebrow   = markSize * 0.30;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      flexDirection: vertical ? 'column' : 'row',
      gap: vertical ? 14 : markSize * 0.32,
    }}>
      <BrandMark size={markSize}/>
      <div style={{ lineHeight: 1, textAlign: vertical ? 'center' : 'left' }}>
        <div style={{
          fontFamily: 'var(--sans)',
          fontSize: eyebrow,
          fontWeight: 500,
          color: '#6B4FFF',
          letterSpacing: '-0.005em',
        }}>
          Digital Pharma
        </div>
        <div style={{
          fontFamily: 'var(--sans)',
          fontSize: titleSize,
          fontWeight: 700,
          color: 'var(--ink)',
          marginTop: markSize * 0.10,
          letterSpacing: '-0.025em',
        }}>
          Solutions
        </div>
      </div>
    </div>
  );
}

window.BrandMark = BrandMark;
window.BrandLockup = BrandLockup;

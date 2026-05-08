interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`logo-container ${className}`} aria-label="EZ Logo">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ height: '32px', width: 'auto', display: 'block' }}
      >
        {/* E */}
        <path
          d="M20 20H80V35H35V52H75V67H35V85H80V100H20V20Z"
          fill="#001a72"
        />
        {/* Z */}
        <path
          d="M100 20H160V35L115 85H160V100H100V85L145 35H100V20Z"
          fill="#001a72"
        />
        {/* Green Bar on E */}
        <rect x="15" y="52" width="65" height="15" fill="#00a651" />
      </svg>
    </div>
  );
}


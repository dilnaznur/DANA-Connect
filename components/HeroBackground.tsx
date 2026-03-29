/**
 * HeroBackground component with decorative SVG elements
 * Features:
 * - DNA double helix on the left side (light gray/lavender tones)
 * - Molecular dots connected by lines on the right
 * - Faded math formulas (G=, 8½=2, +) on the right
 * - Soft purple-gray gradient overlay (#EEEDF8 to transparent)
 * - Illustrations are subtle/ghosted, not bold
 */
export function HeroBackground() {
  return (
    <>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#EEEDF8] via-[#EEEDF8] to-[#E8E8F5]" />

      {/* Soft purple-gray gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#EEEDF8]/80 via-transparent to-[#EEEDF8]/60" />

      {/* Left side: DNA Double Helix illustration */}
      <div className="absolute left-0 top-0 h-full w-1/3 overflow-hidden pointer-events-none">
        <svg
          className="absolute left-8 lg:left-16 top-1/2 -translate-y-1/2 h-[120%] w-auto opacity-[0.12]"
          viewBox="0 0 200 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* DNA Helix left strand - smooth S-curves */}
          <path
            d="M60 0
               C90 50, 90 100, 60 150
               C30 200, 30 250, 60 300
               C90 350, 90 400, 60 450
               C30 500, 30 550, 60 600
               C90 650, 90 700, 60 750
               C30 800, 30 850, 60 900"
            stroke="#9CA3AF"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {/* DNA Helix right strand - opposite curves */}
          <path
            d="M140 0
               C110 50, 110 100, 140 150
               C170 200, 170 250, 140 300
               C110 350, 110 400, 140 450
               C170 500, 170 550, 140 600
               C110 650, 110 700, 140 750
               C170 800, 170 850, 140 900"
            stroke="#9CA3AF"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {/* DNA rungs/base pairs connecting the strands */}
          {[60, 130, 200, 270, 340, 410, 480, 550, 620, 690, 760].map((y, i) => {
            const offset = i % 2 === 0 ? 10 : -10
            return (
              <line
                key={i}
                x1={60 + offset}
                y1={y}
                x2={140 - offset}
                y2={y}
                stroke="#B8C4D8"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )
          })}
          {/* Nucleotide dots on rungs */}
          {[60, 130, 200, 270, 340, 410, 480, 550, 620, 690, 760].map((y, i) => {
            const offset = i % 2 === 0 ? 10 : -10
            return (
              <g key={`dots-${i}`}>
                <circle cx={75 + offset} cy={y} r="4" fill="#C4CAD8" />
                <circle cx={125 - offset} cy={y} r="4" fill="#C4CAD8" />
              </g>
            )
          })}
        </svg>
      </div>

      {/* Right side: Molecular structure + math formulas */}
      <div className="absolute right-0 top-0 h-full w-1/2 overflow-hidden pointer-events-none">
        <svg
          className="absolute right-0 top-0 h-full w-full opacity-[0.10]"
          viewBox="0 0 600 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Molecular structure - hexagonal benzene-like shapes */}
          {/* Benzene ring 1 */}
          <polygon
            points="350,120 390,140 390,180 350,200 310,180 310,140"
            stroke="#8B9DC3"
            strokeWidth="2"
            fill="none"
          />
          {/* Benzene ring 2 - connected */}
          <polygon
            points="430,180 470,200 470,240 430,260 390,240 390,200"
            stroke="#8B9DC3"
            strokeWidth="2"
            fill="none"
          />
          {/* Connection line between rings */}
          <line x1="390" y1="180" x2="390" y2="200" stroke="#8B9DC3" strokeWidth="2" />

          {/* Scattered molecular dots */}
          {[
            [280, 100, 6],
            [320, 280, 5],
            [450, 320, 4],
            [500, 160, 5],
            [520, 280, 6],
            [380, 350, 4],
            [450, 400, 5],
            [320, 420, 4],
            [540, 380, 5],
            [400, 480, 6],
            [480, 520, 4],
            [350, 550, 5],
            [420, 600, 4],
            [500, 580, 5],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="#9CA3AF" opacity="0.8" />
          ))}

          {/* Connecting lines between dots */}
          <line x1="280" y1="100" x2="350" y2="120" stroke="#9CA3AF" strokeWidth="1.5" />
          <line x1="390" y1="200" x2="320" y2="280" stroke="#9CA3AF" strokeWidth="1.5" />
          <line x1="470" y1="240" x2="500" y2="160" stroke="#9CA3AF" strokeWidth="1.5" />
          <line x1="470" y1="240" x2="520" y2="280" stroke="#9CA3AF" strokeWidth="1.5" />
          <line x1="430" y1="260" x2="450" y2="320" stroke="#9CA3AF" strokeWidth="1.5" />
          <line x1="450" y1="320" x2="380" y2="350" stroke="#9CA3AF" strokeWidth="1.5" />
          <line x1="450" y1="320" x2="450" y2="400" stroke="#9CA3AF" strokeWidth="1.5" />
          <line x1="380" y1="350" x2="320" y2="420" stroke="#9CA3AF" strokeWidth="1.5" />
          <line x1="450" y1="400" x2="540" y2="380" stroke="#9CA3AF" strokeWidth="1.5" />
          <line x1="450" y1="400" x2="400" y2="480" stroke="#9CA3AF" strokeWidth="1.5" />
          <line x1="400" y1="480" x2="480" y2="520" stroke="#9CA3AF" strokeWidth="1.5" />
          <line x1="400" y1="480" x2="350" y2="550" stroke="#9CA3AF" strokeWidth="1.5" />
          <line x1="480" y1="520" x2="500" y2="580" stroke="#9CA3AF" strokeWidth="1.5" />
          <line x1="350" y1="550" x2="420" y2="600" stroke="#9CA3AF" strokeWidth="1.5" />

          {/* Faded math formulas */}
          <text
            x="500"
            y="90"
            fill="#8B9DC3"
            fontSize="16"
            fontFamily="serif"
            opacity="0.7"
          >
            G=
          </text>
          <text
            x="530"
            y="140"
            fill="#8B9DC3"
            fontSize="14"
            fontFamily="serif"
            opacity="0.6"
          >
            8½=2
          </text>
          <text
            x="560"
            y="200"
            fill="#8B9DC3"
            fontSize="20"
            fontFamily="serif"
            opacity="0.5"
          >
            +
          </text>
          <text
            x="540"
            y="450"
            fill="#8B9DC3"
            fontSize="18"
            fontFamily="serif"
            opacity="0.6"
          >
            ∫
          </text>
          <text
            x="480"
            y="650"
            fill="#8B9DC3"
            fontSize="14"
            fontFamily="serif"
            opacity="0.5"
          >
            π·r²
          </text>
          <text
            x="520"
            y="700"
            fill="#8B9DC3"
            fontSize="16"
            fontFamily="serif"
            opacity="0.6"
          >
            ∑
          </text>
          <text
            x="300"
            y="500"
            fill="#8B9DC3"
            fontSize="12"
            fontFamily="serif"
            opacity="0.4"
          >
            Δx
          </text>
          <text
            x="550"
            y="340"
            fill="#8B9DC3"
            fontSize="14"
            fontFamily="serif"
            opacity="0.5"
          >
            ∞
          </text>
        </svg>
      </div>
    </>
  )
}

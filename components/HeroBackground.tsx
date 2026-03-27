/**
 * HeroBackground component with decorative SVG elements
 * Features:
 * - DNA double helix with connecting rungs
 * - Molecular dots connected by lines
 * - Mathematical formulas (∑, ∫, E=mc², G=mc², π)
 * - Soft lavender gradient background
 * - Positioned on the right side of hero sections
 */
export function HeroBackground() {
  return (
    <>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#EEEEF8] via-[#EEEEF8] to-[#E8E8F5]" />

      {/* Decorative SVG watermark - positioned right side */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute right-0 top-0 h-full w-1/2 opacity-[0.13]"
          viewBox="0 0 600 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* DNA Helix left strand */}
          <path
            d="M200 0 Q230 100 200 200 Q170 300 200 400 Q230 500 200 600 Q170 700 200 800"
            stroke="#1B2A72"
            strokeWidth="2"
            fill="none"
          />
          {/* DNA Helix right strand */}
          <path
            d="M260 0 Q230 100 260 200 Q290 300 260 400 Q230 500 260 600 Q290 700 260 800"
            stroke="#1B2A72"
            strokeWidth="2"
            fill="none"
          />
          {/* Connecting rungs */}
          {[50, 130, 210, 290, 370, 450, 530, 610, 690, 770].map((y, i) => (
            <line
              key={i}
              x1="200"
              y1={y}
              x2="260"
              y2={y}
              stroke="#1B2A72"
              strokeWidth="1.5"
            />
          ))}
          {/* Molecular dots */}
          {[
            [350, 80],
            [400, 160],
            [380, 240],
            [420, 320],
            [360, 400],
            [440, 180],
            [480, 260],
            [500, 140],
            [470, 340],
            [390, 120],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="5" fill="#1B2A72" />
          ))}
          {/* Molecular connections */}
          <line x1="350" y1="80" x2="400" y2="160" stroke="#1B2A72" strokeWidth="1" />
          <line
            x1="400"
            y1="160"
            x2="380"
            y2="240"
            stroke="#1B2A72"
            strokeWidth="1"
          />
          <line
            x1="380"
            y1="240"
            x2="420"
            y2="320"
            stroke="#1B2A72"
            strokeWidth="1"
          />
          <line
            x1="420"
            y1="320"
            x2="360"
            y2="400"
            stroke="#1B2A72"
            strokeWidth="1"
          />
          <line
            x1="440"
            y1="180"
            x2="480"
            y2="260"
            stroke="#1B2A72"
            strokeWidth="1"
          />
          <line
            x1="480"
            y1="260"
            x2="500"
            y2="140"
            stroke="#1B2A72"
            strokeWidth="1"
          />
          <line
            x1="350"
            y1="80"
            x2="440"
            y2="180"
            stroke="#1B2A72"
            strokeWidth="1"
          />
          {/* Math symbols */}
          <text
            x="480"
            y="400"
            fill="#1B2A72"
            fontSize="24"
            fontFamily="serif"
            opacity="0.8"
          >
            ∑
          </text>
          <text
            x="520"
            y="320"
            fill="#1B2A72"
            fontSize="18"
            fontFamily="serif"
            opacity="0.8"
          >
            ∫
          </text>
          <text
            x="460"
            y="480"
            fill="#1B2A72"
            fontSize="14"
            fontFamily="serif"
            opacity="0.8"
          >
            E=mc²
          </text>
          <text
            x="500"
            y="550"
            fill="#1B2A72"
            fontSize="14"
            fontFamily="serif"
            opacity="0.6"
          >
            G=mc²
          </text>
          <text
            x="540"
            y="240"
            fill="#1B2A72"
            fontSize="20"
            fontFamily="serif"
            opacity="0.7"
          >
            π
          </text>
        </svg>
      </div>
    </>
  )
}

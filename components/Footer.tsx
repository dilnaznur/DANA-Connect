import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#1B2A72]">
      {/* Top separator */}
      <div className="border-t border-white/12" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="font-heading font-bold text-2xl text-white">
                DANA Connect
              </span>
            </Link>
            <p className="text-white/70 leading-relaxed text-sm max-w-md">
              Empowering women in STEM across Kazakhstan through mentorship,
              research opportunities, and community support.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-heading font-bold text-white mb-6 text-sm uppercase tracking-wide">
              Platform
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/mentors"
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  Mentors
                </Link>
              </li>
              <li>
                <Link
                  href="/research"
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  Research
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h4 className="font-heading font-bold text-white mb-6 text-sm uppercase tracking-wide">
              Get Started
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/register"
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  Register
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  Log In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom separator with copyright */}
        <div className="border-t border-white/12 pt-8">
          <p className="text-center text-white/50 text-xs">
            &copy; {currentYear} DANA Connect. Building the future of women in STEM.
          </p>
        </div>
      </div>
    </footer>
  )
}

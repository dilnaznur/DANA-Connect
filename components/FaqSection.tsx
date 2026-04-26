'use client'

import { useId, useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { translations } from '@/lib/i18n/translations'
import { ChevronDown } from 'lucide-react'

export function FaqSection() {
  const { language } = useLanguage()
  const t = translations[language]
  const baseId = useId()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggleIndex = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section className="py-16 sm:py-20 bg-[#EEEDF8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="section-label">FAQ</span>
          <h2 className="font-heading text-3xl sm:text-[36px] lg:text-[42px] font-extrabold text-[#1B2A72]">
            {t.faq.title}
          </h2>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl shadow-card overflow-hidden">
          {t.faq.items.map((item, index) => {
            const isOpen = openIndex === index
            const buttonId = `${baseId}-faq-btn-${index}`
            const panelId = `${baseId}-faq-panel-${index}`

            return (
              <div key={item.q} className={index === 0 ? '' : 'border-t border-[var(--border)]'}>
                <button
                  type="button"
                  id={buttonId}
                  className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 hover:bg-hero transition-colors"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleIndex(index)}
                >
                  <span className="font-heading text-base sm:text-lg font-semibold text-[#1B2A72]">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${
                      isOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={isOpen ? 'px-5 sm:px-6 pb-5 sm:pb-6' : 'hidden'}
                >
                  <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                    {item.a}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

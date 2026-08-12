import { Archive, ExternalLink, MessageCircle, Phone, ShieldAlert } from "lucide-react"
import {
  RetirementLocalDataControls,
  type RetirementLocalDataContent,
} from "@/components/retirement/RetirementLocalDataControls"

export interface PublicServiceRetiredContent extends RetirementLocalDataContent {
  boundary: string
  call211: string
  call911: string
  call988: string
  description: string
  emergencyDescription: string
  emergencyTitle: string
  eyebrow: string
  navigationDescription: string
  navigationTitle: string
  safetyDescription: string
  safetyTitle: string
  skipToContent: string
  suicideDescription: string
  suicideTitle: string
  text988: string
  title: string
  visit211: string
}

interface PublicServiceRetiredProps {
  content: PublicServiceRetiredContent
}

const actionClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"

export function PublicServiceRetired({ content }: PublicServiceRetiredProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[radial-gradient(circle_at_12%_4%,rgba(34,211,238,0.20),transparent_24rem),radial-gradient(circle_at_88%_8%,rgba(99,102,241,0.14),transparent_26rem),linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#f1f5f9_100%)] text-slate-950">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-white px-4 py-3 font-semibold text-slate-950 shadow-lg focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:outline-2 focus:outline-offset-2 focus:outline-blue-700"
      >
        {content.skipToContent}
      </a>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 items-center px-4 py-12 focus:outline-none sm:px-6 lg:px-8"
      >
        <div className="mx-auto w-full max-w-4xl">
          <section
            aria-labelledby="retirement-title"
            className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:p-10 lg:p-12"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-800 ring-1 ring-blue-100">
                <Archive className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold tracking-[0.14em] text-blue-800 uppercase">{content.eyebrow}</p>
                <h1 id="retirement-title" className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">
                  {content.title}
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">{content.description}</p>
              </div>
            </div>

            <section aria-labelledby="safety-title" className="mt-10 border-t border-slate-200 pt-8">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-1 h-6 w-6 shrink-0 text-red-700" aria-hidden="true" />
                <div>
                  <h2 id="safety-title" className="text-2xl font-bold">
                    {content.safetyTitle}
                  </h2>
                  <p className="mt-2 leading-7 text-slate-700">{content.safetyDescription}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <article className="rounded-2xl border-2 border-red-200 bg-red-50 p-5">
                  <h3 className="text-lg font-bold text-red-950">{content.emergencyTitle}</h3>
                  <p className="mt-2 leading-7 text-red-950">{content.emergencyDescription}</p>
                  <a
                    href="tel:911"
                    className={`${actionClassName} mt-5 bg-red-700 text-white hover:bg-red-800 focus-visible:outline-red-800`}
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {content.call911}
                  </a>
                </article>

                <article className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
                  <h3 className="text-lg font-bold text-violet-950">{content.suicideTitle}</h3>
                  <p className="mt-2 leading-7 text-violet-950">{content.suicideDescription}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href="tel:988"
                      className={`${actionClassName} bg-violet-700 text-white hover:bg-violet-800 focus-visible:outline-violet-800`}
                    >
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      {content.call988}
                    </a>
                    <a
                      href="sms:988"
                      className={`${actionClassName} border border-violet-300 bg-white text-violet-950 hover:bg-violet-100 focus-visible:outline-violet-800`}
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      {content.text988}
                    </a>
                  </div>
                </article>
              </div>
            </section>

            <section
              aria-labelledby="navigation-title"
              className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <h2 id="navigation-title" className="text-xl font-bold">
                {content.navigationTitle}
              </h2>
              <p className="mt-2 max-w-3xl leading-7 text-slate-700">{content.navigationDescription}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="https://211ontario.ca/"
                  rel="noreferrer"
                  className={`${actionClassName} bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-900`}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  {content.visit211}
                </a>
                <a
                  href="tel:211"
                  className={`${actionClassName} border border-slate-300 bg-white text-slate-950 hover:bg-slate-100 focus-visible:outline-slate-900`}
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {content.call211}
                </a>
              </div>
            </section>

            <RetirementLocalDataControls content={content} />

            <p className="mt-8 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-600">{content.boundary}</p>
          </section>
        </div>
      </main>
    </div>
  )
}

import SubmitServiceForm from "@/components/forms/SubmitServiceForm"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"

export default function SubmitServicePage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-neutral-950">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 pt-32 pb-12">
        <SubmitServiceForm />
      </main>
      <Footer />
    </div>
  )
}

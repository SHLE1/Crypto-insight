import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center py-10">
      <section className="w-full max-w-2xl rounded-md border border-border bg-card px-6 py-14 text-center">
        <span className="section-eyebrow">404</span>
        <h1 className="mx-auto mt-4 max-w-[14ch] text-4xl font-semibold tracking-[-0.06em] text-foreground md:text-5xl">
          找不到这个页面
        </h1>
        <p className="mx-auto mt-4 max-w-[56ch] text-[0.96rem] leading-7 text-muted-foreground">
          请确认地址是否正确，或返回首页重新导航。
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-primary bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors duration-200"
          >
            回到总览
          </Link>
          <Link
            href="/wallets"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background/92 px-4 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted/60"
          >
            去钱包页
          </Link>
        </div>
      </section>
    </main>
  )
}

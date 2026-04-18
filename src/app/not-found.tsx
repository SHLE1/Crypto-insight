import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center py-10">
      <section className="w-full max-w-2xl rounded-[1.55rem] border border-border/80 bg-card/92 px-6 py-16 text-center shadow-[0_1px_0_color-mix(in_oklch,white_75%,transparent)_inset,0_18px_34px_-30px_color-mix(in_oklch,var(--foreground)_24%,transparent)]">
        <span className="section-eyebrow">404</span>
        <h1 className="mx-auto mt-4 max-w-[14ch] text-4xl font-semibold tracking-[-0.06em] text-foreground md:text-5xl">
          这个页面不存在，或者已经被移动。
        </h1>
        <p className="mx-auto mt-4 max-w-[56ch] text-[0.96rem] leading-7 text-muted-foreground">
          你可以回到总览重新进入钱包、交易所和 DeFi 页面，也可以直接前往钱包页继续操作。
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-primary bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_1px_0_color-mix(in_oklch,white_38%,transparent)_inset,0_18px_30px_-24px_color-mix(in_oklch,var(--primary)_58%,transparent)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:brightness-[1.02]"
          >
            回到总览
          </Link>
          <Link
            href="/wallets"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background/92 px-4 text-sm font-medium text-foreground shadow-[0_1px_0_color-mix(in_oklch,white_60%,transparent)_inset] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-foreground/12 hover:bg-muted/80"
          >
            查看钱包
          </Link>
        </div>
      </section>
    </main>
  )
}

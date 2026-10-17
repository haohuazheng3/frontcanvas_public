import { Card, Skeleton } from "@/components/ui";
import { TIERS } from "@/lib/pricing";

const LINE_WIDTHS = ["w-[88%]", "w-[72%]", "w-[94%]", "w-[64%]", "w-[80%]"];

/**
 * 定价页骨架 —— 卡片数量、清单行数、哪一张是主推，全部从报价源读，
 * 骨架与真实版式永远对得上，内容到达时不跳版。
 */
export default function PricingLoading() {
  return (
    <div className="fade" role="status" aria-busy="true">
      <span className="sr-only">Loading pricing</span>

      <section className="shell pt-12 pb-12 md:pt-20 md:pb-16">
        <div className="mx-auto max-w-[44rem] text-center">
          <Skeleton className="mx-auto h-4 w-24" />
          <Skeleton className="mx-auto mt-5 h-10 w-full max-w-[30rem] md:h-14" />
          <Skeleton className="mx-auto mt-6 h-4 w-full max-w-[28rem]" />
          <Skeleton className="mx-auto mt-2.5 h-4 w-3/5 max-w-[18rem]" />
        </div>

        {/* 报价卡 */}
        <div className="mt-12 grid gap-5 md:mt-16 md:grid-cols-3 md:items-start md:gap-6">
          {TIERS.map((tier) => (
            <Card
              key={tier.id}
              size={tier.featured ? "lg" : "md"}
              className={`p-6 md:p-8 ${tier.featured ? "md:-mt-4 md:pb-12" : ""}`}
            >
              {tier.featured && (
                <Skeleton className="mb-5 h-6 w-28 rounded-[var(--r-full)]" />
              )}
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-3 h-3.5 w-4/5" />

              <Skeleton className="mt-7 h-10 w-36 md:h-12" />
              <Skeleton className="mt-3 h-3 w-28" />

              <Skeleton className="mt-7 h-[3.25rem] w-full rounded-[var(--r-full)]" />

              {/* 行数与真实清单一致；宽度交错，免得骨架看起来像一张表格 */}
              <div className="mt-8 space-y-3.5">
                {tier.includes.map((line, i) => (
                  <div key={line} className="flex items-start gap-3">
                    <Skeleton className="mt-0.5 size-4 shrink-0 rounded-[var(--r-full)]" />
                    <Skeleton className={`h-3.5 ${LINE_WIDTHS[i % LINE_WIDTHS.length]}`} />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 底部答疑区 */}
      <section className="shell pb-20 md:pb-28">
        <Card size="lg" className="px-6 py-10 md:px-12 md:py-14">
          <Skeleton className="h-8 w-1/2 max-w-[22rem] md:h-9" />
          <div className="mt-9 space-y-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-2/3 max-w-[24rem]" />
                <Skeleton className="mt-3 h-3.5 w-full" />
                <Skeleton className="mt-2.5 h-3.5 w-[86%]" />
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

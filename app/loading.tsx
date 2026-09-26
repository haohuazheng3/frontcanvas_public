import { Card, Skeleton } from "@/components/ui";

/**
 * 全站兜底骨架屏 —— 铺出首页的模块轮廓：hero + 预览大图 + 三张卡。
 * 目的不是「像在加载」，而是让页面在数据到达前就已经占好位置，不跳版。
 */
export default function Loading() {
  return (
    <div className="fade" role="status" aria-busy="true">
      <span className="sr-only">Loading</span>

      {/* hero */}
      <section className="shell pt-12 pb-14 md:pt-20 md:pb-20">
        <div className="mx-auto max-w-[46rem] text-center">
          <Skeleton className="mx-auto h-7 w-44 rounded-[var(--r-full)]" />
          <Skeleton className="mx-auto mt-7 h-10 w-full max-w-[32rem] md:h-14" />
          <Skeleton className="mx-auto mt-3 h-10 w-4/5 max-w-[24rem] md:h-14" />
          <Skeleton className="mx-auto mt-7 h-4 w-full max-w-[30rem]" />
          <Skeleton className="mx-auto mt-2.5 h-4 w-3/5 max-w-[20rem]" />

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Skeleton className="h-[3.25rem] w-full max-w-[16rem] rounded-[var(--r-full)] sm:w-52" />
            <Skeleton className="h-[3.25rem] w-full max-w-[16rem] rounded-[var(--r-full)] sm:w-44" />
          </div>
        </div>

        {/* 预览大图 */}
        <Card size="xl" className="mt-12 overflow-hidden p-2.5 md:mt-16 md:p-4">
          <Skeleton className="h-[15rem] w-full rounded-[var(--r-xl)] md:h-[26rem]" />
        </Card>
      </section>

      {/* 三张卡 */}
      <section className="shell pb-20 md:pb-28">
        <div className="mx-auto mb-10 max-w-[40rem] text-center md:mb-14">
          <Skeleton className="mx-auto h-4 w-28" />
          <Skeleton className="mx-auto mt-5 h-8 w-full max-w-[26rem] md:h-10" />
        </div>

        <div className="grid gap-5 md:grid-cols-3 md:gap-6">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-6 md:p-7">
              <Skeleton className="size-11 rounded-[var(--r-md)]" />
              <Skeleton className="mt-6 h-5 w-1/2" />
              <Skeleton className="mt-4 h-3.5 w-full" />
              <Skeleton className="mt-2.5 h-3.5 w-[92%]" />
              <Skeleton className="mt-2.5 h-3.5 w-3/5" />
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

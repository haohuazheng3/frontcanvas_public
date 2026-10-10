import { Card, Skeleton, SkeletonText } from "@/components/ui";

/** /p/[slug] 骨架屏 —— 结构与真实页面对齐，加载时不跳版 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading the concept">
      {/* 开场 */}
      <div className="shell pt-10 pb-2 md:pt-16">
        <div className="max-w-[54rem]">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="mt-5 h-11 w-[92%] rounded-[var(--r-md)] md:h-16" />
          <Skeleton className="mt-3 h-11 w-[64%] rounded-[var(--r-md)] md:h-16" />
          <SkeletonText lines={3} className="mt-7 max-w-[44rem]" />
        </div>

        <Card size="sm" className="mt-9 p-6 md:mt-11 md:p-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <Skeleton className="h-3 w-28" />
                <SkeletonText lines={2} className="mt-3.5" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 前后对比 —— 两块大骨架 */}
      <div className="shell py-16 md:py-24">
        <div className="mb-10 max-w-[46rem] md:mb-14">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="mt-4 h-9 w-[80%] rounded-[var(--r-md)] md:h-12" />
          <SkeletonText lines={2} className="mt-5 max-w-[38rem]" />
        </div>

        <div className="grid gap-5 md:grid-cols-2 md:gap-7">
          {[0, 1].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
                <Skeleton className="h-7 w-32 rounded-[var(--r-full)]" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="aspect-[16/12] w-full rounded-none" />
            </Card>
          ))}
        </div>
      </div>

      {/* 问题清单 */}
      <div className="shell py-16 md:py-24">
        <div className="mb-10 max-w-[46rem] md:mb-14">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="mt-4 h-9 w-[74%] rounded-[var(--r-md)] md:h-12" />
          <SkeletonText lines={2} className="mt-5 max-w-[38rem]" />
        </div>

        <Card size="sm" className="mb-6 flex max-w-[42rem] items-center gap-5 p-5 md:p-6">
          <Skeleton className="size-[4.5rem] shrink-0 rounded-[var(--r-md)]" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-44" />
            <SkeletonText lines={2} className="mt-3" />
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 md:gap-5">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} size="sm" className="p-5 md:p-6">
              <Skeleton className="h-7 w-24 rounded-[var(--r-full)]" />
              <Skeleton className="mt-4 h-4 w-3/5" />
              <SkeletonText lines={2} className="mt-3" />
            </Card>
          ))}
        </div>
      </div>

      {/* 手机端预览 */}
      <div className="shell py-16 md:py-24">
        <div className="mb-10 max-w-[46rem] md:mb-14">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="mt-4 h-9 w-[68%] rounded-[var(--r-md)] md:h-12" />
        </div>
        <div className="mx-auto w-[16.75rem] md:w-[18.5rem]">
          <div className="rounded-[2.9rem] bg-surface p-3 shadow-float-xl">
            <Skeleton className="aspect-[9/19] w-full rounded-[2.1rem]" />
          </div>
        </div>
      </div>

      {/* 报价 */}
      <div className="shell py-16 md:py-24">
        <div className="mb-10 max-w-[46rem] md:mb-14">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="mt-4 h-9 w-[72%] rounded-[var(--r-md)] md:h-12" />
        </div>
        <div className="grid gap-5 md:grid-cols-3 md:gap-6">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-6 md:p-8">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="mt-3 h-3 w-40" />
              <Skeleton className="mt-6 h-10 w-32 rounded-[var(--r-md)]" />
              <SkeletonText lines={5} className="mt-7" />
              <Skeleton className="mt-8 h-11 w-full rounded-[var(--r-full)]" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Card, Skeleton } from "@/components/ui";

/** 文章卡：封面 + 日期/时长 + 标题两行 + 摘要两行 */
function PostCardSkeleton() {
  return (
    <Card className="overflow-hidden p-3">
      <Skeleton className="h-44 w-full rounded-[var(--r-md)] md:h-40" />
      <div className="px-3 pt-5 pb-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-4 h-5 w-[92%]" />
        <Skeleton className="mt-2.5 h-5 w-2/3" />
        <Skeleton className="mt-5 h-3.5 w-full" />
        <Skeleton className="mt-2.5 h-3.5 w-4/5" />
      </div>
    </Card>
  );
}

/** Journal 列表页骨架 —— 头图一篇 + 网格若干篇，与真实版式同构 */
export default function BlogLoading() {
  return (
    <div className="fade" role="status" aria-busy="true">
      <span className="sr-only">Loading the journal</span>

      <section className="shell pt-12 pb-10 md:pt-20 md:pb-14">
        <div className="max-w-[46rem]">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-5 h-10 w-full max-w-[28rem] md:h-14" />
          <Skeleton className="mt-6 h-4 w-full max-w-[34rem]" />
          <Skeleton className="mt-2.5 h-4 w-2/3 max-w-[22rem]" />
        </div>

        {/* 置顶长文 */}
        <Card size="lg" className="mt-12 overflow-hidden p-3 md:mt-14 md:p-4">
          <div className="grid gap-6 md:grid-cols-2 md:items-center md:gap-8">
            <Skeleton className="h-52 w-full rounded-[var(--r-lg)] md:h-72" />
            <div className="px-3 pb-4 md:px-4 md:pb-0">
              <Skeleton className="h-6 w-28 rounded-[var(--r-full)]" />
              <Skeleton className="mt-6 h-7 w-full md:h-8" />
              <Skeleton className="mt-3 h-7 w-3/4 md:h-8" />
              <Skeleton className="mt-6 h-3.5 w-full" />
              <Skeleton className="mt-2.5 h-3.5 w-[90%]" />
              <Skeleton className="mt-2.5 h-3.5 w-2/5" />
              <Skeleton className="mt-8 h-3 w-36" />
            </div>
          </div>
        </Card>
      </section>

      <section className="shell pb-20 md:pb-28">
        <div className="grid gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

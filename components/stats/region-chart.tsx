/**
 * @file region-chart.tsx
 * @description 지역별 관광지 분포 차트 컴포넌트
 *
 * 주요 기능:
 * 1. 지역별 관광지 개수를 Bar Chart로 시각화
 * 2. 바 클릭 시 해당 지역 목록 페이지로 이동
 * 3. 호버 시 Tooltip으로 상세 정보 표시
 * 4. 다크/라이트 모드 지원
 * 5. 반응형 디자인
 *
 * @see {@link /docs/PRD.md} - MVP 2.6.1 지역별 관광지 분포 요구사항
 */

"use client";

import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { RegionStats } from "@/lib/types/stats";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Props 인터페이스
 */
export interface RegionChartProps {
  regionStats: RegionStats[];
  isLoading?: boolean;
  className?: string;
}

/**
 * 숫자 포맷 함수 (천 단위 콤마)
 */
function formatNumber(count: number): string {
  return count.toLocaleString("ko-KR");
}

/**
 * 지역별 관광지 분포 차트 컴포넌트
 */
export default function RegionChart({
  regionStats,
  isLoading = false,
  className,
}: RegionChartProps) {
  const router = useRouter();

  // 로딩 상태
  if (isLoading) {
    return <RegionChartSkeleton className={className} />;
  }

  // 데이터 없을 경우
  if (!regionStats || regionStats.length === 0) {
    return (
      <section
        className={cn(
          "rounded-lg border bg-card p-6 md:p-8",
          className
        )}
        aria-label="지역별 관광지 분포"
      >
        <h2 className="text-2xl font-bold text-foreground mb-4">
          지역별 관광지 분포
        </h2>
        <p className="text-muted-foreground">
          지역별 관광지 데이터를 불러올 수 없습니다.
        </p>
      </section>
    );
  }

  // 상위 10개 지역만 표시 (PRD 요구사항)
  const displayStats = regionStats.slice(0, 10);

  // 차트 데이터 형식으로 변환
  const chartData = displayStats.map((stat) => ({
    name: stat.name,
    count: stat.count,
    code: stat.code,
  }));

  // Chart Config (shadcn/ui Chart 요구사항)
  const chartConfig = {
    count: {
      label: "관광지 개수",
      color: "hsl(var(--chart-1))",
    },
  };

  // 바 클릭 핸들러
  const handleBarClick = (data: unknown) => {
    if (data && typeof data === "object" && "code" in data) {
      const code = data.code as string;
      router.push(`/?areaCode=${code}`);
    }
  };

  return (
    <section
      className={cn("rounded-lg border bg-card p-6 md:p-8", className)}
      aria-label="지역별 관광지 분포"
      role="region"
    >
      <h2 className="text-2xl font-bold text-foreground mb-6">
        지역별 관광지 분포
      </h2>

      <div className="h-[400px] md:h-[500px]">
        <ChartContainer config={chartConfig}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            onClick={handleBarClick}
            style={{ cursor: "pointer" }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              className="text-xs"
              tickFormatter={(value) => formatNumber(value)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [
                    `${formatNumber(Number(value))}개`,
                    "관광지 개수",
                  ]}
                  labelFormatter={(label) => `지역: ${label}`}
                />
              }
            />
            <Bar
              dataKey="count"
              fill="hsl(var(--chart-1))"
              radius={[4, 4, 0, 0]}
              className="cursor-pointer transition-opacity hover:opacity-80"
            />
          </BarChart>
        </ChartContainer>
      </div>

      {/* 데이터 테이블 (접근성) */}
      <div className="mt-6 text-sm text-muted-foreground">
        <p className="sr-only">
          지역별 관광지 개수:{" "}
          {displayStats
            .map((stat) => `${stat.name} ${formatNumber(stat.count)}개`)
            .join(", ")}
        </p>
      </div>
    </section>
  );
}

/**
 * 지역별 분포 차트 스켈레톤 UI
 */
export function RegionChartSkeleton({ className }: { className?: string }) {
  return (
    <section
      className={cn("rounded-lg border bg-card p-6 md:p-8", className)}
      aria-label="지역별 관광지 분포 로딩 중"
      role="region"
    >
      <Skeleton className="h-7 w-48 mb-6" />
      <Skeleton className="h-[400px] md:h-[500px] w-full" />
    </section>
  );
}


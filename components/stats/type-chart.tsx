/**
 * @file type-chart.tsx
 * @description 타입별 관광지 분포 차트 컴포넌트
 *
 * 주요 기능:
 * 1. 타입별 관광지 개수를 Donut Chart로 시각화
 * 2. 섹션 클릭 시 해당 타입 목록 페이지로 이동
 * 3. 호버 시 Tooltip으로 상세 정보 표시 (타입명, 개수, 비율)
 * 4. 다크/라이트 모드 지원
 * 5. 반응형 디자인
 *
 * @see {@link /docs/PRD.md} - MVP 2.6.2 관광 타입별 분포 요구사항
 */

"use client";

import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, Legend } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { TypeStats } from "@/lib/types/stats";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Props 인터페이스
 */
export interface TypeChartProps {
  typeStats: TypeStats[];
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
 * 타입별 색상 매핑 (차트용)
 * tour-card.tsx의 getBadgeColorClass와 일치하는 색상 사용
 */
function getTypeColor(contentTypeId: string): string {
  const colorMap: Record<string, string> = {
    "12": "hsl(var(--chart-1))", // 관광지 - blue
    "14": "hsl(var(--chart-2))", // 문화시설 - purple
    "15": "hsl(var(--chart-3))", // 축제/행사 - orange
    "25": "hsl(var(--chart-4))", // 여행코스 - green
    "28": "hsl(var(--chart-5))", // 레포츠 - red
    "32": "hsl(var(--chart-1))", // 숙박 - yellow (chart-1 재사용)
    "38": "hsl(var(--chart-2))", // 쇼핑 - pink (chart-2 재사용)
    "39": "hsl(var(--chart-3))", // 음식점 - cyan (chart-3 재사용)
  };
  return (
    colorMap[contentTypeId] ||
    "hsl(var(--muted))" // 기본 색상
  );
}

/**
 * 타입별 관광지 분포 차트 컴포넌트
 */
export default function TypeChart({
  typeStats,
  isLoading = false,
  className,
}: TypeChartProps) {
  const router = useRouter();

  // 로딩 상태
  if (isLoading) {
    return <TypeChartSkeleton className={className} />;
  }

  // 데이터 없을 경우
  if (!typeStats || typeStats.length === 0) {
    return (
      <section
        className={cn("rounded-lg border bg-card p-6 md:p-8", className)}
        aria-label="타입별 관광지 분포"
      >
        <h2 className="text-2xl font-bold text-foreground mb-4">
          타입별 관광지 분포
        </h2>
        <p className="text-muted-foreground">
          타입별 관광지 데이터를 불러올 수 없습니다.
        </p>
      </section>
    );
  }

  // 차트 데이터 형식으로 변환
  const chartData = typeStats.map((stat) => ({
    name: stat.name,
    count: stat.count,
    percentage: stat.percentage,
    contentTypeId: stat.contentTypeId,
    fill: getTypeColor(stat.contentTypeId),
  }));

  // Chart Config (shadcn/ui Chart 요구사항)
  const chartConfig: Record<string, { label: string; color: string }> = {};
  typeStats.forEach((stat) => {
    chartConfig[stat.contentTypeId] = {
      label: stat.name,
      color: getTypeColor(stat.contentTypeId),
    };
  });

  // 섹션 클릭 핸들러
  const handlePieClick = (data: unknown) => {
    if (data && typeof data === "object" && "contentTypeId" in data) {
      const contentTypeId = data.contentTypeId as string;
      router.push(`/?contentTypeId=${contentTypeId}`);
    }
  };

  // 총 관광지 수 계산
  const totalCount = typeStats.reduce((sum, stat) => sum + stat.count, 0);

  return (
    <section
      className={cn("rounded-lg border bg-card p-6 md:p-8", className)}
      aria-label="타입별 관광지 분포"
      role="region"
    >
      <h2 className="text-2xl font-bold text-foreground mb-6">
        타입별 관광지 분포
      </h2>

      <div className="h-[400px] md:h-[500px]">
        <ChartContainer config={chartConfig}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              outerRadius={120}
              innerRadius={60}
              fill="#8884d8"
              dataKey="count"
              onClick={handlePieClick}
              style={{ cursor: "pointer" }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, props) => {
                    const payload = props.payload as typeof chartData[0];
                    return [
                      `${formatNumber(Number(value))}개 (${payload.percentage.toFixed(1)}%)`,
                      payload.name,
                    ];
                  }}
                />
              }
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => {
                // chartData에서 해당 타입의 비율 찾기
                const stat = chartData.find((item) => item.name === value);
                if (stat) {
                  return `${value} (${stat.percentage.toFixed(1)}%)`;
                }
                return value;
              }}
              wrapperStyle={{ fontSize: "12px" }}
            />
          </PieChart>
        </ChartContainer>
      </div>

      {/* 중앙 총 개수 표시 (선택 사항) */}
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          전체 관광지: <span className="font-semibold text-foreground">{formatNumber(totalCount)}개</span>
        </p>
      </div>

      {/* 데이터 테이블 (접근성) */}
      <div className="mt-6 text-sm text-muted-foreground">
        <p className="sr-only">
          타입별 관광지 개수:{" "}
          {typeStats
            .map(
              (stat) =>
                `${stat.name} ${formatNumber(stat.count)}개 (${stat.percentage.toFixed(1)}%)`
            )
            .join(", ")}
        </p>
      </div>
    </section>
  );
}

/**
 * 타입별 분포 차트 스켈레톤 UI
 */
export function TypeChartSkeleton({ className }: { className?: string }) {
  return (
    <section
      className={cn("rounded-lg border bg-card p-6 md:p-8", className)}
      aria-label="타입별 관광지 분포 로딩 중"
      role="region"
    >
      <Skeleton className="h-7 w-48 mb-6" />
      <Skeleton className="h-[400px] md:h-[500px] w-full" />
    </section>
  );
}


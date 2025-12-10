import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { Suspense } from "react";

/**
 * Instruments 데이터 조회 컴포넌트
 * 
 * Supabase 공식 문서의 예시를 기반으로 작성되었습니다.
 * https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 */
async function InstrumentsData() {
  const supabase = await createClerkSupabaseClient();
  const { data: instruments, error } = await supabase
    .from("instruments")
    .select();

  if (error) {
    console.error("Error fetching instruments:", error);
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400">
          데이터를 불러오는 중 오류가 발생했습니다: {error.message}
        </p>
        <p className="text-sm text-red-500 dark:text-red-500 mt-2">
          Supabase에서 instruments 테이블이 생성되었는지 확인하세요.
        </p>
      </div>
    );
  }

  if (!instruments || instruments.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <p className="text-yellow-600 dark:text-yellow-400">
          데이터가 없습니다. Supabase SQL Editor에서 샘플 데이터를 추가하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">악기 목록</h2>
      <ul className="space-y-2">
        {instruments.map((instrument: any) => (
          <li
            key={instrument.id}
            className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <span className="font-medium">{instrument.name}</span>
            {instrument.id && (
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                (ID: {instrument.id})
              </span>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-600 dark:text-blue-400">
          💡 이 페이지는 Supabase 공식 문서의 예시를 기반으로 작성되었습니다.
        </p>
        <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
          테이블이 없다면 Supabase SQL Editor에서 다음 SQL을 실행하세요:
        </p>
        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
          {`-- 테이블 생성
create table instruments (
  id bigint primary key generated always as identity,
  name text not null
);

-- 샘플 데이터 삽입
insert into instruments (name)
values
  ('violin'),
  ('viola'),
  ('cello');

-- RLS 활성화
alter table instruments enable row level security;

-- 공개 읽기 정책 추가
create policy "public can read instruments"
on public.instruments
for select
to anon
using (true);`}
        </pre>
      </div>
    </div>
  );
}

/**
 * Instruments 페이지
 * 
 * Supabase에서 instruments 테이블의 데이터를 조회하여 표시합니다.
 */
export default function Instruments() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Supabase 연결 테스트</h1>
      <Suspense
        fallback={
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p>악기 데이터를 불러오는 중...</p>
          </div>
        }
      >
        <InstrumentsData />
      </Suspense>
    </div>
  );
}


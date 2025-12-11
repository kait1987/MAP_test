/**
 * @file detail-map.tsx
 * @description 관광지 상세페이지 지도 섹션 컴포넌트
 *
 * 주요 기능:
 * 1. 해당 관광지 위치를 네이버 지도에 표시
 * 2. 마커 1개 표시
 * 3. 길찾기 버튼 (네이버 지도 앱/웹 연동)
 * 4. 좌표 정보 표시 (선택 사항)
 *
 * @see {@link /docs/PRD.md} - MVP 2.4.4 지도 섹션 요구사항
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Navigation, Copy, Check, Info } from "lucide-react";
import type { TourDetail } from "@/lib/types/tour";
import { convertKATECToWGS84 } from "@/lib/utils/coordinate";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Error } from "@/components/ui/error";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export interface DetailMapProps {
  detail: TourDetail;
  className?: string;
}

// Naver Maps API 타입 정의는 naver-map.tsx에서 전역으로 선언되어 있으므로 재사용

/**
 * Naver Maps API 스크립트 로드
 * naver-map.tsx의 loadNaverMapsScript 함수와 동일
 */
function loadNaverMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 이미 로드되어 있는지 확인
    if (window.naver && window.naver.maps) {
      resolve();
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    if (!clientId) {
      reject(new globalThis.Error("NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 환경변수가 설정되지 않았습니다."));
      return;
    }

    // 스크립트가 이미 추가되어 있는지 확인
    const existingScript = document.querySelector(
      `script[src*="openapi.map.naver.com"]`
    );
    if (existingScript) {
      // 스크립트가 있으면 로드 완료를 기다림
      const checkNaver = setInterval(() => {
        if (window.naver && window.naver.maps) {
          clearInterval(checkNaver);
          resolve();
        }
      }, 100);

      // 타임아웃 (10초)
      setTimeout(() => {
        clearInterval(checkNaver);
        if (!window.naver || !window.naver.maps) {
          reject(new globalThis.Error("Naver Maps API 로드 타임아웃"));
        }
      }, 10000);
      return;
    }

    // 스크립트 추가
    const script = document.createElement("script");
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.onload = () => {
      if (window.naver && window.naver.maps) {
        resolve();
      } else {
        reject(new globalThis.Error("Naver Maps API 로드 실패"));
      }
    };
    script.onerror = () => {
      reject(new globalThis.Error("Naver Maps API 스크립트 로드 실패"));
    };
    document.head.appendChild(script);
  });
}

/**
 * 네이버 지도 길찾기 URL 생성
 */
function getDirectionsUrl(lat: number, lng: number): string {
  return `https://map.naver.com/v5/directions/${lat},${lng}`;
}

export default function DetailMap({ detail, className }: DetailMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markerRef = useRef<naver.maps.Marker | null>(null);
  const infoWindowRef = useRef<naver.maps.InfoWindow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [copied, setCopied] = useState(false);

  // 좌표 변환 (useMemo로 처리하여 Hook 규칙 준수)
  const coords = useMemo(() => {
    // 디버깅: 좌표 정보 확인
    if (process.env.NODE_ENV === "development") {
      console.log("[DetailMap] 좌표 정보 확인:", {
        contentId: detail.contentid,
        title: detail.title,
        mapx: detail.mapx || "없음",
        mapy: detail.mapy || "없음",
        mapxType: typeof detail.mapx,
        mapyType: typeof detail.mapy,
        mapxIsEmpty: detail.mapx === "" || detail.mapx === null || detail.mapx === undefined,
        mapyIsEmpty: detail.mapy === "" || detail.mapy === null || detail.mapy === undefined,
      });
    }

    // 빈 문자열, null, undefined 체크
    if (!detail.mapx || detail.mapx === "" || !detail.mapy || detail.mapy === "") {
      if (process.env.NODE_ENV === "development") {
        console.warn("[DetailMap] ⚠️ 좌표 정보 없음:", {
          contentId: detail.contentid,
          title: detail.title,
          mapx: detail.mapx || "없음",
          mapy: detail.mapy || "없음",
        });
      }
      return null;
    }

    try {
      const result = convertKATECToWGS84(detail.mapx, detail.mapy);
      if (process.env.NODE_ENV === "development") {
        console.log("[DetailMap] ✅ 좌표 변환 성공:", {
          contentId: detail.contentid,
          title: detail.title,
          원본좌표: { mapx: detail.mapx, mapy: detail.mapy },
          변환된좌표: result,
        });
      }
      return result;
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[DetailMap] ❌ 좌표 변환 실패:", {
          contentId: detail.contentid,
          title: detail.title,
          mapx: detail.mapx,
          mapy: detail.mapy,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      return null;
    }
  }, [detail.mapx, detail.mapy, detail.contentid, detail.title]);

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[DetailMap] ⚠️ mapRef.current가 없음");
      }
      return;
    }

    if (!coords) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[DetailMap] ⚠️ 좌표가 없어 지도를 초기화할 수 없음");
      }
      return;
    }

    let isMounted = true;

    if (process.env.NODE_ENV === "development") {
      console.log("[DetailMap] 지도 초기화 시작:", {
        contentId: detail.contentid,
        title: detail.title,
        coords,
      });
    }

    loadNaverMapsScript()
      .then(() => {
        if (process.env.NODE_ENV === "development") {
          console.log("[DetailMap] ✅ Naver Maps API 로드 완료");
        }

        if (!isMounted || !mapRef.current) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[DetailMap] ⚠️ 컴포넌트가 언마운트되었거나 mapRef가 없음");
          }
          return;
        }

        try {
          if (process.env.NODE_ENV === "development") {
            console.log("[DetailMap] 지도 생성 시작:", {
              center: { lat: coords.lat, lng: coords.lng },
            });
          }

          // 지도 생성
          const map = new window.naver.maps.Map(mapRef.current, {
            center: new window.naver.maps.LatLng(coords.lat, coords.lng),
            zoom: 15, // 상세하게 표시
            zoomControl: true,
            zoomControlOptions: {
              position: window.naver.maps.Position.TOP_RIGHT,
            },
          });

          if (process.env.NODE_ENV === "development") {
            console.log("[DetailMap] ✅ 지도 생성 완료");
          }

          mapInstanceRef.current = map;

          // 마커 아이콘 생성 (원형 파란색 마커)
          const markerIcon = {
            content: `
              <div style="
                width: 32px;
                height: 32px;
                background-color: #3b82f6;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="
                  width: 12px;
                  height: 12px;
                  background-color: white;
                  border-radius: 50%;
                "></div>
              </div>
            `,
            anchor: new window.naver.maps.Point(16, 16),
          };

          // 마커 생성
          const marker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(coords.lat, coords.lng),
            map: map,
            title: detail.title,
            icon: markerIcon,
          });

          markerRef.current = marker;

          // 인포윈도우 생성 (선택 사항 - 마커 클릭 시 표시)
          const infoWindowContent = `
            <div style="
              padding: 12px;
              min-width: 200px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
              <div style="
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 4px;
                color: #1f2937;
              ">${escapeHtml(detail.title)}</div>
              <div style="
                font-size: 12px;
                color: #6b7280;
              ">${escapeHtml(detail.addr1)}</div>
            </div>
          `;

          const infoWindow = new window.naver.maps.InfoWindow({
            content: infoWindowContent,
          });

          infoWindowRef.current = infoWindow;

          // 마커 클릭 시 인포윈도우 표시
          window.naver.maps.Event.addListener(marker, "click", () => {
            if (infoWindowRef.current && mapInstanceRef.current) {
              infoWindowRef.current.open(mapInstanceRef.current, marker);
            }
          });

          if (process.env.NODE_ENV === "development") {
            console.log("[DetailMap] ✅ 지도 초기화 완료");
          }

          setIsLoading(false);
        } catch (err) {
          if (process.env.NODE_ENV === "development") {
            console.error("[DetailMap] ❌ 지도 초기화 실패:", {
              contentId: detail.contentid,
              title: detail.title,
              error: err instanceof Error ? err.message : String(err),
              stack: err instanceof Error ? err.stack : undefined,
            });
          }
          if (isMounted) {
            setError(
              err instanceof globalThis.Error
                ? err
                : new globalThis.Error("지도를 불러올 수 없습니다.")
            );
            setIsLoading(false);
          }
        }
      })
      .catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.error("[DetailMap] ❌ Naver Maps API 로드 실패:", {
            contentId: detail.contentid,
            title: detail.title,
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
          });
        }
        if (isMounted) {
          setError(
            err instanceof globalThis.Error
              ? err
              : new globalThis.Error("지도를 불러올 수 없습니다.")
          );
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      
      // Cleanup: 마커 제거
      if (markerRef.current) {
        try {
          markerRef.current.setMap(null);
          markerRef.current = null;
        } catch (err) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[DetailMap] 마커 cleanup 중 오류:", err);
          }
        }
      }
      
      // Cleanup: 인포윈도우 닫기
      if (infoWindowRef.current) {
        try {
          infoWindowRef.current.close();
          infoWindowRef.current = null;
        } catch (err) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[DetailMap] 인포윈도우 cleanup 중 오류:", err);
          }
        }
      }
      
      // Cleanup: 지도 인스턴스 정리
      if (mapInstanceRef.current) {
        try {
          // 지도 이벤트 리스너 제거는 Naver Maps API가 자동으로 처리
          mapInstanceRef.current = null;
        } catch (err) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[DetailMap] 지도 인스턴스 cleanup 중 오류:", err);
          }
        }
      }
      
      if (process.env.NODE_ENV === "development") {
        console.log("[DetailMap] cleanup 완료");
      }
    };
  }, [detail.mapx, detail.mapy, detail.title, detail.addr1, coords, detail.contentid]);

  // HTML 이스케이프 함수 (XSS 방지)
  // React2Shell 보안 취약점 방지를 위한 완전한 HTML 이스케이프
  function escapeHtml(text: string): string {
    if (typeof text !== "string") {
      return String(text);
    }
    // textContent를 사용하는 방법은 안전하지만, 명시적으로 모든 특수 문자를 이스케이프
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/\//g, "&#x2F;");
  }

  // 좌표 복사 핸들러
  const handleCopyCoordinates = async () => {
    if (!coords) return;

    const coordText = `${coords.lat}, ${coords.lng}`;
    try {
      if (typeof window !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(coordText);
        setCopied(true);
        toast.success("좌표가 복사되었습니다");
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = coordText;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        toast.success("좌표가 복사되었습니다");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("좌표 복사 실패:", error);
      toast.error("좌표 복사에 실패했습니다");
    }
  };

  // 길찾기 URL 생성
  const directionsUrl = coords ? getDirectionsUrl(coords.lat, coords.lng) : null;

  // 좌표가 없으면 섹션을 표시하지 않음 (Hook 호출 이후에 early return)
  if (!coords) {
    return null;
  }

  if (error) {
    return (
      <section className={cn("rounded-lg border bg-card p-6 md:p-8", className)}>
        <h2 className="text-2xl font-bold text-foreground mb-4">지도</h2>
        <Error
          type="api"
          message={error.message}
          onRetry={() => {
            setError(null);
            setIsLoading(true);
            window.location.reload();
          }}
          showRetry={true}
        />
      </section>
    );
  }

  return (
    <section
      className={cn("rounded-lg border bg-card p-6 md:p-8", className)}
      aria-label="지도"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">지도</h2>
        <div className="flex items-center gap-2">
          {/* 좌표 정보 토글 버튼 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCoordinates(!showCoordinates)}
            aria-label="좌표 정보 표시/숨김"
          >
            <Info className="h-4 w-4 mr-2" aria-hidden="true" />
            좌표
          </Button>
        </div>
      </div>

      {/* 좌표 정보 표시 (토글) */}
      {showCoordinates && coords && (
        <div className="mb-4 p-3 rounded-lg bg-muted flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm text-foreground">
              위도: {coords.lat.toFixed(6)}, 경도: {coords.lng.toFixed(6)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyCoordinates}
            aria-label="좌표 복사"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" aria-hidden="true" />
                복사됨
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                복사
              </>
            )}
          </Button>
        </div>
      )}

      {/* 지도 컨테이너 */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10">
            <Skeleton className="w-full h-[400px] md:h-[600px] rounded-lg" />
          </div>
        )}
        <div
          ref={mapRef}
          className={cn(
            "w-full rounded-lg border bg-card",
            isLoading ? "h-0 opacity-0" : "h-[400px] md:h-[600px] opacity-100 transition-opacity duration-300"
          )}
          aria-label="네이버 지도"
        />

        {/* 길찾기 버튼 (지도 위에 absolute positioning) */}
        {!isLoading && directionsUrl && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <Button
              asChild
              size="lg"
              className="shadow-lg"
              aria-label="길찾기"
            >
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="h-5 w-5 mr-2" aria-hidden="true" />
                길찾기
              </a>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}


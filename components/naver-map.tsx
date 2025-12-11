/**
 * @file naver-map.tsx
 * @description 네이버 지도 컴포넌트
 *
 * 주요 기능:
 * 1. Naver Maps JavaScript API v3 (NCP)를 사용한 지도 표시
 * 2. 관광지 목록을 마커로 표시
 * 3. 마커 클릭 시 인포윈도우 표시
 * 4. 지도-리스트 연동
 *
 * @see {@link /docs/PRD.md} - MVP 2.2 네이버 지도 연동 요구사항
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";

import type { TourItem } from "@/lib/types/tour";
import { convertKATECToWGS84 } from "@/lib/utils/coordinate";
import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";
import { Error } from "@/components/ui/error";


export interface NaverMapProps {
  tours: TourItem[];
  selectedTourId?: string | null;
  onTourSelect?: (tourId: string) => void;
  className?: string;
}

// Naver Maps API 타입 정의
declare global {
  interface Window {
    naver: {
      maps: {
        Map: new (element: HTMLElement, options: {
          center: naver.maps.LatLng;
          zoom: number;
          zoomControl?: boolean;
          zoomControlOptions?: {
            position: naver.maps.Position;
          };
        }) => naver.maps.Map;
        Marker: new (options: {
          position: naver.maps.LatLng;
          map: naver.maps.Map;
          title?: string;
          icon?: {
            content: string;
            anchor: naver.maps.Point;
          };
        }) => naver.maps.Marker;
        InfoWindow: new (options: {
          content: string;
        }) => naver.maps.InfoWindow;
        LatLng: new (lat: number, lng: number) => naver.maps.LatLng;
        LatLngBounds: new () => naver.maps.LatLngBounds;
        Point: new (x: number, y: number) => naver.maps.Point;
        Position: {
          TOP_RIGHT: number;
        };
        Event: {
          addListener: (
            target: naver.maps.Marker,
            event: string,
            listener: () => void
          ) => void;
        };
      };
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace naver {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace maps {
      interface Map {
        panTo(latlng: LatLng): void;
        setCenter(latlng: LatLng): void;
        setZoom(zoom: number): void;
        fitBounds(bounds: LatLngBounds): void;
      }
      interface Marker {
        getTitle(): string;
        setMap(map: Map | null): void;
      }
      interface InfoWindow {
        open(map: Map, marker: Marker): void;
        close(): void;
      }
      interface LatLng {
        lat(): number;
        lng(): number;
      }
      interface LatLngBounds {
        extend(latlng: LatLng): void;
      }
      interface Point {
        x: number;
        y: number;
      }
      type Position = number;
    }
  }
}

/**
 * Naver Maps API 스크립트 로드
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

export default function NaverMap({
  tours,
  selectedTourId,
  onTourSelect,
  className,
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const infoWindowsRef = useRef<naver.maps.InfoWindow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 지도 초기화
  /**
   * 마커 업데이트 함수
   */
  const updateMarkers = useCallback((map: naver.maps.Map, tourList: TourItem[]) => {
    // 기존 마커 및 인포윈도우 제거
    markersRef.current.forEach((marker) => marker.setMap(null));
    infoWindowsRef.current.forEach((infoWindow) => infoWindow.close());
    markersRef.current = [];
    infoWindowsRef.current = [];

    if (process.env.NODE_ENV === "development") {
      console.group("[NaverMap] 마커 업데이트");
      console.log("관광지 개수:", tourList.length);
    }

    // 새 마커 생성
    let successCount = 0;
    let failCount = 0;
    const coordMap = new Map<string, number>(); // 좌표별 개수 추적
    
    tourList.forEach((tour) => {
      try {
        if (!tour.mapx || !tour.mapy) {
          if (process.env.NODE_ENV === "development") {
            console.warn(`[NaverMap] 좌표 없음: ${tour.title} (contentId: ${tour.contentid})`, {
              mapx: tour.mapx,
              mapy: tour.mapy,
            });
          }
          failCount++;
          return;
        }
        
        // 좌표 변환
        let coords;
        try {
          coords = convertKATECToWGS84(tour.mapx, tour.mapy);
          
          // 한국 영역 검사
          if (coords.lat < 33 || coords.lat > 43 || coords.lng < 124 || coords.lng > 132) {
            if (process.env.NODE_ENV === "development") {
              console.warn(`[NaverMap] 좌표가 한국 영역을 벗어남: ${tour.title}`, {
                contentId: tour.contentid,
                mapx: tour.mapx,
                mapy: tour.mapy,
                coords,
              });
            }
            failCount++;
            return;
          }
        } catch (err) {
          if (process.env.NODE_ENV === "development") {
            const errorMessage = err instanceof globalThis.Error ? err.message : String(err);
            const errorStack = err instanceof globalThis.Error ? err.stack : undefined;
            console.error(`[NaverMap] ❌ 좌표 변환 실패: ${tour.title}`, {
              contentId: tour.contentid,
              title: tour.title,
              mapx: tour.mapx,
              mapy: tour.mapy,
              mapxType: typeof tour.mapx,
              mapyType: typeof tour.mapy,
              mapxStr: String(tour.mapx),
              mapyStr: String(tour.mapy),
              mapxNum: parseFloat(String(tour.mapx)),
              mapyNum: parseFloat(String(tour.mapy)),
              errorMessage: errorMessage || "에러 메시지 없음",
              errorStack: errorStack || "스택 없음",
              errorType: err?.constructor?.name || typeof err,
              error: err,
            });
          }
          failCount++;
          return;
        }
        
        // 좌표 중복 확인
        const coordKey = `${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`;
        const coordCount = (coordMap.get(coordKey) || 0) + 1;
        coordMap.set(coordKey, coordCount);
        
        // 처음 5개만 상세 로그
        if (process.env.NODE_ENV === "development" && successCount < 5) {
          console.log(`[NaverMap] 마커 생성 (${successCount + 1}번째): ${tour.title}`, {
            contentId: tour.contentid,
            mapx: tour.mapx,
            mapy: tour.mapy,
            coords,
            position: coordKey,
            같은좌표개수: coordCount,
          });
        }
        
        const position = new window.naver.maps.LatLng(coords.lat, coords.lng);

        // 마커 생성
        const marker = new window.naver.maps.Marker({
          position,
          map,
          title: tour.contentid,
          icon: {
            content: `<div style="
              width: 30px;
              height: 30px;
              background-color: #3b82f6;
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>`,
            anchor: new window.naver.maps.Point(15, 15),
          },
        });

        // 인포윈도우 생성 (HTML 문자열 사용)
        // React2Shell 보안 취약점 방지를 위한 완전한 HTML 이스케이프
        const escapeHtml = (text: string): string => {
          if (typeof text !== "string") return String(text);
          return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;")
            .replace(/\//g, "&#x2F;");
        };
        
        const escapedTitle = escapeHtml(tour.title);
        const escapedAddr = escapeHtml(`${tour.addr1}${tour.addr2 ? ` ${tour.addr2}` : ""}`);
        const escapedContentId = escapeHtml(tour.contentid);
        
        const infoWindow = new window.naver.maps.InfoWindow({
          content: `
            <div style="
              padding: 12px;
              min-width: 200px;
              font-family: system-ui, -apple-system, sans-serif;
            ">
              <h3 style="
                margin: 0 0 8px 0;
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
              ">${escapedTitle}</h3>
              <p style="
                margin: 0 0 12px 0;
                font-size: 14px;
                color: #6b7280;
              ">${escapedAddr}</p>
              <p style="
                margin: 0 0 12px 0;
                font-size: 14px;
                color: #6b7280;
              ">${escapedAddr}</p>
              <a
                href="/places/${escapedContentId}"
                style="
                  display: inline-block;
                  padding: 6px 12px;
                  background-color: #3b82f6;
                  color: white;
                  text-decoration: none;
                  border-radius: 4px;
                  font-size: 14px;
                  font-weight: 500;
                  cursor: pointer;
                "
                onmouseover="this.style.backgroundColor='#2563eb'"
                onmouseout="this.style.backgroundColor='#3b82f6'"
              >상세보기</a>
            </div>
          `,
        });

        // 마커 클릭 이벤트
        window.naver.maps.Event.addListener(marker, "click", () => {
          // 다른 인포윈도우 닫기
          infoWindowsRef.current.forEach((iw) => iw.close());
          // 현재 인포윈도우 열기
          infoWindow.open(map, marker);
          // 리스트 연동
          if (onTourSelect) {
            onTourSelect(tour.contentid);
          }
        });

        markersRef.current.push(marker);
        infoWindowsRef.current.push(infoWindow);
        successCount++;
      } catch (err) {
        failCount++;
        if (process.env.NODE_ENV === "development") {
          console.error(`[NaverMap] 마커 생성 실패 (${tour.contentid}):`, err, {
            title: tour.title,
            mapx: tour.mapx,
            mapy: tour.mapy,
          });
        }
      }
    });
    
    if (process.env.NODE_ENV === "development") {
      console.log(`[NaverMap] 마커 생성 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
      console.log(`[NaverMap] 고유 좌표 개수: ${coordMap.size}개`);
      
      // 중복 좌표 확인
      const duplicateCoords = Array.from(coordMap.entries())
        .filter(([_, count]) => count > 1)
        .map(([coord, count]) => ({ coord, count }));
      
      if (duplicateCoords.length > 0) {
        console.warn(`[NaverMap] 중복 좌표 발견:`, duplicateCoords);
      }
      
      console.groupEnd();
    }
  }, [onTourSelect]);

  useEffect(() => {
    if (!mapRef.current) return;

    let isMounted = true;

    loadNaverMapsScript()
      .then(() => {
        if (!isMounted || !mapRef.current) return;

        try {
          // 초기 중심 좌표 설정 (서울 또는 첫 번째 관광지)
          let centerLat = 37.5665; // 서울 기본값
          let centerLng = 126.9780;
          let hasValidCenter = false;

          // 유효한 좌표를 가진 첫 번째 관광지를 찾아 중심점으로 설정
          for (const tour of tours) {
            try {
              if (tour.mapx && tour.mapy) {
                const coords = convertKATECToWGS84(tour.mapx, tour.mapy);
                // 한국 영역 검사
                if (coords.lat >= 33 && coords.lat <= 43 && coords.lng >= 124 && coords.lng <= 132) {
                  centerLat = coords.lat;
                  centerLng = coords.lng;
                  hasValidCenter = true;
                  if (process.env.NODE_ENV === "development") {
                    console.log("[NaverMap] 초기 중심 좌표 설정:", {
                      title: tour.title,
                      coords,
                      mapx: tour.mapx,
                      mapy: tour.mapy,
                    });
                  }
                  break;
                }
              }
            } catch (err) {
              if (process.env.NODE_ENV === "development") {
                console.warn("[NaverMap] 초기 중심 좌표 설정 실패:", tour.title, err);
              }
              continue;
            }
          }
          
          if (!hasValidCenter && process.env.NODE_ENV === "development") {
            console.warn("[NaverMap] 유효한 중심 좌표를 찾지 못해 서울 기본값 사용");
          }

          // 지도 생성
          if (process.env.NODE_ENV === "development") {
            console.log("[NaverMap] 지도 생성:", {
              centerLat,
              centerLng,
              hasValidCenter,
              toursCount: tours.length,
            });
          }
          
          const map = new window.naver.maps.Map(mapRef.current, {
            center: new window.naver.maps.LatLng(centerLat, centerLng),
            zoom: hasValidCenter ? 13 : 11, // 유효한 중심이 없으면 더 넓은 범위
            zoomControl: true,
            zoomControlOptions: {
              position: window.naver.maps.Position.TOP_RIGHT,
            },
          });

          mapInstanceRef.current = map;

          // 마커 생성
          updateMarkers(map, tours);

          // 모든 마커가 보이도록 지도 범위 조정
          if (tours.length > 0) {
            const bounds = new window.naver.maps.LatLngBounds();
            let hasValidBounds = false;
            const validCoords: Array<{ lat: number; lng: number; title: string }> = [];
            
            tours.forEach((tour) => {
              try {
                if (tour.mapx && tour.mapy) {
                  const coords = convertKATECToWGS84(tour.mapx, tour.mapy);
                  // 좌표 범위 검사 (한국 영역: 위도 33-43, 경도 124-132)
                  if (coords.lat >= 33 && coords.lat <= 43 && coords.lng >= 124 && coords.lng <= 132) {
                    const position = new window.naver.maps.LatLng(coords.lat, coords.lng);
                    bounds.extend(position);
                    validCoords.push({ ...coords, title: tour.title });
                    hasValidBounds = true;
                  } else {
                    if (process.env.NODE_ENV === "development") {
                      console.warn(`[NaverMap] 좌표가 한국 영역을 벗어남: ${tour.title}`, {
                        contentId: tour.contentid,
                        coords,
                        mapx: tour.mapx,
                        mapy: tour.mapy,
                      });
                    }
                  }
                }
              } catch (err) {
                if (process.env.NODE_ENV === "development") {
                  console.warn(`[NaverMap] 좌표 변환 실패 (bounds): ${tour.title}`, err);
                }
              }
            });
            
            if (process.env.NODE_ENV === "development") {
              console.log("[NaverMap] 지도 범위 조정:", {
                validCoordsCount: validCoords.length,
                hasValidBounds,
                coords: validCoords.slice(0, 5), // 처음 5개만 표시
              });
            }
            
            if (hasValidBounds && validCoords.length > 1) {
              // 여러 마커가 있으면 범위로 조정
              map.fitBounds(bounds);
              if (process.env.NODE_ENV === "development") {
                console.log("[NaverMap] 지도 범위로 조정 완료");
              }
            } else if (validCoords.length === 1) {
              // 마커가 하나면 해당 위치로 이동
              const firstCoord = validCoords[0];
              map.setCenter(new window.naver.maps.LatLng(firstCoord.lat, firstCoord.lng));
              map.setZoom(15);
              if (process.env.NODE_ENV === "development") {
                console.log("[NaverMap] 단일 마커 위치로 이동:", firstCoord);
              }
            } else if (validCoords.length > 0) {
              // 유효한 좌표가 있지만 범위가 없으면 첫 번째 좌표로 이동
              const firstCoord = validCoords[0];
              map.setCenter(new window.naver.maps.LatLng(firstCoord.lat, firstCoord.lng));
              map.setZoom(13);
              if (process.env.NODE_ENV === "development") {
                console.log("[NaverMap] 첫 번째 좌표로 이동:", firstCoord);
              }
            } else {
              if (process.env.NODE_ENV === "development") {
                console.warn("[NaverMap] 유효한 좌표가 없어 지도 범위 조정 불가");
              }
            }
          }

          setIsLoading(false);
        } catch (err) {
          if (isMounted) {
            setError(
              err instanceof globalThis.Error
                ? err
                : new globalThis.Error("지도 초기화 중 오류가 발생했습니다.")
            );
            setIsLoading(false);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof globalThis.Error
              ? err
              : new globalThis.Error("Naver Maps API 로드 실패")
          );
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      // 마커 및 인포윈도우 정리
      markersRef.current.forEach((marker) => marker.setMap(null));
      infoWindowsRef.current.forEach((infoWindow) => infoWindow.close());
      markersRef.current = [];
      infoWindowsRef.current = [];
    };
  }, [tours, updateMarkers]); // 초기화는 한 번만, tours가 변경되면 아래 useEffect에서 처리

  // 관광지 목록 변경 시 마커 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    updateMarkers(mapInstanceRef.current, tours);

    // 모든 마커가 보이도록 지도 범위 조정
    if (tours.length > 0) {
      const bounds = new window.naver.maps.LatLngBounds();
      let hasValidBounds = false;
      const validCoords: Array<{ lat: number; lng: number }> = [];
      
      tours.forEach((tour) => {
        try {
          if (tour.mapx && tour.mapy) {
            const coords = convertKATECToWGS84(tour.mapx, tour.mapy);
            // 좌표 범위 검사 (한국 영역: 위도 33-43, 경도 124-132)
            if (coords.lat >= 33 && coords.lat <= 43 && coords.lng >= 124 && coords.lng <= 132) {
              bounds.extend(new window.naver.maps.LatLng(coords.lat, coords.lng));
              validCoords.push(coords);
              hasValidBounds = true;
            }
          }
        } catch (err) {
          // 좌표 변환 실패는 조용히 무시 (bounds 계산 제외)
          if (process.env.NODE_ENV === "development") {
            const errorMessage = err instanceof globalThis.Error ? err.message : String(err);
            console.warn(`[NaverMap] 좌표 변환 실패 (bounds 계산 제외): ${tour.title}`, {
              contentId: tour.contentid,
              mapx: tour.mapx,
              mapy: tour.mapy,
              errorMessage,
            });
          }
        }
      });
      
      if (hasValidBounds) {
        mapInstanceRef.current.fitBounds(bounds);
      } else if (validCoords.length > 0) {
        // 유효한 좌표가 있지만 범위가 없으면 첫 번째 좌표로 이동
        const firstCoord = validCoords[0];
        mapInstanceRef.current.setCenter(new window.naver.maps.LatLng(firstCoord.lat, firstCoord.lng));
        mapInstanceRef.current.setZoom(13);
      }
    }
  }, [tours, updateMarkers]);

  // 선택된 관광지로 지도 이동
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedTourId) return;

    const selectedTour = tours.find((tour) => tour.contentid === selectedTourId);
    if (!selectedTour) return;

    // 좌표 변환 (에러 처리 추가)
    let coords;
    try {
      if (!selectedTour.mapx || !selectedTour.mapy) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[NaverMap] 선택된 관광지 좌표 없음: ${selectedTour.title}`, {
            contentId: selectedTour.contentid,
            mapx: selectedTour.mapx,
            mapy: selectedTour.mapy,
          });
        }
        return;
      }

      coords = convertKATECToWGS84(selectedTour.mapx, selectedTour.mapy);
      
      // 한국 영역 검사
      if (coords.lat < 33 || coords.lat > 43 || coords.lng < 124 || coords.lng > 132) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[NaverMap] 선택된 관광지 좌표가 한국 영역을 벗어남: ${selectedTour.title}`, {
            contentId: selectedTour.contentid,
            coords,
          });
        }
        return;
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        const errorMessage = err instanceof globalThis.Error ? err.message : String(err);
        console.error(`[NaverMap] ❌ 선택된 관광지 좌표 변환 실패: ${selectedTour.title}`, {
          contentId: selectedTour.contentid,
          mapx: selectedTour.mapx,
          mapy: selectedTour.mapy,
          errorMessage,
        });
      }
      return;
    }

    const position = new window.naver.maps.LatLng(coords.lat, coords.lng);

    // 지도 중심 이동
    mapInstanceRef.current.panTo(position);
    mapInstanceRef.current.setZoom(15);

    // 해당 마커의 인포윈도우 열기
    const markerIndex = markersRef.current.findIndex(
      (marker) => marker.getTitle() === selectedTourId
    );
    if (markerIndex !== -1 && infoWindowsRef.current[markerIndex]) {
      // 다른 인포윈도우 닫기
      infoWindowsRef.current.forEach((infoWindow) => infoWindow.close());
      // 선택된 마커의 인포윈도우 열기
      infoWindowsRef.current[markerIndex].open(
        mapInstanceRef.current,
        markersRef.current[markerIndex]
      );
    }
  }, [selectedTourId, tours]);

  if (error) {
    return (
      <div className={cn(className, "min-h-[600px]")}>
        <Error
          type="api"
          message={error.message}
          onRetry={() => {
            setError(null);
            setIsLoading(true);
            // 재시도는 컴포넌트 재마운트로 처리
            window.location.reload();
          }}
          showRetry={true}
        />
      </div>
    );
  }

  return (
    <div className={cn(className, "relative")}>
      {isLoading && (
        <Skeleton className="absolute inset-0 z-10 w-full h-full rounded-lg" />
      )}
      <div
        ref={mapRef}
        className="w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-lg border bg-card"
        aria-label="네이버 지도"
      />
    </div>
  );
}


/**
 * @file tour.ts
 * @description 한국관광공사 공공 API 응답 타입 정의
 *
 * 이 파일은 한국관광공사 KorService2 API의 모든 응답 타입을 정의합니다.
 * PRD.md 5장 (데이터 구조)를 참고하여 작성되었습니다.
 *
 * @see {@link /docs/PRD.md} - API 명세 및 데이터 구조
 */

/**
 * 지역코드 조회 응답 항목
 */
export interface AreaCodeItem {
  code: string; // 지역코드
  name: string; // 지역명
  rnum?: number; // 순번
}

/**
 * 관광지 목록 항목 (areaBasedList2, searchKeyword2 응답)
 * PRD 5.1 참고
 */
export interface TourItem {
  addr1: string; // 주소
  addr2?: string; // 상세주소
  areacode: string; // 지역코드
  contentid: string; // 콘텐츠ID
  contenttypeid: string; // 콘텐츠타입ID
  title: string; // 제목
  mapx: string; // 경도 (KATEC 좌표계, 정수형)
  mapy: string; // 위도 (KATEC 좌표계, 정수형)
  firstimage?: string; // 대표이미지1
  firstimage2?: string; // 대표이미지2
  tel?: string; // 전화번호
  cat1?: string; // 대분류
  cat2?: string; // 중분류
  cat3?: string; // 소분류
  modifiedtime: string; // 수정일
  // 추가 필드 (API 응답에 포함될 수 있음)
  sigungucode?: string; // 시군구코드
  booktour?: string; // 예약안내
  zipcode?: string; // 우편번호
  dist?: string; // 거리
  mlevel?: string; // 맵레벨
  // 반려동물 정보 (클라이언트 사이드에서 추가)
  petInfo?: PetTourInfo; // 반려동물 동반 정보 (detailPetTour2 API로 조회)
}

/**
 * 상세 정보 (detailCommon2 응답)
 * PRD 5.2 참고
 */
export interface TourDetail {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1: string;
  addr2?: string;
  zipcode?: string;
  tel?: string;
  homepage?: string;
  overview?: string; // 개요 (긴 설명)
  firstimage?: string;
  firstimage2?: string;
  mapx: string; // 경도 (KATEC 좌표계)
  mapy: string; // 위도 (KATEC 좌표계)
  // 추가 필드
  createdtime?: string;
  modifiedtime?: string;
  telname?: string; // 전화번호명
  cat1?: string;
  cat2?: string;
  cat3?: string;
  cpyrhtDivCd?: string; // 저작권 구분 코드
  areacode?: string;
  sigungucode?: string;
}

/**
 * 운영 정보 (detailIntro2 응답)
 * PRD 5.3 참고
 * 타입별로 필드가 다르므로 모든 가능한 필드를 optional로 정의
 */
export interface TourIntro {
  contentid: string;
  contenttypeid: string;
  // 공통 필드
  infocenter?: string; // 문의처
  restdate?: string; // 휴무일
  usetime?: string; // 이용시간
  parking?: string; // 주차 가능
  chkpet?: string; // 반려동물 동반
  // 관광지(12) 관련
  expguide?: string; // 체험안내
  expagerange?: string; // 체험가능연령
  accomcount?: string; // 수용인원
  useseason?: string; // 이용시기
  usetimefestival?: string; // 축제행사 이용시간
  // 문화시설(14) 관련
  usefee?: string; // 이용요금
  discountinfo?: string; // 할인정보
  spendtime?: string; // 소요시간
  // 축제/행사(15) 관련
  agelimit?: string; // 관람 가능연령
  bookingplace?: string; // 예매처
  placeinfo?: string; // 행사장소안내
  subevent?: string; // 부대행사
  program?: string; // 행사 프로그램
  eventstartdate?: string; // 행사 시작일
  eventenddate?: string; // 행사 종료일
  eventplace?: string; // 행사장소
  eventhomepage?: string; // 행사 홈페이지
  // 여행코스(25) 관련
  distance?: string; // 코스 총 거리
  schedule?: string; // 코스 일정
  taketime?: string; // 코스 소요시간
  theme?: string; // 코스 테마
  // 레포츠(28) 관련
  openperiod?: string; // 개장기간
  reservation?: string; // 예약안내
  // 숙박(32) 관련
  roomcount?: string; // 객실 수
  roomtype?: string; // 객실 유형
  refundregulation?: string; // 환불규정
  checkintime?: string; // 체크인 시간
  checkouttime?: string; // 체크아웃 시간
  // 쇼핑(38) 관련
  shopguide?: string; // 쇼핑 안내
  // 음식점(39) 관련
  firstmenu?: string; // 대표메뉴
  treatmenu?: string; // 취급메뉴
  opentimefood?: string; // 영업시간
  restdatefood?: string; // 쉬는날
  packing?: string; // 포장 가능
  kidsfacility?: string; // 어린이 놀이방
  // 기타
  [key: string]: string | undefined; // 타입별 추가 필드 대응
}

/**
 * 이미지 정보 (detailImage2 응답)
 */
export interface TourImage {
  contentid: string;
  imagename?: string; // 이미지명
  originimgurl?: string; // 원본 이미지 URL
  serialnum?: string; // 이미지 일련번호
  smallimageurl?: string; // 썸네일 이미지 URL
}

/**
 * 반려동물 동반 정보 (detailPetTour2 응답)
 * PRD 2.5 참고
 */
export interface PetTourInfo {
  contentid: string;
  contenttypeid: string;
  chkpetleash?: string; // 애완동물 동반 여부
  chkpetsize?: string; // 애완동물 크기
  chkpetplace?: string; // 입장 가능 장소
  chkpetfee?: string; // 추가 요금
  petinfo?: string; // 기타 반려동물 정보
  parking?: string; // 주차장 정보
}

/**
 * API 공통 응답 구조
 * 한국관광공사 API는 response.body.items.item 또는 response.body.items 형태로 응답
 */
export interface ApiResponse<T> {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: T | T[] | null;
      numOfRows?: number;
      pageNo?: number;
      totalCount?: number;
    };
  };
}

/**
 * 페이지네이션 포함 응답
 */
export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  numOfRows: number;
  pageNo: number;
  totalPages: number;
}

/**
 * Content Type ID 상수
 * PRD 4.4 참고
 */
export const CONTENT_TYPE = {
  TOURIST_SPOT: "12", // 관광지
  CULTURAL_FACILITY: "14", // 문화시설
  FESTIVAL: "15", // 축제/행사
  TOUR_COURSE: "25", // 여행코스
  LEISURE_SPORTS: "28", // 레포츠
  ACCOMMODATION: "32", // 숙박
  SHOPPING: "38", // 쇼핑
  RESTAURANT: "39", // 음식점
} as const;

export type ContentTypeId = (typeof CONTENT_TYPE)[keyof typeof CONTENT_TYPE];


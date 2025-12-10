# Clerk 한국어 로컬라이제이션 가이드

이 문서는 Clerk 컴포넌트를 한국어로 설정하는 방법을 설명합니다.

## 개요

Clerk는 `@clerk/localizations` 패키지를 통해 다양한 언어 지원을 제공합니다. 이 프로젝트는 한국어(`koKR`) 로컬라이제이션을 사용하며, 커스텀 에러 메시지를 추가하여 더 나은 사용자 경험을 제공합니다.

> **참고**: Clerk 로컬라이제이션은 현재 실험적(experimental) 기능입니다. 문제가 발생하면 [Clerk 지원팀](https://clerk.com/contact/support)에 문의하세요.

## 현재 설정

프로젝트의 `app/layout.tsx`에서 다음과 같이 설정되어 있습니다:

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";

const koreanLocalization = {
  ...koKR,
  unstable__errors: {
    ...koKR.unstable__errors,
    // 커스텀 에러 메시지
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider localization={koreanLocalization}>
      <html lang="ko">
        {/* ... */}
      </html>
    </ClerkProvider>
  );
}
```

## 지원되는 언어

Clerk는 다음 언어를 지원합니다:

- 한국어 (ko-KR) - `koKR` ✅ 현재 사용 중
- 영어 (en-US) - `enUS`
- 일본어 (ja-JP) - `jaJP`
- 중국어 간체 (zh-CN) - `zhCN`
- 중국어 번체 (zh-TW) - `zhTW`
- 프랑스어 (fr-FR) - `frFR`
- 독일어 (de-DE) - `deDE`
- 스페인어 (es-ES) - `esES`
- 기타 50개 이상의 언어

전체 목록은 [Clerk 공식 문서](https://clerk.com/docs/guides/customizing-clerk/localization)를 참고하세요.

## 커스텀 로컬라이제이션

### 기본 로컬라이제이션 사용

가장 간단한 방법은 기본 `koKR` 로컬라이제이션을 사용하는 것입니다:

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider localization={koKR}>
      {/* ... */}
    </ClerkProvider>
  );
}
```

### 커스텀 에러 메시지 추가

기본 로컬라이제이션을 확장하여 커스텀 에러 메시지를 추가할 수 있습니다:

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";

const koreanLocalization = {
  ...koKR,
  unstable__errors: {
    ...koKR.unstable__errors,
    not_allowed_access:
      "접근이 허용되지 않은 이메일 도메인입니다. 관리자에게 문의해주세요.",
    form_identifier_not_found:
      "입력하신 정보와 일치하는 계정을 찾을 수 없습니다.",
    form_password_incorrect: "비밀번호가 올바르지 않습니다.",
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider localization={koreanLocalization}>
      {/* ... */}
    </ClerkProvider>
  );
}
```

### 특정 텍스트 커스터마이징

특정 버튼이나 텍스트를 브랜드에 맞게 커스터마이징할 수 있습니다:

```tsx
const koreanLocalization = {
  ...koKR,
  // 버튼 텍스트 커스터마이징
  formButtonPrimary: "시작하기",
  formButtonSecondary: "취소",
  
  // 폼 레이블 커스터마이징
  formFieldLabel__emailAddress: "이메일 주소",
  formFieldLabel__password: "비밀번호",
  
  // 에러 메시지 커스터마이징
  unstable__errors: {
    ...koKR.unstable__errors,
    not_allowed_access: "접근 권한이 없습니다.",
  },
};
```

## 사용 가능한 에러 키

다음은 커스터마이징할 수 있는 주요 에러 키입니다:

- `not_allowed_access`: 접근이 허용되지 않은 이메일 도메인
- `form_identifier_not_found`: 계정을 찾을 수 없음
- `form_password_incorrect`: 비밀번호가 올바르지 않음
- `form_code_incorrect`: 인증 코드가 올바르지 않음
- `session_exists`: 이미 로그인되어 있음
- `form_email_address_not_allowed`: 허용되지 않은 이메일 주소
- `form_username_invalid`: 유효하지 않은 사용자명

전체 에러 키 목록은 [Clerk GitHub 저장소](https://github.com/clerk/javascript/blob/main/packages/localizations/src/en-US.ts)의 `unstable__errors` 객체를 참고하세요.

## 주의사항

1. **실험적 기능**: 로컬라이제이션은 실험적 기능이므로 예상치 못한 동작이 발생할 수 있습니다.

2. **Clerk Account Portal**: 로컬라이제이션은 앱 내 Clerk 컴포넌트에만 적용됩니다. 호스팅된 [Clerk Account Portal](https://clerk.com/docs/guides/customizing-clerk/account-portal)은 여전히 영어로 표시됩니다.

3. **타입 안정성**: `unstable__errors`는 실험적이므로 타입 정의가 완전하지 않을 수 있습니다.

4. **업데이트**: Clerk 패키지를 업데이트할 때 로컬라이제이션 키가 변경될 수 있습니다.

## 문제 해결

### 로컬라이제이션이 적용되지 않음

1. `@clerk/localizations` 패키지가 설치되어 있는지 확인:
   ```bash
   pnpm list @clerk/localizations
   ```

2. `ClerkProvider`에 `localization` prop이 올바르게 전달되었는지 확인

3. 브라우저 캐시를 지우고 새로고침

### 일부 텍스트가 번역되지 않음

일부 텍스트는 기본 로컬라이제이션에 포함되지 않을 수 있습니다. 이 경우 커스텀 로컬라이제이션을 추가하세요.

### 에러 메시지가 표시되지 않음

`unstable__errors`는 실험적 기능이므로 모든 에러 키가 지원되지 않을 수 있습니다. 사용 가능한 키는 [Clerk GitHub 저장소](https://github.com/clerk/javascript/blob/main/packages/localizations/src/en-US.ts)를 참고하세요.

## 참고 자료

- [Clerk 로컬라이제이션 공식 문서](https://clerk.com/docs/guides/customizing-clerk/localization)
- [Clerk 로컬라이제이션 GitHub 저장소](https://github.com/clerk/javascript/tree/main/packages/localizations)
- [영어 로컬라이제이션 파일 (참고용)](https://github.com/clerk/javascript/blob/main/packages/localizations/src/en-US.ts)


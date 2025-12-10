/**
 * @file app/user/[[...user]]/page.tsx
 * @description Clerk UserProfile 컴포넌트를 표시하는 페이지
 * 
 * UserButton의 userProfileMode="navigation" 설정으로 인해
 * 사용자가 UserButton을 클릭하면 이 페이지로 이동합니다.
 * 
 * 이 페이지는 Clerk의 UserProfile 컴포넌트를 표시하며,
 * 외부 브라우저(크롬)에서 열리도록 설정됩니다.
 */

import { UserProfile } from "@clerk/nextjs";

export default function UserProfilePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-center">
        <UserProfile 
          routing="path"
          path="/user"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg",
            },
          }}
        />
      </div>
    </div>
  );
}


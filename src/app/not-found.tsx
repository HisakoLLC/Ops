"use client";

import CustomErrorPage from "@/components/CustomErrorPage";

export default function NotFound() {
  return (
    <CustomErrorPage
      code="404"
      title="Page Not Found"
      description="The page you are looking for does not exist, has been removed, or has had its name changed. Please verify the URL or return to the dashboard."
    />
  );
}

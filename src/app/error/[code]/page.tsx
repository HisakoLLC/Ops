"use client";

import { use } from "react";
import CustomErrorPage from "@/components/CustomErrorPage";

interface Props {
  params: Promise<{ code: string }>;
}

const ERROR_DETAILS: Record<string, { title: string; description: string }> = {
  "500": {
    title: "Internal Server Error",
    description: "An unexpected error occurred. Our technical staff is currently working to resolve the issue.",
  },
  "502": {
    title: "Bad Gateway Connection",
    description: "The gateway server received an invalid response from upstream servers. Please try reloading the page.",
  },
  "503": {
    title: "Service Unavailable",
    description: "The system is temporarily overloaded or undergoing maintenance. Please check back soon.",
  },
  "504": {
    title: "Gateway Timeout",
    description: "The connection to the upstream server timed out. Please check your connection and try again.",
  },
  "403": {
    title: "Access Forbidden",
    description: "You do not have the required permissions to view this resource. Please contact administration.",
  },
};

export default function DynamicErrorPage({ params }: Props) {
  const { code } = use(params);

  const error = ERROR_DETAILS[code] || {
    title: `Error ${code}`,
    description: "An unexpected status code error occurred. Please navigate back to your dashboard.",
  };

  return (
    <CustomErrorPage
      code={code}
      title={error.title}
      description={error.description}
    />
  );
}

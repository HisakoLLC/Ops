import Link from "next/link";
import { AlertCircle, RefreshCw, Home, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CustomErrorPageProps {
  code: string;
  title: string;
  description: string;
}

export default function CustomErrorPage({ code, title, description }: CustomErrorPageProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8 md:p-12 text-center flex flex-col items-center">
        {/* Status Code */}
        <div className="relative flex items-center justify-center mb-6">
          <span className="text-8xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100 opacity-10">
            {code}
          </span>
          <span className="absolute text-5xl font-extrabold tracking-tight text-[#E8400C]">
            {code}
          </span>
        </div>

        {/* Error Details */}
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-3">
          {title}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm leading-relaxed mb-8">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#E8400C] hover:bg-[#C73509] text-white font-medium flex items-center justify-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
          <Link href="/dashboard" passHref className="w-full sm:w-auto">
            <Button variant="outline" className="w-full font-medium flex items-center justify-center">
              <Home className="mr-2 h-4 w-4" />
              Go Dashboard
            </Button>
          </Link>
        </div>

        {/* Support Link */}
        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 w-full flex items-center justify-center gap-2 text-xs text-zinc-400">
          <span>Need help?</span>
          <a
            href="mailto:hello@hisako.eu"
            className="text-zinc-600 dark:text-zinc-300 hover:text-[#E8400C] dark:hover:text-[#E8400C] transition-colors font-medium flex items-center gap-1"
          >
            <Mail className="h-3.5 w-3.5" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

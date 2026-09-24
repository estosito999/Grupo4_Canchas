import type { ReactNode } from "react";
import "./motion.css";

export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter flex flex-1 flex-col">{children}</div>;
}

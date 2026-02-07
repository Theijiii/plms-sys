import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { GovernmentService } from "../../../types";

interface ServiceCardProps {
  service: GovernmentService;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Link
      to={service.href}
      className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-blue-300 hover:bg-blue-100 shadow-lg shadow-blue-200/50 hover:shadow-blue-300/50 flex flex-col justify-between h-full"
    >
      <h2 className="mb-3 text-2xl font-semibold flex items-center justify-between">
        {service.title}
        <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" />
      </h2>
      <p className="m-0 max-w-[30ch] text-sm opacity-70">
        {service.description}
      </p>
    </Link>
  );
}

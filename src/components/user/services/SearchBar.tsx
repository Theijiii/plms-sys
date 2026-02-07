import { useState } from "react";
import { GovernmentService } from "../../../types";

interface SearchBarProps {
  services: GovernmentService[];
  onSearch: (filteredServices: GovernmentService[]) => void;
}

export default function SearchBar({ services, onSearch }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = services.filter((service) =>
      service.title.toLowerCase().includes(term) ||
      service.description.toLowerCase().includes(term)
    );

    onSearch(filtered);
  };

  return (
    <div className="w-full max-w-md mb-8">
      <input
        type="text"
        placeholder="Search services..."
        value={searchTerm}
        onChange={handleSearch}
  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

import { categories } from "../../data/effects";
import { cn } from "../../lib/utils";

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Effect categories">
      {categories.map((category) => (
        <button
          key={category.id}
          role="tab"
          aria-selected={activeCategory === category.id}
          onClick={() => onCategoryChange(category.id)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            activeCategory === category.id
              ? "bg-primary text-white shadow-md"
              : "bg-surface text-text-secondary hover:text-text-primary hover:bg-border/50"
          )}
        >
          {category.label}
          <span className="ml-2 px-2 py-0.5 bg-border text-text-muted text-xs rounded-full">
            {category.count}
          </span>
        </button>
      ))}
    </div>
  );
}
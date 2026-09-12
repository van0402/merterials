export interface CategoryCardProps {
  name: string;
  icon?: string | null;
}

export function CategoryCard({ name, icon }: CategoryCardProps) {
  return (
    <div className="min-h-[100px] rounded-2xl border border-orange-200/70 bg-white/70 p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-xl">
        {icon || '📦'}
      </div>
      <strong className="block text-sm">{name}</strong>
    </div>
  );
}
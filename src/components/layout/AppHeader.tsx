interface HeaderProps {
  title?: string;
}

export default function AppHeader({ title = 'LaReleve' }: HeaderProps) {
  return (
    <header className="h-14 bg-primary flex items-center px-6 lg:px-8 shrink-0">
      <h1 className="text-lg font-bold text-primary-foreground tracking-wide pl-10 lg:pl-0">
        {title}
      </h1>
    </header>
  );
}

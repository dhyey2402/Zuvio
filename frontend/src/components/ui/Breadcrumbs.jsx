import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Zuvio specific mapping for root paths
  const rootMap = {
    'drive': 'My Drive',
    'shared': 'Shared with me',
    'starred': 'Starred',
    'trash': 'Trash'
  };

  // Skip the 'dashboard' part
  const displayPathnames = pathnames.slice(1);

  if (displayPathnames.length === 0) {
    displayPathnames.push('drive'); // Default
  }

  return (
    <nav className="flex items-center overflow-x-auto no-scrollbar" aria-label="Breadcrumb">
      <ol className="flex items-center min-w-0">
        {displayPathnames.map((name, index) => {
          const isLast = index === displayPathnames.length - 1;
          const to = `/dashboard/${displayPathnames.slice(0, index + 1).join('/')}`;
          const displayName = rootMap[name] || decodeURIComponent(name);

          return (
            <li key={to} className="flex items-center whitespace-nowrap">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1.5 text-muted-foreground/50 flex-shrink-0" />
              )}
              
              {isLast ? (
                <span className="text-sm font-medium text-foreground tracking-tight px-1.5 py-1">
                  {displayName}
                </span>
              ) : (
                <Link
                  to={to}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted px-1.5 py-1 rounded-md transition-colors"
                >
                  {displayName}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';
import { Button } from './Button';
import { cn } from './Button'; // assuming cn is exported from Button.jsx

const SORT_OPTIONS = [
  { id: 'name', label: 'Name' },
  { id: 'date', label: 'Date modified' },
  { id: 'size', label: 'File size' },
];

export function SortDropdown({ sort, order, onSortChange, onOrderChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (selectedSort) => {
    if (sort === selectedSort) {
      // Toggle order if clicking the same sort
      onOrderChange(order === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(selectedSort);
      // Default orders for specific fields
      if (selectedSort === 'date' || selectedSort === 'size') {
        onOrderChange('desc');
      } else {
        onOrderChange('asc');
      }
    }
    setIsOpen(false);
  };

  const currentLabel = SORT_OPTIONS.find((opt) => opt.id === sort)?.label || 'Sort by';

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-muted-foreground hover:text-foreground gap-2 -ml-2 font-medium"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <ArrowUpDown className="h-4 w-4" />
        {currentLabel}
        <ChevronDown className="h-3 w-3 opacity-50" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-xl shadow-lg py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Sort by
          </div>
          <ul role="listbox">
            {SORT_OPTIONS.map((option) => (
              <li key={option.id}>
                <button
                  role="option"
                  aria-selected={sort === option.id}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-accent/50 transition-colors"
                  onClick={() => handleSelect(option.id)}
                >
                  <span className="flex-1 text-left">{option.label}</span>
                  {sort === option.id && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        {order === 'asc' 
                          ? (option.id === 'name' ? 'A-Z' : option.id === 'date' ? 'Old' : 'Small')
                          : (option.id === 'name' ? 'Z-A' : option.id === 'date' ? 'New' : 'Large')}
                      </span>
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export interface FilterConfig {
  dateRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
  status?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  customFilters?: Record<string, unknown>;
}

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterConfig) => void;
  statusOptions?: { value: string; label: string }[];
  categoryOptions?: { value: string; label: string }[];
  showAmountFilter?: boolean;
  showDateFilter?: boolean;
  showStatusFilter?: boolean;
  showCategoryFilter?: boolean;
  customFilterComponents?: React.ReactNode;
}

export function AdvancedFilters({
  onFilterChange,
  statusOptions = [],
  categoryOptions = [],
  showAmountFilter = false,
  showDateFilter = true,
  showStatusFilter = true,
  showCategoryFilter = true,
  customFilterComponents,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterConfig>({
    dateRange: { from: undefined, to: undefined },
    status: 'all',
    category: 'all',
    minAmount: undefined,
    maxAmount: undefined,
  });

  const [activeFilterCount, setActiveFilterCount] = useState(0);

  const updateFilters = (newFilters: Partial<FilterConfig>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);

    // Count active filters
    let count = 0;
    if (updated.dateRange?.from || updated.dateRange?.to) count++;
    if (updated.status && updated.status !== 'all') count++;
    if (updated.category && updated.category !== 'all') count++;
    if (updated.minAmount !== undefined || updated.maxAmount !== undefined) count++;
    setActiveFilterCount(count);

    onFilterChange(updated);
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterConfig = {
      dateRange: { from: undefined, to: undefined },
      status: 'all',
      category: 'all',
      minAmount: undefined,
      maxAmount: undefined,
    };
    setFilters(clearedFilters);
    setActiveFilterCount(0);
    onFilterChange(clearedFilters);
  };

  const clearDateFilter = () => {
    updateFilters({ dateRange: { from: undefined, to: undefined } });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Advanced Filters</h4>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-auto p-1 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Date Range Filter */}
          {showDateFilter && (
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      size="sm"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange?.from ? (
                        format(filters.dateRange.from, 'MMM dd, yyyy')
                      ) : (
                        <span className="text-muted-foreground">From date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange?.from}
                      onSelect={(date) =>
                        updateFilters({
                          dateRange: { ...filters.dateRange, from: date },
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      size="sm"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange?.to ? (
                        format(filters.dateRange.to, 'MMM dd, yyyy')
                      ) : (
                        <span className="text-muted-foreground">To date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange?.to}
                      onSelect={(date) =>
                        updateFilters({
                          dateRange: { ...filters.dateRange, to: date },
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {(filters.dateRange?.from || filters.dateRange?.to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDateFilter}
                  className="w-full text-xs"
                >
                  Clear Date Range
                </Button>
              )}
            </div>
          )}

          {/* Status Filter */}
          {showStatusFilter && statusOptions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => updateFilters({ status: value })}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category Filter */}
          {showCategoryFilter && categoryOptions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="category-filter">Category</Label>
              <Select
                value={filters.category}
                onValueChange={(value) => updateFilters({ category: value })}
              >
                <SelectTrigger id="category-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount Range Filter */}
          {showAmountFilter && (
            <div className="space-y-2">
              <Label>Amount Range</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minAmount || ''}
                  onChange={(e) =>
                    updateFilters({
                      minAmount: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxAmount || ''}
                  onChange={(e) =>
                    updateFilters({
                      maxAmount: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Custom Filter Components */}
          {customFilterComponents}

          {/* Quick Date Presets */}
          {showDateFilter && (
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs text-muted-foreground">Quick Select</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const today = new Date();
                    updateFilters({
                      dateRange: { from: today, to: today },
                    });
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const today = new Date();
                    const lastWeek = new Date(today);
                    lastWeek.setDate(today.getDate() - 7);
                    updateFilters({
                      dateRange: { from: lastWeek, to: today },
                    });
                  }}
                >
                  Last 7 Days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const today = new Date();
                    const lastMonth = new Date(today);
                    lastMonth.setDate(today.getDate() - 30);
                    updateFilters({
                      dateRange: { from: lastMonth, to: today },
                    });
                  }}
                >
                  Last 30 Days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const today = new Date();
                    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    updateFilters({
                      dateRange: { from: firstDayOfMonth, to: today },
                    });
                  }}
                >
                  This Month
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

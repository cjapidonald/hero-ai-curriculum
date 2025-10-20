# Dashboard Features Documentation

## 📚 Table of Contents
1. [Overview](#overview)
2. [Keyboard Shortcuts](#keyboard-shortcuts)
3. [Search & Filter](#search--filter)
4. [Data Export](#data-export)
5. [Real-time Updates](#real-time-updates)
6. [Accessibility Features](#accessibility-features)
7. [Mobile Support](#mobile-support)
8. [Components Reference](#components-reference)

---

## Overview

The Hero AI Curriculum platform includes three main dashboards:
- **Student Dashboard** - For students to track progress and access resources
- **Teacher Dashboard** - For teachers to manage classes, students, and curriculum
- **Admin Dashboard** - For administrators to oversee the entire system

---

## Keyboard Shortcuts

### Admin Dashboard

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/⌘ + R` | Refresh Data | Reload all dashboard data |
| `Ctrl/⌘ + 1` | Overview Tab | Navigate to Overview section |
| `Ctrl/⌘ + 2` | Students Tab | Navigate to Students section |
| `Ctrl/⌘ + 3` | Teachers Tab | Navigate to Teachers section |
| `Ctrl/⌘ + 4` | Classes Tab | Navigate to Classes section |
| `Ctrl/⌘ + /` | Focus Search | Jump to search input field |

### Teacher Dashboard

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/⌘ + /` | Focus Search | Jump to search input field |

**Note:** Mac users use `⌘` (Command) instead of `Ctrl`

---

## Search & Filter

### Available Search Features

#### Teacher Dashboard - My Classes
- **Search by:** Student name, surname, or class name
- **Real-time filtering:** Results update as you type
- **Statistics:** Shows filtered count vs. total count
- **Empty states:** Helpful message when no results found

#### Admin Dashboard - Classes Tab
- **Search by:** Class name, teacher name, or stage
- **Pagination aware:** Search works across all pages
- **Clear search:** One-click button to reset search

#### Admin Dashboard - Finance Tab
- **Search by:** Receipt number, payment purpose, or payment method
- **Date-independent:** Searches regardless of payment date

### Search Tips
- Searches are case-insensitive
- Partial matches are supported
- Multiple words search across all fields
- Use the clear button (X) to reset quickly

---

## Data Export

### Export to CSV

All admin dashboard tabs support CSV export:

#### Students Export
**Includes:**
- Name (Full name)
- Email
- Class
- Level
- Attendance Rate
- Sessions Left
- Status (Active/Inactive)
- Location

#### Teachers Export
**Includes:**
- Name (Full name)
- Email
- Subject
- Phone
- Hourly Rate
- Status (Active/Inactive)

#### Classes Export
**Includes:**
- Class Name
- Teacher
- Stage
- Schedule (Days)
- Time Range
- Current Students
- Max Students
- Status

#### Payments Export
**Includes:**
- Date
- Receipt Number
- Payment For
- Method
- Amount (VND)

### Export Process
1. Navigate to the desired tab
2. Click the "Export CSV" button
3. File downloads automatically
4. Toast notification confirms success
5. Filename includes date: `students-export-2025-01-19.csv`

---

## Real-time Updates

### How it Works
All dashboards use Supabase real-time subscriptions to automatically update when data changes.

### Student Dashboard
**Monitors:**
- Skills evaluation updates
- Assessment publications
- Real-time grade changes

### Teacher Dashboard
**Monitors:**
- Student data changes
- Attendance updates
- Class enrollment changes

### Admin Dashboard
**Monitors:**
- Student additions/removals
- Teacher status changes
- Class schedule updates

### Benefits
- No need to manually refresh
- Multiple users see changes instantly
- Data always stays current
- Automatic conflict resolution

---

## Accessibility Features

### ARIA Labels
All interactive elements include proper ARIA labels:
- Buttons describe their action
- Form inputs describe their purpose
- Tab panels are properly labeled
- Icons include aria-hidden when decorative

### Keyboard Navigation
- Full tab navigation support
- Keyboard shortcuts for common actions
- Focus indicators on all interactive elements
- Proper tab order throughout

### Screen Reader Support
- Semantic HTML structure
- Descriptive button text
- Status announcements for loading/errors
- Proper heading hierarchy

### Visual Accessibility
- High contrast text
- Clear focus indicators
- Color not used as only indicator
- Responsive text sizing

---

## Mobile Support

### Responsive Design

#### Header
- **Desktop:** Full layout with text labels
- **Mobile:** Stacked layout, icon-only buttons
- **Tablets:** Flexible layout adapts to width

#### Search Bars
- **Desktop:** Fixed width with full placeholder
- **Mobile:** Full-width, shorter placeholder
- **Touch:** Larger touch targets (44x44px minimum)

#### Tables
- **Desktop:** Full table view
- **Mobile:** Horizontal scroll with sticky headers
- **Tablets:** Optimized column widths

#### Cards & Stats
- **Desktop:** Multi-column grid
- **Mobile:** Single column stack
- **Tablets:** 2-column layout

### Touch Optimization
- Minimum 44x44px touch targets
- Adequate spacing between elements
- Swipe-friendly pagination
- Touch-friendly dropdowns

---

## Components Reference

### Custom Components

#### 1. SkeletonLoader
**Location:** `/src/components/ui/skeleton-loader.tsx`

**Available Components:**
```tsx
import {
  DashboardSkeleton,
  TableSkeleton,
  StatCardSkeleton,
  ChartSkeleton,
  ProfileSkeleton
} from '@/components/ui/skeleton-loader';
```

**Usage:**
```tsx
{loading ? <DashboardSkeleton /> : <ActualContent />}
```

#### 2. ConfirmationDialog
**Location:** `/src/components/ui/confirmation-dialog.tsx`

**Props:**
- `open: boolean` - Dialog visibility
- `onOpenChange: (open: boolean) => void` - State handler
- `title: string` - Dialog title
- `description: string` - Confirmation message
- `confirmLabel?: string` - Confirm button text
- `cancelLabel?: string` - Cancel button text
- `onConfirm: () => void` - Confirm callback
- `variant?: "default" | "destructive"` - Style variant
- `loading?: boolean` - Loading state

**Usage:**
```tsx
<ConfirmationDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Delete Student"
  description="Are you sure? This action cannot be undone."
  confirmLabel="Delete"
  variant="destructive"
  onConfirm={handleDelete}
/>
```

#### 3. StatCard
**Location:** `/src/components/dashboard/StatCard.tsx`

**Props:**
- `title: string` - Card title
- `value: string | number` - Main value
- `icon: LucideIcon` - Icon component
- `trend?: { value: number; isPositive: boolean }` - Trend indicator
- `description?: string` - Additional info
- `loading?: boolean` - Loading state

**Usage:**
```tsx
<StatCard
  title="Total Students"
  value={150}
  icon={Users}
  trend={{ value: 12, isPositive: true }}
  description="from last month"
/>
```

### Utility Functions

#### Export Utilities
**Location:** `/src/lib/export-utils.ts`

```tsx
import { exportToCSV, formatDateForExport } from '@/lib/export-utils';

// Export array to CSV
exportToCSV(data, 'filename.csv', optionalHeaders);

// Format date for CSV
const dateStr = formatDateForExport(new Date());
```

#### Keyboard Shortcuts Hook
**Location:** `/src/hooks/use-keyboard-shortcuts.ts`

```tsx
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

useKeyboardShortcuts([
  {
    key: 'r',
    ctrl: true,
    callback: () => console.log('Refresh!'),
    description: 'Refresh data',
  },
]);
```

---

## Error Handling

### User-Facing Errors
All errors show:
- Clear error message
- Retry button when applicable
- Visual error icon
- Helpful suggestions

### Network Errors
- Automatic retry on connection restore
- Graceful degradation
- Cached data when available
- Clear offline indicators

### Data Validation
- Client-side validation before submit
- Server-side validation messages
- Field-level error indicators
- Form-level error summary

---

## Performance Optimizations

### Implemented
- **Pagination:** Large datasets split into pages
- **Memoization:** Filtered data cached
- **Lazy Loading:** Components load on-demand
- **Real-time Subscriptions:** No polling overhead
- **Optimized Queries:** Only fetch needed data

### Bundle Size
- Main bundle: ~2MB (gzipped: ~560KB)
- Individual chunks for code splitting
- Tree-shaking enabled
- Minified production builds

---

## Browser Support

### Tested Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Mobile Browsers
- ✅ iOS Safari 14+
- ✅ Chrome Mobile 90+
- ✅ Samsung Internet 14+

---

## Security Features

### Data Protection
- Row-level security (RLS) enabled
- Teacher access control (shows only assigned classes)
- Admin-only data exports
- Secure authentication

### Input Sanitization
- XSS prevention
- SQL injection protection
- CSV injection prevention
- Safe HTML rendering

---

## Future Enhancements

### Planned Features
1. Bulk import (CSV upload)
2. Advanced filtering (date ranges, multi-select)
3. Audit logging
4. User notifications system
5. Profile editing
6. Dark mode for charts
7. Analytics dashboard

### Performance Improvements
1. Virtual scrolling for very large tables
2. Service worker for offline support
3. Optimistic UI updates
4. Query result caching

---

## Support & Troubleshooting

### Common Issues

#### Search Not Working
- **Solution:** Clear browser cache, refresh page
- **Tip:** Search is case-insensitive

#### Export Failed
- **Solution:** Check browser's download settings
- **Tip:** Disable pop-up blockers for this site

#### Real-time Updates Delayed
- **Solution:** Check internet connection
- **Tip:** Click refresh button to force update

#### Keyboard Shortcuts Not Working
- **Solution:** Ensure focus is on dashboard (not in input field)
- **Tip:** Click outside input fields first

---

## Version History

### v2.0.0 (Phase 2) - January 2025
- ✅ Keyboard shortcuts
- ✅ Advanced search & filter
- ✅ Mobile responsiveness
- ✅ Toast notifications
- ✅ Accessibility improvements
- ✅ Last updated indicator

### v1.0.0 (Phase 1) - January 2025
- ✅ Real-time subscriptions
- ✅ Error handling
- ✅ URL routing
- ✅ Pagination
- ✅ CSV export
- ✅ Skeleton loaders
- ✅ Teacher access control fix

---

## Credits

Built with:
- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase
- Recharts

---

*Last Updated: January 19, 2025*

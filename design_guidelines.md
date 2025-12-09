# Design Guidelines: Secure Admin & Search Dashboard

## Design Approach

**Selected Approach:** Design System (Utility-Focused)
- **Justification:** This is a data-dense admin dashboard requiring efficiency, security visibility, and clear information hierarchy
- **Primary Inspiration:** Linear's clean admin interfaces + Tailwind UI dashboard patterns
- **Key Principles:** Clarity, security transparency, data accessibility, professional credibility

## Core Design Elements

### A. Typography
- **Primary Font:** Inter (Google Fonts) - clean, readable for data-heavy interfaces
- **Headings:** 
  - H1: text-3xl font-bold (Dashboard titles)
  - H2: text-2xl font-semibold (Section headers)
  - H3: text-lg font-medium (Card titles, labels)
- **Body:** text-base (forms, data display)
- **Small Text:** text-sm (metadata, timestamps, hints)
- **Monospace:** JetBrains Mono for IDs, phone numbers, emails (data integrity)

### B. Layout System
**Spacing Units:** Tailwind units of 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section spacing: gap-6 to gap-8
- Page margins: px-4 md:px-8
- Card spacing: space-y-4

### C. Component Library

**1. Authentication Screens**
- Centered card layout (max-w-md mx-auto)
- Clean form inputs with clear labels above fields
- Prominent submit buttons (w-full)
- Security indicator badge ("Owner Access" vs "Admin Access")
- Minimal decoration - focus on security and trust

**2. Dashboard Layout**
- **Sidebar Navigation:** (Owner/Admin differentiated)
  - Fixed left sidebar (w-64) on desktop
  - Collapsible hamburger menu on mobile
  - Clear active state indicators
  - User role badge at top
  - Logout button at bottom
  
- **Main Content Area:**
  - Full-width header with page title + breadcrumbs
  - Grid layout for search cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
  - Data tables with alternating row treatment
  - Action buttons grouped in top-right corner

**3. Search Interface Cards**
- Four distinct search cards (Mobile, Email, ID, Alternate Mobile)
- Icon differentiation (phone, envelope, id-card icons via Heroicons)
- Input field with search button inline
- Loading states during API calls
- Results display below in expandable sections

**4. Admin Management (Owner Only)**
- Table layout with columns: Name, Email, Created Date, Status, Actions
- Inline action buttons (Edit, Delete) - compact size
- "Add New Admin" prominent button (top-right)
- Modal for create/edit forms (overlay with max-w-2xl)

**5. Data Display**
- Search results in card format with clear data hierarchy
- Key-value pairs with labels in muted text
- Copy-to-clipboard buttons for sensitive data
- Timestamp displays in relative format ("2 hours ago")

**6. Security Indicators**
- VPN detection warning banner (fixed top, dismissible)
- Session timeout indicator (subtle, top-right)
- SSL status indicator (lock icon, header)
- "Secure Connection" badge on login screens

**7. Status & Feedback**
- Toast notifications (top-right): success, error, warning
- Loading skeletons for data fetching
- Empty states with helpful CTAs ("No admins yet. Create one?")
- Error boundaries with retry options

### D. Responsive Behavior

**Mobile (< 768px):**
- Stack all cards single column
- Hamburger menu navigation
- Full-width search inputs
- Simplified table view (key data only, expandable rows)

**Tablet (768px - 1024px):**
- Two-column search cards
- Persistent sidebar with collapse option
- Comfortable touch targets (min-h-12)

**Desktop (> 1024px):**
- Four-column search cards
- Full sidebar always visible
- Hover states for interactive elements
- Keyboard navigation support

### E. Animations
**Minimal, purposeful only:**
- Page transitions: None (instant navigation for admin efficiency)
- Form validation: Subtle shake on error
- Modal/overlay: Fade in backdrop (duration-200)
- Toast notifications: Slide in from top-right
- Loading states: Simple spinner, no elaborate animations

## Images

**No hero images required** - This is a utility dashboard focused on data and functionality.

**Icon Usage:**
- Heroicons (outline and solid variants via CDN)
- Search types: phone, envelope, identification, device-mobile icons
- Navigation: home, users, cog, logout icons
- Status indicators: shield-check, exclamation-triangle, lock-closed

## Special Considerations

**Security-First Visual Design:**
- Clear visual distinction between Owner and Admin interfaces
- Always-visible session status
- Prominent security warnings (VPN detection, session expiry)
- No credentials visible in URL or exposed in UI

**Data Integrity:**
- Monospace fonts for critical data (phone numbers, IDs, emails)
- Copy buttons with confirmation feedback
- Clear error messages for API failures
- Validation states before submission

**Professional Credibility:**
- Clean, uncluttered interfaces
- Consistent spacing and alignment
- Professional terminology (avoid casual language)
- Subtle borders and shadows (not heavy skeuomorphism)

This design prioritizes **efficiency, security transparency, and data clarity** - essential for an admin dashboard managing sensitive search operations.
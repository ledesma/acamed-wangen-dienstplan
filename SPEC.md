# Team Roster Application Specification

## Project Overview
- **Project Name**: Acamed Roster
- **Type**: Web Application (SPA)
- **Core Functionality**: Editable team calendar with drag-and-drop shift assignment, task management, and personal calendar views
- **Target Users**: Healthcare/team managers and employees

## Technology Stack
- **Framework**: React 18 with Vite
- **Styling**: CSS Modules with CSS Variables for theming
- **State Management**: React Context + useReducer
- **Data Storage**: Netlify Identity + Netlify Tables (Netlify DB)
- **Testing**: Vitest + React Testing Library + Playwright
- **Routing**: React Router v6
- **Drag & Drop**: @dnd-kit/core
- **Icons**: Lucide React
- **ICS Generation**: ics library

## Data Models

### Employee
```typescript
{
  id: string;
  name: string;
  email: string;
  password: string; // hashed
  role: 'admin' | 'user';
  avatar?: string;
  createdAt: Date;
}
```

### Shift
```typescript
{
  id: string;
  name: string;
  times: Array<{ from: string; to: string }>; // e.g., ["08:00-16:00", "16:00-22:00"]
  defaultTaskIds: string[]; // task IDs that are auto-activated
  color: string; // hex color
  isActive: boolean;
}
```

### Task
```typescript
{
  id: string;
  name: string;
  icon: string; // lucide icon name
  isActive: boolean;
}
```

### RosterEntry
```typescript
{
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  shiftId: string | null;
  activeTaskIds: string[]; // tasks activated for this specific day
}
```

## UI/UX Specification

### Color Palette

#### Light Mode
- **Background**: #f8fafc (slate-50)
- **Surface**: #ffffff
- **Surface Elevated**: #f1f5f9 (slate-100)
- **Primary**: #0ea5e9 (sky-500)
- **Primary Hover**: #0284c7 (sky-600)
- **Secondary**: #64748b (slate-500)
- **Text Primary**: #0f172a (slate-900)
- **Text Secondary**: #475569 (slate-600)
- **Border**: #e2e8f0 (slate-200)
- **Success**: #22c55e (green-500)
- **Warning**: #f59e0b (amber-500)
- **Error**: #ef4444 (red-500)

#### Dark Mode
- **Background**: #0f172a (slate-900)
- **Surface**: #1e293b (slate-800)
- **Surface Elevated**: #334155 (slate-700)
- **Primary**: #38bdf8 (sky-400)
- **Primary Hover**: #0ea5e9 (sky-500)
- **Secondary**: #94a3b8 (slate-400)
- **Text Primary**: #f1f5f9 (slate-100)
- **Text Secondary**: #cbd5e1 (slate-300)
- **Border**: #334155 (slate-700)
- **Success**: #4ade80 (green-400)
- **Warning**: #fbbf24 (amber-400)
- **Error**: #f87171 (red-400)

### Typography
- **Font Family**: "Inter", system-ui, sans-serif
- **Headings**: 
  - H1: 2rem (32px), font-weight: 700
  - H2: 1.5rem (24px), font-weight: 600
  - H3: 1.25rem (20px), font-weight: 600
- **Body**: 0.875rem (14px), font-weight: 400
- **Small**: 0.75rem (12px), font-weight: 400

### Layout Structure

#### Main Layout
- **Header**: Fixed top, 64px height
  - Logo/Title on left
  - Navigation center (Roster, My Roster, Admin)
  - User menu + theme toggle on right
- **Content**: Below header, full width with max-width 1440px, centered
- **Sidebar** (Admin): 280px width, collapsible

#### Week View (Default)
- **Grid**: 7 columns (Mon-Sun) + 1 column for employee names
- **Row height**: 80px per employee
- **Header row**: Shows dates with day name, current day highlighted
- **Cell**: Contains shift color background, task icons overlay
- **Legend**: Below calendar, horizontal scroll, draggable shift cards

#### Admin Panels
- **Employees View**: Table with CRUD operations
- **Shifts View**: List of shifts with color preview, CRUD
- **Tasks View**: Grid of task cards with icons, CRUD

#### Personal Roster
- **Month View**: Standard calendar grid
- **List View**: Chronological list of shifts/tasks

### Components

#### Calendar Cell
- Background: Shift color (20% opacity)
- Border: 1px solid border color
- Hover: Slight scale (1.02), elevated shadow
- Tasks: Small icons (16px) in bottom-right corner
- Drag over: Dashed border, scale up

#### Shift Legend Card
- Draggable handle indicator
- Color dot (12px)
- Shift name
- Time range(s)
- Cursor: grab / grabbing

#### Navigation
- Active: Primary color underline
- Hover: Background highlight
- Icons + text labels

#### Buttons
- Primary: Primary background, white text, 8px padding, 6px radius
- Secondary: Transparent, border, primary text
- Danger: Red background for delete actions
- States: hover (darken 10%), active (darken 15%), disabled (50% opacity)

#### Forms
- Input: 40px height, border, 8px radius, focus ring
- Labels: Above input, 12px, secondary color
- Select: Custom styled dropdown
- Validation: Red border + error message below

#### Modal/Dialog
- Centered, max-width 500px
- Backdrop: Black 50% opacity
- Header, body, footer sections
- Close button top-right

### Animations
- Page transitions: Fade 200ms
- Hover effects: 150ms ease
- Drag: Scale 1.05, shadow elevation
- Modal: Fade + scale from 0.95

## Functionality Specification

### Authentication
- Netlify Identity for user management
- Login/Register forms
- Role-based access (admin vs user)
- Session persistence

### Week View (Admin)
- Display current week by default
- Navigate: Previous/Next week buttons
- Date picker to jump to specific week
- Employee rows sorted by name
- Drag shift from legend to cell
- Click cell to remove shift (admin only)
- Tasks icons show in cell, click to toggle (admin only)
- Current day column highlighted

### Legend (Shifts)
- Horizontal list of all active shifts
- Drag source for assigning to cells
- Visual feedback during drag
- Shows shift name, color, times

### Admin: Employees
- Table: Name, Email, Role, Actions
- Add new employee modal
- Edit existing employee
- Delete employee (with confirmation)
- Reset password functionality

### Admin: Shifts
- List of shifts with preview
- Add/Edit shift modal:
  - Name (required)
  - Times: Dynamic list of from/to pairs
  - Color picker
  - Default tasks multi-select
  - Active toggle
- Delete shift (warn if in use)

### Admin: Tasks
- Grid of task cards
- Add/Edit task modal:
  - Name (required)
  - Icon picker (from Lucide set)
  - Active toggle
- Delete task (warn if default in shifts)

### Personal Calendar (User)
- Toggle between Month and List views
- Month: Standard calendar grid, shows shift color + tasks
- List: Chronological entries with full details
- Read-only view
- Download ICS button

### Theme Toggle
- Sun/Moon icon button in header
- Persists to localStorage
- System preference detection on first load

### ICS Export
- Generate calendar file with all user's shifts
- Include shift times and task names in description
- Download as .ics file

### Data Persistence
- Netlify Tables for all entities
- Local state with optimistic updates
- Real-time sync across clients

## Testing Strategy

### Unit Tests (Vitest)
- All model functions
- Utility functions (date helpers, ICS generation)
- Component rendering (basic smoke tests)
- State management reducers

### Integration Tests (React Testing Library)
- User interactions (login, navigation)
- Form validation
- CRUD operations

### E2E Tests (Playwright)
- Full user flows
- Admin shift assignment
- ICS download
- Theme switching
- Responsive behavior

## Acceptance Criteria

### Authentication
- [ ] User can register with email/password
- [ ] User can login and logout
- [ ] Admin sees admin panel, user sees restricted view

### Week View
- [ ] Calendar shows correct week
- [ ] Employees displayed in rows
- [ ] Days in columns
- [ ] Navigate between weeks works
- [ ] Current day is highlighted

### Shift Assignment
- [ ] Admin can drag shift from legend
- [ ] Drop on cell assigns shift
- [ ] Cell shows shift color
- [ ] Default tasks auto-activated
- [ ] Clicking cell removes shift (admin)

### Task Management
- [ ] Tasks show as icons in cell
- [ ] Admin can toggle task active/inactive
- [ ] Legend shows task icons

### Admin Panels
- [ ] Can CRUD employees
- [ ] Can CRUD shifts with times
- [ ] Can CRUD tasks with icons
- [ ] Changes persist to database

### Personal Calendar
- [ ] User sees only their entries
- [ ] Month view works
- [ ] List view works
- [ ] Can download ICS

### Theme
- [ ] Dark/light toggle works
- [ ] Preference persists
- [ ] All components respect theme

### Deployment
- [ ] Works on Netlify
- [ ] Netlify Identity configured
- [ ] Netlify Tables connected
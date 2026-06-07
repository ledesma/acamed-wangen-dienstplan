# Acamed Roster

A modern team roster application with drag-and-drop shift management, personal roster views, and ICS export functionality.

## Features

- **Team Roster**: Week view with employee rows and day columns
- **Shift Management**: Drag shifts from legend to assign to employees
- **Task Icons**: Visual task indicators in roster cells
- **Personal Roster**: Month and list views for individual employees
- **ICS Export**: Download roster as .ics file
- **Dark/Light Mode**: Theme toggle with system preference detection
- **Admin Panel**: Manage users, shifts, and tasks

## Tech Stack

- React 18 + TypeScript
- Vite for build
- @dnd-kit for drag-and-drop
- React Router v6
- Lucide React icons
- Vitest + React Testing Library for tests

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Tests

```bash
npm test
```

## Netlify Deployment

1. Create a Netlify site:
   ```bash
   netlify init
   ```

2. Enable Identity:
   - Go to Netlify Dashboard → Site Settings → Identity
   - Enable Identity
   - Enable Git Gateway

3. For local development with Netlify:
   - Create a `.env` file with your Netlify site URL
   - Or use `netlify dev` to run locally with Netlify functions

## Data Models

- **Users**: Name, email, role (admin/employee)
- **Shifts**: Name, work times, color, default tasks
- **Tasks**: Name, icon, active status
- **Roster Entries**: Employee + date + shift + active tasks

## Routes

- `/login` - Login page
- `/register` - Registration page
- `/roster` - Team roster (week view)
- `/my-roster` - Personal roster (month/list)
- `/admin/users` - Users management
- `/admin/shifts` - Shift management
- `/admin/tasks` - Task management
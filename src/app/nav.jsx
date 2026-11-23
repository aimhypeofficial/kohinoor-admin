import { lazy } from 'react';
import SetPassword from '@/features/auth/SetPassword.jsx';   // also used by the login flow, so not lazy

// Every screen is loaded on demand (smaller first download; the map library only loads with the map).
const Overview = lazy(() => import('@/features/overview/Overview.jsx'));
const LiveMap = lazy(() => import('@/features/map/LiveMap.jsx'));
const History = lazy(() => import('@/features/history/History.jsx'));
const Employees = lazy(() => import('@/features/employees/Employees.jsx'));
const Tasks = lazy(() => import('@/features/tasks/Tasks.jsx'));
const Payments = lazy(() => import('@/features/payments/Payments.jsx'));
const Customers = lazy(() => import('@/features/customers/Customers.jsx'));
const Amc = lazy(() => import('@/features/amc/Amc.jsx'));
const Reports = lazy(() => import('@/features/reports/Reports.jsx'));
const Audit = lazy(() => import('@/features/audit/Audit.jsx'));
const Team = lazy(() => import('@/features/team/Team.jsx'));

const ADMIN = ['admin'];
const STAFF = ['admin', 'dispatcher'];

// Menu order = array order. roles = who sees the item (the backend checks the same roles).
// ctx = { me, employees, reloadEmployees, openCustomer, goCustomer }
export const NAV = [
  { key: 'overview', label: 'Overview', roles: ADMIN, render: (c) => <Overview employees={c.employees} /> },
  { key: 'map', label: 'Live map', roles: ADMIN, render: (c) => <LiveMap employees={c.employees} /> },
  { key: 'history', label: 'Route history', roles: ADMIN, render: (c) => <History employees={c.employees} /> },
  { key: 'employees', label: 'Employees', roles: ADMIN, render: (c) => <Employees list={c.employees} reload={c.reloadEmployees} /> },
  { key: 'tasks', label: 'Tasks', roles: STAFF, render: (c) => <Tasks employees={c.employees} /> },
  { key: 'payments', label: 'Payments', roles: STAFF, render: (c) => <Payments employees={c.employees} /> },
  { key: 'customers', label: 'Customers', roles: STAFF,
    render: (c) => <Customers key={c.openCustomer || 'list'} employees={c.employees} role={c.me.role} initialOpen={c.openCustomer} /> },
  { key: 'amc', label: 'Service reminders', roles: STAFF, render: (c) => <Amc employees={c.employees} goCustomer={c.goCustomer} /> },
  { key: 'reports', label: 'Reports', roles: ADMIN, render: () => <Reports /> },
  { key: 'audit', label: 'Audit log', roles: ADMIN, render: () => <Audit /> },
  { key: 'team', label: 'Admins & dispatchers', roles: ADMIN, render: (c) => <Team meId={c.me.id} /> },
  { key: 'account', label: 'Change password', roles: STAFF, render: () => <SetPassword title="Change password" /> },
];

export const navFor = (role) => NAV.filter((n) => n.roles.includes(role));

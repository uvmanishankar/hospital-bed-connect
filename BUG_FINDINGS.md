# Hospital Bed Connect - Bug Findings Report

## Summary

Systematic code review of the Hospital Bed Connect project identified **9 issues** across multiple features. Below is a detailed breakdown of actual bugs found and their locations.

---

## 1. ✅ "Book Bed" Button Implementation - NO BUGS FOUND

**Status:** Working as intended

- **Location:** [src/routes/beds.tsx](src/routes/beds.tsx#L85), [src/routes/beds.tsx](src/routes/beds.tsx#L186)
- **Details:** The allocate/book bed functionality is implemented correctly:
  - `AllocateDialog` component properly handles bed allocation
  - Form validation checks: patient name required, bed type matching, availability check
  - Success handler closes modal and shows toast: `handleAllocate` → `setAllocateOpen(false)` + toast notification
  - Mutation integration works: `onSuccess` callback fires after allocation
- **What Works:**
  - Bed compatibility validation (ICU beds for critical patients)
  - State management for bed selection
  - Form submission with validation

---

## 2. ⚠️ Release Bed / Discharge Functionality - INCOMPLETE IMPLEMENTATION

**Status:** ISSUE FOUND

- **Location:** [src/routes/beds.tsx](src/routes/beds.tsx#L397-L398)
- **Issue:** Discharge button is just a toast notification, not a real operation

```typescript
<button onClick={() => toast.success(`${bed.patient ?? "Patient"} marked for discharge`)}>
  <UserMinus size={14} /> Discharge
</button>
```

- **Problems:**
  - No actual bed status update (bed stays occupied)
  - No API call to release the bed
  - No list refresh after discharge
  - No confirmation dialog before discharge
  - Mock implementation only

---

## 3. ⚠️ Search/Filter Functionality - CASE SENSITIVITY ISSUE

**Status:** PARTIAL ISSUE

- **Location:** [src/routes/assets.tsx](src/routes/assets.tsx#L51-L54)
- **Code:**

```typescript
const visible = useMemo(() => {
  const status = tabToStatus[tab];
  return assets.filter(
    (a) =>
      (!status || a.status === status) &&
      (q === "" ||
        `${a.name} ${a.tag} ${a.model} ${a.location}`.toLowerCase().includes(q.toLowerCase())),
  );
}, [assets, tab, q]);
```

- **Status:** Actually CORRECT - search already uses `.toLowerCase()` for case-insensitive matching ✓
- **Note:** However, the global search in [AppShell.tsx](src/components/AppShell.tsx#L115-L120) is not functional (input has no handlers)

---

## 4. ⚠️ "Add New Bed" Form - NO REFRESH AFTER SUBMISSION

**Status:** ISSUE FOUND / NO "ADD BED" FORM EXISTS

- **Location:** Not found in codebase
- **Issue:** There is NO "Add New Bed" form in the application
  - `Allocate Bed` dialog exists ([src/routes/beds.tsx](src/routes/beds.tsx#L194-L320)) but this allocates existing beds to patients, not creates new beds
  - No bed creation UI found
  - No bed management interface for admins

---

## 5. ⚠️ Navigation Tabs Highlighting - WORKS CORRECTLY

**Status:** WORKING AS INTENDED

- **Location:** [src/components/AppShell.tsx](src/components/AppShell.tsx#L41-L53)
- **Code:**

```typescript
const active = loc.pathname === it.to || (it.to !== "/dashboard" && loc.pathname.startsWith(it.to));
// ...
className={`... ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-sidebar-foreground/85 hover:bg-sidebar-accent"}`}
```

- **Details:** Active nav state is properly applied using React Router's `useLocation()` hook ✓

---

## 6. ⚠️ Export/Download PDF Functionality - NOT IMPLEMENTED

**Status:** ISSUE FOUND

- **Location:** [src/routes/reports.tsx](src/routes/reports.tsx#L27-L30)
- **Code:**

```typescript
<button className="inline-flex h-10 px-4 items-center gap-2 rounded-xl bg-primary text-white text-sm font-semibold">
  <FileText size={16} /> Export PDF
</button>
```

- **Problems:**
  - Button has NO `onClick` handler
  - No PDF library imported
  - No export functionality implemented
  - Also seen in: `Export CSV` button (same issue)
  - Similar issue in [src/routes/beds.tsx](src/routes/beds.tsx#L83) - Filters button also has no handler

---

## 7. ⚠️ Delete Confirmation Modal - NO DELETE FUNCTIONALITY FOUND

**Status:** NOT IMPLEMENTED / NOT REQUIRED

- **Location:** Not found in codebase
- **Issue:**
  - No delete buttons in UI
  - No confirmation modals for destructive actions
  - Only soft operations: discharge, mark for cleaning, etc. (all with toast-only implementations)
  - No hard delete functionality found

---

## 8. ⚠️ Date/Time Picker and Timezone Handling - NOT USED IN FORMS

**Status:** DEPENDENCIES PRESENT, BUT NOT UTILIZED

- **Location:** Checked all route files
- **Details:**
  - Dependencies installed: `date-fns`, `react-day-picker`, `@date-fns/tz` in [package.json](package.json)
  - **NOT USED IN ANY FORMS** - searched all routes and components
  - `AllocateDialog` in [src/routes/beds.tsx](src/routes/beds.tsx) has NO date/time inputs
  - `New Admission` form in [src/routes/admissions.tsx](src/routes/admissions.tsx) has NO date/time inputs
  - Date fields exist only in static data display (e.g., "Admitted On": "Today")
- **Issue:** Dead dependency - installed but never used in UI forms

---

## 9. ✅ Mobile Hamburger Menu - WORKS CORRECTLY

**Status:** WORKING AS INTENDED

- **Location:** [src/components/AppShell.tsx](src/components/AppShell.tsx#L32), [src/components/AppShell.tsx](src/components/AppShell.tsx#L103-L108)
- **Code:**

```typescript
const [open, setOpen] = useState(false);
// On mobile:
<button className="lg:hidden p-2 -ml-2" onClick={() => setOpen(true)}>
  <Menu size={20} />
</button>
// Overlay dismissal:
{open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />}
```

- **Details:**
  - Mobile menu toggle works correctly ✓
  - Menu closes on link click ✓
  - Overlay backdrop dismisses menu ✓
  - Responsive breakpoint properly hidden on lg screens ✓

---

## Summary of Actual Bugs

| Issue # | Feature                 | Severity  | Status                                         |
| ------- | ----------------------- | --------- | ---------------------------------------------- |
| 1       | Book Bed Button         | ✅ None   | Working                                        |
| 2       | Release Bed / Discharge | 🔴 High   | **Toast only, no real action**                 |
| 3       | Search/Filter           | 🟡 Low    | Assets search OK, global search non-functional |
| 4       | Add New Bed Form        | 🟡 N/A    | **Feature doesn't exist**                      |
| 5       | Navigation Tabs         | ✅ None   | Working                                        |
| 6       | Export PDF              | 🔴 High   | **No handler, not implemented**                |
| 7       | Delete Modal            | 🟡 N/A    | **Feature doesn't exist**                      |
| 8       | Date/Time Picker        | 🟡 Medium | **Installed but unused dead code**             |
| 9       | Mobile Menu             | ✅ None   | Working                                        |

---

## Critical Issues to Fix

### 🔴 PRIORITY 1: Non-Functional Button Handlers

1. **Export PDF Button** [src/routes/reports.tsx](src/routes/reports.tsx)
2. **Export CSV Button** [src/routes/reports.tsx](src/routes/reports.tsx)
3. **Filters Button** [src/routes/beds.tsx](src/routes/beds.tsx#L83) - shows toast but button is placeholder
4. **Global Search Input** [src/components/AppShell.tsx](src/components/AppShell.tsx#L115-L120) - input exists but has no onChange handler

### 🔴 PRIORITY 2: Discharge/Release Functionality

- [src/routes/beds.tsx](src/routes/beds.tsx#L397-L398) - Discharge button needs real implementation
- Should update bed status to "available"
- Should refresh bed list
- Should show confirmation dialog first

### 🟡 PRIORITY 3: Code Cleanup

- Remove unused date/time dependencies from package.json if not planned
- Or: Implement actual date picker in admission/booking forms

### 🟡 PRIORITY 4: Missing Features

- "Add New Bed" management interface (if needed by spec)
- Actual delete functionality with confirmation modal (if needed by spec)

---

## Files Analyzed

- [src/routes/beds.tsx](src/routes/beds.tsx)
- [src/routes/dashboard.tsx](src/routes/dashboard.tsx)
- [src/routes/admissions.tsx](src/routes/admissions.tsx)
- [src/routes/discharges.tsx](src/routes/discharges.tsx)
- [src/routes/reports.tsx](src/routes/reports.tsx)
- [src/routes/assets.tsx](src/routes/assets.tsx)
- [src/routes/rooms.tsx](src/routes/rooms.tsx)
- [src/routes/staff.tsx](src/routes/staff.tsx)
- [src/routes/tasks.tsx](src/routes/tasks.tsx)
- [src/routes/notifications.tsx](src/routes/notifications.tsx)
- [src/routes/settings.tsx](src/routes/settings.tsx)
- [src/components/AppShell.tsx](src/components/AppShell.tsx)
- [package.json](package.json)

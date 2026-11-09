# Messentials UI Design Guide

This file guides AI models that build the Messentials website UI (`www.messentials.com`). Follow it closely. When a detail is missing, use the Material Design 3 (M3) default.

**Stack assumptions:** React or any component framework, Tailwind CSS, Material Symbols (outlined) icons, Roboto font.

---

## 1. Source Material

### 1.1 Screen images

Save the design screenshots in `docs/ui/` with these names. Reference them when you build each screen.

| Screen | Route | Image path | Active nav item |
|---|---|---|---|
| Store | `/store` | `docs/ui/01-store.png` | Store |
| Events | `/events` | `docs/ui/02-events.png` | Events |
| Register (queue) | `/register` | `docs/ui/03-register-queue.png` | Register |
| Borrow | `/borrow` | `docs/ui/04-borrow.png` | Borrow |
| Reviewer | `/reviewer` | `docs/ui/05-reviewer.png` | Reviewer |
| Notifications | `/notifications` | `docs/ui/06-notifications.png` | Bell icon |

Embed them in docs or PRs like this: `![Store](docs/ui/01-store.png)`

### 1.2 Figma links

No Figma links exist yet. Replace each `TODO` with the real frame URL.

| Screen | Figma frame |
|---|---|
| Store | `TODO: https://www.figma.com/design/<file-id>?node-id=<id>` |
| Events | `TODO` |
| Register (queue) | `TODO` |
| Borrow | `TODO` |
| Reviewer | `TODO` |
| Notifications | `TODO` |

Do not invent Figma URLs. If a link is `TODO`, build from the images and this file.

---

## 2. Design Principles

- Use M3 components, shapes, and states. Do not invent custom controls.
- Use the purple (violet) M3 palette. Primary actions are filled purple. Secondary actions are outlined.
- Use ₱ (Philippine peso) for all prices. Format as `₱89` and `₱2,100`.
- Keep layouts calm: white content card, lavender accents, generous spacing.
- Meet WCAG AA contrast. Give every icon-only button an `aria-label`.

---

## 3. Theme Tokens

### 3.1 Color palette

Colors follow M3 role names. Values are the M3 baseline purple scheme, matched to the screenshots.

| Role | Token | Hex | Used for |
|---|---|---|---|
| Primary | `primary` | `#6750A4` | Filled buttons (Sign Up, Borrow, Download), slider track, hero card, active links |
| On primary | `on-primary` | `#FFFFFF` | Text on primary |
| Primary container | `primary-container` | `#EADDFF` | Search bar, Check Out and Borrow buttons (tonal), "What happens next" card |
| On primary container | `on-primary-container` | `#21005D` | Text on primary container |
| Secondary | `secondary` | `#625B71` | "See more" button, "Due in N days" badge |
| On secondary | `on-secondary` | `#FFFFFF` | Text on secondary |
| Secondary container | `secondary-container` | `#E8DEF8` | Active nav indicator pill, count badges, category chips |
| On secondary container | `on-secondary-container` | `#1D192B` | Text on secondary container |
| Error | `error` | `#B3261E` | Unregister button |
| On error | `on-error` | `#FFFFFF` | Text on error |
| Error container | `error-container` | `#F9DEDC` | "Overdue" badge background |
| On error container | `on-error-container` | `#410E0B` | "Overdue" badge text, overdue stat number (`#8C1D18` is also acceptable) |
| Background | `background` | `#FEF7FF` | Page background behind the content card |
| Surface | `surface` | `#FFFFFF` | Main content card, queue page card |
| Surface container | `surface-container` | `#F3EDF7` | Browser/app frame bar, stat cards |
| Surface variant | `surface-variant` | `#E7E0EC` | Image placeholder tiles, stat cards |
| On surface | `on-surface` | `#1D1B20` | Titles and body text |
| On surface variant | `on-surface-variant` | `#49454F` | Descriptions, helper text, inactive icons |
| Outline | `outline` | `#79747E` | Checkbox border, dividers on inputs |
| Outline variant | `outline-variant` | `#CAC4D0` | Dividers, card borders, placeholder icons |

### 3.2 Tailwind config

Tailwind v3 (`tailwind.config.js`):

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        primary: "#6750A4",
        "on-primary": "#FFFFFF",
        "primary-container": "#EADDFF",
        "on-primary-container": "#21005D",
        secondary: "#625B71",
        "on-secondary": "#FFFFFF",
        "secondary-container": "#E8DEF8",
        "on-secondary-container": "#1D192B",
        error: "#B3261E",
        "on-error": "#FFFFFF",
        "error-container": "#F9DEDC",
        "on-error-container": "#410E0B",
        background: "#FEF7FF",
        surface: "#FFFFFF",
        "surface-container": "#F3EDF7",
        "surface-variant": "#E7E0EC",
        "on-surface": "#1D1B20",
        "on-surface-variant": "#49454F",
        outline: "#79747E",
        "outline-variant": "#CAC4D0",
      },
      fontFamily: {
        sans: ["Roboto", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "m3-xs": "4px",
        "m3-sm": "8px",
        "m3-md": "12px",
        "m3-lg": "16px",
        "m3-xl": "28px",
        "m3-full": "9999px",
      },
      spacing: {
        rail: "80px",
        panel: "360px",
      },
      boxShadow: {
        "m3-1": "0 1px 2px rgba(0,0,0,.30), 0 1px 3px 1px rgba(0,0,0,.15)",
        "m3-2": "0 1px 2px rgba(0,0,0,.30), 0 2px 6px 2px rgba(0,0,0,.15)",
      },
    },
  },
  plugins: [],
};
```

Tailwind v4 users: put the same values in an `@theme { --color-primary: #6750A4; ... }` block.

### 3.3 Typography

Font: **Roboto**. Use these M3 type roles mapped to Tailwind classes.

| Role | Tailwind classes | Used for |
|---|---|---|
| Display large | `text-[57px] leading-[64px] font-normal` | Queue position number ("120") |
| Headline medium | `text-[28px] leading-9 font-normal` | Page headings ("Your are in line", "Registered Events") |
| Title large | `text-[22px] leading-7 font-normal` | List item titles, stat numbers |
| Title medium | `text-base font-medium tracking-[0.15px]` | Product names, section labels |
| Body large | `text-base tracking-[0.5px]` | Checkbox labels, prices |
| Body medium | `text-sm tracking-[0.25px]` | Descriptions, "Description \| Event Date" |
| Label large | `text-sm font-medium tracking-[0.1px]` | Button text |
| Label medium | `text-xs font-medium tracking-[0.5px]` | Nav labels, chips, badges |

Note: the Queue screen heading reads "Your are in line" in the design. Use "You are in line" in production and flag the fix to the designer.

### 3.4 Shape

| Element | Radius |
|---|---|
| Main content card | `rounded-m3-xl` (28px) |
| Product card, stat card | `rounded-m3-lg` (16px) |
| Image placeholder tile | `rounded-m3-lg` |
| Buttons (all) | `rounded-m3-sm` (8px) for small action buttons; `rounded-m3-full` for pill buttons (Check Out, search bar) |
| Chips, badges | `rounded-m3-sm` |
| Nav indicator | `rounded-m3-full` |

### 3.5 Spacing and elevation

- Base grid: 4px. Common gaps: `gap-2` (8px), `gap-4` (16px), `gap-6` (24px).
- Content card padding: `p-4` for grids, `px-6 py-4` for lists.
- Cards use a 1px `outline-variant` or `primary` border, not shadow. Use `shadow-m3-1` only on dialogs and sticky bars.

### 3.6 State layers

Apply M3 state overlays on interactive elements:

- Hover: 8% overlay of the content color (`hover:bg-primary/10` on tonal elements, `hover:brightness-110` on filled).
- Focus visible: 2px `outline` ring with `focus-visible:ring-2 ring-primary`.
- Pressed: 10% overlay.
- Disabled: 38% opacity for content, 12% for container.

---

## 4. App Shell

Every screen shares this shell.

```
┌──────────────────────────────────────────────────────────┐
│ Rail (80px) │  Content card (flex-1)   │ Panel (360px)*  │
│             │                          │                 │
└──────────────────────────────────────────────────────────┘
* The right panel appears only on Store, Events, Borrow, Reviewer.
```

```html
<body class="bg-background text-on-surface font-sans">
  <div class="flex h-screen">
    <aside class="w-rail shrink-0 flex flex-col items-center justify-between py-6"><!-- Sidebar --></aside>
    <main class="flex-1 my-4 mr-4 flex rounded-m3-xl bg-surface overflow-hidden">
      <section class="flex-1 overflow-y-auto"><!-- Page content --></section>
      <aside class="w-panel shrink-0 border-l border-outline-variant"><!-- Filter panel (optional) --></aside>
    </main>
  </div>
</body>
```

The browser chrome in the screenshots (address bar, tabs) is a mock frame. Do not build it.

---

## 5. Components

### 5.1 Sidebar (Navigation Rail)

M3 Navigation Rail, 80px wide, pinned left.

**Structure**
- Top group (vertically centered in the rail): five destinations in this order: **Store**, **Borrow**, **Reviewer**, **Events**, **Register**.
- Bottom group: **Notifications** bell icon, then **Profile** avatar button (circle, `bg-primary-container`, person icon in `primary`).

**Destinations**

| Label | Material Symbol | Route |
|---|---|---|
| Store | `shopping_cart` | `/store` |
| Borrow | `library_books` | `/borrow` |
| Reviewer | `book` (bookmark book) | `/reviewer` |
| Events | `calendar_today` | `/events` |
| Register | `badge` (ID card) | `/register` |

**Item markup**

```html
<a href="/store" class="flex flex-col items-center gap-1 py-1 group" aria-current="page">
  <span class="h-8 w-14 flex items-center justify-center rounded-m3-full
               bg-secondary-container text-on-secondary-container"> <!-- active -->
    <span class="material-symbols-outlined">shopping_cart</span>
  </span>
  <span class="text-xs font-medium tracking-[0.5px]">Store</span>
</a>
```

- **Active:** pill `bg-secondary-container` behind the icon, label in `on-surface`.
- **Inactive:** no pill, icon and label in `on-surface-variant`. Hover shows an 8% overlay on the pill area.
- Notification bell turns `text-primary` when the Notifications screen is open. Show a red dot (`bg-error`, 8px) when unread items exist.

### 5.2 Header / Page Title

The design has no global top bar. Pages start directly inside the content card.

- Use a page heading only where the design shows one: `Registered Events`, `Available Events`, `On loan`, `Available for borrow`, `Your are in line`.
- Heading: `text-[28px]` (Headline medium) for page-level titles; `text-[22px]` for section titles.
- Section headings sit above their list with `mb-2`. Separate sections with a `border-t border-outline-variant` divider and `py-4`.

### 5.3 Filter Panel (right column)

Width 360px, `p-4`, `border-l border-outline-variant`. Content stacks top to bottom:

1. **Search bar:** pill (`rounded-m3-full`, `h-14`, `bg-primary-container`), placeholder "Hinted search text" in `on-surface-variant`, search icon at right.
2. **Filter header row:** "Filters" label on the left, **Reset Filters** outlined button on the right (`border border-primary text-primary rounded-m3-sm px-3 h-9`).
3. **Divider:** `border-t border-primary/60`.
4. **Screen-specific block** (see table below).
5. **Checkbox list:** M3 checkbox (18px, `rounded-m3-xs`, `border-outline`), label in Body large, count badge at right (`bg-secondary-container rounded-m3-sm px-2 text-xs`).
6. **Footer (Store and Borrow only):** pinned to bottom with `mt-auto`. Shows a summary line, an optional total, and a tonal pill button.

| Screen | Screen-specific block | Footer |
|---|---|---|
| Store | "Price Range" label, dual-thumb slider (`₱0`–`₱300`, track `bg-primary`, white thumbs with `primary` border), "Quick Select:" with four outlined chips: `Under ₱50`, `₱50-₱100`, `₱100-₱150`, `₱150+`. Checkboxes: Chips (4), Coffee (3), Candy (2), Stationery (3), Biscuits (3). | Cart line `Chips  x4`, **Total: ₱2,100**, **Check Out** tonal button |
| Events | Two outlined toggle chips: `All`, `Available`. Five checkboxes with counts. | None |
| Borrow | Same toggle chips: `All`, `Available`. Five checkboxes with counts. | Basket line `Lorem x4`, **Borrow** tonal button |
| Reviewer | Course chips (2×2 grid): `All Courses`, `Course 1`, `Course 2`, `Course 3`. Five checkboxes with counts. | None |

**Outlined chip:** `h-9 rounded-m3-sm border border-primary text-primary text-sm`. Selected state: `bg-secondary-container border-transparent text-on-secondary-container`.

**Tonal pill button (Check Out, Borrow):** `h-10 w-full rounded-m3-full bg-primary-container text-on-primary-container font-medium flex items-center justify-center gap-2`, with a leading filled star icon.

### 5.4 Dashboard Grid (Store product grid)

A responsive card grid inside the content card.

```html
<ul class="grid gap-4 p-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
  <li><!-- ProductCard --></li>
</ul>
```

The design shows **4 columns**. Fall back to 3, 2, 1 columns on narrower screens.

**ProductCard**

```html
<article class="rounded-m3-lg border border-primary overflow-hidden bg-surface">
  <div class="aspect-[4/3] bg-surface-variant flex items-center justify-center">
    <!-- product image; placeholder icon in text-outline-variant -->
  </div>
  <div class="p-4 flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <h3 class="text-xl font-medium">Product</h3>
      <span class="rounded-m3-sm bg-surface-variant px-2 py-0.5 text-xs">Biscuit</span>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-xl font-semibold">₱89</span>
      <!-- Quantity stepper -->
      <div class="flex items-center gap-3">
        <button aria-label="Decrease" class="size-10 rounded-m3-full bg-secondary-container">−</button>
        <span class="w-4 text-center text-sm">3</span>
        <button aria-label="Increase" class="size-10 rounded-m3-full bg-secondary-container">+</button>
      </div>
    </div>
  </div>
</article>
```

- The grid scrolls vertically inside the content card. Cards are cut off at the bottom edge when they overflow.
- Quantity cannot go below 0. Updating a quantity updates the cart summary in the Filter Panel footer.

### 5.5 List Item (Events, Borrow, Reviewer, Notifications)

Shared row pattern:

```html
<li class="flex items-center gap-4 px-6 py-2">
  <div class="size-14 rounded-m3-lg bg-surface-variant shrink-0"><!-- image --></div>
  <div class="flex-1 min-w-0">
    <p class="text-xl">Title</p>
    <p class="text-sm text-on-surface-variant truncate">Description | Event Date</p>
  </div>
  <div class="flex items-center gap-2"><!-- trailing actions --></div>
</li>
```

Size variants: **compact** thumb `size-14` (registered events, on-loan items, reviewer, notifications); **large** thumb `size-24` (available events, available for borrow).

| Screen | Subtitle format | Trailing actions |
|---|---|---|
| Events, registered | `Description \| Event Date` | `See more` (secondary), `Unregister` (error) |
| Events, available | `Description \| Event Date` | `See more` (secondary), `Sign Up` (primary) |
| Borrow, on loan | `Description \| Borrow date \| Due Date` | Status badge |
| Borrow, available | `Description \| Available x2` (the `x2` count in `text-primary`) | `Borrow` (primary) |
| Reviewer | `Description \| Borrow date \| Due Date` | `Preview` (outlined), `Download` (primary) |
| Notifications | `Description` | Right-pointing caret (`arrow_right`), whole row is a link |

**Buttons used in rows** (all `h-8 px-4 rounded-m3-sm text-sm font-medium`):
- Primary: `bg-primary text-on-primary`
- Secondary: `bg-secondary text-on-secondary`
- Error: `bg-error text-on-error`
- Outlined: `border border-outline text-on-surface bg-surface`

**Status badges (Borrow, on loan)**
- Overdue: `bg-error-container text-on-error-container`
- Due soon ("Due in 2 days", "Due in 7 days"): `bg-secondary text-on-secondary`

### 5.6 Stat Cards (Borrow summary)

Three equal cards in a row at the top of the Borrow page: `grid grid-cols-3 gap-6 p-4`.

| Card | Label | Value style |
|---|---|---|
| Items on loan | `Items on loan` | `3 of 5` in `text-5xl` |
| Due soon | `Due within x days` | `1 items` (number in `text-error`) |
| Overdue | `Overdue` | `1 items` (number in `text-error`) |

Card: `rounded-m3-lg bg-surface-variant p-6`, label in Title large, value in `text-5xl`.

### 5.7 Queue Page (Register)

No filter panel. Full-width content inside the card, `p-6`.

1. **Heading:** "You are in line" (Headline medium).
2. **Position card:** `rounded-m3-lg bg-primary text-on-primary`, centered. Label "Your Position" in Title large, number in Display large (`120`). A progress bar sits below: 4px high, filled part `bg-white`, track `bg-white/30`.
3. **"What happens next" card:** `rounded-m3-lg bg-primary-container p-6`. Title in `text-on-primary-container`. Numbered steps 1–3, each with a small white rounded square badge (`size-10 rounded-m3-md shadow-m3-1`) and step text in Title large.
4. **Action row:** two equal-width buttons, `h-14 rounded-m3-sm`.
   - **Continue to Registration:** filled primary.
   - **Leave Queue:** outlined (`border border-outline-variant bg-surface`).
   Leave Queue must open the confirm Modal (see 5.8).

### 5.8 Modal (Dialog)

The screenshots show no modal. Build modals from the M3 Basic Dialog spec. Use one for: Leave Queue, Unregister, Check Out, Borrow, and event "See more".

```html
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/32" role="presentation">
  <div role="dialog" aria-modal="true" aria-labelledby="dlg-title"
       class="w-full max-w-[560px] min-w-[280px] rounded-m3-xl bg-surface-container p-6 shadow-m3-2">
    <h2 id="dlg-title" class="text-2xl text-on-surface">Leave the queue?</h2>
    <p class="mt-4 text-sm text-on-surface-variant">You will lose your place in line.</p>
    <div class="mt-6 flex justify-end gap-2">
      <button class="h-10 px-3 rounded-m3-full text-primary font-medium">Cancel</button>
      <button class="h-10 px-3 rounded-m3-full text-primary font-medium">Leave Queue</button>
    </div>
  </div>
</div>
```

Rules:
- Scrim: black at 32% opacity. Click on scrim or press `Esc` closes the dialog.
- Trap focus inside. Return focus to the trigger on close.
- Actions are right-aligned text buttons. For a destructive action (Unregister, Leave Queue), use `text-error` on the confirm button.
- "See more" on an event uses a larger dialog with the image, full description, date, and a Sign Up or Unregister button.

---

## 6. Screen Recipes

Build each screen from the components above.

| Screen | Layout | Content |
|---|---|---|
| **Store** | Rail + content + panel | Dashboard Grid of ProductCards. Panel: search, price range, category filters, cart summary, Check Out. |
| **Events** | Rail + content + panel | "Registered Events" list (compact rows), divider, "Available Events" list (large rows). Panel: search, All/Available toggle, checkboxes. |
| **Register** | Rail + content | Queue page (5.7). |
| **Borrow** | Rail + content + panel | Three stat cards, "On loan" list (compact rows with badges), divider, "Available for borrow" list (large rows). Panel: search, toggle, checkboxes, basket, Borrow button. |
| **Reviewer** | Rail + content + panel | Compact rows with Preview and Download. Panel: search, course chips, checkboxes. |
| **Notifications** | Rail + content | Compact rows with a caret. No panel. |

---

## 7. Behavior and Accessibility

- **Navigation:** the rail is persistent. Mark the current route with `aria-current="page"`.
- **Filters:** changes apply immediately. **Reset Filters** clears search, chips, sliders, and checkboxes. Count badges show the number of items per option.
- **Search:** debounce input by 300 ms.
- **Empty states:** show a centered icon, one line of text, and a Reset Filters action.
- **Loading states:** show M3 skeleton blocks in `bg-surface-variant` with `animate-pulse`.
- **Touch targets:** at least 40×40px (48×48px on touch devices).
- **Keyboard:** all controls reachable by Tab. Slider thumbs respond to arrow keys.
- **Images:** the gray placeholder tile with three shapes (triangle, burst, rounded square) is a stand-in. Replace it with real product or event images, using `object-cover`.

---

## 8. Do and Don't

**Do**
- Use the tokens in section 3 for every color, radius, and font size.
- Reuse the shared List Item and Filter Panel components across screens.
- Keep the Store grid at 4 columns on wide screens.

**Don't**
- Don't add new colors, gradients, or shadows on cards.
- Don't build the browser frame from the screenshots.
- Don't copy placeholder text ("Lorem", "Title", "Hinted search text") into production. Replace it with real content.
- Don't invent Figma links.

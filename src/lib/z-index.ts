/* ============================================
   EIFA COUTURE — Z-Index Scale
   ============================================
   Mirrors the CSS custom properties defined in `src/app/globals.css`
   (`:root { --z-header, --z-dropdown, ... }`).

   In components, prefer the Tailwind arbitrary-value syntax against the
   CSS variable directly, e.g.:

     className="fixed inset-0 z-(--z-backdrop)"
     className="fixed inset-y-0 right-0 z-(--z-drawer)"

   This TS object exists only for the rare case where a z-index is needed
   outside a Tailwind class — an inline `style={{ zIndex }}` prop, a
   portal, or a JS comparison. If you change a value here, change the
   matching `--z-*` variable in globals.css too — these two files are the
   single source of truth together and must stay in sync.
   ============================================ */

export const Z_INDEX = {
  header: 30,
  dropdown: 40,
  backdrop: 50,
  drawer: 60,
  fullscreen: 70,
  toast: 80,
} as const;

export type ZIndexLayer = keyof typeof Z_INDEX;

# User Interface Guide (UI/UX Standards)

## 1. Aesthetic DNA
Our interface is inspired by high-end, clean, functional software design, emphasizing clarity, negative space, and modern typography:
- **Off-white Canvases**: Use soft, easy-on-the-eyes backgrounds (`bg-slate-50`, `bg-slate-100`) rather than harsh pure whites.
- **Micro-Shadows**: Keep elevation flat or subtle. Cards utilize thin, modern borders combined with light ring shadows to structure information hierarchically.
- **Aesthetic Accents**: Use semantic coloring to express vendor states elegantly:
  - **Approved (Grade A/B)**: Emerald / Sage (`text-emerald-600`, `bg-emerald-50/50`)
  - **Conditional (Grade C)**: Amber (`text-amber-600`, `bg-amber-50/50`)
  - **Rejected (Black List)**: Rose / Coral (`text-rose-600`, `bg-rose-50/50`)
  - **Under Evaluation**: Teal / Slate (`text-teal-600`, `bg-teal-50/50`)

## 2. Persian RTL & Typography Rules
- **Text Alignment**: Standard RTL flow across all dashboards, list views, and form inputs. Text aligns to the right (`text-right`) and components follow logical RTL flows.
- **Display Headings**: Clean, high-contrast, bold display titles paired with lighter subtitles to guide user scanning.
- **Numbers & Identifiers**: Standard Persian/English formatting as appropriate. Numerical scoring values and codes (such as CAS, IRC) utilize clean monospaced font sizing to prevent alignment shifts.
- **Touch Targets**: Buttons, tabs, and interactive drawer elements support a minimum size of `44px` with clear hover feedbacks on desktop screens.

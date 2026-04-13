# Design System Strategy: Kinetic Brutalism

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"Kinetic Brutalism."** 

This isn't just a minimalist dark mode; it is a high-velocity, editorial experience that leverages extreme contrast and architectural sharp edges to command attention. We are moving away from the "friendly SaaS" aesthetic of rounded corners and soft shadows. Instead, we embrace the "Monolith"—using massive typography, absolute zero-radius corners, and a high-energy neon pulse to create a premium digital agency feel. 

The layout should feel like a high-end fashion magazine crossed with a technical blueprint. We break the grid through **intentional asymmetry**: large display type should often bleed off-canvas or sit in unexpected alignment with body copy, creating a sense of motion even in static layouts.

---

## 2. Colors & Tonal Depth
Our palette is anchored in absolute blacks and high-vis neon greens. To avoid a "flat" or "cheap" look, we use a sophisticated layering of dark tones.

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders are strictly prohibited for sectioning or containment. Boundaries must be defined solely through background color shifts.
*   Use `surface` (#131313) as your base canvas.
*   Use `surface-container-low` (#1b1b1c) for secondary content blocks.
*   Use `surface-container-lowest` (#0e0e0e) to create "wells" or recessed areas for technical data or secondary inputs.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked slabs. Instead of shadows, use the surface-container tiers to define depth. An element sitting on `surface` should use `surface-container-high` (#2a2a2a) to indicate it is "closer" to the user.

### The "Glass & Gradient" Rule
While the style is edgy and sharp, we introduce "Visual Soul" through:
*   **Signature Textures:** Use a linear gradient for primary CTAs transitioning from `primary_fixed` (#b2f700) to `primary_fixed_dim` (#9cd900) at a 135-degree angle. This provides a metallic, premium sheen.
*   **Glassmorphism:** For floating navigation or overlays, use `surface_container` at 70% opacity with a `40px` backdrop blur. This prevents the "pasted-on" look and integrates the element into the high-energy environment.

---

## 3. Typography
Typography is the primary visual engine of this design system. We use **Space Grotesk** for high-impact display and **Inter** for technical precision.

*   **Display-LG (3.5rem / Space Grotesk):** Reserved for hero statements. Tracking should be set to `-0.04em` to create a dense, "blocky" feel.
*   **Headline-MD (1.75rem / Space Grotesk):** Used for section headers. Always uppercase when used alongside neon accents.
*   **Body-LG (1rem / Inter):** Set with generous line-height (1.6) to provide the necessary "breathing room" that balances the aggressive headlines.
*   **Label-SM (0.6875rem / Space Grotesk):** Uppercase with `0.1em` letter spacing. Used for categories, overlines, or technical metadata.

---

## 4. Elevation & Depth
In "Kinetic Brutalism," elevation is felt, not seen through heavy dropshadows.

*   **The Layering Principle:** Stacking is our substitute for borders. A `surface-container-highest` card should sit atop a `surface` background to create a crisp, clear lift.
*   **Ambient Shadows:** If a floating element (like a modal) requires a shadow, it must be massive and faint. 
    *   *Token:* `0px 24px 80px rgba(0, 0, 0, 0.5)`. 
    *   For a high-energy "glow" effect on primary buttons, use a drop shadow tinted with the primary neon: `0px 0px 20px rgba(178, 247, 0, 0.3)`.
*   **The "Ghost Border" Fallback:** If accessibility requires a container boundary, use the `outline_variant` token at **15% opacity**. It should be felt as a change in texture rather than a literal line.

---

## 5. Components

### Buttons
*   **Primary:** Sharp corners (`0px`). Background: `primary_fixed` (#b2f700); Text: `on_primary_fixed` (#131f00). 
*   **Secondary:** Sharp corners (`0px`). Background: transparent; Border: `primary_fixed` at 20% opacity; Text: `primary_fixed`.
*   **Interaction:** On hover, the Primary button should "invert"—background becomes `white`, text becomes `black`.

### Input Fields
*   **Style:** No border. Background is `surface-container-highest` (#353535). 
*   **Focus State:** A 2px bottom-bar of `primary_fixed`. No "all-around" focus ring.
*   **Sharpness:** Ensure the cursor is a non-rounded block to match the aesthetic.

### Cards & Lists
*   **The "No-Divider" Rule:** Forbid horizontal lines between list items. Use `24px` of vertical white space (from our spacing scale) to separate thoughts.
*   **Hover State:** Entire card background shifts from `surface` to `surface-container-low`.

### Chips
*   Small, rectangular blocks with `label-sm` typography. 
*   Use `surface-container-high` for inactive chips and `primary_fixed` for selected states.

### Agency-Specific Component: The "Kinetic Scroller"
For work portfolios, use a horizontal marquee or a large-scale image reveal where the image is clipped by a sharp-edged container that expands on scroll.

---

## 6. Do's and Don'ts

### Do:
*   **Use Absolute Zero:** Every corner must be `0px`. No exceptions.
*   **Embrace Whitespace:** If a section feels crowded, double the padding. High-energy design requires room to breathe.
*   **Scale Asymmetry:** Place a `display-lg` headline on the left and a small `body-md` paragraph on the far right of the grid to create tension.

### Don't:
*   **No Dividers:** Never use a 1px line to separate content. Use tonal shifts (`surface` vs `surface-container`).
*   **No Default Grays:** Avoid neutral grays. Use the tinted "surface" tokens which have a slight depth to them.
*   **No Softness:** Avoid transitions that are too slow. Micro-interactions should be "snappy" (e.g., 150ms ease-out or spring animations).

### Accessibility Note:
While we use high-contrast neon, ensure all text-on-background combinations meet WCAG AA standards. Use `on_surface` (#e5e2e1) for primary reading to reduce eye strain against the deep black.
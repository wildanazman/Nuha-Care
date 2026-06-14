---
name: Nuha Care Design System
colors:
  surface: '#fbfbe2'
  surface-dim: '#dbdcc3'
  surface-bright: '#fbfbe2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f5dc'
  surface-container: '#efefd7'
  surface-container-high: '#eaead1'
  surface-container-highest: '#e4e4cc'
  on-surface: '#1b1d0e'
  on-surface-variant: '#434844'
  inverse-surface: '#303221'
  inverse-on-surface: '#f2f2d9'
  outline: '#747873'
  outline-variant: '#c3c8c2'
  surface-tint: '#556158'
  primary: '#556158'
  on-primary: '#ffffff'
  primary-container: '#e8f5e9'
  on-primary-container: '#647167'
  inverse-primary: '#bdcabe'
  secondary: '#526069'
  on-secondary: '#ffffff'
  secondary-container: '#d3e2ed'
  on-secondary-container: '#56656e'
  tertiary: '#695b5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffedf0'
  on-tertiary-container: '#796a6d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e6da'
  primary-fixed-dim: '#bdcabe'
  on-primary-fixed: '#131e17'
  on-primary-fixed-variant: '#3e4a41'
  secondary-fixed: '#d6e5ef'
  secondary-fixed-dim: '#bac9d3'
  on-secondary-fixed: '#0f1d25'
  on-secondary-fixed-variant: '#3b4951'
  tertiary-fixed: '#f1dee1'
  tertiary-fixed-dim: '#d4c2c5'
  on-tertiary-fixed: '#23191b'
  on-tertiary-fixed-variant: '#504346'
  background: '#fbfbe2'
  on-background: '#1b1d0e'
  surface-variant: '#e4e4cc'
typography:
  headline-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Quicksand
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Quicksand
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 20px
  lg: 32px
  xl: 48px
  container-margin: 20px
  card-gap: 16px
---

## Brand & Style
The design system is centered on the concept of "Gentle Stewardship." It is designed for families to document their health journeys without the stress of a clinical environment. The aesthetic leans into a **Soft-Modern** style, blending organic shapes with a warm, breathable layout. 

The target audience consists of caregivers and parents who require clarity during moments of concern and ease during daily logging. The emotional response should be one of "calm capability"—the interface feels more like a personal journal or a nursery than a medical chart. High legibility, generous touch targets, and a soothing color palette eliminate cognitive load.

## Colors
This design system utilizes a "Warm-Light" palette to avoid the coldness of pure white or medical blues.
- **Primary (Pastel Green):** Used for growth, health, and "all-clear" status indicators.
- **Secondary (Pastel Blue):** Used for hydration, sleep, and general logging categories.
- **Tertiary (Soft Pink/Peach):** Reserved for delicate reminders, heart rate, or maternal health logs.
- **Neutral (Light Beige):** Acts as the grounding element for containers and secondary surfaces.
- **Text:** We avoid pure black (#000) in favor of a deep mossy charcoal (#3E4A3E) to maintain the soft visual profile.

## Typography
We use **Quicksand** exclusively for its rounded terminals and open apertures, which provide an approachable and highly readable experience. 
- **Headlines:** Use Bold (700) or SemiBold (600) weights with slightly tighter letter spacing to create a friendly, "bubbled" look.
- **Body:** Maintains a Medium (500) weight as the default for better legibility against light-colored backgrounds.
- **Hierarchy:** We prioritize large, clear titles to help users navigate quickly while carrying a child or multitasking.

## Layout & Spacing
The layout follows a **Fluid Mobile-First** model with a focus on "Thumb-Zone" ergonomics. 
- **Grid:** A simple 4-column grid for mobile, expanding to 12 columns for tablet/desktop.
- **Margins:** We use a generous 20px side margin to give content breathing room.
- **Rhythm:** Vertical rhythm is built on an 8px baseline. Large gaps (32px+) are encouraged between different family members' logs to clearly demarcate records.
- **Touch Targets:** Minimum touch target size is 48x48px, but primary action buttons should aim for 56px height for maximum ease of use.

## Elevation & Depth
In this design system, depth is achieved through **Tonal Layering** and **Soft Ambient Shadows** rather than stark borders.
- **Surface Levels:** The background is the Warm Cream (#FFFDF9). Cards sit on top in White or Pastel colors.
- **Shadows:** Use a very soft, diffused shadow (Blur: 20px, Spread: -4px, Opacity: 6% of the primary text color) to make cards feel like they are floating gently on a cushion.
- **Interactive Depth:** When pressed, elements should visually "sink" (shadow decreases) to mimic a tactile, squishy physical response.

## Shapes
The shape language is defined by **Pill-shaped** and extremely rounded forms. 
- **Cards:** Use a minimum radius of 24px (rounded-lg) to 32px (rounded-xl).
- **Buttons:** Fully rounded/pill-shaped ends are preferred for all primary actions.
- **Icons:** Use icons with rounded caps and corners. Avoid sharp angles or staccato lines.

## Components
- **Primary Buttons:** High-contrast pill shapes using the Primary Green or Blue. Label text is always SemiBold.
- **Health Cards:** Large containers with 24px corner radius. They should use a subtle colored background (e.g., Pastel Blue) to categorize logs (Sleep, Nutrition, etc.).
- **Log Inputs:** Field containers should be filled (Light Beige) rather than just outlined, with 16px rounded corners to feel "thick" and easy to tap.
- **Status Badges:** Small pill-shaped chips with low-opacity background tints (e.g., 20% opacity of the accent color) and darker text for accessibility.
- **Family Switcher:** A horizontal scroll of circular avatars with a 4px soft border for the active member.
- **Progress Bars:** Thick (12px+) with fully rounded ends, using the Primary Green to show completion of daily vitamins or hydration goals.
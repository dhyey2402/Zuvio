# Zuvio - UI/UX & Brand Design System

## 1. Brand Identity
* **Name:** Zuvio
* **Brand Concept:** "The Digital Vault." Themes of flow, movement, organized space, and cloud connectivity. 
* **Vibe:** Sophisticated, futuristic but practical, premium, spacious, friendly, trustworthy.
* **Logo Direction:** A minimal, scalable geometric mark that represents file pathways or a secured network node, staying away from generic boxes or checkmarks.

## 2. Design Principles
* **Strong Visual Hierarchy:** Use scale and contrast to guide the user's eye (e.g., primary actions are distinct, metadata is subdued).
* **Generous Whitespace:** Elements should feel like they have room to breathe, reducing cognitive load.
* **Typography:** Modern, clean sans-serif (e.g., Inter, Geist, or Outfit) with distinct weights.
* **Depth & Subtlety:** Avoid excessive shadows and heavy borders. Use subtle 1px refined borders (`1px solid rgba(...)`) and minimal soft shadows for floating elements like context menus.
* **Motion:** Purposeful micro-interactions. Button clicks, file row hovers, and modal openings should feel snappy yet smooth (e.g., 150-200ms transitions).

## 3. UI Component System
* **App Shell:** Persistent left sidebar for primary navigation (My Files, Shared, Starred, Trash). Top bar for global search and user profile.
* **Colors:**
  * *Primary:* Deep Indigo or vibrant Electric Blue (to denote trust and modernity).
  * *Background:* Off-white (e.g., `#F8F9FA`) for light mode, deep charcoal (e.g., `#121212`) for dark mode.
  * *Surface:* Pure white (or `#1E1E1E` in dark mode) for file cards and modals.
* **File/Folder Representation:**
  * *List View:* Clean horizontal rows with clear icons, filename, size, and date modified. Hover reveals quick actions (Share, Star, Context Menu).
  * *Grid View:* Well-proportioned cards prioritizing previews (for Phase 2) or clean typography.
* **Feedback States:**
  * *Empty States:* Beautifully illustrated or nicely typeset messages (e.g., "This folder is feeling a little empty").
  * *Loading:* Subtle pulse skeletons rather than blocking spinners.
  * *Toasts:* Unobtrusive slide-in notifications for actions like "File uploaded" or "Link copied".

## 4. Anti-Patterns (What NOT to do)
* Do not use plain generic Tailwind colors without customizing them to a cohesive palette.
* Do not overuse glassmorphism or overly decorative animations. Every element must serve usability.
* Do not make the interface feel cramped like a standard admin dashboard.

---
name: real-estate-interactive-visualizer
description: Develop or repair building, section, floor and apartment selection, including SVG geometry, accessible interaction and deep links.
---

Act as Interactive Real Estate Visualization Engineer. Preserve Building → Section → Floor → Apartment and the existing routing system. In this project published plans are variants, not verified units; retain the schematic disclaimer until real geometry is supplied.

Reuse the existing geometry/UX guidance in ../../../.antigravity/skills/svg-coordinate-expert.md and ../../../.antigravity/skills/interactive-canvas-ux.md (resolve from repository root if needed). Store polygonPoints in stable source coordinates and scale with SVG viewBox, never current CSS image dimensions. Background pointer-events: none; interactive polygons pointer-events: visiblePainted. Keep hover separate from selection and isolate it from full-floor React renders. Use Floating UI or an existing positioning solution for tooltips. Compute area-weighted polygon centroids; for concave polygons verify the label remains inside and use an interior anchor when necessary. Unit-test geometry, including reversed winding and degenerate shapes.

Support mouse, touch and keyboard across desktop/tablet/mobile. Preserve building/section/floor/apartment deep links; the current single building is Shattyq. Test direct load, reload and history, focus, hover, selection and status labels. Do not replace the current HTML schematic with invented SVG polygons.

# Implementation Plan

- [ ] 1. Update CSS custom properties with new blue-teal gradient system
  - Replace existing purple gradient variables in global.css with new blue-teal gradient definitions
  - Add theme-aware gradient variations for both light and dark modes
  - Create utility classes for common gradient applications
  - _Requirements: 1.1, 1.2, 4.1, 4.2_

- [ ] 2. Update Header component gradient usage
  - Replace inline purple gradient style with new blue-teal gradient in Header.astro
  - Apply the new gradient to the Pastoralist logo text
  - Test gradient appearance in both light and dark themes
  - _Requirements: 2.1, 1.3_

- [ ] 3. Update Hero component gradient elements
  - Replace inline purple gradient styles in Hero.astro with new blue-teal gradients
  - Update highlighted text spans to use new gradient colors
  - Update CTA button background to use new gradient
  - Update decorative background gradients to use lighter blue-teal variant
  - _Requirements: 2.2, 2.3, 1.1_

- [ ] 4. Update CodeBlock component gradient styling
  - Replace inline purple gradient in CodeBlock.astro with new blue-teal gradient
  - Update highlighted "Seamlessly" text to use new gradient
  - Update "Get Started" button background to use new gradient
  - _Requirements: 2.2, 2.3, 1.1_

- [ ] 5. Update Integration component gradient elements
  - Replace inline purple gradient in Integration.astro with new blue-teal gradient
  - Update "Package Managers" highlighted text to use new gradient
  - Update "Get started" button background to use new gradient
  - _Requirements: 2.2, 2.3, 1.1_

- [ ] 6. Update Install component gradient styling
  - Replace inline purple gradient in Install.astro with new blue-teal gradient
  - Update "Pastoralist" highlighted text to use new gradient
  - Update "Setup guide" button background to use new gradient
  - _Requirements: 2.2, 2.3, 1.1_

- [ ] 7. Update SpotlightCodeBlock component gradient effect
  - Modify the radial gradient colors in SpotlightCodeBlock.tsx to use blue-teal palette
  - Update the spotlight effect to use appropriate blue-teal colors with proper opacity
  - Ensure the animation and timing remain unchanged
  - _Requirements: 2.4, 1.1_

- [ ] 8. Update Sidebar component gradient styling
  - Replace inline purple gradient in SideBar.astro with new blue-teal gradient
  - Update Pastoralist logo text to use new gradient
  - _Requirements: 2.1, 1.1_

- [ ] 9. Create comprehensive test suite for gradient changes
  - Write automated tests to verify all purple gradients have been replaced
  - Create visual regression tests for gradient appearance
  - Test gradient contrast ratios for accessibility compliance
  - Verify gradient functionality across different browsers and devices
  - _Requirements: 1.2, 1.3, 3.3, 3.4_

- [ ] 10. Optimize and refactor gradient implementation
  - Replace remaining inline gradient styles with CSS utility classes where possible
  - Ensure consistent gradient application across all components
  - Add fallback colors for browsers that don't support gradients
  - Document the new gradient system for future maintenance
  - _Requirements: 4.3, 4.4, 3.1, 3.2_
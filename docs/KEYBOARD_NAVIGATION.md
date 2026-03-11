# Keyboard Navigation Guide

HelpBridge is designed to be fully navigable via keyboard, adhering to WCAG 2.1 Level AA standards.

## Basic Navigation

- **Tab**: Move to the next interactive element (link, button, form field).
- **Shift + Tab**: Move to the previous interactive element.
- **Enter**: Activate a link or button.
- **Space**: Toggle checkboxes or activate buttons.
- **Esc**: Close modals, dialogs, or mobile menus.
- **Arrow Keys**:
  - Navigate within radio groups.
  - Scroll through long content.
  - Navigate search suggestions (if applicable).

## Specialized Features

### Skip to Main Content

When you first land on a page and press **Tab**, the first focusable element is the **"Skip to main content"** link. Pressing **Enter** while focused on this link will jump your focus directly to the primary content area, bypassing the header and navigation menu.

### Focus Indicators

Every interactive element has a visible, high-contrast focus indicator (a colored ring or outline) when navigated via keyboard. If you ever lose track of your focus position, press **Tab** or **Shift + Tab** to relocate yourself.

### Modals & Dialogs

When a modal (like the Emergency Modal or Feedback Modal) opens:

1. Focus is automatically trapped within the modal.
2. You cannot Tab out of the modal to the background content.
3. Pressing **Esc** or activating the **Close** button will return focus to the element that originally triggered the modal.

## Developer Guidelines

To maintain keyboard accessibility:

1. **Never suppress focus indicators**: Do not use `outline: none` without providing a high-contrast `focus-visible` alternative.
2. **Use Semantic HTML**: Use `<button>` for actions and `<a>` for navigation. Avoid using `onClick` on `<div>` or `<span>`.
3. **Logical Tab Order**: Ensure the DOM order matches the visual layout to keep the Tab sequence predictable.
4. **ARIA Landmarks**: Use `<header>`, `<main>`, `<nav>`, and `<footer>` correctly to help screen reader users navigate regions.

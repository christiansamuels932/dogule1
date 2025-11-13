# Shared UI Components

This directory contains reusable UI building blocks used across Dogule1 modules. Each component exposes:

- A template snippet in `templates.html`.
- Companion styles in `components.css`.
- Optional JS helpers in `components.js`.

Import the CSS via `@import "./components/components.css";` inside `modules/shared/shared.css`, and load templates/JS as needed per module.

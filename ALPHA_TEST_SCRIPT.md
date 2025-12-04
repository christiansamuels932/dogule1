# Alpha Test Script — Skeleton (Station 38)

## Pre-Run State

### Seed reset

### Expected clean DB

### Browser storage clearing

### Deterministic starting conditions

## Pre-Run Command Sequence

### Install

### integrityCheck

### Lint

### Vitest

### Build

### Dev

## Global Navigation Expectations

### Menu order

### Active-state highlighting

### Hash correctness

### Router behavior

### Global back/forward expectations

## Global Console Expectations

- Every route must have zero console errors or warnings except the known "type": "module" ESM warning.

## Module Tests

### Dashboard

#### Phase-A checklist items

#### Required linking validations

#### Per-module Console Checks

#### Per-module back/forward checks

#### Shared-component expectations

### Kunden

#### Phase-A checklist items

#### Required linking validations

#### Per-module Console Checks

#### Per-module back/forward checks

#### Shared-component expectations

### Hunde

#### Phase-A checklist items

#### Required linking validations

#### Per-module Console Checks

#### Per-module back/forward checks

#### Shared-component expectations

### Kurse

#### Phase-A checklist items

#### Required linking validations

#### Per-module Console Checks

#### Per-module back/forward checks

#### Shared-component expectations

### Trainer

#### Phase-A checklist items

#### Required linking validations

#### Per-module Console Checks

#### Per-module back/forward checks

#### Shared-component expectations

### Kalender

#### Phase-A checklist items

#### Required linking validations

#### Per-module Console Checks

#### Per-module back/forward checks

#### Shared-component expectations

### Finanzen

#### Phase-A checklist items

#### Required linking validations

#### Per-module Console Checks

#### Per-module back/forward checks

#### Shared-component expectations

### Waren

#### Phase-A checklist items

#### Required linking validations

#### Per-module Console Checks

#### Per-module back/forward checks

#### Shared-component expectations

### Kommunikation

#### Phase-A checklist items

#### Required linking validations

#### Per-module Console Checks

#### Per-module back/forward checks

#### Shared-component expectations

## Negative Tests

### Waren not creating Finanzen entries

### Kurse not creating Finanzen revenue

## Data Model and Cleanup Policy

### Seed-only vs inline deterministic data vs hybrid

### Cleanup timing (end vs per module)

## Branch and Commit Lock

- Branch: feature/station35-trainer-finanzen
- Commit: d41cd5a

## Appendix

- Known warning: package.json missing "type": "module" Node warning.

# OPS-SPRINT-001 — Development Operations Visibility

Status: Authorized — implementation may begin; development preview only.

Owner: Responsable del Proyecto

## Goal

Provide narrowly scoped, private and reversible visibility into the deployed
development environment without granting write access or expanding the product.

## Scope

- PBI-OPS-001 read-only development server explorer.
- Curated release metadata and compiled, non-sensitive release files.
- Security, isolation, resource, network and removal evidence.

## Exclusions

Production, application users, PostgreSQL administration, product backlog
PBI-024–029, R1, write access and direct exposure of server roots are excluded.

## Exit criteria

PBI-OPS-001 satisfies its binary acceptance criteria, remains removable, has a
Draft PR against the preview branch, and leaves the main preview healthy.

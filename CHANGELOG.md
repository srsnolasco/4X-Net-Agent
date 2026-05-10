# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and versioning follows [SemVer](https://semver.org/spec/v2.0.0.html).

> Entry types: **Added** (new), **Changed** (non-breaking change),
> **Deprecated** (soon to be removed), **Removed**, **Fixed** (bug fix),
> **Security** (vulnerability).

---

## [Unreleased]

Changes on `main` not yet released under a tag.

### Changed — 2026-05-10 19:33

- **PT Bridge status badge:** header now shows real-time connectivity between
  the MCP server and Cisco Packet Tracer, polling `pt_bridge_status` every 30s.
- **Topology auto-refresh:** added an Auto toggle (15s interval) and a manual
  Refresh button directly in the topology card header.
- **Device type icons:** the Equipamentos table now displays an icon per row
  based on the device model (🔷 router, 🔀 switch, 💻 PC/laptop, 📞 VoIP, 📶 AP).
- **Expanded AI agent tools:** natural-language agent now exposes 15 MCP tools
  (was 8), adding `pt_run_cli_bulk`, `pt_ping`, `pt_traceroute`, `pt_save_pkt`,
  `pt_show_running`, and `pt_inspect_ports`.

### Fixed — 2026-05-10 19:33

- **Duplicate memory settings modal:** `showMemorySettings` was rendered twice
  simultaneously; removed the redundant instance.

  > A atualização do MCP server pelo Claude para permitir acessos simultâneos
  > do app e do terminal.

---

## [0.1.0] — 2026-05-01

Initial release of the PT Command Center dashboard.

### Added

- React 19 + TypeScript + Vite dashboard connecting to packet-tracer-mcp via
  HTTP on port 39001.
- Natural language agent powered by OpenAI, with 8 MCP tools.
- Topology map with device and link tables.
- Direct CLI command execution panel.
- Terminal output log with color-coded entries.

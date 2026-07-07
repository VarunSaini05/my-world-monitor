# Varun World Monitor

**Varun World Monitor** is a customised self-hosted fork of the upstream **World Monitor** project, maintained by **Varun Saini**.

[![GitHub stars](https://img.shields.io/github/stars/VarunSaini05/my-world-monitor?style=social)](https://github.com/VarunSaini05/my-world-monitor/stargazers)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Last commit](https://img.shields.io/github/last-commit/VarunSaini05/my-world-monitor)](https://github.com/VarunSaini05/my-world-monitor/commits/main)

<p align="center">
  <a href="https://varun-world-monitor.onrender.com"><img src="https://img.shields.io/badge/Live_App-varun--world--monitor.onrender.com-blue?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live App"></a>&nbsp;
  <a href="https://github.com/VarunSaini05/my-world-monitor"><img src="https://img.shields.io/badge/Source-VarunSaini05%2Fmy--world--monitor-24292f?style=for-the-badge&logo=github&logoColor=white" alt="Source"></a>
</p>

Live deployment: <https://varun-world-monitor.onrender.com>  
Repository: <https://github.com/VarunSaini05/my-world-monitor>  
Owner / maintainer: **Varun Saini** — <https://github.com/VarunSaini05>

## What this fork changes

- Adds self-hosted owner mode for a deployment operated by the maintainer.
- Runs on a single Render free-plan Docker web service.
- Preserves the working nginx `dashboard.html` entry fix.
- Adds keyless live fallbacks for USGS earthquakes and NASA EONET natural events.
- Adds a bundled local REST cache and lightweight public-source seed loop for Docker self-hosting when no external Upstash Redis is configured.
- Rebrands the visible customised application as **Varun World Monitor**.

This fork does **not** bypass paid third-party providers. If a data provider requires a credential, relay, proxy, or paid account, the app should show unavailable/degraded state honestly until that source is configured.

## Quick start

```bash
git clone https://github.com/VarunSaini05/my-world-monitor.git
cd my-world-monitor
npm install
npm run dev
```

For Docker/self-hosting details, see [SELF_HOSTING.md](SELF_HOSTING.md).

## Render deployment notes

The root `Dockerfile` is used. In the absence of `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, the Docker image starts a local Upstash-compatible cache inside the same container and runs lightweight refresh jobs for public/keyless sources.

Recommended Render environment:

```env
SELF_HOSTED_FULL_ACCESS=true
VITE_SELF_HOSTED_FULL_ACCESS=true
LOCAL_API_MODE=docker
LOCAL_API_CLOUD_FALLBACK=false
```

Optional source credentials can be added later for richer data coverage, for example AIS/OpenSky/LLM provider keys.

## Tech stack

| Category | Technologies |
| --- | --- |
| Frontend | TypeScript, Vite, globe.gl, deck.gl, MapLibre GL |
| API | Local Node sidecar serving Vercel-style API handlers |
| Deployment | Docker on Render free plan for this fork |
| Caching | Bundled local self-host cache by default; optional Upstash Redis |
| License | AGPL-3.0-only |

## Data-source honesty

Varun World Monitor can display public/keyless feeds such as USGS earthquakes, NASA EONET events, and selected GDELT-based intelligence data. Sources that require credentials, relays, proxies, external Redis, or upstream paid access remain unavailable/degraded unless configured.

## License and attribution

This repository is a customised fork of the upstream **World Monitor** project.

Original upstream project: **World Monitor** by **Elie Habib** — <https://github.com/koala73/worldmonitor>

Customised self-hosted fork: **Varun World Monitor** maintained by **Varun Saini** — <https://github.com/VarunSaini05>

The upstream project is licensed **AGPL-3.0-only**. This fork retains the same licence terms. See [LICENSE](LICENSE) for the full licence text.

Copyright (C) 2024-2026 Elie Habib. All rights reserved.

This README does not claim that Varun Saini authored the original upstream World Monitor code.

## Security acknowledgments

Security acknowledgments from the upstream project are preserved where applicable. See [SECURITY.md](SECURITY.md) for responsible disclosure guidance.

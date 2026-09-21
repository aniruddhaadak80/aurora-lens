# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅        |

## Reporting a vulnerability

Open a **private** report via GitHub Security Advisories on this repo, or email the
maintainer through the profile at <https://github.com/aniruddhaadak80>.
Please include steps to reproduce and the affected endpoint.

We aim to acknowledge within 48 hours and ship a fix within 7 days for
confirmed issues.

## Scope notes

- AuroraLens has no auth, no database and no user data — the attack surface is
  the Next.js front end plus read-only public-feed proxies.
- The `/api/*` routes only fetch upstream NOAA/USGS data and compute scores;
  they never execute user-supplied code.
- Do not probe upstream NOAA/USGS endpoints aggressively through this project;
  respect their fair-use policies.

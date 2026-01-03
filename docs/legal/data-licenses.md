# Third-Party Data License Inventory

**Date**: January 2026
**Purpose**: Compliance with third-party data usage terms and attribution requirements.

## 1. Data Sources

| Source            | License                                        | Attribution Required | Attribution Location | Notes                                 |
| :---------------- | :--------------------------------------------- | :------------------- | :------------------- | :------------------------------------ |
| **OpenStreetMap** | ODbL (Open Data Commons Open Database License) | **Yes**              | Map Component Footer | Used for map tiles via Leaflet/Mapbox |
| **Lucide Icons**  | ISC License                                    | No                   | N/A                  | Open source icon library              |
| **Outfit Font**   | OFL (Open Font License)                        | No                   | N/A                  | Google Fonts                          |
| **Inter Font**    | OFL (Open Font License)                        | No                   | N/A                  | Google Fonts                          |

## 2. Attribution Statements

### OpenStreetMap (Map Usage)

> "© OpenStreetMap contributors"

### Crisis Line Data

> "Crisis line numbers are public information verified against official organization websites."

## 3. License Compliance Actions

### A. ODbL (OpenStreetMap)

- **Requirement**: "You must attribute OpenStreetMap and its contributors."
- **Implementation**: The map component automatically includes the copyright link in the bottom-right corner.
- **Requirement**: "If you alter or build upon the data, you may distribute the result only under the same licence."
- **Status**: We do not currently alter the map data tiles; we only overlay our own points of interest (markers), which is permitted.

### B. ISC / MIT Licenses (Code Libraries)

- **Requirement**: Include copyright notice in source code.
- **Implementation**: License files are maintained in `node_modules` and the repository root.

## 4. Pending Reviews

- [ ] Confirm license terms for City of Kingston Open Data (if imported in future).
- [ ] Review 211 Ontario data sharing agreement (if integration proceeds).

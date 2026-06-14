#!/usr/bin/env python3
"""Convert izhs.csv and snt.csv into data.json for the land price dashboard."""

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent

MONTHS_SHORT = [
    "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
    "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
]
MONTHS_FULL = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
]

DATE_COLUMNS = [
    "01.01.2025", "01.02.2025", "01.03.2025", "01.04.2025",
    "01.05.2025", "01.06.2025", "01.07.2025", "01.08.2025",
    "01.09.2025", "01.10.2025", "01.11.2025", "01.12.2025",
    "01.01.2026", "01.02.2026", "01.03.2026", "01.04.2026",
]


def parse_number(value: str) -> int | None:
    cleaned = re.sub(r"\s+", "", value.strip())
    if not cleaned:
        return None
    return int(cleaned)


def load_csv(path: Path) -> dict[str, list[int | None]]:
    data: dict[str, list[int | None]] = {}
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            region = row["region"].strip()
            values = [parse_number(row[col]) for col in DATE_COLUMNS]
            data[region] = values
    return data


def build_month_labels() -> dict:
    short_labels = []
    full_labels = []
    for date in DATE_COLUMNS:
        _, month, year = date.split(".")
        month_idx = int(month) - 1
        short_labels.append(f"{MONTHS_SHORT[month_idx]} {year[2:]}")
        full_labels.append(f"{MONTHS_FULL[month_idx]} {year}")
    return {
        "short": short_labels,
        "full": full_labels,
        "xIndices": [0, 6, 12, 15],
    }


def main() -> None:
    izhs = load_csv(ROOT / "izhs.csv")
    snt = load_csv(ROOT / "snt.csv")

    all_regions = sorted(set(izhs) | set(snt))

    regions = []
    for name in all_regions:
        izhs_values = izhs.get(name, [None] * len(DATE_COLUMNS))
        snt_values = snt.get(name, [None] * len(DATE_COLUMNS))
        regions.append({
            "name": name,
            "izhs": izhs_values,
            "snt": snt_values,
        })

    output = {
        "months": build_month_labels(),
        "regions": regions,
    }

    out_path = ROOT / "data.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Written {len(regions)} regions to {out_path}")


if __name__ == "__main__":
    main()

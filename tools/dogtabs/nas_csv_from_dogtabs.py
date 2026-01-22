#!/usr/bin/env python3
import csv
import json
import re
import subprocess
import sys
import time
import random
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict, Optional

ROOT = Path(__file__).resolve().parents[2]
ATTACHMENTS = ROOT / "attachments"
DATA_DIR = ROOT / "data" / "DogTabs Data"

KUNDEN_TSV = ATTACHMENTS / "kunden.tsv"
HUNDE_TSV = ATTACHMENTS / "hunde.tsv"
XLS_PATH = DATA_DIR / "Kundenliste_2026-01-15 17-30.xls"
PDF_PATH = DATA_DIR / "rpt_sel_kundenliste.pdf"

OUT_KUNDEN_CSV = ATTACHMENTS / "nas_kunden.csv"
OUT_HUNDE_CSV = ATTACHMENTS / "nas_hunde.csv"
OUT_REPORT = ATTACHMENTS / "nas_merge_report.json"

CUSTOMER_COLUMNS = [
    "id",
    "code",
    "vorname",
    "nachname",
    "geburtsdatum",
    "email",
    "telefon",
    "adresse",
    "status",
    "ausweis_id",
    "foto_url",
    "begleitpersonen",
    "notizen",
    "created_at",
    "updated_at",
    "schema_version",
    "version",
    "legacy_id",
    "geschlecht",
]

DOG_COLUMNS = [
    "id",
    "code",
    "name",
    "rufname",
    "rasse",
    "geschlecht",
    "geburtsdatum",
    "gewicht_kg",
    "groesse_cm",
    "kunden_id",
    "trainingsziele",
    "notizen",
    "felltyp",
    "kastriert",
    "fellfarbe",
    "groesse_typ",
    "herkunft",
    "chip_nummer",
    "created_at",
    "updated_at",
    "schema_version",
    "version",
    "status",
]

MANUAL_OWNER_MATCHES = {
    "almeira / rodrigues sara / ale 5415 nussbaumen ag": "wiesenweg 21\n5415 nussbaumen ag",
    "almeira / rodrigues sara / ale": "wiesenweg 21\n5415 nussbaumen ag",
    "binzegger charly (verstorben) 5330 bad zurzach": "breitenstr.  205330 bad zurzach",
    "binzegger charly (verstorben)": "breitenstr.  205330 bad zurzach",
    "de pasquale christina": [
        "iffluhstrasse 1a\n5301 siggenthal station",
        "breitestrasse  2\n5425 schneisingen",
    ],
    "fellmann brigitte": ["reinerstrasse 242\n5235 rüfenach ag", ""],
    "fontana richard": "vorhard  7\n5312 döttingen",
    "knecht heidi": [
        "surbtalstrasse  3\n5312 döttingen",
        "schützenhausstrasse 7\n5312 döttingen",
    ],
    "knecht thomas": [
        "schwändiweg 29\n5313 klingnau",
        "baslerstrasse 46\n4310 bad zurzach",
    ],
    "meier andreas": [
        "kronengasse 5\n5400 baden",
        "höngerstr.  23\n5313 klingnau",
    ],
    "mohr alessia": [
        "buchenweg 3\n5235 rüfenach ag",
        "breitacker 25\n5210 windisch",
    ],
    "wäspi hans rudolf (verstorben) 5079 zeihen": "burri 3\n5079 zeihen",
    "wäspi hans rudolf (verstorbe 5079 zeihen": "burri 3\n5079 zeihen",
    "wäspi hans rudolf (verstorben)": "burri 3\n5079 zeihen",
    "wäspi hans rudolf (verstorbe": "burri 3\n5079 zeihen",
    "wettstein sabrina": [
        "klausenweg 7a\n5103 möriken ag",
        "klausenweg 7 a\n5103 möriken",
    ],
}

PHONE_RE = re.compile(r"^\+?[0-9][0-9\s/.-]{5,}$")
DATE_RE = re.compile(r"^[NJ]\s*(\d{2})\.(\d{2})\.(\d{2})")
CHIP_RE = re.compile(r"^ChipNr:\s*(.+)$")
INDEX_RE = re.compile(r"^\d{1,4}$")
MAX_PDF_INDEX = 1500


def now_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())


def uuid_v7():
    ts_ms = int(time.time() * 1000) & ((1 << 48) - 1)
    rand_a = random.getrandbits(12)
    rand_b = random.getrandbits(62)
    ts_bytes = ts_ms.to_bytes(6, "big")
    rand_a_bytes = rand_a.to_bytes(2, "big")
    rand_a_bytes = bytes([(rand_a_bytes[0] & 0x0F) | 0x70, rand_a_bytes[1]])
    rand_b_bytes = rand_b.to_bytes(8, "big")
    rand_b_bytes = bytes([(rand_b_bytes[0] & 0x3F) | 0x80]) + rand_b_bytes[1:]
    raw = ts_bytes + rand_a_bytes + rand_b_bytes
    hexed = raw.hex()
    return "-".join([hexed[0:8], hexed[8:12], hexed[12:16], hexed[16:20], hexed[20:32]])


def norm(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def norm_address(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def norm_name(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.strip().lower()).strip()


def normalize_phone(text: str) -> str:
    raw = text.strip()
    if not raw:
        return ""
    return re.sub(r"[\s/.-]+", "", raw)


def parse_tsv(path: Path, expected_cols: List[str]) -> List[Dict[str, str]]:
    with path.open("r", encoding="utf-8") as f:
        header = f.readline().rstrip("\n")
        headers = header.split("\t")
        if headers != expected_cols:
            raise RuntimeError(f"Unexpected header in {path}: {headers}")
        rows = []
        buffer = ""
        for line in f:
            line = line.rstrip("\n")
            buffer = f"{buffer}\n{line}" if buffer else line
            parts = buffer.split("\t")
            if len(parts) < len(headers):
                continue
            if len(parts) > len(headers):
                parts = parts[: len(headers) - 1] + ["\t".join(parts[len(headers) - 1 :])]
            row = {headers[i]: ("" if parts[i] == "NULL" else parts[i]) for i in range(len(headers))}
            rows.append(row)
            buffer = ""
        if buffer:
            parts = buffer.split("\t")
            if len(parts) < len(headers):
                parts += [""] * (len(headers) - len(parts))
            if len(parts) > len(headers):
                parts = parts[: len(headers) - 1] + ["\t".join(parts[len(headers) - 1 :])]
            row = {headers[i]: ("" if parts[i] == "NULL" else parts[i]) for i in range(len(headers))}
            rows.append(row)
    return rows


def parse_xls_customers(path: Path):
    try:
        import xlrd
    except ImportError as exc:
        raise RuntimeError("xlrd not installed in this environment") from exc

    book = xlrd.open_workbook(path)
    sheet = book.sheet_by_index(0)
    headers = [str(sheet.cell_value(0, c)).strip() for c in range(sheet.ncols)]

    def cell_value(row, key):
        if key in headers:
            return sheet.cell_value(row, headers.index(key))
        key_lower = key.lower()
        for idx, header in enumerate(headers):
            if header.lower() == key_lower:
                return sheet.cell_value(row, idx)
        return ""

    customers = []
    for r in range(1, sheet.nrows):
        raw_name = str(cell_value(r, "name")).strip()
        raw_vorname = str(cell_value(r, "vorname")).strip()
        if not raw_name and not raw_vorname:
            continue
        status = str(cell_value(r, "status")).strip().lower()
        email = str(cell_value(r, "email")).strip()
        telefon = (
            str(cell_value(r, "telefon_natel")).strip()
            or str(cell_value(r, "telefon_privat")).strip()
            or str(cell_value(r, "telefon_geschaeft")).strip()
        )
        plz = str(cell_value(r, "adr_plz")).strip()
        ort = str(cell_value(r, "adr_ort")).strip()
        address_parts = [
            str(cell_value(r, "adr_strasse")).strip(),
            str(cell_value(r, "adr_zusatz1")).strip(),
            str(cell_value(r, "adr_zusatz2")).strip(),
        ]
        city_line = " ".join([part for part in [plz, ort] if part]).strip()
        if city_line:
            address_parts.append(city_line)
        address = "\n".join([part for part in address_parts if part])

        geb_raw = cell_value(r, "geburtsdatum")
        geburtsdatum = ""
        if isinstance(geb_raw, (float, int)) and geb_raw:
            try:
                dt = xlrd.xldate_as_datetime(geb_raw, book.datemode)
                geburtsdatum = dt.strftime("%Y-%m-%d")
            except Exception:
                geburtsdatum = ""
        else:
            geburtsdatum = str(geb_raw).strip()

        customers.append(
            {
                "vorname": raw_vorname,
                "nachname": raw_name,
                "status": status,
                "email": email,
                "telefon": telefon,
                "adresse": address,
                "geburtsdatum": geburtsdatum,
                "ausweis_id": str(cell_value(r, "kd_ausweis_ID")).strip(),
                "notizen": str(cell_value(r, "bemerkung")).strip(),
            }
        )
    return customers


@dataclass
class DogEntry:
    name: str = ""
    breed: str = ""
    sex: str = ""
    birth: str = ""
    chip: str = ""


@dataclass
class PdfCustomer:
    index: str
    name: str
    address_lines: List[str] = field(default_factory=list)
    dogs: List[DogEntry] = field(default_factory=list)



def parse_pdf_customers(path: Path):
    raw = subprocess.check_output(["pdftotext", "-layout", str(path), "-"]).decode(
        "utf-8", errors="ignore"
    )
    lines = raw.splitlines()

    def skip_line(line: str) -> bool:
        stripped = line.strip()
        if not stripped:
            return True
        if stripped.startswith("Kundenliste sortiert nach"):
            return True
        if stripped.startswith("Seite "):
            return True
        if stripped.startswith("Donnerstag,"):
            return True
        if "-- www.fontanas-dogworld.ch" in line:
            return True
        if "Telefon / Natel / eMail" in line and "Hund / Rasse" in line:
            return True
        return False

    customers: List[PdfCustomer] = []
    current: Optional[PdfCustomer] = None
    current_dog: Optional[DogEntry] = None
    seen_dog_section = False

    def looks_like_address(token: str) -> bool:
        return bool(re.search(r"\d", token)) or token.lower().endswith(
            ("strasse", "str.", "weg", "gasse", "platz", "allee")
        )

    for line in lines:
        if skip_line(line):
            continue

        tokens = re.split(r"\s{2,}", line.strip())
        if not tokens or tokens == [""]:
            continue

        if (
            tokens[0].isdigit()
            and len(tokens) >= 2
            and len(tokens[0]) <= 4
            and int(tokens[0]) <= MAX_PDF_INDEX
        ):
            if current:
                if current_dog and current_dog.name:
                    current.dogs.append(current_dog)
                customers.append(current)
            name_token = tokens[1]
            name_match = re.split(r"\b\d{4}\b", name_token, maxsplit=1)
            if name_match and name_match[0].strip():
                name_token = name_match[0].strip()
            current = PdfCustomer(index=tokens[0], name=name_token)
            current_dog = None
            seen_dog_section = False
            tokens = tokens[2:]
        if current is None:
            continue

        content_tokens = []
        for token in tokens:
            if not token:
                continue
            if "@" in token:
                continue
            if PHONE_RE.match(token):
                continue
            content_tokens.append(token)

        sex_idx = next((i for i, tok in enumerate(content_tokens) if tok in {"M", "W", "X"}), None)
        date_tok = next((tok for tok in content_tokens if DATE_RE.match(tok)), None)
        chip_tok = next((tok for tok in content_tokens if tok.startswith("ChipNr:")), None)

        if sex_idx is not None:
            name_token = None
            for j in range(sex_idx - 1, -1, -1):
                candidate = content_tokens[j]
                if candidate in {"M", "W", "X"}:
                    continue
                if DATE_RE.match(candidate):
                    continue
                if candidate.startswith("ChipNr:"):
                    continue
                name_token = candidate
                for addr_token in content_tokens[:j]:
                    if looks_like_address(addr_token):
                        current.address_lines.append(addr_token)
                break

            if name_token:
                if current_dog and current_dog.name:
                    current.dogs.append(current_dog)
                current_dog = DogEntry(name=name_token)
                current_dog.sex = content_tokens[sex_idx]
                if date_tok:
                    dd, mm, yy = DATE_RE.match(date_tok).groups()
                    year = int(yy)
                    year += 2000 if year < 50 else 1900
                    current_dog.birth = f"{year:04d}-{int(mm):02d}-{int(dd):02d}"
                if chip_tok:
                    current_dog.chip = chip_tok.replace("ChipNr:", "").strip()
                seen_dog_section = True
            continue

        if chip_tok and current_dog:
            current_dog.chip = chip_tok.replace("ChipNr:", "").strip()
            seen_dog_section = True
            continue

        if date_tok and current_dog:
            dd, mm, yy = DATE_RE.match(date_tok).groups()
            year = int(yy)
            year += 2000 if year < 50 else 1900
            current_dog.birth = f"{year:04d}-{int(mm):02d}-{int(dd):02d}"
            seen_dog_section = True
            continue

        if not seen_dog_section:
            for token in content_tokens:
                if looks_like_address(token):
                    current.address_lines.append(token)
            continue

        if seen_dog_section and current_dog:
            for token in content_tokens:
                if looks_like_address(token):
                    continue
                if not current_dog.breed:
                    current_dog.breed = token
                    break

    if current:
        if current_dog and current_dog.name:
            current.dogs.append(current_dog)
        customers.append(current)

    return customers


def main():
    kunden = parse_tsv(KUNDEN_TSV, CUSTOMER_COLUMNS)
    hunde = parse_tsv(HUNDE_TSV, DOG_COLUMNS)
    xls_customers = parse_xls_customers(XLS_PATH)
    pdf_customers = parse_pdf_customers(PDF_PATH)

    kunden_by_name = {}
    for row in kunden:
        key = norm_name(f"{row['nachname']} {row['vorname']}")
        kunden_by_name.setdefault(key, []).append(row)

    updated_customers = 0
    unmatched_customers = []
    for row in xls_customers:
        key = norm_name(f"{row['nachname']} {row['vorname']}")
        candidates = kunden_by_name.get(key, [])
        if not candidates:
            unmatched_customers.append(row)
            continue
        if len(candidates) > 1:
            target = None
            addr_key = norm_address(row["adresse"])
            for cand in candidates:
                if norm_address(cand.get("adresse", "")) == addr_key and addr_key:
                    target = cand
                    break
            if target is None:
                unmatched_customers.append(row)
                continue
        else:
            target = candidates[0]
        target["vorname"] = row["vorname"]
        target["nachname"] = row["nachname"]
        target["status"] = row["status"]
        target["email"] = row["email"]
        target["telefon"] = normalize_phone(row["telefon"])
        target["adresse"] = row["adresse"]
        if row["geburtsdatum"]:
            target["geburtsdatum"] = row["geburtsdatum"]
        if row["ausweis_id"]:
            target["ausweis_id"] = row["ausweis_id"]
        if row["notizen"]:
            target["notizen"] = row["notizen"]
        target["updated_at"] = now_iso()
        updated_customers += 1

    new_customers = []
    for row in unmatched_customers:
        new_id = uuid_v7()
        new_customers.append(
            {
                "id": new_id,
                "code": "",
                "vorname": row["vorname"],
                "nachname": row["nachname"],
                "geburtsdatum": row["geburtsdatum"],
                "email": row["email"],
                "telefon": normalize_phone(row["telefon"]),
                "adresse": row["adresse"],
                "status": row["status"],
                "ausweis_id": row["ausweis_id"],
                "foto_url": "",
                "begleitpersonen": "[]",
                "notizen": row["notizen"],
                "created_at": now_iso(),
                "updated_at": now_iso(),
                "schema_version": "1",
                "version": "0",
                "legacy_id": "",
                "geschlecht": "",
            }
        )

    kunden.extend(new_customers)

    kunden_id_by_name = {}
    kunden_by_address = {}
    for row in kunden:
        key = norm_name(f"{row['nachname']} {row['vorname']}")
        kunden_id_by_name.setdefault(key, []).append(row)
        addr_key = norm_address(row.get("adresse", ""))
        if addr_key:
            kunden_by_address.setdefault(addr_key, []).append(row)

    hunde_by_owner = {}
    for row in hunde:
        hunde_by_owner.setdefault(row["kunden_id"], []).append(row)

    updated_dogs = 0
    added_dogs = 0
    unmatched_pdf = []

    def find_owner(customer: PdfCustomer):
        manual_key = norm(customer.name)
        manual_target = MANUAL_OWNER_MATCHES.get(manual_key)
        if manual_target:
            targets = manual_target if isinstance(manual_target, list) else [manual_target]
            for target in targets:
                target_norm = norm_address(target)
                for cand in kunden_by_address.get(target_norm, []):
                    return cand
        key = norm_name(customer.name)
        candidates = kunden_id_by_name.get(key, [])
        if not candidates:
            return None
        if len(candidates) == 1:
            return candidates[0]
        addr_key = norm_address("\n".join(customer.address_lines))
        for cand in candidates:
            if addr_key and norm_address(cand.get("adresse", "")) == addr_key:
                return cand
        return None

    def next_dog_code():
        existing = [h.get("code", "") for h in hunde if h.get("code", "").startswith("DT-")]
        numbers = []
        for code in existing:
            try:
                numbers.append(int(code.replace("DT-", "")))
            except ValueError:
                continue
        return f"DT-{(max(numbers) if numbers else 0) + 1}"

    def is_confident_match(existing, incoming):
        if norm_name(existing.get("name", "")) != norm_name(incoming.name):
            return False
        if incoming.chip and existing.get("chip_nummer"):
            return norm(incoming.chip) == norm(existing.get("chip_nummer", ""))
        if incoming.birth and existing.get("geburtsdatum"):
            return incoming.birth == existing.get("geburtsdatum")
        if incoming.breed and existing.get("rasse"):
            return norm(incoming.breed) == norm(existing.get("rasse", ""))
        return False

    for customer in pdf_customers:
        owner = find_owner(customer)
        if owner is None:
            unmatched_pdf.append({"name": customer.name, "index": customer.index})
            continue
        owner_id = owner["id"]
        owner_dogs = hunde_by_owner.get(owner_id, [])
        for dog in customer.dogs:
            if not dog.name:
                continue
            dog_candidates = [d for d in owner_dogs if norm_name(d.get("name", "")) == norm_name(dog.name)]
            matched = None
            if len(dog_candidates) == 1 and is_confident_match(dog_candidates[0], dog):
                matched = dog_candidates[0]
            elif len(dog_candidates) > 1:
                for cand in dog_candidates:
                    if is_confident_match(cand, dog):
                        matched = cand
                        break
            if matched:
                matched["name"] = dog.name
                if dog.breed:
                    matched["rasse"] = dog.breed
                if dog.sex:
                    matched["geschlecht"] = dog.sex
                if dog.birth:
                    matched["geburtsdatum"] = dog.birth
                if dog.chip:
                    matched["chip_nummer"] = dog.chip
                matched["kunden_id"] = owner_id
                matched["updated_at"] = now_iso()
                updated_dogs += 1
            else:
                new_id = uuid_v7()
                new_code = next_dog_code()
                hunde.append(
                    {
                        "id": new_id,
                        "code": new_code,
                        "name": dog.name,
                        "rufname": "",
                        "rasse": dog.breed,
                        "geschlecht": dog.sex,
                        "geburtsdatum": dog.birth,
                        "gewicht_kg": "",
                        "groesse_cm": "",
                        "kunden_id": owner_id,
                        "trainingsziele": "",
                        "notizen": "",
                        "felltyp": "",
                        "kastriert": "",
                        "fellfarbe": "",
                        "groesse_typ": "",
                        "herkunft": "",
                        "chip_nummer": dog.chip,
                        "created_at": now_iso(),
                        "updated_at": now_iso(),
                        "schema_version": "1",
                        "version": "0",
                        "status": "",
                    }
                )
                added_dogs += 1

    with OUT_KUNDEN_CSV.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CUSTOMER_COLUMNS)
        writer.writeheader()
        for row in kunden:
            writer.writerow({col: row.get(col, "") for col in CUSTOMER_COLUMNS})

    with OUT_HUNDE_CSV.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=DOG_COLUMNS)
        writer.writeheader()
        for row in hunde:
            writer.writerow({col: row.get(col, "") for col in DOG_COLUMNS})

    report = {
        "customers": {
            "nas_count": len(kunden) - len(new_customers),
            "xls_count": len(xls_customers),
            "updated": updated_customers,
            "new": len(new_customers),
            "unmatched": len(unmatched_customers),
        },
        "dogs": {
            "nas_count": len(hunde) - added_dogs,
            "pdf_customers": len(pdf_customers),
            "updated": updated_dogs,
            "new": added_dogs,
            "unmatched_customers": len(unmatched_pdf),
        },
        "unmatched_customers": unmatched_customers[:50],
        "unmatched_pdf_customers": unmatched_pdf[:50],
    }

    OUT_REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Wrote {OUT_KUNDEN_CSV}")
    print(f"Wrote {OUT_HUNDE_CSV}")
    print(f"Wrote {OUT_REPORT}")


if __name__ == "__main__":
    sys.exit(main())

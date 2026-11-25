#!/usr/bin/env python3
"""LED 견적 착지원가(landed cost) 비교 계산기 — 표준 라이브러리만 사용.

견적 CSV를 읽어 공급사별로 화면 면적, ㎡당 단가, 한국 수입 시 CIF 과세가격,
관세, 수입 부가세, 국내 부대비용을 계산하고 ㎡당 착지원가(부가세 제외) 순으로 정렬한다.

사용 예:
  python landed_cost.py quotes.csv --fx USD=1400 --fx CNY=195 --duty-rate 0 \
      --broker-fee 150000 --inland 400000 --format md

관세율·과세환율은 반드시 UNI-PASS에서 조회한 값을 넣는다. 이 스크립트는 기본 관세율을
가정하지 않는다(--duty-rate 필수).
"""
from __future__ import annotations

import argparse
import csv
import sys
from dataclasses import dataclass, field

# 판매자가 주 운송비를 부담하는 조건 / 보험까지 부담하는 조건
FREIGHT_INCLUDED = {"CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"}
INSURANCE_INCLUDED = {"CIF", "CIP", "DAP", "DPU", "DDP"}
KNOWN_TERMS = {"EXW", "FCA", "FAS", "FOB"} | FREIGHT_INCLUDED
SPEC_FIELDS = ("driver_ic", "refresh_hz", "brightness_nits", "warranty_years", "lead_time_days")


@dataclass
class Result:
    vendor: str
    model: str
    pitch: str
    package: str
    area_sqm: float
    currency: str
    goods_foreign: float
    price_per_sqm_foreign: float
    customs_value_krw: float
    duty_krw: float
    vat_krw: float
    local_krw: float
    landed_ex_vat_krw: float
    landed_per_sqm_ex_vat_krw: float
    cash_out_krw: float
    flags: list[str] = field(default_factory=list)


def num(row: dict, key: str, default: float | None = None) -> float | None:
    raw = (row.get(key) or "").strip().replace(",", "")
    if raw == "":
        return default
    try:
        return float(raw)
    except ValueError as exc:
        raise ValueError(f"{row.get('vendor', '?')}: '{key}' 값이 숫자가 아님 → {raw!r}") from exc


def parse_fx(pairs: list[str]) -> dict[str, float]:
    fx = {"KRW": 1.0}
    for pair in pairs:
        if "=" not in pair:
            raise SystemExit(f"--fx 형식 오류: {pair!r} (예: USD=1400)")
        cur, rate = pair.split("=", 1)
        fx[cur.strip().upper()] = float(rate)
    return fx


def compute(row: dict, fx: dict[str, float], args: argparse.Namespace) -> Result:
    flags: list[str] = []
    vendor = (row.get("vendor") or "").strip() or "(이름 없음)"
    currency = (row.get("currency") or "USD").strip().upper()
    if currency not in fx:
        raise SystemExit(f"{vendor}: 통화 {currency} 환율이 없음 → --fx {currency}=... 추가")
    rate = fx[currency]

    w = num(row, "cabinet_w_mm")
    h = num(row, "cabinet_h_mm")
    qty = num(row, "cabinet_qty")
    if not (w and h and qty):
        raise SystemExit(f"{vendor}: cabinet_w_mm, cabinet_h_mm, cabinet_qty는 필수")
    area = w * h * qty / 1_000_000

    basis = (row.get("price_basis") or "").strip().lower()
    price = num(row, "price")
    if price is None:
        raise SystemExit(f"{vendor}: price 누락")
    if basis == "per_cabinet":
        goods = price * qty
    elif basis == "per_sqm":
        goods = price * area
    elif basis == "total":
        goods = price
    else:
        raise SystemExit(f"{vendor}: price_basis는 per_cabinet / per_sqm / total 중 하나")

    term = (row.get("incoterm") or "").strip().upper()
    if term not in KNOWN_TERMS:
        flags.append(f"인코텀즈 '{term or '없음'}' 확인 필요")

    freight = num(row, "freight")
    if term in FREIGHT_INCLUDED:
        if freight:
            flags.append(f"{term}인데 운임이 따로 기재됨 — 중복 여부 확인")
        freight = 0.0
    elif freight is None:
        flags.append("운임 누락 — 0으로 계산됨(착지원가 과소)")
        freight = 0.0

    insurance = num(row, "insurance")
    if term in INSURANCE_INCLUDED:
        insurance = 0.0
    elif insurance is None:
        flags.append("보험료 미기재 — 실제 부보 시 과세가격에 가산")
        insurance = 0.0

    origin = num(row, "origin_costs", 0.0) or 0.0
    if term == "EXW" and origin == 0:
        flags.append("EXW — 중국 내 운송·수출통관비(origin_costs) 확인")

    customs_value_krw = (goods + freight + insurance + origin) * rate

    if term == "DDP":
        duty = vat = 0.0
        flags.append("DDP — 공급사가 한국 수입자인지, 관세·부가세 포함 여부 확인")
    else:
        duty = customs_value_krw * args.duty_rate / 100
        vat = (customs_value_krw + duty) * args.vat_rate / 100

    local = args.broker_fee + args.inland + args.install_per_sqm * area
    landed_ex_vat = customs_value_krw + duty + local

    missing = [f for f in SPEC_FIELDS if not (row.get(f) or "").strip()]
    if missing:
        flags.append("사양 누락: " + ", ".join(missing))
    spare = num(row, "spare_pct")
    if spare is None or spare == 0:
        flags.append("스페어 비율 미기재/0%")

    return Result(
        vendor=vendor,
        model=(row.get("model") or "").strip(),
        pitch=(row.get("pixel_pitch_mm") or "").strip(),
        package=(row.get("package") or "").strip(),
        area_sqm=area,
        currency=currency,
        goods_foreign=goods,
        price_per_sqm_foreign=goods / area,
        customs_value_krw=customs_value_krw,
        duty_krw=duty,
        vat_krw=vat,
        local_krw=local,
        landed_ex_vat_krw=landed_ex_vat,
        landed_per_sqm_ex_vat_krw=landed_ex_vat / area,
        cash_out_krw=landed_ex_vat + vat,
        flags=flags,
    )


def won(x: float) -> str:
    return f"{x:,.0f}"


def render_md(results: list[Result], args: argparse.Namespace) -> str:
    lines = [
        f"가정: 관세율 {args.duty_rate}% · 부가세 {args.vat_rate}% · 통관수수료 {won(args.broker_fee)}원 · "
        f"내륙운송 {won(args.inland)}원 · 설치 {won(args.install_per_sqm)}원/㎡",
        "",
        "| 순위 | 공급사 | 모델 | 피치 | 패키지 | 면적(㎡) | ㎡당 견적가 | CIF 과세가격(원) | 관세(원) | 국내비용(원) "
        "| **착지원가 부가세 제외(원)** | **㎡당 착지원가(원)** | 부가세(원) | 현금 지출 합계(원) |",
        "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for i, r in enumerate(results, 1):
        lines.append(
            f"| {i} | {r.vendor} | {r.model} | {r.pitch} | {r.package} | {r.area_sqm:.2f} | "
            f"{r.currency} {r.price_per_sqm_foreign:,.0f} | {won(r.customs_value_krw)} | {won(r.duty_krw)} | "
            f"{won(r.local_krw)} | **{won(r.landed_ex_vat_krw)}** | **{won(r.landed_per_sqm_ex_vat_krw)}** | "
            f"{won(r.vat_krw)} | {won(r.cash_out_krw)} |"
        )
    lines += ["", "확인 필요 사항:"]
    for r in results:
        lines.append(f"- {r.vendor}: " + ("; ".join(r.flags) if r.flags else "없음"))
    lines += [
        "",
        "참고: 과세가격은 수입신고일의 관세청 고시 과세환율로 다시 계산해야 한다. "
        "부가세는 매입세액 공제 대상이므로 마진 판단은 '부가세 제외' 열로 한다.",
    ]
    return "\n".join(lines)


def render_csv(results: list[Result]) -> str:
    import io

    buf = io.StringIO()
    cols = [
        "rank", "vendor", "model", "pixel_pitch_mm", "package", "area_sqm", "currency",
        "goods_foreign", "price_per_sqm_foreign", "customs_value_krw", "duty_krw", "vat_krw",
        "local_krw", "landed_ex_vat_krw", "landed_per_sqm_ex_vat_krw", "cash_out_krw", "flags",
    ]
    wr = csv.writer(buf)
    wr.writerow(cols)
    for i, r in enumerate(results, 1):
        wr.writerow([
            i, r.vendor, r.model, r.pitch, r.package, round(r.area_sqm, 3), r.currency,
            round(r.goods_foreign, 2), round(r.price_per_sqm_foreign, 2), round(r.customs_value_krw),
            round(r.duty_krw), round(r.vat_krw), round(r.local_krw), round(r.landed_ex_vat_krw),
            round(r.landed_per_sqm_ex_vat_krw), round(r.cash_out_krw), " / ".join(r.flags),
        ])
    return buf.getvalue()


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="LED 견적 착지원가 비교")
    p.add_argument("quotes", help="견적 CSV 경로 (quotes_template.csv 형식)")
    p.add_argument("--fx", action="append", default=[], help="환율, 예: USD=1400 (원/1단위). 여러 번 지정")
    p.add_argument("--duty-rate", type=float, required=True, help="적용 관세율 %% (UNI-PASS 조회값)")
    p.add_argument("--vat-rate", type=float, default=10.0, help="수입 부가세율 %% (기본 10)")
    p.add_argument("--broker-fee", type=float, default=0.0, help="통관 수수료 등 고정비(원)")
    p.add_argument("--inland", type=float, default=0.0, help="국내 내륙운송·하역비(원)")
    p.add_argument("--install-per-sqm", type=float, default=0.0, help="설치비(원/㎡), 비교에 포함할 때만")
    p.add_argument("--format", choices=["md", "csv"], default="md")
    args = p.parse_args(argv)

    fx = parse_fx(args.fx)
    with open(args.quotes, newline="", encoding="utf-8-sig") as f:
        rows = [r for r in csv.DictReader(f) if any((v or "").strip() for v in r.values())]
    if not rows:
        raise SystemExit("견적 행이 없음")

    try:
        results = [compute(r, fx, args) for r in rows]
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc
    results.sort(key=lambda r: r.landed_per_sqm_ex_vat_krw)
    sys.stdout.write(render_md(results, args) if args.format == "md" else render_csv(results))
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

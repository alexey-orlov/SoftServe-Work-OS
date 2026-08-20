#!/usr/bin/env python3
"""Audit a generated HTML prototype for design-system compliance.

Checks that styling values in the document body reference CSS custom properties
instead of hardcoded literals, that the :root token block matches the cached
Figma extraction, and that the file is genuinely self-contained.

Usage (paths relative to the repo root):
    python .claude/skills/prototype/scripts/audit_tokens.py product-development/product/prototypes/checkout.html \
        --tokens product-development/product/prototypes/design-system/tokens.css
    python .claude/skills/prototype/scripts/audit_tokens.py <file.html>          # own-token-block mode (no cache compare)
    python .claude/skills/prototype/scripts/audit_tokens.py <file.html> --json   # machine-readable

Exit codes: 0 clean (warnings allowed), 1 errors found, 2 bad invocation.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# Values that are fine to hardcode. Hairlines, resets, and keywords carry no
# brand meaning, so flagging them only trains the reader to ignore the report.
ALLOWED_LITERALS = {
    "0", "0px", "0%", "1px", "2px", "auto", "none", "inherit", "initial",
    "unset", "transparent", "currentcolor", "100%", "50%", "1", "1em", "1rem",
}

HEX_RE = re.compile(r"#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b")
FUNC_COLOR_RE = re.compile(r"\b(?:rgba?|hsla?|color-mix|oklch)\s*\(")
ROOT_BLOCK_RE = re.compile(r":root\s*\{(.*?)\}", re.DOTALL)
CUSTOM_PROP_RE = re.compile(r"(--[A-Za-z0-9_-]+)\s*:\s*([^;}]+)")
SVG_RE = re.compile(r"<svg\b.*?</svg>", re.DOTALL | re.IGNORECASE)
COMMENT_RE = re.compile(r"/\*.*?\*/", re.DOTALL)

# property -> severity. Colour, type and radius are brand-defining, so a literal
# there is an error. Spacing literals are a warning: one-off nudges happen, but a
# pile of them means the spacing scale is being ignored.
ERROR_PROPS = [
    "color", "background", "background-color", "border", "border-color",
    "border-top", "border-bottom", "border-left", "border-right",
    "outline", "outline-color", "fill", "stroke",
    "font", "font-family", "font-size", "font-weight",
    "border-radius", "box-shadow", "text-shadow", "letter-spacing",
]
WARN_PROPS = [
    "padding", "padding-top", "padding-bottom", "padding-left", "padding-right",
    "margin", "margin-top", "margin-bottom", "margin-left", "margin-right",
    "gap", "row-gap", "column-gap", "line-height",
]
DECL_RE = re.compile(
    r"(?<![-\w])(" + "|".join(sorted(ERROR_PROPS + WARN_PROPS, key=len, reverse=True))
    + r")\s*:\s*([^;{}\"']+)",
    re.IGNORECASE,
)


class Finding:
    def __init__(self, severity: str, line: int, code: str, message: str):
        self.severity, self.line, self.code, self.message = severity, line, code, message

    def as_dict(self) -> dict:
        return {"severity": self.severity, "line": self.line,
                "code": self.code, "message": self.message}


def line_of(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1


def parse_tokens(css: str) -> dict[str, str]:
    tokens: dict[str, str] = {}
    for block in ROOT_BLOCK_RE.findall(COMMENT_RE.sub("", css)):
        for name, value in CUSTOM_PROP_RE.findall(block):
            tokens[name] = " ".join(value.split())
    return tokens


def mask(text: str, pattern: re.Pattern) -> str:
    """Blank out regions while preserving offsets, so line numbers stay true."""
    return pattern.sub(lambda m: re.sub(r"[^\n]", " ", m.group(0)), text)


def is_literal(value: str) -> str | None:
    """Return the offending literal in a declaration value, or None if clean."""
    v = value.strip()
    if not v or v.lower() in ALLOWED_LITERALS:
        return None
    if "var(" in v:
        return None
    m = HEX_RE.search(v)
    if m:
        return m.group(0)
    m = FUNC_COLOR_RE.search(v)
    if m:
        return v
    # Bare numeric dimensions outside the token scale.
    m = re.search(r"\b\d*\.?\d+(px|rem|em|pt)\b", v)
    if m and m.group(0) not in ALLOWED_LITERALS:
        return m.group(0)
    # Quoted or named font stacks.
    if re.search(r"[\"']", v) or re.search(
        r"\b(Inter|Roboto|Arial|Helvetica|Georgia|Times|Verdana|Tahoma|Poppins|Lato|"
        r"Montserrat|Open Sans|Segoe UI|SF Pro|system-ui)\b", v, re.IGNORECASE):
        return v
    return None


def audit(html: str, tokens_path: Path | None) -> list[Finding]:
    findings: list[Finding] = []

    declared = parse_tokens(html)
    if not declared:
        findings.append(Finding("error", 1, "no-tokens",
            "No :root custom properties found. Paste the token block from "
            "design-system/tokens.css (or define the file's own) into the <style>."))

    # Compare against the cached extraction so hand-edited token values surface.
    if tokens_path:
        if not tokens_path.exists():
            findings.append(Finding("warn", 1, "tokens-missing",
                f"{tokens_path} not found - token drift could not be checked."))
        else:
            cached = parse_tokens(tokens_path.read_text(encoding="utf-8"))
            for name, value in cached.items():
                if name not in declared:
                    findings.append(Finding("warn", 1, "token-absent",
                        f"{name} is in the Figma extraction but not in this file."))
                elif declared[name].rstrip(";").strip() != value.rstrip(";").strip():
                    findings.append(Finding("error", 1, "token-drift",
                        f"{name} is '{declared[name]}' here but "
                        f"'{value}' in the Figma extraction."))

    # Ignore :root (definitions), inline SVG (icon internals), and comments.
    body = mask(html, ROOT_BLOCK_RE)
    body = mask(body, SVG_RE)
    body = mask(body, COMMENT_RE)

    for m in DECL_RE.finditer(body):
        prop, value = m.group(1).lower(), m.group(2)
        offender = is_literal(value)
        if not offender:
            continue
        severity = "error" if prop in ERROR_PROPS else "warn"
        findings.append(Finding(severity, line_of(body, m.start()), "hardcoded",
            f"{prop}: {offender.strip()} - use a var(--token) instead."))

    # Structural self-containment checks.
    for m in re.finditer(r"<script[^>]+src=[\"']([^\"']+)", html, re.IGNORECASE):
        findings.append(Finding("error", line_of(html, m.start()), "external-script",
            f"External script {m.group(1)} - the preview must be self-contained."))
    for m in re.finditer(r"<link[^>]+href=[\"']([^\"']+)", html, re.IGNORECASE):
        href = m.group(1)
        if "fonts.googleapis.com" in href or "fonts.gstatic.com" in href:
            continue
        findings.append(Finding("error", line_of(html, m.start()), "external-style",
            f"External stylesheet {href} - inline it or use a token."))
    for m in re.finditer(r"\b(localStorage|sessionStorage|indexedDB)\b", html):
        findings.append(Finding("error", line_of(html, m.start()), "storage-api",
            f"{m.group(1)} is blocked in preview sandboxes - keep state in JS variables."))
    for m in re.finditer(r"\b(Lorem ipsum|lorem ipsum|Item [123]\b|Placeholder text)", html):
        findings.append(Finding("warn", line_of(html, m.start()), "filler-content",
            f"Filler content '{m.group(0)}' makes the preview read as fake."))

    # A named font that is never loaded renders as a silent fallback.
    font_names = {
        n.strip().strip("\"'")
        for v in declared.values() if "font" in v.lower() or "," in v
        for n in v.split(",")
    }
    links = " ".join(re.findall(r"<link[^>]*>", html, re.IGNORECASE))
    generic = {"sans-serif", "serif", "monospace", "system-ui", "-apple-system",
               "BlinkMacSystemFont", "ui-sans-serif", "cursive"}
    for name in sorted(font_names):
        if not name or name in generic or name.startswith("-"):
            continue
        if name.lower() not in links.lower() and f"@font-face" not in html:
            findings.append(Finding("warn", 1, "font-unloaded",
                f"'{name}' is referenced but never loaded - note the substitution."))
            break

    return findings


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("html", type=Path, help="the generated prototype file")
    ap.add_argument("--tokens", type=Path, default=None,
                    help="cached Figma token file, e.g. "
                         "product-development/product/prototypes/design-system/tokens.css")
    ap.add_argument("--json", action="store_true", help="machine-readable output")
    args = ap.parse_args()

    if not args.html.exists():
        print(f"error: {args.html} not found", file=sys.stderr)
        return 2

    findings = audit(args.html.read_text(encoding="utf-8"), args.tokens)
    errors = [f for f in findings if f.severity == "error"]
    warns = [f for f in findings if f.severity == "warn"]

    if args.json:
        print(json.dumps({"file": str(args.html), "errors": len(errors),
                          "warnings": len(warns),
                          "findings": [f.as_dict() for f in findings]}, indent=2))
        return 1 if errors else 0

    if not findings:
        print(f"clean - {args.html} is token-compliant and self-contained")
        return 0

    for f in sorted(findings, key=lambda f: (f.severity != "error", f.line)):
        label = "ERROR" if f.severity == "error" else " warn"
        print(f"{label}  {args.html}:{f.line}  [{f.code}] {f.message}")

    print(f"\n{len(errors)} error(s), {len(warns)} warning(s)")
    if errors:
        print("Fix the errors before handing the preview over.")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())

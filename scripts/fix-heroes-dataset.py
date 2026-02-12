#!/usr/bin/env python3
"""Fix and enrich immunefi-heroes.json dataset.

Fixes:
- all_time_rank: broken parser returns 2 for all — set to null, use `rank` as canonical
- personal_site_url: Immunefi community TG link polluting all entries — null it out
- Add `primary_link` field: X profile (preferred) → Immunefi pledge page (fallback)
- Add `avatar_seed` for deterministic gradient generation on heroes with default PFP
- Add `has_custom_pfp` boolean
- Clean utm_source params from github URLs
"""

import json
import hashlib

INPUT = "public/data/immunefi-heroes.json"
OUTPUT = "public/data/immunefi-heroes.json"

IMMUNEFI_TG = "t.me/+5CtF7wTbAJVhODgx"
DEFAULT_PFP = "join-immunefi-pfp"

# Deterministic color palette for avatar generation (16 pairs: bg + text)
AVATAR_COLORS = [
    {"bg": "#1a1a2e", "accent": "#e94560"},
    {"bg": "#16213e", "accent": "#0f3460"},
    {"bg": "#0a0a23", "accent": "#6c63ff"},
    {"bg": "#1b1b2f", "accent": "#e43f5a"},
    {"bg": "#162447", "accent": "#1f4068"},
    {"bg": "#1a1a40", "accent": "#4ecca3"},
    {"bg": "#0d1117", "accent": "#58a6ff"},
    {"bg": "#0f0e17", "accent": "#ff8906"},
    {"bg": "#16161a", "accent": "#7f5af0"},
    {"bg": "#1a1a2e", "accent": "#e94560"},
    {"bg": "#0b0c10", "accent": "#66fcf1"},
    {"bg": "#1f1f38", "accent": "#e2b714"},
    {"bg": "#0d1b2a", "accent": "#e0e1dd"},
    {"bg": "#1b2838", "accent": "#66c0f4"},
    {"bg": "#0a192f", "accent": "#64ffda"},
    {"bg": "#191a1e", "accent": "#f5a623"},
]


def get_avatar_seed(handle: str) -> dict:
    """Generate deterministic avatar data from handle."""
    h = hashlib.md5(handle.encode()).hexdigest()
    idx = int(h[:2], 16) % len(AVATAR_COLORS)
    initials = handle[:2].upper()
    return {
        "initials": initials,
        "color_idx": idx,
        "bg": AVATAR_COLORS[idx]["bg"],
        "accent": AVATAR_COLORS[idx]["accent"],
    }


def clean_url(url: str | None) -> str | None:
    """Remove utm_source params from URLs."""
    if not url:
        return None
    if "?utm_source=" in url:
        return url.split("?utm_source=")[0]
    return url


def get_primary_link(hero: dict) -> str:
    """X profile (preferred) → pledge page (fallback)."""
    links = hero["links"]
    if links.get("x_url") and links.get("x_confidence") == "high":
        return links["x_url"]
    return hero["pledge_url"]


def fix_hero(hero: dict) -> dict:
    """Apply all fixes to a single hero entry."""
    # Fix all_time_rank — broken parser, null it
    hero["all_time_rank"] = None

    # Fix personal_site_url — Immunefi TG is not the researcher's site
    if hero["links"].get("personal_site_url") and IMMUNEFI_TG in hero["links"]["personal_site_url"]:
        hero["links"]["personal_site_url"] = None

    # Clean github URL
    hero["links"]["github_url"] = clean_url(hero["links"].get("github_url"))

    # Add has_custom_pfp
    hero["has_custom_pfp"] = DEFAULT_PFP not in hero["pfp_url"]

    # Add avatar_seed for deterministic gradients
    hero["avatar_seed"] = get_avatar_seed(hero["handle"])

    # Add primary_link
    hero["primary_link"] = get_primary_link(hero)

    # Normalize earnings display
    if hero.get("total_earned_usd") and hero["total_earned_usd"] > 0:
        usd = hero["total_earned_usd"]
        if usd >= 1_000_000:
            hero["earned_display"] = f"${usd / 1_000_000:.1f}M"
        elif usd >= 1_000:
            hero["earned_display"] = f"${usd / 1_000:.0f}K"
        else:
            hero["earned_display"] = f"${usd:,}"
    else:
        hero["earned_display"] = "$0"

    return hero


def main():
    with open(INPUT) as f:
        data = json.load(f)

    heroes = data["heroes"]
    print(f"Processing {len(heroes)} heroes...")

    # Apply fixes
    fixed = [fix_hero(h) for h in heroes]

    # Stats
    with_x = sum(1 for h in fixed if h["links"]["x_handle"])
    with_pfp = sum(1 for h in fixed if h["has_custom_pfp"])
    with_github = sum(1 for h in fixed if h["links"]["github_url"])
    x_as_primary = sum(1 for h in fixed if h["links"].get("x_url") and h["primary_link"] and "x.com" in h["primary_link"])
    total_earned = sum(h.get("total_earned_usd") or 0 for h in fixed)

    print(f"  With X handle:     {with_x}")
    print(f"  With custom PFP:   {with_pfp}")
    print(f"  With GitHub:       {with_github}")
    print(f"  X as primary link: {x_as_primary}")
    print(f"  Total earned:      ${total_earned:,.0f}")

    # Update data
    data["heroes"] = fixed

    # Add fix metadata
    data["meta"]["enriched_at"] = "2026-02-11T00:00:00.000Z"
    data["meta"]["fixes_applied"] = [
        "all_time_rank nulled (broken parser returned 2 for all)",
        "personal_site_url cleared (Immunefi community TG, not researcher site)",
        "github_url cleaned (utm_source removed)",
        "added has_custom_pfp, avatar_seed, primary_link, earned_display",
    ]

    with open(OUTPUT, "w") as f:
        json.dump(data, f, indent=2)

    print(f"\nWrote {len(fixed)} heroes to {OUTPUT}")


if __name__ == "__main__":
    main()

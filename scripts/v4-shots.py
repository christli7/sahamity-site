"""Website screenshots from the v4 Liquid Glass captures (promo-assets-v4, real screens from the live app).

    python apps/site/scripts/v4-shots.py

Writes apps/site/shots/<name>-<lang>.webp (dark) and apps/site/shots/light/<name>-<lang>.webp (light).
Phone screens come from promo-assets-v4/<lang>/<theme>/phone/, cards from promo-assets-v4/<lang>/cards/ (dark) and
promo-assets-v4/<lang>/light/cards/ (light). A light shot with no light capture is removed, so the site falls back
to the dark one.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / 'promo-assets-v4'
OUT = ROOT / 'apps' / 'site' / 'shots'

# Site name -> capture name. Phones are whole screens (content area), cards are single cards at 4x.
PHONES = {
    'feed': 'news-idx',
    'feed-us': 'news-us',
    'event-us': 'event-top',
    'event-reaction': 'event-reaction',
    'analysis': 'analysis',
    'pro': 'pro',
    'watchlist': 'watchlist',
    't-home': 't-home',
    't-chart-us': 't-chart-us',
    't-flow': 't-flow',
    't-screener': 't-screener',
    't-signals': 't-signals',
    't-pulse': 't-pulse',
    't-tech': 't-chart',
    'reactions': 'reactions',
}
CARDS = {
    'c-outlook': 'outlook',
    'c-trade': 'trade',
    'c-scen': 'scenarios',
    'c-haka': 'haka',
    'c-acc': 'acc',
    'c-reaction': 'reaction',
    'c-limits': 'limits',
    'c-sectors': 'sectors',
    'c-summary': 'summary',
    'c-profile': 'profile',
}
# Cards cut out of a whole screen: the first News card (the tab bar covers its foot, so the crop ends above it).
# Boxes per theme, because the dark and light captures were taken at different moments and the card sits at a
# different height (measured on the captures of 12 Nov 2026).
CROPS = {
    'c-feed': ('news-idx', {
        'dark': {'en': (52, 1715, 1520, 2700), 'id': (52, 1715, 1520, 2655)},
        'light': {'en': (52, 1521, 1520, 2506), 'id': (52, 1713, 1520, 2653)},
    }),
}


def save(src: Path, dst: Path, width: int, box=None) -> None:
    im = Image.open(src).convert('RGB')
    if box:
        im = im.crop(box)
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, 'WEBP', quality=84, method=6)


def light_or_remove(src: Path, dst: Path, width: int, box=None) -> None:
    if src.exists():
        save(src, dst, width, box)
    elif dst.exists():
        dst.unlink()


def main() -> None:
    (OUT / 'light').mkdir(parents=True, exist_ok=True)
    for lang in ('en', 'id'):
        for name, cap in PHONES.items():
            save(SRC / lang / 'dark' / 'phone' / f'{cap}.png', OUT / f'{name}-{lang}.webp', 1179)
            light_or_remove(SRC / lang / 'light' / 'phone' / f'{cap}.png', OUT / 'light' / f'{name}-{lang}.webp', 1179)
        for name, cap in CARDS.items():
            save(SRC / lang / 'cards' / f'{cap}.png', OUT / f'{name}-{lang}.webp', 1100)
            light_or_remove(SRC / lang / 'light' / 'cards' / f'{cap}.png', OUT / 'light' / f'{name}-{lang}.webp', 1100)
        for name, (cap, boxes) in CROPS.items():
            save(SRC / lang / 'dark' / 'phone' / f'{cap}.png', OUT / f'{name}-{lang}.webp', 1100, boxes['dark'][lang])
            light_or_remove(SRC / lang / 'light' / 'phone' / f'{cap}.png', OUT / 'light' / f'{name}-{lang}.webp', 1100, boxes['light'][lang])
    print('done')


if __name__ == '__main__':
    main()

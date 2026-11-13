"""Website screenshots from the v4 Liquid Glass captures (promo-assets-v4, real screens from the live app).

    python apps/site/scripts/v4-shots.py

Writes apps/site/shots/<name>-<lang>.webp (dark) and apps/site/shots/light/<name>-<lang>.webp for the screens
captured in light too. A light shot that has no light capture is removed, so the site falls back to the dark one.
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
}
CARDS = {
    'c-outlook': 'outlook',
    'c-trade': 'trade',
    'c-haka': 'haka',
    'c-acc': 'acc',
    'c-reaction': 'reaction',
    'c-limits': 'limits',
    'c-sectors': 'sectors',
}
# Cards cut out of a whole screen: the first News card (the tab bar covers its foot, so the crop ends above it).
CROPS = {
    'c-feed': ('news-idx', {'en': (52, 1715, 1520, 2700), 'id': (52, 1715, 1520, 2655)}),
}


def save(src: Path, dst: Path, width: int, box=None) -> None:
    im = Image.open(src).convert('RGB')
    if box:
        im = im.crop(box)
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, 'WEBP', quality=84, method=6)


def main() -> None:
    (OUT / 'light').mkdir(parents=True, exist_ok=True)
    for lang in ('en', 'id'):
        for name, cap in PHONES.items():
            save(SRC / lang / 'dark' / 'phone' / f'{cap}.png', OUT / f'{name}-{lang}.webp', 1179)
            light = SRC / lang / 'light' / 'phone' / f'{cap}.png'
            dst = OUT / 'light' / f'{name}-{lang}.webp'
            if light.exists():
                save(light, dst, 1179)
            elif dst.exists():
                dst.unlink()
        for name, cap in CARDS.items():
            save(SRC / lang / 'cards' / f'{cap}.png', OUT / f'{name}-{lang}.webp', 1100)
            stale = OUT / 'light' / f'{name}-{lang}.webp'
            if stale.exists():
                stale.unlink()
        for name, (cap, boxes) in CROPS.items():
            save(SRC / lang / 'dark' / 'phone' / f'{cap}.png', OUT / f'{name}-{lang}.webp', 1100, boxes[lang])
    print('done')


if __name__ == '__main__':
    main()

# Melaris · návrh webu „Linka M“

Návrh nového webu pro [Melaris](https://melaris.cz). Není to živý web: každá stránka má `noindex,nofollow` a živý web dál běží na melaris.cz.

Statický web bez sestavování. Otevři `index.html` přes libovolný statický server, třeba `python3 -m http.server 8791`.

## Co tu je

- `index.html`, `assets/css/site.css`, `assets/js/main.js`: stránka, vzhled a pohyb.
- `assets/js/mel3d.js`: Mel ve 3D. Křivky z kresby Mel (viewBox 64) vytažené v three.js, šest stavů, přelety mezi kotvami `[data-mel-anchor]`.
- `assets/mel/`: kresby Mel pro klidný režim (`prefers-reduced-motion`) a pro prohlížeče bez WebGL.
- `assets/ui/`: skutečné obrazovky aplikace s ukázkovými daty.
- `nahled/`: snímky 1440 a 390 px a krátké video průjezdu stránkou.

## Knihovny (kopie v `assets/vendor/`)

| Knihovna | Verze | Licence |
| --- | --- | --- |
| three.js (`three.module.min.js`, `RoomEnvironment.js`, `BufferGeometryUtils.js`) | 0.170.0 | MIT |
| GSAP + ScrollTrigger | 3.15.1 | GSAP Standard License |
| Lenis | 1.3.27 | MIT |

Písmo Sora je pod SIL OFL 1.1. Značka a Mel pocházejí z repozitáře Melarisu. Stránka nic neměří a nemá žádný formulář.

# Media

Photography for the site lives here and is served from `/media/…`.

* Every image has two widths: `name-640.webp` and `name-1280.webp`. `<MediaSlot/>` builds the `srcset`
  automatically from the `-1280` path, so phones download the small file.
* Which photo goes in which slot is set in [`src/content/media.ts`](../../src/content/media.ts); suites and
  gallery tiles are seeded in [`src/data.ts`](../../src/data.ts) and editable in the Staff Portal.
* Sources and licence for the current photos: [`CREDITS.md`](CREDITS.md).

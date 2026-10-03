/**
 * PPA Tour Europe photo gallery, read straight from the Europe team's Google
 * Drive folder. Payton + Catie asked (9/15, 10/1) for a gallery they can run
 * themselves without a website deploy: drop photos into a sub-folder of
 * "PPA Europe Picture Gallery" and they appear on /europe within the hour.
 *
 * ⚠ NO API KEY, ON PURPOSE. The folder is shared "anyone with the link", and
 * Drive's public `embeddedfolderview` page lists such a folder without auth.
 * Photos are served from `lh3.googleusercontent.com/d/<id>=w<width>`, Google's
 * own resized copy, so a 15 MB camera original never reaches a phone. If the
 * folder is ever made private the gallery renders nothing, never an error.
 *
 * One level deep: each sub-folder is an album (named by the folder, e.g.
 * "P125 Portoroz"); loose photos in the root become a "PPA Tour Europe" album.
 */
export const EUROPE_GALLERY_FOLDER = "1sfQ_OILfDr1o563PY6pVzhWB7OEOm7Id";
export const EUROPE_GALLERY_URL = `https://drive.google.com/drive/folders/${EUROPE_GALLERY_FOLDER}`;

export type GalleryPhoto = { id: string; title: string; credit?: string };
export type GalleryAlbum = { id: string; title: string; photos: GalleryPhoto[] };

type Entry = { id: string; title: string; folder: boolean };

const IMAGE = /\.(jpe?g|png|webp|heic)$/i;

async function listFolder(id: string): Promise<Entry[]> {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${id}`, {
    next: { revalidate: 3600, tags: ["europe-gallery"] },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const out: Entry[] = [];
  const re =
    /<div class="flip-entry" id="entry-([\w-]+)"[\s\S]*?<a href="https:\/\/drive\.google\.com\/(drive\/folders|file\/d)\/[\w-]+[\s\S]*?<div class="flip-entry-title">([^<]*)<\/div>/g;
  for (const m of html.matchAll(re)) {
    out.push({ id: m[1], folder: m[2] === "drive/folders", title: decode(m[3]) });
  }
  return out;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

/** "Karolina @catieworks PPA-PRTRZ-124.jpg" → credit "@catieworks". */
function toPhoto(e: Entry): GalleryPhoto {
  const credit = e.title.match(/@[\w.]+/)?.[0];
  return { id: e.id, title: e.title.replace(IMAGE, ""), credit };
}

export async function getEuropeGallery(): Promise<GalleryAlbum[]> {
  try {
    const root = await listFolder(EUROPE_GALLERY_FOLDER);
    const albums: GalleryAlbum[] = [];
    const loose = root.filter((e) => !e.folder && IMAGE.test(e.title)).map(toPhoto);
    for (const f of root.filter((e) => e.folder)) {
      const photos = (await listFolder(f.id)).filter((e) => !e.folder && IMAGE.test(e.title)).map(toPhoto);
      if (photos.length) albums.push({ id: f.id, title: f.title, photos });
    }
    if (loose.length) albums.push({ id: EUROPE_GALLERY_FOLDER, title: "PPA Tour Europe", photos: loose });
    return albums;
  } catch {
    return [];
  }
}

/**
 * Newest event first (Payton, 10/2: "sort the photos by event, most recent to
 * least recent"). Drive's public listing carries no dates, so each album is
 * dated by matching its folder name to a Europe stop in the events feed: the
 * stop's city must appear in the folder name ("P250 Barcelona" -> Barcelona).
 * Albums with no match keep Drive's order, after the dated ones.
 */
export function sortAlbumsByEvent(
  albums: GalleryAlbum[],
  events: { city: string; startDate: string }[],
): GalleryAlbum[] {
  const norm = (x: string) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const today = new Date().toISOString().slice(0, 10);
  const dated = albums.map((a, i) => {
    const t = norm(a.title);
    const hits = events
      .filter((e) => e.city && e.startDate <= today && t.includes(norm(e.city)))
      .map((e) => e.startDate)
      .sort();
    return { a, i, date: hits.at(-1) ?? "" };
  });
  return dated
    .sort((x, y) => (y.date || "").localeCompare(x.date || "") || x.i - y.i)
    .map((d) => d.a);
}

export function photoSrc(id: string, width: number): string {
  return `https://lh3.googleusercontent.com/d/${id}=w${width}`;
}

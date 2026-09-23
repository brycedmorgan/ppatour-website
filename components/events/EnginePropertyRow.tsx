import { type EngineProperty, type EventStay, engineBookingUrl } from "@/lib/engine-booking";

/**
 * One hotel from Engine — thumbnail, name, distance, rating, amenity chips and
 * a dated link into the PPA's co-branded booking host.
 *
 * ⚠ ONE COMPONENT FOR THE CARD AND THE MODAL, ON PURPOSE. These rows were
 * duplicated across EngineStay and EngineMoreHotels for a day and immediately
 * started to differ; a hotel that reads one way in the column and another way in
 * the "view all" list makes the modal look like a different data source. The only
 * difference the two placements are allowed is how many chips fit, which is what
 * `chipLimit` is for.
 *
 * ⚠ IT IMPORTS NO DATA. Everything comes in as props so the modal — a client
 * component — never drags the property snapshot into the browser bundle. See the
 * note at the foot of lib/engine-booking.ts.
 *
 * ⚠ NO PRICE, BECAUSE WE DO NOT HAVE ONE. `ContentService.ListProperties` is a
 * content endpoint; rates live behind `LodgingShoppingService`, which our
 * credential is not entitled to (403, measured 9/23). If that is ever granted,
 * putting a nightly rate here is a decision about publishing a number we do not
 * control, not a free upgrade — and it would put this card next to Kristen's
 * negotiated rates, which is exactly the comparison the block ordering exists to
 * avoid.
 */
export function EnginePropertyRow({
  property,
  event,
  chipLimit = 3,
  className = "",
}: {
  property: EngineProperty;
  event: EventStay;
  /** Amenity chips to show before truncating. The modal has room for more. */
  chipLimit?: number;
  className?: string;
}) {
  const where = [property.city, property.region].filter(Boolean).join(", ");
  const chips = (property.amenities ?? []).slice(0, chipLimit);
  // Engine sends the rating as a string ("4.0"); print it as given rather than
  // rounding or drawing star glyphs, which would imply a precision we were not
  // handed and would have to guess at for a half star.
  const rating = property.starRating;

  return (
    <a
      href={engineBookingUrl(property, event)}
      target="_blank"
      rel="noopener noreferrer"
      className={`group/prop flex items-start gap-3 py-2.5 transition hover:bg-ppa-paper ${className}`}
    >
      {property.heroImageUri ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={property.heroImageUri}
          alt=""
          loading="lazy"
          width={64}
          height={56}
          className="h-14 w-16 shrink-0 object-cover"
        />
      ) : (
        <span className="h-14 w-16 shrink-0 bg-ppa-line" aria-hidden />
      )}

      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold text-ppa-navy">
          {property.name}
        </span>

        {/* ⚠ min-w-0 ON BOTH THE ROW AND THE TRUNCATING CHILD, OR THE CARD PUSHES
            THE PAGE SIDEWAYS. A flex item defaults to min-width:auto, so the
            distance text refuses to shrink below its own content and the whole
            two-column row forces the document 170px wider than a 390px phone —
            measured, against a control page with no Engine column that stayed at
            0. The `truncate` does nothing until an ancestor is allowed to shrink.
            Same failure as the ticker's score columns (9/1). */}
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-ppa-navy/45">
          <span className="min-w-0 truncate">
            {typeof property.distanceMiles === "number"
              ? `${property.distanceMiles.toFixed(1)} mi from the venue`
              : where}
          </span>
          {rating && (
            <>
              <span aria-hidden>·</span>
              <span className="shrink-0 whitespace-nowrap font-bold text-ppa-navy/60">
                <span aria-hidden>★</span> {rating}
                <span className="sr-only"> out of 5 stars</span>
              </span>
            </>
          )}
        </span>

        {chips.length > 0 && (
          <span className="mt-1 flex min-w-0 flex-wrap gap-1">
            {chips.map((a) => (
              <span
                key={a}
                className="border border-ppa-line px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-ppa-navy/50"
              >
                {a}
              </span>
            ))}
          </span>
        )}
      </span>

      <span
        aria-hidden
        className="shrink-0 pt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-blue transition-transform duration-300 group-hover/prop:translate-x-0.5"
      >
        Book ↗
      </span>
    </a>
  );
}

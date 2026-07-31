# That's My Seat — release notes (v2)

## What's in this folder
- `index.html` — the whole app in one self-contained file (open it, or serve it from GitHub Pages).
- `Metro Seat Tracker - Greeting Quips.xlsx` — editable greeting quips.
- `backend/AppsScript.gs` — Google Sheets sync backend.

## Profiles
Four profiles with local passcodes (client-side only, not real security):

| Profile  | Passcode |
| -------- | -------- |
| Kyle     | kjf      |
| Abby     | arm      |
| Sophie   | smm      |
| Caroline | cea      |

Seat colors: Kyle green, Abby blue, Sophie light purple, Caroline light yellow.
"Both" (you + your compare partner in the same seat) is always red; the gold star marks
same seat AND same physical car.

## Sheet changes needed for this version
1. **New `Stands` tab** — header row exactly:
   `id | user | ts | line | station_boarded | car_number`
   (one row per ride where no seat was free; the app only ever counts these.)
2. **New `Rides` tab** — the shared trip log / comment feed:
   `id | author | line | stationCode | ts | text`
3. **New `Replies` tab** — comments on a ride (`ride_id` points at `Rides.id`):
   `id | ride_id | author | text | ts`
4. **`Quips` tab gains a `profile` column** — header row becomes:
   `timeOfDay | dayType | profile | text`
   - `profile` = `All` for a quip everyone sees, or a name (`Kyle`, `Abby`, `Sophie`,
     `Caroline`) for a quip that only shows on that person's home screen.
   - `timeOfDay` = `morning | lateMorning | afternoon | evening | night`
   - `dayType` = `weekday | weekend`
   - `text` may include `{name}`.
5. **Re-deploy the Apps Script** after pasting the updated `AppsScript.gs`
   (Deploy > Manage deployments > edit > New version). The only code change is that the
   no-params GET now also returns `stands`, `rides` and `replies`.

Existing `Events` and `Ratings` tabs are unchanged. Note the app now coerces
`series_variant` to text on the way in, so numeric-looking values ("6000") that Sheets
returns as numbers no longer break the per-car views.

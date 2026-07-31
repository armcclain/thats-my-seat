/**
 * That's My Seat — Google Sheets backend (Apps Script Web App)
 *
 * SETUP:
 * 1. Create a new Google Sheet. Add these tabs (exact names, header row exact,
 *    matching the app's own field names so no translation is needed):
 *
 *    Events
 *      id | user | seat_id | series_variant | variant_inferred | car_number | consist_position
 *      | line | station_boarded | station_alighted | direction | car_count | train_id | ts
 *      | source | autofilled_fields | layout_anomaly | notes
 *
 *    Ratings
 *      id | user | station_code | romance | categories | ts | note
 *
 *    Stands  (one row per ride where no seat was free — count only, no seat position)
 *      id | user | ts | line | station_boarded | car_number
 *
 *    Rides  (the shared trip log / comment feed)
 *      id | author | line | stationCode | ts | text
 *
 *    Replies  (comments on a ride; ride_id points at Rides.id)
 *      id | ride_id | author | text | ts
 *
 *    Quips  (edit this tab any time — the app re-pulls it on every sync, no code changes)
 *      timeOfDay | dayType | profile | text
 *      timeOfDay one of: morning | lateMorning | afternoon | evening | night
 *      dayType one of: weekday | weekend
 *      profile one of: All | Kyle | Abby | Sophie | Caroline
 *        All   -> shown to every profile
 *        <name> -> only shown on that person's home screen
 *      text may include {name} — replaced with the active profile's name
 *
 *    (autofilled_fields and categories are JSON-stringified by the app before sending.)
 *
 * 2. Extensions > Apps Script. Delete any starter code, paste this whole file.
 * 3. Deploy > New deployment > type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone with the link
 *    Click Deploy, authorize it, copy the Web App URL.
 * 4. Paste that URL into the app's Sync devices > Cloud Sync field.
 *
 * The script exposes:
 *   GET  ?sheet=Events            -> {rows:[...]}      (also Ratings, Stands, Rides, Replies, Quips)
 *   GET  (no params)              -> {events, ratings, stands, rides, replies, quips}
 *   POST {sheet, row:{...}}       -> appends one row (deduped by id), returns {ok:true}
 */
function doGet(e) {
  try {
    if (e.parameter.action === 'push') {
      var sheetName = e.parameter.sheet;
      var row = JSON.parse(e.parameter.row);
      return pushRow_(sheetName, row);
    }
    var sheet = e.parameter.sheet;
    if (sheet) {
      return json_({rows: readSheet_(sheet)});
    }
    return json_({
      events: readSheet_('Events'),
      ratings: readSheet_('Ratings'),
      stands: readSheet_('Stands'),
      rides: readSheet_('Rides'),
      replies: readSheet_('Replies'),
      quips: readSheet_('Quips')
    });
  } catch (err) {
    return json_({ok:false, error: String(err)});
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData) return json_({ok:false, error:'no postData received'});
    var body = JSON.parse(e.postData.contents);
    return pushRow_(body.sheet, body.row);
  } catch (err) {
    return json_({ok:false, error: String(err), stack: err.stack || ''});
  }
}

function pushRow_(sheetName, row) {
  if (!sheetName || !row) return json_({ok:false, error:'missing sheet/row'});
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(sheetName);
  if (!sh) return json_({ok:false, error:'no such sheet: ' + sheetName});
  var headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  if (row.id && sh.getLastRow() > 1) {
    var idCol = headers.indexOf('id');
    if (idCol >= 0) {
      var existingIds = sh.getRange(2, idCol+1, sh.getLastRow()-1, 1).getValues().flat();
      if (existingIds.indexOf(row.id) !== -1) return json_({ok:true, deduped:true});
    }
  }
  var out = headers.map(function(h){ return row[h] !== undefined ? row[h] : ''; });
  sh.appendRow(out);
  return json_({ok:true});
}

function readSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  var headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  var data = sh.getRange(2,1,sh.getLastRow()-1, sh.getLastColumn()).getValues();
  return data.map(function(r){
    var o = {};
    headers.forEach(function(h,i){ o[h] = r[i]; });
    return o;
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

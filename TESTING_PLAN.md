# Ring for Candy: beta testing and keeper recordings

## Sites and isolation

- Live event site: the repository's existing Pages root. Its released v2.0 files and user database are retained.
- Beta site: `/beta/`, copied from commit `c6b94ee1a8c6558787089e0b47cea23a4d732323`, with beta-only recording inbox and reset tools.
- Starting code version: the released commit remains in Git history. Beta records its source and production file hashes in `beta/SNAPSHOT.json`.
- Starting button setup: the owner saves a local baseline in the beta and also exports a JSON file. A clean reset is available for blank buttons and default settings.

Beta has a separate IndexedDB database, localStorage namespace, manifest scope and service-worker/cache scope. A beta reset cannot reset the live site's pads or preferences. This is environment isolation, not authentication: both paths are public and files remain accessible from the same website origin.

## Retention model

Recordings and button assignments are separate. Every finished beta take is archived with a unique ID, clip name, tester nickname, date and Keep flag, whether or not it was assigned to a button. Owner reset actions change only the beta's assignments/settings. They retain all archived takes and the saved baseline. There is no bulk-delete button for recordings.

Browser storage is not a durable backup. Each tester exports and sends clips before clearing data. The owner downloads the received files to a safe folder, imports them into the beta inbox, previews and marks keepers, and exports a second keeper bundle as backup. Individual audio downloads are also available. Re-importing the same IDs skips existing copies rather than overwriting the owner's review flags.

## Tester handout

Share `/beta/tester-guide.html` together with the beta URL. Testers use their own phones/tablets. They enter a nickname, name and record short original clips, mark good takes Keep, send an export, and report device/browser and any playback or microphone problem. No automatic recording upload occurs. The event iPhone is paired directly to the Bluetooth speaker.

## Owner preparation before Halloween

1. Export the existing live setup before making changes on the event iPhone.
2. Receive each tester's bundle, confirm receipt and keep the original file outside browser storage.
3. Import bundles into the beta Recording inbox. Preview, mark Keep and export all keepers.
4. Assign approved takes to the desired twelve buttons in the beta. Save the resulting starting setup and export the complete setup JSON.
5. Restore that complete setup into the live site on the event iPhone. Download the library for offline use and test speaker playback and PTT microphone routing on that actual device.
6. Keep the final setup JSON and keeper bundle separately. If buttons get changed, restore the final setup file; the source tester files and keeper bundle remain available.

A local reset controls only the browser where it is invoked. It cannot reset another tester's device. Baseline restoration also restores favorites/history/scene/master volume saved with that baseline; clean reset restores defaults. Recordings remain separate in both cases.

## Secure admin login and automatic collection: proposed next stage

Recommendation: Supabase Auth plus a private Storage bucket and database policies, while GitHub Pages continues serving the app.

- Owner signs in by email magic link. The owner role is assigned by the backend, never trusted from a browser flag.
- Testers get individual authenticated or anonymous identities and explicitly submit chosen clips. Rate and size limits apply; recordings are not exposed publicly.
- Testers can submit/read their own clips. Only the owner can review all submissions, approve/tag keepers or publish an event setup. Private audio is accessed through short-lived authorised URLs.
- Store `recordings`, `event_setups`, `button_assignments` and `setup_versions` separately. Reset restores assignments from a chosen setup version and never deletes recording objects. Rejected clips can be reviewed later; deletion is a separate explicit operation.
- The event iPhone loads the approved event setup, then downloads required audio for offline use. A tester cannot reset the event setup or change admin roles.
- Keep/export backups before the event even with cloud storage.

Required outside setup: a Supabase project under the owner's account, its public project URL and publishable frontend key, the owner's login email, storage limits and permitted site URLs. Private service-role keys must never be put in GitHub Pages or chat. No backend project or secure login is configured yet; the beta's “Owner reset tools” are clearly labeled local controls, not a security boundary.

Once a backend project is available, implement and test permission policies before enabling automatic submissions/admin reset. This plan avoids pretending that a PIN or hidden client-side menu is a secure login.

## Recordings to keep outside the browser

Suggested folders on the organiser's Windows machine:

- `Halloween/Tester originals/` — received exports, kept unchanged.
- `Halloween/Approved clips/` — keeper exports and individual audio downloads.
- `Halloween/Final iPhone setup/` — dated final setup JSON and a copy of the tester handout.

Use dated filenames when saving successive event setups. Restoring a button setup should never require deleting any of these folders.

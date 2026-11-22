// Seeds plans/free, plans/pro and system_settings/public (the web "Usage" page needs a plan document to show limits).
//
//   Emulator:   pnpm emulators   then   pnpm seed:emulator
//   Real project (uses your `gcloud auth application-default login` or a service account):
//               GCLOUD_PROJECT=<project-id> pnpm --filter @myai/functions seed -- --confirm
//
// Existing documents are left alone unless you add --overwrite, so edits made later by an admin are not lost.
// The numbers are the placeholders from PLAN section 13 and are NOT final: the Pro limits need lowering and the
// price is undecided (priceMyr stays null). Change them here before seeding a production project.
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const project = process.env.GCLOUD_PROJECT;
if (!project) {
  console.error("Set GCLOUD_PROJECT to the project id (use demo-myai for the emulator).");
  process.exit(1);
}
const onEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
if (!onEmulator && !process.argv.includes("--confirm")) {
  console.error(`This would write to the REAL project "${project}". Add --confirm if that is what you want.`);
  process.exit(1);
}
const overwrite = process.argv.includes("--overwrite");

const docs = {
  "plans/free": {
    name: "Free",
    dailyLimits: { chats: 20, drafts: 8, images: 3, lessons: 6, workRuns: 6 },
    allowedModels: ["gpt-5.4-nano", "gpt-5.4-mini"],
    searchCap: 5,
    priceMyr: 0,
  },
  "plans/pro": {
    name: "Pro",
    dailyLimits: { chats: 500, drafts: 200, images: 60, lessons: 200, workRuns: 200 },
    allowedModels: ["gpt-5.4-nano", "gpt-5.4-mini"],
    searchCap: 50,
    priceMyr: null,
  },
  "system_settings/public": { maintenanceMode: false, minAppVersion: "0.0.0" },
};

initializeApp({ projectId: project });
const db = getFirestore();
for (const [path, data] of Object.entries(docs)) {
  const ref = db.doc(path);
  if (overwrite) {
    await ref.set(data);
    console.log(`wrote   ${path}`);
  } else {
    try {
      await ref.create(data);
      console.log(`created ${path}`);
    } catch (err) {
      if (err?.code === 6) console.log(`exists  ${path} (left as is)`);
      else throw err;
    }
  }
}
console.log(`Done (${onEmulator ? "emulator" : "real project"} ${project}).`);

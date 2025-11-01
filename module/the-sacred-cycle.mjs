import { TSCActorSheet } from "./tsc-actor-sheet.mjs";

Hooks.once("init", function () {
  console.log("the-sacred-cycle | init");

  // On remplace la fiche core par la nôtre
  try { Actors.unregisterSheet("core", ActorSheet); } catch (e) { /* ignore v13 warning */ }
  Actors.registerSheet("the-sacred-cycle", TSCActorSheet, {
    types: ["character"],
    makeDefault: true,
    label: "TSC.Actor.Character"
  });
});

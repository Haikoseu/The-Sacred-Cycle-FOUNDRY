/***********************************************************************
 * The Sacred Cycle - Actor Sheet (v0.3.7)
 * Compatible Foundry VTT v13+
 ***********************************************************************/

export class TSCActorSheet extends foundry.appv1.sheets.ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["tsc", "sheet", "actor", "character"],
      template: "systems/the-sacred-cycle/templates/actor/character-sheet.hbs",
      width: 980,
      height: 780,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }]
    });
  }

  getData(options) {
    const ctx = super.getData(options);
    const A = this.actor.system || {};
    const mod = v => Math.floor((Number(v) || 0));

    // ATTRIBUTS — base à 0
    const order = ["str","dex","con","int","per","cha"];
    const meta = {
      str:{abbrId:"TSC.Abbr.FOR", nameId:"TSC.Attr.FOR"},
      dex:{abbrId:"TSC.Abbr.DEX", nameId:"TSC.Attr.DEX"},
      con:{abbrId:"TSC.Abbr.CON", nameId:"TSC.Attr.CON"},
      int:{abbrId:"TSC.Abbr.INT", nameId:"TSC.Attr.INT"},
      per:{abbrId:"TSC.Abbr.PER", nameId:"TSC.Attr.PER"},
      cha:{abbrId:"TSC.Abbr.CHA", nameId:"TSC.Attr.CHA"}
    };

    const attrList = order.map(key => {
      const value = Number(A.attributes?.[key]?.value) || 0;
      const bonus = Number(A.attributes?.[key]?.bonus ?? 0);
      const m = mod(value);
      return {
        key,
        abbr: game.i18n.localize(meta[key].abbrId),
        name: game.i18n.localize(meta[key].nameId),
        value,
        bonus,
        mod: m,
        modSigned: (m >= 0 ? `+${m}` : `${m}`),
        total: value + bonus
      };
    });

    const attrOptions = attrList.map(a => ({ key: a.key, abbr: a.abbr }));

    // COMBAT
    const defaults = {
      init:   { labelId:"TSC.Combat.Init",   defaultAttr:"dex", base:0 },
      melee:  { labelId:"TSC.Combat.Melee",  defaultAttr:"str", base:0 },
      ranged: { labelId:"TSC.Combat.Ranged", defaultAttr:"dex", base:0 },
      magic:  { labelId:"TSC.Combat.Magic",  defaultAttr:"int", base:0 }
    };

    const combat = A.combat || {};
    const combatRows = Object.entries(defaults).map(([key, def]) => {
      const row = combat[key] || {};
      const base    = Number(row.base ?? def.base);
      const bonus   = Number(row.bonus ?? 0);
      const attrKey = row.attr || def.defaultAttr;
      const attrVal = Number(A.attributes?.[attrKey]?.value) || 0;
      const attrMod = mod(attrVal);
      return {
        key,
        label: game.i18n.localize(def.labelId),
        base,
        bonus,
        attrKey,
        total: base + bonus + attrMod
      };
    });

    // DÉFENSES
    const D = (A.defenses && A.defenses.def) || {};
    const defTotal =
      (Number(D.base)||0) + (Number(D.armor)||0) + (Number(D.shield)||0) +
      (Number(D.dex)||0)  + (Number(D.action)||0);

    // CONTEXTE
    ctx.system      = A;
    ctx.details     = A.details || {};
    ctx.attrList    = attrList;
    ctx.attrOptions = attrOptions;
    ctx.combatRows  = combatRows;
    ctx.defenses    = A.defenses || { def:{}, malus:{}, dep:{}, rd:{} };
    ctx.defTotal    = defTotal;
    ctx.vitality    = A.vitality || {};
    ctx.states      = A.states || {};
    ctx.resources   = A.resources || { pm:{value:0,max:0}, pc:{value:0,max:0} };
    ctx.weapons     = Array.isArray(A.weapons) ? A.weapons : [];
    return ctx;
  }
}

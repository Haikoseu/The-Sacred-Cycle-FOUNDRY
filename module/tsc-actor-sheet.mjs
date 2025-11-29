export class TSCActorSheet extends foundry.appv1.sheets.ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["tsc", "sheet", "actor", "character"],
      template: "systems/the-sacred-cycle/templates/actor/character-sheet.hbs",
      width: 980,
      height: 780,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }],
      submitOnChange: false,
      closeOnSubmit: false
    });
  }

  /* ------------------------------------------------------------------------ */
  /*  ACTIVATION LISTENERS                                                    */
  /* ------------------------------------------------------------------------ */

  activateListeners(html) {
    super.activateListeners(html);

    const dup = obj => foundry.utils.duplicate(obj);

    const ensurePathsShape = (arr) => {
      const defEntry = () => ({ title: "", text: "", open: false, active: false });
      const defPath  = () => ({
        path: "",
        title: "",
        entries: [defEntry(), defEntry(), defEntry(), defEntry(), defEntry()]
      });
      let out = Array.isArray(arr) ? dup(arr) : [];
      while (out.length < 6) out.push(defPath());
      for (const p of out) {
        if (!Array.isArray(p.entries)) p.entries = [];
        while (p.entries.length < 5) p.entries.push(defEntry());
        p.path  = (p.path  ?? "").toString();
        p.title = (p.title ?? "").toString();
        for (const e of p.entries) {
          e.title  = (e.title ?? "").toString();
          e.text   = (e.text  ?? "").toString();
          e.open   = (e.open === true || e.open === "true");
          e.active = (e.active === true || e.active === "true");
        }
      }
      return out;
    };

    const makeDefaultWeapon = () => ({
      name: "",
      attackType: "melee",
      attackBonus: 0,
      dmgCount: 1,
      dmgDie: "d6",
      useAttr: true,
      attr: "str",
      dmgBonus: 0,
      range: "",
      note: ""
    });

    const writeWeapons = async (mutator) => {
      const current = Array.isArray(this.actor.system?.weapons)
        ? dup(this.actor.system.weapons)
        : [];
      mutator(current);
      await this.actor.update({ "system.weapons": current }, { diff: false });
      this.render(false);
    };

    const writeWholePaths = async (mutator) => {
      const current = this.actor.system?.paths;
      let paths = ensurePathsShape(current);
      mutator(paths);
      await this.actor.update({ "system.paths": paths }, { diff: false, render: false });
    };

    /* ====== CAPROLLS : helpers façon armes ====== */

    const normalizeCapRolls = (raw) => {
      if (Array.isArray(raw)) return dup(raw);
      if (raw && typeof raw === "object") {
        const numericKeys = Object.keys(raw)
          .filter(k => /^\d+$/.test(k))
          .map(Number)
          .sort((a, b) => a - b);
        return numericKeys.map(k => dup(raw[String(k)]));
      }
      return [];
    };

    const makeDefaultCapRoll = () => ({
      title: "",
      pathIndex: 0,
      dice: 1,
      mode: "normal",
      attr: "int",
      rank: 0,
      bonus: 0,
      desc: ""
    });

    const writeCapRolls = async (mutator) => {
      const current = normalizeCapRolls(this.actor.system?.capRolls);
      mutator(current);
      await this.actor.update({ "system.capRolls": current }, { diff: false, render: false });
      this.render(false);
    };

    /* ====== MODS : helpers façon armes ====== */

    const normalizeMods = (raw) => {
      if (Array.isArray(raw)) return dup(raw);
      if (raw && typeof raw === "object") {
        const numericKeys = Object.keys(raw)
          .filter(k => /^\d+$/.test(k))
          .map(Number)
          .sort((a, b) => a - b);
        return numericKeys.map(k => dup(raw[String(k)]));
      }
      return [];
    };

    const makeDefaultMod = () => ({
      target: "int",
      value: 0,
      note: ""
    });

    const writeMods = async (mutator) => {
      const current = normalizeMods(this.actor.system?.mods);
      mutator(current);
      await this.actor.update({ "system.mods": current }, { diff: false, render: false });
      this.render(false);
    };

    /* ====== INVENTAIRE : helpers façon capRolls/mods ====== */

    const normalizeInvItems = (raw) => {
      if (Array.isArray(raw)) return dup(raw);
      if (raw && typeof raw === "object") {
        const numericKeys = Object.keys(raw)
          .filter(k => /^\d+$/.test(k))
          .map(Number)
          .sort((a, b) => a - b);
        return numericKeys.map(k => dup(raw[String(k)]));
      }
      return [];
    };

    const normalizeOtherList = (raw) => {
      if (Array.isArray(raw)) return dup(raw);
      if (raw && typeof raw === "object") {
        const numericKeys = Object.keys(raw)
          .filter(k => /^\d+$/.test(k))
          .map(Number)
          .sort((a, b) => a - b);
        return numericKeys.map(k => dup(raw[String(k)]));
      }
      return [];
    };

    const makeDefaultInvItem = () => ({
      name: "",
      qty: 1
    });

    const makeDefaultOther = () => ({
      name: "",
      value: 0
    });

    const writeInventoryItems = async (mutator) => {
      const current = normalizeInvItems(this.actor.system?.inventory?.items);
      mutator(current);
      await this.actor.update({ "system.inventory.items": current }, { diff: false, render: false });
      this.render(false);
    };

    const writeOtherList = async (mutator) => {
      const current = normalizeOtherList(this.actor.system?.otherResources?.list);
      mutator(current);
      await this.actor.update({ "system.otherResources.list": current }, { diff: false, render: false });
      this.render(false);
    };

    /* ====== Défenses : sauvegarde ====== */
    html.on('change', 'select[name^="system.defenses."][name$=".attr"]', async (ev) => {
      const el = ev.currentTarget;
      await this.actor.update({ [el.name]: el.value }, { diff: false, render: false });
      this.render(false);
    });

    html.on('change blur', 'input[name^="system.defenses."], select[name^="system.defenses."]', ev => {
      const el = ev.currentTarget;
      let val = el.value;
      if (el.type === 'number') val = (el.value === '' ? null : Number(el.value));
      this.actor.update({ [el.name]: val }, { diff: false, render: false });
      this.render(false);
    });

    /* ====== Blessures ====== */
    html.on('change', '.injury-checkbox', async (ev) => {
      const el  = ev.currentTarget;
      const idx = Number(el.dataset.idx ?? el.name.split('.').pop());

      const raw = dup(this.actor.system?.vitality?.injuries ?? []);
      let arr;
      if (Array.isArray(raw)) arr = raw.slice(0, 5);
      else if (raw && typeof raw === "object") {
        arr = Array.from({ length: 5 }, (_, i) => Boolean(raw[i] ?? raw[String(i)]));
      } else {
        arr = [false, false, false, false, false];
      }
      while (arr.length < 5) arr.push(false);

      arr[idx] = !!el.checked;
      const injuriesCount = arr.reduce((n, b) => n + (b ? 1 : 0), 0);

      await this.actor.update({
        "system.vitality.injuries": arr,
        "system.vitality.injuriesCount": injuriesCount
      }, { diff: false, render: false });
      this.render(false);
    });

    /* ====== Recalcul live du seuil de blessure grave ====== */
    html.on('change blur', 'input[name^="system.attributes."]', async (ev) => {
      const el = ev.currentTarget;
      const path = el.name;
      const val = Number(el.value ?? 0);
      await this.actor.update({ [path]: val }, { diff: false, render: false });
      this.render(false);
    });

    /* ====================================================================== */
    /*  ONGLET CAPACITÉS (Voies)                                             */
    /* ====================================================================== */

    const $cap = html.find('.tab[data-tab="capacites"]');

    // Ouverture/fermeture d’un niveau → on enregistre "open"
    $cap.on('toggle', 'details.cap-entry', async (ev) => {
      const d = ev.currentTarget;
      const i = Number(d.dataset.i);
      const j = Number(d.dataset.j);
      const dotPath = `system.paths.${i}.entries.${j}.open`;
      await this.actor.update({ [dotPath]: d.open }, { diff: false, render: false });
    });

    // Bouton 💬 : envoie dans le tchat le niveau de la voie
    $cap.on("click", "button.entry-chat", ev => this._onEntryChat(ev));

    // Évite que cliquer sur ces contrôles replie <details>
    $cap.on('click', '.entry-toggle, .entry-chat, .entry-title', (ev) => ev.stopPropagation());

    // Édition des voies et niveaux
    const onEditPath = async (ev) => {
      const el = ev.currentTarget;
      if (!el?.name?.startsWith("system.paths[")) return;

      let value;
      if (el.type === "checkbox") value = el.checked;
      else if (el.type === "number") value = (el.value === "" ? null : Number(el.value));
      else value = el.value;

      const name = el.name;

      // Entrée (niveau) de voie
      const mEntry = name.match(/^system\.paths\[(\d+)\]\.entries\[(\d+)\]\.(title|text|open|active)$/);
      if (mEntry) {
        const i = Number(mEntry[1]);
        const j = Number(mEntry[2]);
        const field = mEntry[3];

        await writeWholePaths(paths => {
          if (field === "open") paths[i].entries[j].open = (value === true || value === "true");
          else if (field === "active") paths[i].entries[j].active = (value === true || value === "true");
          else paths[i].entries[j][field] = (value ?? "").toString();
        });
        return;
      }

      // Titre / code de voie
      const mVoie = name.match(/^system\.paths\[(\d+)\]\.(title|path)$/);
      if (mVoie) {
        const i = Number(mVoie[1]);
        const field = mVoie[2];

        await writeWholePaths(paths => {
          paths[i][field] = (value ?? "").toString();
        });
        return;
      }
    };

    $cap.on("change", "input, textarea, select", onEditPath);
    $cap.on("blur",   "input, textarea",        onEditPath);

    /* ====================================================================== */
    /*  PANEL OUTILS DE CAPACITÉS                                            */
    /* ====================================================================== */

    const $tools = html.find('.panel.cap-tools');

    // >>> Appliquer l’onglet mémorisé au render <<<
    const currentCapTab = this._capToolsTab || "rolls";
    $tools.find('.subtabs .item').removeClass('active')
      .filter(`[data-tab="${currentCapTab}"]`).addClass('active');
    $tools.find('.subbody .subtab').removeClass('active')
      .filter(`[data-tab="${currentCapTab}"]`).addClass('active');
    // <<<

    // Sous-onglets (Jets / Traits / Mods)
    $tools.on('click', '.subtabs .item', ev => {
      const $a = $(ev.currentTarget);
      const tab = $a.data('tab');

      // mémoriser l’onglet sélectionné
      this._capToolsTab = tab;

      $a.addClass('active').siblings().removeClass('active');
      $tools.find('.subbody .subtab').removeClass('active')
            .filter(`[data-tab="${tab}"]`).addClass('active');
    });

    const write = (path, value) =>
      this.actor.update({ [path]: value }, { diff: false, render: false });

    /* ===== ROLLS : champs (mode armes-like) ===== */
    $tools.on('change blur', 'input[name^="system.capRolls"], select[name^="system.capRolls"]', async ev => {
      const el = ev.currentTarget;
      const m = el.name.match(/^system\.capRolls\.(\d+)\.(.+)$/);
      if (!m) return;
      const idx = Number(m[1]);
      const field = m[2];

      let val;
      if (el.type === "number") {
        val = (el.value === "" ? null : Number(el.value));
      } else {
        val = el.value;
      }

      await writeCapRolls(list => {
        while (list.length <= idx) list.push(makeDefaultCapRoll());
        if (field in list[idx]) {
          list[idx][field] = (val ?? (typeof list[idx][field] === "number" ? 0 : ""));

          // petite normalisation de types
          if (field === "dice" || field === "rank" || field === "bonus") {
            list[idx][field] = Number(list[idx][field] ?? 0);
          } else if (field === "pathIndex") {
            list[idx][field] = Number.isFinite(Number(val)) ? Number(val) : 0;
          } else if (field === "mode") {
            list[idx][field] = String(val || "normal");
          } else if (field === "attr") {
            list[idx][field] = String(val || "int");
          }
        }
      });
    });

    // Ajouter un jet de capacité
    $tools.on('click', '[data-action="caproll-add"]', async () => {
      await writeCapRolls(list => {
        list.push(makeDefaultCapRoll());
      });
    });

    // Supprimer un jet de capacité
    $tools.on('click', '[data-action="caproll-del"]', async ev => {
      const i = Number(ev.currentTarget.dataset.index);
      await writeCapRolls(list => {
        if (i >= 0 && i < list.length) list.splice(i, 1);
      });
    });

    /* ===== TRAITS ===== */
    $tools.on('change blur', 'textarea[name^="system.traits"]', ev => {
      const el = ev.currentTarget;
      write(el.name, el.value);
    });

    /* ===== MODS : edit/add/del (mode armes-like) ===== */
    $tools.on('change blur', 'input[name^="system.mods"], select[name^="system.mods"]', async ev => {
      const el = ev.currentTarget;
      const m = el.name.match(/^system\.mods\.(\d+)\.(target|value|note)$/);
      if (!m) return;

      const idx   = Number(m[1]);
      const field = m[2];
      let val = el.value;

      if (field === "value") {
        val = (el.value === "" ? 0 : Number(el.value));
      }

      await writeMods(list => {
        while (list.length <= idx) list.push(makeDefaultMod());
        const mod = list[idx];

        if (field === "target") {
          mod.target = String(val || "int");
        } else if (field === "note") {
          mod.note = String(val || "");
        } else if (field === "value") {
          mod.value = Number(val || 0);
        }
      });
    });

    $tools.on('click', '[data-action="mod-add"]', async () => {
      await writeMods(list => {
        list.push(makeDefaultMod());
      });
    });

    $tools.on('click', '[data-action="mod-del"]', async ev => {
      const i = Number(ev.currentTarget.dataset.index);
      await writeMods(list => {
        if (i >= 0 && i < list.length) list.splice(i, 1);
      });
    });

    // Évite de replier les <details> parents
    $tools.on(
      'click',
      'input,select,textarea,button:not([data-action="caproll-roll"])',
      ev => ev.stopPropagation()
    );

    /* ====================================================================== */
    /*  INVENTAIRE                                                            */
    /* ====================================================================== */

    const $inv = html.find('.tab[data-tab="inventory"]');

    // changement sur items / autres ressources / crédits
    $inv.on(
      'change blur',
      'input[name^="system.inventory.items"], input[name^="system.otherResources.list"], input[name="system.inventory.credits"]',
      async ev => {
        const el = ev.currentTarget;
        const name = el.name;
        let val = (el.type === "number")
          ? (el.value === "" ? null : Number(el.value))
          : el.value;

        // crédits : simple
        if (name === "system.inventory.credits") {
          await this.actor.update({ [name]: val }, { diff: false, render: false });
          this.render(false);
          return;
        }

        // items d'inventaire
        let m = name.match(/^system\.inventory\.items\.(\d+)\.(name|qty)$/);
        if (m) {
          const idx = Number(m[1]);
          const field = m[2];

          await writeInventoryItems(list => {
            while (list.length <= idx) list.push(makeDefaultInvItem());
            const it = list[idx];
            if (field === "name") {
              it.name = String(val || "");
            } else if (field === "qty") {
              it.qty = (val === null ? 0 : Number(val) || 0);
            }
          });
          return;
        }

        // autres ressources
        m = name.match(/^system\.otherResources\.list\.(\d+)\.(name|value)$/);
        if (m) {
          const idx = Number(m[1]);
          const field = m[2];

          await writeOtherList(list => {
            while (list.length <= idx) list.push(makeDefaultOther());
            const o = list[idx];
            if (field === "name") {
              o.name = String(val || "");
            } else if (field === "value") {
              o.value = (val === null ? 0 : Number(val) || 0);
            }
          });
          return;
        }
      }
    );

    // add/del équipement
    $inv.on('click', '[data-action="inv-add"]', async () => {
      await writeInventoryItems(list => {
        list.push(makeDefaultInvItem());
      });
    });

    $inv.on('click', '[data-action="inv-del"]', async ev => {
      const i = Number(ev.currentTarget.dataset.index);
      await writeInventoryItems(list => {
        if (i >= 0 && i < list.length) list.splice(i, 1);
      });
    });

    // add/del autres ressources
    $inv.on('click', '[data-action="other-add"]', async () => {
      await writeOtherList(list => {
        list.push(makeDefaultOther());
      });
    });

    $inv.on('click', '[data-action="other-del"]', async ev => {
      const i = Number(ev.currentTarget.dataset.index);
      await writeOtherList(list => {
        if (i >= 0 && i < list.length) list.splice(i, 1);
      });
    });

    /* ====================================================================== */
    /*  BIO                                                                   */
    /* ====================================================================== */

    html.on('change blur', 'textarea[name="system.bio"]', async (ev) => {
      await this.actor.update({ "system.bio": ev.currentTarget.value }, { diff: false });
    });

    /* ====================================================================== */
    /*  DÉTAILS                                                              */
    /* ====================================================================== */

    html.on('change blur', 'input[name="name"]', async ev => {
      await this.actor.update({ name: ev.currentTarget.value }, { diff: false, render: false });
    });

    html.on('change blur', 'input[name^="system.details."]', async ev => {
      const el = ev.currentTarget;
      await this.actor.update({ [el.name]: el.value }, { diff: false, render: false });
    });

    // Portrait
    html.on('click', '.file-picker[data-target="system.details.portrait"]', async ev => {
      const fp = new FilePicker({
        type: 'image',
        current: this.actor.getFlag("core", "portrait") || this.actor.system?.details?.portrait || ""
      });
      fp.callback = path => this.actor.update({ "system.details.portrait": path });
      fp.render(true);
    });

    /* ====================================================================== */
    /*  CONFIG (thème, blessures)                                             */
    /* ====================================================================== */

    const isDark = (this.actor.system?.config?.theme === "dark");
    this.element.toggleClass("dark", isDark);

    html.on("change", 'select[name^="system.config"], input[name^="system.config"]', async (ev) => {
      const el = ev.currentTarget;
      let val = el.value;
      if (el.type === "number") val = (el.value === "" ? null : Number(el.value));
      await this.actor.update({ [el.name]: val }, { diff: false, render: false });

      if (el.name === "system.config.theme") {
        this.element.toggleClass("dark", (val === "dark"));
      }
    });

    /* ====================================================================== */
    /*  ARMES / ATTAQUES                                                     */
    /* ====================================================================== */

    html.on("change blur", 'input[name^="system.weapons."], select[name^="system.weapons."]', async ev => {
      const el = ev.currentTarget;
      const m = el.name.match(/^system\.weapons\.(\d+)\.(.+)$/);
      if (!m) return;
      const idx = Number(m[1]);
      const field = m[2];
      let val = el.type === "number" ? Number(el.value || 0) : el.value;

      await writeWeapons(weaps => {
        while (weaps.length <= idx) weaps.push(makeDefaultWeapon());
        const w = weaps[idx];

        switch (field) {
          case "name":
            w.name = val || "";
            break;
          case "range":
            w.range = val || "";
            break;
          case "note":
            w.note = val || "";
            break;
          case "atk.type":
            w.attackType = val || "melee";
            break;
          case "atk.bonus":
            w.attackBonus = Number(val) || 0;
            break;
          case "dmg.count":
            w.dmgCount = Math.max(1, Number(val) || 1);
            break;
          case "dmg.die":
            w.dmgDie = val || "d6";
            break;
          case "dmg.attr":
            if (!val) {
              w.attr = "str";
              w.useAttr = false;
            } else {
              w.attr = val;
              w.useAttr = true;
            }
            break;
          case "dmg.bonus":
            w.dmgBonus = Number(val) || 0;
            break;
        }
      });
    });

    html.on("click", '[data-action="weapon-add"]', async () => {
      await writeWeapons(weaps => {
        weaps.push(makeDefaultWeapon());
      });
    });

    html.on("click", '[data-action="del-weapon"]', async ev => {
      const idx = Number(ev.currentTarget.dataset.index);
      await writeWeapons(weaps => {
        if (idx >= 0 && idx < weaps.length) weaps.splice(idx, 1);
      });
    });

    /* ====================================================================== */
    /*  BOUTONS DE JET                                                        */
    /* ====================================================================== */

    html.on("click", 'button[data-action="roll-attr"]',  ev => this._onAttrRoll(ev));
    html.on("click", 'button[data-action="roll-combat"]', ev => this._onCombatRoll(ev));
    html.on("click", 'button[data-action="roll-def"]',    ev => this._onDefenseRoll(ev));
    html.on("click", '[data-action="weapon-roll"]',       ev => this._onWeaponRoll(ev));
    html.on("click", '[data-action="caproll-roll"]',      ev => this._onCapRoll(ev));
  }

  /* ------------------------------------------------------------------------ */
  /*  PROTECTION DES ARMES À LA SOUMISSION DU FORMULAIRE                      */
  /* ------------------------------------------------------------------------ */

  async _updateObject(event, formData) {
    const data = foundry.utils.duplicate(formData);
    for (const key of Object.keys(data)) {
      if (key === "system.weapons" || key.startsWith("system.weapons.")) {
        delete data[key];
      }
    }
    return super._updateObject(event, data);
  }

  /* ------------------------------------------------------------------------ */
  /*  HELPERS NUMÉRIQUES / RÈGLES                                            */
  /* ------------------------------------------------------------------------ */

  _sumMods(target) {
    const raw = this.actor.system?.mods;
    let mods;

    if (Array.isArray(raw)) {
      mods = raw;
    } else if (raw && typeof raw === "object") {
      const numericKeys = Object.keys(raw)
        .filter(k => /^\d+$/.test(k))
        .map(Number)
        .sort((a, b) => a - b);
      mods = numericKeys.map(k => raw[String(k)]);
    } else {
      return 0;
    }

    return mods
      .filter(m => m && m.target === target)
      .reduce((s, m) => s + (Number(m.value) || 0), 0);
  }

  // Total “carac” = base + mods
  _getAttrTotal(attrKey) {
    const A = this.actor.system;
    if (!A) return 0;
    const base = Number(A.attributes?.[attrKey]?.value ?? 0);
    const mods = this._sumMods(attrKey);
    return base + mods;
  }

  _getCombatTotal(key) {
    const A = this.actor.system;
    if (!A) return 0;
    const combat = A.combat || {};
    const defaults = { init: "dex", melee: "str", ranged: "dex", magic: "int" };
    const row = combat[key] || {};
    const base = Number(row.base ?? 0);
    const attrKey = row.attr || defaults[key] || "dex";
    const attrTotal = this._getAttrTotal(attrKey);
    const mods = this._sumMods(key);
    return base + attrTotal + mods;
  }

  _getDefenseTotal(key) {
    const A = this.actor.system;
    if (!A) return 0;
    const defaults = { def: "dex", dem: "int" };
    const row = A.defenses?.[key] || {};
    const base   = Number(row.base   ?? 0);
    const armor  = Number(row.armor  ?? 0);
    const shield = Number(row.shield ?? 0);
    const attrKey = row.attr || defaults[key] || "dex";
    const attrVal = this._getAttrTotal(attrKey);
    const mods = this._sumMods(key);
    return base + armor + shield + attrVal + mods;
  }

  // Pour CapRolls : déduire le “niveau” courant d’une voie
  _getPathLevelInfo(pathIndex) {
    const paths = this.actor.system?.paths;
    if (!Array.isArray(paths)) return null;
    const p = paths[pathIndex];
    if (!p) return null;

    const entries = Array.isArray(p.entries) ? p.entries : [];

    // Nombre de cases cochées (entries actives) dans la voie
    const checkedCount = entries.reduce((n, e) => n + (e?.active ? 1 : 0), 0);

    let idx = entries.findIndex(e => e?.active);
    if (idx === -1) {
      idx = entries.findIndex(e => (e?.title || e?.text));
    }
    if (idx === -1) {
      return {
        pathTitle: p.title || p.path || `Path ${pathIndex + 1}`,
        levelIndex: null,
        levelTitle: "",
        levelText: "",
        checkedCount
      };
    }

    const e = entries[idx] || {};
    return {
      pathTitle: p.title || p.path || `Path ${pathIndex + 1}`,
      levelIndex: idx,
      levelTitle: e.title || "",
      levelText: e.text || "",
      checkedCount
    };
  }

  async _rollFormula(formula, { flavor } = {}) {
    const roll = new Roll(formula);
    await roll.evaluate({ async: true });
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    return roll.toMessage({
      speaker,
      flavor,
      rollMode: game.settings.get("core", "rollMode") ?? "roll"
    });
  }

  async _rollD20(total, { flavor } = {}) {
    let formula = "1d20";
    if (total) {
      const sign = total >= 0 ? "+" : "-";
      const abs = Math.abs(total);
      formula += ` ${sign} ${abs}`;
    }
    return this._rollFormula(formula, { flavor });
  }

  /* ------------------------------------------------------------------------ */
  /*  HANDLERS DE JET                                                        */
  /* ------------------------------------------------------------------------ */

  async _onAttrRoll(ev) {
    ev.preventDefault();
    const btn = ev.currentTarget;
    const attrKey = btn.dataset.attr;
    const label = btn.dataset.label || attrKey;
    const total = this._getAttrTotal(attrKey);
    const flavor = `${label} (${game.i18n.localize("TSC.Panel.Carac")})`;
    await this._rollD20(total, { flavor });
  }

  async _onCombatRoll(ev) {
    ev.preventDefault();
    const btn = ev.currentTarget;
    const key = btn.dataset.key;
    const label = btn.dataset.label || key;
    const total = this._getCombatTotal(key);
    const flavor = `${label} (${game.i18n.localize("TSC.Panel.Combat")})`;
    await this._rollD20(total, { flavor });
  }

  async _onDefenseRoll(ev) {
    ev.preventDefault();
    const btn = ev.currentTarget;
    const key = btn.dataset.key || btn.dataset.def || "def";
    const label =
      key === "def" ? game.i18n.localize("TSC.Def.DEF") :
      key === "dem" ? game.i18n.localize("TSC.Def.DEM") :
      key;
    const total = this._getDefenseTotal(key);
    const flavor = `${label} (${game.i18n.localize("TSC.Section.Defenses")})`;
    await this._rollD20(total, { flavor });
  }

  async _onWeaponRoll(ev) {
    ev.preventDefault();
    const idx = Number(ev.currentTarget.dataset.index);
    const weaps = this.actor.system?.weapons;
    if (!Array.isArray(weaps)) return;
    const w = weaps[idx];
    if (!w) return;

    const name = w.name || game.i18n.localize("TSC.Weapons.Title");

    // Attaque : 1d20 + [combat type] + bonus
    const atkType = w.attackType || "melee";
    const baseCombat = this._getCombatTotal(atkType);
    const extra = Number(w.attackBonus ?? 0);
    const atkTotal = baseCombat + extra;
    const atkFlavor = `${game.i18n.localize("TSC.Weapons.Attack")} – ${name}`;
    await this._rollD20(atkTotal, { flavor: atkFlavor });

    // Dégâts : XdY + CARAC (si useAttr) + bonus
    const count = Math.max(1, Number(w.dmgCount ?? 1));
    const die   = String(w.dmgDie || "d6");
    const parts = [`${count}${die}`];

    if (w.useAttr && w.attr) {
      const attrBonus = this._getAttrTotal(w.attr);
      if (attrBonus) parts.push(attrBonus);
    }

    const dmgBonus = Number(w.dmgBonus ?? 0);
    if (dmgBonus) parts.push(dmgBonus);

    const dmgFormula = parts.join(" + ");
    const dmgFlavor = `${game.i18n.localize("TSC.Weapons.Damage")} – ${name}`;
    await this._rollFormula(dmgFormula, { flavor: dmgFlavor });
  }

  async _onCapRoll(ev) {
    ev.preventDefault();
    const idx = Number(ev.currentTarget.dataset.index);
    const rolls = this.actor.system?.capRolls;
    if (!Array.isArray(rolls)) return;
    const r = rolls[idx];
    if (!r) return;

    const dice = Math.max(1, Number(r.dice ?? 1));
    let formulaDice = `${dice}d20`;
    if (dice > 1) {
      if (r.mode === "best") formulaDice += "kh1";
      else if (r.mode === "worst") formulaDice += "kl1";
    }

    let bonusParts = [];
    let attrBonus = 0;
    let attrLabel = "";

    const attrKey = typeof r.attr === "string" ? r.attr : "int";
    const attrList = ["str", "dex", "con", "int", "per", "cha"];

    // ===== bonus de caractéristique (INT, DEX, etc.) =====
    if (attrList.includes(attrKey)) {
      // Utilise la même logique que les caracs (base + mods)
      attrBonus = this._getAttrTotal(attrKey);
      const abbrId = `TSC.Abbr.${attrKey.toUpperCase()}`;
      attrLabel = game.i18n.localize(abbrId);
    } else if (["init", "melee", "ranged", "magic"].includes(attrKey)) {
      // Ou un des 4 scores de combat
      attrBonus = this._getCombatTotal(attrKey);
      const labelMap = {
        init: "TSC.Combat.Init",
        melee: "TSC.Combat.Melee",
        ranged: "TSC.Combat.Ranged",
        magic: "TSC.Combat.Magic"
      };
      attrLabel = game.i18n.localize(labelMap[attrKey]);
    }

    if (attrBonus) bonusParts.push(attrBonus);

    // ===== bonus numérique manuel =====
    const bonus = Number(r.bonus ?? 0);
    if (bonus) bonusParts.push(bonus);

    // ===== bonus = nombre de cases cochées dans la voie =====
    const pathIndex = Number(r.pathIndex ?? 0);
    const pathInfo = this._getPathLevelInfo(pathIndex);

    let checkedBonus = 0;
    if (pathInfo && pathInfo.checkedCount) {
      checkedBonus = Number(pathInfo.checkedCount) || 0;
      if (checkedBonus) bonusParts.push(checkedBonus);
    }

    let formula = formulaDice;
    if (bonusParts.length) {
      formula += " + " + bonusParts.join(" + ");
    }

    // Flavor : nom du jet + carac + voie + niveau + descriptions + nb cases cochées
    let flavorParts = [];

    if (r.title) flavorParts.push(r.title);
    else flavorParts.push(game.i18n.localize("TSC.Tools.Tabs.Rolls"));

    if (attrLabel) {
      // ex. [INT]
      flavorParts.push(`[${attrLabel}]`);
    }

    if (pathInfo) {
      const levelLabel = pathInfo.levelIndex != null
        ? `Niveau ${pathInfo.levelIndex + 1}`
        : null;

      let pathLine = pathInfo.pathTitle || "";
      if (levelLabel || pathInfo.levelTitle) {
        pathLine += " – ";
        if (levelLabel) pathLine += levelLabel + " ";
        if (pathInfo.levelTitle) pathLine += pathInfo.levelTitle;
      }

      // Ajout visuel du nombre de cases cochées, par ex. (3●)
      if (pathInfo.checkedCount) {
        pathLine += ` (${pathInfo.checkedCount}●)`;
      }

      if (pathLine) flavorParts.push(pathLine);
      if (pathInfo.levelText) flavorParts.push(pathInfo.levelText);
    }

    if (r.desc) flavorParts.push(r.desc);

    const flavor = flavorParts.join("\n");

    await this._rollFormula(formula, { flavor });
  }

  /* ------------------------------------------------------------------------ */
  /*  ENVOI D’UN NIVEAU DE VOIE DANS LE CHAT                                  */
  /* ------------------------------------------------------------------------ */

  async _onEntryChat(ev) {
    ev.preventDefault();
    const btn = ev.currentTarget;
    const i = Number(btn.dataset.i);
    const j = Number(btn.dataset.j);

    const paths = this.actor.system?.paths;
    if (!Array.isArray(paths)) return;
    const p = paths[i];
    if (!p) return;

    const entries = Array.isArray(p.entries) ? p.entries : [];
    const e = entries[j];
    if (!e) return;

    const pathTitle  = p.title || p.path || `Voie ${i + 1}`;
    const levelTitle = e.title || game.i18n.localize("TSC.Cap.EntryTitle");
    const levelText  = e.text || "";

    const esc = foundry.utils.escapeHTML;
    let content = `<h2>${esc(pathTitle)} – ${esc(levelTitle)}</h2>`;
    if (levelText) {
      const safeText = esc(levelText).replace(/\r?\n/g, "<br>");
      content += `<p>${safeText}</p>`;
    }

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content
    });
  }

  /* ------------------------------------------------------------------------ */
  /*  GETDATA                                                                 */
  /* ------------------------------------------------------------------------ */

  getData(options) {
    const ctx = super.getData(options);
    const A = this.actor.system || {};

    /* ===== MODS (source unique) ===== */
    let modsRaw;
    if (Array.isArray(A.mods)) {
      modsRaw = foundry.utils.duplicate(A.mods);
    } else if (A.mods && typeof A.mods === "object") {
      const numericKeys = Object.keys(A.mods)
        .filter(k => /^\d+$/.test(k))
        .map(Number)
        .sort((a, b) => a - b);
      modsRaw = numericKeys.map(k => foundry.utils.duplicate(A.mods[String(k)]));
    } else {
      modsRaw = [];
    }

    const sumModsFor = (key) =>
      modsRaw
        .filter(m => m?.target === key)
        .reduce((s, m) => s + (Number(m?.value) || 0), 0);

    /* ===== ATTRIBUTS ===== */
    const order = ["str", "dex", "con", "int", "per", "cha"];
    const meta = {
      str: { abbrId: "TSC.Abbr.FOR", nameId: "TSC.Attr.FOR" },
      dex: { abbrId: "TSC.Abbr.DEX", nameId: "TSC.Attr.DEX" },
      con: { abbrId: "TSC.Abbr.CON", nameId: "TSC.Attr.CON" },
      int: { abbrId: "TSC.Abbr.INT", nameId: "TSC.Attr.INT" },
      per: { abbrId: "TSC.Abbr.PER", nameId: "TSC.Attr.PER" },
      cha: { abbrId: "TSC.Abbr.CHA", nameId: "TSC.Attr.CHA" }
    };

    const attrList = order.map(key => {
      const base = Number(A.attributes?.[key]?.value) || 0;
      const mods = sumModsFor(key);
      const total = base + mods;
      return {
        key,
        abbr: game.i18n.localize(meta[key].abbrId),
        name: game.i18n.localize(meta[key].nameId),
        value: base,
        mod: mods,
        modSigned: (mods >= 0 ? `+${mods}` : `${mods}`),
        total
      };
    });

    const attrOptions = attrList.map(a => ({ key: a.key, abbr: a.abbr }));

    /* ===== Blessures / Seuil ===== */
    let injuriesRaw = (A.vitality && A.vitality.injuries) || [];
    let injuries = Array.from({ length: 5 }, (_, i) => Boolean(injuriesRaw[i]));
    const injuriesCount = injuries.filter(Boolean).length;

    const strVal = Number(A.attributes?.str?.value ?? 0);
    const conVal = Number(A.attributes?.con?.value ?? 0);
    const seriousThreshold = 10 + strVal + conVal;

    ctx.injuries = injuries;
    ctx.injuriesCount = injuriesCount;
    ctx.seriousThreshold = seriousThreshold;

    /* ===== COMBAT ===== */
    const defaults = {
      init:   { labelId: "TSC.Combat.Init",   defaultAttr: "dex", base: 0 },
      melee:  { labelId: "TSC.Combat.Melee",  defaultAttr: "str", base: 0 },
      ranged: { labelId: "TSC.Combat.Ranged", defaultAttr: "dex", base: 0 },
      magic:  { labelId: "TSC.Combat.Magic",  defaultAttr: "int", base: 0 }
    };

    const combat = A.combat || {};
    const combatRows = Object.entries(defaults).map(([key, def]) => {
      const row = combat[key] || {};
      const base    = Number(row.base ?? def.base);
      const attrKey = row.attr || def.defaultAttr;

      const attrBase = Number(A.attributes?.[attrKey]?.value ?? 0);
      const attrMods = sumModsFor(attrKey);
      const attrVal  = attrBase + attrMods;
      const attrMod  = attrVal;

      const rowMods  = sumModsFor(key);
      const total    = base + attrMod + rowMods;

      // mod = mods de carac + mods de la ligne combat
      const combinedMod = attrMod + rowMods;

      return {
        key,
        label: game.i18n.localize(def.labelId),
        base,
        attrKey,
        mod: combinedMod,
        modSigned: (combinedMod >= 0 ? `+${combinedMod}` : `${combinedMod}`),
        total
      };
    });

    /* ===== DÉFENSES ===== */
    const D  = A.defenses?.def ?? {};
    const DM = A.defenses?.dem ?? {};

    const validAttr = new Set(["str", "dex", "con", "int", "per", "cha"]);
    const defAttrKey = validAttr.has(D.attr)  ? D.attr  : "dex";
    const demAttrKey = validAttr.has(DM.attr) ? DM.attr : "int";

    const defAttrBase = Number(A.attributes?.[defAttrKey]?.value ?? 0);
    const demAttrBase = Number(A.attributes?.[demAttrKey]?.value ?? 0);

    const defAttrMods = sumModsFor(defAttrKey);
    const demAttrMods = sumModsFor(demAttrKey);

    const defAttrVal  = defAttrBase + defAttrMods;
    const demAttrVal  = demAttrBase + demAttrMods;

    const defAttrMod = defAttrVal;
    const demAttrMod = demAttrVal;

    const defModSum = sumModsFor("def");
    const demModSum = sumModsFor("dem");

    const defTotal = (Number(D.base) || 0)
                   + (Number(D.armor) || 0)
                   + (Number(D.shield) || 0)
                   + defAttrMod + defModSum;

    const demTotal = (Number(DM.base) || 0)
                   + (Number(DM.armor) || 0)
                   + (Number(DM.shield) || 0)
                   + demAttrMod + demModSum;

    // afficher carac + mods DEF/DEM dans la colonne mod
    const defCombinedMod = defAttrMod + defModSum;
    const demCombinedMod = demAttrMod + demModSum;

    ctx.defenses         = A.defenses || { def: {}, dem: {} };
    ctx.defAttrKey       = defAttrKey;
    ctx.demAttrKey       = demAttrKey;
    ctx.defAttrModSigned = (defCombinedMod >= 0 ? `+${defCombinedMod}` : `${defCombinedMod}`);
    ctx.demAttrModSigned = (demCombinedMod >= 0 ? `+${demCombinedMod}` : `${demCombinedMod}`);
    ctx.defTotal         = defTotal;
    ctx.demTotal         = demTotal;

    /* ===== CONTEXTE GÉNÉRAL ===== */
    ctx.system      = A;
    ctx.details     = A.details || {};
    ctx.attrList    = attrList;
    ctx.attrOptions = attrOptions;
    ctx.combatRows  = combatRows;

    /* ===== CAPACITÉS / VOIES ===== */
    const defaultEntry = () => ({ title: "", text: "", open: false, active: false });
    const defaultPath  = () => ({
      path: "",
      title: "",
      entries: [defaultEntry(), defaultEntry(), defaultEntry(), defaultEntry(), defaultEntry()]
    });

    let pathsRaw = foundry.utils.getProperty(this.actor, "system.paths");
    let paths;
    if (Array.isArray(pathsRaw)) {
      paths = foundry.utils.duplicate(pathsRaw);
    } else if (pathsRaw && typeof pathsRaw === "object") {
      const numericKeys = Object.keys(pathsRaw)
        .filter(k => /^\d+$/.test(k))
        .map(Number)
        .sort((a, b) => a - b);
      paths = numericKeys.map(k => foundry.utils.duplicate(pathsRaw[String(k)]));
    } else {
      paths = [];
    }

    while (paths.length < 6) paths.push(defaultPath());
    for (const v of paths) {
      if (!Array.isArray(v.entries)) v.entries = [];
      while (v.entries.length < 5) v.entries.push(defaultEntry());
    }

    ctx.paths = paths;

    // Options de voies pour les jets
    const pathOptions = (ctx.paths || []).map((p, idx) =>
      p?.title?.trim() ? p.title : `Voie ${idx + 1}`
    );

    // capRolls : normalisation tableau (objet -> tableau si besoin)
    const rollModes = ["normal", "best", "worst"];
    let capRaw = A.capRolls;
    let capRolls;

    if (Array.isArray(capRaw)) {
      capRolls = foundry.utils.duplicate(capRaw);
    } else if (capRaw && typeof capRaw === "object") {
      const numericKeys = Object.keys(capRaw)
        .filter(k => /^\d+$/.test(k))
        .map(Number)
        .sort((a, b) => a - b);
      capRolls = numericKeys.map(k => foundry.utils.duplicate(capRaw[String(k)]));
    } else {
      capRolls = [];
    }

    if (capRolls.length === 0) {
      capRolls.push({
        title: "",
        pathIndex: 0,
        dice: 1,
        mode: "normal",
        attr: "int",
        rank: 0,
        bonus: 0,
        desc: ""
      });
    }

    capRolls = capRolls.map(r => ({
      title: (r.title ?? "").toString(),
      pathIndex: Number.isFinite(Number(r.pathIndex)) ? Number(r.pathIndex) : 0,
      dice: Math.max(1, Number(r.dice ?? 1)),
      mode: rollModes.includes(r.mode) ? r.mode : "normal",
      attr: typeof r.attr === "string" ? r.attr : "int",
      rank: Math.max(0, Number(r.rank ?? 0)),
      bonus: Number(r.bonus ?? 0),
      desc: (r.desc ?? "").toString()
    }));

    const traits = foundry.utils.mergeObject(
      { knowledge: "", languages: "", relations: "", notes: "" },
      A.traits ?? {},
      { inplace: false }
    );

    const mods = modsRaw.map(m => ({
      target: (m.target ?? "int").toString(),
      value: Number(m.value ?? 0),
      note: (m.note ?? "").toString()
    }));

    const modTargetOptions = [
      { key: "str",    label: game.i18n.localize("TSC.Abbr.FOR") },
      { key: "dex",    label: game.i18n.localize("TSC.Abbr.DEX") },
      { key: "con",    label: game.i18n.localize("TSC.Abbr.CON") },
      { key: "int",    label: game.i18n.localize("TSC.Abbr.INT") },
      { key: "per",    label: game.i18n.localize("TSC.Abbr.PER") },
      { key: "cha",    label: game.i18n.localize("TSC.Abbr.CHA") },
      { key: "init",   label: game.i18n.localize("TSC.Combat.Init") },
      { key: "melee",  label: game.i18n.localize("TSC.Combat.Melee") },
      { key: "ranged", label: game.i18n.localize("TSC.Combat.Ranged") },
      { key: "magic",  label: game.i18n.localize("TSC.Combat.Magic") },
      { key: "def",    label: game.i18n.localize("TSC.Def.DEF") },
      { key: "dem",    label: game.i18n.localize("TSC.Def.DEM") },
      { key: "hp",     label: game.i18n.localize("TSC.HP") },
      { key: "mp",     label: game.i18n.localize("TSC.MP") },
      { key: "lp",     label: game.i18n.localize("TSC.LP") }
    ];

    ctx.capRolls         = capRolls;
    ctx.traits           = traits;
    ctx.mods             = mods;
    ctx.pathOptions      = pathOptions;
    ctx.modTargetOptions = modTargetOptions;

    /* ===== INVENTAIRE ===== */
    const inv = A.inventory ?? {};
    const items = Array.isArray(inv.items) ? foundry.utils.duplicate(inv.items) : [];
    ctx.invItems = items;

    const other = A.otherResources ?? {};
    ctx.otherList = Array.isArray(other.list) ? foundry.utils.duplicate(other.list) : [];

    /* ===== BIO ===== */
    ctx.bio      = A.bio || "";
    ctx.owner    = this.actor.isOwner ?? true;
    ctx.editable = this.isEditable ?? true;

    /* ===== VITALITY / RESSOURCES ===== */
    ctx.vitality  = A.vitality ?? { dv: "d10", hp: { value: 0, max: 0 }, temp: 0 };
    ctx.resources = A.resources ?? { pm: { value: 0, max: 0 }, pc: { value: 0, max: 0 } };

    /* ===== ARMES / ATTAQUES (vue UI) ===== */
    const weaponsRaw = Array.isArray(A.weapons) ? foundry.utils.duplicate(A.weapons) : [];
    const weaponDieOptions = ["d4", "d6", "d8", "d10", "d12"];
    const weaponsUI = weaponsRaw.map(w => ({
      name: w.name ?? "",
      range: w.range ?? "",
      note:  w.note ?? "",
      atk: {
        type: w.attackType ?? "melee",
        bonus: Number(w.attackBonus ?? 0)
      },
      dmg: {
        count: Number(w.dmgCount ?? 1),
        die:   w.dmgDie ?? "d6",
        attr:  w.useAttr === false ? "" : (w.attr ?? "str"),
        bonus: Number(w.dmgBonus ?? 0)
      }
    }));

    ctx.weapons           = weaponsRaw;
    ctx.weaponsUI         = weaponsUI;
    ctx.weaponDieOptions  = weaponDieOptions;

    // options pour le select de carac de dégâts : utiliser "label" pour coller au HBS
    const weaponAttrOptions = attrOptions.map(o => ({
      key: o.key,
      label: o.abbr
    }));
    ctx.weaponAttrOptions = weaponAttrOptions;

    /* ===== CONFIG / LOGO ===== */
    const cfg = A.config ?? { theme: "light", injury: { mode: "flat", value: 2 } };
    ctx.config = {
      theme: (cfg.theme === "dark") ? "dark" : "light",
      injury: {
        mode: (cfg.injury?.mode === "dice") ? "dice" : "flat",
        value: Number(cfg.injury?.value ?? 2)
      }
    };

    ctx.systemVersion = game.system?.version ?? game.system?.data?.version ?? "";
    ctx.systemTitle   = game.system?.title ?? "The Sacred Cycle";

    ctx.systemLogo0 = "systems/the-sacred-cycle/assets/logo0.png";
    ctx.systemLogo1 = "systems/the-sacred-cycle/assets/logo1.png";
    ctx.systemLogo2 = "systems/the-sacred-cycle/assets/logo2.png";

    return ctx;
  }
}
/**
 * `bindVehicleRow` — one printed table row as a vehicle actor.
 *
 * What this pins is the READING of the table's own conventions: a slashed pair
 * is normal-then-heavy and becomes two speed tiers, a parenthesised cargo
 * figure is the passengers-or-cargo trade, and a crew column is a complement,
 * a driver-plus-warriors split, or a choice between two passenger counts.
 *
 * No book text or values are reproduced. The rows below are shaped like the
 * printed ones with invented numbers.
 */
import assert from "node:assert";
import { bindVehicleRow } from "../scripts/cookbook.mjs";

let pass = 0;
const check = (label, cond) => { assert.ok(cond, label); pass++; };

const entry = { book: "rr", cite: "RR p.999", icon: "icons/svg/stone-path.svg" };
const row = (label, cells) => ({ key: "x", label, cells });
const build = (label, cells) => bindVehicleRow(row(label, cells), entry, "def.vehicle.landTable");

/* A cart: one driver, a slashed speed and a slashed cargo. */
const cart = build("cart, Big (1 heavy horse)", {
  crew: "1", movement: "70’/35’", expedition: "14 / 7", cargo: "90 / 130", ac: 0, shp: 4, cost: "55gp",
});
check("it is an actor sub-type, not an item", cart.type === "acks-extras.vehicle");
check("the label becomes the name, small-cap initial restored", cart.name === "Cart, Big (1 heavy horse)");
check("land is the kind", cart.system.kind === "land");
check("capacity is the NORMAL figure", cart.system.cargo.capacityStone === 90);
check("two printed pairs become two tiers", cart.system.speeds.tiers.length === 2);
check("the normal tier pairs load with speed", cart.system.speeds.tiers[0].maxLoadStone === 90 && cart.system.speeds.tiers[0].feetPerTurn === 70);
check("the heavy tier is the slower one", cart.system.speeds.tiers[1].maxLoadStone === 130 && cart.system.speeds.tiers[1].feetPerTurn === 35);
check("a lone crew figure is the driver", cart.system.crew.roles.length === 1 && cart.system.crew.roles[0].required === 1);
check("the driver is motive", cart.system.crew.roles[0].motive === true);
check("ac is carried", cart.system.ac === 0);
check("shp fills value and max", cart.system.shp.value === 4 && cart.system.shp.max === 4);

/* A chariot: driver plus warriors. */
const chariot = build("chariot, Big (4 light horses)", {
  crew: "1 + 3", movement: "100’/50’", cargo: "70 / 140", ac: 2, shp: 2,
});
check("a plus splits into two roles", chariot.system.crew.roles.length === 2);
check("the driver comes first", chariot.system.crew.roles[0].key === "driver" && chariot.system.crew.roles[0].required === 1);
check("warriors are the second role", chariot.system.crew.roles[1].required === 3);
check("warriors are NOT motive", chariot.system.crew.roles[1].motive === false);

/* A howdah: a choice of passenger counts, and cargo in parentheses. */
const howdah = build("Howdah,riding (huge creature)", {
  crew: "2 or 4", movement: "By creature", expedition: "By creature", cargo: "(7)", ac: 0, shp: 1,
});
check("a comma losing its space at a line break is repaired", howdah.name === "Howdah, riding (huge creature)");
check("a choice fills passengers, not a crew role", howdah.system.cargo.passengers === 2);
check("a howdah gets no crew roles", howdah.system.crew === undefined);
check("the parenthesised figure is still the capacity", howdah.system.cargo.capacityStone === 7);
check("a trading vehicle gets no speed tiers", howdah.system.speeds === undefined);

/* Degenerate rows must not throw or invent. */
const bare = build("Sledge", {});
check("a bare row still names the vehicle", bare.name === "Sledge");
check("a bare row has no cargo", bare.system.cargo === undefined);
check("a bare row has no crew", bare.system.crew === undefined);
check("a bare row has no tiers", bare.system.speeds === undefined);

const noPair = build("Barrow", { crew: "1", movement: "40’", cargo: "20" });
check("a single figure yields one tier", noPair.system.speeds.tiers.length === 1);
check("that tier keeps the only speed", noPair.system.speeds.tiers[0].feetPerTurn === 40);

console.log(`test-vehicles: all ${pass} checks passed`);

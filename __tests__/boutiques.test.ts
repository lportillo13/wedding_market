import assert from 'node:assert/strict';
import test from 'node:test';
import { costaRicaDateTime,appointmentLabel,boutiqueText,outfitDetailKeys } from '../shared/boutiques/types';
import { boutiqueCopy } from '../shared/boutiques/copy';
test('fitting times use Costa Rica offset and reject impossible dates',()=>{
 assert.equal(costaRicaDateTime('2027-04-03','15:30'),'2027-04-03T15:30:00-06:00');
 assert.equal(costaRicaDateTime('2027-02-31','12:00'),null);
 assert.equal(costaRicaDateTime('2027-04-03','24:00'),null);
 assert.equal(costaRicaDateTime('2027-04-03','22:00'),'2027-04-03T22:00:00-06:00');
 assert.match(appointmentLabel('2027-04-03T21:30:00Z','en'),/3:30/);
});
test('both languages and garment types expose the same feature contract',()=>{
 assert.deepEqual(Object.keys(boutiqueCopy.en).sort(),Object.keys(boutiqueCopy.es).sort());
 assert.equal(boutiqueText({en:'',es:'Vestido'},'en'),'Vestido');
 assert.ok(outfitDetailKeys.dress.includes('silhouette'));assert.ok(outfitDetailKeys.suit.includes('lapel'));
});

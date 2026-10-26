import test from 'node:test';
import assert from 'node:assert/strict';
import { compareCatalogs } from './compare-catalogs.mjs';

const catalog = () => ({ columns: [{ table: 'quotes', column: 'id', nullable: 'NO' }], constraints: [{ table: 'quotes', name: 'quotes_pkey', type: 'p', definition: 'PRIMARY KEY (id)' }], indexes: [], policies: [], functions: [], views: [] });

test('PG17/PG18 catalog differences do not hide an actual nullability change', () => {
  const local = catalog(), live = catalog();
  local.constraints.push({ table: 'quotes', name: 'quotes_id_not_null', type: 'n' });
  assert.equal(compareCatalogs(local, live).matches, true);
  live.columns[0].nullable = 'YES';
  assert.deepEqual(compareCatalogs(local, live).groups.columns.differences, ['quotes.id']);
});

test('different policies, function bodies and missing constraints are detected', () => {
  const local = catalog(), live = catalog();
  local.functions.push({ name: 'accept_quote', arguments: 'id uuid', source_md5: 'one' });
  live.functions.push({ name: 'accept_quote', arguments: 'id uuid', source_md5: 'two' });
  live.constraints = [];
  live.policies.push({ table: 'quotes', name: 'unexpected_public_read', qual: 'true' });
  const result = compareCatalogs(local, live);
  assert.equal(result.matches, false);
  assert.equal(result.groups.functions.differences.length, 1);
  assert.equal(result.groups.constraints.differences.length, 1);
  assert.equal(result.groups.policies.differences.length, 1);
});

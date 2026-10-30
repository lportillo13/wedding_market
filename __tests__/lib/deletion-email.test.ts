import assert from 'node:assert/strict';
import test from 'node:test';
import {buildDeletionEmail} from '../../features/accounts/server/deletion-email';

test('deletion receipts use the localized shared brand, preserve reference and privacy terms', () => {
  for (const language of ['en', 'es']) {
    const email = buildDeletionEmail({id:'reference-123', contact_email:'owner@example.com', language});
    assert.equal(email.to, 'owner@example.com');
    assert.equal(email.idempotencyKey, 'account-deletion-reference-123');
    assert.match(email.html, /#faf8f4/);
    assert.match(email.html, /#332d27/);
    assert.match(email.html, new RegExp(`lang="${language}"`));
    assert.match(email.html, /reference-123/);
    assert.match(email.html, /href="https:\/\/thewedmarket.com\/privacy"/);
    assert.match(email.text, language === 'es' ? /no se cancelan/ : /not cancelled/);
  }
});

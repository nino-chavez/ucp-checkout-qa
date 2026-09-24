# Chrome runner (Claude in Chrome, no terminal)

Use this runner when Claude in Chrome tools are available (`navigate`, `computer`, `get_page_text`, `javascript_tool`, `find`). It needs no terminal, Node, or browse-tool. Claude drives the tester's own Chrome, and reports go to Google Drive through the Google Drive connector.

The test rules are the same for both runners: [protocol.md](protocol.md) covers evidence and verdicts, and [owner-routing.md](owner-routing.md) covers owners. The field names in protocol.md come from the command-line runner; record the same readings here under the same names.

Proven on 2026-09-23 against the KONG Halloween Snuzzles Ghost product: the screenshot reading and the store quote both matched the command-line run to the cent. On 2026-09-24 the run-owned cleanup and the rendered checkout read were checked on the same product; the page showed the same $11.90 as the API, and cleanup left an unrelated cart item in place. That is still one product. Treat screenshot readings as needing a second look whenever a number drives a finding.

## Setup check (first run, and whenever Buy is missing)

1. Claude in Chrome is connected. Ask the tester to run this in a dedicated Chrome profile, such as "UCP testing". Keeping it separate from their own shopping avoids leftover merchant carts and signed-in store accounts.
2. Open one Buy link. **Buy** should appear under Buying options. If only **Visit site** shows, check the account first: ask which Google account is on the UCP allowlist and whether it is the one signed in. If it isn't, have the tester sign in with it, or add `&authuser=<n>` to the link for that account's position (0 is the first account), and record the first result as **Test setup**. If the approved account is signed in and Buy is still missing, the button alone doesn't say why. The offer may not be UCP-enabled. Record the link as **blocked: Buy absent**, with owner **Unresolved**.
3. Reports to Google need the Google Drive connector (`create_file`, `read_file_content`). Without it, deliver the reports in chat.

Claude in Chrome asks the tester to allow each new site the first time. Tell them to expect prompts for google.com, pay.google.com and each merchant store.

## Inputs — ask only for what is missing

| Input | Notes |
|---|---|
| Buy links | The current Google Shopping tab, or pasted `google.com/search?…ibp=oshop…` URLs. Keep any sheet row label beside each link; otherwise number links by input line |
| Selected offer | If Buying options lists more than one merchant, ask which one. Never default to the first |
| Shipping details | Name, address, phone. Confirm which merchant checkouts receive them. Don't write them into any file or report |
| Prior claims (optional) | Sheet notes or a teammate's findings. Collect your own readings first |
| Where results go | Default: chat only. New Drive Doc and Sheet only on explicit approval |

Test quantity 1 only. If Google's review shows another quantity, record the row as **blocked: quantity other than 1** and move on.

## 1. Scan every link before any checkout

For each distinct link (rows sharing a link share one test):

1. `navigate` to the link and wait about 3 seconds.
2. `get_page_text`, then read the **Buying options** block: merchant, price, delivery fee, listing total, and the product title. `find` "Buy button or Visit site button".
3. `read_page` with `filter: interactive` lists the merchant links. Keep the one on the merchant's domain that carries `sku=`; that is the native URL. If none carries `sku=` and the product has options, flag **variant not pinned**.
4. Record `buy-present`, `visit-site-only`, or `no-buy`. Blocked links stay in the report.

The listing total is an estimate for the link's `uuld=` location. It is not a checkout quote.

## 2. Google checkout, read from the screen

Google's order review sits in a pay.google.com frame. Text tools and page scripts can't read it, so read it from screenshots.

1. Click the **Buy** in the selected merchant's row. Wait about 5 seconds.
2. Scroll the dialog to the bottom. Click the small arrow beside **Pay <merchant>** to show the breakdown.
3. `zoom` on the dialog. Record product, item price, quantity, shipping method, subtotal, discount, shipping, estimated tax, and total.
4. Confirm the product and merchant match the scan. If they don't, stop the row as **offer mismatch**.
5. Read again at about 15 and 30 seconds. Use the last settled reading as `initial`.
6. **If shipping is $0:** open the shipping method row and choose the same method again, then read. Switch to another method and read. Switch back and read. Close the dialog, click Buy again, and read. Record each step (`reselect`, `switch`, `switchBack`, `reopen`).
7. **If "We couldn't complete your purchase" appears:** wait 20 seconds and retry once. Keep both attempts.
8. Close the dialog with its **X**.

**Never click** Update card info, Place order, Pay, or anything that changes the payment method. **Never save these screenshots** (`save_to_disk` stays off) and never put them in a report. They show the tester's address, phone, and card ending.

## 3. Native checkout, through the store's own API

Run this only when Google reached order review. Open the native URL from step 1.3, then run the snippets below with `javascript_tool`.

**Cart check.** Run it before adding anything. If the cart isn't empty, stop and ask the tester. Those items may be theirs. Empty it only when they say so.

```js
const c = await fetch('/api/storefront/carts', {credentials:'include'}).then(r => r.json()).catch(e => 'ERR ' + e);
({ origin: location.origin, h1: document.querySelector('h1')?.innerText,
   addButton: !!document.querySelector('#form-action-addToCart'),
   cart: Array.isArray(c) ? c.map(x => x.lineItems.physicalItems.map(i => i.sku + ' x' + i.quantity)).flat() : c })
```

If the result is not a list, the site is not a BigCommerce storefront API. If `addButton` is false, the theme isn't Stencil. In either case, record native as **blocked** and say why.

**Add one item and record what the test added.** Keep the returned `cartId` and `itemIds`; cleanup removes only those.

```js
const before = new Set((await fetch('/api/storefront/carts', {credentials:'include'}).then(r => r.json()))
  .flatMap(c => c.lineItems.physicalItems.map(i => i.id)));
const q = document.querySelector('input[name="qty[]"]'); if (q) q.value = '1';
document.querySelector('#form-action-addToCart').click(); await new Promise(r => setTimeout(r, 5000));
const carts = await fetch('/api/storefront/carts', {credentials:'include'}).then(r => r.json());
const added = carts.flatMap(c => c.lineItems.physicalItems.filter(i => !before.has(i.id)).map(i => ({cartId:c.id, id:i.id, sku:i.sku, qty:i.quantity})));
({ cartId: added[0]?.cartId, itemIds: added.map(i => i.id), added })
```

If `added` is empty, or holds more than one line, stop and report it. Don't quote a cart you can't account for.

**Quote every method.** Replace the `ADDRESS` values with the tester's details and don't repeat them in chat. Set `METHOD` to the method Google preselected; the snippet leaves the cart on that method (or the store's recommended one) for the page check below.

```js
const cart = (await fetch('/api/storefront/carts', {credentials:'include'}).then(r => r.json()))[0];
const METHOD = '';
const ADDRESS = {first_name:'', last_name:'', address1:'', address2:'', city:'', state_or_province_code:'', postal_code:'', country_code:'US', phone:''};
const json = {method:'', credentials:'include', headers:{'Content-Type':'application/json'}};
const lineItems = cart.lineItems.physicalItems.map(i => ({itemId:i.id, quantity:i.quantity}));
const r = await fetch(`/api/storefront/checkouts/${cart.id}/consignments?include=consignments.availableShippingOptions`,
  {...json, method:'POST', body: JSON.stringify([{address: ADDRESS, lineItems}])}).then(r => r.json());
const con = r.consignments[0], opts = con.availableShippingOptions || [], perMethod = {};
for (const o of opts) {
  const u = await fetch(`/api/storefront/checkouts/${cart.id}/consignments/${con.id}`,
    {...json, method:'PUT', body: JSON.stringify({shippingOptionId: o.id})}).then(r => r.json());
  perMethod[o.description] = {shipping: u.shippingCostTotal, tax: u.taxTotal, total: u.grandTotal};
}
const fin = opts.find(o => o.description === METHOD) || opts.find(o => o.isRecommended) || opts[0];
if (fin) await fetch(`/api/storefront/checkouts/${cart.id}/consignments/${con.id}`,
  {...json, method:'PUT', body: JSON.stringify({shippingOptionId: fin.id})});
({ renderedFor: fin?.description, items: cart.lineItems.physicalItems.map(i => ({sku:i.sku, qty:i.quantity, price:i.salePrice})),
   methods: opts.map(o => ({name:o.description, cost:o.cost, recommended:o.isRecommended})), perMethod })
```

Check that `items` holds exactly one line: the scanned SKU, quantity 1.

**Read the store's checkout page.** `navigate` to `<origin>/checkout`, wait about 5 seconds, and `get_page_text`. In the order summary, record subtotal, shipping, tax, and total for `renderedFor`, as `renderedSummary`. Compare them with `perMethod[renderedFor]`. If the summary can't be read, label the native comparison **API-only** in the report. If the method lists differ from Google's, confirm the native list on the page as well ([protocol.md](protocol.md), "Reading the rendered native method list").

**Clean up.** Always run this, even after an error. Put in the `cartId` and `itemIds` recorded when the item was added. It removes only those items and leaves anything else alone.

```js
const CART_ID = '', ITEM_IDS = [];
for (const id of ITEM_IDS)
  await fetch(`/api/storefront/carts/${CART_ID}/items/${id}`, {method:'DELETE', credentials:'include'});
const left = (await fetch('/api/storefront/carts', {credentials:'include'}).then(r => r.json()))
  .flatMap(c => c.lineItems.physicalItems.map(i => ({id:i.id, sku:i.sku})));
({ removed: ITEM_IDS, stillOurs: left.filter(i => ITEM_IDS.includes(i.id)), otherItems: left.filter(i => !ITEM_IDS.includes(i.id)) })
```

`stillOurs` must be empty. If `otherItems` isn't empty, leave those items and tell the tester. If the test's item IDs were never recorded, for example because the add step failed, don't delete anything; report that cleanup needs a person.

## 4. Record, then judge

After each row, write the readings into one results block in chat, before you read any prior claims:

```text
row | merchant | product | Google initial (method, ship, tax, total) | $0 steps | native API (method, ship, tax, total) | native page total or API-only | methods Google / native | flags
```

Then apply [protocol.md](protocol.md) (evidence labels, verdicts, limits) and [owner-routing.md](owner-routing.md), and write the report as SKILL.md's **Deliverable** section describes. Screenshot readings count as **Observed in this run**. Name the method in the limits: "Google totals read from screen."

## 5. Publish to Drive, only when approved

1. Show the tester the Doc text and the Sheet rows first. Confirm the Google account the files will belong to.
2. Doc: `create_file` with `contentMimeType: text/markdown`. Headings, numbered lists, links, bold, and tables convert. Structure: answer first, coverage and limits, one section per material finding with short reproduction steps and both product links, then owners.
3. Sheet: `create_file` with `contentMimeType: text/csv`. Put money as `$11.90`, because a plain `11.90` becomes `11.9`. Start any cell that begins with `=`, `+`, `-`, or `@` with an apostrophe. Long offer IDs stay as text.
4. Read both back with `read_file_content`. Open the Doc `viewUrl` in Chrome and look at it. Report the two links.
5. The connector only creates new files. For an existing shared sheet, give sheet-ready notes for a person to paste. Never overwrite a note.

No personal details go into either file: no address, phone, email, card, or screenshots.

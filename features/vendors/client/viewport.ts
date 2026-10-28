/** Space covered by the two sticky navigation rows on a public profile. */
export function getVendorNavigationHeight() {
  return (document.querySelector('.wm-site-header')?.getBoundingClientRect().height ?? 76) +
    (document.querySelector('.wm-vendor-tabs-shell')?.getBoundingClientRect().height ?? 54);
}

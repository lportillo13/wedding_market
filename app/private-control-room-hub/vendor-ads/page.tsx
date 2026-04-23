import VendorAdsPanel from "@/components/admin/VendorAdsPanel";
import { loadVendorAdsConfig, loadVendorAdsVendorOptions } from "@/lib/content/vendorAdsServer";

export default async function VendorAdsPage() {
  const [config, vendors] = await Promise.all([
    loadVendorAdsConfig(),
    loadVendorAdsVendorOptions(),
  ]);

  return (
    <div className="space-y-12">
      <VendorAdsPanel initialConfig={config} vendors={vendors} />
    </div>
  );
}

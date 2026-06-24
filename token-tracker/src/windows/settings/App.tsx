import { useState, useEffect } from "react";
import { Sidebar } from "../../components/settings/Sidebar";
import type { Section } from "../../components/settings/Sidebar";
import { ProvidersPanel } from "../../components/settings/ProvidersPanel";
import { SubscriptionsPanel } from "../../components/settings/SubscriptionsPanel";
import { DisplayPanel } from "../../components/settings/DisplayPanel";
import { QuickLinksPanel } from "../../components/settings/QuickLinksPanel";
import { AboutPanel } from "../../components/settings/AboutPanel";
import { useSettingsStore } from "../../store/settings";

export function App() {
  const [section, setSection] = useState<Section>("providers");
  const { load, licenseInfo } = useSettingsStore();

  useEffect(() => { load(); }, []);

  const isPro = licenseInfo?.tier === "pro";

  const renderPanel = () => {
    switch (section) {
      case "providers": return <ProvidersPanel />;
      case "subscriptions": return <SubscriptionsPanel />;
      case "display": return <DisplayPanel />;
      case "quick_links": return <QuickLinksPanel />;
      case "about": return <AboutPanel />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#1a1a1c", color: "#e9e9ec", overflow: "hidden" }}>
      <Sidebar active={section} onChange={setSection} isPro={isPro} />
      <main style={{ flex: 1, overflow: "hidden" }}>
        {renderPanel()}
      </main>
    </div>
  );
}
